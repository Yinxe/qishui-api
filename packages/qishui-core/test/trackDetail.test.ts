/**
 * `core.trackDetail()` / `core.link.media()` 离线单测：走 `/luna/h5/track_v2` 这条正口，
 * 关心的是「权益矩阵透不透得出、拿到的到底是整曲还是试听段」。
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createQishui, type QishuiCore } from '../dist/index.js'
import { createMockUpstream, MOCK_DEVICE } from './support/mockUpstream.js'
import { makeTempDir, rmDir } from './support/tmp.js'

const TRACK = '7068138081588611073'

let home: string
let mock: ReturnType<typeof createMockUpstream>
let core: QishuiCore

beforeEach(async () => {
  home = makeTempDir('qishui-detail-')
  mock = createMockUpstream()
  core = await createQishui({ dataDir: home, device: MOCK_DEVICE, fetchImpl: mock.fetchImpl })
})

afterEach(() => {
  core.dispose()
  rmDir(home)
})

describe('core.trackDetail', () => {
  it('一次请求拿到详情 + 档位 + 权益 + 歌词，匿名口径不带 cookie', async () => {
    const d = await core.trackDetail(TRACK)
    expect(mock.count()).toBe(1)
    expect(mock.calls[0]?.url).toContain('device_platform=web')
    expect(d.title).toBe('晴天（mock）')
    expect(d.duration_ms).toBe(12_345)
    expect(d.clip).toBe(false)
    expect(d.qualities.map((q) => q.quality)).toEqual(['highest', 'higher', 'medium'])
    expect(d.declared_qualities?.map((q) => q.quality)).toEqual(['medium', 'higher', 'highest'])
    expect(d.lyrics?.sentences).toHaveLength(3)
  })

  it('权益矩阵区分「声明有 lossless」与「匿名取不到 lossless」', async () => {
    const d = await core.trackDetail(TRACK)
    expect(d.entitlements?.lossless).toMatchObject({ play: { need_vip: true }, download: { need_vip: true } })
    expect(d.entitlements?.medium?.play?.need_vip).toBe(false)
    expect(d.qualities.map((q) => q.quality)).not.toContain('lossless')
    expect(d.only_vip_playable).toBe(false)
  })

  it('VIP 曲匿名只给试听段时如实标 clip，并给出片段区间', async () => {
    const clipHome = makeTempDir('qishui-detail-clip-')
    try {
      const clip = createMockUpstream({ clip: { startSec: 3, durationSec: 5 } })
      const core2 = await createQishui({ dataDir: clipHome, device: MOCK_DEVICE, fetchImpl: clip.fetchImpl })
      const d = await core2.trackDetail(TRACK)
      expect(d.clip).toBe(true)
      expect(d.clip_start_ms).toBe(3000)
      expect(d.clip_duration_ms).toBe(5000)
      expect(d.duration_ms).toBe(12_345)
      core2.dispose()
    } finally {
      rmDir(clipHome)
    }
  })
})

describe('core.link.media', () => {
  it('track 走 h5，不再抓分享页', async () => {
    const media = await core.link.media(TRACK)
    expect(mock.calls.every((c) => !c.url.includes('www.qishui.com'))).toBe(true)
    expect(media.play_url).toContain('audio.mock')
    expect(media.kind).toBe('track')
    expect(media.duration_ms).toBe(12_345)
    // 整曲时 offset 也照实填（core 的 clipOf 会把「等于整曲」判成非片段）
    expect(media.offset_duration_ms).toBe(12_345)
    expect(media.lyrics?.sentences).toHaveLength(3)
  })

  it('h5 拿不到东西时直接抛（这条口不静默回落，好让人看见它为什么拿不到）', async () => {
    const offHome = makeTempDir('qishui-detail-off-')
    try {
      const off = createMockUpstream({ h5: false })
      const core2 = await createQishui({ dataDir: offHome, device: MOCK_DEVICE, fetchImpl: off.fetchImpl })
      await expect(core2.link.media(TRACK)).rejects.toThrow(/没有 track/)
      expect(off.calls.some((c) => c.url.includes('www.qishui.com'))).toBe(false)
      core2.dispose()
    } finally {
      rmDir(offHome)
    }
  })
})
