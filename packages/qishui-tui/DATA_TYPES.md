# 汽水音乐 · 可用数据类型清单（功能维度）

**用途**：给 UI/TUI 设计当输入 —— 一眼看清「**有什么数据、字段是什么、从哪来、匿名还是登录**」，据此规划页面与组件。
**来源**：`qishui-api`（协议层）+ `qishui-core`（应用层，把上游响应归一化成下表形状）。
**字段口径**：字段名**全部来自真实响应**（`qishui-api/docs/APP_ENDPOINTS.md` 的实测轮）；`core` 的归一名字段在括号里注明。

**标注**：`匿名` = 不带会话就能拿；`登录` = 未登录回 `1000016`；`本地` = 不出网，读本地数据目录。

---

## 0. 怎么读

- 设计页面时看 **§1 速查**（哪些实体、归在哪个功能域）；
- 做列表/详情时看 **§2 资源实体**（逐字段）；
- 做「我的」/账号/会员看 **§3**；
- 做播放页/歌词/队列看 **§4**；
- 做筛选、tab、标签、开关时看 **§6 枚举常量**；
- 判断某功能要不要登录看 **§7 能力矩阵**。

`core` 里每个实体都有 `.raw`（上游原始响应，字段最全）与归一化字段（`.data`），所以**下表列的是「稳定可依赖」的那部分，`.raw` 还能再挖**。

---

## 1. 速查：实体与出处

| 功能域 | 数据类型（实体） | `core` 入口 | 匿名 |
|---|---|---|---|
| 曲库 | `Track` `Album` `Artist` | `catalog.track/album/artist/…` | ✅ |
| 歌单 | `Playlist` | `catalog.playlist` `library.playlists` `discover.playlistSquare` | 公开✅ / 我的登录 |
| 榜单 | `Chart` `ChartRank` | `catalog.chart` / `discover.home` 榜单块 | ✅ |
| 首页/推荐 | `DiscoverBlock` `DiscoverInner` `DiscoverResource` | `discover.home` `discover.mix` | ✅ |
| 听歌模式 | `FeedModeView` `FeedModeOption` `FeedModeRef` | `discover.feedModes` `discover.feedModeTracks`（一次约 6 首，连着播用） | ✅ |
| 搜索 | `SearchResult` `SearchGroup` `SuggestItem` | `search.*` `suggest` `categories` | ✅ |
| 评论 | `Comment` | `comments.list/replies` | ✅ |
| 用户/社交 | `User` `UserStats` | `social.user/followers/following` | ✅（易风控） |
| 账号 | `MeProfile` `MeStats` `PrivacySetting` | `account.me/stats/privacy` | 登录 |
| 会员/商业化 | `Membership` `MembershipOffer` `CommerceSummary` | `account.membership/upsell/commerce/digitalAlbums` | 配置✅ / 我的态登录 |
| 分享链接 | `ShareMeta` `ShareMedia` `TrackRef` | `link.meta/media/track` | ✅ |
| 播放 | `PlaySource` `PlayerState` `PlayQueueState` | `player.*` `track.source()` | ✅（地址走 web 分享页） |
| 歌词 | `Lyrics` `LyricLine` `LyricWord` | `track.lyrics()` `player.lyricState()` | ✅ |
| 本地 | `CachedMediaMeta` `MediaStats` `PlayRecord` `PlayStats` | `cache.*` `history.*` | 本地 |

---

## 2. 资源实体（逐字段）

### 2.1 Track（曲目）

归一化字段（`TrackData`）：

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | string | 曲目 id |
| `name` | string | 曲名 |
| `durationMs` | number? | 时长（上游 `duration` 是 ms） |
| `album` | `{id,name,coverUrl?,releaseDate?}` | 所属专辑（`release_date` 是 unix 秒） |
| `artists` | `{id,name,avatarUrl?}[]` | 歌手列表 |
| `coverUrl` | string? | 封面（由 `album.url_cover` 拼 CDN 宽度） |
| `vid` | string? | 内部媒体 id（换源/重签用） |
| `mediaType` | string? | `"track"` |
| `stats` | `{collected?,comment?,shared?}` | 收藏/评论/分享计数 |
| `vip` | `{onlyVipPlayable?,onlyVipDownload?,vipOnlyQualities?,isOriginal?,qualityMap?}` | 来自 `label_info`，权益标记 |
| `playableRange` | `{startMs?,durationMs?}` | 只放开一段（试听）时的可播区间；`media.resolve()` 现在会把分享页的 `offsetStart`/`offsetDuration` 也写进这里，`PlaySource.clipStartMs` 与 `durationMs` 取自它 |

`.raw` 里还实测可见（未归一化，需要时自取）：`preview{vid,bit_rates}`、`audition_info{vid,start_time_ms,duration_ms}`（试听片段）、`chorus{start,duration}`（副歌）、`karaoke{supported}`、`lang_codes`、`tags`、`colors`（播放页配色）、`pclines`（版权行）。
**可做 UI**：列表行（曲名/歌手/时长/收藏态）、详情页（权益标签、试听区间、副歌跳转）、播放页配色主题。

### 2.2 Album（专辑）

`id` `name` `artists[{id,name,avatarUrl?}]` `coverUrl?` `releaseDate?`(unix 秒) `countTracks?` `description?`(`intro`/`desc`) `stats{collected?,comment?,shared?}`。
`.raw` 另有 `url_player_bg`、`pclines`、`stats{total_count_purchased}`。

### 2.3 Artist（艺人）

`id` `name` `avatarUrl?` `description?`(艺人简介) `countAlbums?` `countTracks?` `stats{…}` `state{isCollected?,isFollowing?,blockedByMe?}`（**带我态**，登录后才有值）。
`.raw` 另有 `artist_profile`、`user`、`user_artist_type`；`GetArtistDetail` 一次还回 `hot_tracks[5]` + `hot_albums[10]`（热门曲目/专辑）。

### 2.4 Playlist（歌单）

| 字段 | 说明 |
|---|---|
| `id` `title` `description?` `coverUrl?` `countTracks?` | 基础 |
| `type?` | `1`=我喜欢的音乐、`2`=私有、`3`=公开/歌单广场、`4`=抖音收藏 |
| `fromFeed?` | 是否来自推荐流 |
| `ownerId?` | 归属用户 |
| `stats{collected?,visible?}` | 收藏数 / 播放数 |
| 曲目 | `playlistTracks()` / `media_resources[].entity.track_wrapper.track` |

`.raw` 另有 `all_sort_types`（排序方式，可做下拉）。

### 2.5 User（用户）

`id` `nickname?` `avatarUrl?` `signature?` `douyinId?` `secUid?` `publicName?` `isVip?` `vipStage?` `isMusician?` `stats{liked?,following?,followers?,asset?}`。
`.raw` 另有 `gender` `age` `birthday` `location` `ip_location` `masked_phone_no` `is_music_curator` `user_artist_type` `luna_register_time` `is_luna_user` `ai_creator_info`；社交接口另返 `my_user_state`（我对 TA 的关注/拉黑态）、`vip_info`。
**注意**：`count_all_liked` 是「**收到的**点赞」，不是收藏数；`GetUserInfo`/`GetFollowingList` 反复打会触发 captcha。

### 2.6 Comment（评论）

`id` `content` `user{…UserData}` `createdAt?`(unix 秒, `time_created`) `countDigged?`(点赞) `countReply?`(回复数) `liked?`(我点过没) `replies?[]`。
`.raw` 另有 `ip_label`（IP 归属）`service_id`；列表响应顶层还有 `prompts`（输入框占位文案）。
**可做 UI**：评论列表 + 楼中楼 + 点赞/回复/删除。

### 2.7 Chart / ChartRank（榜单）

`Chart`：`id` `title?` `description?`(`style.desc`) `countTracks?` `period?` `releaseTime?`(unix 秒) `ranks: ChartRank[]`。
`ChartRank`：`rank?`（名次=数组位次）、`trend?`（`up`/`down`/`stable`，上游 `rank_type`）、`delta?`（`rank_delta`）、`track: Track`。
榜单 id 来自首页榜单块的 `inner_block_id`，**不是** `hot_song_chart` 这类常量名。

### 2.8 首页 / 内容块（DiscoverBlock）

三层结构：`DiscoverBlock{type,title?,inner[]}` → `DiscoverInner{type,title?,id?,resources[]}` → `DiscoverResource{type,id,raw,track?,playlist?,album?,artist?,user?}`。

实测块类型：`discover_feed_playlist`（歌单推荐）、`discover_playlist`、`discover_top_song_list` / `discover_track_top_list`（榜单，条目带 `inner_block_id` = chart_id）、`discover_radio`（场景队列）、`discover_playlist_mix`。

汇总视图 `HomeView{blocks[], tracks[], playlists[], raw}`（整页捞出的曲目/歌单去重）。

### 2.9 听歌模式（偏好 / 场景）

`FeedModeView{preferences: FeedPreferenceOption[], bar[], scenes: FeedModeOption[], raw}`。
- `FeedPreferenceOption{mode:'default'|'familiar'|'fresh', label, current}`
- `FeedModeOption{type:'preference_mode'|'scene_mode', text, preferenceMode?, radioId?, subQueueType?, raw}` —— 45 个场景（图书馆/专注/摸鱼…）的 `radioId` 就是取批次的入参。
- `FeedModeRef = {kind:'preference', mode} | {kind:'scene', radioId}` —— 「当前用哪个模式听」的唯一形态，配 `parseFeedMode()` / `formatFeedMode()` 落 `config.feedMode`（文法 `preference:<mode>` | `scene:<radioId>`，空串 = 没选过；认不出的一律当没选过，不猜）。
- `discover.feedModeTracks(ref)` 取值：偏好档走 `FeedSongTab`、场景档走 `FeedRadioTracks`。**两条接口一次只随机回约 6 首**（上游实测 `items[6]`），是「连着播的批次来源」，不是可浏览列表 —— 所以 TUI 里它不占 `ListSource`，只画成「听歌」页的单选台（`DESIGN.md` §4.4）。
- 上游 `feed_mode_bar` 只回**当前选中的那一条**偏好（`current`），所以 `（上游当前）` 只是上游栏的显示；本机记住的 `(x)` 以 `config.feedMode` 为准，两者不一致就并存显示。
- `LaunchInfo.boost{genres[{id,name,coverUrl}], langs[{code,name,iconUrl}], needSet}` —— 冷启动首启引导（15 曲风 + 5 语种）。

### 2.10 搜索

- `SearchResult{query, groups: SearchGroup[], raw}`
- `SearchGroup{id?, title?, type?, cursor?, hasMore, tracks[], albums[], artists[], playlists[], users[], raw}`
- `SuggestItem{keyword, type?, groupId?, raw}`（联想 / 推荐词；推荐词带可直达的 track id）
- 分类：`{type, name}[]`（7 个 tab，见 §6）
- **用户搜索拿不到**（`search_type=user` 与 `all` 都没有用户分组）。

### 2.11 分享链接 / 可播地址

- `ShareItem{kind:'track'|'album'|'playlist'|'artist'|'video', id}`（`link.parse()` 纯字符串解析，不联网）
- `ShareMeta{kind,id,title?,artist_text?,cover_url?,share{link_desc,weibo_desc,common_desc},links{share_link,system_link,short_link},access{status,only_vip_playable,only_vip_download,vip_only_qualities},related:TrackRef[]}`
- `ShareMedia{kind,id,play_url,mime_type?,duration_ms?,title?,artist?,cover_url?,vid?,expires_at?,lyrics?{lyric_type,sentences[]},width?,height?,first_frame_url?,artist_avatar_url?}`
- `TrackRef{track_id,name,duration_ms?,album{album_id,name,release_date},artists[{artist_id,name}],cover_url?}`

---

## 3. 账号 / 会员 / 设置

| 类型 | 字段 | 来源 |
|---|---|---|
| `MeProfile{user: UserData, stats: MeStats, raw}` | 「我的」页一次铺满 | `GetMyInfo`（响应顶层是 `my_info`/`my_stats`） |
| `MeStats{liked?,following?,followers?,asset?,raw}` | 收藏/关注/粉丝/资产 | 同上 |
| `Membership{isVip, vipStage?, isPayingUser?, autoRenew?, renewAmount?, hasLosslessEntitlement?, playEntitlements?, downloadEntitlement?, vipExpireAt?, offers: MembershipOffer[], raw}` | 会员态 + 在售套餐 | `GetMySubscription`（匿名可读套餐） |
| `MembershipOffer{offerId?, externalOfferId?, name?, price?, originalPrice?, promotionLabel?, currency?, selected?, raw}` | 可购项（做「开通会员」页） | 同上 |
| `PrivacySetting{followInfoVisibility?, playlistAlbumVisibility?, syncVideoToLuna?, myFavoriteVisibility?, musicWallVisibility?, gamePlayStatsVisibility?, raw}` | 6 个隐私开关（数值枚举，0/1/2 = 可见范围） | `GetMyPrivacySetting` |
| `CommerceSummary{config?, info?, raw}` + `upsell_map`/`variables`/`privilege_map`/`terms_map`/`nameplate_page` | 售卖位文案、权益表、协议文案、铭牌页 | `GetUpsell`/`GetCommerceConfig`/`GetCommerceInfo`（匿名可读） |
| `AccountInfo{uid, nickname?, savedAt?, lastUsedAt?, active?}`、`SessionSnapshot{loggedIn, uid?, nickname?, deviceId?, dataDir, sessionFile, activeUid?, accountCount}` | 多账号 / 登录态 | `accounts()` `snapshot()`（本地） |
| `QishuiLogin{scanUrl, expiresAt, status(), wait()}` | 扫码登录（二维码内容 = 汽水 App 深链） | `login()`（本地 + 轮询） |

> `GetUploaderInfo` 回 imagex 直传凭据 `security_token{access_key_id,secret_access_key,session_token,expired_time,space_name}` —— **敏感**，别落盘/别显示。

---

## 4. 播放 / 媒体 / 歌词（含本地）

播放链路数据（`core` 已封装，UI 只需订阅）：

| 类型 | 字段 | 说明 |
|---|---|---|
| `PlaySource` | `track, kind:'cache'\|'remote', path?, url?, mime?, durationMs?, expiresAt?, bytes?, lyrics?, fromCache` | 解析结果：本地文件路径 **或** 远程签名地址（~25h 过期，**不要持久化**） |
| `CachedMediaMeta` | `v:1, trackId, track, audio{file,mime?,bytes,sha1?,fetchedAt,sourceExpiresAt?}, lyrics?{file,lines,lyricType?,fetchedAt}, cover?{file,bytes,fetchedAt}, fetchedAt, accessedAt, plays` | 本地媒体缓存条目（`cache list` 的数据源） |
| `Lyrics` | `lines: LyricLine[]` + `lineAt(ms)` / `wordAt(ms)` / `view(ms)` | KRC 时间轴查询 |
| `LyricLine` | `text, startMs?, endMs?, words?: LyricWord[], type?, credit` | `credit` = 制作名单行（非歌词） |
| `LyricWord` | `text, startMs?, endMs?` | 逐字卡拉OK |
| `PlayerState` | `status:'idle'\|'loading'\|'playing'\|'paused'\|'stopped'\|'error', track, index, positionMs, durationMs, volume, rate, repeat, shuffle, error?, source{kind,path?,url?,fromCache}` | 常驻播放条/播放页的状态源 |
| `PlayerEvents` | `status` `track` `progress{positionMs,durationMs}` `queue{items,index,repeat,shuffle}` `source` `ended{track,action}` `error{error,track}` | 事件驱动重绘 |
| `PlayQueue` | `list` `playOrder` `index` `current` `repeat` `shuffled` `length` `hasNext()` `hasPrevious()` | 队列视图 |
| `MediaStats` | `tracks, audioBytes, coverBytes, withLyrics, oldestAccessedAt?, totalPlays` | 缓存占用统计 |
| `VerifyIssue` | `trackId, issue` | `cache verify` 的坏条目 |
| `PlayRecord` | `at, trackId, name?, artist?, album?, durationMs?, playedMs?, completed?, source?'cache'\|'remote'` | 本地播放历史（`journal/plays.jsonl`，**永远记**） |
| `PlayStats` | `records, tracks, top[{trackId,name?,plays}]` | 本地统计（听得最多） |

---

## 5. 集合 / 返回包装

| 类型 | 说明 |
|---|---|
| `Paged<T>{items, hasMore, cursor?, total?, raw}` | 所有分页接口统一形状（艺人曲目/专辑、歌单曲目…） |
| `HomeView{blocks[], tracks[], playlists[], raw}` | 首页汇总 |
| `FeedModeView{preferences, bar, scenes, raw}` | 听歌模式单选台（`(x)` = 本机当前，`（上游当前）` = 上游栏那一条） |
| `LaunchInfo{boost?, raw}` | 冷启动引导 |
| `SearchResult{query, groups[], raw}` | 搜索结果分组 |
| `CommerceSummary{config?, info?, raw}` | 商业化配置 |

---

## 6. 枚举与常量（可做 tab / 标签 / 下拉 / 开关）

| 枚举 | 取值 |
|---|---|
| 搜索分类 `search_type` | `all` `track` `video` `artist` `album` `playlist` `user`（7 个 tab，来自 `SearchCategories`） |
| 歌单 `type` | `1` 我喜欢的音乐 / `2` 私有 / `3` 公开·广场 / `4` 抖音收藏 |
| 播放模式 `repeat` | `off` `all` `one` |
| 播放状态 `status` | `idle` `loading` `playing` `paused` `stopped` `error` |
| 推荐流偏好 `preference_mode` | `default`(推荐) `familiar`(熟悉) `fresh`(新鲜)（后两者来自 IDL 常量） |
| 榜单走势 `trend` | `up` `down` `stable` |
| 媒体类型 `media_type` | `track` `audio` `mv` `video` `playlist` … |
| 评论分组 `group_type` | `0` = Track（发评论必须 0） |
| 隐私开关（6 项） | `follow_info_visibility` / `playlist_album_visibility` / `sync_video_to_luna` / `my_favorite_visibility` / `music_wall_visibility` / `game_play_stats_visibility`（数值 0/1/2） |
| 举报类型/理由 | `report_type: "track"`；理由 7 条：`4001 色情低俗` `4002 时政不实信息` `4003 违法违规` `4004 未成年保护` … |
| 不感兴趣 `action_type` | `1` 标记 / `0` 取消 |
| 首启引导 | `boost_setting.need_set`（是否弹曲风/语种选择） |
| 分享链接 `kind` | `track` `album` `playlist` `artist` `video` |

---

## 7. 能力矩阵（读 / 写 · 匿名 / 登录）

**匿名可读**：首页、榜单、听歌模式（`FeedMode` 配置 + 偏好栏与 45 个场景的取批次）、歌单广场、搜索（全类型除用户）、联想/推荐词、曲目/专辑/艺人详情、按 id 批量补曲目（`MGetMedia`）、相似歌曲、分享页元数据与可播地址、评论列表、别人主页/粉丝、会员配置/售卖位。

**需登录（读）**：我的资料 `GetMyInfo`、我的歌单 `GetMyPlaylists`（**收藏曲目的唯一入口**，含 `type=1`）、我的收藏混排、关注艺人、最近播放、已购数字专辑、黑名单、隐私设置、上传凭据。

**需登录（写，共 29 条已实测通过，均可回滚）**：
建/改/删歌单、加歌/移歌、收藏/取消（曲目/专辑/艺人/歌单/媒体列表）、关注/取关、拉黑/解除、发评/回复/点赞/删评、不感兴趣、举报、改隐私、取下单 token。

**本地（不出网）**：播放历史与统计、媒体缓存清单/占用/校验/清理、账号与设备身份、配置。

**未验证**：会员（VIP）行为 —— 播放地址类端点是否对会员放行、VIP 音质/下载分支（实测账号非会员）。

---

## 8. 数据 → UI 挂载点（速配）

| 数据 | 适合的界面元素 |
|---|---|
| `Track` | 列表行、详情页、播放页、队列项 |
| `Track.stats` / `GetMediaStats` | 详情页计数条 |
| `Track.vip` / `label_info.quality_map` / `MCheckMedia`/`MCheckTrack` | 权益标签、音质选择、可播性提示 |
| `Track.playableRange` / `audition_info` / `chorus` | 试听区间、副歌跳转 |
| `Track.colors`(.raw) | 播放页配色主题 |
| `Album` `Artist` | 详情页、横向卡片 |
| `Artist.state` / `Playlist` | 关注/收藏按钮态 |
| `Playlist.type` | 列表分组（我的音乐 / 自建 / 抖音收藏） |
| `Chart` / `ChartRank` | 榜单名次 + 涨跌箭头 |
| `DiscoverBlock` | 首页分区、下钻列表 |
| `FeedModeView` / `FeedModeRef` | 听歌页单选台 + 场景弹层（一个当前模式；取批次不摊成列表） |
| `SearchResult` / `SearchGroup` | 搜索分组、分类 tab |
| `SuggestItem` | 搜索联想下拉（`suggest`） |
| `Comment` | 评论区（含楼中楼、IP 归属、点赞数） |
| `User` / `UserStats` | 用户主页、粉丝/关注列表 |
| `MeProfile` / `MeStats` | 「我的」页头部 |
| `Membership` / `MembershipOffer` | 开通会员页 |
| `PrivacySetting` | 设置页开关列表 |
| `PlaySource` | 播放来源标记（本地/在线） |
| `PlayerState` / `PlayerEvents` | 常驻播放条 / 播放页 |
| `PlayQueue` | 播放队列视图 |
| `Lyrics` `LyricLine` `LyricWord` | 歌词滚动 + 逐字高亮 |
| `CachedMediaMeta` / `MediaStats` | 缓存管理页 |
| `PlayRecord` / `PlayStats` | 最近播放、听得最多 |

---

## 9. 别拿这些设计功能

| 数据 | 现象 |
|---|---|
| 用户搜索结果 | `search_type=user` 与 `all` 都不返回用户分组（上游不返回） |
| `GetRecentPlayedMedia` | 上报写通道通、**读回不落地**；最近播放以本地 `history` 为准 |
| 热搜 `GetSearchBlock` | PC 恒空 |
| `GetFeaturedContents` | 实测无数据 |
| `GetTrackV2`/`GetMediaPlayer` 等播放地址端点 | 匿名与登录都拒答（`1000062`/空响应）；地址走 web 分享页 |
| `FlowSearch` | HTTP 404，线上不存在 |
| 关注列表 `GetFollowingList`、用户资料 | 反复请求触发 captcha，做「翻页浏览」要收敛频次 |
