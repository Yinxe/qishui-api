/**
 * 媒体缓存离线单测：分享页 SSR → 落盘三件套、断点续传、peek 零网络、verify/prune。
 * mock 音频 2048B（支持 Range 206），分享页可播/不可播可切。
 */
import fs from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createQishui, MediaUnavailableError, type QishuiCore } from '../dist/index.js'
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

afterEach(() => {
  core.dispose()
  rmDir(home)
})

describe('media.ensure：落盘', () => {
  it('首次 ensure 拉分享页 + 下载音频 + 歌词落盘，meta 记全', async () => {
    const meta = await core.media.ensure(TRACK)
    expect(meta.audio.bytes).toBe(2048)
    expect(meta.audio.mime).toBe('audio_mp4')
    expect(meta.audio.sha1).toMatch(/^[0-9a-f]{40}$/)
    expect(meta.audio.file).toBe('audio.m4a')
    expect(meta.lyrics?.lines).toBe(3)
    expect(fs.readFileSync(audioPath())).toHaveLength(2048)
    expect(fs.existsSync(path.join(core.media.dirOf(TRACK), 'meta.json'))).toBe(true)
    // 分享页 1 次 + 音频 1 次（mock 无封面字段）
    expect(mock.count()).toBe(2)
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

  it('不可播条目（分享页不给地址）→ MediaUnavailableError，不落半成品', async () => {
    const dead = createMockUpstream({ playable: false })
    const deadHome = makeTempDir('qishui-media-dead-')
    try {
      const core2 = await createQishui({ dataDir: deadHome, device: MOCK_DEVICE, fetchImpl: dead.fetchImpl })
      await expect(core2.media.ensure(TRACK)).rejects.toThrow(MediaUnavailableError)
      expect(fs.existsSync(core2.media.dirOf(TRACK))).toBe(false)
      core2.dispose()
    } finally {
      rmDir(deadHome)
    }
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

  it('refresh 强制重拉分享页，但文件已在就不重下音频', async () => {
    await core.media.ensure(TRACK)
    mock.resetCalls()
    await core.media.ensure(TRACK, { refresh: true })
    expect(mock.count()).toBe(1) // 只有分享页那一次
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

  it('v1 命中只重拉分享页补片段信息，不重下音频；meta 升到 v2', async () => {
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
      expect(clip.count()).toBe(1) // 只有分享页
      expect(clip.calls[0]?.url).toContain('/share/track')
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

  it('lyrics() 优先读缓存（零请求）', async () => {
    await core.media.ensure(TRACK)
    mock.resetCalls()
    const lyrics = await core.media.lyrics(TRACK)
    expect(lyrics?.lines.length).toBe(3)
    expect(mock.count()).toBe(0)
  })
})
