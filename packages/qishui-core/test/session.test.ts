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
      await core!.cache.set('sug', 'w', { who: 'B' })
      expect(fs.existsSync(core!.paths.entityFile('me', 'k', '222'))).toBe(true)
      // search 的响应里嵌了 `state.is_collected`，按观看者隔离（见 cache/policy.ts 的判据）
      expect(fs.existsSync(core!.paths.entityFile('search', 'q', '222'))).toBe(true)
      expect(fs.existsSync(path.join(home, 'cache', 'entities', 'search'))).toBe(false)
      // 只回关键词的 sug 照旧共享
      expect(fs.existsSync(core!.paths.entityFile('sug', 'w'))).toBe(true)
    } finally {
      teardown()
    }
  })

  it('useAccount(A)：内存态作废 + 私有缓存跨号不可见 + 共享位照常可见', async () => {
    await boot()
    try {
      // B 激活时先埋三层缓存：账号私有 / 带我态 / 纯公共
      await core!.cache.set('me', 'k', { who: 'B' })
      await core!.cache.set('search', 'q', { who: 'B' })
      await core!.cache.set('sug', 'w', { who: 'B' })
      await core!.useAccount('111')
      expect(core!.cache.get('me', 'k')).toBeUndefined()
      expect(await core!.cache.load('me', 'k')).toBeUndefined()
      // 带我态（search）同样跨号不可见
      expect(await core!.cache.load('search', 'q')).toBeUndefined()
      // 纯公共（sug）照常可见
      expect((await core!.cache.load<{ who: string }>('sug', 'w'))?.who).toBe('B')
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

describe('session：登录但不切号（CLI 的 `--keep-active`）', () => {
  const NEW_UID = '3617835472921684'
  const sessionidOf = (home: string, uid: string): string | undefined =>
    JSON.parse(fs.readFileSync(path.join(home, 'accounts', `${uid}.json`), 'utf8')).cookies?.sessionid

  it('入库新号、人还留在原号：身份/jar/历史目录/书架都不动，两份账号文件也不许互相写脏', async () => {
    const home = makeTempDir('qishui-keepactive-')
    writeLegacySession(home)
    const mock = createMockUpstream({ qrStatuses: ['confirmed'] })
    const core = await createQishui({
      dataDir: home,
      device: MOCK_DEVICE,
      fetchImpl: mock.fetchImpl,
      player: { tickMs: 10, skipOnError: false },
    })
    const changed: (string | undefined)[] = []
    core.events.on('account-changed', ({ uid }) => changed.push(uid))
    try {
      await core.queues.open({ kind: 'temporary', title: '搜索', items: [{ id: 'a', name: '曲目 a', artists: [] }] })
      expect(core.history.scopeFile).toContain(path.join('journal', '111'))

      const login = await core.login({ intervalMs: 10, timeoutMs: 5_000, keepActive: true })
      expect(await login.wait(10, 5_000)).toBe('confirmed')

      // 「不切号」= 身份、jar、播放历史目录、激活号、书架全部原样
      expect(core.uid).toBe('111')
      expect(core.snapshot().nickname).toBe('小号A')
      expect(core.accounts().find((a) => a.active)?.uid).toBe('111')
      expect(core.api.cookies.toObject().sessionid).toBe('COOKIE_A')
      expect(core.history.scopeFile).toContain(path.join('journal', '111'))
      expect(core.queues.list().map((q) => q.id)).toContain('temporary')
      // 没真的换号就不发「换号了」（上层据此清书架、换 scope）
      expect(changed).toEqual([])
      // 新号确实入了库（不切号 ≠ 不入号），而且没被当成「刚用过」
      expect(fs.existsSync(path.join(home, 'accounts', `${NEW_UID}.json`))).toBe(true)
      expect(core.accounts().find((a) => a.uid === NEW_UID)?.lastUsedAt).toBeUndefined()

      // 回写是按 `current.uid` 找文件的：`current` 若还留着新号身份、jar 里却是 A 的 cookie，
      // 这一步就把新号那份写成 A 的凭据 —— 切过去才发现「这张号是别人的」（反向同理）
      await core.session.save()
      expect(sessionidOf(home, '111')).toBe('COOKIE_A')
      expect(sessionidOf(home, NEW_UID)).toBe('MOCK_SESSIONID')
    } finally {
      core.dispose()
      rmDir(home)
    }
  })

  it('没有可保持的号（此前是匿名）：`keepActive` 就按普通登录走，新号即激活', async () => {
    const home = makeTempDir('qishui-keepactive-anon-')
    const mock = createMockUpstream({ qrStatuses: ['confirmed'] })
    const core = await createQishui({ dataDir: home, device: MOCK_DEVICE, fetchImpl: mock.fetchImpl })
    const changed: (string | undefined)[] = []
    core.events.on('account-changed', ({ uid }) => changed.push(uid))
    try {
      const login = await core.login({ intervalMs: 10, timeoutMs: 5_000, keepActive: true })
      expect(await login.wait(10, 5_000)).toBe('confirmed')
      expect(core.uid).toBe(NEW_UID)
      expect(core.snapshot().activeUid).toBe(NEW_UID)
      expect(changed).toEqual([NEW_UID])
    } finally {
      core.dispose()
      rmDir(home)
    }
  })
})

describe('session：扫码登录 confirmed 必须入库（登录态刷新的根）', () => {
  async function boot(
    script: string[],
    qrPng?: string,
  ): Promise<{ home: string; core: QishuiCore; checkCalls: () => number }> {
    const home = makeTempDir('qishui-login-')
    const mock = createMockUpstream({ qrStatuses: script, qrPng })
    const core = await createQishui({ dataDir: home, device: MOCK_DEVICE, fetchImpl: mock.fetchImpl })
    return {
      home,
      core,
      checkCalls: () => mock.calls.filter((c) => c.url.includes('check_qrconnect')).length,
    }
  }

  it('status() 观测到 confirmed 就完成入库+激活（上层只轮询 status 的那条路）', async () => {
    const { home, core } = await boot(['waiting', 'scanned', 'confirmed'])
    const uids: (string | undefined)[] = []
    core.events.on('account-changed', ({ uid }) => uids.push(uid))
    try {
      const login = await core.login({ intervalMs: 10, timeoutMs: 5_000 })
      expect(await login.status()).toBe('waiting')
      expect(await login.status()).toBe('scanned')
      expect(core.loggedIn).toBe(false)

      expect(await login.status()).toBe('confirmed')
      const snap = core.snapshot()
      expect(snap.loggedIn).toBe(true)
      expect(snap.nickname).toBe('测试小号')
      expect(snap.activeUid).toBe('3617835472921684')
      expect(fs.existsSync(path.join(home, 'accounts', '3617835472921684.json'))).toBe(true)
      expect(core.accounts().map((a) => a.active)).toEqual([true])
      expect(uids).toEqual(['3617835472921684'])
    } finally {
      core.dispose()
      rmDir(home)
    }
  })

  it('确认后上游改口 expired：仍然认定已登录，且入库只发生一次', async () => {
    const { home, core, checkCalls } = await boot(['waiting', 'confirmed', 'expired'])
    const uids: (string | undefined)[] = []
    core.events.on('account-changed', ({ uid }) => uids.push(uid))
    try {
      const login = await core.login({ intervalMs: 10, timeoutMs: 5_000 })
      expect(await login.status()).toBe('waiting')
      expect(await login.status()).toBe('confirmed')
      const probed = checkCalls()

      // 已经 confirmed 过：不再问上游（token 后来被判 expired 也否定不了成立的登录）
      expect(await login.status()).toBe('confirmed')
      expect(checkCalls()).toBe(probed)
      expect(await login.wait(10, 500)).toBe('confirmed')
      expect(core.snapshot().loggedIn).toBe(true)
      expect(core.accounts()).toHaveLength(1)
      expect(uids).toEqual(['3617835472921684'])
    } finally {
      core.dispose()
      rmDir(home)
    }
  })

  it('没人看过 status 时，wait() 自己轮询到 confirmed 也照常入库（CLI 路径）', async () => {
    const { home, core } = await boot(['waiting', 'confirmed'])
    try {
      const login = await core.login({ intervalMs: 10, timeoutMs: 5_000 })
      expect(await login.wait(10, 5_000)).toBe('confirmed')
      expect(core.loggedIn).toBe(true)
      expect(core.snapshot().nickname).toBe('测试小号')
    } finally {
      core.dispose()
      rmDir(home)
    }
  })

  it('GetMyInfo 拿不到身份：cookie 仍入库（loggedIn=true），登录态不至于显示成未登录', async () => {
    const home = makeTempDir('qishui-login-noid-')
    const mock = createMockUpstream({ qrStatuses: ['confirmed'], myInfo: null })
    const core = await createQishui({ dataDir: home, device: MOCK_DEVICE, fetchImpl: mock.fetchImpl })
    try {
      const login = await core.login({ intervalMs: 10, timeoutMs: 5_000 })
      expect(await login.status()).toBe('confirmed')
      expect(core.loggedIn).toBe(true)
      expect(core.snapshot().uid).toBeUndefined()
      // 身份后来由 me()/rememberIdentity 补全，不再依赖登录那一次
      const me = await core.account.me()
      expect(core.session.rememberIdentity).toBeTypeOf('function')
      expect(me.user.id).toBe('')
      expect(fs.readFileSync(path.join(home, 'accounts', '_anon.json'), 'utf8')).toContain('MOCK_SESSIONID')
    } finally {
      core.dispose()
      rmDir(home)
    }
  })

  it('已确认但入库失败：不谎报成已登录，挡路的东西清掉后下一次轮询自己补上', async () => {
    const { home, core, checkCalls } = await boot(['waiting', 'confirmed'])
    const accounts = path.join(home, 'accounts')
    fs.writeFileSync(accounts, '') // accounts 被一个普通文件占了 → 写账号文件必炸（只读盘/权限出错的替身）
    try {
      const login = await core.login({ intervalMs: 10, timeoutMs: 5_000 })
      expect(await login.status()).toBe('waiting')
      await expect(login.status()).rejects.toThrow()
      // 盘上没落地就不算登录：不留「界面显示已登录、账号文件一个没有」这种重启就蒸发又不自愈的形态
      expect(core.loggedIn).toBe(false)
      expect(core.snapshot().activeUid).toBeUndefined()
      const probed = checkCalls()

      fs.rmSync(accounts)
      expect(await login.status()).toBe('confirmed') // 重试把入库补上，且不回头再问上游
      expect(checkCalls()).toBe(probed)
      expect(core.loggedIn).toBe(true)
      expect(fs.existsSync(path.join(accounts, '3617835472921684.json'))).toBe(true)
      expect(core.accounts().map((a) => a.uid)).toEqual(['3617835472921684'])
    } finally {
      if (fs.existsSync(accounts) && fs.statSync(accounts).isFile()) fs.rmSync(accounts)
      core.dispose()
      rmDir(home)
    }
  })

  it('上游给了官方二维码 PNG：落一份临时文件并把路径交回上层（终端识别慢时的备用）', async () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]).toString('base64')
    const { home, core } = await boot(['confirmed'], `data:image/png;base64,${png}`)
    let image: string | undefined
    try {
      const login = await core.login({
        intervalMs: 10,
        timeoutMs: 5_000,
        onQr: (qr) => {
          image = qr.qrImage
        },
      })
      // onQr 与 login 返回值给的是同一个路径：上层不管是哪条出路都能显示
      expect(login.qrImage).toBeTypeOf('string')
      expect(image).toBe(login.qrImage)
      expect(
        fs
          .readFileSync(login.qrImage as string)
          .subarray(0, 8)
          .toString('hex'),
      ).toBe('89504e470d0a1a0a')
      // 码里编着登录 token，临时目录又是共享的 —— 只给自己读
      expect(fs.statSync(login.qrImage as string).mode & 0o777).toBe(0o600)
    } finally {
      if (image) fs.rmSync(image, { force: true })
      core.dispose()
      rmDir(home)
    }
  })

  it('上游没给二维码图片：qrImage 就是 undefined（不硬编一张、也不报错）', async () => {
    const { home, core } = await boot(['confirmed'])
    try {
      const login = await core.login({ intervalMs: 10, timeoutMs: 5_000 })
      expect(login.qrPng).toBeUndefined()
      expect(login.qrImage).toBeUndefined()
      expect(await login.status()).toBe('confirmed')
      expect(core.loggedIn).toBe(true)
    } finally {
      core.dispose()
      rmDir(home)
    }
  })
})
