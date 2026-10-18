# Changelog

本包（`qishui-core`）的变更记录，最新在上。

## Unreleased

### Added

- **听歌模式收成一个值、一处取批**（TUI 把侧边栏第 3 项从「电台」重做成「听歌」单选台的后端口子）：
  - `FeedModeRef = {kind:'preference', mode} | {kind:'scene', radioId}` —— 「当前用哪个模式听」的唯一形态；配 `formatFeedMode()` / `parseFeedMode()`（文法 `preference:<mode>` | `scene:<radioId>`，**认不出或空串一律 `undefined`，不猜**——场景是短数字、首页 `discover_radio` 是雪花 id，「纯数字就当场景 id」这种隐式判定等于替上游下结论）。三个连同 `FEED_PREFERENCE_MODES` 都从包入口导出。
  - `config.feedMode: string`（默认 `''` = 没选过）：上游**没有**「保存听歌模式」的写接口，`feed_mode_bar` 也只回它自己当前的那一条，所以这一项声称的是「本机记住的偏好」，不是上游状态。它同时是全仓唯一带写回通道的配置项（`saveConfig()`），CLI `config set` 的白名单直接取 `CONFIG_DEFAULTS` 的键、字符串原样透传，**不用改 CLI**。
  - `discover.feedModeTracks(ref, opts)`：按模式取一批的收门——偏好档走 `FeedSongTab`、场景档走 `FeedRadioTracks`，上层不必自己分流。
  - 离线单测 `test/discover.test.ts` 6 条：`parseFeedMode`/`formatFeedMode` 往返与坏值、`feedModeTracks` 用 mock 上游断言两条档各打哪个端点。
- **登录同时交出两条二维码出路**：`QishuiLogin` 增加 `qrPng`（api 透传的上游官方图）与 `qrImage` —— core 顺手把它落到 `${TMPDIR}/qishui-login-qr-<token 前 8 位>.png`（**0600**：码里编着登录 token，临时目录又是共享的），`onQr` 回调与返回值给的是同一个路径。上游没给 `data.qrcode`、或文件写不进去 → `qrImage` 为 `undefined`，登录照常进行（出图只是便利，不拦路）。离线单测补 2 条：给了 PNG 就落盘且内容/权限对、没给就是 `undefined`

### Changed

- **缓存账号隔离的判据从「端点类别」改成「这一路回不回实体」**：`KIND_SCOPE` 里 `search` / `discover-home` / `discover-mix` / `feed-song-tab` / `playlist-square` / `radio-tracks` / `artist-tracks` / `artist-albums` / `featured` 从 `public` 挪到 `viewer`（落 `_acct/<uid>/`），只有「只回关键词/枚举/配置」的 `sug` / `suggest-words` / `categories` / `feed-mode` / `launch` / `report-reasons` 继续跨号共享。理由写在 `cache/policy.ts` 的注释里：实测（带会话，见 `packages/qishui-api/test/probe-state.ts` 与 `probe-state2.ts`）Search / FeedSongTab / GetChartDetail / MGetMedia / GetArtistDetail 的响应里都嵌 `state.is_collected`，把 A 号的「已喜欢」缓存给 B 号看就是假状态。连带把实体的三态水印显式化：`Track.liked` / `Album.collected` / `Playlist.collected` / `Artist.following`（响应没带 `state` 就是 `undefined`，不当「没收藏」）。`test/store.test.ts` 与 `test/session.test.ts` 里三条旧断言（把 `search` 当 public）跟着改成新口径，并补上「`sug` 仍跨号共享」这一面
- **`feedSongTab` / `radioTracks` 的口径写清：是「连着播的批次来源」，不是浏览列表**（注释 + README，行为没改）：上游实测两条都**一次只随机回约 6 首**（`items[6]`），而下游曾拿它当「一屏可滚的推荐流/场景列表」做过界面（硬写 `count: 30` 去凑、`hasMore: false`）——那是假象，每进一次都是另一批随机结果。`feedModes()` 的注释同步改成「选出来的那一个喂 `feedModeTracks()`」（只能有一个当前值）。
- **测试从冒烟台改为 vitest 单测**：删 `test/smoke.ts`（真打上游），新增 `test/*.test.ts` 10 个文件（session/store/catalog/search/media/player/history/parse/paths/policy + `support/mockUpstream.ts`）——**全程零网络**：注入 mock fetch + 独立数据目录，覆盖旧冒烟台的可离线断言（缓存命中零请求、媒体断点/校验、播放器状态机、多账号机制）；上游契约回归只由 `qishui-api` 实测台负责。`pnpm --filter qishui-core run test` 跑（先 `pnpm run build`，测试从 `../dist` 导入）
- **`createQishui({account})` 严格化**（`--as` 的后端通道）：uid/昵称没入库 → 构造期抛「没有账号 …（已入库：…）」；登出留下的空壳号 → 抛「没有留存会话」。**不再静默回落到激活号**——指错号还照常跑是最危险的形态。`config.activeUid`（持久化默认值）照旧软回落 lastUsedAt，两套语义在 `SessionOptions` 上显式分成 `explicitUid` / `activeUid`

### Fixed

- **搜索结果分组认不出「这一组是什么类型」**（TUI「查看全部」404 的根）：`SearchGroup.type` 是上游 `display_type`，实测 `Search`（`/luna/search/<type>`）每个分组都回**空串**，而分组真正的判别在 `group.id`（实测 `top_results` / `playlists` / `artists` / `tracks` / `albums`）。上层一旦拿 `display_type` 当 `search_type`，请求就打 `/luna/search/` → **HTTP 404**。现在解析时补两个派生字段：`searchType`（`id` 复数 → 单数 `track`/`album`/`artist`/`playlist`；聚合组 `top_results` 映射不到就 `undefined`，不硬凑一个类型）与 `viewAll`（上游 `display_view_all` 原样转布尔，实测「你可能想搜」`false`、其余四组 `true`）——「要不要给查看全部」「这组该用哪个 type」从此只在 core 一处判断。`display_type` 仍原样留在 `type`，注释写明它不是 `search_type`。离线单测：`support/mockUpstream.ts` 的 `/luna/search/<type>` 复刻实测形态（三个分组带真实 id 与 `display_view_all`，**非那 7 个 type 直接回 404**，这条回归一旦被写回就红），`test/search.test.ts` 4 → 6 条
- **按 `l` 一直提示「已取消收藏」、歌也不从「我喜欢的音乐」里走**（TUI 列表页/曲目详情与 CLI `liked check` 共用这条读路径）：`like/unlike` 只失效了 `collectionCache()` 那五档，**漏了 `playlist-detail`**——我的喜欢就是「我喜欢的音乐」（`type=1` 那张自动歌单），`likedTracks()`/`isLiked()` 是从 `GetPlaylistDetail` 重算的，而那一档是 `entity`（6h）。结果写完清掉的只是派生结果、重算时读回的仍是旧页：取消喜欢 → 条目没走 → 下次仍判「已喜欢」，来回按都是同一句。现在写后失效补齐 `playlist-detail`（加歌/删歌原本各自显式带的那条并进同表，不再两处各写一遍），并按 id 清被动过的实体详情（`track`/`album-detail`/`artist-detail`，响应里嵌着「我是否收藏/关注」；只清动过的 id，不把整个 entity 档抹掉，免得白打上游）。新增 `test/library.test.ts` 5 条离线单测（`support/mockUpstream.ts` 补 `/luna/me/playlist` 与 `collection/track[/delete]` 的**有状态**路由：写接口改集合、歌单详情按集合回曲目），断言写完读回真值、取消后条目真的走掉、id 级失效不误伤邻居——把 `playlist-detail` 从失效表里摘掉，其中 2 条当场红
- **扫码登录「显示成功却没入库」（TUI 登录态不刷新的根）**：`QishuiLogin.status()` 只透传上游探测，**入库+激活只挂在 `wait()` 里**——上层（TUI 登录弹层）先轮 `status()` 看到 confirmed、再补一次 `wait()` 想让它走完流程，而 `wait()` 会重新问一遍 `check_qrconnect`，二维码在登录完成后上游常改口 expired/unknown，于是 `persist()` 一次没跑：cookie 没进 `accounts/<uid>.json`、`activeUid` 还是 undefined、`account-changed` 没发。现在 confirmed 是**单向门**：任一入口（`status()` / `wait()`）观测到 confirmed 就当场做且只做一次入库，之后无论上游怎么改口都回 confirmed；`wait()` 改走同一条探测路径，不再另起一轮 `check`。离线单测补 4 条（`support/mockUpstream.ts` 新增 passport `get_qrcode`/`check_qrconnect` 路由，扫码状态可按脚本回放、confirmed 那次下发 `sessionid`）：status 路径入库、确认后上游改口 expired、纯 wait 路径（CLI）不回归、`GetMyInfo` 拿不到身份时 cookie 仍落 `_anon.json`
- **confirmed 不再等于「假装登录成功」**（上一条的续命漏洞）：`persist()` 原来是先把 cookie 灌进内存态 `this.current` 再去写文件，写盘一失败（`accounts/` 被占、只读盘、权限）就成了「界面显示已登录、账号文件一个没有」——重启即蒸发又不自愈。现在**先落盘、后认这条登录**；入库失败时 `status()` 直接抛错并记一条 `[session] 上游已确认登录，但入库失败（下次轮询重试）`，`confirmed` 单向门不回退但这次入库**作废重试**（不会重复问上游），成功之后 `loggedIn`/`activeUid`/`account-changed` 一起到位。离线单测补 1 条：用「`accounts` 是个普通文件」逼出入库失败，断言 `loggedIn=false` → 清掉障碍 → 下一次 `status()` 自己补成 `confirmed` 且 `check_qrconnect` 次数不增
- **试听片段：进度时长错、歌词错位**：分享页给的音频常常只是片段（`演员` 整曲 261.3s，实际 208.9s 起长 52.3s）。`media.resolve` 现在按分享页 `offsetDuration`/`offsetStart` 给出**片段时长** `durationMs` 与 `clipStartMs`，并把区间记进 `track.playableRange`（媒体 meta 升 **v2**；读到 v1 命中只重拉一次分享页补片段信息，音频文件继续用、不重下）。`Player.durationMs` 改为「外部真实时长 > 播放源时长 > 元数据」，新增 `Player.setDuration(ms)`（上层播放器报实际时长）、`clipStartMs` / `songPositionMs`；`lyricState()` 自动把片段起点加回去，歌词不再从 0 开始对不上
- **榜单名次丢失**：上游实测 `track_ranks[].rank` 只有 `rank_type/rank_delta/track_id`，**没有名次数字**，`parseChart` 原来死磕 `rank.rank` 导致 `ChartData.ranks[].rank` 恒为 undefined（CLI `chart <id>` 的名次列整列空白）。现按「数组位次」补名次（跳过非曲目项后 1..n，与 App 显示一致）；上游若哪天给了数字仍优先用数字
- **频繁切歌会异曲同播**：`startCurrent()` 加 loadToken，异步解析晚回来的上一首 `PlaySource` 直接丢弃（`stop()`/`clear()` 也会作废在途解析），不再出现「队列已是新曲、却在响旧曲」的串台

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
