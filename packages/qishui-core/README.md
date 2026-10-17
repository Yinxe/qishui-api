# qishui-core

汽水音乐的**应用后端**：在 [`qishui-api`](../qishui-api)（协议层，320 个端点）之上，把「一个音乐 App 要干的事」按能力分类封装成 OOP 实体与服务，数据落在自己的目录里（默认 `~/.qishui`）。

应用层（UI/播放器外壳）只需要它，不用直接碰协议：

```ts
import { createQishui } from 'qishui-core'

const qishui = await createQishui({ logger: console.log })

const home = await qishui.discover.home()            // 首页大盘
const track = home.tracks[0]
await track.play()                                   // 解析地址 → 落盘缓存 → 起进度时钟
qishui.player.on('progress', (e) => render(e.positionMs))
console.log(qishui.player.lyricState()?.line?.text)  // 逐字歌词（KRC）
```

- **分层**（上层都能往下穿透，不藏能力）
- **分类**（每个服务 = 一类能力，方法即能力，注释写清实测口径）
- **不出声**（播放器只做状态机；音频交给上层 shell）
- **不替上游下结论**（拿不到就是拿不到/未验证，绝不编默认值）

---

## 1. 快速开始

```bash
pnpm install
pnpm --filter qishui-api run build     # core 依赖 api 的 dist
pnpm --filter qishui-core run build    # tsc --strict（noUnusedLocals）

# 单测（vitest，全程离线：注入 mock 上游 + 独立数据目录；先 pnpm build）
pnpm --filter qishui-core run test
```

```ts
import { createQishui } from 'qishui-core'

const qishui = await createQishui({
  dataDir: '/path/to/data',      // 默认 ~/.qishui（QISHUI_HOME 也可覆盖）
  config: { timeoutMs: 15_000 }, // 覆盖 ~/.qishui/config.json 里的项
  account: '222…',               // 本实例临时激活哪个号（uid 或昵称，优先于 config.activeUid）
  logger: (line) => console.log(line),
})

// 未登录也能读：首页 / 搜索 / 榜单 / 详情 / 评论 / 歌单广场 / 可播地址
const tracks = await qishui.search.tracks('晴天')

// 要登录：出二维码给汽水音乐 App 扫（不是抖音）
const qr = await qishui.login({
  onQr: ({ scanUrl }) => renderQrCode(scanUrl),   // core 不引二维码库，内容给你自己渲染
})
await qr.wait()                                   // confirmed 时会话已落盘
```

## 2. 分层

```
core.ts            QishuiCore 门面 + createQishui()
  entities.ts      Track / Album / Artist / Playlist / User / Comment / Chart —— 「拿到就能用」的 OOP 壳
  services/*       account catalog discover search library comments social feedback link —— 按能力分类
  player/*         Player 状态机 + PlayQueue + Lyrics（只做状态，不出声）
  cache/*          EntityCache（元数据 TTL）+ MediaCache（音频/歌词/封面，断点续传）
  session.ts       设备身份 + 扫码登录 + 多账号会话（device.json + accounts/<uid>.json，0600）
  parse.ts         上游各种包装/漂移的归一化（unwrap / asX / collectX）
```

**想干 core 没封装的事**：`qishui.request('端点名', params)`（320 个端点都能直调）或 `qishui.api`（原始 `Client`）。

## 3. 服务分类与能力

每个方法都写了「能拿到什么 / 有哪些实测坑」。这里给速查表。

### 3.1 `account` —— 账号与会员（我自己的资料）

| 方法 | 能力 |
|---|---|
| `me()` / `stats()` / `uid()` | 「我的」页：`my_info`（uid/昵称/头像/signature/is_vip/vip_stage）+ `my_stats`（收藏/关注/粉丝/获赞） |
| `membership()` | 会员态 + 在售套餐（`subs_info` + `to_purchase_offers`，含价格/权益/自动续费） |
| `upsell()` / `commerce()` / `digitalAlbums()` | 商业化推荐位、商业化配置汇总、已购数字专辑 |
| `privacy()` / `updatePrivacy(patch)` | 6 个隐私开关读写（改的时候只传要改的键） |
| `blockList()` | 黑名单分页（匿名回 `1000004`，得登录） |
| `reportPlayed(tracks)` / `removePlayed(tracks)` | 上报「最近播放」。**默认不自动调用**（见 §6 写入安全） |
| `uploader()` | imagex 直传凭据。⚠️ 返回的 `security_token` 是敏感凭据 |

### 3.2 `catalog` —— 曲库（找内容，不区分是不是我的）

| 方法 | 能力 |
|---|---|
| `track(id)` / `tracks(ids)` | 单首 / **按 id 批量取曲目详情**（`MGetMedia`，匿名可用；先查本地缓存，缺的一次补齐） |
| `trackMeta(id)` | 分享页元数据（标题/歌手/封面/可播性标签/相关曲目） |
| `check(media)` / `checkTracks(ids)` | 播放前查权益、上下架（`MCheckMedia` / `MCheckTrack`） |
| `stats(id)` | 收藏/评论/分享计数 |
| `related(id, count)` | 相似歌曲 |
| `album(id)` / `albumTracks(id)` | 专辑 + 整张曲目（一次全给） |
| `artist(id)` / `artistHotTracks` / `artistTracks` / `artistAlbums` | 艺人页三个 tab（热门/歌曲分页/专辑分页） |
| `playlist(id)` / `playlistTracks(id)` | 歌单详情 + 曲目分页（曲目在响应的 `media_resources[]` 里） |
| `chart(id)` | 榜单整榜（`chart_id` = 首页榜单块的 `inner_block_id`） |
| `clearCache(kind?)` | 按 kind 清元数据缓存 |

### 3.3 `discover` —— 发现 / 推荐

| 方法 | 能力 |
|---|---|
| `home({layout})` | 首页大盘。`grid`（默认）= 榜单块 + 推荐歌单 + 场景队列；`feed` = 听歌模式（30 个场景电台，榜单块不在里面） |
| `mix({blockType, subChannelId})` | 单个内容块下钻（首页块点进去看全部） |
| `feedSongTab(opts)` | 推荐流单曲。`preferenceMode`: `default`（推荐）/ `familiar`（熟悉）/ `fresh`（新鲜）；`count`（默认 6）；自动维护 `is_first_request`/`total_request_count`/`preference_mode_request_count` 会话计数。`withPlayedTracks` 默认 **false**：机制在（本地播放历史最近 20 条按时间升序当 `played_tracks`，字段名按同构 `MediaPlayed` 推、实测上游照收），但播放时长还没向上游上报，主动带反而暴露「只播不报」，上报口径补上前不带。`excludePlayed`/`excludeLiked`（`maxPages` 默认 3）是**客户端过滤**：本地把已播/已喜欢的剔掉、翻页补齐到 `count`——「只要没听过的」走这条确定性路径，别赌上游 `preference_mode` 是否真改变分布（仍未验证） |
| `playlistSquare({categoryId})` | 歌单广场（含分类） |
| `radioTracks(radioId)` | 场景电台续播。`radioId` 实测两种都吃：场景的 `scene_mode_id`（如 `48`）或首页场景块的 `inner_block_id` |
| `feedMode()` | FeedMode 原始响应 |
| `feedModes()` | 解析成 `{preferences, bar, scenes}`：偏好栏（推荐/熟悉/新鲜，`current` 标上游选中的）+ 45 个场景（`radioId` 即 `scene_mode_id`） |
| `launch()` | 冷启动配置：曲风/语种 + `boost_setting.need_set`（判断是否弹首启引导） |

> `FeedMode` 的 `feed_mode_bar` **只回当前选中的那一个**（实测只回「推荐」），所以「熟悉/新鲜」两个取值来自 IDL 常量
> （`PreferenceModeFamiliar` / `PreferenceModeFresh`），不是从响应枚举出来的。`preference_mode` 上游对未知值不报错，
> 所以别拿「能回 6 首」当验证 —— 推荐流本来就是随机的。

### 3.4 `search` —— 搜索

| 方法 | 能力 |
|---|---|
| `search(q, {type, cursor})` | 全类型搜索（`type: 'all'\|'track'\|'album'\|'artist'\|'playlist'\|'user'\|'video'`），回 `groups[]` + 游标。匿名走 `/luna/search/<type>`；**已不用 h5 版 `Search2023`**（旧接口，已弃用） |
| `tracks` / `albums` / `artists` / `playlists` / `users` | 指定类型的快捷方法 |
| `suggest(q)` | 搜索框联想（词条 + 可直达的实体） |
| `recommendWords()` | 推荐搜索词（带 track id，可直接开播） |
| `categories()` | 7 个 `search_type`（tab 用） |
| `hotBoard()` | 热搜块（PC 身份下**恒空**，别在这耗时间） |

> 结果实体在 `result_groups[].items[].entity.<kind>`（`entity.track` / `entity.artist` / `entity.album` / `entity.playlist`），
> 和详情接口的 `*_wrapper` 不是一套壳。
> **用户搜索拿不到**：`search_type=user`（或 `all`）都没有用户结果 —— 上游 `/luna/search/user` 回 `200` 但 body 里没有 `result_groups`，
> 换 `search_method`/`search_scene`/带会话都一样，属**未验证 / 上游不返回**，不是本库漏解析。

### 3.5 `library` —— 我的音乐（歌单 / 收藏 / 最近播放）

| 方法 | 能力 |
|---|---|
| `playlists()` | 我的歌单（含「我喜欢的音乐」`type=1`、「抖音收藏的音乐」`type=4`） |
| `likedPlaylist()` / `likedTracks()` / `isLiked(id)` | 收藏的曲目（整张翻页 + 5 分钟缓存），like/unlike 后自动失效重取 |
| `mixedCollections()` / `collectedArtists()` / `recent()` | 收藏的歌单专辑混排 / 关注的艺人 / 最近播放 |
| `createPlaylist(title, {isPrivate})` / `updatePlaylist(id, patch)` / `deletePlaylists(ids)` | 歌单增删改 |
| `addToPlaylist(id, trackIds)` / `removeFromPlaylist(id, trackIds)` | 歌单加歌/移歌 |
| `like(id)` / `unlike(id)` | 收藏/取消收藏曲目 |
| `collectAlbums` / `uncollectAlbums` / `collectArtists` / `uncollectArtists` / `collectPlaylists` / `uncollectPlaylists` | 各类收藏与取消 |
| `collectMedia(targets, scene)` / `uncollectMedia(targets)` | 批量收藏媒体列表（`media[]` 形态，跨类型） |

### 3.6 `comments` —— 评论

| 方法 | 能力 |
|---|---|
| `list(target, {cursor, count})` | 一级评论（`target` 可以是 `Track`、`TrackData` 或 id 字符串） |
| `replies(commentId, opts)` | 某条评论的回复（响应键是 `reply_infos`） |
| `post(target, text)` | 发评论（`group_type` 固定 0；曲目评论区关闭时上游回 `3056`） |
| `reply(commentId, text, opts)` | 回复某条评论 |
| `like(commentId, {type})` / `remove(commentId)` | 点赞/踩、删自己的评论 |
| `users(raw)` | 从任意响应里捞出评论作者 |

### 3.7 `social` —— 用户与社交

| 方法 | 能力 |
|---|---|
| `user(id)` | 用户资料（**5 分钟缓存**：这个接口连打两次就会被 captcha 拦） |
| `followers(id)` / `following(id)` | 粉丝 / 关注列表（同样 5 分钟缓存） |
| `userPlaylists(id)` / `userMixedCollections(id)` | 别人的公开歌单 / 收藏混排 |
| `follow(id)` / `unfollow(id)` / `block(id)` / `unblock(id)` / `blocks()` | 关注、拉黑（`block_items:[{id,item_type:"user"}]`） |

### 3.8 `feedback` —— 举报与上报

| 方法 | 能力 |
|---|---|
| `reportReasons(type)` | 举报原因枚举（`report_type` 给字符串 `'track'`，给数字回 `1000004`） |
| `report({contentId, reportType, reasonCode})` | 提交举报（走非 pc 的 `/luna/report`） |
| `dislike(itemId, {actionType})` | 「不感兴趣」（`actionType: 1` 标记、`0` 取消） |
| `shareCount(itemId, type)` / `reportAction(payload)` | 分享计数、行为埋点 |

### 3.9 `link` —— 分享链接

| 方法 | 能力 |
|---|---|
| `parse(input)` | 纯字符串解析（不联网）：分享链接 / 裸 ID → `{kind, id}` |
| `resolve(input)` | 短链 → 真链接（只读 3xx 的 Location） |
| `meta(input, {relatedCount})` | 标题/歌手/封面/可播性 + 相关曲目（走 web 分享页） |
| `media(input, {coverWidth})` | **可播地址**（`play_url` + `expires_at`）+ KRC 歌词 + 封面（走 web 分享页 SSR） |
| `track(input)` / `kind(input)` | 直接拿 `Track` 实体 / 条目类型 |

## 4. OOP 实体

服务返回的不是裸 JSON，而是薄壳（`.data` 里是归一化后的 `TrackData` / `PlaylistData` …，`.raw` 是上游原始响应）：

```ts
const track = await qishui.catalog.track('7068138081588611073')
track.name          // 红色高跟鞋
track.artistNames   // 蔡健雅
track.durationMs    // 206587
track.vip           // { onlyVipPlayable, onlyVipDownload, vipOnlyQualities }
await track.play()          // 播放这一首
await track.ensureMedia()   // 只落盘不播放
await track.related(10)     // 相似歌曲 → Track[]
await track.lyrics()        // Lyrics（时间轴查询）
await track.comments()      // 一页 Comment
await track.like()          // 收藏
await track.albumEntity()   // 所属专辑

const chart = await qishui.catalog.chart(chartId)
chart.ranked        // [{rank, trend, delta, track: Track}]
await chart.play()  // 整榜排队播放

const playlist = await qishui.library.likedPlaylist()
await playlist.allTracks()  // 整张翻完（自动翻页）
await playlist.add([track]) // 加到歌单
```

| 实体 | 关键成员 |
|---|---|
| `Track` | `name` `artistNames` `durationMs` `coverUrl` `vip` `play()` `source()` `ensureMedia()` `lyrics()` `related()` `comments()` `albumEntity()` `like()` `unlike()` `isLiked()` |
| `Album` | `name` `coverUrl` `releaseDate` `tracks()` `play()` `like()` `unlike()` |
| `Artist` | `name` `avatarUrl` `following` `tracks()` `albums()` `follow()` `unfollow()` |
| `Playlist` | `title` `description` `countTracks` `isLikedList` `isPrivate` `tracks()` `allTracks()` `add()` `remove()` `rename()` `setDescription()` `delete()` `like()` `play()` |
| `User` | `nickname` `avatarUrl` `isVip` `info()` `playlists()` `follow()` `unfollow()` `block()` `unblock()` |
| `Comment` | `content` `user` `liked` `replies()` `reply()` `like()` `remove()` |
| `Chart` | `title` `countTracks` `tracks` `ranked` `play()` |

`QishuiCore` 本身也能把「裸对象」包成实体：`qishui.track(raw)` / `qishui.tracks(rawList)` / `album` / `artist` / `playlist` / `user` / `comment` / `chart`。

## 5. 播放器（只做状态机）

**它不出声**。`Player` 负责：解析播放源（远程签名地址或本地缓存文件）→ 维护 `idle/loading/playing/paused/stopped/error` 状态 → 走 250ms 时钟推进 `positionMs` → 发事件。真正的音频播放由上层 shell 拿 `player.source.path` / `.url` 自己播。

```ts
qishui.player.on('status', (e) => console.log(e.status))
qishui.player.on('track', (e) => console.log('当前曲目', e.track?.name))
qishui.player.on('progress', (e) => console.log(e.positionMs, '/', e.durationMs))
qishui.player.on('ended', () => console.log('这首完了'))

await qishui.player.play(track)            // 单曲
await qishui.player.playList(tracks, startTrackId)
qishui.player.enqueue(nextTrack)           // 插到队尾
qishui.player.playNext(afterTrack)         // 插到下一首
qishui.player.setRepeat('all')             // off | all | one
qishui.player.setShuffle(true)
qishui.player.seek(30_000)
await qishui.player.next()                 // 手动切歌（受 repeat 影响）
qishui.player.lyricState()                 // 当前歌词行 + 下一行（渲染滚动的输入）
qishui.player.dispose()
```

口径（有意为之）：

- **播放源不落持久化**：签名地址约 25h 过期，绝不能存 JSON 里当长期地址；`source.path` 是本地缓存文件才有意义。
- **历史只在「开始播」时记一条**（登录后 `journal/<uid>/plays.jsonl`、未登录 legacy 原位，带 `source: 'cache'|'remote'`）；`playedMs` / `completed` 留给上层用 `qishui.history.append()` 补记。
- **`skipOnError`** 打开时，某首解析/下载失败自动跳下一首（不打断整张专辑）。

`Lyrics`（KRC，行级 + 逐字）也只做时间轴查询：`lines` / `lineAt(ms)` / `wordAt(ms)` / `view(ms)`，滚动动画与卡拉OK 高亮是上层的事。

## 6. 数据目录与缓存

```
<root>/                         默认 ~/.qishui（QISHUI_HOME / createQishui({dataDir}) 可覆盖）
├── config.json                 偏好（可手改；不存在就用默认值）；`activeUid` 记激活账号
├── device.json                 设备身份（与账号解耦，全体账号共用，避免换号触发新注册；0600）
├── accounts.json               已登录账号索引（uid/昵称/入库时间/上次使用；0600）
├── accounts/<uid>.json         每号一份登录 cookie（0600，别外传）
├── cache/
│   ├── entities/<kind>/<id>.json            公共元数据缓存（带 TTL，LRU 按文件 mtime）
│   ├── entities/_acct/<uid>/<kind>/<id>.json  账号私有/带我态元数据（按 uid 隔离，见 §6.1）
│   └── tracks/<trackId>/
│       ├── meta.json               曲目元数据 + 文件清单 + 来源信息（含 plays 计数）
│       ├── audio.m4a               音频本体（下载中为 .part）
│       ├── lyrics.json             KRC 结构化歌词
│       └── cover.jpg               封面
├── journal/plays.jsonl         未登录/迁移前的播放历史（append-only）
├── journal/<uid>/plays.jsonl   各账号的播放历史
└── logs/                       预留（core 默认只往 logger 打）
```

旧版单账号 `session.json` 由 `SessionManager.init()` 一次性迁移（拆成 device.json + accounts/，原件改名 `.bak`）；
迁移时顺带把共享位上旧版落过的「私有/带我态」kind 清掉，避免串号。

`config.json` 默认值（`CONFIG_DEFAULTS`）：

| 键 | 默认 | 说明 |
|---|---|---|
| `timeoutMs` | `20000` | 单次请求超时 |
| `entityTtlMs` | `30min` | 元数据缓存的兜底 TTL；实际各服务都显式传档位（见 §6.1），这键基本用不到（0 = 不缓存） |
| `coverWidth` | `400` | 封面 CDN 拼串宽度 |
| `autoCacheMedia` | `true` | 播放时把音频/歌词/封面落盘 |
| `maxMediaBytes` | `2GiB` | 媒体缓存上限，超了按最久未访问剔除 |
| `reportPlayback` | `false` | 是否把播放上报给上游（**默认关**，见 §7） |
| `defaultRepeat` / `defaultShuffle` | `off` / `false` | 播放器默认 |
| `activeUid` | 无（按索引 `lastUsedAt` 挑） | 激活账号；`useAccount`/登录/登出会写回，也可手改 |

**媒体缓存的关键行为**（`MediaCache`）：

- `peek(id)` / `has(id)`：**纯读盘，零网络**（所以「命中缓存不再发 url 请求」是硬保证，单测里有断言）。
- `ensure(track)`：完整命中直接返回；缺音频/歌词/封面才去拉一次分享页补齐。
- 音频下载用 `.part` + `Range: bytes=N-` **断点续传**（回 200 就重下），下完用 `content-range` 的总长核对再 rename。
- `stats()` / `list()` / `verify({fix})` / `prune({maxBytes, maxAgeMs})` / `clear()` / `evict(id)`。
- **媒体文件不过期**（`sourceExpiresAt` 只是溯源信息）；元数据缓存按下面的分档走。

### 6.1 缓存分档：哪些数据缓存、缓存多久

**原则：只有「同一份数据长时间不变」才值得落盘。** 实时数据一次一取，不缓存。

分档只有一处定义：`src/cache/policy.ts` 的 `CacheTtl`（`qishui cache policy` 打同一张表）。各服务引用档位，不写死秒数：

| 档位 | TTL | 装什么 | 为什么这么定 |
|---|---|---|---|
| `none` | 不缓存 | 搜索（`Search`/`Search2023`）、联想词（`Sug`）、推荐流（`FeedSongTab`）、电台续播、相似歌曲（`GetRelatedMedia`）、首页（`DiscoverView`）、块下钻、歌单广场、搜索聚合块、最近播放、收藏计数（`GetMediaStats`） | 每次本来就该是新数据；缓存等于把「随机推荐」冻住（`--refresh` 在这类命令上是空操作） |
| `entity` | 6 小时 | 专辑/艺人/歌单详情、艺人曲目与专辑列表、曲目元数据（`MGetMedia`） | 同 id 基本不变 |
| `chart` | 30 分钟 | 榜单（`GetChartDetail`） | 每天/每周更新，整榜拉取代价大 |
| `config` | 6 小时 | `FeedMode`、`Launch`、推荐搜索词（`SuggestWords`） | 运营口径的枚举与开关 |
| `staticEnum` | 24 小时 | 搜索分类 tab、举报理由 | 几个月不变 |
| `account` | 5 分钟 | 我的歌单 / 红心 / 混排收藏 / 关注艺人 / 我的资料 / 会员态 / 隐私开关 / 他人资料与粉丝列表 | 我自己的数据；写操作**主动失效**，不用等 TTL |

- **「不缓存」就是 `ttlMs: 0`**：`EntityCache.set()` 见 0 直接跳过写盘（内存里那条也立刻过期），磁盘上不留空文件。
- **曲目分享元数据 `trackMeta()` 不缓存**：它把 `GetRelatedMedia` 的随机相关曲目裹在同一个响应里，缓存会把随机数据冻住。
- **评论不缓存**（`comments.list()` 直接打上游）：评论区是实时的，且本身有风控。
- 账号档的写后失效（`library` / `social` / `account`）：`like/unlike`、`collect/uncollect`、加歌/删歌、建/删/改名歌单 →
  清 `my-playlists` `liked-tracks` `mixed-collections` `artist-collection` `me`；`follow/unfollow` → 清 `user` + `me`；
  `updatePrivacy` → 清 `privacy`；`block/unblock` → 清 `user` + `block-list`。
- 元数据缓存的 `entityTtlMs` 配置只是兜底：所有调用点都显式传档位了。

### 6.2 账号隔离维度：同一档位再按「谁的可见性」分两层

TTL 档位之外，每个 kind 还有一档 **scope**（同样只在 `policy.ts` 定义：`CacheScope` + `KIND_SCOPE` + `scopeFor()`，`qishui cache policy` 打同一张表）：

| scope | 落盘位置 | 装什么 |
|---|---|---|
| `account` | `cache/entities/_acct/<uid>/<kind>/` | 只有我自己可见的数据：`me` `liked-tracks` `my-playlists` `recent-played` `followers` `block-list`… |
| `viewer` | `cache/entities/_acct/<观看者 uid>/<kind>/` | 主体公共但**带我态字段**的元数据：`track` `playlist-detail` `album-detail` `chart` `user`…（是否已收藏/会员档位随人变） |
| `public` | `cache/entities/<kind>/`（共享） | 与账号无关的：`search` `discover-home` `feed-song-tab` `radio-tracks`… |

- 未登录（无激活账号）时 account/viewer 类也落共享位（内存 key 前缀 `~`），登录后自动改走 `_acct/<uid>/`，**两号互不可见**；媒体缓存（`cache/tracks/`，匿名分享页来源、无账号态）始终跨号共享。
- 切号 = `cache.clearMemory()` + 盘上本就分层，不需要清对方数据；`logout --purge` / `reset` 才用 `invalidateAccount(uid)` 删 `_acct/<uid>` 整目录。

## 7. 写入安全（重要）

原则：**无会话时只验拦截、不动数据；有会话时写操作要显式开，且能回滚。**

| 行为 | 何时发生 |
|---|---|
| 本地播放历史（`journal/<uid>/plays.jsonl`，未登录走 legacy 原位） | **永远记**，不受任何开关影响 |
| 上报上游「最近播放」（`AppendRecentlyPlayedMedia`） | 只有 `config.reportPlayback: true` 才发（实测该接口**写通道通、回读不落地**，所以默认关） |
| 媒体文件落盘 | 播放时（`autoCacheMedia`）或显式 `ensureMedia()` / `core.source(id, {download:true})`。**没有批量下载接口**，不会偷偷拉一整张专辑 |
| 收藏 / 歌单 / 评论 / 关注 / 拉黑 / 举报 | 只有你显式调对应方法才发；`like()`/`unlike()` 等成对方法都做了「先查再改」与缓存失效 |

写后缓存失效：收藏/歌单类写操作统一清 `my-playlists` / `liked-tracks` / `mixed-collections` / `artist-collection` / `me`
（见 §6.1），避免读到旧值。

## 8. 会话与登录

```ts
qishui.loggedIn                 // 有会话 cookie 吗
const qr = await qishui.login({ onQr })            // 汽水音乐 App 扫码；新号入库并**默认激活**，不动其他号
await qr.wait(2000, 180_000)                        // 轮询到 confirmed/expired/timeout
await qishui.login({ keepActive: true })            // 入库但不切激活号

qishui.accounts()              // [{ uid, nickname, savedAt, lastUsedAt, active }]
qishui.activeUid               // 当前激活号
await qishui.useAccount('uid或昵称')                // 切号：清播放器 → 换 cookie → 作废缓存内存态 → 历史上换目录 → 写回 config.activeUid
await qishui.logout()                               // 退出当前号（账号壳与私有缓存保留，可切回归位）
await qishui.logout({ purge: true })                // 连账号文件与 _acct/<uid> 缓存一起删
const anon = await createQishui({ account: '222…' }) // 本实例临时用 B 号（CLI `--as` 走这里），不改默认

// 迁移已有会话（例如从 qishui-api 包目录里那份）
await qishui.session.importFrom({
  deviceFile:  'packages/qishui-api/qishui-device.json',
  sessionFile: 'packages/qishui-api/qishui-session.json',
})
```

- 扫码用的是**汽水音乐 App**，`scanUrl` 是 `bff-pc.qishui.com` 深链；**抖音扫码是错的**。
- 每号 cookie 以 `0600` 落 `accounts/<uid>.json`，能免登录直接复用；`importFrom` 会把 cookie 就地注入已建好的 `Client`（无需重启进程）。
- **设备身份与账号解耦**：全体账号共用 `device.json` 一台「设备」，换号不触发新注册（少一次风控暴露面）。
- 切号时 cookie jar **先清后灌**：上一号的独有 cookie 不会残留（单测有断言）。
- 拿不到身份时的读接口行为：匿名可读的那批照常返回；`1000016` 由 `qishui-api` 抛 `AuthRequiredError`，core 前置检查抛 `NotLoggedInError`。

## 9. 错误模型

```ts
import { CoreError, NotLoggedInError, MediaUnavailableError, CacheError } from 'qishui-core'

try {
  await track.play()
} catch (err) {
  if (err instanceof MediaUnavailableError) showToast('这首暂时拿不到播放地址')
  else if (err instanceof CoreError) report(err)
  else throw err                        // 上游的（AuthRequiredError / RiskControlError / ApiError…）
}
```

| 类 | 含义 |
|---|---|
| `CoreError` | core 自己的错误基类（把「core 的问题」和「上游的问题」分开 catch） |
| `NotLoggedInError` | core 侧的前置检查（上游的 `1000016` 是 `AuthRequiredError`） |
| `MediaUnavailableError` | 这个条目拿不到媒体（版权/VIP 限制、下架、校验不过）—— **不是「接口不可用」** |
| `CacheError` | 本地数据目录读写失败 |

> 历史：曾有一个 `UnsupportedError` 用来「提前判死」播放地址类接口，**已删除**。理由：那是拿本库的策略当接口结论，而且实测证明分享页那条路能拿到地址。现在 core 与 api 都**照发请求、上游回什么记什么**，拿不到的属于「未验证 / 这个条目不可播」，不是「不可用」。

## 10. 维护与检查

```ts
await qishui.cacheStats()        // 元数据条数/命中数 + 媒体占用/播放计数
await qishui.media.verify()      // 校验文件（缺了/长度不符/坏 JSON）→ issues[]（{fix:true} 顺手修）
await qishui.media.prune()       // 按 maxMediaBytes / maxAgeMs 清理
await qishui.cache.prune()       // 清过期元数据
await qishui.clearCache({ media: true, all: true })   // 全清（慎用，媒体是几 MB 一个）
qishui.plays(50) / qishui.playStats()                  // 本地播放历史 / 统计
qishui.saveConfig()              // 把内存里的 config 写回 config.json
qishui.dispose()                 // 停播放器时钟、关掉句柄
```

单测 `test/*.test.ts`（vitest，跑之前先 `pnpm run build`——测试从 `../dist` 导入）覆盖：会话迁移 →
**多账号机制**（`_acct/<uid>` 隔离、切号编排、`--as` 严格临时态、`logout --purge`）→ 实体缓存分档/命中零请求 →
曲库/搜索（mock 上游）→ 媒体落盘/断点/校验/清理 → 播放器状态机 → 本地历史 → paths/parse/policy。
**全程不打上游**（注入 mock fetch + 独立数据目录）；上游可达性结论只由 `qishui-api` 实测台负责。

## 11. 已知边界（没验的就说没验）

- **会员（VIP）行为未验**：本机会话是 `is_vip: false`。VIP 音质/下载类端点、`GetTrackV2`/`GetMediaPlayer`/`MGetMediaV2`/`GetTrack`/`GetH5Track`/`GetH5TrackV2`/`GetTrackPlayerInfo` 这批 `1000062` 接口是否对会员放行、播放地址对会员是否不同，都还没结论。拿到会员会话后重跑 `packages/qishui-api/test/run.ts` 即可（已结论的会自动 SKIP）。
- **`QueryTokenStatus`（GET v1）上游 HTTP 500**：同 token 走 POST v2 正常，疑似该 GET 路由已下线。
- **风控**：`GetUserInfo` / `GetFollowerList` / `GetFollowingList` 连打两次就可能触发 captcha。core 给这些读接口 5 分钟缓存，**不要遍历粉丝列表**。
- **响应叶子类型**：`qishui-api` 的 `entity/*` 是纯类型声明，编译期被擦除，所以响应叶子是 `any`；core 的 `parse.ts` 用「形状识别 + 递归捞实体」兜漂移，字段名以真实响应为准。
- **`GetRecentPlayedMedia` / `AppendRecentlyPlayedMedia`**：写回 `status_code=0` 但读回来仍是空（写通道通、读回不落地）。所以「听过什么」的真相源是本地 `journal/plays.jsonl`。
