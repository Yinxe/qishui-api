/**
 * 我的音乐（library）离线单测：重点盯「写完必须读到服务端真值」这条底线——
 * 喜欢/取消喜欢改的是「我喜欢的音乐」那张歌单，而它的曲目走 `playlist-detail` 缓存（entity 档 6h），
 * 写接口不清那档的话，同一首按多少次都回同一个结论。全部走 mock 上游，零真实网络。
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createQishui, type QishuiCore } from '../dist/index.js'
import { createMockUpstream, MOCK_DEVICE, MOCK_LIKED_PLAYLIST_ID } from './support/mockUpstream.js'
import { makeTempDir, rmDir } from './support/tmp.js'

const T1 = '7068138081588611073'
const T3 = '7300000000000000003'

let core: QishuiCore
let mock: ReturnType<typeof createMockUpstream>
let home: string

beforeEach(async () => {
  home = makeTempDir('qishui-library-')
  mock = createMockUpstream({ liked: [T1] })
  core = await createQishui({ dataDir: home, device: MOCK_DEVICE, fetchImpl: mock.fetchImpl })
})

afterEach(() => {
  core.dispose()
  rmDir(home)
})

describe('library：喜欢/取消喜欢', () => {
  it('likedTracks 读的是「我喜欢的音乐」（type=1）那张', async () => {
    const tracks = await core.library.likedTracks()
    expect(tracks.map((t) => t.id)).toEqual([T1])
    expect((await core.library.likedPlaylist())?.id).toBe(MOCK_LIKED_PLAYLIST_ID)
  })

  it('写完读回真值：playlist-detail 必须跟着失效，否则一首歌按多少次都是同一个结论', async () => {
    expect(await core.library.isLiked(T3)).toBe(false)

    await core.library.like(T3)
    expect(await core.library.isLiked(T3)).toBe(true)
    expect(mock.liked()).toContain(T3)

    await core.library.unlike(T3)
    expect(await core.library.isLiked(T3)).toBe(false)
    expect(mock.liked()).not.toContain(T3)
  })

  it('喜欢过的歌取消后，从「我喜欢」列表里真的走掉', async () => {
    await core.library.likedTracks()
    await core.library.unlike(T1)
    expect((await core.library.likedTracks()).map((t) => t.id)).toEqual([])
  })

  it('曲目详情缓存也按 id 失效（那份响应里嵌了「我是否收藏」）', async () => {
    await core.catalog.track(T3)
    expect(core.cache.peek('track', T3)).toBeDefined()
    await core.library.like(T3)
    expect(core.cache.peek('track', T3)).toBeUndefined()
  })

  it('专辑/艺人收藏只清动过的那条详情，别把整个 entity 档抹了', async () => {
    const album = '7400000000000000001'
    const other = '7400000000000000002'
    await core.catalog.album(album)
    await core.catalog.album(other)
    await core.library.collectAlbums([album])
    expect(core.cache.peek('album-detail', album)).toBeUndefined()
    expect(core.cache.peek('album-detail', other)).toBeDefined()
  })
})

/**
 * 最近播放与关注艺人 —— 这两块的端点口径都是实打实测出来的，改错一根就整页空：
 *  · 曲目历史在 `/luna/me/recently-played`（201 条真数据），同名的 `/luna/pc/me/recently-played-media`
 *    那台机器上对所有 media_type/scene 只回 `{}`；
 *  · 关注艺人的读写都落地（`CollectArtists` 写完 `collection/artist` 立刻看得到，取关同理）。
 */
describe('library：最近播放与关注艺人（实测端点口径）', () => {
  const R1 = '7500000000000000001'
  const R2 = '7500000000000000002'
  const R3 = '7500000000000000003'
  const A1 = '7510000000000000001'

  beforeEach(async () => {
    core.dispose()
    mock = createMockUpstream({ liked: [T1], recent: [R1, R2, R3], followedArtists: [A1] })
    core = await createQishui({ dataDir: home, device: MOCK_DEVICE, fetchImpl: mock.fetchImpl })
  })

  it('recent() 读的是曲目那张表，总数/游标都照上游', async () => {
    const page = await core.library.recent({ count: 2 })
    expect(page.items.map((t) => t.id)).toEqual([R1, R2])
    expect(page.total).toBe(3)
    expect(page.hasMore).toBe(true)
    expect(page.cursor).toBe('2')
    // 别再回 `/luna/pc/me/recently-played-media`：那张表上游实测只回 `{}`，回它页面就是空的
    expect(mock.calls.some((c) => c.url.includes('recently-played-media'))).toBe(false)
  })

  it('翻页回传的是上游 next_cursor（偏移量），不是页序 +1', async () => {
    const first = await core.library.recent({ count: 2 })
    const second = await core.library.recent({ cursor: first.cursor, count: 2 })
    expect(second.items.map((t) => t.id)).toEqual([R3])
    expect(second.hasMore).toBe(false)
  })

  it('上报走 AppendRecentPlayedTracks：写完真的进表，removePlayed 能删回', async () => {
    const fresh = '7599000000000000009'
    await core.account.reportPlayed([fresh])
    expect(mock.recent()[0]).toBe(fresh)
    const page = await core.library.recent({ count: 50 })
    expect(page.items.map((t) => t.id)).toContain(fresh)
    // 同一首重复播只留最新一条（上游就是这个行为）
    await core.account.reportPlayed([R3])
    expect(mock.recent().filter((id) => id === R3)).toEqual([R3])
    expect(mock.recent()[0]).toBe(R3)
    await core.account.removePlayed([fresh])
    expect(mock.recent()).not.toContain(fresh)
  })

  it('关注/取关都落到表上，写完不回读旧值', async () => {
    const before = await core.library.collectedArtists()
    expect(before.items.map((a) => a.id)).toEqual([A1])
    expect(before.total).toBe(1)
    // 上游在每一项里带了关注态，TUI 的行菜单靠它决定出「关注」还是「取消关注」
    expect(before.items[0].following).toBe(true)

    await core.library.uncollectArtists([A1])
    // 不 refresh：写操作自己失效过 artist-collection，读的必须已经是服务端真值
    expect((await core.library.collectedArtists()).items).toEqual([])
    expect(mock.followed()).toEqual([])

    await core.library.collectArtists([A1])
    expect(mock.followed()).toEqual([A1])
    expect((await core.library.collectedArtists()).items.map((a) => a.id)).toEqual([A1])
  })
})
