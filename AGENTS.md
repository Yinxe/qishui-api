# AGENTS.md — qishui-api 工作约定

## 目录

| 包 | 状态 |
|---|---|
| `packages/qishui-api` | 协议接口层（320 端点 IDL + 请求层 + web 分享页），已成形 |
| `packages/qishui-core` | 应用后端层（OO 服务/实体 + 播放器状态机 + 本地数据与媒体缓存），依赖 api 的 `dist` |
| `packages/qishui-cli` | 命令行播放器（commander 子命令 + mpv 子进程出声 + 终端播放会话），依赖 core；每条命令都可 `--json` |

## 约定

- **不替上游下结论**：接口拿不到就是「未验证 / 这个条目不可播」，不写「不可用」；不恢复 `UnsupportedError` 这类自造拦截。
- **匿名结论不是终局**：登录/会员是没试过的变量，文档里区分「匿名拿不到」与「未验证」。
- **写接口安全**：无会话只验拦截；有会话默认跳过，`ALLOW_WRITE=1` 才发；已实测的写接口必须可回滚。
- **实测过的接口不重复发**（防风控）：`packages/qishui-api/test/run.ts` 自动 SKIP 已有结论的条目，`FORCE=1` 才重测。
- 实测台是纯 node 脚本（`node --experimental-strip-types`），不引入 vitest；core/cli 的冒烟在各自 `test/smoke.ts`（跑构建产物，用独立数据目录）。
- 质量检测只用 **Biome** 单工具：`pnpm run check`（检查）/ `check:fix`（写回）/ `format`（只格式化），不引入 ESLint + Prettier；类型检查走根 `tsconfig.json`（`pnpm run typecheck`），全仓库一处口径。
- **缓存分档唯一真相**：`packages/qishui-core/src/cache/policy.ts`——两个正交维度都在这一个文件：TTL 档 `CacheTtl`（`none`/`entity`/`chart`/`config`/`staticEnum`/`account`）与账号隔离档 `CacheScope`/`KIND_SCOPE`（`account`/`viewer` 落 `cache/entities/_acct/<uid>/`，`public` 共享；媒体缓存始终跨号共享）。原则是「只有长时间不变的数据才落盘」——实时数据（搜索/推荐流/首页/最近播放）`ttlMs: 0`（`EntityCache.set` 见 0 跳过写盘）；改档只动这个文件，各服务引用档位不写死秒数；`qishui cache policy` 打同一张表（含「账号隔离」表）。
- CLI 硬规矩（续）：**人读输出默认带 id**（`--no-id` / `--id false` 关）；`type:id` 这种复合写法只用于 `qishui play` 目标，`chart`/`radio`/`playlist` 取详情只要冒号后面的裸 id——列表头写清 `type:id`，别让人误当 id 本身。
- CLI 的一条硬规矩：**一份数据两条出路**——默认渲染给人看，`--json` 出同一份数据的结构化形态（`--raw` 才带上游原始响应）；命令里用 `output.emit(render, data)` 收口，别各写一套。
- **多账号**：设备身份与账号解耦（`~/.qishui/device.json` 全体共用一台，换号不触发新注册）；每号一份 `~/.qishui/accounts/<uid>.json`（cookie，0600）。激活号以 `config.activeUid` 为准，切号 `qishui use`、单命令临时换号 `--as`；账号私有/带我态数据按 uid 隔离（见上条 `_acct/<uid>`）。`packages/qishui-api/qishui-{device,session}.json` 与 `~/.qishui/accounts/` 下同口径：已 gitignore，勿提交、勿外传。
- CLI 跑法：`pnpm run cli <args>`（pnpm 12 会把 `--` 原样传给脚本，**别加**）。
- 远端保持本地：**不 push**。
- 文档分工：`docs/APP_ENDPOINTS.md` 记端点实测结论；各包 `README.md` 记用法；各包 `CHANGELOG.md` 记变更。
