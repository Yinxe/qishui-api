/**
 * qishui-core —— 汽水音乐的「应用后端」：在 qishui-api（协议层，320 个端点）之上，
 * 用 OOP 方式把「App 要干的事」封装好，数据落在自己的目录里（默认 `~/.qishui`）。
 *
 * ```ts
 * import { createQishui } from 'qishui-core'
 *
 * const qishui = await createQishui({ logger: console.log })
 * const home = await qishui.discover.home()        // 推荐页大盘
 * const track = home.tracks[0]
 * await track.play()                                // 解析播放源 + 落盘 + 起进度时钟
 * qishui.player.on('progress', (p) => console.log(p.positionMs))
 * ```
 *
 * 分层（自上而下，上层都能往下穿透，不藏能力）：
 *
 * ```
 * entities.ts     Track / Album / Artist / Playlist / User / Comment / Chart  （track.play()）
 * services/*      account catalog discover search library comments social feedback link
 * player/         Player 状态机（只管状态，不出声）+ PlayQueue + Lyrics
 * cache/          EntityCache（元数据 TTL）+ MediaCache（音频/歌词/封面，断点续传）
 * session.ts      设备身份 + 扫码登录（~/.qishui/session.json，0600）
 * core.ts         QishuiCore 门面 + createQishui()
 * ```
 *
 * 想干 core 没封装的事，用 `qishui.request('端点名', params)` 或 `qishui.api`（原始 Client）。
 */

/* ------------------------------------------------------------ 门面 */
export { createQishui, QishuiCore, type CoreEvents, type QishuiOptions } from './core.js'

/* ------------------------------------------------------------ OOP 实体 */
export { Album, Artist, Chart, Comment, Playlist, Track, User } from './entities.js'

/* ------------------------------------------------------------ 播放器 */
export { Player, type PlayOptions, type PlayerEvents, type PlayerOptions, type PlayerState, type PlayerStatus, type TrackInput } from './player/player.js'
export { PlayQueue, type PlayQueueOptions } from './player/queue.js'
export { Lyrics, type LyricLine, type LyricWord } from './player/lyrics.js'

/* ------------------------------------------------------------ 缓存与媒体 */
export { EntityCache, type CacheEntry, type EntityCacheOptions, type EntityCacheStats } from './cache/store.js'
export {
  MediaCache,
  formatBytes,
  type CachedAudio,
  type CachedMediaMeta,
  type DownloadProgress,
  type EnsureOptions,
  type MediaStats,
  type PlaySource,
  type ResolveOptions,
  type VerifyIssue,
} from './cache/media.js'

/* ------------------------------------------------------------ 会话与登录 */
export { SessionManager, type LoginOptions, type QishuiLogin, type SessionFile, type SessionOptions, type SessionSnapshot } from './session.js'

/* ------------------------------------------------------------ 数据与工具 */
export {
  CONFIG_DEFAULTS,
  loadConfig,
  saveConfig,
  type CoreConfig,
  type LoadConfigInput,
  type LoadedConfig,
  type RepeatMode,
} from './config.js'
export { defaultDataDir, resolvePaths, safeSegment, type CorePaths } from './paths.js'
export { PlayHistory, type PlayRecord, type PlayStats } from './history.js'
export { Emitter, type EventMap } from './events.js'
export { CacheError, CoreError, MediaUnavailableError, NotLoggedInError } from './errors.js'

/* ------------------------------------------------------------ 服务与它们的输入输出类型 */
export { AccountService, type CommerceSummary } from './services/account.js'
export { CatalogService, type CatalogCacheKind, type MediaRef, type PageOptions } from './services/catalog.js'
export {
  CommentsService,
  GroupType,
  type CommentPageOptions,
  type CommentTarget,
} from './services/comments.js'
export {
  DiscoverService,
  type DiscoverBlock,
  type DiscoverInner,
  type DiscoverResource,
  type HomeLayout,
  type HomeView,
  type LaunchInfo,
} from './services/discover.js'
export { FeedbackService, type ReportInput, type ReportReason } from './services/feedback.js'
export { LibraryService, type CollectTarget, type PlaylistPatch } from './services/library.js'
export { LinkService } from './services/link.js'
export {
  SearchService,
  type SearchGroup,
  type SearchPageOptions,
  type SearchResult,
  type SearchType,
  type SuggestItem,
} from './services/search.js'
export { SocialService } from './services/social.js'

/* ------------------------------------------------------------ 数据结构（App 直接消费的形状） */
export type {
  AlbumData,
  AlbumRef,
  ArtistData,
  ArtistRef,
  ChartData,
  ChartRank,
  CommentData,
  MeProfile,
  MeStats,
  Membership,
  MembershipOffer,
  Paged,
  PlaylistData,
  PlaylistStats,
  PrivacySetting,
  TrackData,
  TrackStats,
  TrackVipFlags,
  UserData,
  UserStats,
} from './types.js'

/* ------------------------------------------------------------ 解析工具（自定义响应处理时用）
 * `unwrap` 剥包装、`collect*` 从任意响应里递归捞实体、`asX` 做形状识别。 */
export {
  asAlbum,
  asArtist,
  asChart,
  asComment,
  asPlaylist,
  asTrack,
  asUser,
  collect,
  collectAlbums,
  collectArtists,
  collectPlaylists,
  collectTracks,
  collectUsers,
  coerceTrack,
  imageUrl,
  isObj,
  looksLikeAlbum,
  looksLikeArtist,
  looksLikeChart,
  looksLikeComment,
  looksLikePlaylist,
  looksLikeTrack,
  looksLikeUser,
  parseAlbum,
  parseArtist,
  parseChart,
  parseComment,
  parsePlaylist,
  parseTrack,
  parseTrackRef,
  parseUser,
  unwrap,
  type ParseOptions,
} from './parse.js'

/* ------------------------------------------------------------ 上游（qishui-api）的常用公开面
 * 从 core 一处导入就够用；更底层的端点请求走 `qishui.request()` / `qishui.api`。 */
export {
  CookieJar,
  QishuiError,
  TransportError,
  ApiError,
  AuthRequiredError,
  RiskControlError,
  StatusCode,
  getImageUrl,
  getShareMedia,
  getShareMeta,
  parseShareLink,
  resolveShareLink,
  shareLinkToMeta,
  type Client,
  type CookieMap,
  type DeviceIdentity,
  type EndpointName,
  type ImageResource,
  type ShareItem,
  type ShareKind,
  type ShareMedia,
  type ShareMeta,
} from 'qishui-api'
