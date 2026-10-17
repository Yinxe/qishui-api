# qishui-api

汽水音乐（SodaMusic）接口协议整理仓库，pnpm workspace 结构。

| 包 | 路径 | 说明 |
|---|---|---|
| [`qishui-api`](packages/qishui-api/README.md) | `packages/qishui-api` | PC 端接口 TypeScript 客户端（320 端点 IDL + 纯 HTTP 请求层） |

## 使用

```bash
pnpm install                # 根目录执行
pnpm run build              # 递归构建（= pnpm --filter qishui-api run build，tsc --strict）
pnpm --filter qishui-api run <script>   # 跑子包脚本（当前只有 build）
```

pnpm 版本钉在本文件同目录的 `package.json` `packageManager` 字段，Node ≥ 20。

完整文档与变更记录在包目录内，见 [`qishui-api`](packages/qishui-api/README.md) / [`qishui-api/CHANGELOG.md`](packages/qishui-api/CHANGELOG.md)。
