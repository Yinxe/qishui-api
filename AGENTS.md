# AGENTS.md — qishui-api 工作约定

## 目录

| 包 | 状态 |
|---|---|
| `packages/qishui-api` | 协议接口层（320 端点 IDL + 请求层 + web 分享页），已成形 |
| `packages/qishui-core` | 应用后端层（OO 服务/实体 + 播放器状态机 + 本地数据与媒体缓存），依赖 api 的 `dist` |

## 约定

- **不替上游下结论**：接口拿不到就是「未验证 / 这个条目不可播」，不写「不可用」；不恢复 `UnsupportedError` 这类自造拦截。
- **匿名结论不是终局**：登录/会员是没试过的变量，文档里区分「匿名拿不到」与「未验证」。
- **写接口安全**：无会话只验拦截；有会话默认跳过，`ALLOW_WRITE=1` 才发；已实测的写接口必须可回滚。
- **实测过的接口不重复发**（防风控）：`packages/qishui-api/test/run.ts` 自动 SKIP 已有结论的条目，`FORCE=1` 才重测。
- 实测台是纯 node 脚本（`node --experimental-strip-types`），不引入 vitest；core 的端到端冒烟在 `packages/qishui-core/test/smoke.ts`。
- 会话文件 `packages/qishui-api/qishui-{device,session}.json` 已 gitignore，勿提交、勿外传。
- 远端保持本地：**不 push**。
- 文档分工：`docs/APP_ENDPOINTS.md` 记端点实测结论；各包 `README.md` 记用法；各包 `CHANGELOG.md` 记变更。
