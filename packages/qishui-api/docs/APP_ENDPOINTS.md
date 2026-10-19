# 做一个音乐 App 需要的接口（分类 · 能力 · 实测）

从 320 个端点（74 个官方在用）里挑出**做音乐 App 真正会用到的那批**，按能力分类，每条都过了一遍真实请求。

**实测口径**（2026-10-17 三轮 + 10-18 复查轮 + 10-19 h5 轮，逐轮见 §1）

- **匿名轮**：无会话，设备身份复用本机 `qishui-device.json`；每条端点只发**最小参数**，相邻请求间隔 1.2s 串行
- **登录轮**：**汽水音乐 App 扫码**（`test/login.ts`，非抖音）落会话后重跑；只测上一轮没拿到数据的，**已有结论的一律跳过**（`test/run.ts` 的 SKIP，防风控）
- **写接口轮**：29 个写端点单独一轮跑（`test/write.ts`），每步「做 → 回读验证 → 撤销 → 再回读」，收尾做安全复查；失败的那几条用 `test/probe-writes.ts` 换参数/换 path 再试（`Report` 就是这么翻案的）
- 账号属性：`is_vip: false` / `vip_stage: "free"` —— **非会员**，所以会员相关的行为这条仍验不了
- 样本 id 是从匿名可读接口里现采的（曲目/专辑/艺人/歌单/用户/评论/电台/榜单各一个），不是硬编码
- 某条回空/404 时，会把它的**所有 path 变体**再打一遍（`test/probe-variants.ts`）——这一轮就是这样救回 `Search` 和 `GetChartDetail` 的
- 复现：`pnpm run build && node --experimental-strip-types test/run.ts`（清单在 `test/catalog.ts`）
- 明细 JSON 落在 `/tmp/opencode/endpoint-report.json`（写接口轮另落 `write-report.json`）；响应样本在 `/tmp/opencode/samples/*.json`
- 下表**字段名全部抄自真实响应**，不是从 IDL 推断的（IDL 的 `entity/*` 是纯类型声明，编译期已被擦除）

> 标注约定：**匿名** = 不带 cookie 就能拿到业务数据；**登录** = 未登录回 `1000016`，带会话能拿到；**✗** = 实测走不通。

---

## 1. 实测总览

**匿名轮（82 条全跑）**

| 结果 | 条数 | 含义 |
|---|---|---|
| `ok_json` | 32 | 拿到业务数据 —— **匿名就能用的那批** |
| `login_required` | 38 | 未登录被 `1000016` 挡掉（其中 29 条是写接口） |
| `ok_thin` | 4 | 响应 `status_code=0` 但没有数据（空推荐位 / 纯上报接口） |
| `client_rejected` | 3 | 播放地址类：上游回 `1000062 应用版本有风险` 或空响应（**库照发请求，不拦**） |
| `biz_error` | 3 | 参数/枚举不对（`1000004`） |
| `error` | 1 | `FlowSearch` HTTP 404（path 线上不存在） |
| `risk_control` | 1 | `GetUserInfo` / `GetFollowingList` 偶发 captcha（社交接口反复跑会被打标） |

**登录轮（只测上轮未拿到数据的 14 条）**

| 结果 | 条数 | 是哪几条 |
|---|---|---|
| `ok_json` | 6 | `GetMyInfo`、`GetMyPlaylists`、`GetBlockUserList`、`GetUploaderInfo`、`GetMyPrivacySetting`、`Search2023` |
| `ok_thin` | 3 | `GetMyMixedCollections`、`GetRecentPlayedMedia`、`GetDigitalAlbums` —— 回了 `status_code=0` 但**这个账号里没数据**（没收藏/没数字专辑；~~没播放记录~~ **播放记录那条已翻案**：这个账号有 200+ 条，只是不在这张表里，见 `GetRecentPlayedTracks`） |
| `risk_control` | 1 | `GetUserInfo`（**匿名时能拿到**，带会话反而被打标 —— 风控看请求频率，不看登录态） |
| `biz_error` | 2 | `GetReportReason`（**写接口轮翻案**：`report_type` 要给字符串 `"track"`）、`GetOffersTokensStatusForPC`（**写接口轮翻案**：给真 `token` 就回 `token_status`）|
| `error` | 2 | `QueryTokenStatus` HTTP 500（上游 v1 GET 路由，不是我们的问题）、`FlowSearch` 404 |

**写接口轮（29 条全跑，全部可回滚）**

| 结果 | 条数 | 说明 |
|---|---|---|
| `status_code=0` | 29 | 建单/加歌/改名/删单、收藏↔取消（曲目/专辑/艺人/歌单/媒体列表）、关注↔取关、拉黑↔解除、发评→点赞→删评、`Dislike`、举报、改隐私（原值回写）、取下单 token —— 逐条见 §3.12。其中 3 条是「乍看失败、换参数/换 path 后翻案」（`UpdatePlaylistInfo`/`CreateComment`/`Report`）|
| 上游 500 | — | `QueryTokenStatus`（**不是写接口**，GET v1 路由，同 token 走 v2 正常；见 §3.11）|

跑法：`test/write.ts`，每步「做 → 回读验证 → 撤销 → 再回读」，收尾 11 项安全复查本次 **11/11 通过**（账号数据回到原样）。

**补测轮（2026-10-17，只发没结论的 9 条：新增 8 条 + 2 条 error 复查）**

| 结果 | 是哪几条 |
|---|---|
| `ok_json` | `MGetMedia`（曲目版 + 混类型版）、`MCheckTrack` —— 见 §3.5，这两个是 core 的「按 id 批量取曲目详情 / 查可播状态」的底座 |
| `empty_body` | `MGetMediaV2`（GET `/luna/media_v2` → `200+0字节`） |
| `client_rejected` | `GetTrack`、`GetH5Track`、`GetH5TrackV2`、`GetTrackPlayerInfo` —— 一律 `1000062 应用版本有风险`（非会员）。**这条当时把 1000062 归因成「上游客户端完整性校验」，后续实测证明归因错了**：门是 query 参数 `device_platform=web`，见 §1 的关键修正 ④ |
| 仍是 `error` | `FlowSearch` HTTP 404、`QueryTokenStatus` HTTP 500（两条上游侧问题，复查不变） |
| 未重发 | 其余 80 条沿用结论（`ok_json`/`ok_thin`/`client_rejected` 默认不重发，防风控；`FORCE=1` 可重测）|


**h5 口径轮（2026-10-19，只测 `/luna/h5/track_v2` 一条，5 个曲目样本）**

| 结果 | 结论 |
|---|---|
| `ok_json` | `GET /luna/h5/track_v2?track_id=<id>&device_platform=web` —— **普通浏览器 UA、无 cookie、无签名、不注册设备，匿名就能拿到完整数据**：`track`（`label_info` 权益矩阵 / `bit_rates` 完整体积 / `audition_info`）+ `track_player`（`video_model` 多档地址）+ `lyric` + `expire_at`。最小必需参数只有 `track_id`（缺 → `1000004 ERR_INVALID_PARAM`）与 `device_platform=web`（缺 → `1000062`）；`aid=386088`、`media_type=track` 可选，`vid` 不接受 |
| 仍是 `empty_body` | `POST /luna/pc/track_v2?device_platform=web` 依旧 `200 + 0 字节` —— **那条放行只对 h5 口有效，pc 口不是差这个参数** |

**一句话结论**：匿名能搭起「可浏览、可搜索、可看详情/评论/歌单、可拿播放地址（曲目走 `/luna/h5/track_v2`、`ugc_video` 走 web 分享页）」的骨架；
**个性化与写入都要会话，登录后确实都通**（登录轮 6 条翻盘 + 写接口轮 28/29）；
真正拿不到的只剩**会员专属行为**（本账号 `is_vip:false`）和 `QueryTokenStatus` 那条已下线的 GET 路由。

> 四处关键修正（都是「之前判死、其实是我没试对」）：
> ① **`Search` 与 `GetChartDetail`** —— `Search` 要走非 pc 变体且不能带 `debug_params`，
> `GetChartDetail` 的 `chart_id` 要用榜单块的 `inner_block_id`（详见 §3.2 / §3.3）。
> ② **`Report` / `GetReportReason`** —— 不是「上游 500 / 参数永远不对」，是 `report_type` 得给**字符串枚举**（`"track"`）
> 且 path 用非 pc 的 `/luna/report`；`report_reason_code` 取 `GetReportReason` 返回的 `code`（详见 §3.12）。
> ③ **不再替上游下结论**：播放地址那三个接口以前由本库自己抛 `UnsupportedError` 拦下（等于拿本库的策略当接口结论），
> 已删除拦截 —— 现在**照发请求**，上游回什么就记什么（`1000062` / 空响应），只在 `ENDPOINT_DATA[].gated` 上留标记。
> ④ **`1000062` 不是「客户端完整性校验」**：`/luna/h5/track_v2` 后续实测翻了案 —— 这道门是 query 参数
> `device_platform=web`（换 UA 没用：空 UA、LunaPC UA 都照样回 1000062；带上这个参数、普通浏览器 UA 就通）。
> 所以曲目详情/多档音质/歌词/试听区间**匿名就能直接从 API 层拿**，core 的取址链路已改成 h5 优先、分享页兜底。
> 同批那几条（`GetTrack`/`GetH5Track`/`GetTrackPlayerInfo`/`GetMediaPlayer`）**没有逐条试过补这个参数**，
> 旧结论只覆盖「库客户端口径（`device_platform=windows`）」，不是终局。


---

## 2. 选型速查

| 我要做… | 用哪些端点 | 匿名可用 |
|---|---|---|
| 冷启动 + 首次偏好引导 | `Launch`（`boost_setting` 里有 15 个曲风 + 5 个语种 + `need_set`） | ✅ |
| 首页（推荐 + 榜单） | `DiscoverView` 空 body | ✅ |
| 场景电台（专注/摸鱼/图书馆…） | `FeedMode` → 45 个场景 → `FeedSongTab { feed_preference: { scene_mode_id } }`（场景真正生效的唯一一条路，见下） | ✅ |
| 推荐流（单曲） | `FeedSongTab`（6 首/次） | ✅ |
| 歌单广场 | `FeedPlaylistSquare` | ✅ |
| 搜索框下拉 | `Sug`（词条） | ✅ |
| 搜索出实体 | `Search`（`/luna/search/<type>` → `result_groups`） | ✅ |
| 推荐搜索词 | `SuggestWords`（推荐词带 track id） | ✅ |
| 搜索分类 tab | `SearchCategories`（7 个 `search_type`） | ✅ |
| 榜单详情（整榜） | `DiscoverView` 榜单块的 `inner_block_id` → `GetChartDetail` | ✅ |
| 曲目/专辑/艺人详情 | `GetAlbumDetail` / `GetArtistDetail` / `ListArtistAlbums` / `ListArtistTracks` | ✅ |
| 按 id 批量补曲目详情 | `MGetMedia`（只认 `type:'track'`，实体里**没有播放地址**） | ✅ |
| 相似歌曲 | `GetRelatedMedia`（6 首/次） | ✅ |
| 曲目元数据（标题/歌手/封面/可播性） | `GetShareInfo` | ✅ |
| 播放地址 + 歌词 | 曲目 `getTrackMedia()`（`/luna/h5/track_v2`，见 §3.5.1）；`ugc_video` 与分享链接种类识别仍走 `GetShareInfo` → `getShareMedia()` 读 web 分享页 SSR | ✅ |
| 播放前查权益 | `MCheckMedia`（批量 `media_list`）/ `MCheckTrack`（批量 `track_ids`）/ `GetMediaStats`（计数） | ✅ |
| 评论 | `ListComments` / `ListReplies` | ✅ |
| 别人主页 | `GetUserInfo` / `GetUserPlaylists` / `GetFollowerList` | ✅（`GetFollowingList` 易风控） |
| 我的音乐（我的歌单） | `GetMyPlaylists`（实测 `playlists[2]`）→ `GetPlaylistDetail` | 需会话（已验 ✅） |
| 我的信息 / 会员态 | `GetMyInfo`（`my_info.is_vip` / `vip_stage`） | 需会话（已验 ✅） |
| 隐私设置 | `GetMyPrivacySetting` / `UpdateMyPrivacySetting` | 需会话（已验 ✅） |
| 黑名单 | `GetBlockUserList` | 需会话（已验 ✅，匿名回 `1000004`） |
| 上传封面/头像（二创） | `GetUploaderInfo`（imagex 直传凭据 + `security_token`） | 需会话（已验 ✅） |
| 收藏/关注/建单/评论 | `Collect*` / `FollowUser` / `CreatePlaylist` / `CreateComment` … | 需会话；**29 条写接口已全测通过**（逐条见 §3.12） |
| 会员与售卖 | `GetMySubscription` / `GetUpsell` / `GetCommerceConfig` / `GetCommerceInfo` | ✅（匿名也能读配置） |

---

## 3. 分类详解

### 3.1 启动 / 身份

| 端点 | 匿名 | 实测 | 能力与关键字段 |
|---|---|---|---|
| `Launch` | ✅ | `boost_setting{genres[15], langs[5], need_set}` | 冷启动第一个接口。`genres` = 15 个曲风（`genre_id`/`name`/`url_pic`），`langs` = 5 个语种（`lang_code`/`name`/`icon`），`need_set` 决定要不要弹首次偏好选择页 |
| `GetMyInfo` | 登录 | `my_info{28}` + `my_stats{9}` + `me_tab_sidebar{1}` | 「我的」页一次铺满。`my_info`: `id`/`nickname`/`douyin_id`/`signature`/`gender`/`age`/`birthday`/`location`/`sec_uid`/`public_name`/`masked_phone_no`/`larger_avatar_url`+`medium_avatar_url`/`is_musician`/`is_music_curator`/`user_artist_type`/`luna_register_time`/`**is_vip**`+`**vip_stage**`/`ai_creator_info`（响应顶层**是 `my_info`，不是 `user`**）|

### 3.2 发现 / 推荐（含榜单）

`DiscoverView`（`POST /luna/pc/discover`）是首页的全部，**参数不同就是两种版面**，实测结构如下：

| 版面 | 参数 | 实测 | 结构 |
|---|---|---|---|
| 推荐页版 | `{}`（空 body） | `blocks[2]` | `blocks[].inner_block[].resources[].entity` —— 30 万字节的大盘 |
| 听歌模式版 | `{first_request:true, pc_new_discover_request:true}` | `blocks[1]` | `discover_playlist_mix` → 30 个 `discover_radio` 场景队列（**没有榜单块**） |

空 body 版的块结构（实际字段）：

```
blocks[0] type=discover_feed_playlist  title=歌单推荐
   └ inner_block[10] type=discover_playlist   title="小众BGM｜…"  inner_block_id  resources[1].entity.playlist
blocks[1] type=discover_top_song_list
   └ inner_block[3]
        ├ discover_track_top_list  title=热歌榜  desc="…每周热度最高的50首歌，每周四更新"  resources[50]
        ├ discover_track_top_list  title=新歌榜  desc="近期发行的热度最高的50首新歌…"        resources[48]
        └ discover_track_top_list  title=欧美榜  desc="…热度最高的50首外文歌曲…"            resources[50]
```

- **榜单就这么拿**：`entity.ranked_track.rank`（`rank_delta`/`rank_type`/`track_id`）+ `entity.ranked_track.track`（完整 track）
- **歌单推荐**：`entity.playlist`（`title`/`desc`/`count_tracks`/`stats`/`url_cover`）
- **整榜明细**：榜单块里每个条目的 `inner_block_id` 就是 `GetChartDetail` 的 `chart_id`，能再拿一次
  `chart{title,count_tracks,period,release_time,track_ranks[{rank,track}],style{desc…}}`（热歌榜一次 ~150KB）

| 端点 | 匿名 | 实测 | 能力 |
|---|---|---|---|
| `DiscoverMix` | ✅ | `inner_block[8~10]` | 按 `{block_type, sub_channel_id}` 下钻某个块（块名就是 `discover_feed_playlist` / `discover_playlist` 这类），换页/展开「更多」用 |
| `FeedMode` | ✅ | `feed_mode_block[1]` + `feed_mode_bar` | 45 个场景音乐（`feed_scene_mode{scene_mode_id, sub_queue_type}`，标题如「图书馆/专注模式/摸鱼」）；偏好栏**只回当前选中的那一个**（实测只回 `default`=推荐），`familiar`/`fresh` 两个取值来自 IDL 常量（`PreferenceModeFamiliar`/`PreferenceModeFresh`），不是响应里枚举出来的 |
| `FeedSongTab` | ✅ | `items[6]` | 单曲推荐流，`entity.track_wrapper.track` + `predict_info.model_preds`（打分，做排序/过滤可用）。`preference_mode` 实测对**任意值**都回 6 首（随机流，不能当验证），有效取值靠 IDL 常量。2026-10-17 补测：App 口径全量 body（`feed_mode:'track'`/`count`/会话计数/`played_media`）上游全收，`count=3` 就回 3 首；但「熟悉/新鲜是否改变出歌分布」仍未验证。**2026-10-19 反编译校正**：官方 App 发的是 `played_media`（`MediaPlayed[]`，不是 `played_tracks`）+ `is_did_first_request`/`did_first_use_time`/`feed_counts.mix_session_count`（见 §3.2 末尾「推荐请求的种子口径」）。core 已按此口径发，种子默认带 |
| `FeedPlaylistSquare` | ✅ | `items[14~17]` + `categories` | 歌单广场；`items[].entity.playlist` |
| `FeedRadioTracks` | ✅ | `items[6]` | **电台队列**续播：`radio_id` 是首页 `discover_radio` 块的 `inner_block_id`（雪花大数，与 `resources[].resource_id`/link 里的 `queue_id` 同值）。2026-10-18 修正旧结论：`radio_id` **不是**场景选择器 —— 喂场景的 `scene_mode_id`（短数字 `30`/`8`）不报错、但回的是通用推荐池（选「日语」推中文歌），连不存在的 `999999999999` 也照回 6 首；队列雪花 id 至少被接受（内容与队列主题的相关性仍未验证，实测混着通用池）。场景见下一行。**App 口径**（反编译 `RadioQueueItem`）：`radio_id` + `cursor` + `flow_type`（默认 2）+ `trigger_info`，后两个是从队列资源 `style.link` 的查询串里取的（`?flow_type=…&trigger_info=…`） |
| `FeedSongTab` + 场景 | ✅ | `items[6~12]` | **场景档的正确口径**：body 里带扁平 `feed_preference: { scene_mode_id: 30 }`（套一层 `{scene_mode:{scene_mode_id}}` 不生效，回通用池）。2026-10-18 实测：`30`=日语回 12 首里 9 首日文（中島美嘉/米津玄師/まふまふ…）、`10`=粤语回富士山下/处处吻/情人、`32`=古典回 Mozart/巴赫、`22`=K-pop 回 aespa/MOMOLAND；`count=12` 就回 12 首 |
| `GetChartDetail` | ✅ | `chart{…}`（~150KB） | 整榜明细：`chart_id` 取榜单块的 `inner_block_id` → `chart{title,count_tracks,period,release_time,track_ranks[{rank,track}],style{desc,bg_url…}}`。**不是** `hot_song_chart` 这种常量名（那样回 `1000004`） |
| `GetFeaturedContents` | ✅ | `ok_thin`（空） | 精选推荐位，实测无数据，别指望 |

**推荐请求的种子口径（2026-10-19 反编译 `reaSodaMusic` 得到，与实测结论互补）**

官方 App 只有一个「播放过的媒体」种子实现 `getMediaPlayed()`
（`recovered/src/services/queue/queueItemUnlimited.ts`），三处共用：`FeedSongTab`（推荐流）、
`FeedSongTab`（听歌模式/场景档）、`GetRelatedMedia`（相似 / 搜索推荐）：

| 段 | 内容 | 字段 |
|---|---|---|
| 1 | 待播队列：当前曲目之后、按播放顺序**逆序** | `{type, media_id, duration, played_mills: -1}`（`-1` = 还没播） |
| 2 | 播放记录：最近的在前 | `{type, media_id, duration, played_mills}`（`duration` 是**秒**，`played_mills` 是已听毫秒） |
| 3 | 两段拼起来**截断到 30 条**（`MAX_COUNT`） | —— |

- `GetRelatedMedia` 的**种子音乐只有 1 首**：`media_list: [{id, type:'track'}]`（当前曲目），不是多首；
  多曲目种子的 `GetRelatedTracks {track_ids[]}` 在 App 里**只有 IDL 声明、零调用点**。
- `FeedSongTab` 每次推荐都带 `played_media`（≤30 条）+ `is_did_first_request`/`did_first_use_time`（设备首刷，落本地 storage）+
  `feed_counts: {mix_session_count}`；偏好档/场景档都走 `feed_preference`（`{preference_mode}` / `{scene_mode_id}`，扁平，不套壳）；
  `FeedRadioTracks` 带 `radio_id`/`cursor`/`flow_type`/`trigger_info`。
- **上游对种子条数没有文档化上限**：IDL 里 `media_list?: media.Media[]`、`track_ids?: string[]` 都不带约束，
  我们也没实测过 >1 个种子 —— 「最多几个」属于**未验证**，别把 App 的 1 首当上游上限。
- core 的实现（`buildPlayedMedia()`）按同一顺序做，但把「播放记录」换成**云端 `GetRecentPlayedTracks` + 本地 journal 混合**：
  云端（账号级、跨设备，登录态才有）在前，本地历史里云端没有的按时间补在后，去重后同样 ≤30 条。

### 3.3 搜索

| 端点 | 匿名 | 实测 | 能力与坑 |
|---|---|---|---|
| `Sug` | ✅ | `sugs[10]` | 搜索联想。`{suggestion, content_type:'artist'\|'playlist'\|'track', entity:<kind>.id, group_id}` —— 只回词条与 id，不回完整实体 |
| `SuggestWords` | ✅ | `suggest_words[6]` | 推荐搜索词，`{keyword, type, group_id}`，**是真实 track id**，当「猜你想搜」用 |
| `SearchCategories` | ✅ | `search_category_tabs[7]` | 搜索页分类 tab，`{search_type, name}`，空 body 即可 |
| `Search` | ✅ | `result_groups[{id,next_cursor,has_more,items}]`（track ~114KB） | **官方搜索，匿名可用**。走 `/luna/search/<type>`（非 pc 变体），分页靠 `next_cursor`；`search_type` 取 `SearchCategories` 的 7 个值（all/track/video/artist/album/playlist/user，all 会回 `top_results`）。结果实体在 `items[].entity.<kind>`（如 `entity.artist` / `entity.playlist`，**不是** `*_wrapper`）。**坑**：不能带 `debug_params`（传 `{}`/`'null'` 都回 `1000004`，不发就正常），且 `/luna/pc/search/<type>` 恒 `200+0字节` |
| `Search2023` | 登录 | ~~`result_groups[].data`~~ | **已弃用，不再调用**：h5 旧接口（`/luna/h5/search/`），2023 年的东西可能过时，老接口更易被风控。搜索一律走 `Search` |
| `FlowSearch` | ✗ | HTTP 404 | `/luna/flow/search/<type>` 这条 path 线上不存在 |
| `GetSearchBlock` | ✅ | `hint_words[1]` | 只有 1 条占位提示词；`search_chart_block` 恒空（那是 h5/移动端的东西） |

> `Search` 是首选；`Sug` / `SuggestWords` 做下拉与「猜你想搜」。三者字段名都以真实响应为准。
>
> **`search_type=user` 与 `display_type` 是两回事**（都实测过，别混）：
>  - 用户搜索匿名与带会话都拿不到：`/luna/search/user` 回 `200` 但 **body 里没有 `result_groups`**（175 字节，只有 `status_info`/`extra`），试过改 `search_method`（track/user/search/空）、`search_scene=user`、`scene_name=search_page` 都一样；`all` 的结果分组里也没有 `users` 分组。属**未验证 / 上游不返回**（PC 客户端那个「用户」tab 走哪条路尚未找到，不拿旧 h5 接口凑）。`artist`/`album`/`playlist` 匿名正常，实体在 `items[].entity.<kind>`。
>  - **`result_groups[].display_type` 不能当 `search_type` 用**：`all` 搜「周杰伦」四个分组（歌单/音乐人/歌曲/专辑）+ 聚合组的 `display_type` **全回空串**，拿它拼路径就是 `/luna/search/` → **HTTP 404**；`<未知 type>` 一律 404。分组的判别看 **`group.id`**（实测 `top_results` / `playlists` / `artists` / `tracks` / `albums`），「这一组要不要给『查看全部』」看 **`display_view_all`**（实测 `top_results` = `false`，其余四组 = `true`）；`has_more` 在这些预览组上都是 `false`，分页另有 `next_cursor`。core 的 `SearchGroup` 已把这两项派生成 `searchType` / `viewAll`。
>  - **翻页只在「按类型搜」时成立**（2026-10-18 复测）：`search_type=track` 回 20 条、`has_more=true`、`next_cursor="20"`，拿它再打一次回**另外 20 条**（与首页零重复）、游标继续 `"40"`；`search_type=album/artist/playlist` 同理。而 `search_type=all` 的那几个分组是**预览**（歌曲 6 / 歌单 3 / 专辑 3 / 音乐人 3，`has_more=false`、`next_cursor=""`）——所以「查看全部」必须拿 `searchType` 再搜一次，不能在 `all` 的预览组上翻页（那里没得翻）。

### 3.4 曲目 / 专辑 / 艺人

| 端点 | 匿名 | 实测 | 能力与关键字段 |
|---|---|---|---|
| `GetAlbumDetail` | ✅ | `album_info{13}` + `tracks[11]` | `album_info`: `name`/`artists`/`count_tracks`/`release_date`/`url_cover`/`url_player_bg`/`stats{count_collected,count_shared,total_count_purchased}`/`pclines`（版权行）；`tracks[]` 是完整 track |
| `GetArtistDetail` | ✅ | `artist_info{12}` + `hot_tracks[5]` + `hot_albums[10]` | `artist_info`: `name`/`count_albums`/`count_tracks`/`url_avatar`/`artist_profile`/`user`/`user_artist_type`；艺人页一个请求就能铺满 |
| `ListArtistAlbums` | ✅ | `albums[32]` | **一次回全量**（林俊杰 32 张 = 搜索页报的专辑数）：`count` 传 `'50'` 也只回 32 条、`has_more` 缺省、`next_cursor="145"` 再打回 0 条 —— 别按 `next_cursor` 翻（翻不动），`has_more` 缺失就当只有一页 |
| `ListArtistTracks` | ✅ | `tracks[50]` | 分页，返回完整 track。2026-10-18 实测：`cursor='0'` → 50 条 + `has_more=true` + `next_cursor='50'`，拿它再打 → **另外 50 条、零重复**、游标继续 `'100'` ⇒ `cursor` 是偏移量字符串，**回传 `next_cursor` 就行，别自己页号 +1**（`count=50` 时页序 1 会被当偏移 1，第二页整页重复） |
| `GetRelatedMedia` | ✅ | `items[6]` | 相似歌曲，`entity.track_wrapper.track`，播放页「相似」用它。**官方 App 口径**（反编译 `RelatedQueueItem`）：种子是 `media_list` 里的**1 首**（`{id, type:'track'}`，就是当前曲目），另带该曲全部 `artist_ids`、`scene_name:'search'`、`played_media`（≤30 条），**不传** `req_count`/`full_media`（用上游默认 6）。本项目 core 额外带 `full_media`/`req_count`（要完整实体、条数由调用方定），种子口径与 App 一致 |

**列表分页的口径（2026-10-18 实测，别再按「页序 +1」传）**

| 端点 | 游标形态 | 翻页 |
|---|---|---|
| `GetPlaylistDetail` | 偏移量（数字，`count` 生效） | 回传 `next_cursor` |
| `ListArtistTracks` | 偏移量（字符串，50 条/页） | 回传 `next_cursor` |
| `ListArtistAlbums` | 一次全量（`next_cursor` 打不动） | 只一页 |
| `ListComments` | 偏移量（`cursor` 就是下一个偏移，按**请求的 count** 前进：`count=5` → `next_cursor='5'`、`count=10` → `'10'`，两页零重复） | 回传 `cursor`/`next_cursor` |
| `ListReplies` | 偏移量（实测 `cursor 0/10` 两页零重复） | 回传 `cursor` |
| `GetUserPlaylists` | 偏移量（实测 7 条 → `next_cursor='10'` → 另外 10 条零重复） | 回传 `next_cursor` |
| `GetRecentPlayedTracks` | 偏移量字符串（首页 `'0'`） | 回传 `next_cursor` |
| `Search`（**按类型**） | 偏移量字符串（20 条/页） | 回传 `next_cursor`；`all` 的预览组没有游标 |

判据是「拿上游给的游标再打一次，两页 id 零重复」（`test/probe-list-cursor.ts` / `test/probe-search-cursor.ts` / `test/probe-playlist-paging.ts` / `test/probe-replies-paging.ts`），不是「能回一页」——推荐/搜索本来就会回东西。

**track 实体长这样**（约 30 个字段，实测键名）：`id` / `name` / `duration`(ms) / `vid` /
`album{id,name,release_date,url_cover,…}` / `artists[{id,name,url_avatar,user_info,…}]` /
`stats{count_collected,count_comment,count_shared}` / `label_info{only_vip_playable,only_vip_download,quality_map,…}` /
`preview{vid,bit_rates}` / `audition_info{vid,start_time_ms,duration_ms}`（试听片段）/ `chorus{start,duration}`（副歌）/
`karaoke{supported}` / `playable_range` / `media_type:"track"` / `lang_codes` / `tags` / `colors`（播放页配色）。

### 3.5 播放与媒体地址

| 端点 | 匿名 | 实测 | 能力 |
|---|---|---|---|
| `GetShareInfo` | ✅ | `share_info{10}` | 曲目元数据的**主力**：`share_title`《茶汤》、`share_desc`(歌手)、`share_cover{uri,urls,template_prefix}`、`short_share_link`、`system_share_link`、`share_weibo_desc`、`share_douyin_info.story_music_id` |
| `MGetMedia` | ✅ | `media[1]` | **按 id 批量取曲目实体**（2026-10 补测）：`media[].entity.track_wrapper.track` 是完整曲目（album/artists/label_info/url_cover/duration），**但不含播放地址**。「按 id 补曲目详情」用它，不用爬分享页。`scene` 传 `""`/`playlist`/`music_mate_queue` 都行；**只有 `type:'track'` 有实体，album/playlist/ugc_video/video 一律回 0 条** |
| `MCheckTrack` | ✅ | `track_status[1]` | 按 `track_ids` 批量查曲目状态（2026-10 补测）：按 track 维度给权益/上下架判定，粒度比 `MCheckMedia` 细 |
| `MCheckMedia` | ✅ | `media_status[1]` | 播放前查权益：`status`(枚举) + `label_info.quality_map`（哪档音质要 VIP/购买），批量传 `media_list` |
| `GetMediaStats` | ✅ | `stats{count_collected,count_comment,count_shared}` | 收藏/评论/分享计数（注意 `media_type` 要传字符串 `'track'`） |
| `GetH5TrackV2`（补测后翻案） | ✅ | `track` + `track_player` + `lyric` + `expire_at` | **`/luna/h5/track_v2` 带 query `device_platform=web` 匿名就能拿到曲目全量**：`label_info` 权益矩阵、`bit_rates` 完整体积、`audition_info`、`track_player.video_model` 多档地址（同响应见 §3.5.1）。库侧实现是 `src/web/h5Track.ts` 的 `getTrackDetail()` / `getTrackMedia()` |
| `GetTrackV2` / `GetMediaPlayer` / `GetVideoV2` / `MGetMediaV2` / `GetTrack` / `GetH5Track` / `GetTrackPlayerInfo` | ✗ | `client_rejected` / `empty_body` | goapi 播放地址与单曲直读口，**这里记的是「库客户端口径」（`device_platform=windows`）**。库照发请求、不拦（早先那个自造的 `UnsupportedError` 已删）；匿名实测全拒答：pc 变体 `200+0字节`，非 pc 变体回 `1000062 应用版本有风险，请从应用商店下载正式版本`（2026-10 把 `MGetMediaV2`/`GetTrack`/`GetH5Track`/`GetH5TrackV2`/`GetTrackPlayerInfo` 也归到这一类；`GetH5TrackV2` 后来翻案，见上）。这几条**没有逐条试过补 `device_platform=web`**，`POST /luna/pc/track_v2?device_platform=web` 试过、依旧 0 字节。**会员态是否放行仍未验证**（本次账号非会员）|


> ### 3.5.1 曲目取址的两条匿名路：h5 优先、分享页兜底
>
> **① `/luna/h5/track_v2`（2026-10-19 实测，本项目现在的默认）**
> ```
> GET https://api.qishui.com/luna/h5/track_v2?track_id=<id>&device_platform=web
> User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) … Chrome/126.0.0.0 Safari/537.36
> ```
> 无 cookie、无签名、不注册设备。`track_id` 与 `device_platform=web` 二者缺一：前者 `1000004 ERR_INVALID_PARAM`，
> 后者 `1000062 应用版本有风险`。**版本门是这个 query 参数，不是 UA**（空 UA、LunaPC UA 都照回 1000062）；
> `aid=386088`、`media_type=track` 传不传都行；`vid` 不接受（只认 `track_id`）。
> 响应：`track`（`label_info` / `bit_rates` 完整体积 / `audition_info` / `preview`）、
> `track_player.video_model`（**是个 JSON 字符串**，解开才有 `video_duration` + `video_list[].{main_url,backup_url,gear_des_key,video_meta}`）、
> `track_player.url_player_info`、`lyric`（KRC 原文）、`expire_at`。
>
> **② web 分享页 SSR（`getShareMedia()`，兜底 + `ugc_video` 唯一路）**：`GetShareInfo` → `system_share_link`
> （`https://www.qishui.com/share/track?track_id=…`）→ 读 SSR 里的 `audioWithLyricsOption.url`（`audio_mp4`）+ KRC 歌词。
>
> **两条路给的是同一份音频**：5 个样本实测字节数完全一致（如 487152 / 972356 / 972375 B），
> 试听区间也对得上（h5 的 `preview.start` 是**毫秒**，实测等于 SSR 的 `offsetStart`×1000）。差别在信息量：
> 整曲可播的条目 h5 会多给 `medium`/`highest` 档（实测 7631943484455995443 匿名拿到 **9391139 B @257 kbps、整曲 291.8s**），
> 而 SSR 只给一档；反过来 `ugc_video` 只有 SSR 能解（`/luna/h5/video_info`、`/luna/h5/ugc_video`、`/luna/h5/video` 实测 404）。
> 所以 core 是 **h5 先试、失败再落 SSR**，两条都不给地址就抛 `MediaUnavailableError` 并把两边各为什么失败都写进消息。
>
> **地址带签名**，`expires_at` 约 24h，过期要重新解析，**不要缓存地址**（缓存的是落盘的音频文件）。
>
> **拿到的常是试听片段，不是整曲**：`track.duration` 是**整曲**时长，`video_model.video_duration` 是**这个 URL 实际给的长度**，
> 后者明显短于整曲（容差 2s）就是片段，从 `preview.start` 起播（实测 `演员`：整曲 261.3s，音频 = 208.9s 起长 52.3s）。
> 所以 `getTrackMedia()` 与 `getShareMedia()` 都给出
> `offset_start_ms` / `offset_duration_ms`：播放进度按片段时长算，歌词时间轴是整曲的、要加上片段起点才对得上。
> （h5 的 `audition_info` 只在它的 `vid` 与 `video_model.video_id` 相同时才可信 —— 整曲可播的条目也带 `audition_info`，指向另一条预览 vid。）
>
> **`label_info` 里的 `lossless`/`spatial`/`hi_res` 匿名从来不出现在 `video_list`** —— 权益矩阵声明了档位，不等于这批地址给得出。

### 3.6 歌单 / 收藏

| 端点 | 匿名 | 实测 | 能力 |
|---|---|---|---|
| `GetPlaylistDetail` | ✅ | `playlist{19}` + `media_resources[13]` | 别人分享/公开的歌单可匿名读。`playlist.title`（**不是 `name`**）/`count_tracks`/`desc`/`url_cover`/`stats`；曲目在 `media_resources[].entity.track_wrapper.track`。**分页**：`cursor` 是偏移量（实测 206 首歌单 `cursor 0/5/10` 三段零重复、`next_cursor` 就是下一个偏移），`count` 生效且能开到 200；**返回条数可能少于 `count`**（`count=50` → 43 条、`count=200` → 179 条，不可播/非 track 的条目被上游滤掉），而 `next_cursor` 按**请求的 count** 前进（`50`/`200`）——所以翻页一律回传 `next_cursor`，**别拿返回条数自己累加偏移**（会重复） |
| `GetUserPlaylists` | ✅ | `playlists[1]` + `total_num` | 某用户的公开歌单 |
| `GetUserMixedCollections` | ✅ | `ok_thin`（该用户没收藏歌单/专辑） | 只装「收藏的歌单/专辑」，**不含收藏的曲目** |
| `GetMyPlaylists` | 登录 | ✅ `playlists[2]` + `total_num` | 我的歌单（已验）。含「我喜欢的音乐」`type=1`、「抖音收藏的音乐」`type=4` —— 取收藏曲目的**唯一入口**；`playlists[]` 带 `title`/`count_tracks`/`url_cover`/`stats`/`type`/`from_feed`/`owner`/`all_sort_types` |
| `GetMyMixedCollections` | 登录 | `ok_thin`（空） | 我的收藏混排（同样不含曲目）。**这条账号里没数据**，所以只验到「不再被拦、结构正常」 |
| `GetRecentPlayedMedia` | 登录 | ~~`ok_thin`（空）「刚登录的账号没播放记录」~~ **已翻案**：回 `{}`（连 `media` 键都没有） | 走 pc 路由 `/luna/pc/me/recently-played-media`。这张表**同一个已登录、真放过歌的账号**（`GetRecentPlayedTracks` 读到 200+ 条）在登录态下也回 `{}`：`media_type` 0/1/2/3、`scene` 空或 `home` 全都一样 —— 所以「空」是这张路由的形态，不是「账号没播放记录」。非 pc 路由 `/luna/me/recently-played-media` 未测。真正的历史在 `GetRecentPlayedTracks` |
| `GetRecentPlayedTracks` | 登录 | ✅ `tracks[200+]` + `has_more`/`next_cursor`/`total_num` | **最近播放的真相**：`/luna/me/recently-played`，游标是**偏移量的字符串**（首页传 `0`，往后把 `next_cursor` 原样回传，不能自己页号 +1）。同一首歌重复播只留最新一条（插表头）|
| `GetDigitalAlbums` | 登录 | `ok_thin`（空） | 已购数字专辑。**这个账号没买过**，所以是空的 |
| `CreatePlaylist` / `UpdatePlaylistInfo` / `MAppendPlaylistMedia` / `DeletePlaylistMedia` / `MDeletePlaylists` | 登录 | ✅ 全部实测通过 | 写链路。`CreatePlaylist{name,is_private}` 回 `playlist{id}`；加歌 `MAppendPlaylistMedia{playlist_id,media[]}` 后 `count_tracks` +1；`MDeletePlaylists` 响应**没有 `status_code`**，成功看 `deleted_playlists` 里有没有那个 id。**`UpdatePlaylistInfo` 紧跟建单后改名可能回 `1000014`，重试即通**（实测 3 次里头一次） |
| `CollectTracks` / `CollectAlbums` / `CollectArtists` / `CollectPlaylists` / `CollectMediaList` / `MDeleteCollected*` | 登录 | ✅ 全部实测通过 | 收藏/关注与取消，成对验证：收藏后 `GetMyPlaylists`(type=1)/`GetMyMixedCollections`/`GetUserArtistCollection` 能读到，取消后读不到。注意 **`CollectMediaList` 的字段是 `media[]`**（不是 `media_list`，那是 `MCheckMedia` 的）|
| `AppendRecentPlayedTracks` / `DeleteRecentPlayedTracks` | 登录 | ✅ 写通道通，**回读也落地** | 上报用 `AppendRecentPlayedTracks{track_ids:[id]}`（`/luna/me/recently-played`），删一条用 `DeleteRecentPlayedTracks{track_ids}`（`/luna/me/recently-played/delete`）。实测一轮：201 → 上报后 202（新记录在表头，同一首重复上报只留最新一条）→ 删除后回到 201。**上报是「记账」不是「播放」**：写完就算播过，别随手动。 |
| `AppendRecentlyPlayedMedia` / `DeleteRecentlyPlayedMedia` | 登录 | ⚠️ 写通道通（回读**无从验证**） | 参数就是 `media[]`，写回 `status_code=0`。但它的读端 `GetRecentPlayedMedia` 本身只回 `{}`（见上），**「读回来仍是空」当年被当成「写回不落地」是错的** —— 那张表本来就读不出东西。要用播放历史请走 `*RecentPlayedTracks` 这对；`*RecentlyPlayedMedia` 是否真落库未验证。 |

### 3.7 用户 / 社交

| 端点 | 匿名 | 实测 | 能力与关键字段 |
|---|---|---|---|
| `GetUserInfo` | ✅ | `user{19}` + `user_stats{9}` + `my_user_state{3}` + `vip_info{2}` | `user`: `nickname`/`douyin_id`/`larger_avatar_url`/`signature`/`gender`/`location`/`sec_uid`/`ip_location`/`is_luna_user`；`user_stats`: `count_follower`/`count_following`/`count_all_liked`（**是收到的点赞，不是收藏数**）/`count_asset`。**风控敏感**：带会话连跑两次都被 captcha 拦（`RiskControlError`），降频/换时段再试 |
| `GetFollowerList` | ✅ | `follow_items[N]` + `total_count` | 粉丝列表，`{item_type,user,my_user_state,user_artist_info}` |
| `GetFollowingList` | ⚠️ | `risk_control` | 关注列表，结构同上；**反复跑会被 captcha 打标**，降频/带会话 |
| `GetUploaderInfo` | 登录 | ✅ `uploader_info{image_host, service_id, security_token{access_key_id, secret_access_key, session_token, expired_time, space_name}}` | **imagex 直传凭据**：做二创/上传封面时长这样拿 token（短视频上传者信息）。注意 `security_token` 是敏感凭据，别落盘/别打日志 |
| `GetBlockUserList` | 登录 | ✅ `next_cursor` | 黑名单列表（**匿名回 `1000004`，带会话正常** —— 这条就是"得登录才有数据"的典型）。这个账号为空所以只有游标 |
| `FollowUser` / `UnfollowUser` / `CommitBlockV2` / `CancelBlockV2` | 登录 | ✅ 全部实测通过 | 关注/取关用 `user_id`（`my_stats.count_following` 关注后 +1、取关后回到原值，实测对得上）；拉黑/解除用 **`block_items:[{id,item_type:"user"}]`**（不是 user_id），`GetBlockUserList` 前后对得上 |

### 3.8 评论

| 端点 | 匿名 | 实测 | 能力与关键字段 |
|---|---|---|---|
| `ListComments` | ✅ | `comments[19]` + `count`/`cursor`/`has_more`/`prompts[1]` | 评论列表（`cursor` 是偏移量：实测 `cursor='0'` → `next_cursor='10'`，`'10'` → 另外 10 条零重复）。`{id, content, count_digged, time_created, count_reply, user{id,nickname,medium_avatar_url,vip_stage,is_vip,public_name}, ip_label, service_id}`；`prompts` = 输入框占位文案 |
| `ListReplies` | ✅ | `reply_infos[20]` | 评论回复分页 |
| `CreateComment` / `DeleteComment` / `CommentAction` | 登录 | ✅ 实测通过（有前提） | **`group_type` 必须 `0`(Track)**（用 1 回 `status_code=5`）；**曲目评论区关着会回 `3056`**，换一首能发的就行（实测在别的曲目上发成功并已删除）。回 `created_comment`/`comment_token`；`DeleteComment{comment_id}` 删自己的那条 |

### 3.9 行为上报

| 端点 | 匿名 | 实测 | 能力 |
|---|---|---|---|
| `ReportAction` | ✅ | `ok_thin`（只回 status） | 行为埋点（播放/曝光），做推荐反哺 |
| `ShareCount` | ✅ | `ok_thin` | 分享计数 |
| `Dislike` | 登录 | ✅ 实测通过 | 「不感兴趣」：`action_type=1` 标记、`action_type=0` 取消，两次都回 `status_code=0` |
| `GetReportReason` | 登录 | ✅ 实测通过 | 举报原因枚举：`{report_type:"track"}` → `report_reasons[]` 7 条 `{code,reason}`（`4001 色情低俗`、`4002 时政不实信息`、`4003 违法违规`、`4004 未成年保护`…）。**`report_type` 是字符串枚举，给数字回 `1000004`**（之前判死就是这里）|
| `Report` | 登录 | ✅ 实测通过 | 提交举报：`content_id` + `report_type:"track"` + `report_reason_code`（取 `GetReportReason` 的 `code`，如 `"4001"`）。**非 pc 的 `/luna/report` 实测 `http=200` 成功**；pc 的 `/luna/pc/report` 对已举报过的内容回 `101 你已举报过该内容，请稍后再试`。给数字/占位参数上游才回 HTTP 500 |

### 3.10 设置 / 隐私

| 端点 | 匿名 | 实测 | 能力 |
|---|---|---|---|
| `GetMyPrivacySetting` | 登录 | ✅ `privacy_setting{follow_info_visibility, playlist_album_visibility, sync_video_to_luna, my_favorite_visibility, music_wall_visibility, game_play_stats_visibility}` | 6 个隐私开关（数值枚举，0/1/2 各代表不同可见范围）。「设置」页直接渲染这 6 项 |
| `UpdateMyPrivacySetting` | 登录 | ✅ 实测通过 | 参数是 4 个数值开关：`follow_info_visibility`/`sync_video_to_luna`/`my_favorite_visibility`/`music_wall_visibility`。实测用「读到的原值回写」，6 个开关前后逐字段一致（写通道通、没改任何东西）|

### 3.11 商业化 / 会员

| 端点 | 匿名 | 实测 | 能力与关键字段 |
|---|---|---|---|
| `GetMySubscription` | ✅ | `to_purchase_offers[5]` + `free_vip_activity_detail` + … | 会员态与可购项（匿名也能读，能渲染「开通会员」页） |
| `GetUpsell` | ✅ | `upsell_map{5}` + `variables{45}` + `freq_ctrl_cfg` | 会员售卖位文案/频控 |
| `GetCommerceConfig` | ✅ | `privilege_map{15}` + `terms_map{4}` + `nameplate_page{4}` | 权益表、协议文案、铭牌页配置 |
| `GetCommerceInfo` | ✅ | `treasure{2}` + `libra_params_map{4}` | 商品/价格展示 |
| `GetPurchaseOfferToken` / `GetOffersTokensForPC` / `GetOffersTokensStatusForPC` | 登录 | ✅ 实测通过（只取 token，没付款） | `GetPurchaseOfferToken{offer_id,report_param:"{}"}` → 回 `token`；`offer_id` 取 `GetMySubscription.to_purchase_offers[].offer_id`。`GetOffersTokensForPC{offer_snapshot_id,report_param}` → 也回 `token`；`GetOffersTokensStatusForPC{token}` → 回 `token_status`。**真下单（`PurchaseOfferByToken` 等）没测** |
| `QueryTokenStatus` | 登录 | ✗ 上游 500 | GET `/luna/pc/commerce/offers/tokens/status`（v1）无论参数都回 **HTTP 500**；同一个 token 走 POST 的 v2 `GetOffersTokensStatusForPC` 正常 → **这条路疑似已下线**，别用它 |

### 3.12 写接口实测（29 条，全部可回滚）

写接口会**动账号数据**，所以单独一轮跑（`test/write.ts`），每条都是「做 → 回读验证 → 撤销 → 再回读」，
底线三条：① 只碰自己刚造的数据（建单返回的 id，删的也是它）；② 收藏类**先查有没有收藏过**，
原本就有就跳过「取消」，绝不替你取消原有收藏；③ 收尾 11 项安全复查（歌单数/关注数/黑名单/评论/最近播放/
收藏/隐私设置是否都回到原样）—— 本次 **11/11 通过**。

结果：**29 条全部拿到 `status_code=0`**（唯一仍不通的是**非写接口**的 `QueryTokenStatus`，上游 HTTP 500，见 §3.11）。
其中 3 条写接口（加上配套的读接口 `GetReportReason`）有过「乍看失败」的记录，换参数/换 path 后都通了：

| 端点 | 乍看 | 真相（实测） |
|---|---|---|
| `UpdatePlaylistInfo` | `1000014` | 紧跟建单后改名会失败，**重试即通**（同参数后来 3 次全过）；`name`/`description`/`is_private`/`cover_uri` 都能改 |
| `CreateComment` | `5` / `3056` | `group_type` **必须 `0`(Track)**（用 1 回 `5`）；曲目**评论区关着**回 `3056` —— 换一首就能发（我们试的 `ctx.trackId` 正好是关着的） |
| `Report` | HTTP 500 | 参数形状问题是主因：`report_type` 是**字符串枚举**（`"track"`）、`report_reason_code` 取 `GetReportReason` 的 `code`（如 `"4001"`）；path 用**非 pc** 的 `/luna/report`（pc 那条回 `101 你已举报过该内容`，反正也是成功）。给数字/占位参数上游才 500 |
| `GetReportReason` | `1000004` | 同上：`{report_type:"track"}` → 回 7 条 `report_reasons[{code,reason}]`（`4001 色情低俗`、`4002 时政不实信息`…） |

逐条：

| 端点 | 参数要点（实测可用） | 回读验证 |
|---|---|---|
| `CreatePlaylist` | `{name, is_private}` | 新单出现在 `GetMyPlaylists`（响应回 `playlist{id}`）|
| `UpdatePlaylistInfo` | `{playlist_id, name?, description?, is_private?, cover_uri?}` | `GetPlaylistDetail` 的 `title`/`desc` 已变 |
| `MAppendPlaylistMedia` | `{playlist_id, media:[{id,type:"track"}]}` | `playlist.count_tracks` +1 |
| `DeletePlaylistMedia` | 同上 | `count_tracks` 回到原值 |
| `MDeletePlaylists` | `{playlist_ids:[id]}` | 从 `GetMyPlaylists` 消失（**响应没有 `status_code`**，看 `deleted_playlists`）|
| `CollectTracks` | `{track_ids:[id]}` | 「我喜欢的音乐」(`type=1`) 里出现 |
| `MDeleteCollectedTracks` | `{track_ids:[id]}` | 消失 |
| `CollectAlbums` | `{album_ids:[id]}` | `GetMyMixedCollections` 里出现 |
| `MDeleteCollectedAlbums` | `{album_ids:[id]}` | 消失 |
| `CollectArtists` | `{artist_ids:[id]}` | ✅ 落地（**已翻案**）：`GetUserArtistCollection{user_id:自己}`/`GetArtistCollection` 读得到，条目带 `state.is_collected=1`、`follow_status=1` |
| `MDeleteCollectedArtists` | `{artist_ids:[id]}` | ✅ 落地（**已翻案**）：回读消失（空表时上游连 `artists`/`total_num` 都不给）。当年那句「读回存疑」现在复现不出来，别再当结论用 |
| `CollectPlaylists` | `{playlist_ids:[id]}` | `GetMyMixedCollections` 里出现 |
| `MDeleteCollectedPlaylists` | `{playlist_ids:[id]}` | 消失 |
| `CollectMediaList` | `{scene:"track", collect_action:1, media:[{id,type:"track"}]}` | 「我喜欢的音乐」里出现（字段是 **`media`**，不是 `media_list`）|
| `DeleteCollectedMediaList` | `{media:[{id,type:"track"}]}` | 消失 |
| `AppendRecentlyPlayedMedia` | `{media:[{id,type:"track"}]}` | ⚠️ 写回 `0`，但它的读端 `GetRecentPlayedMedia` 本身只回 `{}`，**「仍是空」证明不了没落地**（当年那句「读回不落地」错在把空表当证据）。要喂播放历史走下面的 `AppendRecentPlayedTracks` |
| `AppendRecentPlayedTracks` | `{track_ids:[id]}` | ✅ 落地：`GetRecentPlayedTracks` 总数 +1，新记录在表头，同一首重复上报只留最新一条 |
| `DeleteRecentPlayedTracks` | `{track_ids:[id]}` | ✅ 落地：回读总数回到原值（可回滚，实测 201→202→201 一整轮）|
| `DeleteRecentlyPlayedMedia` | `{media:[{id,type:"track"}]}` | 响应回 `deleted_media` |
| `FollowUser` | `{user_id}` | `my_stats.count_following` +1 |
| `UnfollowUser` | `{user_id}` | 回到原值 |
| `CommitBlockV2` | `{block_items:[{id,item_type:"user"}]}` | `GetBlockUserList` 里出现（**不是 `user_id`**）|
| `CancelBlockV2` | 同上 | 消失 |
| `CreateComment` | `{group_id, group_type:0, text, comment_type:0}` | `ListComments` 里找到刚发的那条（回 `created_comment`/`comment_token`）|
| `CommentAction` | `{comment_id, reply_id:"", group_id, type:1, scene_name:""}` | 回 `status_code=0`（点赞数看 `count_digged`）|
| `DeleteComment` | `{comment_id}` | 评论从列表消失（回 `deleted_comment`）|
| `Dislike` | `{item_id, dislike_item_type:1, action_type:1}` / `action_type:0` 取消 | 两次都 `0` |
| `Report` | `{content_id, report_type:"track", report_reason_code:"4001"}` | 非 pc 的 `/luna/report` 实测 `http=200` 举报成功；pc 的 `/luna/pc/report` 对同一内容回 `101 你已举报过该内容`（首次调用则成功）。**写请求 transport 不做 path 回退**，库默认走 pc 那条 —— 首次举报没问题，重复举报回 `101` 属正常（不可撤销，仅此一次）|
| `UpdateMyPrivacySetting` | 4 个数值开关 | 用**原值回写**，前后 6 开关逐字段一致 |
| `GetPurchaseOfferToken` | `{offer_id, report_param:"{}"}` | 回 `token` |
| `GetOffersTokensForPC` | `{offer_snapshot_id, report_param:"{}"}` | 回 `token` |

> 写接口的两条通用经验：**① 参数类型别猜**（`report_type` 是字符串、`block_items` 是对象数组、`media`/`media_list` 各用各的）；
> **② 上游 500 / 奇怪的 `status_code` 先当作「我参数不对」重试或换 path**——`Report` 就是这么从「HTTP 500」翻成
> 「举报成功」的。实在过不去（`QueryTokenStatus`）才记「上游这条路不通」。

---

## 4. 五条典型链路（可直接照抄）

**① 首页**
`Launch`（拿曲风/语种 + `need_set` 判断是否弹首启引导）→ `DiscoverView {}` → 遍历 `blocks[].inner_block[]`
→ 按 `inner_block[].type` 分派：`discover_playlist` 渲染歌单卡、`discover_track_top_list` 渲染榜单 →
曲目统一取 `entity.ranked_track.track` 或 `entity.track`。

**② 播放一首歌（含歌词）**
列表里的 track 已有 `id`/`name`/`artists`/`album`；只有 id 时先用 **`MGetMedia`**（`{scene, media:[{id,type:'track'}]}`）批量补详情 → `MCheckMedia` 查权益（VIP/无版权）→
`getTrackMedia()`（`/luna/h5/track_v2?track_id=…&device_platform=web`）取 `video_model` 里的档位地址 + KRC 歌词（逐字时间戳）→ 播放；
这条不通时回落到 `GetShareInfo` 拿 `system_share_link` → `getShareMedia()` 读分享页 SSR（`ugc_video` 只有 SSR 那条路）。
`GetTrackV2`/`GetMediaPlayer` 可以照调（库不拦），但**库客户端口径**（`device_platform=windows`）下匿名与带会话实测都拒答（`1000062` / 空响应），别把主链路压在它上面。
（h5 的曲目对象在 `json.track`，是**裸 track**，不裹 `entity.track_wrapper.track`；地址要自己解 `json.track_player.video_model` 那个 JSON 字符串。）
（`qishui-core` 的 `catalog.tracks()` / `player.play()` 就是照这条链路实现的。）

**③ 搜索**
`Sug` 做下拉 → 用户在结果里点一个 `content_type` → 用 `entity.<kind>.id` 直接跳详情；
也可以直接 `Search`：`{ search_type:'track', q, cursor:'0', search_id: <uuid>, search_method:'track' }`
（**别加 `debug_params`**）→ 遍历 `result_groups[].items`，翻页用 `next_cursor`；`all` 类型回 `top_results` 聚合。
`FlowSearch` 不要接（404）。

**④ 我的音乐**（需要会话，已实测）
`GetMyPlaylists` → 找 `type=1`「我喜欢的音乐」/ `type=4`「抖音收藏的音乐」/ `type=2` 自建单
→ `GetPlaylistDetail` → `media_resources[].entity.track_wrapper.track`。
「我的」页顶部一次 `GetMyInfo`（昵称/头像/`is_vip`/`vip_stage`/`my_stats` 的收藏/关注/粉丝数）就够；
设置页用 `GetMyPrivacySetting` 的 6 个开关。

**⑤ 场景 / 电台队列 / 榜单**

- **场景**（听歌模式的一档，45 个）：`FeedMode` 列出 `feed_scene_mode{scene_mode_id, sub_queue_type}` →
  `FeedSongTab { feed_mode:'track', preference_mode:'default', count, feed_preference:{ scene_mode_id } }`。
  场景 id 必须落在 `feed_preference.scene_mode_id`（扁平），**这是唯一让场景生效的地方**。
- **电台队列**（首页 `discover_radio` 块，30 条）：`FeedRadioTracks { radio_id: <inner_block_id> }` 拿 6 首。
  两条路的 id 空间不同：场景是短数字、电台队列是雪花大数，**不能互换**（短数字喂电台不报错但回通用池）。
- **榜单**：`DiscoverView` 空 body 版的 `discover_top_song_list` 块里（热歌/新歌/欧美，各 48~50 首），
  要整榜再 `GetChartDetail { chart_id: <榜单块的 inner_block_id> }`。
- **偏好流**：`FeedSongTab { preference_mode }`，取值 `default`/`familiar`/`fresh`（见 IDL 常量）。

---

## 5. 别在这上面耗时间

| 端点 | 现象 | 原因 |
|---|---|---|
| `GetTrackV2` / `GetMediaPlayer` / `GetVideoV2` / `MGetMediaV2` / `GetTrack` / `GetH5Track` / `GetTrackPlayerInfo` | **库客户端口径**（`device_platform=windows`）下匿名与**带会话**实测都拒答：pc 变体空响应、非 pc 变体回 `1000062 应用版本有风险` | 1000062 那道门后续被翻案了：它不是「客户端完整性校验」，是缺 query `device_platform=web`（见 §3.5.1）。这几条**没有逐条试过补该参数**，所以「非 pc 口一律拒」只对当前口径成立；本库只标记（`ENDPOINT_DATA[].gated`）、不拦请求，**会员态是否放行**尚未验证（本次账号非会员）。曲目详情/地址匿名都有别的路：详情 `MGetMedia`（无地址）、地址 `getTrackMedia()`（h5 口）或分享页 SSR |
| `GetH5TrackV2` | ~~别耗时间~~ **已翻案**：匿名可用 | 补 `device_platform=web` 就通，是本项目曲目取址的默认路（`src/web/h5Track.ts`）；见 §3.5.1 |
| `FlowSearch` | HTTP 404 | `/luna/flow/search/<type>` 线上不存在 |
| `GetSearchBlock` | `search_chart_block` 恒空 | 热搜是 h5/移动端的东西，PC 客户端源码里都不调它 |
| `GetFeaturedContents` | 空响应（只回 status_info） | 推荐位没数据 |
| `GetUserInfo` | 偶发 captcha（带会话也会） | 风控看请求频率而非登录态；降频重试，别在一个接口上连打 |
| `QueryTokenStatus` | HTTP 500 | GET 的 **v1** 路由（`/luna/pc/commerce/offers/tokens/status`）疑似已下线，同 token 走 POST 的 v2 `GetOffersTokensStatusForPC` 正常 —— **换 v2**，别在这条 GET 上耗 |
| `ReportAction` / `ShareCount` | 只回 status | 是上报接口，不返回数据，属正常 |

---

## 6. 还没验的：只剩会员行为

三轮下来「读 + 写」都验过了（2026-10-17 又补了 8 条媒体类，见 §1）：

- **匿名轮**：82 条里 32 条直接拿到数据（发现页/搜索/榜单/详情/评论/歌单广场/分享链接）。
- **登录轮**：6 条翻盘（`GetMyInfo`/`GetMyPlaylists`/`GetBlockUserList`/`GetUploaderInfo`/`GetMyPrivacySetting`/`Search2023`；**`Search2023` 其后已弃用**，见 §3.3），
  3 条回空但结构正常（账号里没数据：`GetMyMixedCollections`/`GetRecentPlayedMedia`/`GetDigitalAlbums`；**其中 `GetRecentPlayedMedia` 已于 2026-10-18 翻案** —— 账号有 200+ 条播放记录，只是在 `GetRecentPlayedTracks` 那张表）。
- **2026-10-18 复查轮（最近播放 / 关注艺人）**：为了查「TUI 最近播放是空的」重新实发，翻案三条旧结论 ——
  ① 播放历史在 `GetRecentPlayedTracks`（`/luna/me/recently-played`，200+ 条真数据），`GetRecentPlayedMedia` 那张表在这个账号就是 `{}`；
  ② `AppendRecentPlayedTracks`/`DeleteRecentPlayedTracks` 写完回读对得上（201→202→201），是可回滚的写接口；
  ③ `CollectArtists`/`MDeleteCollectedArtists` 双向都落地（旧结论「读回存疑」复现不出来）。
  教训：**「读回来是空」不能当「写没落地」的证据** —— 得先确认读的那张表本来有没有数据。
- **写接口轮**：29 条实测**全部 `status_code=0`**（含 4 条换参数/换 path 翻案）；唯一不通的是**非写接口**的 `QueryTokenStatus`（上游 v1 GET 路由 500）。
  账号数据全程可回滚，收尾 11 项复查全过（详见 §3.12）。
- **补测轮**：`MGetMedia` / `MCheckTrack` 匿名可用（曲目批量详情的底座）；`MGetMediaV2`/`GetTrack`/`GetH5Track`/`GetH5TrackV2`/`GetTrackPlayerInfo` 归入「客户端完整性校验拒答」那一类。
- **2026-10-19 h5 轮**：`GetH5TrackV2` 从上面那条翻案 —— 门是 query `device_platform=web`，匿名可用（§3.5.1）；pc 口 `track_v2` 补该参数仍是 0 字节。

**唯一没验的：会员（VIP）行为**。本次账号 `is_vip: false` / `vip_stage: "free"`，所以这些拿不到：

- 上表那批 `1000062` / 空响应的端点是否对**会员**放行（匿名与登录态都不放行，会员态未验）；
- VIP 音质 / 下载类端点的权益分支；
- `GetMySubscription` 的会员态返回、`GetUpsell` 的会员价分支。

> **关于 VIP 的两条推测（都还没实测，别当结论）**：
> ① 有会员会话时 pc 口的 `GetTrackV2`（`/luna/pc/track_v2`）大概率也放行 —— 它拦的是客户端身份而不是参数，会员态是本仓库唯一没试过的变量；
> ② 但那样拿到的文件**可能是加密的**（原生播放器的音频未必是能直接落盘播放的裸 m4a；h5 口给的 `main_url` 实测能整段下、`mime_type=audio_mp4`，是裸的）。
> 这两条都要拿会员账号跑 `test/run.ts` 才能定；`label_info` 里 `lossless`/`hi_res`/`spatial` 匿名从来不给地址，会员态能否取到同样未知。
> `lyric.hide_request_lyrics`（会员歌词是否走另一条请求）也未试。

换一个**会员账号**带会话重跑 `test/run.ts`（已结论的会自动 SKIP，想强制重测加 `FORCE=1`）即可，别拿非会员的空结果当结论。

复现步骤：

```bash
node --experimental-strip-types test/login.ts --start   # 出二维码（用汽水音乐 App 扫，不是抖音）
node --experimental-strip-types test/login.ts --poll    # 轮询，成功后落 qishui-session.json
node --experimental-strip-types test/run.ts             # 读接口实测；已结论的自动 SKIP，不会重复打
node --experimental-strip-types test/write.ts           # 写接口实测（29 条，每步可回滚，收尾安全复查）
node --experimental-strip-types test/probe-writes.ts    # 写接口「判死翻案」探针（改参数/换 path 再试）
ALLOW_WRITE=1 node --experimental-strip-types test/run.ts   # 让 run.ts 连写接口一起打（会动账号数据，慎用）
```

> 账号安全：写接口只在有会话时跑；`test/write.ts` 只碰自己刚造的数据（建单返回的 id、自己刚发的评论），
> 收藏类**先查再决定要不要取消**，收尾回读确认账号回到原样。
> `GetUploaderInfo` 返回的 `security_token` 是上传凭据，别落盘、别打日志。
