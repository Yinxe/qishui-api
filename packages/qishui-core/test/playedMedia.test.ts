/**
 * 推荐种子（`played_media`）离线单测：口径对齐 App 的 `getMediaPlayed()` ——
 * **待播队列（逆序、`played_mills: -1`）→ 云端最近播放（新→旧）→ 本地历史补缺**，
 * 按 `media_id` 去重后截断到 30 条。云端走 mock 的 `/luna/me/recently-played`，本地走 journal。
 * 全部零真实网络。
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { buildPlayedMedia, createQishui, PLAYED_MEDIA_MAX, type QishuiCore, type TrackData } from '../dist/index.js'
import { createMockUpstream, MOCK_DEVICE } from './support/mockUpstream.js'
import { makeTempDir, rmDir } from './support/tmp.js'

const track = (id: string, durationMs = 60_000): TrackData => ({ id, name: `曲目 ${id}`, artists: [], durationMs })

let core: QishuiCore
let mock: ReturnType<typeof createMockUpstream>
let home: string

async function boot(options: Parameters<typeof createMockUpstream>[0] = {}): Promise<void> {
  mock = createMockUpstream(options)
  core = await createQishui({ dataDir: home, device: MOCK_DEVICE, fetchImpl: mock.fetchImpl })
}

beforeEach(() => {
  home = makeTempDir('qishui-played-')
})

afterEach(() => {
  core?.dispose()
  rmDir(home)
})

describe('buildPlayedMedia：App 口径 + 云端/本地混合', () => {
  it('待播队列：当前曲目之后逆序，played_mills 标 -1（App 对「还没播」就这么标）', async () => {
    await boot()
    core.player.queue.setItems([track('7101'), track('7102'), track('7103')], 0)
    const seeds = await buildPlayedMedia(core)
    expect(seeds).toEqual([
      { media_id: '7103', type: 'track', duration: 60, played_mills: -1 },
      { media_id: '7102', type: 'track', duration: 60, played_mills: -1 },
    ])
  })

  it('本地历史：新→旧，duration 换成秒、played_mills 用实际听了多久', async () => {
    await boot()
    await core.history.append(track('7201'), { playedMs: 12_000 })
    await core.history.append(track('7202'), { playedMs: 3_000 })
    const seeds = await buildPlayedMedia(core)
    expect(seeds).toEqual([
      { media_id: '7202', type: 'track', duration: 60, played_mills: 3_000 },
      { media_id: '7201', type: 'track', duration: 60, played_mills: 12_000 },
    ])
  })

  it('云端在前、本地补缺，同一首只留一条（云端的 played_mills 由本地记录补上）', async () => {
    await boot({ recent: ['7301', '7302'] })
    await core.history.append(track('7302'), { playedMs: 5_000 })
    await core.history.append(track('7399'), { playedMs: 8_000 })
    const seeds = await buildPlayedMedia(core)
    expect(seeds.map((seed) => seed.media_id)).toEqual(['7301', '7302', '7399'])
    // 云端没有「听了多久」，本地同曲记录有就补；没有就不填（不编 0）
    expect(seeds[0].played_mills).toBeUndefined()
    expect(seeds[1].played_mills).toBe(5_000)
    expect(seeds[2].played_mills).toBe(8_000)
  })

  it('去重后截断到 30 条（PLAYED_MEDIA_MAX），待播队列占前排', async () => {
    const cloud = Array.from({ length: 40 }, (_, i) => `75${String(i).padStart(2, '0')}`)
    await boot({ recent: cloud })
    core.player.queue.setItems([track('7001'), track('7002')], 0)
    const seeds = await buildPlayedMedia(core)
    expect(PLAYED_MEDIA_MAX).toBe(30)
    expect(seeds).toHaveLength(30)
    expect(seeds[0].media_id).toBe('7002')
    expect(seeds[0].played_mills).toBe(-1)
    expect(seeds[1].media_id).toBe(cloud[0])
  })

  it('三个开关各自能关掉一半来源；limit: 0 直接回空', async () => {
    await boot({ recent: ['7301'] })
    await core.history.append(track('7399'))
    core.player.queue.setItems([track('7101'), track('7102')], 0)

    expect((await buildPlayedMedia(core, { includeQueue: false })).map((s) => s.media_id)).toEqual(['7301', '7399'])
    expect((await buildPlayedMedia(core, { includeCloud: false })).map((s) => s.media_id)).toEqual(['7102', '7399'])
    expect((await buildPlayedMedia(core, { includeLocal: false })).map((s) => s.media_id)).toEqual(['7102', '7301'])
    expect(await buildPlayedMedia(core, { limit: 0 })).toEqual([])
  })
})
