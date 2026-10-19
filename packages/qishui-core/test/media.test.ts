/**
 * 媒体缓存离线单测：h5 取址（回落分享页 SSR）→ 落盘三件套、断点续传、peek 零网络、verify/prune。
 * mock 音频 2048B（支持 Range 206），可播/不可播、h5 可用/拒答都可切。
 */
import fs from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { CONFIG_DEFAULTS, createQishui, MediaUnavailableError, type QishuiCore } from '../dist/index.js'
import { createMockUpstream, MOCK_DEVICE } from './support/mockUpstream.js'
import { makeTempDir, rmDir, sleep } from './support/tmp.js'

const TRACK = '7068138081588611073'

let home: string
let mock: ReturnType<typeof createMockUpstream>
let logLines: string[]
let core: QishuiCore

beforeEach(async () => {
  home = makeTempDir('qishui-media-')
  mock = createMockUpstream()
  logLines = []
  core = await createQishui({
    dataDir: home,
    device: MOCK_DEVICE,
    fetchImpl: mock.fetchImpl,
    logger: (line) => logLines.push(line),
  })
})

function audioPath(id = TRACK): string {
  return path.join(core.media.dirOf(id), 'audio.m4a')
}

/** 改写落盘 meta 的淘汰依据（`plays`/`accessedAt`），造出「谁最该走」的场景 */
async function patchMeta(owner: QishuiCore, id: string, patch: { plays?: number; accessedAt?: number }): Promise<void> {
  const file = path.join(owner.media.dirOf(id), 'meta.json')
  const meta = JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, unknown>
  Object.assign(meta, patch)
  fs.writeFileSync(file, JSON.stringify(meta))
}

/** 曲目目录的真实字节 —— `prune` 算的就是这个口径 */
function dirBytes(dir: string): number {
  return fs.readdirSync(dir).reduce((sum, name) => sum + fs.statSync(path.join(dir, name)).size, 0)
}

afterEach(() => {
  core.dispose()
  rmDir(home)
})

describe('media.ensure：落盘', () => {
  it('首次 ensure 走 h5 取址 + 下载音频 + 歌词/封面落盘，meta 记全', async () => {
    const meta = await core.media.ensure(TRACK)
    expect(meta.audio.bytes).toBe(2048)
    expect(meta.audio.mime).toBe('audio_mp4')
    expect(meta.audio.sha1).toMatch(/^[0-9a-f]{40}$/)
    expect(meta.audio.file).toBe('audio.m4a')
    expect(meta.lyrics?.lines).toBe(3)
    expect(fs.readFileSync(audioPath())).toHaveLength(2048)
    expect(fs.existsSync(path.join(core.media.dirOf(TRACK), 'meta.json'))).toBe(true)
    // h5 详情 1 次 + 音频 1 次 + 封面 1 次（h5 的 album.url_cover 给得出封面）
    expect(mock.count()).toBe(3)
    expect(mock.calls.some((c) => c.url.includes('/luna/h5/track_v2'))).toBe(true)
    expect(mock.calls.some((c) => c.url.includes('www.qishui.com'))).toBe(false)
  })

  it('h5 拒答时回落分享页 SSR（行为不退化，两条路拿到的是同一份音频）', async () => {
    const off = createMockUpstream({ h5: false })
    const offHome = makeTempDir('qishui-media-ssr-')
    try {
      const core2 = await createQishui({ dataDir: offHome, device: MOCK_DEVICE, fetchImpl: off.fetchImpl })
      const meta = await core2.media.ensure(TRACK)
      expect(meta.audio.bytes).toBe(2048)
      expect(meta.lyrics?.lines).toBe(3)
      expect(off.calls.some((c) => c.url.includes('/share/track'))).toBe(true)
      core2.dispose()
    } finally {
      rmDir(offHome)
    }
  })

  it('两条路都不给地址 → MediaUnavailableError，错误里两条各为什么都写出来', async () => {
    const dead = createMockUpstream({ playable: false, h5: false })
    const deadHome = makeTempDir('qishui-media-dead-')
    try {
      const core2 = await createQishui({ dataDir: deadHome, device: MOCK_DEVICE, fetchImpl: dead.fetchImpl })
      const err = await core2.media.ensure(TRACK).catch((e) => e)
      expect(err).toBeInstanceOf(MediaUnavailableError)
      expect((err as Error).message).toMatch(/h5 .*分享页/)
      expect(fs.existsSync(core2.media.dirOf(TRACK))).toBe(false)
      core2.dispose()
    } finally {
      rmDir(deadHome)
    }
  })

  it('第二次 ensure/peek 纯本地零请求；has 为 true', async () => {
    await core.media.ensure(TRACK)
    mock.resetCalls()
    const hit = await core.media.peek(TRACK)
    expect(hit?.trackId).toBe(TRACK)
    await core.media.ensure(TRACK)
    expect(mock.count()).toBe(0)
    expect(await core.media.has(TRACK)).toBe(true)
    expect(logLines.some((l) => l.includes('命中缓存'))).toBe(true)
  })

  it('.part 断点续传：半截文件 + Range 206 补齐，结束后没有 .part 残留', async () => {
    const dir = core.media.dirOf(TRACK)
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(`${audioPath()}.part`, mock.audioBytes.subarray(0, 1000))
    const meta = await core.media.ensure(TRACK)
    expect(meta.audio.bytes).toBe(2048)
    expect(fs.existsSync(audioPath())).toBe(true)
    expect(fs.existsSync(`${audioPath()}.part`)).toBe(false)
    expect(logLines.some((l) => l.includes('断点续传'))).toBe(true)
    const audioCall = mock.calls.find((c) => c.url.includes('audio.mock'))
    expect(audioCall).toBeDefined()
  })

  it('refresh 强制重取媒体，但文件已在就不重下音频', async () => {
    await core.media.ensure(TRACK)
    mock.resetCalls()
    await core.media.ensure(TRACK, { refresh: true })
    expect(mock.count()).toBe(1) // 只有 h5 取址那一次
    expect(mock.calls.some((c) => c.url.includes('audio.mock'))).toBe(false)
  })
})

describe('media.resolve：播放源', () => {
  it('默认走缓存：kind=cache、路径存在、歌词就绪', async () => {
    const source = await core.media.resolve(TRACK)
    expect(source.kind).toBe('cache')
    expect(source.path && fs.existsSync(source.path)).toBe(true)
    expect(source.track.name).toBe('晴天（mock）')
    expect(source.durationMs).toBe(12_345)
    expect(source.lyrics?.lines).toHaveLength(3)
    const state = source.lyrics?.view(2000, 0)
    expect(state?.line?.text).toBe('第一行歌词')
  })

  it('download:false 只解析签名地址，不碰磁盘', async () => {
    const source = await core.media.resolve(TRACK, { download: false })
    expect(source.kind).toBe('remote')
    expect(source.url).toContain('audio.mock')
    expect(source.expiresAt).toBeGreaterThan(Math.floor(Date.now() / 1000))
    expect(source.lyrics?.lines).toHaveLength(3)
    expect(fs.existsSync(core.media.dirOf(TRACK))).toBe(false)
    expect(mock.count()).toBe(1) // 只拉了分享页
  })
})

describe('media：试听片段', () => {
  it('offsetStart/offsetDuration → 片段时长与起点，playableRange 落 meta，缓存命中一致', async () => {
    const clipHome = makeTempDir('qishui-media-clip-')
    try {
      const clip = createMockUpstream({ clip: { startSec: 3, durationSec: 5 } })
      const core2 = await createQishui({ dataDir: clipHome, device: MOCK_DEVICE, fetchImpl: clip.fetchImpl })
      const source = await core2.media.resolve(TRACK)
      expect(source.durationMs).toBe(5000)
      expect(source.clipStartMs).toBe(3000)
      expect(source.track.playableRange).toEqual({ startMs: 3000, durationMs: 5000 })
      const cached = await core2.media.resolve(TRACK)
      expect(cached.durationMs).toBe(5000)
      expect(cached.clipStartMs).toBe(3000)
      core2.dispose()
    } finally {
      rmDir(clipHome)
    }
  })

  it('v1 命中只重取一次媒体补片段信息，不重下音频；meta 升到 v2', async () => {
    const v1Home = makeTempDir('qishui-media-v1-')
    try {
      const clip = createMockUpstream({ clip: { startSec: 3, durationSec: 5 } })
      const core2 = await createQishui({ dataDir: v1Home, device: MOCK_DEVICE, fetchImpl: clip.fetchImpl })
      await core2.media.ensure(TRACK)
      const file = path.join(core2.media.dirOf(TRACK), 'meta.json')
      const stale = JSON.parse(fs.readFileSync(file, 'utf8'))
      // 模拟旧版本缓存：v1 + 没记片段信息
      delete stale.track.playableRange
      stale.v = 1
      fs.writeFileSync(file, JSON.stringify(stale))
      clip.resetCalls()
      const upgraded = await core2.media.ensure(TRACK)
      expect(clip.count()).toBe(1) // 只有取址那一次
      expect(clip.calls[0]?.url).toContain('/luna/h5/track_v2')
      expect(clip.calls[0]?.url).toContain('device_platform=web')
      expect(upgraded.v).toBe(2)
      expect(upgraded.track.playableRange).toEqual({ startMs: 3000, durationMs: 5000 })
      core2.dispose()
    } finally {
      rmDir(v1Home)
    }
  })

  it('offset 与整曲等长时不算片段（durationMs 仍为整曲、无 playableRange）', async () => {
    const fullHome = makeTempDir('qishui-media-full-')
    try {
      const full = createMockUpstream({ clip: { startSec: 0, durationSec: 12.345 } })
      const core2 = await createQishui({ dataDir: fullHome, device: MOCK_DEVICE, fetchImpl: full.fetchImpl })
      const source = await core2.media.resolve(TRACK, { download: false })
      expect(source.durationMs).toBe(12_345)
      expect(source.clipStartMs).toBeUndefined()
      expect(source.track.playableRange).toBeUndefined()
      core2.dispose()
    } finally {
      rmDir(fullHome)
    }
  })
})

describe('media：计数 / 校验 / 清理', () => {
  it('recordPlay 计次，stats 汇总字节与播放数', async () => {
    await core.media.ensure(TRACK)
    await core.media.recordPlay(TRACK)
    await core.media.recordPlay(TRACK)
    const stats = await core.media.stats()
    expect(stats).toMatchObject({ tracks: 1, audioBytes: 2048, withLyrics: 1, totalPlays: 2 })
  })

  it('verify 报出大小不符；fix:true 清掉坏条目', async () => {
    const meta = await core.media.ensure(TRACK)
    fs.writeFileSync(audioPath(), mock.audioBytes.subarray(0, 10))
    const issues = await core.media.verify()
    expect(issues.some((i) => i.trackId === TRACK && /大小不符/.test(i.issue))).toBe(true)
    const fixed = await core.media.verify({ fix: true })
    expect(fixed.length).toBeGreaterThan(0)
    expect(fs.existsSync(core.media.dirOf(TRACK))).toBe(false)
    expect(meta.trackId).toBe(TRACK)
  })

  it('evict 单首、prune(maxAgeMs:0) 剔全部、clear 清目录', async () => {
    await core.media.ensure(TRACK)
    expect(await core.media.evict(TRACK)).toBe(true)
    expect(await core.media.has(TRACK)).toBe(false)
    await core.media.ensure(TRACK)
    await sleep(10)
    expect((await core.media.prune({ maxAgeMs: 0 })).removed).toBe(1)
    await core.media.ensure(TRACK)
    const cleared = await core.media.clear()
    expect(cleared.removed).toBe(1)
    expect(fs.existsSync(core.paths.mediaDir)).toBe(false)
  })

  it('capacity 按真实磁盘占用算账，预览不实删', async () => {
    await core.media.ensure(TRACK)
    // 没下完的分片：只进 diskBytes，meta 自报的 audioBytes 里没有它
    fs.writeFileSync(path.join(core.media.dirOf(TRACK), 'audio.m4a.part'), Buffer.alloc(1000, 1))
    const stats = await core.media.stats()
    expect(stats.audioBytes).toBe(2048)
    expect(stats.diskBytes).toBeGreaterThan(stats.audioBytes + stats.coverBytes)

    const cap = await core.media.capacity()
    expect(cap.limitBytes).toBe(CONFIG_DEFAULTS.maxMediaBytes)
    expect(cap.usedBytes).toBe(stats.diskBytes)
    expect(cap.overLimit).toBe(false)
    expect(cap.reclaimableTracks).toBe(0)
    expect(cap.autoEvict).toBe(false)
    // 预览跑完一个文件都不能少
    expect((await core.media.list()).length).toBe(1)
  })

  it('上限内不动手；超了按 lru 只剔最久没碰的那首', async () => {
    await core.media.ensure('7001')
    await core.media.ensure('7002')
    await core.media.ensure('7003')
    const now = Date.now()
    await patchMeta(core, '7001', { accessedAt: now - 3000, plays: 9 })
    await patchMeta(core, '7002', { accessedAt: now - 2000, plays: 5 })
    await patchMeta(core, '7003', { accessedAt: now - 1000, plays: 0 })

    const total = (await core.media.stats()).diskBytes
    const oldest = dirBytes(core.media.dirOf('7001'))
    const limit = total - oldest + 1
    const pruned = await core.media.prune({ maxBytes: limit })
    expect(pruned).toMatchObject({ removed: 1, policy: 'lru' })
    expect(pruned.freedBytes).toBe(oldest)
    expect(await core.media.has('7001')).toBe(false)
    expect(await core.media.has('7002')).toBe(true)
    expect(await core.media.has('7003')).toBe(true)
  })

  it('leastPlayed 剔播得最少的那首（同次数再比时间）；keep 能保住它', async () => {
    await core.media.ensure('7001')
    await core.media.ensure('7002')
    await core.media.ensure('7003')
    const now = Date.now()
    // 故意把「最久没碰」和「播得最少」分到两首不同的曲目上，两个策略才会分岔
    await patchMeta(core, '7001', { accessedAt: now - 3000, plays: 5 })
    await patchMeta(core, '7002', { accessedAt: now - 1000, plays: 0 })
    await patchMeta(core, '7003', { accessedAt: now - 2000, plays: 9 })

    const total = (await core.media.stats()).diskBytes
    const limit = total - dirBytes(core.media.dirOf('7002')) + 1
    const byPlays = await core.media.prune({ maxBytes: limit, policy: 'leastPlayed' })
    expect(byPlays).toMatchObject({ removed: 1, policy: 'leastPlayed' })
    // 7002 已经没了，这一条只验「分岔」：剩下两首里 7001 次少、7003 次多
    expect(await core.media.has('7002')).toBe(false)

    await core.media.ensure('7002')
    await patchMeta(core, '7002', { accessedAt: now - 1000, plays: 0 })
    const total2 = (await core.media.stats()).diskBytes
    const keepPruned = await core.media.prune({
      maxBytes: total2 - dirBytes(core.media.dirOf('7002')) + 1,
      policy: 'leastPlayed',
      keep: ['7002'],
    })
    expect(keepPruned.removed).toBe(1)
    // 保住 0 次的 7002，就该动次少的那首（7001：5 次）
    expect(await core.media.has('7002')).toBe(true)
    expect(await core.media.has('7001')).toBe(false)
  })

  it('上限 0 = 不限制：capacity 说不超，prune 一个文件都不动', async () => {
    const home2 = makeTempDir('qishui-media-nolimit-')
    try {
      const core2 = await createQishui({
        dataDir: home2,
        device: MOCK_DEVICE,
        fetchImpl: mock.fetchImpl,
        config: { maxMediaBytes: 0 },
      })
      try {
        await core2.media.ensure(TRACK)
        const cap = await core2.media.capacity()
        expect(cap).toMatchObject({ limitBytes: 0, overLimit: false, autoEvict: false })
        expect(cap.percent).toBeUndefined()
        expect((await core2.media.prune()).removed).toBe(0)
        expect(await core2.media.has(TRACK)).toBe(true)
      } finally {
        core2.dispose()
      }
    } finally {
      rmDir(home2)
    }
  })

  it('mediaAutoEvict 开：落盘后自动剔到上限，且不动刚下的那首；关着就只报警', async () => {
    // 一档一首的体积：留两首的额度，第三首一落盘就该顶掉最久没碰的第一首
    const probe = makeTempDir('qishui-media-evict-probe-')
    let each = 0
    try {
      const probeCore = await createQishui({ dataDir: probe, device: MOCK_DEVICE, fetchImpl: mock.fetchImpl })
      try {
        await probeCore.media.ensure('7001')
        each = dirBytes(probeCore.media.dirOf('7001'))
      } finally {
        probeCore.dispose()
      }
    } finally {
      rmDir(probe)
    }
    const limit = each * 2 + 1

    const home2 = makeTempDir('qishui-media-evict-')
    try {
      const auto = await createQishui({
        dataDir: home2,
        device: MOCK_DEVICE,
        fetchImpl: mock.fetchImpl,
        config: { maxMediaBytes: limit, mediaAutoEvict: true },
      })
      try {
        await auto.media.ensure('7001')
        await sleep(10)
        await auto.media.ensure('7002')
        await sleep(10)
        await auto.media.ensure('7003')
        expect(await auto.media.has('7001')).toBe(false)
        expect(await auto.media.has('7002')).toBe(true)
        // 刚 ensure 完的那首绝不能被自己剔掉（它 plays 还是 0）
        expect(await auto.media.has('7003')).toBe(true)
        expect((await auto.media.capacity()).usedBytes).toBeLessThanOrEqual(limit)
      } finally {
        auto.dispose()
      }
    } finally {
      rmDir(home2)
    }

    const home3 = makeTempDir('qishui-media-noevict-')
    try {
      const manual = await createQishui({
        dataDir: home3,
        device: MOCK_DEVICE,
        fetchImpl: mock.fetchImpl,
        config: { maxMediaBytes: limit },
      })
      try {
        await manual.media.ensure('7001')
        await sleep(10)
        await manual.media.ensure('7002')
        await sleep(10)
        await manual.media.ensure('7003')
        const cap = await manual.media.capacity()
        expect(cap.overLimit).toBe(true)
        expect(cap.autoEvict).toBe(false)
        expect(cap.reclaimableTracks).toBe(1)
        // 开关关着 = 三首都在，等人来点「按上限清理」
        expect((await manual.media.list()).length).toBe(3)
      } finally {
        manual.dispose()
      }
    } finally {
      rmDir(home3)
    }
  })

  it('lyrics() 优先读缓存（零请求）', async () => {
    await core.media.ensure(TRACK)
    mock.resetCalls()
    const lyrics = await core.media.lyrics(TRACK)
    expect(lyrics?.lines.length).toBe(3)
    expect(mock.count()).toBe(0)
  })

  it('cachedCover() 只读本地封面字节（零请求）：没落盘就是 undefined', async () => {
    // TUI 每换一次尺寸就重画封面，走网络会把 CDN 打疼；这一条就是给它的「本地优先」用的
    expect(await core.media.cachedCover(TRACK)).toBeUndefined()
    await core.media.ensure(TRACK)
    mock.resetCalls()
    const bytes = await core.media.cachedCover(TRACK)
    expect(bytes?.length).toBeGreaterThan(0)
    expect(mock.count()).toBe(0)
  })
})
