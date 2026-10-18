/**
 * 听歌模式离线单测：`FeedModeRef` 的扁平串往返（认不出就是「没选过」）、
 * `feedModeTracks` 两档都落到 `FeedSongTab`（偏好走 `preference_mode`、场景走
 * `feed_preference.scene_mode_id`），以及「一次只给一小批」的口径。
 *
 * 场景曾经被分派到 `FeedRadioTracks {radio_id: scene_mode_id}` —— 那是错的：短数字喂进去
 * 不报错也不生效，回的是通用推荐池（实测选「日语」推中文歌），所以这里钉死「场景不许打
 * radio/tracks」这一条。
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createQishui, type FeedModeRef, formatFeedMode, parseFeedMode, type QishuiCore } from '../dist/index.js'
import { createMockUpstream, MOCK_DEVICE } from './support/mockUpstream.js'
import { makeTempDir, rmDir } from './support/tmp.js'

let core: QishuiCore
let mock: ReturnType<typeof createMockUpstream>
let home: string

beforeEach(async () => {
  home = makeTempDir('qishui-discover-')
  mock = createMockUpstream()
  core = await createQishui({ dataDir: home, device: MOCK_DEVICE, fetchImpl: mock.fetchImpl })
})

afterEach(() => {
  core.dispose()
  rmDir(home)
})

describe('parseFeedMode / formatFeedMode', () => {
  it('三档偏好与场景都能往返', () => {
    const refs: FeedModeRef[] = [
      { kind: 'preference', mode: 'default' },
      { kind: 'preference', mode: 'familiar' },
      { kind: 'scene', sceneModeId: 48 },
      { kind: 'scene', sceneModeId: 30 },
    ]
    for (const ref of refs) expect(parseFeedMode(formatFeedMode(ref))).toEqual(ref)
  })

  it('空串、没有前缀、前缀认不出、只有前缀 → 都是「没选过」，不猜', () => {
    for (const raw of ['', '   ', 'familiar', 'guess:48', 'preference:', 'scene:', ':48']) {
      expect(parseFeedMode(raw), `不该解析出值：${JSON.stringify(raw)}`).toBeUndefined()
    }
    expect(parseFeedMode(undefined)).toBeUndefined()
  })

  it('`scene:` 后面只认纯数字：雪花 id（电台队列）与其它写法都算「没选过」', () => {
    // 老版本把 discover_radio 的 inner_block_id 写进过 scene:，那其实是电台队列，不是场景
    for (const raw of ['scene:7302849374857382901', 'scene:a:b', 'scene:30.5', 'scene:-1', 'scene:0', 'scene: 30'])
      expect(parseFeedMode(raw), `不该解析出值：${JSON.stringify(raw)}`).toBeUndefined()
    expect(parseFeedMode('scene:30')).toEqual({ kind: 'scene', sceneModeId: 30 })
  })
})

describe('feedModeTracks', () => {
  it('偏好档打 FeedSongTab，并把 mode 带进请求体', async () => {
    const tracks = await core.discover.feedModeTracks({ kind: 'preference', mode: 'familiar' })
    const call = mock.calls.find((c) => c.url.includes('/luna/pc/feed/song-tab'))
    expect(call?.url).toBeTruthy()
    expect(mock.calls.some((c) => c.url.includes('/luna/pc/feed/radio/tracks'))).toBe(false)
    expect(JSON.parse(call?.body ?? '{}').preference_mode).toBe('familiar')
    expect(tracks.map((t) => t.id)).toEqual(['7101', '7102', '7103', '7104', '7105', '7106'])
  })

  it('场景档也打 FeedSongTab：场景 id 进 feed_preference.scene_mode_id（扁平），绝不碰 radio/tracks', async () => {
    const tracks = await core.discover.feedModeTracks({ kind: 'scene', sceneModeId: 30 })
    const call = mock.calls.find((c) => c.url.includes('/luna/pc/feed/song-tab'))
    expect(call?.url).toBeTruthy()
    // 这条是回归闸：radio_id 只认电台队列 id，短数字喂进去不报错也不生效（选「日语」推中文歌）
    expect(mock.calls.some((c) => c.url.includes('/luna/pc/feed/radio/tracks'))).toBe(false)
    const body = JSON.parse(call?.body ?? '{}')
    expect(body.feed_preference).toEqual({ scene_mode_id: 30 })
    expect(body.preference_mode).toBe('default')
    // 一次就一小批（实测 6 首）：不装作能摊成浏览列表
    expect(tracks).toHaveLength(6)
  })

  it('两个场景各自带自己的 scene_mode_id（不串味）', async () => {
    await core.discover.feedModeTracks({ kind: 'scene', sceneModeId: 30 })
    await core.discover.feedModeTracks({ kind: 'scene', sceneModeId: 10 })
    const bodies = mock.calls
      .filter((c) => c.url.includes('/luna/pc/feed/song-tab'))
      .map((c) => JSON.parse(c.body ?? '{}').feed_preference?.scene_mode_id)
    expect(bodies).toEqual([30, 10])
  })

  it('实时批次不进缓存：连着两次同样打上游', async () => {
    const ref: FeedModeRef = { kind: 'preference', mode: 'fresh' }
    await core.discover.feedModeTracks(ref)
    mock.resetCalls()
    await core.discover.feedModeTracks(ref)
    expect(mock.calls.filter((c) => c.url.includes('/luna/pc/feed/song-tab'))).toHaveLength(1)
  })
})
