import fs from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { type CorePaths, EntityCache, resolvePaths } from '../dist/index.js'
import { writeJsonAtomic } from '../dist/util.js'
import { makeTempDir, rmDir, sleep } from './support/tmp.js'

let home: string
let paths: CorePaths
let uid: string | undefined
let cache: EntityCache

function freshCache(): EntityCache {
  return new EntityCache(paths, { ttlMs: 60_000, uid: () => uid })
}

beforeAll(() => {
  home = makeTempDir()
  paths = resolvePaths(home)
  uid = undefined
  cache = freshCache()
})

afterAll(() => rmDir(home))

describe('EntityCache：账号 scope 落盘', () => {
  it('public kind 落共享位；带态 kind 有激活号时落 _acct/<uid>', async () => {
    uid = '111'
    await cache.set('sug', 'q1', { hit: 1 })
    await cache.set('search', 'q1', { hit: 1 })
    await cache.set('me', 'k', { who: 'A' })
    // 只回关键词/枚举的路子（sug/categories…）跨号共享
    expect(fs.existsSync(paths.entityFile('sug', 'q1'))).toBe(true)
    // 回实体的路子（search）响应里嵌了 `state.is_collected`，按观看者隔离
    expect(fs.existsSync(paths.entityFile('me', 'k', '111'))).toBe(true)
    expect(fs.existsSync(path.join(home, 'cache', 'entities', '_acct', '111', 'search'))).toBe(true)
    expect(fs.existsSync(path.join(home, 'cache', 'entities', 'search'))).toBe(false)
  })

  it('匿名（uid undefined）时带态 kind 落共享位', async () => {
    uid = undefined
    const anon = freshCache()
    await anon.set('me', 'shared-fallback', { who: 'anon' })
    expect(fs.existsSync(paths.entityFile('me', 'shared-fallback'))).toBe(true)
  })

  it('ttl 0（none 档）既不落盘也不复用（内存里即刻过期）', async () => {
    const c = freshCache()
    await c.set('search', 'no-store', { v: 1 }, 0)
    expect(c.peek('search', 'no-store')).toBeUndefined()
    expect(fs.existsSync(paths.entityFile('search', 'no-store'))).toBe(false)
  })

  it('两号内存互不可见：切 uid 后 get 失效，盘上各归各层', async () => {
    uid = '111'
    await cache.set('me', 'k', { who: 'A' })
    uid = '222'
    expect(cache.get('me', 'k')).toBeUndefined()
    expect(await cache.load('me', 'k')).toBeUndefined()
    await cache.set('me', 'k', { who: 'B' })
    uid = '111'
    expect((await cache.load<{ who: string }>('me', 'k'))?.who).toBe('A')
  })
})

describe('EntityCache：TTL / fetch / 失效 / 清理', () => {
  it('过期即未命中（get 与 load 都不回）', async () => {
    const c = freshCache()
    await c.set('track', 't-exp', { n: 1 }, 40)
    expect(c.peek('track', 't-exp')).toEqual({ n: 1 })
    await sleep(70)
    expect(c.peek('track', 't-exp')).toBeUndefined()
    expect(await c.load('track', 't-exp')).toBeUndefined()
  })

  it('fetch：并发同 key 只发一次 loader；第二次命中缓存零 loader', async () => {
    const c = freshCache()
    let loads = 0
    const loader = async () => {
      loads++
      await sleep(20)
      return { v: loads }
    }
    const [a, b] = await Promise.all([
      c.fetch('track', 't-dedup', loader, { ttlMs: 60_000 }),
      c.fetch('track', 't-dedup', loader, { ttlMs: 60_000 }),
    ])
    expect(loads).toBe(1)
    expect(a.value).toEqual(b.value)
    const third = await c.fetch('track', 't-dedup', loader, { ttlMs: 60_000 })
    expect(third.cached).toBe(true)
    expect(loads).toBe(1)
  })

  it('fetch：ttlMs 0 每次重新走 loader（实时数据不复用）', async () => {
    const c = freshCache()
    let loads = 0
    const loader = async () => ({ n: ++loads })
    await c.fetch('search', 'q-live', loader, { ttlMs: 0 })
    const second = await c.fetch('search', 'q-live', loader, { ttlMs: 0 })
    expect(loads).toBe(2)
    expect(second.cached).toBe(false)
  })

  it('invalidate(id) 删一条；invalidate(kind) 只删当前 scope 的目录', async () => {
    const c = freshCache()
    uid = '111'
    await c.set('liked-tracks', 'a', { one: 1 })
    await c.set('liked-tracks', 'b', { two: 1 })
    uid = '222'
    await c.set('liked-tracks', 'a', { other: true })
    uid = '111'
    await c.invalidate('liked-tracks', 'a')
    expect(fs.existsSync(paths.entityFile('liked-tracks', 'a', '111'))).toBe(false)
    expect(fs.existsSync(paths.entityFile('liked-tracks', 'b', '111'))).toBe(true)
    await c.invalidate('liked-tracks')
    expect(fs.existsSync(path.join(home, 'cache', 'entities', '_acct', '111', 'liked-tracks'))).toBe(false)
    expect(fs.existsSync(paths.entityFile('liked-tracks', 'a', '222'))).toBe(true)
    uid = undefined
  })

  it('clearMemory 只作废内存；invalidateAccount 删整个 _acct/<uid> 子树', async () => {
    const c = freshCache()
    uid = '333'
    await c.set('me', 'k', { who: 'C' })
    c.clearMemory()
    expect(c.peek('me', 'k')).toBeUndefined()
    expect(await c.load('me', 'k')).toEqual({ who: 'C' })
    c.clearMemory()
    await c.invalidateAccount('333')
    expect(fs.existsSync(path.join(home, 'cache', 'entities', '_acct', '333'))).toBe(false)
    uid = undefined
  })

  it('clearShared 只清共享位，账号层原样', async () => {
    const c = freshCache()
    uid = '111'
    await c.set('me', 'shared-fallback', { s: 1 })
    uid = undefined
    await c.set('me', 'shared-fallback', { s: 0 })
    expect(fs.existsSync(paths.entityFile('me', 'shared-fallback'))).toBe(true)
    await c.clearShared('me')
    expect(fs.existsSync(paths.entityFile('me', 'shared-fallback'))).toBe(false)
    expect(fs.existsSync(paths.entityFile('me', 'shared-fallback', '111'))).toBe(true)
  })

  it('stats 汇总共享位与账号目录；prune 清掉盘上的过期条目', async () => {
    const c = freshCache()
    uid = '111'
    await c.set('me', 'live', { keep: 1 })
    // ttl≤0 不落盘，「过期文件」直接手写出来（set 的负 ttl 只会在内存过期）
    const deadFile = paths.entityFile('me', 'dead', '111')
    fs.mkdirSync(path.dirname(deadFile), { recursive: true })
    fs.writeFileSync(
      deadFile,
      JSON.stringify({ v: 1, kind: 'me', id: 'dead', at: Date.now() - 10_000, expires: Date.now() - 5000, data: {} }),
    )
    const stats = await c.stats()
    expect(stats.entries).toBeGreaterThanOrEqual(2)
    const pruned = await c.prune()
    expect(pruned.removed).toBeGreaterThanOrEqual(1)
    expect(await c.load('me', 'dead')).toBeUndefined()
    // 'live' 在 _acct/111 层：换一个新实例（内存已 prune 作废）仍能从盘上读回
    expect(await freshCache().load('me', 'live')).toEqual({ keep: 1 })
    uid = undefined
  })

  it('落盘失败不算调用失败（只读盘/盘满/权限不对时缓存是尽力而为）', async () => {
    // 把数据根指到「一个文件」上：ensureDir/写文件必然失败（ENOTDIR），但 fetch 该照常回 loader 的值
    // （`paths.entityFile()` 是 resolvePaths 里的闭包，改 `entityDir` 字段没用，得换整份 paths）
    const broken = path.join(home, 'not-a-dir')
    fs.writeFileSync(broken, 'x')
    const brokenPaths: CorePaths = resolvePaths(broken)
    const warned: string[] = []
    const cacheBroken = new EntityCache(brokenPaths, { ttlMs: 60_000, logger: (line) => warned.push(line) })
    const first = await cacheBroken.fetch('me', 'k', async () => ({ who: 'A' }), { ttlMs: 60_000 })
    expect(first.value).toEqual({ who: 'A' })
    expect(first.cached).toBe(false)
    // 内存里照样命中（这次不落盘也不影响复用）
    const second = await cacheBroken.fetch('me', 'k', async () => ({ who: 'B' }), { ttlMs: 60_000 })
    expect(second.value).toEqual({ who: 'A' })
    expect(second.cached).toBe(true)
    // 只在第一次提示一行，别每首歌刷屏
    expect(warned).toHaveLength(1)
    expect(warned[0]).toContain('缓存写盘失败')
  })

  it('has 只读盘不发请求；clear 全清（含全部账号目录）', async () => {
    const c = freshCache()
    uid = '444'
    await c.set('me', 'h', { x: 1 })
    expect(await c.has('me', 'h')).toBe(true)
    uid = undefined
    const cleared = await c.clear()
    expect(cleared.removed).toBeGreaterThanOrEqual(1)
    expect(fs.existsSync(paths.entityDir)).toBe(false)
  })
})

describe('writeJsonAtomic：同进程并发写同一个文件', () => {
  it('12 路并发全部成功、留最后一次的完整 JSON、无 .tmp 残留', async () => {
    const dir = makeTempDir('qishui-atomic-')
    try {
      const file = path.join(dir, 'queues.json')
      const pad = (n: number) => 'x'.repeat(120_000 * n)
      const results = await Promise.allSettled(
        Array.from({ length: 12 }, (_, i) => writeJsonAtomic(file, { i, payload: pad((i % 3) + 1) })),
      )
      expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(12)
      expect(JSON.parse(fs.readFileSync(file, 'utf8'))).toMatchObject({ i: 11 })
      expect(fs.readdirSync(dir).filter((f) => f.includes('.tmp'))).toEqual([])
    } finally {
      rmDir(dir)
    }
  })

  it('一次写失败不卡住后面排在同一文件上的写', async () => {
    const dir = makeTempDir('qishui-atomic-err-')
    try {
      const file = path.join(dir, 'a.json')
      await writeJsonAtomic(file, { first: true })
      // dirname 是个已存在的普通文件 → ensureDir 必失败
      const bogus = path.join(file, 'nested.json')
      await expect(writeJsonAtomic(bogus, { x: 1 })).rejects.toThrow()
      await writeJsonAtomic(file, { second: true })
      expect(JSON.parse(fs.readFileSync(file, 'utf8'))).toMatchObject({ second: true })
    } finally {
      rmDir(dir)
    }
  })
})
