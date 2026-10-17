import { randomUUID } from 'node:crypto'
import type { QishuiCore } from '../core.js'
import { Album, Artist, Playlist, Track, User } from '../entities.js'
import { asAlbum, asArtist, asPlaylist, asTrack, asUser, collectUsers, parseUser } from '../parse.js'
import { str } from '../util.js'

export type SearchType = 'all' | 'track' | 'album' | 'artist' | 'playlist' | 'user' | 'video'

export interface SearchGroup {
  id?: string
  /** 结果分组标题（榜单/歌手/专辑…） */
  title?: string
  /** 2023 版才有的展示类型 */
  type?: string
  cursor?: string
  hasMore: boolean
  tracks: Track[]
  albums: Album[]
  artists: Artist[]
  playlists: Playlist[]
  users: User[]
  raw: unknown
}

export interface SearchResult {
  query: string
  groups: SearchGroup[]
  raw: unknown
}

export interface SearchPageOptions {
  type?: SearchType
  cursor?: string
  refresh?: boolean
  /** 用 h5 版（`Search2023`，需登录）；默认用 `/luna/search`（匿名可用，实体更全） */
  h5?: boolean
}

export interface SuggestItem {
  keyword: string
  type?: string
  groupId?: string
  raw?: unknown
}

/**
 * 搜索。
 *  - 默认走 `Search`（`/luna/search/<type>`，**匿名可用**，track 一次 ~114KB 完整实体）；
 *    注意 transport 会自动从死掉的 pc 变体回退到这条；
 *  - `h5:true` 走 `Search2023`（`/luna/h5/search`，带会话可用，结果在 `result_groups[].data`）；
 *  - 联想词走 `Sug`，推荐搜索词走 `SuggestWords`，分类 tab 走 `SearchCategories`。
 */
export class SearchService {
  constructor(private core: QishuiCore) {}

  private get parseOpts() {
    return { coverWidth: this.core.config.coverWidth }
  }

  /** 通用搜索（结果已按类型拆好，`groups` 里同时保留原始分组） */
  async search(query: string, opts: SearchPageOptions = {}): Promise<SearchResult> {
    const type = opts.type ?? 'track'
    const cursor = opts.cursor ?? '0'
    const h5 = opts.h5 ?? false
    const key = `${h5 ? 'h5' : 'luna'}-${type}-${cursor}`
    const { value } = await this.core.cache.fetch<any>(
      'search',
      `${key}-${query}`,
      () =>
        this.core.request(h5 ? 'Search2023' : 'Search', {
          search_type: type,
          q: query,
          cursor,
          search_id: randomUUID(),
          search_method: 'track',
          from_search_id: '',
          search_scene: '',
        }),
      { force: opts.refresh, ttlMs: 5 * 60_000 },
    )
    const groups: SearchGroup[] = (Array.isArray(value.result_groups) ? value.result_groups : []).map((group: any) => {
      const items = Array.isArray(group.items) ? group.items : Array.isArray(group.data) ? group.data : []
      const tracks: Track[] = []
      const albums: Album[] = []
      const artists: Artist[] = []
      const playlists: Playlist[] = []
      const users: User[] = []
      for (const item of items) {
        const entity = item?.entity ?? item
        const track = asTrack(entity, this.parseOpts)
        if (track) {
          tracks.push(new Track(this.core, track))
          continue
        }
        const album = asAlbum(entity, this.parseOpts)
        if (album) {
          albums.push(new Album(this.core, album))
          continue
        }
        const artist = asArtist(entity, this.parseOpts)
        if (artist) {
          artists.push(new Artist(this.core, artist))
          continue
        }
        const playlist = asPlaylist(entity, this.parseOpts)
        if (playlist) {
          playlists.push(new Playlist(this.core, playlist))
          continue
        }
        const user = asUser(entity, this.parseOpts)
        if (user) users.push(new User(this.core, user))
      }
      return {
        id: str(group.id),
        title: str(group.display_title ?? group.title),
        type: str(group.display_type),
        cursor: str(group.next_cursor),
        hasMore: Boolean(group.has_more),
        tracks,
        albums,
        artists,
        playlists,
        users,
        raw: group,
      }
    })
    return { query, groups, raw: value }
  }

  /** 只搜曲目 */
  async tracks(query: string, opts: Omit<SearchPageOptions, 'type'> = {}): Promise<Track[]> {
    const result = await this.search(query, { ...opts, type: 'track' })
    return result.groups.flatMap((g) => g.tracks)
  }

  async albums(query: string, opts: Omit<SearchPageOptions, 'type'> = {}): Promise<Album[]> {
    return (await this.search(query, { ...opts, type: 'album' })).groups.flatMap((g) => g.albums)
  }

  async artists(query: string, opts: Omit<SearchPageOptions, 'type'> = {}): Promise<Artist[]> {
    return (await this.search(query, { ...opts, type: 'artist' })).groups.flatMap((g) => g.artists)
  }

  async playlists(query: string, opts: Omit<SearchPageOptions, 'type'> = {}): Promise<Playlist[]> {
    return (await this.search(query, { ...opts, type: 'playlist' })).groups.flatMap((g) => g.playlists)
  }

  async users(query: string, opts: Omit<SearchPageOptions, 'type'> = {}): Promise<User[]> {
    return (await this.search(query, { ...opts, type: 'user' })).groups.flatMap((g) => g.users)
  }

  /** 综合搜索（`all`）里所有曲目 */
  async all(query: string, opts: Omit<SearchPageOptions, 'type'> = {}): Promise<SearchResult> {
    return await this.search(query, { ...opts, type: 'all' })
  }

  /** 搜索框下拉联想（只回词条，不回实体） */
  async suggest(query: string, opts: { refresh?: boolean } = {}): Promise<SuggestItem[]> {
    const { value } = await this.core.cache.fetch<any>('sug', query, () => this.core.request('Sug', { q: query, sug_scene: 'search_sug', sug_search_id: '' }), {
      force: opts.refresh,
      ttlMs: 30 * 60_000,
    })
    const list = Array.isArray(value.sugs) ? value.sugs : []
    return list.map((sug: any) => ({
      keyword: str(sug?.suggestion ?? sug?.keyword) ?? '',
      type: str(sug?.content_type),
      groupId: str(sug?.group_id),
      raw: sug,
    }))
  }

  /** 推荐搜索词（首页搜索框的「猜你想搜」，6 条，带实体 id） */
  async recommendWords(opts: { refresh?: boolean } = {}): Promise<SuggestItem[]> {
    const { value } = await this.core.cache.fetch<any>('suggest-words', 'recommendation', () => this.core.request('SuggestWords', { suggest_type: 'recommendation' }), {
      force: opts.refresh,
      ttlMs: 30 * 60_000,
    })
    const list = Array.isArray(value.suggest_words) ? value.suggest_words : []
    return list.map((word: any) => ({
      keyword: str(word?.keyword) ?? '',
      type: str(word?.type),
      groupId: str(word?.group_id),
      raw: word,
    }))
  }

  /** 搜索页分类 tab（7 个：综合/歌曲/视频/歌手/专辑/歌单/用户） */
  async categories(opts: { refresh?: boolean } = {}): Promise<{ type: string; name: string }[]> {
    const { value } = await this.core.cache.fetch<any>('categories', 'self', () => this.core.request('SearchCategories', {}), {
      force: opts.refresh,
      ttlMs: 24 * 60 * 60 * 1000,
    })
    const tabs = Array.isArray(value.search_category_tabs) ? value.search_category_tabs : []
    return tabs.map((tab: any) => ({ type: str(tab?.search_type) ?? '', name: str(tab?.name) ?? '' }))
  }

  /** 搜索页聚合块（热搜/热歌榜）；实测 `search_chart_block` 恒空（那是 h5/移动端的东西） */
  async hotBoard(opts: { refresh?: boolean } = {}): Promise<any> {
    return (await this.core.cache.fetch<any>('search-block', 'self', () => this.core.request('GetSearchBlock', {}), { force: opts.refresh, ttlMs: 10 * 60_000 })).value
  }

  /** 从搜索响应里捞用户（少数场景用） */
  usersIn(raw: unknown): User[] {
    return collectUsers(raw).map((u) => new User(this.core, parseUser(u)))
  }

  /** 榜单快捷入口：`chart_id` 也能从搜索/发现块里来，这里只做转发 */
  chart(chartId: string) {
    return this.core.catalog.chart(chartId)
  }
}
