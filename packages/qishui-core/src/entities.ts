import type { CachedMediaMeta, PlaySource } from './cache/media.js'
import type { QishuiCore } from './core.js'
import type { Lyrics } from './player/lyrics.js'
import type { PlayOptions } from './player/player.js'
import type {
  AlbumData,
  ArtistData,
  ChartData,
  CommentData,
  Paged,
  PlaylistData,
  TrackData,
  UserData,
} from './types.js'

/**
 * 实体层：把「原始响应里的一个对象」变成有方法的对象。
 *
 * 刻意做得很薄 —— 每个方法都是 `core.<service>.<method>` 的一行转发（外加省掉重复传 id）。
 * 这样：
 *  - 上层拿到 `Track` 就能 `track.play()` / `track.like()` / `track.lyrics()`，不用记接口名；
 *  - 想干更细的事直接找 `core`，实体不藏能力；
 *  - `data` 一律是公开字段，`raw` 里留着上游原样响应。
 */
export class Track {
  constructor(
    readonly core: QishuiCore,
    readonly data: TrackData,
  ) {}

  get id(): string {
    return this.data.id
  }

  get name(): string {
    return this.data.name
  }

  get durationMs(): number | undefined {
    return this.data.durationMs
  }

  get artists(): TrackData['artists'] {
    return this.data.artists
  }

  get artistNames(): string {
    return this.data.artists
      .map((a) => a.name)
      .filter(Boolean)
      .join(', ')
  }

  get album(): TrackData['album'] {
    return this.data.album
  }

  get coverUrl(): string | undefined {
    return this.data.coverUrl
  }

  /** 上游的 VIP 权益标记（只有 MGetMedia/专辑/榜单这类完整实体会带） */
  get vip(): TrackData['vip'] {
    return this.data.vip
  }

  /**
   * 「我」有没有把这首加进我的喜欢 —— 只报响应里带了的水印：
   * 登录态下 Search/MGetMedia/榜单/推流/艺人详情都回 `state`（实测），匿名或这一路没带 = undefined（未验证）。
   */
  get liked(): boolean | undefined {
    return this.data.state?.isCollected
  }

  get raw(): unknown {
    return this.data.raw
  }

  /* ------------------------------------------------------------ 播放 */

  play(opts: PlayOptions = {}): Promise<void> {
    return this.core.player.play(this, opts)
  }

  /** 解析播放源（本地缓存 or 签名地址），不改变播放状态 */
  source(opts: PlayOptions = {}): Promise<PlaySource> {
    return this.core.media.resolve(this.data, opts)
  }

  /** 确保音频/歌词/封面落到本地 */
  ensureMedia(opts: { refresh?: boolean } = {}): Promise<CachedMediaMeta> {
    return this.core.media.ensure(this.data, opts)
  }

  lyrics(opts: PlayOptions = {}): Promise<Lyrics | undefined> {
    return this.core.media.lyrics(this.data, opts)
  }

  /** 相关推荐（播放页「相似歌曲」） */
  related(count = 8): Promise<Track[]> {
    return this.core.catalog.related(this.id, count)
  }

  comments(opts: { cursor?: number; count?: number } = {}): Promise<Paged<Comment>> {
    return this.core.comments.list(this, opts)
  }

  albumEntity(): Promise<Album | undefined> {
    return this.data.album?.id ? this.core.catalog.album(this.data.album.id) : Promise.resolve(undefined)
  }

  /* ------------------------------------------------------------ 收藏 */

  like(): Promise<void> {
    return this.core.library.like(this.id)
  }

  unlike(): Promise<void> {
    return this.core.library.unlike(this.id)
  }

  isLiked(): Promise<boolean> {
    return this.core.library.isLiked(this.id)
  }

  toJSON(): TrackData {
    return this.data
  }

  toString(): string {
    return this.artistNames ? `${this.name} — ${this.artistNames}` : this.name
  }
}

export class Album {
  constructor(
    readonly core: QishuiCore,
    readonly data: AlbumData,
  ) {}

  get id(): string {
    return this.data.id
  }

  get name(): string {
    return this.data.name
  }

  get coverUrl(): string | undefined {
    return this.data.coverUrl
  }

  get releaseDate(): number | undefined {
    return this.data.releaseDate
  }

  get artistNames(): string {
    return this.data.artists
      .map((a) => a.name)
      .filter(Boolean)
      .join(', ')
  }

  /** 这张专辑我收藏了没有（响应没带 `state` = undefined，不当作「没收藏」） */
  get collected(): boolean | undefined {
    return this.data.state?.isCollected
  }

  get raw(): unknown {
    return this.data.raw
  }

  /** 专辑曲目（GetAlbumDetail 一次给全） */
  tracks(): Promise<Track[]> {
    return this.core.catalog.albumTracks(this.id)
  }

  /** 整张专辑排队播放 */
  async play(): Promise<void> {
    await this.core.player.playList(await this.tracks())
  }

  like(): Promise<void> {
    return this.core.library.collectAlbums([this.id]).then(() => undefined)
  }

  unlike(): Promise<void> {
    return this.core.library.uncollectAlbums([this.id]).then(() => undefined)
  }

  toJSON(): AlbumData {
    return this.data
  }

  toString(): string {
    return this.artistNames ? `${this.name} — ${this.artistNames}` : this.name
  }
}

export class Artist {
  constructor(
    readonly core: QishuiCore,
    readonly data: ArtistData,
  ) {}

  get id(): string {
    return this.data.id
  }

  get name(): string {
    return this.data.name
  }

  get avatarUrl(): string | undefined {
    return this.data.avatarUrl
  }

  get following(): boolean | undefined {
    return this.data.state?.isFollowing ?? this.data.state?.isCollected
  }

  get raw(): unknown {
    return this.data.raw
  }

  /** 热门/全部曲目（分页） */
  tracks(opts: { cursor?: number; count?: number } = {}): Promise<Paged<Track>> {
    return this.core.catalog.artistTracks(this.id, opts)
  }

  albums(opts: { cursor?: number; count?: number } = {}): Promise<Paged<Album>> {
    return this.core.catalog.artistAlbums(this.id, opts)
  }

  follow(): Promise<void> {
    return this.core.library.collectArtists([this.id]).then(() => undefined)
  }

  unfollow(): Promise<void> {
    return this.core.library.uncollectArtists([this.id]).then(() => undefined)
  }

  toJSON(): ArtistData {
    return this.data
  }

  toString(): string {
    return this.name
  }
}

export class Playlist {
  constructor(
    readonly core: QishuiCore,
    readonly data: PlaylistData,
  ) {}

  get id(): string {
    return this.data.id
  }

  get title(): string {
    return this.data.title
  }

  get description(): string | undefined {
    return this.data.description
  }

  get coverUrl(): string | undefined {
    return this.data.coverUrl
  }

  get countTracks(): number | undefined {
    return this.data.countTracks
  }

  /** 「我喜欢的音乐」（type=1） */
  get isLikedList(): boolean {
    return this.data.type === 1
  }

  get isPrivate(): boolean {
    return this.data.type === 2
  }

  /** 这张歌单我收藏了没有（响应没带 `state` = undefined，不当作「没收藏」） */
  get collected(): boolean | undefined {
    return this.data.state?.isCollected
  }

  get raw(): unknown {
    return this.data.raw
  }

  /** 歌单曲目（分页：GetPlaylistDetail 一次一页） */
  tracks(opts: { cursor?: number; count?: number } = {}): Promise<Paged<Track>> {
    return this.core.catalog.playlistTracks(this.id, opts)
  }

  /** 一次把整张歌单翻完（页数多时注意耗时） */
  async allTracks(opts: { pageSize?: number } = {}): Promise<Track[]> {
    const pageSize = opts.pageSize ?? 100
    const out: Track[] = []
    let cursor: number | undefined = 0
    for (let page = 0; page < 100; page++) {
      const result = await this.tracks({ cursor: cursor ?? 0, count: pageSize })
      out.push(...result.items)
      if (!result.hasMore || result.cursor === undefined) break
      cursor = Number(result.cursor)
      if (!Number.isFinite(cursor)) break
    }
    return out
  }

  async add(tracks: Track[] | TrackData[] | string[]): Promise<void> {
    const ids = tracks.map((t) => (typeof t === 'string' ? t : t.id))
    await this.core.library.addToPlaylist(this.id, ids)
  }

  async remove(tracks: Track[] | TrackData[] | string[]): Promise<void> {
    const ids = tracks.map((t) => (typeof t === 'string' ? t : t.id))
    await this.core.library.removeFromPlaylist(this.id, ids)
  }

  rename(title: string): Promise<void> {
    return this.core.library.updatePlaylist(this.id, { title })
  }

  setDescription(description: string): Promise<void> {
    return this.core.library.updatePlaylist(this.id, { description })
  }

  /** 删除整张歌单（自建歌单才有权限） */
  delete(): Promise<void> {
    return this.core.library.deletePlaylists([this.id])
  }

  like(): Promise<void> {
    return this.core.library.collectPlaylists([this.id]).then(() => undefined)
  }

  unlike(): Promise<void> {
    return this.core.library.uncollectPlaylists([this.id]).then(() => undefined)
  }

  async play(startTrackId?: string): Promise<void> {
    const tracks = await this.allTracks()
    await this.core.player.playList(tracks, startTrackId)
  }

  toJSON(): PlaylistData {
    return this.data
  }

  toString(): string {
    return `${this.title}${this.countTracks != null ? ` (${this.countTracks} 首)` : ''}`
  }
}

export class User {
  constructor(
    readonly core: QishuiCore,
    readonly data: UserData,
  ) {}

  get id(): string {
    return this.data.id
  }

  get nickname(): string {
    return this.data.nickname
  }

  get avatarUrl(): string | undefined {
    return this.data.avatarUrl
  }

  get isVip(): boolean | undefined {
    return this.data.isVip
  }

  get raw(): unknown {
    return this.data.raw
  }

  /** 资料有更新时重新拉（这个接口风控敏感，别高频调） */
  info(): Promise<User> {
    return this.core.social.user(this.id)
  }

  playlists(opts: { cursor?: number; count?: number } = {}): Promise<Paged<Playlist>> {
    return this.core.social.userPlaylists(this.id, opts)
  }

  async follow(): Promise<void> {
    await this.core.social.follow(this.id)
  }

  async unfollow(): Promise<void> {
    await this.core.social.unfollow(this.id)
  }

  async block(): Promise<void> {
    await this.core.social.block(this.id)
  }

  async unblock(): Promise<void> {
    await this.core.social.unblock(this.id)
  }

  toJSON(): UserData {
    return this.data
  }

  toString(): string {
    return this.nickname || this.id
  }
}

export class Comment {
  constructor(
    readonly core: QishuiCore,
    readonly data: CommentData,
  ) {}

  get id(): string {
    return this.data.id
  }

  get content(): string {
    return this.data.content
  }

  get user(): User | undefined {
    return this.data.user ? new User(this.core, this.data.user) : undefined
  }

  get liked(): boolean | undefined {
    return this.data.liked
  }

  get raw(): unknown {
    return this.data.raw
  }

  replies(opts: { cursor?: number; count?: number } = {}): Promise<Paged<Comment>> {
    return this.core.comments.replies(this.id, opts)
  }

  reply(text: string): Promise<Comment> {
    return this.core.comments.reply(this.id, text)
  }

  like(): Promise<void> {
    return this.core.comments.like(this.id)
  }

  remove(): Promise<void> {
    return this.core.comments.remove(this.id)
  }

  toJSON(): CommentData {
    return this.data
  }

  toString(): string {
    return `${this.user?.nickname ?? '匿名'}：${this.content}`
  }
}

export class Chart {
  constructor(
    readonly core: QishuiCore,
    readonly data: ChartData,
  ) {}

  get id(): string {
    return this.data.id
  }

  get title(): string | undefined {
    return this.data.title
  }

  get countTracks(): number | undefined {
    return this.data.countTracks
  }

  get tracks(): Track[] {
    return this.data.ranks.map((rank) => new Track(this.core, rank.track))
  }

  get ranked(): { rank?: number; trend?: string; delta?: string; track: Track }[] {
    return this.data.ranks.map((rank) => ({
      rank: rank.rank,
      trend: rank.trend,
      delta: rank.delta,
      track: new Track(this.core, rank.track),
    }))
  }

  play(): Promise<void> {
    return this.core.player.playList(this.tracks)
  }

  toJSON(): ChartData {
    return this.data
  }

  toString(): string {
    return this.title ?? `chart:${this.id}`
  }
}
