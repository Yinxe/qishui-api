# AGENTS.md — qishui-api 工作约定

## 目录

| 包 | 状态 |
|---|---|
| `packages/qishui-api` | 协议接口层（320 端点 IDL + 请求层 + web 分享页 + h5 曲目口 `/luna/h5/track_v2`），已成形 |
| `packages/qishui-core` | 应用后端层（OO 服务/实体 + 播放器状态机 + 播放队列书架 `core.queues`（推荐/歌单/喜欢/临时各一份）+ 本地数据与媒体缓存），依赖 api 的 `dist` |
| `packages/qishui-cli` | 命令行播放器（commander 子命令 + mpv 子进程出声 + 终端播放会话），依赖 core；每条命令都可 `--json` |
| `packages/qishui-tui` | 终端 TUI（ink：侧边栏导航 + 通用列表页 + 曲目详情/用户主页 + 播放条 + 播放页（左曲目/歌词、右队列）+ 歌词/评论弹层 + 播放队列书架 `Q`，扫码登录出终端二维码、歌单增删改、本地库板块（本地喜欢/历史/歌单/音乐文件夹，`core.local`）、`S` 设置与缓存、鼠标操控（滚轮 + 点击，`QISHUI_TUI_MOUSE=0` 可关）、曲目封面（听歌页 + 详情页；终端图形能力开机探测，探到就贴原图、否则 chafa 半块，字节优先吃 core 的本地封面缓存），接 core、出声走 mpv；`QISHUI_TUI_STUB=1` 只画外壳）；源码 `.tsx`，build 走 `tsc -p` |

## 约定

- **不替上游下结论**：接口拿不到就是「未验证 / 这个条目不可播」，不写「不可用」；不恢复 `UnsupportedError` 这类自造拦截。
- **匿名结论不是终局**：登录/会员是没试过的变量，文档里区分「匿名拿不到」与「未验证」。
- **`1000062` 是 query 参数门，不是「客户端完整性校验」**：门是 `device_platform`（库的 common 参数发 `windows`）。`/luna/h5/track_v2?track_id=…&device_platform=web` + 普通浏览器 UA、无 cookie 无签名，**匿名就能拿曲目全量**（`label_info` 权益矩阵、多档 `video_model`、KRC 歌词）；换 UA 不管用。所以**曲目取址默认走 h5**（`src/web/h5Track.ts`，core 的 `cache/media.ts mediaOf`），失败才回落分享页 SSR——`ugc_video` 只有 SSR 那条路（`/luna/h5/video*` 实测 404）。pc 口 `/luna/pc/track_v2` 补该参数仍是 0 字节。有 VIP 时 pc 口可能放行、**但文件可能加密——这条是推测，未实测，别当结论**。口径详见 `packages/qishui-api/docs/APP_ENDPOINTS.md` §3.5.1。
- **写接口安全**：无会话只验拦截；有会话默认跳过，`ALLOW_WRITE=1` 才发；已实测的写接口必须可回滚。
- **实测过的接口不重复发**（防风控）：`packages/qishui-api/test/run.ts` 自动 SKIP 已有结论的条目，`FORCE=1` 才重测。
- **上游契约只在实测台验**：`packages/qishui-api/test/*` 是纯 node 脚本（`node --experimental-strip-types`）；core/cli/tui 的测试用 **vitest**（`pnpm test`），单测一律不打上游——core 注入 mock fetch，cli spawn 构建产物 + 独立数据目录（预置 device.json/实体/媒体缓存，mpv 用 `--ao=null`），tui 用 `script(1)` 起 PTY 跑 `dist`（缺 `script` 就跳那条）。测试从 `../dist` 导入，改完 src 先 `pnpm run build` 再跑。
- 质量检测只用 **Biome** 单工具：`pnpm run check`（检查）/ `check:fix`（写回）/ `format`（只格式化），不引入 ESLint + Prettier；类型检查走根 `tsconfig.json`（`pnpm run typecheck`），全仓库一处口径（含 tui 的 `.tsx`，根也开了 `jsx: react-jsx`）。
- **缓存分档唯一真相**：`packages/qishui-core/src/cache/policy.ts`——两个正交维度都在这一个文件：TTL 档 `CacheTtl`（`none`/`entity`/`chart`/`config`/`staticEnum`/`account`）与账号隔离档 `CacheScope`/`KIND_SCOPE`（`account`/`viewer` 落 `cache/entities/_acct/<uid>/`，`public` 共享；媒体缓存始终跨号共享）。原则是「只有长时间不变的数据才落盘」——实时数据（搜索/推荐流/首页/最近播放）`ttlMs: 0`（`EntityCache.set` 见 0 跳过写盘）；改档只动这个文件，各服务引用档位不写死秒数；`qishui cache policy` 打同一张表（含「账号隔离」表）。
- **缓存容量维度的唯一真相**：`packages/qishui-core/src/config.ts` 的 `MEDIA_CAPACITY_TIERS`（2/3/4/5/10G + `0` = 不限制）与 `MEDIA_EVICT_POLICIES`（`lru` 按最久没碰 / `leastPlayed` 按播得最少，同次数再比时间）——档位名与策略词都走 `mediaCapacityLabel()`/`mediaEvictPolicyLabel()`，CLI 与 TUI 都不抄表、不写死秒级字节。**占用与剔除同一个口径**：`MediaCache.scan()` 一次遍历 `cache/tracks`，统计、`capacity()`、`prune()` 全用它的真实磁盘字节（含歌词/封面/meta/残留 `.part`），所以「看到 1.2GB」不会剔出另一个数。`stats()` 按文件拆成音频/封面/歌词/meta/残留，和 `diskBytes` 恒等。`capacity()` 只算不删（`reclaimable*` 是「按当前策略清到上限能腾出多少」的预览）。删音频默认要人显式触发：`mediaAutoEvict` 默认关，开着时 `ensure()` 落盘后自动剔到上限，但**必须把刚下的那首传进 `prune({ keep })`**（它 `plays` 还是 0，`leastPlayed` 下排第一，不保护就会下完即删）；`config set maxMediaBytes` 认 `3G`/`1536MB`/`不限制`。**校验里试听片段不算坏**：`verify()` 默认只读，`clip`/老 `playableRange` 与记录不符只报 info，`fix` 只改记录、文件在就一个字节不动（只有缺音频/空文件的目录才删）；`deep` 只对 v3 记录算 sha1，指纹不符也只重记、不删；文件比记录短不修也不删（`peek()` 已判不中，下次播放会重下）。
- CLI 硬规矩（续）：**人读输出默认带 id**（`--no-id` / `--id false` 关）；`type:id` 这种复合写法只用于 `qishui play` 目标，`chart`/`radio`/`playlist` 取详情只要冒号后面的裸 id——列表头写清 `type:id`，别让人误当 id 本身。
- CLI 的一条硬规矩：**一份数据两条出路**——默认渲染给人看，`--json` 出同一份数据的结构化形态（`--raw` 才带上游原始响应）；命令里用 `output.emit(render, data)` 收口，别各写一套。
- **多账号**：设备身份与账号解耦（`~/.qishui/device.json` 全体共用一台，换号不触发新注册）；每号一份 `~/.qishui/accounts/<uid>.json`（cookie，0600）。激活号以 `config.activeUid` 为准，切号 `qishui use`、单命令临时换号 `--as`（`--as` 指错号/空壳号直接报错，绝不静默回落激活号；config 存的激活号解析不出才回落 lastUsedAt）；账号私有/带我态数据按 uid 隔离（见上条 `_acct/<uid>`）。`packages/qishui-api/qishui-{device,session}.json` 与 `~/.qishui/accounts/` 下同口径：已 gitignore，勿提交、勿外传。
- CLI 跑法：`pnpm run cli <args>`（pnpm 12 会把 `--` 原样传给脚本，**别加**）。TUI 跑法：`pnpm run tui`（先 `pnpm run tui:build`）。
- TUI 的鼠标走 `@ink-tools/ink-mouse`（`enable()` 一并开 `?1000`/`?1002`/`?1003`/`?1006`，**运行期别关 `?1002`/`?1003`**——VTE 系终端只开 `?1000` 时会把界面当拖选文本区，光标停在 I 型、点击根本不报进来；「光标一直是输入态、点没反应」就是这个）：**点击以「按下」(press) 触发**，不等抬起——抬起 (click) 要按下/抬起落在 1 格内，真实终端常报偏；命中判定要收成**半开区间** `[left,right)`/`[top,bottom)`——库用闭区间会让相邻盒子在接缝列上双触发；输入处一律过 `isMouseInput()`/`stripMouse()`（ink 没有「消费」语义，SGR 报文会当字打进输入框）。`QISHUI_TUI_MOUSE=0` 或设置页 `tuiMouse` 关掉整个鼠标。
- TUI 的命令类按键一律走 `src/ui/keys.ts` 的 `useKeys`（= ink 的 `useInput` + 多字符输入按字符拆开派发）：ink 把一次 read 的整串交给 handler，快按 `jj` 拿到的是 `'jj'`，`input === 'j'` 必然不中——「按了两下、列表没动」就是这么来的。鼠标报文与 ESC 序列不拆（拆了 `<` 会变成「后退 10 秒」）。文本输入处（搜索框/评论/歌单名）仍用 `useInput`，它们本来就按字符收下。
- TUI 的**终端图形能力靠启动探测，不靠环境变量猜**（`src/ui/termProbe.ts` 在 `render()` 之前问一次：kitty `a=q` 查询 + XTVERSION + DA1 收尾；DA1 是规范里的最后一条回音，它到了才收工，没人答只付 300ms）：`KITTY_WINDOW_ID`/`TERM` 既会漏掉 ghostty/contour/rio，又会被 tmux/zellij 透传进来骗人（报文被 mux 吃掉 → 一屏 `U+10EEEE` 残字）。**只有确认支持 unicode 占位符的终端才贴原图**——`a=q` 证明不了占位符（规范里没这一项），所以答查询但只有旧协议的 `konsole`/`warp` 用名单挡回 chafa 半块；Sixel/iTerm2 的直接定位图会被 ink 的差异重绘擦掉，不做每帧重贴层之前一律走半块。贴图要**按 id 引用计数**，最后一处卸载发 `a=d`（`q=2` 静音）删除，不然久听会在终端里攒几十张原图。
- TUI 的**终端回报报文（APC/DCS/DA1）会被 ink 切成好几个事件、并且开头的 ESC 被剥掉**（PTY 实测：`[?62;4;18c` → `_` → `Gi=…;OK` → `\` → `P` → `>|kitty…` → `\`），所以「按完整报文匹配」在这层不存在：只有形状没人敲得出来的永久剔，被剥成 `_` `P` `\` 的碎片只在探测没读到 DA1 时开的窗口里吞（`src/ui/reports.ts` 的 `stripReports()`，按键处与所有文本输入处都过它）。同一条规律也适用于鼠标报文（`isMouseInput`/`stripMouse`）。
- TUI 的界面**只用 ASCII + 汉字**：状态与模式是中文词（`播放` `循环:关` `随机:开` `音量:60`），选中/当前行前缀 `>` + **下划线 + accent 色**（不用反色块：整行反色在浅色/透明背景下会糊成一条，还盖掉行内的颜色信息）；侧边栏例外：当前页是最左边一条竖线 `|`、光标项是带颜色的 `[方括号]`；文本输入框仍用反色块表示「正在输入」，错误前缀 `x`，转圈 `| / - \`——不掺表情符号和装饰图形（`▶⏸🔊♥★▍✕○●⠋` 那类）。理由不是审美：这些码位在 emoji 呈现/中文字体下常占 2 格，`displayWidth()` 估不准，播放条与列表列会跟着错位。词表在 `qishui-tui/src/ui/theme.ts`、模式标签在 `src/ui/playMode.ts`、颜色在 `COLOR`、高度/宽度推导在 `src/ui/layout.ts`，加控件时从这几处取，别在页面里裸写颜色串或符号；唯一例外是进度条 `━●─`（本身就是终端图形，且每格只画它一个字符）。**画图的地方只画曲目封面**（听歌页 + 曲目详情），头像一律还是文字。
- 远端保持本地：**不 push**。
- 文档分工：`docs/APP_ENDPOINTS.md` 记端点实测结论；各包 `README.md` 记用法；各包 `CHANGELOG.md` 记变更。
