import { describe, expect, it } from 'vitest'
import {
  asPlaylist,
  asTrack,
  coerceTrack,
  collectTracks,
  looksLikeAlbum,
  looksLikeArtist,
  looksLikeTrack,
  looksLikeUser,
  parseChart,
  parseTrackRef,
  unwrap,
} from '../dist/index.js'
import { trackEntity } from './support/mockUpstream.js'

const track = trackEntity('7001', '晴天（mock）')

describe('unwrap：实体包装的剥法', () => {
  it('entity.track_wrapper.track 三层都剥到', () => {
    const node = { entity: { track_wrapper: { track } } }
    expect(unwrap(node).id).toBe('7001')
  })

  it('track_wrapper 带附属元信息（limited_free_info）也剥到 track', () => {
    const node = { entity: { track_wrapper: { track, limited_free_info: { playable: true } } } }
    expect(unwrap(node).name).toBe('晴天（mock）')
  })

  it('entity.<kind> 直壳（搜索结果形态，回归：曾经只认 *_wrapper 导致 artist/playlist 全空）', () => {
    const artistNode = { entity: { artist: { id: '9001', name: '测试歌手', simple_display_name: 'x' } } }
    expect(asTrack(unwrap(artistNode))).toBeUndefined()
    const playlistNode = { entity: { playlist: { id: 'p1', title: '测试歌单', count_tracks: 3 } } }
    expect(asPlaylist(unwrap(playlistNode))?.title).toBe('测试歌单')
  })

  it('ranked_track（榜单壳）也剥', () => {
    expect(unwrap({ ranked_track: { track } }).id).toBe('7001')
  })

  it('真实体自带的 album/artists 字段不会被误剥（有字符串 id 就不动刀）', () => {
    const bare = { ...track }
    expect(unwrap(bare).album.id).toBe('alb-7001')
    expect(unwrap(bare).artists).toHaveLength(1)
  })
})

describe('形状识别：四类实体互不认错', () => {
  it('track 要求 id+name 且自己没有 release_date', () => {
    expect(looksLikeTrack(track)).toBe(true)
    expect(looksLikeTrack({ ...track, release_date: 1 })).toBe(false)
    expect(looksLikeAlbum(track)).toBe(false)
  })

  it('album 认 release_date；artist 认 simple_display_name/计数对；user 认 nickname+头像类字段', () => {
    expect(looksLikeAlbum(track.album)).toBe(true)
    expect(looksLikeArtist({ id: 'a', name: 'n', simple_display_name: 'n' })).toBe(true)
    expect(looksLikeUser({ id: 'u', nickname: 'n', douyin_id: '123' })).toBe(true)
    expect(looksLikeUser(track)).toBe(false)
  })
})

describe('parseTrack / parseTrackRef / coerceTrack', () => {
  it('完整实体 → TrackData：时长/artists/专辑/统计/vid 各归各位', () => {
    const data = asTrack({ entity: { track_wrapper: { track } } })
    expect(data).toMatchObject({ id: '7001', name: '晴天（mock）', durationMs: 12_345, vid: 'vid-7001' })
    expect(data?.artists[0]?.name).toBe('晴天（mock）歌手')
    expect(data?.album).toMatchObject({ id: 'alb-7001', releaseDate: 1_700_000_000 })
    expect(data?.stats).toMatchObject({ collected: 111, comment: 22, shared: 33 })
  })

  it('轻量引用（track_id/duration_ms/artist_id）走 parseTrackRef', () => {
    const ref = parseTrackRef({
      track_id: '8001',
      name: '轻量曲',
      duration_ms: 5000,
      artists: [{ artist_id: 'a9', name: '引用歌手' }],
      album: { album_id: 'al9', name: '引用专辑', cover_url: 'https://cover.mock/x.jpg' },
    })
    expect(ref).toMatchObject({ id: '8001', durationMs: 5000 })
    expect(ref.artists[0]).toEqual({ id: 'a9', name: '引用歌手' })
    expect(ref.album?.coverUrl).toBe('https://cover.mock/x.jpg')
  })

  it('coerceTrack：裸 id / TrackData / 含 track 的响应 三种都吃', () => {
    expect(coerceTrack('7001')?.id).toBe('7001')
    expect(coerceTrack(track)?.name).toBe('晴天（mock）')
    expect(coerceTrack({ entity: { track_wrapper: { track } } })?.id).toBe('7001')
  })
})

describe('collectTracks：递归捞 + 按 id 去重', () => {
  it('嵌套多层的曲目都能捞到，重复 id 只留一份', () => {
    const root = {
      a: [{ entity: { track_wrapper: { track } } }],
      b: {
        deep: [
          { entity: { track_wrapper: { track: trackEntity('7001', '同 id 重复') } } },
          { entity: { track: trackEntity('7002') } },
        ],
      },
    }
    const list = collectTracks(root)
    expect(list.map((t) => t.id).sort()).toEqual(['7001', '7002'])
  })

  it('limit 生效', () => {
    const root = [track, trackEntity('7002'), trackEntity('7003')].map((t) => ({ entity: { track: t } }))
    expect(collectTracks(root, {}, 2)).toHaveLength(2)
  })
})

describe('parseChart：track_ranks → ranks', () => {
  it('名次/涨跌解析，ranked_track 壳也认', () => {
    const chart = parseChart({
      id: 'chart-1',
      title: 'mock 榜',
      track_ranks: [
        { rank: { rank: 1, rank_type: 'up', rank_delta: '2' }, track: { entity: { track_wrapper: { track } } } },
        { rank: { rank: 2 }, track: { ranked_track: { track: trackEntity('7002') } } },
      ],
    })
    expect(chart.ranks).toHaveLength(2)
    expect(chart.ranks[0]).toMatchObject({ rank: 1, trend: 'up', delta: '2' })
    expect(chart.ranks[1]?.track.id).toBe('7002')
  })

  it('上游实测不给 rank 数字（只有 rank_type/delta）→ 按数组位次补名次', () => {
    const chart = parseChart({
      id: 'chart-1',
      track_ranks: [
        {
          rank: { rank_type: 'up', rank_delta: '5', track_id: '7001' },
          track: { entity: { track_wrapper: { track } } },
        },
        { rank: { rank_type: 'up', rank_delta: '16' }, track: trackEntity('7002') },
      ],
    })
    expect(chart.ranks.map((r) => r.rank)).toEqual([1, 2])
    expect(chart.ranks[0]).toMatchObject({ trend: 'up', delta: '5' })
  })
})
