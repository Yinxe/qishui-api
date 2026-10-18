# Changelog

本包（`qishui-cli`）的变更记录，最新在上。

## Unreleased

### Changed

- **`login` 的终端二维码补静区，并给一张官方 PNG 兜底**：`qrcode-terminal` 是贴着边画码的，一格白边都不给，App 要对焦很久才认出来（官方那张 PNG 带 4 模块白边）——`loginQr.ts` 现在自己补一圈 4 模块留白再上屏；同时把 core 落盘的 `login.qrImage` 打在下面一行「识别慢就扫官方二维码图片：<路径>」（`--json` 里是 `qrImage` 字段）。二维码本体仍是那条 `bff-pc.qishui.com` 深链，没换载荷

- **测试从冒烟台改为 vitest 单测**：删 `test/smoke.ts`（64 项、真打上游），改为 `test/cli.test.ts`（命令面/配置/分档表/多账号离线机制）+ `test/format.test.ts`（格式化纯函数）+ `test/playback.test.ts`（`seedTrack` 预置实体+媒体缓存后队列/落盘/导出全零网络，真 mpv `--ao=null` 会话 + PTY 按 `q`；缺 mpv/script 只跳分节）+ `test/support/`。数据目录 mkdtemp 并预置假 `device.json`，**不碰 `~/.qishui`、不打上游**；`QISHUI_CLI_TEST_HOME` 环境变量随之取消
- **`--as` 指错号/空壳号现在直接报错**（原来会静默用激活号跑）：错误原样转述「没有账号 …」/「没有留存会话 …」，并带「先看 `qishui accounts`」提示，不被通用映射吞成「需要登录」

### Fixed

全命令真跑走查（匿名、独立数据目录）抓到的三处：
- **`search --type all` 空表墙**：每组只有一种实体，但四个 `print*List` 对空数组也照打「表头+横线」，一组结果塞满四张空表。现在空列表直接不打（`render.ts` 四处护栏）
- **`chart <id>` 名次列整列空白**：上游不给名次数字（core 的 `parseChart` 已按数组位次补），表格随之有 1..n
- **`link` 的「过期 刚刚」**：未来时刻被 `ago()` 误判（差值 <60 秒分支含了负数）。新增 `until()`——`25 小时后` / `30 分钟后` / 远期给日期 / 已过给 `已过期`；`link` 过期行与 `whoami` 会员「到期」都改用它，`ago()` 本身也对未来时间回落到日期不再谎报「刚刚」
- **`playback.test.ts` 的「无残留进程」断言不再数全系统的 mpv**：原来 `pgrep -c mpv` 只要是台机器上跑着别的 qishui 播放器（例如用户自己开着的 TUI 听歌）就必红。现在按 cmdline 里的 CLI 专属 socket 名 `qishui-mpv-*` 认「CLI 的播放器」（TUI 是 `qishui-tui-mpv-*`，不会误伤），且只比对跑之前/之后的 pid 差集——不仅免误报，还能抓住「这一跑新漏下的」
- **试听片段歌词错位**：`-l` 的歌词窗口原来直接拿 mpv 的片段内位置查整曲歌词，片段从非 0 处开始时整段对不上；现在加上 `player.clipStartMs`（core 已从分享页解析片段起点），进度条/钳位也随之用片段实际时长

## 0.2.0 — 2026-10-17

### Added

- `discover` **总入口**子命令组：`qishui discover home|chart|charts|radio|feed|square|modes|mix|launch` ≡ 平铺命令（不带子命令时打 help）。平铺命令保留，两种写法输出一致
- `modes`：偏好模式（推荐/熟悉/新鲜）+ **45 个场景音乐**（列 `radio_id`，可直接 `qishui play radio:<radio_id>`）
- `mix <blockType> [subChannelId]`：内容块下钻
- `feed --mode default|familiar|fresh`（中文别名 `推荐/熟悉/新鲜`）：偏好流单曲
- `feed --count <n>` / `--played`：请求按 App 口径补全（`feed_mode`/`count`/会话计数）；`played_tracks` 默认**不带**（只本地记历史、未向上游报播放时长），`--played` 显式开
- `feed --exclude none|played|liked|both`：**客户端过滤**——本地按已播/已喜欢筛掉、翻页补齐（默认 `none` 直接透传上游，不多打）
- **多账号命令**：`accounts`（激活号打 `★`）、`use <uid|昵称>`（切默认激活，写回 `config.activeUid`）；全局 `--as <uid|昵称>` 单条命令临时换号不改默认
- `login` 改「新号入库并激活，不覆盖其他账号」（不再因已登录拦路；`--force` 仅保留兼容），新增 `--keep-active`；`logout --purge`（连账号文件与该号私有缓存一起删）；`whoami` 列账号数并标注 `--as` 临时态
- `cache policy` 增「账号隔离」表（`KIND_SCOPE` 与 core 同源）；`where`/`cache path` 展示 device.json / accounts.json / accounts/<uid>.json / 当前账号历史文件位置

### Changed

- **所有表格统一三线表**：`printTable` 改为 顶线/表头/表头线/数据行/底线、无竖线；新增 `flex` 列在超过终端宽度时压缩并截断（`…`），全 CLI 表格自动生效
- **曲目/专辑/歌手/歌单列表从一行式改为三线表**：`printTrackList` 等改走 `printTable`（`序号|曲目|歌手|时长(|id)`，`--no-id` 摘 id 列）；单个实体详情、播放队列、评论仍保持一行式/key-value
- **列表去掉「试听」标记**：`trackMarkers` 删除，试听/权益信息只在 `track` 详情与播放链路提醒（列表里是噪音）；随之删除没人用的 `trackLine`/`albumLine`/`artistLine`/`playlistLine`/`chartLine`
- `use <账号>` 报错原样转述（「没有该号 / 没有留存会话 / 昵称撞号」），不再被通用映射吞成「需要登录」
- `radio [radioId]`：不带 id 列 45 个场景；带 id 拉续播（短数字 `radio_id` 自动转 number 发）
- **全局 `--no-id` / `--id <show>`**：人读输出严格来说默认就带 id（一条命令的输出通常是下一条的输入），`--no-id`（或 `--id false`）关掉；`isIdVisible()` / `idTag()` / `withIdColumn()` 统一收口
- `cache policy`：打缓存分档表（与 core 的 `CACHE_TIERS` 同源）

### Changed

- **人读输出统一样式**：一行式 `[序号.] 标题 — 副标题  元信息…  标记…  id`（id 尾随 dim，`tailParts` 拼两个空格）；表格里的 id 列由 `withIdColumn()` 按 `--no-id` 增删；命令产物本身是 id 的列（如 `modes` 的 `radio_id`、`cache list` 的曲目 id）不进该开关
- `home`/`charts`/`mix` 的「播放目标」列表头点明为 `播放目标（type:id）`，并加提示：`type:id` 是 `qishui play` 的写法，`chart`/`radio`/`playlist` 取详情只要冒号后面的**裸 id**（免得把 `chart:7036…` 整串喂给 `qishui chart`）
- 各命令 `--refresh` 的 help 文案按新缓存档位如实写：不缓存的命令标「该命令不缓存（参数无效，保留兼容）」，可缓存的写明档位（6 小时 / 30 分钟 / 5 分钟）
- 冒烟 `test/smoke.ts` 增到 **64 项断言**，新增：默认带 id（按「表尾 ≥15 位数字列」判定，不依赖上游两次调用返回同序——列表顺序会漂移）、`--no-id`/`--id false` 去掉 id、`discover` 子命令等价、`modes` 偏好/场景、`cache policy` 分档、`feed --mode` 非法值报错、多账号命令离线段（`accounts`/`use` 未知号报错/`feed --exclude` 非法值）、三线表断言（表头 + 三条横线），以及 6 条搜索断言（`--type artist|album|playlist` 各 20 条、`all` 四类实体、`user` 如实提示）

### Fixed

- **`search --type artist|album|playlist` 空结果**：core 的 `unwrap()` 没剥搜索结果的 `entity.<kind>` 壳（见 core CHANGELOG），CLI 侧随 core 修好；`--type all` 现在四类实体都出
- `--type user|video` 无结果时给出**如实提示**（上游 `/luna/search/<type>` 不返回，不是关键词没命中）；`--type all` 加「每类预览，要全量用 `--type`」提示

### Removed

- `search --h5`：h5 版 `Search2023` 已弃用，不再提供该开关（搜索只走匿名 `/luna/search`）

## 0.1.0 — 2026-10-17

首个版本：`qishui-core` 之上的**命令行播放器**。把 core 的应用后端能力摆成命令，出声交给 **mpv 子进程**（`--input-ipc-server` 的 JSON IPC 当真状态源），数据仍在 `~/.qishui`。

### Added

- 命令面 44 个（`commander`）：`login`/`logout`/`whoami`/`stats`；`home`/`chart`/`charts`/`radio`/`feed`/`square`/`launch`；`search`/`suggest`/`words`/`categories`；`track`/`album`/`artist`/`playlist`/`comments`/`lyrics`/`user`/`link`；`play`/`download`/`history`；`liked`/`playlists`/`new`/`add`/`remove`/`rename`/`drop`/`like`/`unlike`/`isliked`/`collect`/`uncollect`/`artists`/`recent`；`cache`/`config`/`where`/`reasons`/`report`
- 全局 `--json` / `--raw` / `--data-dir` / `--no-color` / `--verbose`：**一份数据两条出路**（默认人类可读，`--json` 出同一份数据的结构化形态，`--raw` 才带上游原始响应）；`--json` 时 stdout 只有 JSON，日志走 stderr
- 播放会话（仅 TTY）：状态行（曲名/进度条/音量/循环随机）+ 歌词滚动输出 + 快捷键（空格、`n`/`p`、`←`/`→` ±5s、`+`/`-`、`s`、`r`、`l`、`q`）；非 TTY 自动降级为纯输出
- `MpvSink`（`src/playout.ts`）：mpv 子进程 + unix socket JSON IPC 客户端（`time-pos`/`duration`/`pause`/`seek`/`volume`/`quit`），停止走「quit → SIGTERM → SIGKILL」三档，**不留野进程**；`start()` 返回 generation，配合 `onExit` 精确区分「这一首」的退出
- 曲终「两边先到者赢」：mpv 到 EOF 或 core 时钟走完 `durationMs` 任一先到即推进，解决元数据时长比真实音频长（试听片段/转码）导致的播完空转；用 mpv 的 `time-pos` 校正 core 时钟（偏差 > 500ms 才纠）
- 播放目标语法（`src/targets.ts`）：裸 id、`track:`/`album:`/`artist:`/`playlist:`/`chart:`/`radio:` 前缀、`liked`、分享链接（含短链跟跳）、其余文本当搜索词；多目标去重合并
- `play` 附加模式：`--list`（列队列并标 `●` 已缓存）、`--print-path`（只解析本地文件/签名地址，给别的播放器用）、`--no-cache`（只用远程地址不落盘）、`--no-player` 类能力由 `--print-path` 承担
- `download --out <dir>`：导出 `<歌手> - <曲名>.m4a`（`--all` 连 `.lrc`/`.jpg`），文件名走 core 的 `safeSegment`
- 输出层（`src/output.ts`）：Node 内置 `util.styleText`（不引 chalk）、`displayWidth` 处理 CJK 宽度、表格/`printKeyValues`/状态行/进度条/`askYesNo` 确认；`emit(render, data)` 作为**唯一出口**，保证可视化与 `--json` 吃同一份数据
- 错误提示映射（`src/context.ts`）：`1000016`→登录、`1000004`→参数口径、`1000062`→客户端完整性校验、`101`→重复操作、`3056`→评论区未开放、风控→别遍历；`CliError(message, hint)` 给「下一步该干嘛」
- 写接口安全：登录态写命令前置检查；`drop`/`cache clear` 需 `--yes` 或交互确认；每条写操作提示里带撤销命令
- 冒烟 `test/smoke.ts`（43 项断言，纯 node 脚本）：离线参数/JSON 形状/配置读写 → 匿名接口（搜索/首页/榜单/曲目/评论/链接/落盘/导出）→ **真 mpv 播放**（自造 3 秒 WAV 塞缓存，跑 `--ao=null`，核对 `played=2`/`reason=finished`/无残留进程/历史入账），有 `script(1)` 时再用 PTY 验 `q` 退出

### Notes

- `core`/`api` 保持**零运行时依赖**；运行时依赖只加在本包（`commander` + `qrcode-terminal`）
- 本包**不出声也不解码**：音频一律交给外部播放器；`QISHUI_PLAYER` / `QISHUI_MPV_ARGS` 可换命令与参数（无音频设备环境用 `--ao=null`）
- 实测依据见 [`../qishui-api/docs/APP_ENDPOINTS.md`](../qishui-api/docs/APP_ENDPOINTS.md)；**VIP 行为未验**（本机会话非会员）
