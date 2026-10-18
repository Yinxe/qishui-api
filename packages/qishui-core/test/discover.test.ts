/**
 * 听歌模式离线单测：`FeedModeRef` 的扁平串往返（认不出就是「没选过」）、
 * `feedModeTracks` 按档分派到 `FeedSongTab` / `FeedRadioTracks`，以及「一次只给一小批」的口径。
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
      { kind: 'scene', radioId: '48' },
      // 首页 discover_radio 块的雪花 id 也当场景记（radioTracks 实测两种 id 都吃）
      { kind: 'scene', radioId: '7302849374857382901' },
    ]
    for (const ref of refs) expect(parseFeedMode(formatFeedMode(ref))).toEqual(ref)
  })

  it('空串、没有前缀、前缀认不出、只有前缀 → 都是「没选过」，不猜', () => {
    for (const raw of ['', '   ', 'familiar', 'guess:48', 'preference:', 'scene:', ':48']) {
      expect(parseFeedMode(raw), `不该解析出值：${JSON.stringify(raw)}`).toBeUndefined()
    }
    expect(parseFeedMode(undefined)).toBeUndefined()
  })

  it('模式串里带冒号时只切第一个（不把 id 再拆一遍）', () => {
    expect(parseFeedMode('scene:a:b')).toEqual({ kind: 'scene', radioId: 'a:b' })
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

  it('场景档打 FeedRadioTracks，并把 radio_id 带进请求体', async () => {
    const tracks = await core.discover.feedModeTracks({ kind: 'scene', radioId: '48' })
    const call = mock.calls.find((c) => c.url.includes('/luna/pc/feed/radio/tracks'))
    expect(call?.url).toBeTruthy()
    expect(mock.calls.some((c) => c.url.includes('/luna/pc/feed/song-tab'))).toBe(false)
    expect(JSON.parse(call?.body ?? '{}').radio_id).toBe('48')
    // 一次就一小批（实测 6 首）：不装作能摊成浏览列表
    expect(tracks).toHaveLength(6)
  })

  it('实时批次不进缓存：连着两次同样打上游', async () => {
    const ref: FeedModeRef = { kind: 'preference', mode: 'fresh' }
    await core.discover.feedModeTracks(ref)
    mock.resetCalls()
    await core.discover.feedModeTracks(ref)
    expect(mock.calls.filter((c) => c.url.includes('/luna/pc/feed/song-tab'))).toHaveLength(1)
  })
})
