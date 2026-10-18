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
import {
  createQishui,
  type FeedModeRef,
  formatFeedMode,
  parseFeedMode,
  type QishuiCore,
  radioFlowParams,
} from '../dist/index.js'
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
    const body = JSON.parse(call?.body ?? '{}')
    // App 口径：偏好档也是塞进 feed_preference（顶层 preference_mode 是本项目额外发的兼容字段）
    expect(body.feed_preference).toEqual({ preference_mode: 'familiar' })
    expect(body.preference_mode).toBe('familiar')
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

describe('FeedSongTab 请求口径对齐 App', () => {
  const feedBody = (): Record<string, any> =>
    JSON.parse(mock.calls.find((c) => c.url.includes('/luna/pc/feed/song-tab'))?.body ?? '{}')

  it('带会话字段（is_did_first_request / did_first_use_time / feed_counts）与 played_media 种子', async () => {
    await core.history.append({ id: '7401', name: '曲目 7401', artists: [], durationMs: 61_000 }, { playedMs: 1_500 })
    await core.discover.feedSongTab()
    const body = feedBody()
    // 本机已有播放历史 → 不是设备首刷；did_first_use_time 取本机最早一条记录的时刻
    expect(body.is_did_first_request).toBe(false)
    expect(typeof body.did_first_use_time).toBe('number')
    expect(body.feed_counts).toEqual({ mix_session_count: 1 })
    // 种子：本地历史（云端 mock 这张表默认空）
    expect(body.played_media).toEqual([{ media_id: '7401', type: 'track', duration: 61, played_mills: 1_500 }])
  })

  it('本机没有播放历史：is_did_first_request=true，种子为空就不发 played_media', async () => {
    await core.discover.feedSongTab()
    const body = feedBody()
    expect(body.is_did_first_request).toBe(true)
    expect(typeof body.did_first_use_time).toBe('number')
    expect(body.played_media).toBeUndefined()
  })

  it('withPlayedMedia: false 不带种子（其余口径不变）', async () => {
    await core.history.append({ id: '7401', name: '曲目 7401', artists: [], durationMs: 61_000 })
    await core.discover.feedSongTab({ withPlayedMedia: false })
    expect(feedBody().played_media).toBeUndefined()
  })
})

describe('radioTracks 请求口径对齐 App', () => {
  const radioBody = (): Record<string, any> =>
    JSON.parse(mock.calls.find((c) => c.url.includes('/luna/pc/feed/radio/tracks'))?.body ?? '{}')

  it('默认带 cursor="" / flow_type=2 / trigger_info=""', async () => {
    await core.discover.radioTracks('7300000000000000001')
    expect(radioBody()).toEqual({
      radio_id: '7300000000000000001',
      cursor: '',
      flow_type: 2,
      trigger_info: '',
    })
  })

  it('cursor / flow_type / trigger_info 能显式传（分页与队列来源参数）', async () => {
    await core.discover.radioTracks('7300000000000000001', { cursor: '20', flowType: 3, triggerInfo: 'feed_radio' })
    expect(radioBody()).toMatchObject({ cursor: '20', flow_type: 3, trigger_info: 'feed_radio' })
  })

  it('radioFlowParams 从队列资源的 style.link 里抠参数（App 的取法），拿不到就回缺省', () => {
    expect(radioFlowParams({ style: { link: 'https://www.qishui.com/?flow_type=4&trigger_info=discover' } })).toEqual({
      flowType: 4,
      triggerInfo: 'discover',
    })
    expect(radioFlowParams({ style: { link: '' } })).toEqual({ flowType: 2, triggerInfo: '' })
    expect(radioFlowParams(undefined)).toEqual({ flowType: 2, triggerInfo: '' })
  })
})
