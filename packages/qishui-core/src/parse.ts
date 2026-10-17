import { getImageUrl, type ImageResource } from 'qishui-api'
import type {
  AlbumData,
  ArtistData,
  ArtistRef,
  ChartData,
  ChartRank,
  CommentData,
  PlaylistData,
  TrackData,
  TrackStats,
  TrackVipFlags,
  UserData,
  UserStats,
} from './types.js'
import { bool, num, str } from './util.js'

/* eslint-disable @typescript-eslint/no-explicit-any */

export function isObj(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export interface ParseOptions {
  /** 封面 CDN 拼串宽度，默认交给 getImageUrl 的 400 */
  coverWidth?: number
}

/** 实体在响应里被套了几层，键名还各接口不同；这一组是实测见过的全部包装键 */
const WRAPPER_KEYS = [
  'track_wrapper',
  'simple_track_wrapper',
  'playlist_wrapper',
  'album_wrapper',
  'artist_wrapper',
  'user_wrapper',
  'video_wrapper',
  'media_wrapper',
  'mixed_collection_wrapper',
  'comment_wrapper',
]

/**
 * 一直剥到真正的实体：`entity.track_wrapper.track` / `entity.ranked_track.track` /
 * `entity.playlist` / `inner_block.resources[].entity.track` 全都能落到实体上。
 */
export function unwrap(node: any): any {
  if (!isObj(node)) return undefined
  let cur: any = isObj(node.entity) ? node.entity : node
  for (let hop = 0; hop < 5; hop++) {
    let moved = false
    for (const key of WRAPPER_KEYS) {
      if (isObj(cur[key])) {
        cur = cur[key]
        moved = true
      }
    }
    if (isObj(cur.ranked_track)) {
      cur = cur.ranked_track.track ?? cur.ranked_track
      moved = true
    }
    if (isObj(cur.track) && Object.keys(cur).length <= 3) {
      cur = cur.track
      moved = true
    }
    if (!moved) break
  }
  return cur
}

export function looksLikeTrack(v: any): boolean {
  return (
    isObj(v) &&
    typeof v.id === 'string' &&
    typeof v.name === 'string' &&
    v.release_date == null &&
    (v.duration != null || Array.isArray(v.artists) || isObj(v.album))
  )
}

export function looksLikeAlbum(v: any): boolean {
  return isObj(v) && typeof v.id === 'string' && typeof v.name === 'string' && v.release_date != null
}

export function looksLikePlaylist(v: any): boolean {
  return (
    isObj(v) &&
    typeof v.id === 'string' &&
    typeof v.title === 'string' &&
    (v.count_tracks != null || v.type != null || v.url_cover != null)
  )
}

export function looksLikeArtist(v: any): boolean {
  return (
    isObj(v) &&
    typeof v.id === 'string' &&
    typeof (v.name ?? v.nickname) === 'string' &&
    (v.simple_display_name != null || v.url_avatar != null || (v.count_albums != null && v.count_tracks != null))
  )
}

export function looksLikeUser(v: any): boolean {
  return (
    isObj(v) &&
    typeof v.id === 'string' &&
    typeof v.nickname === 'string' &&
    (v.medium_avatar_url != null || v.larger_avatar_url != null || v.douyin_id != null || v.sec_uid != null || v.is_vip != null)
  )
}

export function looksLikeComment(v: any): boolean {
  return isObj(v) && typeof v.id === 'string' && typeof v.content === 'string'
}

/**
 * 递归捞实体（不关心它藏在哪一层）。
 * 命中后不再往命中节点内部递归 —— 列表里嵌的实体都是重复的，省掉大量无用遍历。
 */
export function collect<T>(root: unknown, test: (v: any) => boolean, map: (v: any) => T, limit = Number.POSITIVE_INFINITY): T[] {
  const out: T[] = []
  const seenNodes = new Set<unknown>()
  const seenIds = new Set<string>()
  const walk = (node: any): void => {
    if (out.length >= limit || !node || typeof node !== 'object') return
    if (Array.isArray(node)) {
      for (const item of node) walk(item)
      return
    }
    if (seenNodes.has(node)) return
    seenNodes.add(node)

    const direct = test(node) ? node : isObj(node.entity) && test(node.entity) ? node.entity : undefined
    if (direct) {
      const key = typeof direct.id === 'string' ? direct.id : undefined
      if (key && seenIds.has(key)) return
      if (key) seenIds.add(key)
      out.push(map(direct))
      return
    }
    for (const value of Object.values(node)) walk(value)
  }
  walk(root)
  return out
}

export function collectTracks(root: unknown, opts: ParseOptions = {}, limit = Number.POSITIVE_INFINITY): TrackData[] {
  return collect(root, looksLikeTrack, (t) => parseTrack(t, opts), limit)
}

export function collectPlaylists(root: unknown, opts: ParseOptions = {}, limit = Number.POSITIVE_INFINITY): PlaylistData[] {
  return collect(root, looksLikePlaylist, (p) => parsePlaylist(p, opts), limit)
}

export function collectAlbums(root: unknown, opts: ParseOptions = {}, limit = Number.POSITIVE_INFINITY): AlbumData[] {
  return collect(root, looksLikeAlbum, (a) => parseAlbum(a, opts), limit)
}

export function collectArtists(root: unknown, opts: ParseOptions = {}, limit = Number.POSITIVE_INFINITY): ArtistData[] {
  return collect(root, looksLikeArtist, (a) => parseArtist(a, opts), limit)
}

export function collectUsers(root: unknown, limit = Number.POSITIVE_INFINITY): UserData[] {
  return collect(root, looksLikeUser, (u) => parseUser(u), limit)
}

export function imageUrl(res: unknown, opts: ParseOptions = {}): string | undefined {
  const url = getImageUrl(res as ImageResource | undefined, opts.coverWidth ? { width: opts.coverWidth } : undefined)
  return url || undefined
}

function artistRefs(raw: unknown): ArtistRef[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((a) => isObj(a) && (a.id != null || a.name != null))
    .map((a) => ({ id: str(a.id) ?? '', name: str(a.name) ?? '', avatarUrl: imageUrl(a.url_avatar) }))
}

function parseStats(raw: any): TrackStats | undefined {
  if (!isObj(raw)) return undefined
  return { collected: num(raw.count_collected), comment: num(raw.count_comment), shared: num(raw.count_shared) }
}

function parsePlaylistStats(raw: any): { collected?: number; visible?: number } | undefined {
  if (!isObj(raw)) return undefined
  return { collected: num(raw.count_collected), visible: num(raw.count_visible) }
}

function parseVip(raw: any): TrackVipFlags | undefined {
  if (!isObj(raw)) return undefined
  const qualities = raw.quality_only_vip_can_play
  return {
    onlyVipPlayable: bool(raw.only_vip_playable),
    onlyVipDownload: bool(raw.only_vip_download),
    vipOnlyQualities: Array.isArray(qualities) ? qualities.filter((q: unknown) => typeof q === 'string') : undefined,
    isOriginal: bool(raw.is_original),
    qualityMap: isObj(raw.quality_map) ? raw.quality_map : undefined,
  }
}

export function parseTrack(raw: any, opts: ParseOptions = {}): TrackData {
  const album = isObj(raw.album)
    ? {
        id: str(raw.album.id) ?? '',
        name: str(raw.album.name) ?? '',
        coverUrl: imageUrl(raw.album.url_cover, opts),
        releaseDate: num(raw.album.release_date),
      }
    : undefined
  const range = isObj(raw.playable_range)
    ? { startMs: num(raw.playable_range.start), durationMs: num(raw.playable_range.duration) }
    : undefined
  return {
    id: str(raw.id) ?? '',
    name: str(raw.name) ?? '',
    durationMs: num(raw.duration),
    album,
    artists: artistRefs(raw.artists),
    coverUrl: album?.coverUrl,
    vid: str(raw.vid),
    mediaType: str(raw.media_type),
    stats: parseStats(raw.stats),
    vip: parseVip(raw.label_info),
    playableRange: range,
    raw,
  }
}

/** 分享接口给的轻量曲目引用（GetShareInfo/GetRelatedMedia 的路子），字段比完整实体少 */
export function parseTrackRef(raw: any, opts: ParseOptions = {}): TrackData {
  return {
    id: str(raw.track_id ?? raw.id) ?? '',
    name: str(raw.name) ?? '',
    durationMs: num(raw.duration_ms ?? raw.duration),
    album: isObj(raw.album)
      ? {
          id: str(raw.album.album_id) ?? '',
          name: str(raw.album.name) ?? '',
          coverUrl: str(raw.album.cover_url) ?? imageUrl(raw.album.url_cover, opts),
          releaseDate: num(raw.album.release_date),
        }
      : undefined,
    artists: Array.isArray(raw.artists)
      ? raw.artists.map((a: any) => ({ id: str(a.artist_id ?? a.id) ?? '', name: str(a.name) ?? '' }))
      : [],
    coverUrl: str(raw.cover_url) ?? imageUrl(raw.album?.url_cover, opts),
    raw,
  }
}

export function parseAlbum(raw: any, opts: ParseOptions = {}): AlbumData {
  return {
    id: str(raw.id) ?? '',
    name: str(raw.name) ?? '',
    artists: artistRefs(raw.artists),
    coverUrl: imageUrl(raw.url_cover, opts),
    releaseDate: num(raw.release_date),
    countTracks: num(raw.count_tracks),
    description: str(raw.intro ?? raw.desc),
    stats: parseStats(raw.stats),
    raw,
  }
}

export function parseArtist(raw: any, opts: ParseOptions = {}): ArtistData {
  const avatar = imageUrl(raw.url_avatar ?? raw.larger_avatar_url ?? raw.medium_avatar_url, opts)
  return {
    id: str(raw.id) ?? '',
    name: str(raw.name ?? raw.nickname ?? raw.simple_display_name) ?? '',
    avatarUrl: avatar,
    description: str(raw.desc ?? raw.artist_profile?.desc),
    countAlbums: num(raw.count_albums),
    countTracks: num(raw.count_tracks),
    stats: parseStats(raw.stats),
    state: isObj(raw.state)
      ? {
          isCollected: bool(raw.state.is_collected),
          isFollowing: raw.state.follow_status != null ? num(raw.state.follow_status) === 1 : undefined,
          blockedByMe: bool(raw.state.blocked_by_me),
        }
      : undefined,
    raw,
  }
}

export function parsePlaylist(raw: any, opts: ParseOptions = {}): PlaylistData {
  return {
    id: str(raw.id) ?? '',
    title: str(raw.title) ?? '',
    description: str(raw.desc),
    coverUrl: imageUrl(raw.url_cover, opts),
    countTracks: num(raw.count_tracks),
    type: num(raw.type),
    fromFeed: bool(raw.from_feed),
    ownerId: str(raw.owner?.id ?? raw.owner),
    stats: parsePlaylistStats(raw.stats),
    raw,
  }
}

function userStats(raw: any): UserStats | undefined {
  if (!isObj(raw)) return undefined
  const stats = {
    liked: num(raw.count_all_liked ?? raw.count_liked),
    following: num(raw.count_following ?? raw.count_luna_following),
    followers: num(raw.count_follower ?? raw.count_luna_follower),
    asset: num(raw.count_asset),
  }
  return Object.values(stats).some((v) => v !== undefined) ? stats : undefined
}

export function parseUser(raw: any, opts: ParseOptions = {}): UserData {
  return {
    id: str(raw.id) ?? '',
    nickname: str(raw.nickname) ?? '',
    avatarUrl: imageUrl(raw.larger_avatar_url ?? raw.medium_avatar_url ?? raw.url_avatar, opts),
    signature: str(raw.signature),
    douyinId: str(raw.douyin_id),
    secUid: str(raw.sec_uid),
    publicName: str(raw.public_name),
    isVip: bool(raw.is_vip),
    vipStage: str(raw.vip_stage),
    isMusician: bool(raw.is_musician),
    stats: userStats(raw.stats) ?? userStats(raw),
    raw,
  }
}

export function parseComment(raw: any, opts: ParseOptions = {}): CommentData {
  const replies = Array.isArray(raw.reply_comments) ? raw.reply_comments.filter(looksLikeComment) : undefined
  return {
    id: str(raw.id) ?? '',
    content: str(raw.content) ?? '',
    user: isObj(raw.user) ? parseUser(raw.user, opts) : undefined,
    createdAt: num(raw.time_created),
    countDigged: num(raw.count_digged),
    countReply: num(raw.count_reply),
    liked: bool(raw.liked ?? raw.digged),
    replies: replies?.map((r: any) => parseComment(r, opts)),
    raw,
  }
}

export function parseChart(raw: any, opts: ParseOptions = {}): ChartData {
  const ranks: ChartRank[] = []
  for (const item of Array.isArray(raw.track_ranks) ? raw.track_ranks : []) {
    const track = unwrap(item?.track ?? item)
    if (!looksLikeTrack(track)) continue
    ranks.push({
      rank: num(item?.rank?.rank ?? item?.rank),
      trend: str(item?.rank?.rank_type),
      delta: str(item?.rank?.rank_delta),
      track: parseTrack(track, opts),
    })
  }
  return {
    id: str(raw.id) ?? '',
    title: str(raw.title),
    description: str(raw.style?.desc ?? raw.desc),
    countTracks: num(raw.count_tracks),
    period: str(raw.period),
    releaseTime: num(raw.release_time),
    ranks,
    raw,
  }
}

/** 曲目实体 / 轻量引用 / 裸 id 都能吃 */
export function coerceTrack(input: unknown, opts: ParseOptions = {}): TrackData | undefined {
  if (typeof input === 'string') return { id: input, name: '', artists: [] }
  const node = unwrap(input)
  if (looksLikeTrack(node)) return parseTrack(node, opts)
  if (isObj(node) && (node.track_id != null || (node.name != null && node.artists != null))) return parseTrackRef(node, opts)
  return undefined
}

export function asTrack(node: unknown, opts: ParseOptions = {}): TrackData | undefined {
  const raw = unwrap(node)
  return looksLikeTrack(raw) ? parseTrack(raw, opts) : undefined
}

export function asAlbum(node: unknown, opts: ParseOptions = {}): AlbumData | undefined {
  const raw = unwrap(node)
  return looksLikeAlbum(raw) ? parseAlbum(raw, opts) : undefined
}

export function asArtist(node: unknown, opts: ParseOptions = {}): ArtistData | undefined {
  const raw = unwrap(node)
  return looksLikeArtist(raw) ? parseArtist(raw, opts) : undefined
}

export function asPlaylist(node: unknown, opts: ParseOptions = {}): PlaylistData | undefined {
  const raw = unwrap(node)
  return looksLikePlaylist(raw) ? parsePlaylist(raw, opts) : undefined
}

export function asUser(node: unknown, opts: ParseOptions = {}): UserData | undefined {
  const raw = unwrap(node)
  return looksLikeUser(raw) ? parseUser(raw, opts) : undefined
}

export function asComment(node: unknown, opts: ParseOptions = {}): CommentData | undefined {
  const raw = unwrap(node)
  return looksLikeComment(raw) ? parseComment(raw, opts) : undefined
}

/** 榜单没有专属形状，只要求「有一批 track_ranks 或至少有个 id」 */
export function looksLikeChart(v: any): boolean {
  return isObj(v) && (Array.isArray(v.track_ranks) || (typeof v.id === 'string' && v.title != null))
}

export function asChart(node: unknown, opts: ParseOptions = {}): ChartData | undefined {
  const raw = unwrap(node)
  if (!looksLikeChart(raw)) return undefined
  const chart = parseChart(raw, opts)
  return chart.id || chart.ranks.length ? chart : undefined
}
