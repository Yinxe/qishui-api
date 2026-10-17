# qishui-cli

汽水音乐的**命令行播放器**：把 [`qishui-core`](../qishui-core)（应用后端）摆成命令，出声交给 **mpv 子进程**，本地数据仍然落在 `~/.qishui`。

```bash
qishui play 晴天                 # 搜索词直接开播
qishui play liked --shuffle      # 我喜欢的音乐，随机
qishui play playlist:703107...   # 整张歌单
qishui search 晴天 --json | jq '.groups[].tracks[].name'
```

设计口径（和 core / api 一脉相承）：

- **一份数据两条出路**：每条命令默认渲染成给人看的表格/颜色/进度条；加 `--json` 出**同一份数据**的结构化形态（`--raw` 再带上游原始响应）。不存在「图上有的字段 JSON 里没有」。
- **stderr 只放日志**：`--json` 时 stdout 干干净净，能直接管进 `jq`；非 TTY 自动降级（无颜色、无进度条、不覆盖状态行）。
- **写接口不偷发**：只有你明确敲的命令才发写请求；删除类要 `--yes` 或交互确认；每条写操作都在提示里给撤销命令。
- **不替上游下结论**：拿不到地址就照实说「这个条目不可播 / 未验证」，不编默认值。

---

## 1. 安装与构建

```bash
pnpm install
pnpm --filter qishui-api run build      # core 依赖 api 的 dist
pnpm --filter qishui-core run build
pnpm --filter qishui-cli run build

# 直接跑
node packages/qishui-cli/dist/cli.js --help
# 或者把自己挂到 PATH（pnpm 全局链接会建出 qishui 命令）
pnpm --filter qishui-cli link --global
qishui --help
```

运行时依赖：**Node ≥ 20**、`mpv`（`sudo apt install mpv`）。不想出声/没装 mpv 时用 `--print-path` 只输出本地文件或签名地址。

## 2. 全局选项

任何子命令都认这几个（写在子命令前后都行）：

| 选项 | 作用 |
|---|---|
| `--json` | stdout 只输出 JSON（实体默认剥掉 `raw`） |
| `--raw` | JSON 里保留每个实体的 `raw`（上游原始响应，体积很大） |
| `--no-id` / `--id <show>` | 人读输出里的 id **默认显示**（一条行尾、表格加一列）；`--no-id`（或 `--id false`）关掉 |
| `--data-dir <dir>` | 数据目录（默认 `~/.qishui`；环境变量 `QISHUI_HOME` 优先） |
| `--as <uid\|昵称>` | **本条命令**临时用哪个已登录账号（不改默认激活号；切默认用 `qishui use`） |
| `--no-color` | 关颜色（等价 `NO_COLOR=1`） |
| `--verbose` | 把 core 的请求日志打到 stderr（前缀 `·`） |

**结构化输出的两条硬约定**（写脚本能依赖）：

1. `--json` 时 **stdout 里只有 JSON 文本**，一条命令一份，`JSON.parse(stdout)` 直接成立；
2. 人类可读时是排版过的表格/列表，**机器别去 parse 它** —— 要数据就 `--json`。

### 人读输出的样式（统一骨架）

**id 默认就带**，因为一条命令的输出通常就是下一条命令的输入 —— 想干净看标题就 `--no-id`：

```
▍搜索「晴天」
──────────────────────────────────────────────
序号  曲目    歌手       时长  id
──────────────────────────────────────────────
   1  晴天    Sunshine  2:32  7627888436947339298
──────────────────────────────────────────────
```

- **列表统一三线表**（顶线 / 表头线 / 底线，无竖线）：曲目 `序号|曲目|歌手|时长(|id)`，专辑/歌手/歌单同款；标题、歌手列过宽时按终端宽度截断（`…`）。「试听」这类噪音标记不进列表，只在 `track` 详情与播放链路提醒；
- 单个实体（`track`/`user` 详情、播放队列、评论）仍是一行式/key-value；
- 表格：id 作为一列（`qishui modes` 的 `radio_id`、`qishui cache list` 的曲目 id 这类**命令产物本身**的列不受 `--no-id` 影响）；
- `home` / `charts` / `mix` 的「播放目标」列是 `qishui play` 的写法（`type:id`，如 `chart:7036…`）——`qishui chart <id>`、`qishui radio <id>`、`qishui playlist <id>` 只要冒号后面的**裸 id**，整串喂进去认不出。

## 3. 命令速查

### 会话

| 命令 | 说明 |
|---|---|
| `login [--timeout 180] [--interval 2] [--no-profile] [--keep-active]` | 终端出二维码，用**汽水音乐 App** 扫（抖音扫不出来）；新号入库并激活，**不覆盖其他账号**；`--keep-active` 入库但不切 |
| `logout [--purge]` | 退出当前账号（保留账号壳与私有缓存，重新登录可归位）；`--purge` 连账号文件与该号缓存一起删 |
| `accounts` | 已登录账号一览（激活号打 `★`） |
| `use <uid\|昵称>` | 切默认激活账号（写回 `config.activeUid`；播放器清空、缓存内存态作废、历史上换目录） |
| `whoami [--refresh]` | 登录态 + 资料 + 会员态 + 数据目录（`--as` 临时态会标注） |
| `stats` | 本地播放统计（次数/听得最多）+ 缓存占用 |

### 发现 / 推荐（全部匿名可用）

| 命令 | 说明 |
|---|---|
| `home [--layout grid\|feed] [--tracks] [--playlists]` | 首页大盘；表格直接给「播放目标」（`playlist:…` / `chart:…`） |
| `chart [chartId] [--limit 50]` | 不带 id 列榜单块；带 id 打出整榜名次 |
| `charts` | 只列榜单块（`chart` 的别名） |
| `radio [radioId] [--limit 20]` | 不带 id 列场景电台；带 id 拉续播曲目（`radioId` 可给短数字，如 `48`） |
| `feed [--mode default\|familiar\|fresh] [--count 6] [--played] [--exclude none\|played\|liked\|both]` | 「随便听听」单曲推荐；`--mode` 也可写中文 `推荐/熟悉/新鲜`；`--played` 才带本地播放历史当 `played_tracks`（默认不带，见 core `feedSongTab`）；`--exclude` 是**客户端过滤**：本地按已播/已喜欢筛掉再翻页补齐，默认 `none` 直接透传上游 |
| `square [--category <id>] [--limit 20]` | 歌单广场（含分类） |
| `modes` | 偏好模式（推荐/熟悉/新鲜）+ **45 个场景音乐**（每个带 `radio_id`，可直接 `play radio:<id>`） |
| `mix <blockType> [subChannelId] [--limit 20]` | 单个内容块下钻（首页块点进去看全部） |
| `launch` | 冷启动偏好（曲风/语种、是否该弹首启引导） |

`discover` 是上面这批的**总入口**：`qishui discover home` ≡ `qishui home`，`discover chart|radio|feed|square|modes|mix|charts|launch` 同理（`qishui discover` 不带子命令时打 help）。两种写法输出完全一致，平铺命令留着是为了顺手。

> **FeedMode 的 45 个场景**：`feed_mode_block` 里每个场景的 `scene_mode_id`（如 `48`）能直接当 `radioTracks()` 的 `radio_id` 用 —— 所以 `modes` 列出的 `radio_id` 可以立刻 `qishui play radio:<radio_id>`。偏好栏上游**只回当前选中的那一个**，「熟悉/新鲜」的取值来自 IDL 常量，别拿「能回 6 首」当验证（推荐流本来就随机）。

### 搜索

| 命令 | 说明 |
|---|---|
| `search <query> [--type all\|track\|video\|artist\|album\|playlist\|user] [--limit 20]` | 官方搜索（默认全类型；匿名走 `/luna/search`，旧的 `--h5` 已移除） |
| `suggest <query>` | 搜索框联想 |
| `words` | 推荐搜索词 |
| `categories` | 7 个 `search_type` tab |

### 详情

| 命令 | 说明 |
|---|---|
| `track <id> [--related] [--comments] [--lyrics] [--stats]` | 曲目详情（权益/试听区间/VIP 音质一眼可见） |
| `album <id> [--tracks]` | 专辑 |
| `artist <id> [--tracks] [--albums]` | 艺人（热门曲目 / 专辑） |
| `playlist <id> [--tracks] [--count 50]` | 歌单（含「我喜欢的音乐」`type=1`、「抖音收藏」`type=4`） |
| `comments <trackId> [--count 20] [--post <text>]` | 评论；`--post` 是写接口（需登录） |
| `lyrics <trackId> [--json-lines]` | KRC 歌词（带时间轴） |
| `user <userId> [--playlists]` | 用户资料（**连打会出验证码**，别遍历） |
| `link <input> [--media]` | 分享链接/裸 id → 元数据 + 可播地址（不播） |

### 播放 / 下载

| 命令 | 说明 |
|---|---|
| `play [targets...] [--limit 30] [--shuffle] [--repeat off\|all\|one] [--volume 0-100] [--no-cache] [--no-lyrics] [--print-path] [--list]` | 播放会话 |
| `download [targets...] [--limit 30] [--out <dir>] [--all]` | 落盘到 core 缓存；`--out` 再导出一份 `<歌手> - <曲名>.m4a`（`--all` 连 `.lrc`/`.jpg`） |
| `history [--limit 20]` | 本地播放历史（`journal/plays.jsonl`，**永远记**） |

### 我的音乐（写接口需登录）

| 命令 | 说明 |
|---|---|
| `liked [--play] [--limit 50]` | 我喜欢的音乐（`--play` 直接开播） |
| `playlists` | 我的歌单 |
| `new <title> [--private]` | 新建歌单 |
| `add <playlistId> <trackIds...>` / `remove <playlistId> <trackIds...>` | 加歌 / 移歌 |
| `rename <playlistId> <title> [--description <text>]` | 改名 |
| `drop <playlistIds...> [--yes]` | 删歌单（**不可恢复**） |
| `like <trackIds...>` / `unlike <trackIds...>` | 红心 / 取消 |
| `isliked <trackIds...>` | 查在不在「我喜欢的音乐」里 |
| `collect` / `uncollect <targets...>` | 收藏 / 取消（`track:` `album:` `artist:` `playlist:`） |
| `artists [--count 30]` | 关注的艺人 |
| `recent [--count 20]` | 上游「最近播放」（实测**写回不落地**，空属正常） |

### 维护

| 命令 | 说明 |
|---|---|
| `cache stats` | 元数据条数/命中 + 媒体占用/播放计数 |
| `cache policy` | 打**缓存分档表**（哪些数据缓存、缓存多久；见 core README §6.1） |
| `cache list` | 已缓存曲目（体积/播放数/最近访问） |
| `cache verify [--fix]` | 校验 `meta.json`/文件长度（`--fix` 清坏条目） |
| `cache prune [--media] [--max-size 2GB] [--max-age 30]` | 按上限/年龄淘汰 |
| `cache clear [--media] [--yes]` | 清缓存（**默认只清元数据**，不动音频） |
| `cache path` / `where` | 数据目录、配置、设备身份/账号会话、媒体、当前账号历史文件的位置 |
| `config show` / `config path` / `config get <key>` / `config set <key> <value>` | 读写 `~/.qishui/config.json` |
| `reasons [--type track]` | 举报理由清单 |
| `report <trackId> --reason <code>` | 举报（写接口，需登录） |

## 4. 播放目标语法（`play` / `download` 共用）

```
晴天                                 搜索词 → 取最相关的一条
7068138081588611073                  裸曲目 id
track:7068138081588611073            显式类型前缀
album:<id>  artist:<id>  playlist:<id>  chart:<id>  radio:<id>
liked                                我喜欢的音乐
https://qishui.douyin.com/s/xxxx/    分享链接（短链会跟一次跳转）
```

解析顺序：`liked` → 类型前缀 → 裸 id / 分享链接（`link.parse` + 短链跟跳）→ 其它一律当搜索词。多个目标会去重合并成一条队列；`user:` / `video:` / `ugc_video:` 不能当播放目标（会给明确提示，不会静默失败）。

## 5. 播放会话

`play` 在**交互式终端**里会起一个播放会话：

```
▶ 红色高跟鞋  —  蔡健雅   1:23 ████████░░░░░░░░░░ 3:26  vol 80%  r:off
♪ 我的世界从此以后多了一个你
```

| 键 | 作用 |
|---|---|
| `空格` | 暂停 / 继续 |
| `n` / `p` | 下一首 / 上一首（同 `.` / `,`） |
| `←` / `→` | 后退 / 前进 5 秒 |
| `+` / `-` | 音量 ±5% |
| `s` / `r` | 随机开关 / 循环模式 off→all→one |
| `l` | 歌词开关（歌词作为普通行滚动输出，不抢状态行） |
| `q` / `Ctrl+C` | 退出并打好收尾 |

**谁说了算**（这是本 CLI 最花心思的地方，也解释了为什么它能「播完就自动切下一首」）：

```
core.player.play(tracks) ─► source 事件 ─► mpv 子进程（本地文件或签名地址）
      ▲                                        │
      │ 曲终/出错（**两边先到者赢**）             │ time-pos / duration（JSON IPC）
      └────────── player.next() ◄──────────────┘
```

- `core` 的 `Player` 管队列/状态/历史，是「该谁了」的真相源；`mpv` 是嘴。
- 曲终由 **mpv 到 EOF** 或 **core 时钟走完 `durationMs`** 任一先到触发推进 —— 元数据时长常比真实音频长（试听片段/转码），只信时钟会在歌播完后空转，所以 `mpv` 的 EOF 必须兜住。
- 进度条与 `seek` 以 mpv 的 `time-pos` 为准，偏差超过 500ms 才回写 core 的时钟（避免两边来回跳）。
- 拿不到 IPC（换了不支持的老播放器）就退化成纯播放，进度退回 core 的时钟。
- 每次会话结束都会收掉 mpv（`quit` → SIGTERM → SIGKILL），**不留野进程**（单测里有断言）。

其他模式：

```bash
qishui play liked --list              # 只列队列，● 表示已缓存，不播
qishui play 晴天 --print-path         # 只解析并打印本地文件/签名地址（给别的播放器用）
qishui play playlist:<id> --no-cache  # 不落盘，只用远程签名地址
```

## 6. 数据目录与环境变量

数据全在 core 的目录里（默认 `~/.qishui`）：`config.json`（含 `activeUid`）、`device.json`(0600)、`accounts.json` + `accounts/<uid>.json`(0600)、`cache/entities/`（账号私有/带我态在 `cache/entities/_acct/<uid>/` 下）、`cache/tracks/<id>/{meta.json,audio.*,lyrics.json,cover.jpg}`、`journal/<uid>/plays.jsonl`（未登录走 legacy `journal/plays.jsonl`）。看位置：`qishui where`；看隔离规则：`qishui cache policy`。

| 环境变量 | 作用 |
|---|---|
| `QISHUI_HOME` | 数据目录（优先级：`--data-dir` > `QISHUI_HOME` > `~/.qishui`；`config.json` 里的 `dataDir` 只是记录现值，改它不生效） |
| `QISHUI_PLAYER` | 播放器命令（默认 `mpv`），例如 `QISHUI_PLAYER=ffplay` |
| `QISHUI_MPV_ARGS` | 追加给播放器的参数，空白分隔，例如 `QISHUI_MPV_ARGS=--ao=null`（无音频设备的环境） |
| `NO_COLOR` | 关颜色（等价 `--no-color`） |

**退出码**：`0` 成功；`1` 命令失败（上游拒答、目标解析不出、有下载失败项、`cache verify` 发现问题等）。错误信息走 stderr，形如 `✗ 一句话` + 缩进的「下一步」提示。

## 7. 单元测试

```bash
pnpm run build                        # 先构建（core/api 也要；测试跑的是 dist/cli.js）
pnpm --filter qishui-cli run test     # vitest：3 个文件（cli/format/playback）
```

`test/*.test.ts` 用 **vitest** 起构建产物 `dist/cli.js`；数据目录由 `test/support/cli.ts` mkdtemp 造并**预置假 device.json**（不触发设备注册），全程**不打上游**：

1. `cli.test.ts`：`--help`/未知命令/未知选项退出码、`--json` 形状、`NO_COLOR` 无转义、`config get/set` 落盘、`cache policy` 分档、多账号离线机制（`accounts`/`use` 未知号报错/`--as` 指错号**直接报错不回落**/`feed --exclude` 与 `discover feed --mode` 非法值）；
2. `format.test.ts`：时长/体积格式化与实体一行式描述（纯函数，直接 import `../dist/format.js`）；
3. `playback.test.ts`：`seedTrack` 预置实体缓存 + 媒体缓存（自造 3 秒 WAV，不依赖 ffmpeg），验 `--list`（● 已缓存）、`--print-path --json`（kind=cache 零网络）、`download --out` 导出、`cache stats/list`；再起真 mpv（`QISHUI_MPV_ARGS=--ao=null` 不出声）→ EOF → 自动切下一首 → 收尾，核对 JSON 结果、`reason=finished`、**无残留 mpv 进程**、本地历史与统计；有 `script(1)` 时再用 PTY 按 `q` 验快捷键。

mpv / script(1) 不在本机只跳过对应分节（`describe.skipIf`）。上游可达性结论由 `qishui-api` 实测台负责，不进单测。

## 8. 已知边界

- **VIP 行为未验**：本机会话非会员，VIP 音质/下载类端点是否放行没有结论；`--no-cache` 走分享页拿到的地址可能就是普通音质。详见 [`../qishui-core/README.md §11`](../qishui-core/README.md) 与 [`../qishui-api/docs/APP_ENDPOINTS.md`](../qishui-api/docs/APP_ENDPOINTS.md)。
- **试听片段**：部分曲目分享页给的地址只是片段（`TrackData.playableRange`）；列表不再显示 `试听` 标记，看 `track` 详情的「试听」区间行或 `track --json` 的 `startMs`/`durationMs`。
- **上游「最近播放」写回不落地**：`recent` 可能回空；「听过什么」的真相源是本地 `history`。
- **风控**：`user`/粉丝/关注类接口连打会出验证码，CLI 只单次取用、不做遍历。
- **搜索里「用户」拿不到**：`search --type user`（或 `all`）没有用户结果 —— 上游 `/luna/search/user` 匿名与带会话都只回 `status_info`、没有 `result_groups`；旧的 h5 `Search2023` 已弃用不再用。属**未验证 / 上游不返回**（歌手/专辑/歌单都正常）。
- **`ugc_video`/`video` 不当播放目标**：分享页对它们是视频地址，本 CLI 只播音频。
