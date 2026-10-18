/**
 * 曲库服务（catalog）离线单测：MGetMedia 批量 hydration、缓存档位、专辑/艺人/歌单/榜单解析。
 * 全部走 mock 上游（test/support/mockUpstream.ts），零真实网络。
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createQishui, type QishuiCore } from '../dist/index.js'
import { createMockUpstream, MOCK_DEVICE } from './support/mockUpstream.js'
import { makeTempDir, rmDir } from './support/tmp.js'

const T1 = '7068138081588611073'
const T2 = '7168965360136226827'

let core: QishuiCore
let mock: ReturnType<typeof createMockUpstream>
let home: string

beforeEach(async () => {
  home = makeTempDir('qishui-catalog-')
  mock = createMockUpstream()
  core = await createQishui({ dataDir: home, device: MOCK_DEVICE, fetchImpl: mock.fetchImpl })
})

afterEach(() => {
  core.dispose()
  rmDir(home)
})

describe('catalog.tracks：批量 hydration + 缓存', () => {
  it('去重、保持入参顺序、字段解析齐', async () => {
    const list = await core.catalog.tracks([T1, T2, T1])
    expect(list.map((t) => t.id)).toEqual([T1, T2])
    const track = list[0]
    expect(track.data.name).toContain('曲目')
    expect(track.data.durationMs).toBe(12_345)
    expect(track.data.artists.length).toBe(1)
    expect(track.data.album?.name).toContain('专辑')
    expect(track.data.coverUrl).toContain('cover.mock')
    expect(track.data.stats).toEqual({ collected: 111, comment: 22, shared: 33 })
  })

  it('第二次调用命中实体缓存零请求（entity 档落盘）', async () => {
    await core.catalog.tracks([T1, T2])
    mock.resetCalls()
    const again = await core.catalog.tracks([T1, T2])
    expect(mock.count()).toBe(0)
    expect(again.map((t) => t.id)).toEqual([T1, T2])
    // refresh 显式绕过缓存
    await core.catalog.tracks([T1], { refresh: true })
    expect(mock.count()).toBeGreaterThan(0)
  })

  it('track() 单曲即批量特例；空入参直接回空不发请求', async () => {
    const track = await core.catalog.track(T1)
    expect(track.id).toBe(T1)
    expect(await core.catalog.tracks([])).toEqual([])
    expect(core.cache.peek('track', T1)).toBeDefined()
  })
})

describe('catalog：stats / related / check', () => {
  it('stats() 拆出收藏/评论/分享数', async () => {
    const stats = await core.catalog.stats(T1)
    expect(stats).toEqual({ collected: 4001, comment: 77, shared: 9 })
  })

  it('related() 按 count 截断', async () => {
    const related = await core.catalog.related(T1, 2)
    expect(related).toHaveLength(2)
    expect(related[0].id).toBe('7001')
  })

  it('related() 请求口径对齐 App：1 个种子 + artist_ids + scene_name + played_media', async () => {
    await core.history.append({ id: T2, name: '曲目 T2', artists: [], durationMs: 61_000 }, { playedMs: 1_500 })
    // 实体在手：artist_ids 直接取它自己的 artists，不再多打一次 MGetMedia
    const track = await core.catalog.track(T1)
    mock.resetCalls()
    await core.catalog.related(track, 2)
    const call = mock.calls.find((c) => c.url.includes('/media/related'))
    const body = JSON.parse(call?.body ?? '{}')
    expect(body.media_list).toEqual([{ id: T1, type: 'track' }])
    expect(body.artist_ids).toEqual([`a-${T1}`])
    expect(body.scene_name).toBe('search')
    // 两处有意保留的差异：要完整实体、条数由调用方定
    expect(body.full_media).toBe(true)
    expect(body.req_count).toBe(2)
    // 种子：本地历史（mock 的云端最近播放默认空）
    expect(body.played_media).toEqual([{ media_id: T2, type: 'track', duration: 61, played_mills: 1_500 }])
  })

  it('related() 只给 id 时也能拿到 artist_ids（走一次 MGetMedia，之后命中缓存）', async () => {
    mock.resetCalls()
    await core.catalog.related(T1, 1)
    expect(mock.calls.some((c) => c.url.includes('/luna/media') && !c.url.includes('related'))).toBe(true)
    const body = JSON.parse(mock.calls.find((c) => c.url.includes('/media/related'))?.body ?? '{}')
    expect(body.artist_ids).toEqual([`a-${T1}`])
  })

  it('check()/checkTracks() 空入参不发请求', async () => {
    expect(await core.catalog.check([])).toEqual([])
    expect(await core.catalog.checkTracks([])).toEqual([])
  })
})

describe('catalog：专辑 / 艺人 / 歌单 / 榜单', () => {
  it('album() + albumTracks()', async () => {
    const album = await core.catalog.album('7068138079545985025')
    expect(album.data.name).toBe('mock 专辑')
    expect(album.data.releaseDate).toBe(1_700_000_000)
    const tracks = await core.catalog.albumTracks('7068138079545985025')
    expect(tracks.map((t) => t.id)).toEqual(['7001', '7002'])
  })

  it('artist() + hot/分页曲目/专辑', async () => {
    const artist = await core.catalog.artist('6810215791951087618')
    expect(artist.data.name).toBe('测试歌手')
    expect(artist.data.countTracks).toBe(40)
    const hot = await core.catalog.artistHotTracks('6810215791951087618')
    expect(hot).toHaveLength(1)
    const page = await core.catalog.artistTracks('6810215791951087618', { count: 2 })
    expect(page.items).toHaveLength(2)
    expect(page.hasMore).toBe(true)
    expect(page.cursor).toBe('20')
    const albums = await core.catalog.artistAlbums('6810215791951087618')
    expect(albums.items[0].data.name).toBe('mock 专辑一')
  })

  it('playlist() + playlistTracks()（media_resources 才是曲目）', async () => {
    const playlist = await core.catalog.playlist('7031081053599238175')
    expect(playlist.data.title).toBe('mock 歌单')
    const page = await core.catalog.playlistTracks('7031081053599238175', { count: 10 })
    expect(page.items.map((t) => t.id)).toEqual(['7001', '7002'])
    expect(page.hasMore).toBe(false)
  })

  it('chart() 排好名次（ranked_track 壳与 rank 元信息都解析）', async () => {
    const chart = await core.catalog.chart('chart-1')
    expect(chart.data.title).toBe('mock 榜单')
    expect(chart.data.ranks).toHaveLength(2)
    expect(chart.data.ranks[0].rank).toBe(1)
    expect(chart.data.ranks[0].track.id).toBe('7001')
    expect(chart.data.ranks[1].track.id).toBe('7002')
  })
})
