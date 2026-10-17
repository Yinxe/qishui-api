# Changelog

本包（`qishui-core`）的变更记录，最新在上。

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
