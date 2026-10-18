/**
 * core 的公开数据类型 = 「qishui-api 的原始响应」→「App 直接能用的形状」的映射结果。
 * 约定：
 *  - 原始字段一律保留在 `raw` 上（叶子类型在 api 层被擦除成 any，所以不重新声明一遍）；
 *  - 字段名用 camelCase，单位统一成 ms / 秒级时间戳保持原样（releaseDate/releaseTime 是 unix 秒）；
 *  - 拿不到就 `undefined`，绝不用默认值假装有数据。
 */

export interface ArtistRef {
  id: string
  name: string
  avatarUrl?: string
}

export interface AlbumRef {
  id: string
  name: string
  coverUrl?: string
  /** unix 秒 */
  releaseDate?: number
}

export interface TrackStats {
  collected?: number
  comment?: number
  shared?: number
}

/** 来自 track.label_info：VIP/音质权益标记 */
export interface TrackVipFlags {
  onlyVipPlayable?: boolean
  onlyVipDownload?: boolean
  /** 只有会员能播的音质档位（如 `lossless`） */
  vipOnlyQualities?: string[]
  isOriginal?: boolean
  qualityMap?: Record<string, unknown>
}

/**
 * 实体上嵌的「我是否收藏」水印 —— **登录态才有**（实测 2026-10-18：匿名响应里这一项根本不存在，
 * 带会话时 `Search` / `MGetMedia` / `GetChartDetail` / `FeedSongTab` / `GetArtistDetail` 每条都回）。
 * 三态口径：`state` 缺失 = 这一路没带（未验证，别当成「没收藏」）；
 * `state` 在但没 `is_collected` 键 = 上游省略了 false（实测未收藏的曲目回 `state: {}`，已收藏的回 `{"is_collected":true}`）。
 */
export interface MyCollectState {
  isCollected?: boolean
}

export interface TrackData {
  id: string
  name: string
  durationMs?: number
  album?: AlbumRef
  artists: ArtistRef[]
  coverUrl?: string
  /** 字节内部媒体 ID（换源/重签要用） */
  vid?: string
  mediaType?: string
  stats?: TrackStats
  vip?: TrackVipFlags
  /** 试听/可播区间（部分曲目只放开一段） */
  playableRange?: { startMs?: number; durationMs?: number }
  /** 这一首「我」收藏了没有（只在响应带了 `state` 时才有值） */
  state?: MyCollectState
  /**
   * 磁盘上的音频文件（本地库扫出来的曲目 / 本地库里的曲目快照）。
   * 有它就**不再走上游解析播放源**：播放器直接把这个路径交给 mpv，歌词/评论这类上游接口也不去问。
   */
  localPath?: string
  raw?: unknown
}

export interface AlbumData {
  id: string
  name: string
  artists: ArtistRef[]
  coverUrl?: string
  releaseDate?: number
  countTracks?: number
  description?: string
  stats?: TrackStats
  /** 这张专辑我收藏了没有（响应带了 `state` 才有值） */
  state?: MyCollectState
  raw?: unknown
}

export interface ArtistData {
  id: string
  name: string
  avatarUrl?: string
  description?: string
  countAlbums?: number
  countTracks?: number
  stats?: TrackStats
  /** 该艺人绑定的用户态（关注/拉黑标记在这个子对象里） */
  state?: { isCollected?: boolean; isFollowing?: boolean; blockedByMe?: boolean }
  raw?: unknown
}

export interface PlaylistStats {
  collected?: number
  visible?: number
}

export interface PlaylistData {
  id: string
  title: string
  description?: string
  coverUrl?: string
  countTracks?: number
  /**
   * 实测口径：`1` = 我喜欢的音乐、`2` = 私有、`3` = 公开/歌单广场、`4` = 抖音收藏。
   * 上游还可能加新值，所以只做辅助判断，不当作枚举校验。
   */
  type?: number
  fromFeed?: boolean
  ownerId?: string
  stats?: PlaylistStats
  /** 这张歌单我收藏了没有（响应带了 `state` 才有值） */
  state?: MyCollectState
  raw?: unknown
}

export interface UserStats {
  liked?: number
  following?: number
  followers?: number
  asset?: number
}

export interface UserData {
  id: string
  nickname: string
  avatarUrl?: string
  signature?: string
  douyinId?: string
  secUid?: string
  publicName?: string
  isVip?: boolean
  vipStage?: string
  isMusician?: boolean
  stats?: UserStats
  raw?: unknown
}

export interface CommentData {
  id: string
  content: string
  user?: UserData
  /** unix 秒 */
  createdAt?: number
  countDigged?: number
  countReply?: number
  liked?: boolean
  replies?: CommentData[]
  raw?: unknown
}

export interface ChartRank {
  rank?: number
  /** 名次变化，`up` / `down` / `stable` */
  trend?: string
  delta?: string
  track: TrackData
}

export interface ChartData {
  id: string
  title?: string
  description?: string
  countTracks?: number
  period?: string
  /** unix 秒 */
  releaseTime?: number
  ranks: ChartRank[]
  raw?: unknown
}

export interface MeStats {
  liked?: number
  following?: number
  followers?: number
  asset?: number
  raw?: unknown
}

export interface MeProfile {
  user: UserData
  stats: MeStats
  raw?: unknown
}

export interface MembershipOffer {
  offerId?: string
  externalOfferId?: string
  name?: string
  price?: string
  originalPrice?: string
  promotionLabel?: string
  currency?: string
  selected?: boolean
  /** `GetPurchaseOfferToken` 要用它下单（实测格式如 `8zbHKdkwHWzPGc21sQjN`） */
  raw?: unknown
}

export interface Membership {
  isVip: boolean
  vipStage?: string
  isPayingUser?: boolean
  autoRenew?: boolean
  renewAmount?: number
  hasLosslessEntitlement?: boolean
  /** 播放权益对象（`expire_at` / `reward_tasks_finished` …） */
  playEntitlements?: unknown
  /** 下载权益对象（`remaining_download_quota` / `total_download_quota`） */
  downloadEntitlement?: unknown
  /** 会员到期时刻（unix 秒，来自 play_entitlements.expire_at） */
  vipExpireAt?: number
  offers: MembershipOffer[]
  raw?: unknown
}

export interface PrivacySetting {
  followInfoVisibility?: number
  playlistAlbumVisibility?: number
  syncVideoToLuna?: number
  myFavoriteVisibility?: number
  musicWallVisibility?: number
  gamePlayStatsVisibility?: number
  raw?: unknown
}

/** 分页返回的统一形状（cursor 原样带回，上层不用关心各接口不同的键名） */
export interface Paged<T> {
  items: T[]
  hasMore: boolean
  cursor?: string
  total?: number
  raw?: unknown
}
