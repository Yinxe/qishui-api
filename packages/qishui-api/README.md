# qishui-api

汽水音乐（SodaMusic，字节跳动）PC 客户端 v3.7.0 接口的 TypeScript 封装。IDL 从官方 PC 客户端分发包自带的 sourcemap 整理对齐而来，
用纯 HTTP 复现请求层。**仅供学习研究，请遵守平台服务条款。**

> 本包位于 `packages/qishui-api`；文中相对路径均以本包目录为根。
> 仓库根是 pnpm workspace，说明见根 `README.md`。

## 能力边界（先说清楚）

| | 情况 |
|---|---|
| 接口覆盖 | **320 个端点**，请求字段全部精确来自整理出的 IDL；其中 **74 个**是官方客户端 `idlMethods` 注册表里真正在用的 |
| 匿名可读 | 精选的 **90 条**音乐 App 常用接口里，实测 **35 条**匿名直接返回业务数据（发现页、**搜索**、榜单、歌手/专辑详情、相关推荐、曲目批量详情 `MGetMedia`、可播性检查、歌单广场、分享链接、Sug 联想、评论区、商业化配置…），4 条回了但没数据 |
| 需要登录 | **38 条**（`status_code=1000016`）：我的歌单/收藏/最近播放、收藏与关注、歌单增删改、评论、举报、隐私设置、下单等。其中 **29 条是写接口**，另 **9 条是「读」** —— 带会话复测后 **6 条翻盘**（我的信息/我的歌单/黑名单/上传凭据/隐私设置/h5 搜索），3 条回了空（账号没数据）。清单见 [`docs/APP_ENDPOINTS.md`](docs/APP_ENDPOINTS.md) |
| **写接口** | **29 条全部实测通过**（`test/write.ts`，每步「做 → 回读验证 → 撤销 → 再回读」，收尾 11 项安全复查全过）：建单/改单/加歌/移歌/删单、收藏↔取消（曲目/专辑/艺人/歌单/媒体列表）、关注↔取关、拉黑↔解除、发评→点赞→删评、`Dislike`、举报、改隐私（原值回写）、取下单 token —— **29 条全部 `status_code=0`**（4 条是换参数/换 path 后翻案）。逐条参数与回读验证见 [`docs/APP_ENDPOINTS.md`](docs/APP_ENDPOINTS.md) §3.12 |
| 登录 | **汽水音乐 App 扫码**（`/passport/web/get_qrcode` + `check_qrconnect`，二维码内容 = `bff-pc.qishui.com/.../scan_login?token=…`），cookie 落进 `CookieJar`；`test/login.ts --start` 出码、`--poll` 等扫 |
| **播放地址** | goapi 那批接口（`GetTrackV2`/`GetMediaPlayer`/`GetVideoV2`/`MGetMediaV2`/`GetTrack`/`GetH5Track`/`GetH5TrackV2`/`GetTrackPlayerInfo`）**照常发请求、不拦**：匿名与**带会话**实测上游都拒答（pc 变体空响应 / 非 pc 变体 `1000062 应用版本有风险`），只在 `ENDPOINT_DATA[].gated` 上打标记。**会员态是否放行未验证**（本次账号非会员）。要在 API 层拿曲目详情用 `MGetMedia`（匿名可用，**但不含播放地址**）、拿可播性用 `MCheckMedia`/`MCheckTrack`；`src/web/sharePage.ts` 走 web 分享页的 SSR，实测能拿到 `audio_mp4`/`video_mp4` 地址。见下 |
| 搜索 | **匿名可用**：官方 `Search` 走 `/luna/search/<type>`（非 pc 变体）就返回 `result_groups`（track 一次 ~114KB 完整实体）；注意**不能带 `debug_params`**，pc 变体恒 `200+0 字节`。7 个 `search_type` 由 `SearchCategories` 给出。`Sug` / `SuggestWords` 做联想与推荐词 |
| 检索替代 | 关键词可直接走 `Search`；`Sug` / `SuggestWords` 返回 track/album/artist 实体与 ID 做下拉与「猜你想搜」。`FlowSearch` 404（path 线上不存在）；`Search2023`（h5）匿名回 `login_required`、**带会话可用** |
| **排行榜** | **能拿**：`DiscoverView` 空 body（= 官方 `Discover.vue`）回 `discover_top_song_list` 块（热歌榜 / 新歌榜 / 欧美榜，每榜几十首、每周四更新），曲目在 `resources[].entity.ranked_track.track`；每个榜条目的 `inner_block_id` 就是 `GetChartDetail` 的 `chart_id`，能再取整榜 `track_ranks[{rank,track}]`。`{first_request, pc_new_discover_request:true}`（听歌模式）只回 30 个场景队列、**榜单块不在响应里** |
| 热搜榜 | **PC 客户端身份下拿不到**：`GetSearchBlock` 的 `search_chart_block`（热搜/热歌/新歌/歌手榜）恒为空（`includes` 只认 `SearchBlockType*` 三种块名，`scene_name` 换过也没用）；`GetFeaturedContents` 回空 body。替代：`SuggestWords(recommendation)`（推荐搜索词，带 track id）+ `GetChartDetail`（用榜单块的 `inner_block_id` 当 `chart_id`） |
| 分享链接入口 | `src/web/share.ts`：短链→`track_id`（只读 3xx 的 Location）→ 标题/歌手文案/**封面 JPEG**/可播性 VIP 标记/相关曲目。见「分享链接 → 元数据」 |
| 可播地址入口 | `src/web/sharePage.ts`：`getShareMedia()` 读 `www.qishui.com/share/<kind>` 分享页的 `_ROUTER_DATA`，返回 `play_url` + 时长/封面/`expires_at` + **KRC 歌词（行级+逐字时间戳）**。见「分享链接 → 可播地址」 |
| 响应叶子类型 | 大部分是 `any`。`entity/*.ts` 是纯类型声明，编译期被完整擦除，产物里根本没有这段源码，拿不到 |

逐端点实测记录（匿名、最小参数、`200+0字节` / `biz_error` / `login_required` 分类）与「这些接口能拿来做什么」
一起整理在 [`docs/APP_ENDPOINTS.md`](docs/APP_ENDPOINTS.md)（90 条，13 个能力分类）；实测台在 `test/`，
`node --experimental-strip-types test/run.ts` 可复现。个别接口偶发 `risk_control`
（`GetFollowingList` 这类社交接口匿名并发会被打 bdturing 标记），属预期。
响应**形状**（字段结构，entity 层 IDL 里没有）逐节实测过，字段名以真实响应为准。

登录态实测结论（2026-10-17，**非会员**账号 `is_vip:false`/`vip_stage:"free"`，汽水音乐 App 扫码）：
① 读接口这轮只测上轮没拿到数据的 **14 条**（已有结论的自动跳过，不重复打接口），结果 **6 条翻盘拿数据** ——
`GetMyInfo`、`GetMyPlaylists`、`GetBlockUserList`（匿名回 `1000004`，**得登录才有**）、`GetUploaderInfo`、
`GetMyPrivacySetting`、`Search2023`；**3 条回了空但结构正常**（`GetMyMixedCollections`/`GetRecentPlayedMedia`/
`GetDigitalAlbums`，是账号里没数据：没收藏/没播放记录/没买数字专辑）；`GetUserInfo` 带会话反而被 captcha 拦
（风控看频率不看登录态）。
② 写接口另起一轮跑（`test/write.ts`）：**29 条全部通过**（4 条是「乍看失败、换参数/换 path 就通」的翻案：
（`UpdatePlaylistInfo` 的 `1000014` 重试即通、`CreateComment` 的 `group_type` 必须 0、`Report`+`GetReportReason`
的 `report_type` 是字符串枚举、`GetOffersTokensForPC` 给真参数就回 token）；账号数据全程回滚，收尾 11 项复查全过。
**唯一没验的只剩 VIP 相关行为**（账号非会员，验不了）。

**写接口不会乱动你的账号**：`test/run.ts` 无会话时只验拦截（写接口一律 `1000016`）；有会话时默认跳过全部 29 个写接口，
只有显式 `ALLOW_WRITE=1` 才发。专门的写接口实测台 `test/write.ts` 每条都成对跑（做 → 回读 → 撤销 → 再回读）：
只碰自己刚造的数据（建单返回的 id、自己刚发的评论），收藏类**先查有没有收藏过**、原本就有就跳过「取消」，
收尾复查歌单数/关注数/黑名单/评论/最近播放/收藏/隐私设置是否都回到原样。

关于播放地址，两条路不是一回事，别再写成「跟入口无关」——那句是未实测的假设，已被推翻：

- **goapi 那条现在照发、由上游裁决**。`GetTrackV2`/`GetMediaPlayer`/`GetVideoV2`/`MGetMediaV2`/`GetTrack`/`GetH5Track`/`GetH5TrackV2`/`GetTrackPlayerInfo` 这一类要音频 URL/单曲直读的接口，官方客户端依赖 native 层
  （`ttnet`/`bdticket`，Windows PE 二进制）产生的设备证明与请求签名；**匿名与带会话实测都拒答**：pc 变体 `200 + 0 字节`，
  非 pc 变体回 `1000062 应用版本有风险，请从应用商店下载正式版本`。本库此前自己抛 `UnsupportedError` 把它们拦下，
  现在**删掉了那道拦截**——上游才是裁判，本库只把「实测拒答」标在 `ENDPOINT_DATA[].gated` 上，请求照发。
  （要在 API 层拿曲目详情，用匿名可用的 `MGetMedia`；但它**不含播放地址**。）
  本库不伪造 native attest（那是绕门禁，不是协议研究）。**会员态是否放行还没验过**（本次账号非会员），别把非会员结论当终局。
- **web 分享页这条路是通的**：`www.qishui.com/share/track` 与 `/share/ugc_video` 匿名返回的 SSR 里就带着
  `audioWithLyricsOption.url` / `videoOptions.url`，实测 `http=206`，全程只 GET 一次网页、不碰 goapi。
  2026-10-15 由项目 owner 决定纳入范围。**这仍然大概率违反平台《服务协议》里「只在我们自己的页面/客户端里播」的授权口径**，
  用途自行评估；批量抓取、镜像曲库、对外提供播放不在支持范围内。

签名地址会过期——实测约 24h（`expires_at` 就是地址路径里那段 16 进制时间），过期后必须重新解析，不要缓存它。

## 安装

```bash
cd packages/qishui-api
pnpm install          # 仓库根执行；pnpm 版本钉在根 package.json 的 packageManager
pnpm run build        # 产出 dist/，零运行时依赖
```

还没发包，作为依赖使用时先 clone + `pnpm run build`，或者 `link:` 到本地路径。
Node ≥ 20（用 `fetch` / `AbortSignal.timeout` / `crypto.randomUUID`）。

接口可用性（哪些端点能匿名用、哪些要登录）、每个接口能拿到什么字段、以及几条典型链路，
都整理在 [`docs/APP_ENDPOINTS.md`](docs/APP_ENDPOINTS.md)；实测台在 `test/`。

## 快速开始

```ts
import { createClient, registerDevice } from 'qishui-api'

// 1) 设备身份：汽水 PC 端用 /service/2/desktop/device_register/ 申请
const device = await registerDevice()
const client = await createClient({ device })

// 2) 匿名可读
const { share_info } = await client.request('GetShareInfo', {
  item_type: 'track',
  item_id: '7673377691022084142',
})
console.log(share_info?.share_link_desc)
// 《时梦（破碎纯享版）》@汽水音乐 https://qishui.douyin.com/s/iXpaVsLF/

const sug = await client.request('Sug', { q: 'lucky', sug_scene: 'search_sug', sug_search_id: '' })

// 3) goapi 的播放地址接口 —— 库照发请求，上游拒答就如实报（匿名实测回 1000062 / 空响应）
//    可播地址走 web 分享页（见下），别把主链路压在这三个接口上
const r = await client.request('GetTrackV2', { track_id: '…', media_type: 1, queue_type: '' }).catch((e) => e)
console.log(r instanceof Error ? `${r.name}: ${r.message}` : r)
```

`client.request(key, req)` 的 `key` 是 `EndpointName` 联合类型，请求/响应类型由 IDL 层推导
（`RequestOf` / `ResponseOf`）。入参按 `DeepPartial` 接受：IDL 里 thrift 声明的 required 字段
官方客户端自己也常省略，服务端说了算，所以不做前置校验。

```ts
import type { EndpointName, RequestOf, ResponseOf } from 'qishui-api'
type K = EndpointName // 'Search' | 'GetShareInfo' | … 320 个（跨模块重名的带模块前缀）
type Q = RequestOf<'GetShareInfo'> // IDL 里的精确字段
type R = ResponseOf<'GetShareInfo'> // 叶子类型多为 any，见「能力边界」
```

## 分享链接 → 元数据（`src/web`）

入口是一条分享链接，不用手抄 track_id。短链只跟一跳读 `Location`，**不解析页面内容**。

```ts
import { createClient, shareLinkToMeta, resolveShareLink } from 'qishui-api'

const client = await createClient({ device })

// 支持 qishui.douyin.com/s/XXXX/ 、music.douyin.com/qishui/share/<kind>?<kind>_id=… 、
// www.qishui.com/share/<kind>?… 、以及裸 ID。kind 已实测：track / album / ugc_video
const meta = await shareLinkToMeta('https://qishui.douyin.com/s/iXpu65or/', client, {
  cover_width: 600,
  related_count: 6,
})
```

实测输出（匿名，无 cookie）：

```
条目      track / 7673377691022084142
标题      《时梦（破碎纯享版）》
歌手文案  Rorik
封面      https://p3-luna.douyinpic.com/img/tos-cn-v-2774c002/…~tplv-b829550vbb-crop-center:600:600.jpg   http=200 image/jpeg
分享文案  《时梦（破碎纯享版）》@汽水音乐 https://qishui.douyin.com/s/iXpu65or/
可播性    status=0 仅VIP可播=true VIP音质=lossless
相关曲目  6 条（每条带 track_id / 曲名 / 时长ms / 专辑 / 歌手 / 封面）
```

组装方式：`GetShareInfo`（标题、歌手文案、封面、各平台分享文案与链接）+ `MCheckMedia`（可播性与 VIP 权益标记，
`media_list: [{ id, type: 'track' }]`）+ `GetRelatedMedia`（相关曲目的完整对象）。
封面拼串逐字复刻官方 `utils/image.ts`：`urls[0] + uri + '~' + template_prefix + '-crop-center:W:H.jpg'`，
`getImageUrl()` 也导出，可直接用于歌手头像 / 专辑封面。

**按 id 批量取曲目详情用 `MGetMedia`**（匿名可用，2026-10 补测）：

```ts
const res = await client.request('MGetMedia', {
  scene: 'playlist',                                  // '' / 'playlist' / 'music_mate_queue' 都行
  media: ids.map((id) => ({ id, type: 'track' })),
})
const tracks = (res.media ?? []).map((m) => m.entity.track_wrapper.track)  // 完整曲目实体
```

它回的是完整 track（album/artists/label_info/url_cover/duration），**但不含播放地址**；
`media[]` 里**只有 `type: 'track'` 有实体**（album/playlist/video/ugc_video 一律 0 条）。
「播放前查权益」用 `MCheckMedia`（`media_list`）或 `MCheckTrack`（`track_ids`，粒度更细）。

**拿不到的**：歌词在 goapi 侧**没有独立接口**（`GetTrackV2Response` 里带 `lyric: track.TrackLyrics`，与音频同响应、同闸门，
全 320 端点的 path/name 无 `lyric`/`lrc`）；但 web 分享页的 SSR 里带着 KRC 结构化歌词，`getShareMedia()` 已能取出
（见「分享链接 → 可播地址」）。`ShareMeta` 是显式字段白名单，原始响应里的其他字段不会透传出来。

**ugc_video（短视频分享）** 也走同一套：`/qishui/share/ugc_video?ugc_video_id=…` → 标题、分享文案、封面。
它没有歌手文案与相关曲目，`MCheckMedia` 会回 `1000004`（所以只对 track 查可播性）；封面形态也不同——
它直接给带 `x-expires`/`x-signature` 的完整签名 URL（会过期，别缓存），而 track 是 `uri + 模板` 拼串。

## 分享链接 → 可播地址（`src/web/sharePage.ts`）

```ts
import { getShareMedia } from 'qishui-api'

const media = await getShareMedia('https://qishui.douyin.com/s/iXpmR4xD/')
// { kind: 'track', id: '7694169592973822006',
//   play_url: 'https://v5-se-…-luna.douyinvod.com/<签名>/<16进制过期时刻>/…?mime_type=audio_mp4',
//   mime_type: 'audio_mp4', duration_ms: 106818,
//   title: '万籁停吹奏(知颐听秋水问蜉蝣版)', artist: '雨过天晴',
//   cover_url: 'https://p3-luna.douyinpic.com/img/…', vid: 'v02ad6g10000db3ive7og65og8oj6lug',
//   expires_at: 1792367511,
//   lyrics: { lyric_type: 'krc', sentences: [ { text: '作曲：雨过天晴', start_ms: 0, … }, … ] } }
```

入口和元数据共用 `resolveShareLink`，所以短链、完整链接、裸 ID、`{ kind, id }` 对象都能直接传。
它**不发 goapi 请求**：只 GET 一次 `www.qishui.com/share/<kind>?<kind>_id=…&auto_play_bgm=1`，
再从页内 `_ROUTER_DATA` 的 `loaderData.track_page.audioWithLyricsOption`（track）
或 `loaderData.ugc_video_page.videoOptions`（ugc_video）取值。`_ROUTER_DATA` 是一段嵌在 `<script>` 里的 JSON，
值里有 `}`、`<` 和转义引号，所以用括号配平截取而不是正则尾巴。

**KRC 歌词**（track 独有，`audioWithLyricsOption.lyrics`）：`lyric_type: 'krc'`，`sentences` 每行带行级
`start_ms`/`end_ms` + 逐字 `words[]`（每个字各自的 `start_ms`/`end_ms`），正适合播放器滚动与卡拉 OK 逐字高亮。
署名行（作曲/作词/贡献者）标 `type: 'lrc'` 且整句一个词；正文行无 `type`、逐字时间戳。末行 `endMs` 固定是
`Number.MAX_SAFE_INTEGER` 哨兵（表示持续到曲终），已归一化为 `undefined`。无歌词的曲 `lyrics` 直接缺省。

**ugc_video 独有字段**：`width`/`height`（分辨率）、`first_frame_url`（首帧图）、`artist_avatar_url`（作者头像）。
ugc_video 页没有 `lyrics` 字段，短视频无歌词。

实测（匿名、无 cookie）：

| 形态 | 结果 |
|---|---|
| track 短链 | `audio_mp4`，`http=206 content-range: bytes 0-1023/1729552`，约 126 kbps |
| ugc_video 短链 ×2 | `video_mp4`，`http=206`，32,098,127B / 14,754,501B |
| 地址有效期 | `expires_at` 距解析时刻约 24h，到期即 403，需重新解析 |
| KRC 歌词 | `lyricType: 'krc'`，19~47 行，行级 + 逐字时间戳；无歌词的曲缺省 |

`other` 形态（album / playlist / user / radio…）页面里没有流地址，直接抛 `QishuiError` 说明当前 kind。

## 登录态写链路

实测跑通过这条链：`GetMyInfo` → `CreatePlaylist`（`type=2` 私有单）→ `MAppendPlaylistMedia`
（`media: [{ id, type: 'track' }]`，`count_tracks` 从 0→1）→ `GetPlaylistDetail` 回读 → `getShareMedia` 取地址
→ 下载 1,729,552B `m4a` → `MDeletePlaylists` 删掉本次建的临时单，并用 `GetMyPlaylists` 回读确认它真的没了。

字段实测（IDL 里 `entity/playlist.ts` 被类型擦除，只能靠响应钉）：`Playlist` 的标题是 **`title`**（不是 `name`），
计数是 **`count_tracks`**，`type=2` 是自建单；`MDeletePlaylists` 的响应**没有 `status_code`**，成功标志是
`deleted_playlists` 里带上该 id。加歌用 `MAppendPlaylistMedia`（`/luna/pc/me/playlist/media/append`，
`media: [{ id, type: 'track' }]`）；`MAppendPlaylistTracks` 的 path 是 `/luna/me/...`（没有 `pc`），
和 `GetMyFavoriteVideoList` 一样属于 IDL path 与线上不一致的那类，未验证。

### 只有短链才需要那一跳

`parseShareLink` 是纯字符串解析。完整链接、裸 ID、以及已知的 `{ kind, id }` 对象，**网络次数都是 0**；
只有 `/s/<code>` 短链需要跟一次重定向，而且只读 3xx 的 `Location` 头，不请求页面内容。

```ts
await shareLinkToMeta({ kind: 'ugc_video', id: '7452683763189878070' }, client) // 已知 ID，直连
```

而且 ID 本来就不必来自分享链接——下列接口匿名返回的实体里就带着 ID，正常用法是列表→ID→详情，
分享链接只是人类输入的入口（实测条目数）：

| 接口 | 匿名拿到的 ID |
|---|---|
| `DiscoverView` | 159 个 resources，含 174 个 track / artist / album id |
| `FeedSongTab` | 5 首曲目 + 各自 album / artists |
| `GetRelatedMedia` | 6 首相关曲目 + 各自 album / artists |
| `FeedPlaylistSquare` | 18 个歌单 + owner |
| `Sug` | 10 条联想，含 track / artist / playlist 实体 |
| `ListArtistTracks` | 50 首（一个歌手名下全部，默认页） |

`ugc_video` 的匿名批量来源我没验出来（能确认的入口还是分享链接本身），有已知列表接口带 video 实体的话告诉我，我按同样方式补。

## 扫码登录

```ts
const qr = await client.qrLogin()
// qr.scanUrl 就是要用「汽水音乐」App 扫的那段内容；渲染（二维码图片）由调用方自己来
const status = await qr.wait()            // 'confirmed' | 'expired'
if (status === 'confirmed') {
  const my = await client.request('GetMyInfo', {})
  const mine = await client.request('GetMyPlaylists', { cursor: 0, count: 20 })
  await client.request('CollectTracks', { track_ids: ['…'] })   // 写操作
}
```

`qr.wait()` 会轮询 `check_qrconnect`，登录成功后的 cookie 建议存到 `qishui-session.json` 这类本地文件
（`.gitignore` 已排除），下次用 `createClient({ cookies })` 直接带回来。

设备身份和会话都可以持久化后回传，避免每次都注册新设备：

```ts
const client = await createClient({ device: savedDevice, cookies: savedCookies })
```

## 整链路实测（扫码 → 收藏 → 元数据 → 封面落盘）

这条链路整条实测跑通过：11 次 goapi 调用全部 `http=200` 且带平台 logid。

阶段：设备/会话 → `GetMyInfo`（身份与 `vip_stage`）→ 收藏盘点 → 逐首 `getShareMeta` + 封面落盘（sha256）→ 刻意未取
（边界）→ 调用清单 → 结论。

其中最有价值的一条是收藏盘点的实测结论（详见 `docs/MAINTENANCE.md` §3）：**喜欢的歌不在 `GetMyMixedCollections`**，
那个端点只装「收藏的歌单/专辑」；喜欢/收藏的曲目在自己的歌单里——`GetMyPlaylists` 拿到「我喜欢的音乐」`type=1`、
「抖音收藏的音乐」`type=4`，再用 `GetPlaylistDetail` 取 `media_resources[].entity.track_wrapper.track`（完整 track 结构）。
`my_stats.count_all_liked` 是「收到的点赞」，别拿它当收藏数。

## 错误模型

全部继承 `QishuiError`：

- `TransportError` — 连接失败、超时、非 2xx，以及**空响应体**（网关未放行时就是 `200 + 0 字节`，这个信号会如实报出来）
- `ApiError` — 业务 `status_code` 非 0，带 `statusCode` / `statusInfo` / `endpoint`
- `AuthRequiredError` — `status_code=1000016`，需要登录
- `RiskControlError` — 响应带 `bdturing-verify` 或 `x-tt-verify-passport-decision`。官方客户端在这里弹验证码窗口，
  纯 HTTP 客户端没有 UI，只能上抛（挑战串在 `err.challenge` 里，需要人工完成）
- `UnsupportedError` —— **已删除**。它原本用来拦 goapi 播放地址接口，但那是本库自己的判断，不是上游的答案；
  现在请求照发、上游怎么答就怎么答（可播地址走 web 分享页 `getShareMedia`，见「分享链接 → 可播地址」）

## 快照与选路

`src/idl/**`、`src/endpoints.ts`、`docs/endpoints.md` 是**从官方分发包 sourcemap 整理出的产物，勿手改**：
`src/endpoints.ts` 是端点表 + 类型映射，`src/idl/**` 里 74 个被编译期擦除的 entity 模块以 `export type X = any`
的 stub 占位。请求侧字段/位置/可选性是精确的，响应叶子类型只能是 `any`。

选路逻辑复刻官方 `apiCaller`：优先 `/luna/pc/` 且方法匹配注册表的变体。
公共参数逐字对齐 `RequestService.getTTCommonParams()`（注意 `version_code` 就是版本字符串，不是整数）。

## 维护与更新

**接口哪天出错，看 [`docs/MAINTENANCE.md`](docs/MAINTENANCE.md)** —— 里面有：当前快照的出处（官方分发包哈希、
解包链、哪些 bundle 贡献了 IDL）、对上游改动最敏感的几处代码、「症状 → 归因 → 动作」对照表、
以及明确修不了的边界。

一句话版本：这个库零运行时依赖，工具链升级不会让它坏；真正的风险是上游网关单方面改版，而且失效是**静默的**
（`200 + 0 字节`）。判断基线有没有变，跑一遍 `test/run.ts`，再和 `docs/APP_ENDPOINTS.md` 的实测表对照。

## 合规提示

本库仅供学习研究，请遵守汽水音乐的服务条款。它不拥有曲库内容，也不授权你把音频或其衍生物二次分发。
研究、学习、自测用途请自行评估；任何批量抓取、镜像曲库、对外提供播放的行为都不在本项目支持范围内。
