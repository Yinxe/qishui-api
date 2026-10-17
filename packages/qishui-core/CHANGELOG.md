# Changelog

本包（`qishui-core`）的变更记录，最新在上。

## Unreleased

### Changed

- **测试从冒烟台改为 vitest 单测**：删 `test/smoke.ts`（真打上游），新增 `test/*.test.ts` 10 个文件（session/store/catalog/search/media/player/history/parse/paths/policy + `support/mockUpstream.ts`）——**全程零网络**：注入 mock fetch + 独立数据目录，覆盖旧冒烟台的可离线断言（缓存命中零请求、媒体断点/校验、播放器状态机、多账号机制）；上游契约回归只由 `qishui-api` 实测台负责。`pnpm --filter qishui-core run test` 跑（先 `pnpm run build`，测试从 `../dist` 导入）
- **`createQishui({account})` 严格化**（`--as` 的后端通道）：uid/昵称没入库 → 构造期抛「没有账号 …（已入库：…）」；登出留下的空壳号 → 抛「没有留存会话」。**不再静默回落到激活号**——指错号还照常跑是最危险的形态。`config.activeUid`（持久化默认值）照旧软回落 lastUsedAt，两套语义在 `SessionOptions` 上显式分成 `explicitUid` / `activeUid`

## 0.2.0 — 2026-10-17

### Added

- **多账号会话**：登录态拆成 `device.json`（设备身份，全体账号共用一台「设备」，换号不触发新注册）+ `accounts.json`（索引）+ `accounts/<uid>.json`（每号一份 cookie，0600）。`login()` 新号入库并默认激活、**不再覆盖旧号**（`keepActive` 可只入库不切）；新增 `accounts()` / `activeUid` / `useAccount(uid|昵称)`（cookie jar **先清后灌**，杜绝跨号残留）/ `logout({purge})` / `reset()`；`CoreEvents` 增 `account-changed`；`createQishui({account})` 支持单实例临时激活（CLI `--as` 走这里，不改 `config.activeUid`）
- **缓存账号隔离维度**（与 TTL 档位正交，同在 `policy.ts` 唯一真相）：`CacheScope`（`account` 私有 / `viewer` 带我态 / `public` 共享）+ `KIND_SCOPE` + `scopeFor()`。带态 kind 落 `cache/entities/_acct/<uid>/`，两号互不可见；媒体缓存（匿名分享页来源）跨号共享。`EntityCache` 增 `clearMemory()`（切号作废内存态）、`invalidateAccount(uid)`、`clearShared(kind)`
- **播放历史按账号分文件**：`PlayHistory.setScope(uid?)` → `journal/<uid>/plays.jsonl`；未登录/迁移前继续写 legacy `journal/plays.jsonl`
- `config.json` 新增 `activeUid`（`useAccount`/登录/登出写回，可手改）
- **缓存分档 `src/cache/policy.ts`（唯一真相）**：`CacheTtl` + `CACHE_TIERS`（`none`/`entity`/`chart`/`config`/`staticEnum`/`account`），各服务只引用档位、不写死秒数。原则：**只有长时间不变的数据才落盘**，实时数据 `ttlMs: 0`（`EntityCache.set` 见 0 跳过写盘）。全部 40 处 `cache.fetch`/`cache.set` 已改引用档位；导出 `CacheTtl`/`CACHE_TIERS`/`CacheTier`/`CacheTierKey`
- `discover.feedModes()`：解析 `FeedMode` → `{preferences, bar, scenes}`。`preferences` 是已知的推荐/熟悉/新鲜三项（`FEED_PREFERENCE_MODES`，`current` 标上游选中的），`scenes` 是 45 个场景（`radioId` 即 `scene_mode_id`，可直接 `radioTracks()`）
- `discover.feedSongTab({ preferenceMode })`：偏好流，`default`/`familiar`/`fresh`
- **`feedSongTab` 请求按 App 口径补全**（`FeedSongTabOptions`）：`feed_mode: 'track'`、`count`、会话计数 `is_first_request`/`total_request_count`/`preference_mode_request_count`。`played_tracks` 机制已实现（本地播放历史最近 20 条按时间升序；`TrackPlayed` 在 IDL 里是 opaque `any`，字段名按同构 `MediaPlayed` 推，实测上游全收、`count=3` 就回 3 首），但 `withPlayedTracks` **默认 false** 不带——播放时长还没向上游上报，主动带会暴露「只播不报」；「熟悉/新鲜是否改变出歌分布」仍未验证
- **`feedSongTab` 客户端过滤**：`excludePlayed`（本地 journal 最近 500 条）/`excludeLiked`（需登录，拉不到跳过）/`maxPages`（默认 3，翻页补齐到 `count`）——「只要没播过的」走确定性过滤，不赌上游 `preference_mode`
- `discover.radioTracks(id: string | number)`：短数字 `scene_mode_id` 也能当 `radio_id`（实测两种 id 都吃）

### Changed

- **旧版单账号 `session.json` 由 `SessionManager.init()` 一次性迁移**：拆出 device.json + accounts/（原件改名 `.bak`），并清掉共享位上旧版落过的私有/带我态 kind（代价是一次冷拉，防串号）
- `rememberIdentity` 只在 **uid 真的换人**时才回调写 `config.activeUid`：`--as` 临时实例里 `me()` 顺手记昵称不再把临时号写成默认激活
- **实体元数据缓存从 30 分钟改成 6 小时**（专辑/艺人/歌单详情、曲目元数据），榜单 30 分钟；`entityTtlMs` 配置退化为兜底（所有调用点都显式传档位）
- **写后失效补全**：`library` 新增 `collectionCache()`，收藏/歌单所有写方法统一 `invalidate({kind:'playlist-detail'}, ...collectionCache())`；`collectMedia`/`uncollectMedia` **之前完全没失效**，现补上；`social.follow`/`unfollow` 追加失效 `me`
- 冒烟 `test/smoke.ts` 增到 **46 步**：缓存分档断言（「实时数据不落盘」「元数据落盘第二次零请求」）+ **多账号机制段**（旧 session.json 迁移、`_acct/<uid>` 互不可见、切号编排/cookie 无残留、`--as` 临时态、`logout --purge` —— 该段全程零网络）

### Fixed

- **搜索只出歌曲的 bug**：`unwrap()` 原来只剥 `*_wrapper`（外加一个 `track` 特判），没剥搜索结果的 `entity.<kind>`（`entity.artist`/`entity.album`/`entity.playlist`），导致 `search --type artist|album|playlist`（以及 `all` 的非歌曲分组）实体全为空；`tracks/albums/artists/playlists` 现都解析得出
- **`unwrap()` 剥壳规则重写**：`*_wrapper` 照剥；对**没有字符串 `id`** 的对象，只要**恰好命中一个**实体键（`track`/`album`/…）就落到该实体上 —— 这样既认 `entity.artist` 这种单键壳，也认 `track_wrapper: { track, limited_free_info }` 这种「实体键 + 附属元信息」。**用「无 id」把包装与真实体分开**，曲目自带的 `album` 字段不会被误剥（此前按「键全在实体名集合里」判，会漏掉带 `limited_free_info` 的 `track_wrapper`，把 `catalog.track()` 这类详情打空）

### Removed

- **弃用 h5 版搜索 `Search2023`**：不再调用（旧 h5 接口、要登录、可能过时且易被风控）；`SearchPageOptions.h5` 一并去掉，搜索只走匿名 `/luna/search/<type>`

## 0.1.0 — 2026-10-17

首个版本：`qishui-api` 之上的应用后端层（账号/曲库/歌单/发现/搜索/评论/社交 + 播放器状态机 + 本地数据与媒体缓存）。数据目录默认 `~/.qishui`。

### Added

- `QishuiCore` 门面 + `createQishui()`：`private constructor(deps)` + `static create()`，先建会话再统一注入（避免重复注册设备）
- 服务九件套（按能力分类，方法注释写明实测口径与坑）：
  - `account` 资料/统计/会员/隐私/黑名单/上传凭据/播放上报
  - `catalog` 曲目（`MGetMedia` 按 id 批量，先本地缓存后补齐）/专辑/艺人/歌单/榜单/权益检查/相似/统计
  - `discover` 首页（grid/feed 两版面）/块下钻/推荐流/歌单广场/场景电台/冷启动配置
  - `search` 全类型搜索/联想/推荐词/分类/热搜（恒空，已注明）
  - `library` 我的歌单/收藏曲目（整张翻页 + 5 分钟缓存）/最近播放/歌单增删改/各类收藏
  - `comments` 读/发/回复/点赞/删除（注明 `group_type` 读写口径不同、`3056` 是上游答案）
  - `social` 用户/粉丝/关注/公开歌单/关注与拉黑（风控敏感接口 5 分钟缓存）
  - `feedback` 举报原因/举报/不感兴趣/分享计数/埋点
  - `link` 分享链接解析→短链→元数据→可播地址
- OOP 实体：`Track` / `Album` / `Artist` / `Playlist` / `User` / `Comment` / `Chart`（`.data` 归一化、`.raw` 原始响应、`track.play()` 等直接可用）
- 播放器 `Player`：**只做状态机不出声**；`idle/loading/playing/paused/stopped/error`，250ms 时钟，`repeat/shuffle/seek/next/previous/enqueue`，`skipOnError` 自动跳过解析失败的曲目
- `PlayQueue`（随机播放不破坏原顺序）+ `Lyrics`（KRC 行级+逐字时间轴查询）
- 缓存两层：
  - `EntityCache` 元数据 TTL 缓存（并发同 key 只发一次、`invalidate`、`prune`、`clear`）
  - `MediaCache` 媒体缓存：音频/歌词/封面落盘，`peek/has` 纯读盘零网络，`.part` + `Range` **断点续传**，`stats/list/verify/prune/evict/clear`
- `PlayHistory` 本地播放历史（`journal/plays.jsonl`，append-only、自动裁剪）
- `session` 设备身份 + **汽水音乐 App 扫码**登录 + `0600` 会话落盘 + `importFrom()` 迁移（会把 cookie 注入已建好的 Client）
- `config` `~/.qishui/config.json`（TTL/超时/封面宽度/媒体缓存上限/`reportPlayback`/默认循环随机）
- 写入安全：本地历史永远记；**上报上游默认关**；不做批量下载；写后按操作失效相关缓存
- `parse.ts` 响应归一化：`unwrap` 剥各种 wrapper、`asX` 形状识别、`collectX` 递归捞实体（应对 IDL 叶子类型被擦除后的形状漂移）
- 端到端冒烟 `test/smoke.ts`（36 步，含「磁盘缓存命中零请求」「重播命中媒体缓存零请求」断言）

### Notes

- **删除 `UnsupportedError`**（同 `qishui-api`）：不再替上游判「不可用」，改成「未验证 / 这个条目不可播」
- 实测依据见 [`../qishui-api/docs/APP_ENDPOINTS.md`](../qishui-api/docs/APP_ENDPOINTS.md)；core 依赖的 `MGetMedia`/`MCheckTrack` 是本轮补测的（匿名可用）
- **VIP 行为未验**（本机会话非会员）
