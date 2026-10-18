/**
 * 缓存分档（2026-10-17 定，五档）——**哪些数据该缓存，只看这个文件**。
 *
 * 原则：只有「同一份数据长时间不变」才值得落盘。
 * 实时/随机数据（搜索结果、推荐流、电台续播、相似歌曲、计数器）一次一取，
 * 传 `CacheTtl.none`（= 0）即可：`EntityCache.set()` 见 ttlMs ≤ 0 直接跳过写盘，
 * 所以「不缓存」不需要额外的开关，也不会在磁盘上留空文件。
 *
 * 各服务里别再散写 TTL 数字——否则下次又说不清「到底哪些数据在缓存」。
 * 分档与命令的对应关系见 `packages/qishui-core/README.md`「缓存策略」；
 * 终端里可以直接 `qishui cache policy` 打这张表。
 */

const TIERS = [
  {
    key: 'none',
    label: '不缓存',
    ttlMs: 0,
    note: '实时/随机数据：搜索（Search/Search2023）、联想词、推荐流（FeedSongTab）、电台续播、相似歌曲、首页/下钻/歌单广场、最近播放、收藏计数',
  },
  {
    key: 'entity',
    label: '元数据 6h',
    ttlMs: 6 * 60 * 60_000,
    note: '同 id 基本不变：专辑/艺人/歌单详情、曲目元数据（MGetMedia）；歌单与实体详情嵌了「我是否收藏」，收藏类写操作会按档/按 id 主动清掉',
  },
  {
    key: 'chart',
    label: '榜单 30min',
    ttlMs: 30 * 60_000,
    note: '半稳定且整榜拉取代价大：GetChartDetail',
  },
  {
    key: 'config',
    label: '配置 6h',
    ttlMs: 6 * 60 * 60_000,
    note: '运营口径的枚举与开关：FeedMode、Launch、推荐搜索词',
  },
  {
    key: 'staticEnum',
    label: '长期枚举 24h',
    ttlMs: 24 * 60 * 60_000,
    note: '几个月不变的枚举：搜索分类 tab、举报理由',
  },
  {
    key: 'account',
    label: '账号 5min',
    ttlMs: 5 * 60_000,
    note: '我自己的数据（歌单/红心/关注/资料/权益/他人资料）；写操作后主动失效，别等 TTL',
  },
] as const

export type CacheTierKey = (typeof TIERS)[number]['key']

export interface CacheTier {
  key: CacheTierKey
  /** 给人看的一行标签 */
  label: string
  ttlMs: number
  /** 这一档装什么 */

  note: string
}

/** 完整分档表（`qishui cache policy` / README 用同一份，不另写一遍） */
export const CACHE_TIERS: CacheTier[] = TIERS.map((tier) => ({ ...tier }))

/** 各服务传 `ttlMs` 时用这个，别写字面数字 */
export const CacheTtl = Object.fromEntries(TIERS.map((tier) => [tier.key, tier.ttlMs])) as Record<CacheTierKey, number>

/**
 * 缓存的第二维度：**这份数据属不属于「某个账号」**（多账号隔离的唯一真相）。
 *  - `public`：与观看者无关，跨账号共享一份；
 *  - `viewer`：主体是公共元数据，但响应里嵌了「我是否收藏/关注/拉黑/vip 档位」——按观看者（激活账号）隔离；
 *  - `account`：账号私有（我的歌单/红心/资料/权益/黑名单…）。
 * `viewer` 与 `account` 都落 `cache/entities/_acct/<uid>/`，未登录时落共享位。
 * 未显式列出的 kind 按 `viewer` 处理（宁可多隔离，不串号）。
 */
export type CacheScope = 'public' | 'viewer' | 'account'

export const KIND_SCOPE: Record<string, CacheScope> = {
  // account：账号私有
  me: 'account',
  privacy: 'account',
  subscription: 'account',
  upsell: 'account',
  'commerce-config': 'account',
  'commerce-info': 'account',
  'digital-albums': 'account',
  'block-list': 'account',
  'my-playlists': 'account',
  'liked-tracks': 'account',
  'mixed-collections': 'account',
  'artist-collection': 'account',
  'recent-played': 'account',
  'user-playlists': 'account',
  'user-mixed': 'account',
  'search-block': 'account',
  // viewer：公共主体 + 带我态字段
  'playlist-detail': 'viewer',
  track: 'viewer',
  'album-detail': 'viewer',
  'artist-detail': 'viewer',
  related: 'viewer',
  'media-stats': 'viewer',
  user: 'viewer',
  chart: 'viewer',
  // 判据是「这一路回不回实体」：只要回 track/album/artist/playlist，就可能嵌 `state.is_collected`
  // （实测 2026-10-18 带会话：Search / FeedSongTab / GetChartDetail / MGetMedia / GetArtistDetail 全都嵌，
  // 见 packages/qishui-api/test/probe-state.ts 与 probe-state2.ts）——「我收藏过没有」是观看者的属性，
  // A 号看到的「已喜欢」不能给 B 号看，所以凡是回实体的都按 uid 隔离，只回关键词/枚举/tab 的才共享。
  search: 'viewer',
  'discover-home': 'viewer',
  'discover-mix': 'viewer',
  'feed-song-tab': 'viewer',
  'playlist-square': 'viewer',
  'radio-tracks': 'viewer',
  'artist-tracks': 'viewer',
  'artist-albums': 'viewer',
  featured: 'viewer',
  // public：与观看者无关（只回关键词/枚举/配置，不回实体）
  sug: 'public',
  'suggest-words': 'public',
  categories: 'public',
  'feed-mode': 'public',
  launch: 'public',
  'report-reasons': 'public',
}

export function scopeFor(kind: string): CacheScope {
  return KIND_SCOPE[kind] ?? 'viewer'
}

/** 是否要按激活账号隔离（落 `_acct/<uid>/`） */
export function isScoped(kind: string): boolean {
  return scopeFor(kind) !== 'public'
}
