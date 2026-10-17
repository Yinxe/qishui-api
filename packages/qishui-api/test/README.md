# test/ —— 音乐 App 接口清单与实测器

不是单元测试，是「**依次把接口发一遍、看回什么**」的实测台。先 `pnpm run build`（脚本 import 的是 `dist/`）。

| 文件 | 作用 |
|---|---|
| `catalog.ts` | 接口清单：分类 + 端点 key + `capability`（能拿到什么）+ 测试用最小参数。**文档 `docs/APP_ENDPOINTS.md` 就照它写**；`auth` 三档 `anon`/`login`/`gated`（`gated` 只是标记，库照发请求）。当前 **90 条**（2026-10 补了 `MGetMedia`/`MCheckTrack` 等 8 条媒体类） |
| `run.ts` | 依次实测整份清单：先采真实样本 id（曲目/专辑/艺人/歌单/用户/评论/电台/榜单），再逐条发请求，分类打印 + 落 JSON。**已有结论的接口自动 SKIP**（`ok_json`/`ok_thin`/`client_rejected`/`empty_body`），并复用上一轮样本 id，避免重复请求被风控；`FORCE=1` 强制全量重测 |
| `raw.ts` | 手写 HTTP 直打（不走库 transport），给 `run.ts` / `probe-variants.ts` / `sweep-all.ts` 共用：逐 path 变体试探 + 按响应归类 |
| `login.ts` | 扫码登录（**汽水音乐 App**，非抖音）：`--start` 出二维码并存中间态，`--poll` 轮询直到 confirmed，会话落 `qishui-session.json` |
| `sweep-all.ts` | 全量扫 320 个端点（启发式参数），找精选清单之外还有哪些匿名可用 |
| `probe-variants.ts` | 变体试探：某端点回空/404 时，把它的每条 path 变体（pc / 非 pc、GET / POST）都打一遍；可带 `k=v` 覆盖参数 |
| `probe-search.ts` | `Search` 系的手工参数矩阵（定位「不带 `debug_params` + 非 pc 变体」这个组合） |
| `probe-feedmode.ts` | `FeedMode` 偏好/场景 + `FeedSongTab` 的 `preference_mode` + `FeedRadioTracks` 的 `radio_id`（短数字 `scene_mode_id` vs 雪花 `inner_block_id`）实测 |
| `check-catalog.ts` | **参数回归闸门**（`pnpm run check:catalog`）：把 `catalog.ts` 每条端点的参数与 IDL 声明逐字核对（必填/位置/类型），当前 90 条 0 问题 |
| `dump.ts` | 抓一批匿名接口的**完整响应**到 `/tmp/opencode/samples/*.json`，写文档/核对字段名用 |
| `dump-details.ts` | 同上，补详情类（专辑/艺人/用户/权益/统计/Launch） |
| `dump-login.ts` | 抓**登录态才拿到数据**那批的完整响应（`login-*.json`），文档字段靠它；跑一次就够 |
| `write.ts` | **写接口实测**：29 个写端点逐条「做 → 回读验证 → 撤销 → 再回读」，收尾做 11 项安全复查；结果并入 `endpoint-report.json`，明细落 `/tmp/opencode/write-report.json` |
| `probe-writes.ts` | 写接口「判死翻案」探针：`UpdatePlaylistInfo`/`CreateComment`/`Report`/`AppendRecentlyPlayedMedia` 改参数、换 path 再试（`Report` 就是这么从 HTTP 500 翻成举报成功的），临时歌单/评论收尾删净 |

```bash
node --experimental-strip-types test/run.ts                     # 全量/增量实测（1.2s/请求；已结论的自动跳过）
FORCE=1 node --experimental-strip-types test/run.ts             # 无视上一轮结论，全量重测
ALLOW_WRITE=1 node --experimental-strip-types test/run.ts       # 连写接口一起跑（会动账号数据，慎用）
node --experimental-strip-types test/write.ts                    # 写接口实测（29 条，可回滚 + 收尾安全复查）
node --experimental-strip-types test/probe-writes.ts             # 写接口换参数/换 path 再试（判死翻案）
node --experimental-strip-types test/login.ts --start           # 出二维码（汽水音乐 App 扫）
node --experimental-strip-types test/login.ts --poll            # 等扫码完成、落会话
node --experimental-strip-types test/probe-variants.ts Search   # 试某个端点的所有 path 变体
pnpm run check:catalog                                        # catalog 参数 vs IDL 一致性核对（0 问题才是干净）
node --experimental-strip-types test/sweep-all.ts               # 320 端点全量扫
node --experimental-strip-types test/dump.ts                    # 抓样本响应
```

规矩：默认匿名、只读、最小参数、相邻请求 ≥1.2s 串行，**已经测出数据的不重复打**；写接口只在明确要动账号数据时才跑
（`write.ts`），只碰自己刚造的数据、收藏类先查再决定要不要取消，收尾回读确认账号回到原样。
结果明细落在 `/tmp/opencode/endpoint-report.json`。

> 上层 [`qishui-core`](../../qishui-core) / [`qishui-cli`](../../qishui-cli) 的单测在各自 `test/*.test.ts`（**vitest，全程离线**：core 注入 mock fetch，cli 起 `dist/cli.js` + 预置假设备/缓存）——**上游可达性只由本实测台负责**。

**记录口径**：`UnsupportedError` 那类「本库自己抛的异常」不算接口结论 —— 接口能不能用只看真实响应
（上游拒答就写清 `1000062`/空响应，并标注口径：**匿名/登录/会员三档里哪些试过、哪些没试**）。
判「不通」之前先换变量重试：字段名与类型、path 变体、登录态、请求频率；上游 500 也先怀疑参数。
