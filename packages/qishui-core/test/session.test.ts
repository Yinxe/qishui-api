/**
 * 多账号会话层（全程零网络断言：注入假设备 + mock fetch，只验本地行为）。
 * 移植自旧冒烟台 multiAccountChecks + account.me() 身份记忆回归。
 */
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { createQishui, NotLoggedInError, type QishuiCore } from '../dist/index.js'
import { createMockUpstream, MOCK_DEVICE } from './support/mockUpstream.js'
import { makeTempDir, rmDir } from './support/tmp.js'

function writeLegacySession(home: string): void {
  fs.mkdirSync(home, { recursive: true })
  fs.writeFileSync(
    path.join(home, 'session.json'),
    JSON.stringify({
      v: 1,
      device: MOCK_DEVICE,
      cookies: { sessionid: 'COOKIE_A' },
      uid: '111',
      nickname: '小号A',
      savedAt: Date.now() - 86_400_000,
    }),
  )
}

async function makeCore(home: string, opts: { account?: string } = {}): Promise<QishuiCore> {
  const mock = createMockUpstream()
  return await createQishui({ dataDir: home, device: MOCK_DEVICE, fetchImpl: mock.fetchImpl, ...opts })
}

describe('session：旧 session.json 迁移', () => {
  it('迁出 accounts/<uid>.json + device.json，原件改名 .bak，且全程零网络', async () => {
    const home = makeTempDir('qishui-migrate-')
    try {
      writeLegacySession(home)
      const mock = createMockUpstream()
      const core = await createQishui({ dataDir: home, device: MOCK_DEVICE, fetchImpl: mock.fetchImpl })
      expect(fs.existsSync(path.join(home, 'device.json'))).toBe(true)
      expect(fs.existsSync(path.join(home, 'session.json.bak'))).toBe(true)
      expect(fs.existsSync(path.join(home, 'accounts', '111.json'))).toBe(true)
      const snapshot = core.snapshot()
      expect(snapshot.loggedIn).toBe(true)
      expect(snapshot.uid).toBe('111')
      expect(snapshot.activeUid).toBe('111')
      expect(snapshot.accountCount).toBe(1)
      expect(mock.count()).toBe(0)
      core.dispose()
    } finally {
      rmDir(home)
    }
  })

  it('uid 未知的旧会话 → 先进 _anon 壳，me() 认出身份后归位 accounts/<uid>.json', async () => {
    const home = makeTempDir('qishui-anon-')
    try {
      fs.mkdirSync(home, { recursive: true })
      fs.writeFileSync(
        path.join(home, 'session.json'),
        JSON.stringify({ v: 1, device: MOCK_DEVICE, cookies: { sessionid: 'COOKIE_ANON' } }),
      )
      const mock = createMockUpstream()
      const core = await createQishui({ dataDir: home, device: MOCK_DEVICE, fetchImpl: mock.fetchImpl })
      expect(fs.existsSync(path.join(home, 'accounts', '_anon.json'))).toBe(true)
      expect(core.uid).toBeUndefined()

      const me = await core.account.me()
      expect(me.user.id).toBe('3617835472921684')
      expect(core.uid).toBe(me.user.id)
      expect(fs.existsSync(path.join(home, 'accounts', `${me.user.id}.json`))).toBe(true)
      core.dispose()
    } finally {
      rmDir(home)
    }
  })
})

describe('session：多账号并存 + 隔离 + 切号编排', () => {
  let core: QishuiCore | undefined
  let home: string
  let mock: ReturnType<typeof createMockUpstream>

  async function boot(): Promise<void> {
    home = makeTempDir('qishui-multi-')
    writeLegacySession(home)
    mock = createMockUpstream()
    core = await createQishui({ dataDir: home, device: MOCK_DEVICE, fetchImpl: mock.fetchImpl })
    // 造出 B 号：灌 cookie → 记身份 → 落 accounts/222.json（登录入库的本地等价路径）
    await core!.session.ready()
    core!.api.cookies.absorb(['sessionid=COOKIE_B', 'extra_b=1'])
    await core!.session.rememberIdentity('222', '小号B')
    await core!.session.save()
  }

  function teardown(): void {
    core?.dispose()
    core = undefined
    rmDir(home)
  }

  it('B 号入库后两号并存，新号即激活', async () => {
    await boot()
    try {
      const list = core!.accounts()
      expect(list.length).toBe(2)
      expect(fs.existsSync(path.join(home, 'accounts', '222.json'))).toBe(true)
      expect(list.find((a) => a.uid === '222')?.active).toBe(true)
      expect(list.find((a) => a.uid === '111')?.active).toBe(false)
    } finally {
      teardown()
    }
  })

  it('带态/私有缓存落 _acct/<uid>，公共 kind 落共享位', async () => {
    await boot()
    try {
      await core!.cache.set('me', 'k', { who: 'B' })
      await core!.cache.set('search', 'q', { who: 'B' })
      expect(fs.existsSync(core!.paths.entityFile('me', 'k', '222'))).toBe(true)
      expect(fs.existsSync(core!.paths.entityFile('search', 'q'))).toBe(true)
      expect(fs.existsSync(path.join(home, 'cache', 'entities', '_acct', '222', 'search'))).toBe(false)
    } finally {
      teardown()
    }
  })

  it('useAccount(A)：内存态作废 + 私有缓存跨号不可见 + 共享位照常可见', async () => {
    await boot()
    try {
      // B 激活时先埋两层缓存
      await core!.cache.set('me', 'k', { who: 'B' })
      await core!.cache.set('search', 'q', { who: 'B' })
      await core!.useAccount('111')
      expect(core!.cache.get('me', 'k')).toBeUndefined()
      expect(await core!.cache.load('me', 'k')).toBeUndefined()
      expect((await core!.cache.load<{ who: string }>('search', 'q'))?.who).toBe('B')
    } finally {
      teardown()
    }
  })

  it('切号编排：cookie 先清后灌无残留 + 历史上换目录 + config.activeUid 写回', async () => {
    await boot()
    try {
      await core!.useAccount('111')
      const jar = core!.api.cookies.toObject()
      expect(jar.sessionid).toBe('COOKIE_A')
      expect('extra_b' in jar).toBe(false)
      expect(core!.history.scopeFile).toBe(path.join(home, 'journal', '111', 'plays.jsonl'))
      const config = JSON.parse(fs.readFileSync(path.join(home, 'config.json'), 'utf8'))
      expect(config.activeUid).toBe('111')
      // 全程零网络（me() 都没调用过）
      expect(mock.count()).toBe(0)
    } finally {
      teardown()
    }
  })

  it('useAccount 也接受昵称', async () => {
    await boot()
    try {
      await core!.useAccount('小号A')
      expect(core!.activeUid).toBe('111')
    } finally {
      teardown()
    }
  })

  it('昵称撞号 → 报歧义并列出 uid；查无此号 → 报错列出已入库账号', async () => {
    await boot()
    try {
      core!.api.cookies.absorb(['sessionid=COOKIE_C'])
      await core!.session.rememberIdentity('333', '小号B')
      await core!.session.save()
      await expect(core!.useAccount('小号B')).rejects.toThrow(/多个账号/)
      await expect(core!.useAccount('888')).rejects.toThrow(/没有账号 888/)
    } finally {
      teardown()
    }
  })

  it('logout（不 purge）只清当前号 cookie，账号壳保留可切回', async () => {
    await boot()
    try {
      await core!.useAccount('111')
      await core!.logout()
      expect(core!.snapshot().loggedIn).toBe(false)
      const shell = JSON.parse(fs.readFileSync(path.join(home, 'accounts', '111.json'), 'utf8'))
      expect(Object.keys(shell.cookies)).toHaveLength(0)
      expect(shell.uid).toBe('111')
      // 壳还在索引里，但没 cookie 的号切不回去
      expect(core!.accounts().some((a) => a.uid === '111')).toBe(true)
      await expect(core!.useAccount('111')).rejects.toThrow(/没有留存会话/)
    } finally {
      teardown()
    }
  })

  it('logout --purge：只删当前号（A），B 的会话与 _acct 缓存原样', async () => {
    await boot()
    try {
      await core!.cache.set('me', 'k', { who: 'B' })
      await core!.useAccount('111')
      await core!.cache.set('me', 'k', { who: 'A' })
      await core!.logout({ purge: true })
      expect(fs.existsSync(path.join(home, 'accounts', '111.json'))).toBe(false)
      expect(fs.existsSync(path.join(home, 'accounts', '222.json'))).toBe(true)
      expect(fs.existsSync(core!.paths.entityFile('me', 'k', '222'))).toBe(true)
      expect(fs.existsSync(core!.paths.entityFile('me', 'k', '111'))).toBe(false)
      expect(core!.accounts()).toHaveLength(1)
      expect(core!.snapshot().loggedIn).toBe(false)
      expect(mock.count()).toBe(0)
    } finally {
      teardown()
    }
  })
})

describe('session：--as 式临时实例', () => {
  it('本进程用 B，config.activeUid 默认值不动', async () => {
    const home = makeTempDir('qishui-as-')
    try {
      writeLegacySession(home)
      const seeded = await makeCore(home)
      await seeded.session.ready()
      seeded.api.cookies.absorb(['sessionid=COOKIE_B'])
      await seeded.session.rememberIdentity('222', '小号B')
      await seeded.session.save()
      await seeded.useAccount('111')
      seeded.dispose()

      const temp = await makeCore(home, { account: '222' })
      expect(temp.session.activeUid).toBe('222')
      temp.dispose()
      const config = JSON.parse(fs.readFileSync(path.join(home, 'config.json'), 'utf8'))
      expect(config.activeUid).toBe('111')
    } finally {
      rmDir(home)
    }
  })

  it('--as 指错号：构造期直接抛错，绝不静默回落激活号', async () => {
    const home = makeTempDir('qishui-as-bad-')
    try {
      writeLegacySession(home)
      const seeded = await makeCore(home)
      seeded.dispose()
      // 没入库的 uid / 昵称都对不上 → 报「没有账号」
      await expect(makeCore(home, { account: '没这个号' })).rejects.toThrow(/没有账号/)
      // 登出后的空壳：号还在索引里，但没有 cookie → 报「没有留存会话」
      const shell = await makeCore(home)
      await shell.logout()
      shell.dispose()
      await expect(makeCore(home, { account: '111' })).rejects.toThrow(/没有留存会话/)
    } finally {
      rmDir(home)
    }
  })

  it('未登录账号直接建实例：匿名壳可用，assertLoggedIn 抛 NotLoggedInError', async () => {
    const home = makeTempDir('qishui-anonboot-')
    try {
      const mock = createMockUpstream({ myInfo: null })
      const core = await createQishui({ dataDir: home, device: MOCK_DEVICE, fetchImpl: mock.fetchImpl })
      expect(core.snapshot().loggedIn).toBe(false)
      expect(core.snapshot().accountCount).toBe(0)
      expect(() => core.session.assertLoggedIn()).toThrow(NotLoggedInError)
      core.dispose()
    } finally {
      rmDir(home)
    }
  })
})
