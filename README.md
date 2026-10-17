# qishui-api

汽水音乐（SodaMusic）接口整理仓库，pnpm workspace 结构：下层是协议客户端，上层是应用后端。

| 包 | 路径 | 说明 |
|---|---|---|
| [`qishui-api`](packages/qishui-api/README.md) | `packages/qishui-api` | **协议层**：PC 端接口 TypeScript 客户端（320 端点 IDL + 纯 HTTP 请求层 + web 分享页解析） |
| [`qishui-core`](packages/qishui-core/README.md) | `packages/qishui-core` | **应用后端层**：OO 封装账号/曲库/歌单/发现/搜索/评论/社交 + 播放器状态机 + 本地数据与媒体缓存（数据目录 `~/.qishui`） |

```ts
import { createQishui } from 'qishui-core'

const qishui = await createQishui()
const home = await qishui.discover.home()
await home.tracks[0].play()          // 解析可播地址 → 落盘缓存 → 起进度时钟
```

## 使用

```bash
pnpm install                # 根目录执行
pnpm run build              # 递归构建（tsc --strict）
pnpm --filter qishui-core run test   # 端到端冒烟（真打上游，用独立数据目录）
```

pnpm 版本钉在本文件同目录的 `package.json` `packageManager` 字段，Node ≥ 20（`node --experimental-strip-types` 跑 `.ts` 测试脚本）。

完整文档与变更记录在包目录内，见 [`qishui-api`](packages/qishui-api/README.md) / [`qishui-core`](packages/qishui-core/README.md)，
以及两者的 `CHANGELOG.md`。接口可达性与「能不能拿来做什么」的实测清单在
[`packages/qishui-api/docs/APP_ENDPOINTS.md`](packages/qishui-api/docs/APP_ENDPOINTS.md)（90 条，13 个能力分类）。
