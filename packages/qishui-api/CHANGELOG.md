# Changelog

格式参考 Keep a Changelog；版本号是本库自身语义化版本，**上游快照版本用 git tag `snapshot-v<客户端版本>-<序号>` 表达**。
详见 `docs/MAINTENANCE.md`。

## Unreleased

### Corrected（实测推翻了先前的判断）

- **`1000062` 不是「上游客户端完整性校验」，是一道 query 参数门**：`/luna/h5/track_v2` 只要带 `device_platform=web`，**普通浏览器 UA、无 cookie、无签名、不注册设备就匿名放行**；空 UA、`LunaPC/*` UA 不带该参数照样回 1000062。于是曲目详情/多档音质/歌词/试听区间**不需要爬分享页**
  - 最小参数集实测：`track_id` 必需（缺 → `1000004 ERR_INVALID_PARAM`）、`device_platform=web` 必需；`aid=386088`、`media_type=track` 可选；`vid` 不接受（只传 vid 当参数 → `ERR_INVALID_PARAM`）
  - pc 口不是差这个参数：`POST /luna/pc/track_v2?device_platform=web` 仍是 `200 + 0 字节`
  - 同批改写的旧结论：`catalog.ts` 的 `GetTrackV2`/`GetMediaPlayer`/`GetVideoV2`/`GetTrack`/`GetH5Track`/`GetH5TrackV2`/`GetTrackPlayerInfo`、`docs/APP_ENDPOINTS.md`（§1 新增 h5 轮、§3.5.1、§5「别耗时间」、§6）、`docs/MAINTENANCE.md` §4/§5、本包与 core/cli/tui 的 README
  - **未实测、只登记为推测**：有 VIP 会话时 pc 口 `GetTrackV2` 可能放行，但那类文件**可能加密**；`label_info` 声明的 `lossless`/`hi_res`/`spatial` 匿名从来不给地址。文档里明确标成假设，不作为结论

### Added

- **`src/web/h5Track.ts`：`getTrackDetail()` / `getTrackMedia()`**（曲目详情 + 可播档位 + KRC 歌词 + 权益矩阵，一发 `/luna/h5/track_v2` 拿全）
  - `TrackDetail`：`qualities[]`（实际取得到地址的档，含 `url`/`backup_url`/`bytes`/`bitrate`/`duration_ms`/`codec_type`/`container`）、`declared_qualities`（`bit_rates` 声明的，不代表取得到）、`entitlements`（`label_info.quality_map`：哪档要 VIP / 要单买）、`clip` / `clip_start_ms` / `clip_duration_ms`、`expires_at`、`lyrics`
  - `track_player.video_model` **是个 JSON 字符串**，要 `JSON.parse` 才有 `video_duration` + `video_list[]`；「整曲还是试听段」以 `video_duration` 对 `track.duration` 判（容差 2s，取不到长度按片段处理），`audition_info` 只在它指向同一个 vid 时才可信（整曲可播的曲也带 `audition_info`，指的是另一段）
  - `getTrackMedia()` 把同一份数据归一到 `getShareMedia()` 的返回型（`ShareMedia`），默认取码率最高档、可 `{ quality }` 指定；调用方据此做「h5 失败回落 SSR」
  - 不经 `createClient()`（那会先打一次 device_register），默认匿名发；`{ cookie }` 可选附上
  - 实测与分享页 SSR 对比 5 首：**音频字节数完全一致**、试听区间对得上；整曲可播的条目 h5 还多给 `medium`/`highest` 档
- **`src/web/lyrics.ts`：`parseKrc()`**——KRC 原文（`[行起,行时长]<词偏移,词长,升调>字…`，词时间**相对行首**）解成 `ShareLyrics`；署名行（整句一个词且占满行）标 `type: 'lrc'`，`MAX_SAFE_INTEGER` 哨兵归一为 `undefined`。与 SSR 已结构化的歌词逐行对拍一致
- **`src/web/cdn.ts`**：`expiresAtOf()`（签名地址路径第二段 16 进制 = 过期时刻）与 `mimeOf()` 从 `sharePage.ts` 抽出，h5 与 SSR 两条路共用
- `sharePage.ts` 导出 `BROWSER_USER_AGENT`（桌面 Chrome 串），h5 口用同一个 UA
- `track.GetTrackV2Request` 增加可选字段 `device_platform`（进 query 与 body 两处），并注明它是 h5 那批接口的放行开关
- 本包单测接入 vitest（`pnpm test`）：`test/h5-track.test.ts` 10 条（参数只有 `track_id`+`device_platform`、默认不带 cookie、`1000062` 透传、空/非 JSON/HTTP 500/空 id 报错、整曲 vs 片段判定、无长度信息按片段处理、权益矩阵 vs 声明档位、`expires_at`、没有 `track` 时报错）+ `test/lyrics.test.ts` 7 条。上游可达性仍只由 `test/run.ts` 实测台负责

### Fixed

- **扫码登录交出上游官方二维码图片**：`QrLogin` 增加 `qrPng`（`get_qrcode` 的 `data.qrcode`，`data:image/png;base64,…`）。上游这张图编的是它自己的 `qrcode_index_url`、自带静区（4 模块白边），是官方 PC 客户端显示的那张；终端 ASCII 识别慢时，上层可以把它落成文件给人扫。上游没给就是 `undefined`，不硬编
- **分享页试听片段信息**：`ShareMedia` 增加 `offset_start_ms` / `offset_duration_ms`（来自 SSR 的 `offsetStart` / `offsetDuration`，秒→ms）。整曲可播时缺省；`duration_ms` 仍是**整曲**时长。实测（`演员`）：整曲 261.3s，分享页给的音频其实是 208.9s 起、长 52.3s 的片段。消费方据此算播放进度、按起点偏歌词

### Fixed

- **扫码深链把项目名当电脑名发了出去**：`scan_login` 深链的 `computer_name` 原来硬编码成 `qishui-api`，手机 App 扫码确认页会直接显示「在 qishui-api 上登录」——等于自报家门。现改为取本机计算机名（`os.hostname()`，与官方 PC 客户端同口径），可用 `QISHUI_COMPUTER_NAME` 或 `createClient({ computerName })` 覆盖；新增导出 `defaultComputerName()`

## 0.1.1 — 2026-10-17

### Added

- `test/check-catalog.ts`（`pnpm run check:catalog`）：把 `catalog.ts` 里每个端点的参数与 IDL 声明逐字核对（必填/位置/类型），当前 **90 条 0 问题**，作为改参数后的回归闸门
- `test/probe-feedmode.ts`：`FeedSongTab` 的 `preference_mode`、`FeedRadioTracks` 的 `radio_id` 两种形态实测

### Corrected（实测推翻了先前的判断）

- **搜索结果实体的壳**：在 `result_groups[].items[].entity.<kind>`（`entity.track`/`entity.artist`/`entity.album`/`entity.playlist`），**不是**详情接口那套 `*_wrapper`；只认 wrapper 会把歌手/专辑/歌单全解析成空
- **`display_type` 不是 `search_type`**：`all` 搜「周杰伦」的五个分组（`top_results`/`playlists`/`artists`/`tracks`/`albums`）`display_type` **全回空串**，拿它拼 `/luna/search/<type>` 就是 **HTTP 404**（未知 type 一律 404）。分组判别看 `group.id`，「要不要给『查看全部』」看 `display_view_all`（实测 `top_results`=`false`、其余四组=`true`），预览组 `has_more` 都是 `false`
- `FeedMode` 的 `feed_mode_bar` **只回当前选中的那一个**（实测只回 `default`=推荐），不是枚举 3 项；`familiar`/`fresh` 两个取值来自 IDL 常量（`PreferenceModeFamiliar`/`PreferenceModeFresh`）。`FeedSongTab` 的 `preference_mode` 对**任意值**都回 6 首（随机流，不能拿「能回曲」当验证）
- `FeedRadioTracks` 的 `radio_id` 实测**两种都吃**：场景的 `scene_mode_id`（短数字，如 `2/3/5/48`）或首页场景块的 `inner_block_id`（雪花大数），各回 6 首
- **`search_type=user` 与 `video` 上游不返回**：`/luna/search/<type>` 回 `200` 但 body 里没有 `result_groups`（只有 `status_info`/`extra`），换 `search_method`/`search_scene`/`scene_name`/带会话都一样，`all` 的分组里也没有 `users`。属**未验证 / 上游不返回**（只有 `track`/`artist`/`album`/`playlist` 能出）
- `catalog.ts` 四处参数修正（`check-catalog` 抓出）：`GetRelatedMedia` 用 `media_list`、`DeleteCollectedMediaList` 只留 `media[]`（此前误带 `media_list`）、`ShareCount` 用 `items[]`、`GetH5TrackV2` 保留 `queue_type`

### Deprecated

- **`Search2023`（h5 `/luna/h5/search`）**：不再调用（2023 年的旧 h5 接口，要登录、可能过时、易被风控）；搜索一律走 `Search`（`/luna/search/<type>`）。`test/catalog.ts` 里标 `deprecated: true`，实测台不再发送

## 0.1.0 — 2026-10-15

对齐上游快照：汽水音乐 PC **v3.7.0**（官方分发包 SHA-256 `e58578ae…b0e4`）。

### Added

- 320 个端点的 IDL 快照（74 个官方在用），请求字段/位置/可选性逐字来自官方分发包里的接口声明
- `createClient()` 门面：`request<K>(key, req)` 带 `RequestOf`/`ResponseOf` 类型推导、设备注册、cookie 管理、可导出会话
- 抖音扫码登录（`get_qrcode` + `check_qrconnect`），状态机 `waiting/scanned/confirmed/expired/timeout`
- 纯 HTTP 复刻官方 `apiCaller` 选路与 `getTTCommonParams()` 公共参数；`x-ss-stub` body 摘要
- 错误模型：`TransportError` / `ApiError` / `AuthRequiredError` / `RiskControlError`（`UnsupportedError` 已于 2026-10-17 删除，见 Corrected）
- `src/params.ts` 的 `APP_VERSION` 对齐快照版本，`commonParams()` 与 `userAgent()` 都读它
- `docs/MAINTENANCE.md` — 快照出处、已知脆弱点、症状归因表、不可修边界
- `docs/endpoints.md` — 320 端点全表（74 个官方在用）
- `docs/APP_ENDPOINTS.md` — 音乐 App 视角的接口清单与匿名可达性实测：90 条精选接口按 13 个能力分类，
  每条写「能拿到什么 + 关键字段（抄自真实响应）+ 实测结果」，另附 5 条典型链路与「别耗时间」清单
- `test/` — 接口实测台：`catalog.ts` 清单（端点 + 能力 + 最小参数）、`run.ts` 依次实测
  （先采真实样本 id 再逐条发请求，分类打印 + 落 JSON）、`login.ts` 扫码落会话、`dump*.ts` 抓样本响应、
  `probe-params.ts` 试参数。无会话时写接口只验拦截；有会话时默认跳过写接口，`ALLOW_WRITE=1` 才发
- `src/web/` — 分享链接入口：`resolveShareLink()` 只跟一跳 `Location` 拿 `track_id`（不解析页面 body），
  `getShareMeta()` 用匿名接口组装标题 / 歌手文案 / 封面 JPEG / 可播性 VIP 标记 / 相关曲目；
  `getImageUrl()` 逐字移植官方 `utils/image.ts` 的 CDN 拼串；`ShareMeta` 为显式字段白名单，原始响应不透传
- `ugc_video` 形态支持：`parseShareLink` 去掉硬编码映射表，改为 `<kind>_id` → 任意 `*_id` → `item_id`/`id`
  三级回落（exact 优先，避免 `/share/track` 上挂的 `comment_id` 解错条目）；
  `getImageUrl` 同时覆盖 track 的 `uri+模板` 拼串与 ugc_video 的签名完整 URL 两种封面形态
- `src/web/sharePage.ts` — `getShareMedia()`：分享链接 → 可播地址。只 GET 一次 `www.qishui.com/share/<kind>` 的
  SSR 页，从 `_ROUTER_DATA` 括号配平截出 JSON，取 `track_page.audioWithLyricsOption.url`（`audio_mp4`）
  或 `ugc_video_page.videoOptions.url`（`video_mp4`），并解析地址里的 16 进制过期时刻为 `expires_at`。
  与 goapi 无关、匿名无 cookie；其余 kind 无流地址直接抛 `QishuiError`
- `getShareMedia()` 附带取出 **KRC 结构化歌词**（track 独有，`audioWithLyricsOption.lyrics`）：`lyric_type: 'krc'`，
  `sentences` 每行带行级 `start_ms`/`end_ms` + 逐字 `words[]` 时间戳（正适合播放器滚动与卡拉 OK 逐字高亮）；
  署名行标 `type: 'lrc'`、末行 `endMs` 的 `MAX_SAFE_INTEGER` 哨兵归一化为 `undefined`；无歌词的曲缺省。
  ugc_video 页无 lyrics，另补 4 个视频字段：`width`/`height`（分辨率）、`first_frame_url`（首帧图）、
  `artist_avatar_url`（作者头像）。新导出类型 `ShareLyrics`/`ShareLyricSentence`/`ShareLyricWord`
- 排行榜落点：`DiscoverView` 空 body（= 官方 `Discover.vue`）回 `discover_top_song_list` 的
  `discover_track_top_list` × 3（热歌榜 50 / 新歌榜 48 / 欧美榜 50，`desc` 写着"每周四更新"），曲目在
  `resources[].entity.ranked_track.track`（**不是** `track_wrapper.track`），另有 `rank.rank_delta`/`rank_type`；
  `{first_request, pc_new_discover_request:true}`（官方 `sceneMode.ts` 听歌模式）只回 30 个场景队列 —— **榜单块不在响应里**
- 登录态写链路实测跑通：`GetMyInfo` → `CreatePlaylist`（`type=2` 私有单）→ `MAppendPlaylistMedia`
  （`{ id, type: 'track' }`，`count_tracks` 从 0→1）→ `GetPlaylistDetail` 回读曲目 → `getShareMedia` 取地址
  → 下载 1,729,552B `m4a` → `MDeletePlaylists` 删临时单 + `GetMyPlaylists` 回读确认消失
- 登录态整链路实测跑通（设备/会话 → `GetMyInfo` → 收藏盘点 → 逐首 `getShareMeta` + 封面落盘（sha256）→ 调用清单）：
  首轮真实扫码把 `waiting → scanned → confirmed` 与 `sessionid` 落地跑通，11 次 goapi 调用全部 `http=200` 且带平台 logid

### Changed

- 措辞统一到「接口协议整理」口径：README/CHANGELOG/docs/注释里的旧提法一律改为「整理 / 对齐 / 官方分发包 / 拿到」；
  合规段改为「仅供学习研究，请遵守平台服务条款」
- 仓库结构收缩为本包一处（`packages/qishui-api/`），根目录只留 workspace 根（`packageManager` + `pnpm -r build` 等快捷脚本）

### Corrected（实测推翻了先前的判断）

- 喜欢的歌**不在** `GetMyMixedCollections`：该端点只装「收藏的歌单/专辑」（实测返回仅 `status_info`，即没有此类收藏）。
  收藏曲目在自己的歌单里：`GetMyPlaylists`（「我喜欢的音乐」`type=1`、「抖音收藏的音乐」`type=4`）
  → `GetPlaylistDetail` → `media_resources[].entity.track_wrapper.track`。已写进 `MAINTENANCE.md` §3
- `my_stats.count_all_liked` 是「收到的点赞」（同行 `all_comments_liked_detail.popup` = "还没收到点赞"），
  **不是收藏数**；实测某个账号该值为 0，而其喜欢歌单里有多首曲目
- 歌词没有独立接口：`GetTrackV2Response` 内含 `lyric: track.TrackLyrics`，与音频同响应、同闸门；
  全 320 端点的 path/name 无 `lyric`/`lrc`。README 早先「歌词走已封装的官方歌词接口」的说法是错的，已改
- `GetMyFavoriteVideoList` / `GetMyCollectionVideoList` 实测 404（IDL 声明的 path 与线上不一致），已记录
- 「POST 即写接口」是错的：`DiscoverView` / `DiscoverMix` / `FeedMode` / `FeedPlaylistSquare` / `FeedSongTab` /
  `GetRelatedMedia` / `MCheckMedia` / `GetCommerceConfig` / `ShareCount` 都是 **POST 只读**。按 method 分类会把这 9 个
  误判成写接口而跳过；改成先认读前缀（`Get|List|MGet|MCheck|Discover|Feed|Sug|Search|Share|Count|Check|Is|Has`），
  剩下的才按写处理
- 带会话跑时**可选字段不能一律填满**：`GetPlaylistDetail` 带上占位 `media` 直接 `1000004`，`type/scene/sort_type` 填 `0`
  也是非法枚举。探测改为只发必填 + 有真样本的字段，且媒体类样本只喂给目标写接口（`ok_json` 因此 30→31）
- `Playlist` 实体的字段名只能靠响应钉（`entity/playlist.ts` 在编译期被擦除）：标题是 `title` 不是 `name`，
  计数是 `count_tracks`（另有 `resource_cnt` 是对象），`type=2` 为自建单；`MDeletePlaylists` 响应里**没有 `status_code`**，
  成功标志是 `deleted_playlists` 数组带上该 id。写链路如果按 `name`/`status_code` 读会得出「建单没名字」「删单失败」的假结论
- `parseShareLink` 的三级回落会误报：`/share/album?album_id=&comment_id=…` 拿评论 ID 当专辑 ID 返回。
  改为精确键 `<kind>_id` 只要出现就只认它，值非法就返回 `undefined`；精确键缺席时（`modal_id` 这类）仍走回落
- `GetSearchBlock` 的 `search_chart_block`（`hot_search_chart`/`hot_song_chart`/`new_song_chart`/`musician_song_chart`）
  恒为空 —— `includes` 是 `SearchBlockType*` 白名单（`search_chart`/`search_hint`/`search_recommendation`），
  `charts` 始终 absent；换 `scene_name` 无效。旁证：PC 客户端源码里既无「热搜」文案，也不调 `GetSearchBlock`
  （不在 `idlMethods` 里）→ 它是 h5 / 移动端的东西。替代：`SuggestWords {suggest_type:'recommendation'}`
- `GetChartDetail` 的 `chart_id` 不是常量名：喂 `hot_song_chart` 这类回 `1000004`，但喂 **`DiscoverView` 榜单块的
  `inner_block_id`** 就正常返回 `chart{title,count_tracks,period,release_time,track_ranks[{rank,track}],style{desc…}}`
  （热歌榜一次 ~150KB）—— 「320 个端点里没有列榜单的接口」不成立，榜单 id 就在 `DiscoverView` 里
- **`Search` 匿名可用**（2026-10-17 复测推翻「恒 200+0 字节」的结论）：两条原因叠加 —— ① 可用的是
  `/luna/search/<type>`（非 pc 变体），`/luna/pc/search/<type>` 恒空；② 请求**不能带 `debug_params`**
  （传 `{}`/`'null'` 都回 `1000004`，整个字段不发就正常）。修复：`src/transport.ts` 加候选 path 回退
  （读请求遇空响应 / 404 / 405 自动换下一条变体；写请求不回退，防重复写入）。`search_type` 的 7 个值由
  `SearchCategories` 给出（all/track/video/artist/album/playlist/user）
- 播放地址三个接口的闸门性质更精确了：手工直打（**绕过本库自己的拦截**）时 pc 变体 `200+0字节`、非 pc 变体回
  `status_code=1000062 应用版本有风险，请从应用商店下载正式版本`
- **删掉 `UnsupportedError`，改为「照发请求、遵从上游」**：那个异常是本库自己抛的，等于**拿本库的策略当接口结论**
  （上游才是裁判）。现在 `GetTrackV2`/`GetMediaPlayer`/`GetVideoV2` 照常发请求，上游回 `1000062` / 空响应就如实报，
  「实测拒答」只标在 `ENDPOINT_DATA[].gated` 上（不影响调用行为）。同理，**匿名口径不等于终局**：
  拿不到不等于不可用，登录/会员态是没试过的变量（本轮已实测下面这条）
- **登录态复测（2026-10-17，汽水音乐 App 扫码，账号 `is_vip:false`）**：只测上轮未结论的 14 条（`test/run.ts`
  新增「已结论即 SKIP、复用上轮样本 id」逻辑，避免重复请求被风控）。**6 条翻盘拿数据**：`GetMyInfo`（`my_info{28}`
  含 `is_vip`/`vip_stage`）、`GetMyPlaylists`（`playlists[2]`）、`GetBlockUserList`（**匿名回 `1000004`，
  带会话正常** —— 正是「得登录才有数据」的例子）、`GetUploaderInfo`（imagex 直传凭据）、`GetMyPrivacySetting`
  （6 个开关）、`Search2023`（h5 搜索，结果在 `result_groups[].data`）。3 条回 `status_code=0` 但空
  （`GetMyMixedCollections`/`GetRecentPlayedMedia`/`GetDigitalAlbums` —— 账号里没数据，不是接口不通）。
  `GetUserInfo` 带会话反被 captcha 拦（风控看频率不看登录态）；`GetReportReason` 仍 `1000004`（**后被写接口轮翻案**）、
  `QueryTokenStatus` 上游 http 500。当时没验的剩两类：29 个写接口（**下一轮已全测**）、所有 VIP 相关行为
- **写接口轮（2026-10-17，29 条全测、全部可回滚）**：新增 `test/write.ts`（每条「做 → 回读验证 → 撤销 → 再回读」）
  与 `test/probe-writes.ts`（换参数/换 path 再试）。结果 **29 条全部 `status_code=0`**（唯一仍不通的是非写接口
  `QueryTokenStatus`：上游 500）；
  收尾 11 项安全复查全过（歌单数/关注数/黑名单/评论/最近播放/收藏/隐私设置回到原样）。4 条「乍看失败」被翻案：
  ① `UpdatePlaylistInfo` 紧跟建单后改名回 `1000014`，**重试即通**；② `CreateComment` 的 `group_type` **必须 `0`(Track)**
  （用 1 回 `5`），且**曲目评论区关着会回 `3056`**；③ `Report`/`GetReportReason` 的 `report_type` 是**字符串枚举**
  （`"track"`）、`report_reason_code` 取 `GetReportReason` 的 `code`（`4001` 等）、path 用**非 pc** 的 `/luna/report`
  —— 给数字/占位参数上游才 500，**之前记的「上游 500」是本库喂错参数**；④ `GetOffersTokensForPC` 给真
  `offer_snapshot_id`+`report_param` 就回 `token`。另修两处字段名：`CommitBlockV2`/`CancelBlockV2` 用
  `block_items:[{id,item_type}]`（不是 `user_id`）、收藏类批量接口用 `media[]`（`MCheckMedia` 才是 `media_list`）。
  两条「写通道通、读回不落地」照实记：`AppendRecentlyPlayedMedia` 写了 `GetRecentPlayedMedia` 仍空、
  `CollectArtists` 写回 `0` 但 `GetUserArtistCollection` 回读看不到
- `test/login.ts` 改成**汽水音乐 App 扫码**（二维码 = `bff-pc.qishui.com/.../scan_login?token=…`，
  此前文档写成「抖音扫码」是错的），并拆成 `--start`（出码）/`--poll`（等扫）两步；二维码借 npx 缓存里的
  `qrcode-terminal` 画到终端，不给项目加依赖
- README 早先「**这条边界跟入口无关**：即使换 h5 / web / 小程序 某个入口技术上能拿到一个可播 URL，本项目也不做」
  是**未实测的断言**，实测被推翻：web 分享页匿名返回的 SSR 里就带着 `audio_mp4`/`video_mp4` 地址，无签名门槛。
  入口的性质确实不同——被 gate 住的是 goapi 那三个接口要的 native 设备证明，不是媒体本身。
- **媒体类补测轮（2026-10-17，8 条）**：`MGetMedia`（`GET /luna/media`，`{scene, media:[{id,type:'track'}]}`）**匿名可用**，
  `media[].entity.track_wrapper.track` 是完整曲目（album/artists/label_info/url_cover/duration，**但不含播放地址**）
  —— 「按 id 批量补曲目详情」有官方口了，不用再爬分享页 HTML；`scene` 传 `""`/`playlist`/`music_mate_queue` 都行，
  **但只有 `type:'track'` 有实体**（album/playlist/ugc_video/video 一律 0 条）。`MCheckTrack`
  （`POST /luna/track/mcheck`，`{track_ids, scene:0}`）**匿名可用** → `track_status[]`，粒度比 `MCheckMedia` 细。
  另 5 条归入「客户端完整性校验拒答」那一类（匿名全拒）：`MGetMediaV2` 各变体 `200+0字节`；
  `GetTrack`（`/luna/track`）、`GetH5Track`（`/luna/h5/track`）、`GetH5TrackV2`、`GetTrackPlayerInfo`（`/luna/track_player`）
  一律 `1000062 应用版本有风险` —— 与 `GetTrackV2` 同族，**登录态也不放行**（会员态仍未验）。
  同时实测确认 `GetPlaylistDetail` 的曲目在 `media_resources[{id,type,entity,collect_info,index}]`
  （请求 `count=20` 回 18 条 + `has_more` + `next_cursor`），`ListArtistAlbums` 回
  `albums[{id,name,artists,company,count_tracks,state,stats,url_cover}]`
  据此把边界改写为「goapi 拒绝 / web 分享页可达」，范围调整由 owner 于 2026-10-15 决定；
  平台《服务协议》的授权口径与合规提示保持不变，用途自行评估

### Not implemented（刻意不做）

- goapi 播放地址（`GetTrackV2` / `GetMediaPlayer` / `GetVideoV2`）：依赖 native 设备证明与签名，**匿名与带会话实测都拒答**
  （`1000062` / 空响应；会员态未验）。本库**照常发请求、由上游裁决**（不伪造 native attest，也不做模拟），
  「实测拒答」标在 `ENDPOINT_DATA[].gated` 上；可播地址走 web 分享页（另一个入口，见 Added）
- `entity/*` 响应叶子类型：源码在编译期被完全擦除，产物中不存在，只能生成为 `any`
