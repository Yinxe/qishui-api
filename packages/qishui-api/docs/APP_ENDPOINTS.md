# 做一个音乐 App 需要的接口（分类 · 能力 · 实测）

从 320 个端点（74 个官方在用）里挑出**做音乐 App 真正会用到的那批**，按能力分类，每条都过了一遍真实请求。

**实测口径**（2026-10-17，三轮）

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
| `ok_thin` | 3 | `GetMyMixedCollections`、`GetRecentPlayedMedia`、`GetDigitalAlbums` —— 回了 `status_code=0` 但**这个账号里没数据**（没收藏/没播放记录/没买数字专辑） |
| `risk_control` | 1 | `GetUserInfo`（**匿名时能拿到**，带会话反而被打标 —— 风控看请求频率，不看登录态） |
| `biz_error` | 2 | `GetReportReason`（**写接口轮翻案**：`report_type` 要给字符串 `"track"`）、`GetOffersTokensStatusForPC`（**写接口轮翻案**：给真 `token` 就回 `token_status`）|
| `error` | 2 | `QueryTokenStatus` HTTP 500（上游 v1 GET 路由，不是我们的问题）、`FlowSearch` 404 |

**写接口轮（29 条全跑，全部可回滚）**

| 结果 | 条数 | 说明 |
|---|---|---|
| `status_code=0` | 29 | 建单/加歌/改名/删单、收藏↔取消（曲目/专辑/艺人/歌单/媒体列表）、关注↔取关、拉黑↔解除、发评→点赞→删评、`Dislike`、举报、改隐私（原值回写）、取下单 token —— 逐条见 §3.12。其中 3 条是「乍看失败、换参数/换 path 后翻案」（`UpdatePlaylistInfo`/`CreateComment`/`Report`）|
| 上游 500 | — | `QueryTokenStatus`（**不是写接口**，GET v1 路由，同 token 走 v2 正常；见 §3.11）|

跑法：`test/write.ts`，每步「做 → 回读验证 → 撤销 → 再回读」，收尾 11 项安全复查本次 **11/11 通过**（账号数据回到原样）。

**一句话结论**：匿名能搭起「可浏览、可搜索、可看详情/评论/歌单、可拿播放地址（走 web 分享页）」的骨架；
**个性化与写入都要会话，登录后确实都通**（登录轮 6 条翻盘 + 写接口轮 28/29）；
真正拿不到的只剩**会员专属行为**（本账号 `is_vip:false`）和 `QueryTokenStatus` 那条已下线的 GET 路由。

> 三处关键修正（都是「之前判死、其实是我没试对」）：
> ① **`Search` 与 `GetChartDetail`** —— `Search` 要走非 pc 变体且不能带 `debug_params`，
> `GetChartDetail` 的 `chart_id` 要用榜单块的 `inner_block_id`（详见 §3.2 / §3.3）。
> ② **`Report` / `GetReportReason`** —— 不是「上游 500 / 参数永远不对」，是 `report_type` 得给**字符串枚举**（`"track"`）
> 且 path 用非 pc 的 `/luna/report`；`report_reason_code` 取 `GetReportReason` 返回的 `code`（详见 §3.12）。
> ③ **不再替上游下结论**：播放地址那三个接口以前由本库自己抛 `UnsupportedError` 拦下（等于拿本库的策略当接口结论），
> 已删除拦截 —— 现在**照发请求**，上游回什么就记什么（`1000062` / 空响应），只在 `ENDPOINT_DATA[].gated` 上留标记。

---

## 2. 选型速查

| 我要做… | 用哪些端点 | 匿名可用 |
|---|---|---|
| 冷启动 + 首次偏好引导 | `Launch`（`boost_setting` 里有 15 个曲风 + 5 个语种 + `need_set`） | ✅ |
| 首页（推荐 + 榜单） | `DiscoverView` 空 body | ✅ |
| 场景电台（专注/摸鱼/图书馆…） | `FeedMode` → 45 个场景 → `DiscoverView` sceneMode 版 / `FeedRadioTracks` | ✅ |
| 推荐流（单曲） | `FeedSongTab`（6 首/次） | ✅ |
| 歌单广场 | `FeedPlaylistSquare` | ✅ |
| 搜索框下拉 | `Sug`（词条） | ✅ |
| 搜索出实体 | `Search`（`/luna/search/<type>` → `result_groups`） | ✅ |
| 推荐搜索词 | `SuggestWords`（推荐词带 track id） | ✅ |
| 搜索分类 tab | `SearchCategories`（7 个 `search_type`） | ✅ |
| 榜单详情（整榜） | `DiscoverView` 榜单块的 `inner_block_id` → `GetChartDetail` | ✅ |
| 曲目/专辑/艺人详情 | `GetAlbumDetail` / `GetArtistDetail` / `ListArtistAlbums` / `ListArtistTracks` | ✅ |
| 相似歌曲 | `GetRelatedMedia`（6 首/次） | ✅ |
| 曲目元数据（标题/歌手/封面/可播性） | `GetShareInfo` | ✅ |
| 播放地址 + 歌词 | `GetShareInfo` 拿分享链接 → `getShareMedia()` 读 web 分享页 SSR | ✅ |
| 播放前查权益 | `MCheckMedia`（批量）/ `GetMediaStats`（计数） | ✅ |
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
| `FeedMode` | ✅ | `feed_mode_block[1]` + `feed_mode_bar` | 45 个场景音乐（`feed_scene_mode{scene_mode_id, sub_queue_type}`，标题如「图书馆/专注模式/摸鱼」）+ 偏好栏 3 项（`feed_preference_mode{mode}`，如 `default`=推荐） |
| `FeedSongTab` | ✅ | `items[6]` | 单曲推荐流，`entity.track_wrapper.track` + `predict_info.model_preds`（打分，做排序/过滤可用） |
| `FeedPlaylistSquare` | ✅ | `items[14~17]` + `categories` | 歌单广场；`items[].entity.playlist` |
| `FeedRadioTracks` | ✅ | `items[6]` | 电台续播：`radio_id` = 场景队列条目的 `inner_block_id` |
| `GetChartDetail` | ✅ | `chart{…}`（~150KB） | 整榜明细：`chart_id` 取榜单块的 `inner_block_id` → `chart{title,count_tracks,period,release_time,track_ranks[{rank,track}],style{desc,bg_url…}}`。**不是** `hot_song_chart` 这种常量名（那样回 `1000004`） |
| `GetFeaturedContents` | ✅ | `ok_thin`（空） | 精选推荐位，实测无数据，别指望 |

### 3.3 搜索

| 端点 | 匿名 | 实测 | 能力与坑 |
|---|---|---|---|
| `Sug` | ✅ | `sugs[10]` | 搜索联想。`{suggestion, content_type:'artist'\|'playlist'\|'track', entity:<kind>.id, group_id}` —— 只回词条与 id，不回完整实体 |
| `SuggestWords` | ✅ | `suggest_words[6]` | 推荐搜索词，`{keyword, type, group_id}`，**是真实 track id**，当「猜你想搜」用 |
| `SearchCategories` | ✅ | `search_category_tabs[7]` | 搜索页分类 tab，`{search_type, name}`，空 body 即可 |
| `Search` | ✅ | `result_groups[1]`（track ~114KB） | **官方搜索，匿名可用**。走 `/luna/search/<type>`（非 pc 变体），q → `result_groups[{id,next_cursor,has_more,items}]`，分页靠 `next_cursor`；`search_type` 取 `SearchCategories` 的 7 个值（all/track/video/artist/album/playlist/user，all 会回 `top_results`）。**坑**：不能带 `debug_params`（传 `{}`/`'null'` 都回 `1000004`，不发就正常），且 `/luna/pc/search/<type>` 恒 `200+0字节` |
| `Search2023` | 登录 | `result_groups[1]` + `extra{log_extra}` | h5 版搜索（`/luna/h5/search/`），**带会话可用**（已验）。注意 `result_groups[].data` 装结果（`Search` 那条叫 `items`，字段名不一样），另有 `display_view_all`/`display_title`/`display_type` 供渲染 |
| `FlowSearch` | ✗ | HTTP 404 | `/luna/flow/search/<type>` 这条 path 线上不存在 |
| `GetSearchBlock` | ✅ | `hint_words[1]` | 只有 1 条占位提示词；`search_chart_block` 恒空（那是 h5/移动端的东西） |

> `Search` 是首选；`Sug` / `SuggestWords` 做下拉与「猜你想搜」。三者字段名都以真实响应为准。

### 3.4 曲目 / 专辑 / 艺人

| 端点 | 匿名 | 实测 | 能力与关键字段 |
|---|---|---|---|
| `GetAlbumDetail` | ✅ | `album_info{13}` + `tracks[11]` | `album_info`: `name`/`artists`/`count_tracks`/`release_date`/`url_cover`/`url_player_bg`/`stats{count_collected,count_shared,total_count_purchased}`/`pclines`（版权行）；`tracks[]` 是完整 track |
| `GetArtistDetail` | ✅ | `artist_info{12}` + `hot_tracks[5]` + `hot_albums[10]` | `artist_info`: `name`/`count_albums`/`count_tracks`/`url_avatar`/`artist_profile`/`user`/`user_artist_type`；艺人页一个请求就能铺满 |
| `ListArtistAlbums` | ✅ | `albums[27]` | 分页（`next_cursor`/`has_more`） |
| `ListArtistTracks` | ✅ | `tracks[50]` | 分页，返回完整 track |
| `GetRelatedMedia` | ✅ | `items[6]` | 相似歌曲，`entity.track_wrapper.track`，播放页「相似」用它 |

**track 实体长这样**（约 30 个字段，实测键名）：`id` / `name` / `duration`(ms) / `vid` /
`album{id,name,release_date,url_cover,…}` / `artists[{id,name,url_avatar,user_info,…}]` /
`stats{count_collected,count_comment,count_shared}` / `label_info{only_vip_playable,only_vip_download,quality_map,…}` /
`preview{vid,bit_rates}` / `audition_info{vid,start_time_ms,duration_ms}`（试听片段）/ `chorus{start,duration}`（副歌）/
`karaoke{supported}` / `playable_range` / `media_type:"track"` / `lang_codes` / `tags` / `colors`（播放页配色）。

### 3.5 播放与媒体地址

| 端点 | 匿名 | 实测 | 能力 |
|---|---|---|---|
| `GetShareInfo` | ✅ | `share_info{10}` | 曲目元数据的**主力**：`share_title`《茶汤》、`share_desc`(歌手)、`share_cover{uri,urls,template_prefix}`、`short_share_link`、`system_share_link`、`share_weibo_desc`、`share_douyin_info.story_music_id` |
| `MCheckMedia` | ✅ | `media_status[1]` | 播放前查权益：`status`(枚举) + `label_info.quality_map`（哪档音质要 VIP/购买），批量传 `media_list` |
| `GetMediaStats` | ✅ | `stats{count_collected,count_comment,count_shared}` | 收藏/评论/分享计数（注意 `media_type` 要传字符串 `'track'`） |
| `GetTrackV2` / `GetMediaPlayer` / `GetVideoV2` | ✗ | `client_rejected` | goapi 播放地址。**库照发请求、不拦**（早先那个自造的 `UnsupportedError` 已删）；匿名与**带会话**实测都拒答：pc 变体 `200+0字节`，非 pc 变体回 `1000062 应用版本有风险，请从应用商店下载正式版本`。**会员态是否放行仍未验证**（本次账号非会员）。可播地址走 web 分享页 |

> **播放地址走 web 分享页**（本项目已验证的那条路）：`GetShareInfo` → `system_share_link`
> （`https://www.qishui.com/share/track?track_id=…`）→ `getShareMedia()` 读 SSR 里的
> `audioWithLyricsOption.url`（`audio_mp4`），同时能拿到 **KRC 结构化歌词**（行级 + 逐字时间戳）。
> 地址带签名，`expires_at` 约 24h，过期要重新解析，**不要缓存**。

### 3.6 歌单 / 收藏

| 端点 | 匿名 | 实测 | 能力 |
|---|---|---|---|
| `GetPlaylistDetail` | ✅ | `playlist{19}` + `media_resources[13]` | 别人分享/公开的歌单可匿名读。`playlist.title`（**不是 `name`**）/`count_tracks`/`desc`/`url_cover`/`stats`；曲目在 `media_resources[].entity.track_wrapper.track` |
| `GetUserPlaylists` | ✅ | `playlists[1]` + `total_num` | 某用户的公开歌单 |
| `GetUserMixedCollections` | ✅ | `ok_thin`（该用户没收藏歌单/专辑） | 只装「收藏的歌单/专辑」，**不含收藏的曲目** |
| `GetMyPlaylists` | 登录 | ✅ `playlists[2]` + `total_num` | 我的歌单（已验）。含「我喜欢的音乐」`type=1`、「抖音收藏的音乐」`type=4` —— 取收藏曲目的**唯一入口**；`playlists[]` 带 `title`/`count_tracks`/`url_cover`/`stats`/`type`/`from_feed`/`owner`/`all_sort_types` |
| `GetMyMixedCollections` | 登录 | `ok_thin`（空） | 我的收藏混排（同样不含曲目）。**这条账号里没数据**，所以只验到「不再被拦、结构正常」 |
| `GetRecentPlayedMedia` | 登录 | `ok_thin`（空） | 最近播放（响应键是 `media`，不是 `items`）。**刚登录的账号没播放记录**，所以是空的；上报用 `AppendRecentlyPlayedMedia` |
| `GetDigitalAlbums` | 登录 | `ok_thin`（空） | 已购数字专辑。**这个账号没买过**，所以是空的 |
| `CreatePlaylist` / `UpdatePlaylistInfo` / `MAppendPlaylistMedia` / `DeletePlaylistMedia` / `MDeletePlaylists` | 登录 | ✅ 全部实测通过 | 写链路。`CreatePlaylist{name,is_private}` 回 `playlist{id}`；加歌 `MAppendPlaylistMedia{playlist_id,media[]}` 后 `count_tracks` +1；`MDeletePlaylists` 响应**没有 `status_code`**，成功看 `deleted_playlists` 里有没有那个 id。**`UpdatePlaylistInfo` 紧跟建单后改名可能回 `1000014`，重试即通**（实测 3 次里头一次） |
| `CollectTracks` / `CollectAlbums` / `CollectArtists` / `CollectPlaylists` / `CollectMediaList` / `MDeleteCollected*` | 登录 | ✅ 全部实测通过 | 收藏/关注与取消，成对验证：收藏后 `GetMyPlaylists`(type=1)/`GetMyMixedCollections`/`GetUserArtistCollection` 能读到，取消后读不到。注意 **`CollectMediaList` 的字段是 `media[]`**（不是 `media_list`，那是 `MCheckMedia` 的）|
| `AppendRecentlyPlayedMedia` / `DeleteRecentlyPlayedMedia` | 登录 | ✅ 写通道通（回读不落地） | 参数就是 `media[]`。写回 `status_code=0`，但 `GetRecentPlayedMedia` 读回来仍是空 —— **写通道通、读回不落地**（带 `attr.duration` 也一样），上游应该还有别的校验/去重，别指望靠它喂历史 |

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
| `ListComments` | ✅ | `comments[19]` + `count`/`cursor`/`has_more`/`prompts[1]` | 评论列表。`{id, content, count_digged, time_created, count_reply, user{id,nickname,medium_avatar_url,vip_stage,is_vip,public_name}, ip_label, service_id}`；`prompts` = 输入框占位文案 |
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
| `CollectArtists` | `{artist_ids:[id]}` | ⚠️ 写回 `0`，但 `GetUserArtistCollection{user_id:自己}` 回读**没看到**该艺人（取消后同样看不到）——「写入被接受」可信，读回存疑 |
| `MDeleteCollectedArtists` | `{artist_ids:[id]}` | 同上 |
| `CollectPlaylists` | `{playlist_ids:[id]}` | `GetMyMixedCollections` 里出现 |
| `MDeleteCollectedPlaylists` | `{playlist_ids:[id]}` | 消失 |
| `CollectMediaList` | `{scene:"track", collect_action:1, media:[{id,type:"track"}]}` | 「我喜欢的音乐」里出现（字段是 **`media`**，不是 `media_list`）|
| `DeleteCollectedMediaList` | `{media:[{id,type:"track"}]}` | 消失 |
| `AppendRecentlyPlayedMedia` | `{media:[{id,type:"track"}]}` | ⚠️ 写回 `0`，`GetRecentPlayedMedia` 仍是空 —— **写通道通、读回不落地** |
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
列表里的 track 已有 `id`/`name`/`artists`/`album` → `MCheckMedia` 查权益（VIP/无版权）→
`GetShareInfo` 拿 `system_share_link` → `getShareMedia()` 取 `play_url` + KRC 歌词（逐字时间戳）→ 播放。
`GetTrackV2`/`GetMediaPlayer` 可以照调（库不拦），但匿名与带会话实测上游都拒答（`1000062` / 空响应），别把主链路压在它上面。

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

**⑤ 场景电台 / 榜单**
`FeedMode` 列 45 个场景 → 选中一个场景走 `DiscoverView` sceneMode 版拿 `discover_radio` 队列，
或直接 `FeedRadioTracks { radio_id: <inner_block_id> }` 拿 6 首续播；榜单在 `DiscoverView` 空 body 版的
`discover_top_song_list` 块里（热歌/新歌/欧美，各 48~50 首），要整榜再 `GetChartDetail { chart_id: <榜单块的 inner_block_id> }`。

---

## 5. 别在这上面耗时间

| 端点 | 现象 | 原因 |
|---|---|---|
| `GetTrackV2` / `GetMediaPlayer` / `GetVideoV2` | 匿名与**带会话**实测都拒答：pc 变体空响应、非 pc 变体回 `1000062 应用版本有风险` | 上游对客户端做完整性校验后拒答。本库只标记（`ENDPOINT_DATA[].gated`）、不拦请求，**会员态是否放行**尚未验证（本次账号非会员）。可播地址走 web 分享页 |
| `FlowSearch` | HTTP 404 | `/luna/flow/search/<type>` 线上不存在 |
| `GetSearchBlock` | `search_chart_block` 恒空 | 热搜是 h5/移动端的东西，PC 客户端源码里都不调它 |
| `GetFeaturedContents` | 空响应（只回 status_info） | 推荐位没数据 |
| `GetUserInfo` | 偶发 captcha（带会话也会） | 风控看请求频率而非登录态；降频重试，别在一个接口上连打 |
| `QueryTokenStatus` | HTTP 500 | GET 的 **v1** 路由（`/luna/pc/commerce/offers/tokens/status`）疑似已下线，同 token 走 POST 的 v2 `GetOffersTokensStatusForPC` 正常 —— **换 v2**，别在这条 GET 上耗 |
| `ReportAction` / `ShareCount` | 只回 status | 是上报接口，不返回数据，属正常 |

---

## 6. 还没验的：只剩会员行为

三轮下来「读 + 写」都验过了：

- **匿名轮**：82 条里 32 条直接拿到数据（发现页/搜索/榜单/详情/评论/歌单广场/分享链接）。
- **登录轮**：6 条翻盘（`GetMyInfo`/`GetMyPlaylists`/`GetBlockUserList`/`GetUploaderInfo`/`GetMyPrivacySetting`/`Search2023`），
  3 条回空但结构正常（账号里没数据：`GetMyMixedCollections`/`GetRecentPlayedMedia`/`GetDigitalAlbums`）。
- **写接口轮**：29 条实测**全部 `status_code=0`**（含 4 条换参数/换 path 翻案）；唯一不通的是**非写接口**的 `QueryTokenStatus`（上游 v1 GET 路由 500）。
  账号数据全程可回滚，收尾 11 项复查全过（详见 §3.12）。

**唯一没验的：会员（VIP）行为**。本次账号 `is_vip: false` / `vip_stage: "free"`，所以这些拿不到：

- `GetTrackV2` / `GetMediaPlayer` / `GetVideoV2` 是否对**会员**放行（匿名实测是 `1000062` / 空响应，登录态也一样，会员态未验）；
- VIP 音质 / 下载类端点的权益分支；
- `GetMySubscription` 的会员态返回、`GetUpsell` 的会员价分支。

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
