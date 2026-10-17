# 维护与更新手册

这份文档回答一个问题：**某天接口开始出错，从哪里查起、怎么修、什么修不了。**

先给结论：

> 这个库不是「依赖」，是一个**协议适配器**。
> Node/pnpm/TS 升级不会让它坏；上游网关改版会让它局部失效，而且失效方式是**静默的**
> （`200 + 0 字节`，不报错、不返回数据）。

---

## 1. 当前快照的出处（provenance）

未来出问题先确认自己站在哪个快照上。

| 项 | 值 |
|---|---|
| 客户端 | 汽水音乐 PC `v3.7.0`，win32_x64 官方分发包 |
| 分发包 | `SodaMusic-v3.7.0-official-win32_x64.exe`（150,602,608 字节） |
| SHA-256 | `e58578aec410e2c9c24835e92a1dc74d0fda982be1cf1003034538255baab0e4` |
| 解包链 | NSIS → `app.7z` → `extract/app/resources/*.asar` → `@electron/asar extract` → `extract/asar_out` |
| 源码来源 | asar 内 vite 产物的 `*.js.map` 里保留的 `sourcesContent`（原始 TypeScript） |
| 贡献 IDL 的 bundle | `asar_out/main.js.map`(64) · `main_asar/assets/main-*.js.map`(11) · `desktopLyrics`(3) · `taskbarWidget`(2)，去重后 69 个文件 |
| 网关 | `https://api.qishui.com`，无公开版本、无兼容承诺 |
| 公共参数 | 逐字复刻 `services/request/request.ts:getTTCommonParams()`；`version_name` 与 `version_code` **都是版本字符串 `3.7.0`**，不是整数 |
| 端点表 | 320 个端点 / 74 个官方在用 / 3 个刻意不实现 |
| 可达性实测 | `docs/APP_ENDPOINTS.md`（2026-10-17，三轮）。① 匿名 82 条：`ok_json=32 · login_required=38`（含 29 个写接口）`· ok_thin=4 · client_rejected=3 · biz_error=3 · error=1 · risk_control=1`；② 带会话（非会员账号）复测上轮未结论的 14 条：**6 条翻盘**、3 条回空、2 条 `biz_error`（后被写接口轮翻案）、2 条 `error`、1 条风控；③ 写接口轮 29 条（`test/write.ts`，全部可回滚）：**29 条全部 `status_code=0`**（4 条换参数/换 path 翻案），唯一仍不通的是非写接口 `QueryTokenStatus`（上游 v1 GET 路由 500）；收尾安全复查 11/11 |

**拿不到的部分**：`idl/*/entity/*.ts` 是纯类型声明（`interface`），编译期被完全擦除，`sourcesContent`
里根本没有它们——74 个模块在产物中不存在，`src/idl/**` 里对应位置只能是 `export type X = any` 的 stub。
所以响应叶子类型是 `any`，这不是 bug，是原始信息就不存在。请求侧字段/位置/可选性是精确的。

---

## 2. 两种「坏了」，处理方式完全不同

### A. 我这侧：工具链升级 → 基本不用担心

零运行时依赖。库本体只用 Node 内置能力：`fetch`、`AbortSignal.timeout`、`URL`、`crypto.randomUUID`、
`node:crypto` 的 MD5。全部在 Node 20 就稳定，升到 22/24/26 无行为变化。根 `package.json` 的 `packageManager`
钉了 pnpm 版本、`pnpm-lock.yaml` 入库，所以 install→build 可复现。

升级工具链后只需 `pnpm run build`，绿了就完事。

### B. 上游侧：真正需要一套流程的原因

按发生概率从高到低：

1. **网关静默丢弃** —— 以前 `ok_json` 的端点变成 `200 + 0 字节`。表现为 `TransportError: 返回空响应体`。
   诱因通常是 `version_code` / UA / `device_platform` 被纳入灰度校验，或该接口对无 native 签名的客户端关闭。
2. **字段/路径变更** —— 新版把 `paths` 换掉、请求字段改名或新增必填。表现为 `biz_error code=1000004`（参数错误）或 404。
3. **`status_code` 语义新增** —— 表现为 `ApiError` 带一个 `src/errors.ts:StatusCode` 里没收录的新码。
4. **风控前移** —— 匿名请求开始回 `bdturing-verify` / `x-tt-verify-passport-decision`。表现为 `RiskControlError`。
5. **登录/鉴权收紧** —— 原本匿名可读的接口变 `1000016`。表现为 `AuthRequiredError`。

---

## 3. 已知的脆弱点（对上游改动最敏感的几处）

上游改版时，问题几乎都出在这几处：

| 位置 | 会怎么坏 | 背景与实例 |
|---|---|---|
| `src/transport.ts` 选路 | 请求打到错误 path，返回结构与官方不一致 | 复刻官方 `apiCaller`：优先 `/luna/pc/` 且方法匹配 `idlMethods` 的变体 → 方法匹配 → `paths[0]` |
| `src/transport.ts` 候选回退 | 端点恒 `200+0字节` / 404 | 有的端点 pc 变体是死的（`Search`：`/luna/pc/search/x` 恒空，`/luna/search/x` 正常）。读请求（GET/HEAD）遇空响应或 404/405 会按候选顺序换下一条变体重试一次；写请求不回退（防重复写入） |
| `src/web/image.ts:processTemplate` | 封面/头像返回 `{"code":2004,"error":"fail to handle request"}`（HTTP 400） | 逐字移植自 `utils/image.ts`：`urls[0] + uri + '~' + template_prefix + '-crop-center:W:H.jpg'`。`-424-424.image` 那种写法是错的，实测只有 `-crop-center:600:600.jpg` / `-resize:W:H.webp` 通 |
| `src/web/image.ts:getImageUrl` | 封面 400，或返回一个空串 | track 是 `urls[0] + uri + ~模板`；ugc_video 直接给**带 `x-expires`/`x-signature` 的完整签名 URL**（无 `uri`，走 `urls[0]` 分支）。签名 URL 会过期，不要缓存进数据库 |
| `src/web/share.ts:parseShareLink` | 短链能跳但解析不出 ID，抛「没能从分享链接里解析出条目 ID」 | 没有硬编码映射表，按 `<kind>_id` → 任意 `*_id` → `item_id`/`id` 三级回落，所以上游新增形态（`/share/ugc_video?ugc_video_id=` 就是这么进来的）通常不用改代码。**exact 必须优先**：`/share/track` 的链接上常挂 `comment_id`/`user_id` 等旁支 ID，规则顺序错了就会解出错误的条目 |
| 「收藏在哪」这件事 | 以为用户没收藏，实际取错了端点 | **实测**：喜欢/收藏的歌曲**不在** `GetMyMixedCollections`（那个只装「收藏的歌单/专辑」，普通账号 0 条，响应里只有 `status_info`），而在自建歌单：`GetMyPlaylists` → 「我喜欢的音乐」`type=1` / 「抖音收藏的音乐」`type=4` → `GetPlaylistDetail` → 曲目在 **`media_resources[].entity.track_wrapper.track`**（不是 `tracks`，`tracks` 只有别人分享的歌单才有）。另：`my_stats.count_all_liked` 是**收到的点赞**（同 `all_comments_liked_detail.popup`="还没收到点赞"），拿它当收藏数会得出「你一首都没收藏」的错误结论 |

---

## 4. 症状 → 归因 → 动作

| 症状 | 最可能的原因 | 先做什么 |
|---|---|---|
| `TransportError: 返回空响应体（http=200）` | 网关静默丢弃（native 签名/版本校验） | 用最小请求手工复查（`client.request` 同一端点），再和 `docs/APP_ENDPOINTS.md` 的实测清单对照；这类**客户端修不了** |
| `AuthRequiredError` 但 cookie 明明有效 | session 过期，或 `1000016` 被复用成别的含义 | `client.isLoggedIn()`；重扫；看新版 `renderer/errors.ts` 里该码的文案 |
| `RiskControlError` | 并发/匿名被打标 | 降并发、隔开一段时间重试，带登录态手工过验证 |
| `ApiError code=1000004` | 参数缺失/类型不对 | 看 `docs/endpoints.md` 对应端点的字段表，再对新版 contract 源码 |
| `QishuiError: IDL 中找不到端点 X` | `data.name` 与表不匹配，或重名端点要用带模块前缀的 key | 用 `ENDPOINT_DATA` 里的 `key`；跨模块重名走 `goapi_X` 这种前缀名 |
| 登录后仍有一批 `biz_error code=1000004` | 样本参数是占位值/枚举不合法（商业化、评论枚举这类尤其） | 不是不可达；要单独验就自己配真参数手工跑 |
| `ApiError code=1000062`（「应用版本有风险，请从应用商店下载正式版本」） | 上游对非官方客户端做完整性校验后拒答（实测见于播放地址类接口） | 不是参数问题，换参数/cookie/path 都不会变（**匿名与带会话实测都被拒**）。`ENDPOINT_DATA[].gated` 标了这类端点；**会员态是否放行尚未验证**，别把结论当终局，见 §5 |
| TS 类型大面积变红 | `src/idl/**` 是生成物，被手改了 | 这些文件是从官方分发包 sourcemap 整理出来的产物，手改过很难还原，改动前先留一份 |
| 封面/头像 URL 回 400 `{"code":2004}` | 官方 CDN 模板串变了 | 对照新版 `utils/image.ts` 改 `src/web/image.ts`，见 §3 |
| 请求字段在但值丢了 | POST 时 body 已有字段不再进 query（官方同款行为） | 这是 `apiCaller` 的规则，不是 bug |

---

## 5. 修不了的边界（别在这上面耗时间）

- **goapi 播放地址**：`GetTrackV2` / `GetMediaPlayer` / `GetVideoV2` 依赖 native 层（`@luna/ttnet` Cronet + `bdticket`
  设备证明，仅 Windows PE）产生的签名。**匿名与带会话实测都拒答**：pc 变体一律 `200 + 0 字节`，非 pc 变体回
  `status_code=1000062 应用版本有风险，请从应用商店下载正式版本`。本库的做法是**照常发请求、遵从上游**：
  上游怎么答就怎么答（早先自己抛 `UnsupportedError` 拦截请求已被删除——本库不代上游下结论），
  只在 `ENDPOINT_DATA[].gated` 上打标记。本库**不伪造 native attest**（那是绕门禁，不是协议研究）。
  注意这条结论**不含会员态**：本次账号非会员，会员是否放行还没验过，别当终局。
- **可播地址只有 web 这一个入口**：`src/web/sharePage.ts` 读 `www.qishui.com/share/<kind>` 分享页的 SSR，
  实测匿名可取 `audio_mp4` / `video_mp4`。这里此前写的「换入口也一样——不做」**是未实测的断言，已被推翻**：
  被 gate 住的是 goapi 那三个接口的 native 设备证明，不是媒体本身。范围调整由 owner 于 2026-10-15 决定；
  平台对音频的授权口径没变（「在我们自己的页面/客户端里播」），所以**合规风险照旧由使用者承担**，
  批量抓取、镜像曲库、对外提供播放不在支持范围内。
- **SSR payload 是脆契约，没有 IDL 依据**：`_ROUTER_DATA` 里 `loaderData.track_page.audioWithLyricsOption`
  与 `loaderData.ugc_video_page.videoOptions` 的字段名只能靠实测钉住，上游改版即失效。
  维护时：① 别缓存 `play_url`，它是带签名的，`expires_at`（地址路径第二段 16 进制）约 24h 即 403；
  ② 页面若开始要签名/风控，`getShareMedia` 只会抛 `QishuiError`——**不要去补前端签名逻辑**，那等于把上一条边界拆了；
  ③ `src/web/share.ts` 的 `ShareMeta` 仍是显式字段白名单，原始响应不透传，别图省事写成 `return {...raw}`。
  页面里 `og:image` 是通用 favicon，封面只能从接口的 `URLInfo` 拼（§3）。
- **`Search`**：**可用，但要挑对 path 与参数**（2026-10-17 复测纠正）：真正在跑的是 `/luna/search/<type>`（非 pc 变体），
  `/luna/pc/search/<type>` 恒 `200 + 0 字节`；且**不能带 `debug_params`**（传 `{}` / `'null'` 都回 `1000004`，不发就正常）。
  `transport` 已加候选 path 回退（读请求遇空响应/404 自动换下一条变体）。`Search2023`（`/luna/h5/search/`）匿名回
  `login_required`，**带会话可用**（结果在 `result_groups[].data`，与 `Search` 的 `items` 不同名）。
- **`FlowSearch`**：404，`/luna/flow/search/<type>` 这条 path 线上不存在（不是参数问题）。
- **响应叶子类型**：`entity` 源码不存在，拿不到，只能 `any`。
- 这些闸门的经验规律是**只会变窄、不会变宽**。别指望下次更新就能拿到音频。

---

## 6. 健康检查节奏

- 手动：每季度或有异常反馈时跑一遍 `node --experimental-strip-types test/run.ts`（依次过一遍音乐 App 用得到的端点），
  和 `docs/APP_ENDPOINTS.md` 的实测表对照：某条从 `ok_json` 变成 `login_required` / `empty_body` 就是上游动了的信号。
- 怀疑登录/收藏链路坏了：先用 `test/login.ts` 落一个会话再重跑同一份清单。
- 手工验接口默认**匿名、只读、最小参数**；要动写接口就说明用途后单独跑 `test/write.ts`（29 条写端点，
  每条「做 → 回读验证 → 撤销」，收尾安全复查账号是否回到原样），别拿真实账号临时批量试。
- 判定「不通」之前先换变量重试：参数字段/类型（`report_type` 是字符串枚举、`block_items` 是对象数组、
  `media` 与 `media_list` 各用各的）、path 变体（非 pc / pc）、登录态、请求频率 —— `test/probe-writes.ts` 是这套流程的样板
  （`Report` 从「HTTP 500 判死」翻成「举报成功」就是这么来的）。上游 500 也别急着写「不可用」，先怀疑参数。
- 拿不到就写「匿名拿不到 / 未验证」，别写「不可用」——**会员态**是本次仍未试过的变量
  （播放地址、商业化、我的音乐那几类）；要验会员态得换个会员账号带会话重跑。
- 真登录态的复测请手动跑，并且**永远不要把 `qishui-session.json` 提交进仓库**（`.gitignore` 已排除）。
