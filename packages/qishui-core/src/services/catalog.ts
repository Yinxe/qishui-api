import { getShareMeta, type ShareMeta } from 'qishui-api'
import type { QishuiCore } from '../core.js'
import { Album, Artist, Chart, Playlist, Track } from '../entities.js'
import { CoreError } from '../errors.js'
import { asAlbum, asArtist, asPlaylist, asTrack, collectAlbums, collectTracks, parseChart, parseTrackRef } from '../parse.js'
import type { AlbumData, ChartData, Paged, TrackData } from '../types.js'
import { num, str } from '../util.js'

/** 一次 MGetMedia 送多少 id（实测 20 条没问题，留余量） */
const BATCH = 50

export type CatalogCacheKind =
  | 'track'
  | 'album-detail'
  | 'artist-detail'
  | 'artist-tracks'
  | 'artist-albums'
  | 'playlist-detail'
  | 'chart'
  | 'related'
  | 'media-stats'

export interface PageOptions {
  cursor?: number
  count?: number
  refresh?: boolean
}

export interface MediaRef {
  id: string
  type: string
}

/**
 * 曲库：曲目 / 专辑 / 艺人 / 歌单 / 榜单的读。
 *
 * 曲目详情走 `MGetMedia`（`POST /luna/media`）—— 实测匿名可用、一次一批、
 * 直接给完整实体（album/artists/duration/label_info/stats/vid），不用去抓分享页 HTML。
 * 可播地址仍然只有分享页那条路（见 `core.media`）。
 */
export class CatalogService {
  constructor(private core: QishuiCore) {}

  private get api() {
    return this.core.api
  }

  private get parseOpts() {
    return { coverWidth: this.core.config.coverWidth }
  }

  /* ------------------------------------------------------------ 曲目 */

  /** 单首曲目详情 */
  async track(id: string, opts: { refresh?: boolean } = {}): Promise<Track> {
    const [track] = await this.tracks([id], opts)
    if (!track) throw new CoreError(`拿不到曲目 ${id}（MGetMedia 未返回该 track）`)
    return track
  }

  /** 批量曲目详情：本地缓存的直接命中（内存或磁盘，零网络），缺的一次 MGetMedia 补齐 */
  async tracks(ids: string[], opts: { refresh?: boolean } = {}): Promise<Track[]> {
    const unique = [...new Set(ids.filter(Boolean))]
    if (!unique.length) return []
    const found = new Map<string, Track>()
    const missing: string[] = []

    const resolved = await Promise.all(
      unique.map(async (id) => ({ id, data: opts.refresh ? undefined : await this.loadCached(id) })),
    )
    for (const { id, data } of resolved) {
      if (data) found.set(id, new Track(this.core, data))
      else missing.push(id)
    }

    for (let i = 0; i < missing.length; i += BATCH) {
      const chunk = missing.slice(i, i + BATCH)
      const res = await this.core.request('MGetMedia', {
        scene: 'playlist',
        media: chunk.map((id) => ({ id, type: 'track' })),
      })
      for (const item of res.media ?? []) {
        const data = asTrack(item?.entity, this.parseOpts)
        if (!data?.id) continue
        await this.core.cache.set('track', data.id, data)
        found.set(data.id, new Track(this.core, data))
      }
    }

    // 保持入参顺序，查不到的丢掉（上层按 id 对不上就是没有）
    return unique.map((id) => found.get(id)).filter((track): track is Track => !!track)
  }

  /** 单首曲目的本地缓存（先内存后磁盘；都没有就是 undefined，不发请求） */
  private async loadCached(id: string): Promise<TrackData | undefined> {
    return this.core.cache.peek<TrackData>('track', id) ?? (await this.core.cache.load<TrackData>('track', id))
  }

  /**
   * 曲目分享元数据：标题/歌手文案/封面 + 可播性权益标记 + 相关推荐。
   * 走 `GetShareInfo` + `MCheckMedia` + `GetRelatedMedia`（都是 qishui-api 包里的 `getShareMeta`）。
   */
  async trackMeta(id: string, opts: { relatedCount?: number; refresh?: boolean } = {}): Promise<ShareMeta> {
    return await getShareMeta({ kind: 'track', id }, this.api, {
      cover_width: this.core.config.coverWidth,
      related_count: opts.relatedCount ?? 8,
    })
  }

  /**
   * 批量可播性/权益检查（VIP、无版权、下架）。字段名是 `media_list`。
   * 实测匿名可用（`MGetMedia` 同族的 `MCheckTrack` 也可用，见 `checkTracks`）。
   */
  async check(media: MediaRef[]): Promise<any[]> {
    if (!media.length) return []
    const res = await this.core.request('MCheckMedia', {
      media_list: media.map((m) => ({ id: m.id, type: m.type })),
      scene: 0,
      scene_name: '',
      queue_type: '',
    })
    return res.media_status ?? []
  }

  /** 按曲目 id 批量查可播状态（`MCheckTrack`，匿名可用；回 `track_status[]`） */
  async checkTracks(trackIds: string[]): Promise<any[]> {
    if (!trackIds.length) return []
    const res = await this.core.request('MCheckTrack', { track_ids: trackIds, scene: 0 })
    return res.track_status ?? []
  }

  /** 收藏数/评论数/分享数 */
  async stats(id: string, opts: { refresh?: boolean } = {}): Promise<{ collected?: number; comment?: number; shared?: number }> {
    const { value } = await this.core.cache.fetch<any>(
      'media-stats',
      id,
      () => this.core.request('GetMediaStats', { media_id: id, media_type: 'track' }),
      { force: opts.refresh, ttlMs: 5 * 60_000 },
    )
    return {
      collected: num(value.stats?.count_collected),
      comment: num(value.stats?.count_comment),
      shared: num(value.stats?.count_shared),
    }
  }

  /** 相关推荐（播放页「相似歌曲」） */
  async related(id: string, count = 8, opts: { refresh?: boolean } = {}): Promise<Track[]> {
    const { value } = await this.core.cache.fetch<any>(
      'related',
      `${id}-${count}`,
      () =>
        this.core.request('GetRelatedMedia', {
          media_list: [{ id, type: 'track' }],
          full_media: true,
          req_count: count,
        }),
      { force: opts.refresh, ttlMs: 30 * 60_000 },
    )
    const items = Array.isArray(value.items) ? value.items : []
    const tracks = items.map((item: unknown) => asTrack(item, this.parseOpts)).filter(Boolean) as TrackData[]
    return (tracks.length ? tracks : collectTracks(value, this.parseOpts, count)).slice(0, count).map((d) => new Track(this.core, d))
  }

  /** 用分享接口给的轻量引用造 Track（GetShareInfo/GetRelatedMedia 的短字段版） */
  trackFromRef(raw: unknown): Track | undefined {
    const data = parseTrackRef(raw, this.parseOpts)
    return data.id ? new Track(this.core, data) : undefined
  }

  /* ------------------------------------------------------------ 专辑 */

  private async albumDetail(id: string, refresh?: boolean): Promise<any> {
    return (
      await this.core.cache.fetch<any>('album-detail', id, () => this.core.request('GetAlbumDetail', { album_id: id, ignore_tracks: false }), {
        force: refresh,
      })
    ).value
  }

  async album(id: string, opts: { refresh?: boolean } = {}): Promise<Album> {
    const res = await this.albumDetail(id, opts.refresh)
    const data = asAlbum(res.album_info, this.parseOpts)
    if (!data) throw new CoreError(`专辑 ${id} 的响应里没有 album_info`)
    return new Album(this.core, data)
  }

  /** 专辑曲目（GetAlbumDetail 一次给全，不分页） */
  async albumTracks(id: string, opts: { refresh?: boolean } = {}): Promise<Track[]> {
    const res = await this.albumDetail(id, opts.refresh)
    const list = Array.isArray(res.tracks) ? res.tracks : []
    const parsed = list.map((t: unknown) => asTrack(t, this.parseOpts)).filter(Boolean) as TrackData[]
    return (parsed.length ? parsed : collectTracks(res, this.parseOpts)).map((d) => new Track(this.core, d))
  }

  /* ------------------------------------------------------------ 艺人 */

  private async artistDetail(id: string, refresh?: boolean): Promise<any> {
    return (
      await this.core.cache.fetch<any>('artist-detail', id, () => this.core.request('GetArtistDetail', { artist_id: id, locate_item_id: 0 }), {
        force: refresh,
      })
    ).value
  }

  async artist(id: string, opts: { refresh?: boolean } = {}): Promise<Artist> {
    const res = await this.artistDetail(id, opts.refresh)
    const data = asArtist(res.artist_info, this.parseOpts)
    if (!data) throw new CoreError(`艺人 ${id} 的响应里没有 artist_info`)
    return new Artist(this.core, data)
  }

  /** 艺人热门曲目（GetArtistDetail 里带的那批） */
  async artistHotTracks(id: string, opts: { refresh?: boolean } = {}): Promise<Track[]> {
    const res = await this.artistDetail(id, opts.refresh)
    const list = Array.isArray(res.hot_tracks) ? res.hot_tracks : []
    const parsed = list.map((t: unknown) => asTrack(t, this.parseOpts)).filter(Boolean) as TrackData[]
    return (parsed.length ? parsed : collectTracks(res, this.parseOpts)).map((d) => new Track(this.core, d))
  }

  /** 艺人全部曲目（分页） */
  async artistTracks(id: string, opts: PageOptions = {}): Promise<Paged<Track>> {
    const cursor = opts.cursor ?? 0
    const count = opts.count ?? 20
    const { value } = await this.core.cache.fetch<any>(
      'artist-tracks',
      `${id}-${cursor}-${count}`,
      () => this.core.request('ListArtistTracks', { artist_id: id, cursor, count }),
      { force: opts.refresh, ttlMs: 30 * 60_000 },
    )
    const list = Array.isArray(value.tracks) ? value.tracks : []
    const parsed = list.map((t: unknown) => asTrack(t, this.parseOpts)).filter(Boolean) as TrackData[]
    return {
      items: (parsed.length ? parsed : collectTracks(value, this.parseOpts, count)).map((d) => new Track(this.core, d)),
      hasMore: Boolean(value.has_more),
      cursor: str(value.next_cursor),
      raw: value,
    }
  }

  /** 艺人专辑（分页） */
  async artistAlbums(id: string, opts: PageOptions = {}): Promise<Paged<Album>> {
    const cursor = opts.cursor ?? 0
    const count = opts.count ?? 20
    const { value } = await this.core.cache.fetch<any>(
      'artist-albums',
      `${id}-${cursor}-${count}`,
      () => this.core.request('ListArtistAlbums', { artist_id: id, cursor, count }),
      { force: opts.refresh, ttlMs: 30 * 60_000 },
    )
    const list = Array.isArray(value.albums) ? value.albums : []
    const parsed = list.map((a: unknown) => asAlbum(a, this.parseOpts)).filter(Boolean) as AlbumData[]
    return {
      items: (parsed.length ? parsed : collectAlbums(value, this.parseOpts, count)).map((d) => new Album(this.core, d)),
      hasMore: Boolean(value.has_more),
      cursor: str(value.next_cursor),
      raw: value,
    }
  }

  /* ------------------------------------------------------------ 歌单 */

  async playlist(id: string, opts: { refresh?: boolean } = {}): Promise<Playlist> {
    const res = await this.playlistDetail(id, 0, 20, opts.refresh)
    const data = asPlaylist(res.playlist, this.parseOpts)
    if (!data) throw new CoreError(`歌单 ${id} 的响应里没有 playlist`)
    return new Playlist(this.core, data)
  }

  private async playlistDetail(id: string, cursor: number, count: number, refresh?: boolean): Promise<any> {
    return (
      await this.core.cache.fetch<any>(
        'playlist-detail',
        `${id}-${cursor}-${count}`,
        () =>
          this.core.request('GetPlaylistDetail', {
            playlist_id: id,
            cursor,
            count,
            session_id: '',
            reverse: false,
            ab_param: '',
          }),
        { force: refresh, ttlMs: 10 * 60_000 },
      )
    ).value
  }

  /** 歌单曲目（分页；`media_resources` 才是曲目列表） */
  async playlistTracks(id: string, opts: PageOptions = {}): Promise<Paged<Track>> {
    const cursor = opts.cursor ?? 0
    const count = opts.count ?? 20
    const res = await this.playlistDetail(id, cursor, count, opts.refresh)
    const list = Array.isArray(res.media_resources) ? res.media_resources : []
    const parsed = list.map((item: unknown) => asTrack(item, this.parseOpts)).filter(Boolean) as TrackData[]
    return {
      items: (parsed.length ? parsed : collectTracks(res, this.parseOpts, count)).map((d) => new Track(this.core, d)),
      hasMore: Boolean(res.has_more),
      cursor: str(res.next_cursor),
      raw: res,
    }
  }

  /* ------------------------------------------------------------ 榜单 */

  async chart(id: string, opts: { refresh?: boolean } = {}): Promise<Chart> {
    const { value } = await this.core.cache.fetch<any>('chart', id, () => this.core.request('GetChartDetail', { chart_id: id }), {
      force: opts.refresh,
      ttlMs: 10 * 60_000,
    })
    const data: ChartData = parseChart(value.chart ?? {}, this.parseOpts)
    return new Chart(this.core, data)
  }

  /** 清曲库缓存（`kind` 省略就全清） */
  async clearCache(kind?: CatalogCacheKind): Promise<void> {
    const kinds: CatalogCacheKind[] = kind
      ? [kind]
      : ['track', 'album-detail', 'artist-detail', 'artist-tracks', 'artist-albums', 'playlist-detail', 'chart', 'related', 'media-stats']
    for (const k of kinds) await this.core.cache.invalidate(k, undefined)
  }
}
