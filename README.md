# qishui-api

汽水音乐（SodaMusic）接口整理仓库，pnpm workspace 结构：下层是协议客户端，上层是应用后端。

| 包 | 路径 | 说明 |
|---|---|---|
| [`qishui-api`](packages/qishui-api/README.md) | `packages/qishui-api` | **协议层**：PC 端接口 TypeScript 客户端（320 端点 IDL + 纯 HTTP 请求层 + web 分享页解析） |
| [`qishui-core`](packages/qishui-core/README.md) | `packages/qishui-core` | **应用后端层**：OO 封装账号/曲库/歌单/发现/搜索/评论/社交 + 播放器状态机 + 本地数据与媒体缓存（数据目录 `~/.qishui`） |
| [`qishui-cli`](packages/qishui-cli/README.md) | `packages/qishui-cli` | **命令行播放器**：把 core 摆成命令（搜索/发现/歌单/评论/下载/缓存维护），出声交给 mpv 子进程；每条命令都支持 `--json` |

```ts
import { createQishui } from 'qishui-core'

const qishui = await createQishui()
const home = await qishui.discover.home()
await home.tracks[0].play()          // 解析可播地址 → 落盘缓存 → 起进度时钟
```

```bash
qishui play 晴天                     # 命令行：搜索词直接开播（需要 mpv）
qishui search 晴天 --json | jq '.groups[].tracks[].name'
```

## 使用

```bash
pnpm install                # 根目录执行
pnpm run build              # 递归构建（tsc --strict）
pnpm run typecheck          # 全仓库类型检查（根 tsconfig）
pnpm run check              # Biome 静态检查 + 格式化校验（单工具，不走 ESLint/Prettier）
pnpm run check:catalog      # 端点参数与 IDL 的一致性核对（纯 node 脚本）

pnpm run cli <args>         # 跑 CLI（pnpm 12 不加 `--`，直接跟在 cli 后）
pnpm run cli search 晴天 --json

pnpm test                            # core/cli 单测（vitest，全程离线：mock 上游 / 独立数据目录）
pnpm --filter qishui-cli run test    # 只跑 CLI（含真 mpv 会话，--ao=null 不出声）
```

pnpm 版本钉在本文件同目录的 `package.json` `packageManager` 字段，Node ≥ 20（`node --experimental-strip-types` 跑 `.ts` 测试脚本）。质量检测只用 **Biome** 一个工具（`check` / `check:fix` / `format`），不引入 ESLint + Prettier。

完整文档与变更记录在包目录内，见 [`qishui-api`](packages/qishui-api/README.md) / [`qishui-core`](packages/qishui-core/README.md) /
[`qishui-cli`](packages/qishui-cli/README.md)，
以及三者的 `CHANGELOG.md`。接口可达性与「能不能拿来做什么」的实测清单在
[`packages/qishui-api/docs/APP_ENDPOINTS.md`](packages/qishui-api/docs/APP_ENDPOINTS.md)（90 条，13 个能力分类）。
