import type { QishuiCore } from '../core.js'
import { Album, Artist, Playlist, Track, User } from '../entities.js'
import { asAlbum, asArtist, asPlaylist, asTrack, asUser, collectPlaylists, collectTracks, imageUrl } from '../parse.js'
import type { TrackData } from '../types.js'
import { str } from '../util.js'

/** 内容块里的一条资源：原始响应 + 按形状识别出来的实体（识别不出来就只留 type/id） */
export interface DiscoverResource {
  type: string
  id: string
  raw: unknown
  track?: Track
  playlist?: Playlist
  album?: Album
  artist?: Artist
  user?: User
}

export interface DiscoverInner {
  type: string
  title?: string
  /** 场景队列（discover_radio）/ 榜单块（discover_track_top_list）的 id —— 就是 radio_id / chart_id */
  id?: string
  resources: DiscoverResource[]
}

export interface DiscoverBlock {
  type: string
  title?: string
  inner: DiscoverInner[]
}

export interface HomeView {
  blocks: DiscoverBlock[]
  /** 整个首页里捞出来的曲目（去重，按出现顺序） */
  tracks: Track[]
  /** 整个首页里捞出来的歌单 */
  playlists: Playlist[]
  raw: unknown
}

export interface LaunchInfo {
  /** 冷启动要弹的初始偏好选择（曲风/语种） */
  boost?: {
    genres: { id?: string; name?: string; coverUrl?: string }[]
    langs: { code?: string; name?: string; iconUrl?: string }[]
    needSet?: boolean
  }
  raw: unknown
}

export type HomeLayout = 'grid' | 'feed'

/**
 * 发现 / 推荐：
 *  - `home()` = `DiscoverView` 推荐页版（空 body）：榜单块 + 歌单推荐 + 场景队列，一次 159 条资源；
 *  - `home({layout:'feed'})` = 听歌模式版：30 个 `discover_radio` 场景队列，**没有榜单块**；
 *  - `mix()` = 单个内容块下钻（`DiscoverMix`）。
 *
 * 返回值已经把 `blocks[].inner_block[].resources[].entity` 剥成实体，
 * 榜单块的 `inner.id` 直接能喂 `core.catalog.chart()`，场景队列的 `inner.id` 能喂 `radioTracks()`。
 */
export class DiscoverService {
  constructor(private core: QishuiCore) {}

  private get parseOpts() {
    return { coverWidth: this.core.config.coverWidth }
  }

  /** 首页大盘 */
  async home(opts: { layout?: HomeLayout; refresh?: boolean } = {}): Promise<HomeView> {
    const layout = opts.layout ?? 'grid'
    const { value } = await this.core.cache.fetch<any>(
      'discover-home',
      layout,
      () =>
        this.core.request(
          'DiscoverView',
          layout === 'feed' ? { first_request: true, pc_new_discover_request: true } : {},
        ),
      { force: opts.refresh, ttlMs: 10 * 60_000 },
    )
    return this.toHomeView(value)
  }

  toHomeView(raw: any): HomeView {
    const blocks: DiscoverBlock[] = (Array.isArray(raw?.blocks) ? raw.blocks : []).map((block: any) => ({
      type: str(block?.type) ?? '',
      title: str(block?.title),
      inner: (Array.isArray(block?.inner_block) ? block.inner_block : []).map((inner: any) => ({
        type: str(inner?.type) ?? '',
        title: str(inner?.title),
        id: str(inner?.inner_block_id),
        resources: (Array.isArray(inner?.resources) ? inner.resources : []).map((res: unknown) => this.toResource(res)),
      })),
    }))
    const tracks = collectTracks(raw, this.parseOpts).map((d) => new Track(this.core, d))
    const playlists = collectPlaylists(raw, this.parseOpts).map((d) => new Playlist(this.core, d))
    return { blocks, tracks, playlists, raw }
  }

  /** 单个内容块下钻：给 `block_type`（如 `discover_playlist`）→ 一批同类型内容块 */
  async mix(opts: { blockType: string; subChannelId?: string; refresh?: boolean }): Promise<DiscoverInner[]> {
    const { value } = await this.core.cache.fetch<any>(
      'discover-mix',
      `${opts.blockType}-${opts.subChannelId ?? ''}`,
      () =>
        this.core.request('DiscoverMix', {
          block_type: opts.blockType,
          sub_channel_id: opts.subChannelId ?? opts.blockType,
        }),
      { force: opts.refresh, ttlMs: 10 * 60_000 },
    )
    return (Array.isArray(value.inner_block) ? value.inner_block : []).map((inner: any) => ({
      type: str(inner?.type) ?? '',
      title: str(inner?.title),
      id: str(inner?.inner_block_id),
      resources: (Array.isArray(inner?.resources) ? inner.resources : []).map((res: unknown) => this.toResource(res)),
    }))
  }

  /** 「随便听听」的单曲推荐 tab（一次 6 首，含完整 album/artists） */
  async feedSongTab(opts: { refresh?: boolean } = {}): Promise<Track[]> {
    const { value } = await this.core.cache.fetch<any>('feed-song-tab', 'self', () => this.core.request('FeedSongTab', {}), {
      force: opts.refresh,
      ttlMs: 5 * 60_000,
    })
    const list = Array.isArray(value.items) ? value.items : []
    const parsed = list.map((item: unknown) => asTrack(item, this.parseOpts)).filter(Boolean) as TrackData[]
    return (parsed.length ? parsed : collectTracks(value, this.parseOpts, 20)).map((d) => new Track(this.core, d))
  }

  /** 歌单广场（分类歌单页的数据源） */
  async playlistSquare(opts: { categoryId?: string; refresh?: boolean } = {}): Promise<{ playlists: Playlist[]; categories: any[] }> {
    const categoryId = opts.categoryId ?? ''
    const { value } = await this.core.cache.fetch<any>(
      'playlist-square',
      categoryId,
      () => this.core.request('FeedPlaylistSquare', { category_id: categoryId }),
      { force: opts.refresh, ttlMs: 10 * 60_000 },
    )
    const list = Array.isArray(value.items) ? value.items : []
    const playlists = list
      .map((item: unknown) => asPlaylist(item, this.parseOpts))
      .filter(Boolean)
      .map((d: any) => new Playlist(this.core, d))
    return { playlists, categories: Array.isArray(value.categories) ? value.categories : [] }
  }

  /**
   * 电台/场景队列的曲目流（无限电台的续播来源）。
   * `radioId` = 首页 `discover_radio` 块的 `inner.id`。
   */
  async radioTracks(radioId: string, opts: { refresh?: boolean } = {}): Promise<Track[]> {
    const { value } = await this.core.cache.fetch<any>('radio-tracks', radioId, () => this.core.request('FeedRadioTracks', { radio_id: radioId }), {
      force: opts.refresh,
      ttlMs: 5 * 60_000,
    })
    return collectTracks(value, this.parseOpts, 50).map((d) => new Track(this.core, d))
  }

  /** Feed 模式配置（推荐流的路由表：preference_mode / scene_mode 的枚举与文案） */
  async feedMode(opts: { refresh?: boolean } = {}): Promise<any> {
    return (await this.core.cache.fetch<any>('feed-mode', 'self', () => this.core.request('FeedMode', {}), { force: opts.refresh, ttlMs: 30 * 60_000 })).value
  }

  /** 精选内容（实测回空 body —— 不可用的推荐位，保接口但别指望有数据） */
  async featuredContents(opts: { cursor?: number; count?: number; refresh?: boolean } = {}): Promise<any> {
    return (
      await this.core.cache.fetch<any>(
        'featured',
        `${opts.cursor ?? 0}-${opts.count ?? 20}`,
        () => this.core.request('GetFeaturedContents', { cursor: opts.cursor ?? 0, count: opts.count ?? 20 }),
        { force: opts.refresh, ttlMs: 30 * 60_000 },
      )
    ).value
  }

  /** 冷启动第一个接口：灰度开关 + 初始偏好（曲风/语种） */
  async launch(opts: { refresh?: boolean } = {}): Promise<LaunchInfo> {
    const { value } = await this.core.cache.fetch<any>('launch', 'self', () => this.core.request('Launch', {}), {
      force: opts.refresh,
      ttlMs: 30 * 60_000,
    })
    const boost = value.boost_setting
    return {
      boost: boost
        ? {
            genres: (Array.isArray(boost.genres) ? boost.genres : []).map((g: any) => ({
              id: str(g?.genre_id),
              name: str(g?.name),
              coverUrl: imageUrl(g?.url_pic, this.parseOpts),
            })),
            langs: (Array.isArray(boost.langs) ? boost.langs : []).map((l: any) => ({
              code: str(l?.lang_code),
              name: str(l?.name),
              iconUrl: imageUrl(l?.url_icon, this.parseOpts),
            })),
            needSet: typeof boost.need_set === 'boolean' ? boost.need_set : undefined,
          }
        : undefined,
      raw: value,
    }
  }

  private toResource(node: any): DiscoverResource {
    const type = str(node?.type ?? node?.fallback_type) ?? ''
    const entity = node?.entity ?? node
    const track = asTrack(entity, this.parseOpts)
    const playlist = track ? undefined : asPlaylist(entity, this.parseOpts)
    const album = track || playlist ? undefined : asAlbum(entity, this.parseOpts)
    const artist = track || playlist || album ? undefined : asArtist(entity, this.parseOpts)
    const user = track || playlist || album || artist ? undefined : asUser(entity, this.parseOpts)
    const inner = track ?? playlist ?? album ?? artist ?? user
    return {
      type,
      id: inner?.id ?? str(node?.resource_id) ?? '',
      raw: node,
      track: track ? new Track(this.core, track) : undefined,
      playlist: playlist ? new Playlist(this.core, playlist) : undefined,
      album: album ? new Album(this.core, album) : undefined,
      artist: artist ? new Artist(this.core, artist) : undefined,
      user: user ? new User(this.core, user) : undefined,
    }
  }
}
