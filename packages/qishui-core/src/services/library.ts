import { CacheTtl } from '../cache/policy.js'
import type { QishuiCore } from '../core.js'
import { Artist, Playlist, Track } from '../entities.js'
import { CoreError } from '../errors.js'
import { asPlaylist, asTrack, collectArtists, collectPlaylists, collectTracks, parseArtist } from '../parse.js'
import type { Paged, PlaylistData, TrackData } from '../types.js'
import { str } from '../util.js'

export interface PlaylistPatch {
  title?: string
  description?: string
  /** true = 私有（CreatePlaylist/UpdatePlaylistInfo 的 `is_private`） */
  isPrivate?: boolean
}

export interface CollectTarget {
  id: string
  type: 'track' | 'album' | 'artist' | 'playlist' | (string & {})
}

/**
 * 我的音乐：歌单与收藏的读 + 写，以及最近播放。
 *
 * 写接口的约定（对齐 qishui-api 的实测口径）：
 *  - 全部是显式方法，不会替上层偷偷写（playback 上报默认也是关的）；
 *  - 每次写完**按需失效**相关缓存，下一次读拿到的是服务端真值；
 *  - 批量接口的字段名两套：歌单加歌用 `media[]`，收藏批量用 `media[]`，
 *    而 `MCheckMedia` 那类可播性检查是 `media_list[]` —— 别记混。
 */
export class LibraryService {
  constructor(private core: QishuiCore) {}

  private get parseOpts() {
    return { coverWidth: this.core.config.coverWidth }
  }

  private async invalidate(...kinds: { kind: string; id?: string }[]): Promise<void> {
    for (const item of kinds) await this.core.cache.invalidate(item.kind, item.id)
  }

  /**
   * 收藏/歌单类写操作后统一失效的读缓存。
   * 全清这六档是有意的：一条写会同时影响「我喜欢」「我的歌单」「混排收藏」「关注艺人」「我的」页计数，
   * 以及**「我喜欢的音乐」那张歌单自己的曲目页**——`likedTracks()` 是从 `playlist-detail` 重算出来的，
   * 不清它，取消喜欢后读回的仍是旧页（同一首按多少次都是「已取消收藏」，条目也不从列表里走）。
   * 逐个推断容易漏；都是小文件，多删几个比留下错值便宜。
   */
  private collectionCache(): { kind: string; id?: string }[] {
    return [
      { kind: 'my-playlists', id: 'self' },
      { kind: 'liked-tracks', id: 'list' },
      { kind: 'mixed-collections', id: 'self' },
      { kind: 'artist-collection' },
      { kind: 'me', id: 'self' },
      { kind: 'playlist-detail' },
    ]
  }

  /** 动了哪些实体就按 id 清它们的详情（详情是 `viewer` 档，里面嵌着「我是否收藏/关注」） */
  private async invalidateSubjects(kind: string, ids: string[]): Promise<void> {
    for (const id of ids) await this.core.cache.invalidate(kind, id)
  }

  /* ------------------------------------------------------------ 我的歌单（读） */

  /** 我的歌单（含「我喜欢的音乐」type=1、「抖音收藏」type=4） */
  async playlists(opts: { refresh?: boolean } = {}): Promise<Playlist[]> {
    const { value } = await this.core.cache.fetch<any>(
      'my-playlists',
      'self',
      () => this.core.request('GetMyPlaylists', { cursor: 0, count: 50, ab_param: '' }),
      { force: opts.refresh, ttlMs: CacheTtl.account },
    )
    const list = Array.isArray(value.playlists) ? value.playlists : []
    return (list.map((p: unknown) => asPlaylist(p, this.parseOpts)).filter(Boolean) as PlaylistData[]).map(
      (d) => new Playlist(this.core, d),
    )
  }

  /** 「我喜欢的音乐」那张自动歌单 */
  async likedPlaylist(opts: { refresh?: boolean } = {}): Promise<Playlist | undefined> {
    const playlists = await this.playlists(opts)
    return playlists.find((p) => p.isLikedList) ?? playlists.find((p) => /喜欢/.test(p.title))
  }

  /** 我收藏的曲目（= 我喜欢的音乐里的曲目；整张翻完，结果缓存 5 分钟） */
  async likedTracks(opts: { refresh?: boolean } = {}): Promise<Track[]> {
    const { value } = await this.core.cache.fetch<{ tracks: TrackData[] }>(
      'liked-tracks',
      'list',
      async () => {
        const liked = await this.likedPlaylist({ refresh: opts.refresh })
        if (!liked) return { tracks: [] }
        const all = await liked.allTracks()
        return { tracks: all.map((t) => t.data) }
      },
      { force: opts.refresh, ttlMs: CacheTtl.account },
    )
    return value.tracks.map((d) => new Track(this.core, d))
  }

  /** 这首歌在不在「我喜欢」里 */
  async isLiked(trackId: string): Promise<boolean> {
    const tracks = await this.likedTracks()
    return tracks.some((t) => t.id === trackId)
  }

  /** 我收藏/关注的其它东西（歌单+专辑混排，不含曲目） */
  async mixedCollections(opts: { refresh?: boolean } = {}): Promise<{ playlists: Playlist[]; raw: unknown }> {
    const { value } = await this.core.cache.fetch<any>(
      'mixed-collections',
      'self',
      () => this.core.request('GetMyMixedCollections', { cursor: 0, count: 50 }),
      { force: opts.refresh, ttlMs: CacheTtl.account },
    )
    return {
      playlists: (collectPlaylists(value, this.parseOpts) ?? []).map((d) => new Playlist(this.core, d)),
      raw: value,
    }
  }

  /**
   * 我关注的艺人。
   * 实测读写两个方向都落地：`CollectArtists` 之后 `GetArtistCollection` 立刻读到该艺人
   * （项里带 `state.is_collected`/`follow_status=1`），`MDeleteCollectedArtists` 之后条目真的走掉。
   * 翻页的 `cursor` 是上游游标（形如 `1774117995_0`），首页传 0，往后原样回传 `next_cursor`。
   */
  async collectedArtists(
    opts: { cursor?: number | string; count?: number; refresh?: boolean } = {},
  ): Promise<Paged<Artist>> {
    const cursor = opts.cursor ?? 0
    const count = opts.count ?? 20
    const uid = await this.core.account.uid()
    if (!uid) throw new CoreError('collectedArtists() 需要登录态（拿不到自己的 uid）')
    const { value } = await this.core.cache.fetch<any>(
      'artist-collection',
      `${uid}-${cursor}-${count}`,
      () => this.core.request('GetUserArtistCollection', { user_id: uid, cursor, count }),
      { force: opts.refresh, ttlMs: CacheTtl.account },
    )
    const list = Array.isArray(value.artists) ? value.artists : collectArtists(value)
    return {
      items: list.map((a: unknown) => new Artist(this.core, parseArtist(a, this.parseOpts))),
      hasMore: Boolean(value.has_more),
      cursor: str(value.next_cursor),
      total: typeof value.total_num === 'number' ? value.total_num : undefined,
      raw: value,
    }
  }

  /**
   * 最近播放（上游的，不是本地历史）。
   *
   * 读的是 `GetRecentPlayedTracks`（`/luna/me/recently-played`，实测 201 条真数据）。
   * 别换回 `GetRecentPlayedMedia`（`/luna/pc/me/recently-played-media`）：那是另一张表，
   * 同一账号同一登录态下，`media_type` 0/1/2/3、`scene` 空或 `home` 全都只回 `{}`。
   * 分页的 `cursor` 是上游给的游标（曲目是偏移量、艺人收藏是 `1774117995_0` 这种串），
   * 首页传 0，往后必须把上一页的 `next_cursor` 原样传回去。
   */
  async recent(opts: { cursor?: number | string; count?: number; refresh?: boolean } = {}): Promise<Paged<Track>> {
    const cursor = opts.cursor ?? 0
    const count = opts.count ?? 20
    const { value } = await this.core.cache.fetch<any>(
      'recent-played',
      `${cursor}-${count}`,
      () => this.core.request('GetRecentPlayedTracks', { cursor, count }),
      { force: opts.refresh, ttlMs: CacheTtl.none },
    )
    const list = Array.isArray(value.tracks) ? value.tracks : []
    const parsed = list.map((item: unknown) => asTrack(item, this.parseOpts)).filter(Boolean) as TrackData[]
    return {
      items: (parsed.length ? parsed : collectTracks(value, this.parseOpts, count)).map((d) => new Track(this.core, d)),
      hasMore: Boolean(value.has_more),
      cursor: str(value.next_cursor),
      total: typeof value.total_num === 'number' ? value.total_num : undefined,
      raw: value,
    }
  }

  /* ------------------------------------------------------------ 歌单（写） */

  /** 建歌单 → 返回新歌单实体 */
  async createPlaylist(title: string, opts: { isPrivate?: boolean } = {}): Promise<Playlist> {
    const res: any = await this.core.request('CreatePlaylist', { name: title, is_private: opts.isPrivate ?? false })
    await this.invalidate(...this.collectionCache())
    const data = asPlaylist(res.playlist, this.parseOpts)
    if (data) return new Playlist(this.core, data)
    // 上游只回了 id 的情况下，回读一次
    const id = str(res.playlist?.id ?? res.playlist_id ?? res.id)
    if (!id) throw new CoreError('CreatePlaylist 没返回歌单 id')
    return await this.core.catalog.playlist(id, { refresh: true })
  }

  async deletePlaylists(ids: string[]): Promise<void> {
    if (!ids.length) return
    // 响应没有 status_code，成功标志是 deleted_playlists 里带上该 id
    await this.core.request('MDeletePlaylists', { playlist_ids: ids })
    await this.invalidate(...this.collectionCache())
  }

  /** 改歌单信息（说明里注明：紧跟建单后改名偶发 1000014，重试即通） */
  async updatePlaylist(id: string, patch: PlaylistPatch): Promise<void> {
    await this.core.request('UpdatePlaylistInfo', {
      playlist_id: id,
      name: patch.title,
      description: patch.description,
      is_private: patch.isPrivate,
    })
    await this.invalidate(...this.collectionCache())
  }

  /** 往歌单加歌（`media: [{id, type:'track'}]`） */
  async addToPlaylist(playlistId: string, trackIds: string[]): Promise<void> {
    if (!trackIds.length) return
    await this.core.request('MAppendPlaylistMedia', {
      playlist_id: playlistId,
      media: trackIds.map((id) => ({ id, type: 'track' })),
    })
    await this.invalidate(...this.collectionCache())
  }

  /** 从歌单移除曲目 */
  async removeFromPlaylist(playlistId: string, trackIds: string[]): Promise<void> {
    if (!trackIds.length) return
    await this.core.request('DeletePlaylistMedia', {
      playlist_id: playlistId,
      media: trackIds.map((id) => ({ id, type: 'track' })),
    })
    await this.invalidate(...this.collectionCache())
  }

  /* ------------------------------------------------------------ 收藏（写） */

  async like(trackId: string): Promise<void> {
    await this.core.request('CollectTracks', { track_ids: [trackId] })
    await this.invalidate(...this.collectionCache())
    await this.invalidateSubjects('track', [trackId])
  }

  async unlike(trackId: string): Promise<void> {
    await this.core.request('MDeleteCollectedTracks', { track_ids: [trackId] })
    await this.invalidate(...this.collectionCache())
    await this.invalidateSubjects('track', [trackId])
  }

  async collectAlbums(albumIds: string[]): Promise<void> {
    if (!albumIds.length) return
    await this.core.request('CollectAlbums', { album_ids: albumIds })
    await this.invalidate(...this.collectionCache())
    await this.invalidateSubjects('album-detail', albumIds)
  }

  async uncollectAlbums(albumIds: string[]): Promise<void> {
    if (!albumIds.length) return
    await this.core.request('MDeleteCollectedAlbums', { album_ids: albumIds })
    await this.invalidate(...this.collectionCache())
    await this.invalidateSubjects('album-detail', albumIds)
  }

  /**
   * 关注艺人。
   * 实测**写通道与回读都落地**：写完 `GetArtistCollection` 就能看到该艺人（项里 `follow_status=1`）。
   * 本方法的成功判据仍是「上游接受」（`collect_artist_status` 里那一位为 0），回读留给调用方。
   */
  async collectArtists(artistIds: string[]): Promise<void> {
    if (!artistIds.length) return
    await this.core.request('CollectArtists', { artist_ids: artistIds })
    await this.invalidate(...this.collectionCache())
    await this.invalidateSubjects('artist-detail', artistIds)
  }

  async uncollectArtists(artistIds: string[]): Promise<void> {
    if (!artistIds.length) return
    await this.core.request('MDeleteCollectedArtists', { artist_ids: artistIds })
    await this.invalidate(...this.collectionCache())
    await this.invalidateSubjects('artist-detail', artistIds)
  }

  async collectPlaylists(playlistIds: string[]): Promise<void> {
    if (!playlistIds.length) return
    await this.core.request('CollectPlaylists', { playlist_ids: playlistIds })
    await this.invalidate(...this.collectionCache())
  }

  async uncollectPlaylists(playlistIds: string[]): Promise<void> {
    if (!playlistIds.length) return
    await this.core.request('MDeleteCollectedPlaylists', { playlist_ids: playlistIds })
    await this.invalidate(...this.collectionCache())
  }

  /** 批量收藏（`media` + `scene` + `collect_action` 指定场景与动作；`DeleteCollectedMediaList` 只吃 `media`） */
  async collectMedia(targets: CollectTarget[], scene = 'track'): Promise<void> {
    if (!targets.length) return
    await this.core.request('CollectMediaList', {
      scene,
      collect_action: 1,
      media: targets.map((t) => ({ id: t.id, type: t.type })),
    })
    await this.invalidate(...this.collectionCache())
    await this.invalidateDetailSubjects(targets)
  }

  async uncollectMedia(targets: CollectTarget[]): Promise<void> {
    if (!targets.length) return
    await this.core.request('DeleteCollectedMediaList', {
      media: targets.map((t) => ({ id: t.id, type: t.type })),
    })
    await this.invalidate(...this.collectionCache())
    await this.invalidateDetailSubjects(targets)
  }

  /** 混合收藏按 `type` 分流到各自的详情缓存；`playlist` 的详情整档已被 collectionCache 清掉 */
  private async invalidateDetailSubjects(targets: CollectTarget[]): Promise<void> {
    const kindOf: Record<string, string> = { track: 'track', album: 'album-detail', artist: 'artist-detail' }
    for (const [kind, type] of Object.entries(kindOf)) {
      const ids = targets.filter((t) => t.type === type).map((t) => t.id)
      await this.invalidateSubjects(kind, ids)
    }
  }
}
