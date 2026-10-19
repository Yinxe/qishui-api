# Changelog

本包（`qishui-core`）的变更记录，最新在上。

## Unreleased

### Added

- **媒体缓存的容量维度终于成账：档位上限 + 真实占用 + 满溢策略（+ 一个默认关的自动淘汰）**
  - **为什么**：`maxMediaBytes` 从前只在 `prune()` 里被读一次，而 `prune()` 没有任何自动触发点——上限形同虚设，缓存一路涨；界面也看不到「用了多少 / 还剩多少」；`prune` 剔谁只看 `accessedAt`，一直在记的 `plays` 从没参与决策
  - **做法**：`config.ts` 加 `MEDIA_CAPACITY_TIERS`（2/3/4/5/10G + 不限制，`0` = 不限制）、`mediaCapacityLabel()`/`nextMediaCapacityTier()`/`mediaEvictPolicyLabel()` 三个词表（CLI 与 TUI 共用，不各自抄表），新配置项 `mediaEvictPolicy: 'lru' | 'leastPlayed'`、`mediaAutoEvict`（默认 `false`）；`MediaCache` 加 `capacity()`（**只算不删**：真实占用/占比/是否超限/按当前策略能释放几首多少字节），`stats()` 加 `diskBytes`
  - **口径**：占用与剔除都用 `dirStats()` 的真实磁盘字节（含歌词/封面/残留 `.part`），显示 1.2GB 就不会剔出另一个数
  - **边界**：`loadConfig` 只收口这三项（坏容量回默认、枚举回 `lru`、非布尔回 `false`）——**0 是「不限制」不是无效值**，必须原样留下；负数/`NaN` 会被 `maxBytes > 0` 静默当成不限制，所以挡在门口
  - **`prune({ policy, keep })`**：`leastPlayed` 按 `plays` 升序（同次数再比时间，否则并列时剔谁看运气）；`keep` 里的曲目不动——刚 `ensure()` 完的那首 `plays` 还是 0，不保护就会「下完立刻把自己删了」。`ensure()` 末尾在 `mediaAutoEvict` 开时才自动剔，失败只打一行日志，不影响本次播放；`clearCache({media:true})` 保住 `player.current`

- **`media.cachedCover(trackId)`：把已经落在盘上的封面字节给出去**（`cache/media.ts`）
  - **为什么**：TUI 的封面每次重画都重新从 CDN 拉，可 `~/.qishui/cache/tracks/<id>/cover.jpg` 早就有了（`ensure()` 顺手落的）——core 没把它露出来，界面就看不见
  - **做法**：直接 `readJson(metaFile(id))` 取 `meta.cover.file` 再 `readFile`，**不经 `readMeta()`**——那个要求 `meta.audio.file` 存在才算「这条缓存有效」，而只有封面、没下音频的条目照样该画得出来
  - **边界**：全程不发网络；文件不在 / meta 坏 / 没 `cover` 一律 `undefined`（静默，让调用方回源）；专辑/艺人/用户没有媒体缓存条目，不在这一条的范围里
  - 离线单测 `test/media.test.ts` 补一条：没 `ensure` 过是 `undefined`，落盘后拿到字节且**零请求**

### Added

- **队列书架落盘：`<dataDir>/queues.json`，重启后每份队列还在、还记着上次播到第几首**（`player/queues.ts` 的 `QueueBook` + `paths.queuesFile`）
  - **写法**：书架每次变化（打开 / 切换 / 续批追加 / 收起）后 **300ms 防抖**原子写（先写 tmp 再 rename），`dispose()` 退出前 `flush()` 收尾；纯同步 IO，不引新依赖
  - **恢复**：构造期 `hydrate()` 读盘（坏 JSON / 版本不对 → 整本当空的，不崩），每份队列恢复曲目、`index`、随机与续批状态；**推荐队列连档位一起回来**（`feed` 是可序列化的 `FeedModeRef`），恢复期不取网、`loaded` 照抄落盘值。**不恢复「上次在播哪份」**——播放器重启后是空的，让界面自己决定接哪一份（TUI 启动即起播因此变成「接着上次那一首」）
  - **边界（都写进注释）**：`load` 闭包没法序列化——歌单/喜欢没取完的那部分要重新从列表页点开；`TrackData.raw` 原始响应快照**剥掉不写**（占地方且恢复后也用不到）；换号 `reset()` 整份作废并把空书架落盘（别让下一个号看见上一个号的队列）
  - 离线单测 `test/queues.test.ts` 补 4 条：防抖写不落退出后才到（等 350ms 重开实例看得见）、重启恢复每份的位置（切回去接着播、推荐队列恢复后**不重新取批**）、盘上没有 `raw` 残迹、`reset()` 后重启是空的

### Added

- **取址改成 h5 优先、分享页兜底**（`cache/media.ts` 的 `mediaOf()`，原 `sharePage()`）
  - **问题**：`/luna/pc/track_v2` 那批 goapi 口匿名全拒，于是曲目地址一直只从分享页 SSR 拿——一次 HTML 抓取、只给一档、字段名还没 IDL 依据
  - **做法**：先 `getTrackMedia()`（`/luna/h5/track_v2` + `device_platform=web`，实测与 SSR 是**同一份音频**，还多给档位与权益），它失败再落 `getShareMedia()`；两条都不给地址才抛 `MediaUnavailableError`，消息里**两条各为什么失败都写出来**（`h5 …；分享页 …`），不藏其中一边
  - `services/link.ts`：`media()` / `track()` 认到 `track` 就走 h5（这里**不做静默回落**，不通就照实报），`ugc_video` 仍走 SSR——h5 侧没有对应的视频端点（`/luna/h5/video*` 实测 404）
  - **新增 `core.trackDetail(id | Track)`**（`core.ts`）：一发请求拿「详情 + 各档音质与体积 + `label_info` 权益矩阵 + KRC 歌词 + 整曲/试听判定」，包入口转出 `getTrackDetail`/`getTrackMedia`/`TrackDetail`/`TrackQuality`/`QualityEntitlement`
  - **会员口径仍未验**：这两条都**匿名发、不带会话**（`getTrackDetail` 支持 `{ cookie }`，但 core 不默认附）。有 VIP 时 pc 口可能放行、**文件可能加密**——这是推测，`README.md` §11 与 api 包 `docs/APP_ENDPOINTS.md` §6 都标成假设，不是结论
  - mock 上游（`test/support/mockUpstream.ts`）加 `/luna/h5/track_v2` 路由：按 `device_platform` 决定放行还是回 `1000062`，`h5: false` 可让它回空 body 逼出 SSR 回落；`preview.start` 用**毫秒**（上游就是毫秒）
  - 离线单测：`test/trackDetail.test.ts` 5 条（单请求拿全、权益矩阵 vs 实际给到的档、试听区间、`link.media()` 走 h5 且不回落）、`test/media.test.ts` 补「h5 拒答时回落分享页」「两条都不通时错误里两条都写」并改首拉请求数断言（h5 + 音频 + 封面 = 3 次，零 `www.qishui.com`）、`test/player.test.ts` 切歌竞态的慢请求钩子改挂到 `/luna/h5/track_v2`

### Changed

- **推荐队列改成「只往后追加」：听过的不删、每首的序号从头到尾不变**（`player/queues.ts` 的 `QueueBook`）
  - **为什么**：滑动窗口再怎么谨慎也是「一边播一边删前面」——`roll()` 只在自然前进时踢一首，可界面拿到的是快照行号，队列随时在变（补批往尾挂、踢历史往前挪），点一行就有「播成隔壁那首」的窗口；而推荐是一条越听越长的流，「第 5 行」本来也不该每秒钟指向不同的歌
  - **现在**：`roll()` 整个删掉，`onPlayerQueue` 只做「记下播放头位置 + 该续批就续批」；队列**只长不缩**，同一首的序号从进队到落盘都不变。看历史靠界面那侧的固定窗口滚动（TUI 听歌页右栏），core 不管裁剪
  - **代价**：一条推荐流听久了会上百首，`queues.json` 也跟着大（曲目 `raw` 快照本来就剥掉不写）；要清掉只能换号 `reset()` 或界面收起队列，core 不再自动瘦身
  - **API**：`queues.stopRefill()` 删掉（「停止续播」这颗按钮整体下架），换成 **`await queues.loadMore(): number`** —— 队尾见底时界面主动要下一批，返回补进来的首数；非推荐队列 / 没在播的队列给 0 且不发请求，在途时再要也是 0。`refill()` 改收 `{ restart, force }` 并返回首数（`force` 跳过「剩 ≤2 才补」的门槛）
  - 剩 ≤ `RECOMMEND_REFILL_AT`(2) 首的**自动续批照旧**（`loadMore` 是叠加的手动触发，不是替代）；唯一还会停的仍是「连续 `RECOMMEND_MAX_FAILURES`(2) 批取不到」，停掉后 `QueueInfo.refilling` 变 `false`，界面据此提示「把当前模式再选一次就重新来一批」
  - 离线单测 `test/queues.test.ts`：原来钉「踢历史」的那几条改钉**只长不缩**（连按 12 次 `next()` 后队首仍是 `b1`、播放头每前进一步正好落在新的一号上、每批都整批 6 首、全程无重复且累计条数 = `feed.calls()×6`）；跳播那条改成「前面那段一首不动」；`stopRefill` 那条换成「每档各有一条流：切到别的档不影响这一档的续批」；新增 3 条钉 `loadMore`（队尾手动补一批并返回首数 / 在途时再要拿 0 / 歌单与临时队列返回 0 且零请求）

### Fixed

- **「再来一批」= 整台重来：新一批只装这批、从第一首起播**（`player/queues.ts` 的 `QueueBook.open()` + 新增 `resetPlayer()`/`liveOf()`）
  - **症状**：点 `[再来一批]` 刷出全新的 6 首之后 ① 不是从第一首开始，而是从中间某首；② 更凶的是「刚下载完就切下一首、又立马切第三首」，连着跳过好几首
  - **根因一（从中间开始）**：落盘是 300ms 防抖的，这一次写正好落在「取新一批」的 `await` 中间；老写法写盘前先 `park(activeId)`，把**播放器里还是旧批次**的曲目与 `resumeId` 反向写回书架 entry。推荐流本就会重复推同一首（实测 `queues.json` 里同一 id 出现在第 5 和第 17 行）→ 那个旧 `resumeId` 在新批次里找得着，就从那一首开始播
  - **现在**：`writeNow()` 只读不写书架（新增 `liveOf()` 取播放器当前形态），并用新增的 `liveId` 核对「播放器里装的到底是不是这一份」——换队列时 `activeId` 先变、曲目还在 `await` 里，那段时间不许把旧队列的位置记到新队列头上；`fill()` 也显式清掉 `resumeId`（新一批从头开始，上一批停在哪儿跟这批没关系）
  - **根因二（连着跳）**：`open({ refresh: true })` 过去只换书架里的批次，**播放器还在放上一首**（`startCurrent` 挂在 `resolve` 上、下载那几秒可以挂很久），新一批是「盖」在还在响的旧曲上换的，上一首的退出/收尾会连着把新一批的头两三首推过去
  - **现在**：refresh 分支先 `resetPlayer()` —— `player.clear()` 一并作废进度时钟、当前播放源和**还在路上的那一次解析**（`loadToken`），回到 `idle` 让上层（TUI 的 `sink.stop()`）停掉还在响的 mpv，新一批再从第一首干净起播；`applying` 挡在中间，免得「队列被清空」被 `onPlayerQueue` 当成「见底了，去补一批」
  - 换模式（`refresh` 为假但这一档还没取过批）仍是原语义：不 reset，取到就直接播。`↓` 到队尾和「剩 ≤2 首」的自动续批也照旧是**只往队尾追加**，不影响在播那首
  - 离线单测 `test/queues.test.ts` 补 2 条：整台重来（播放列表只剩新一批 6 首、`queue.index` 是 0、换批前先过一遍 `idle` 最后回到 `playing`）、慢批次期间那次防抖落盘不会把旧批次的位置复活

- **点队列尾部那一首：播的就是它，不删别人、也不被新歌顶掉**（`player/queues.ts` 的 `QueueBook` + 新增 `player.ts` 的 `Player.playQueueTrack(id)`）
  - **症状**：① 点队列靠后的一行经常「没反应」或播成隔壁那首；② 点尾部那首之后，前面一排**还没听过**的推荐整排消失，界面像被新补的一批顶掉了
  - **根因一（删歌 + 行号前移）**：`roll()` 无差别按 `index-1` 从队首删 —— 它假设「播放头前面的歌都听过了」。跳播（点第 9 行）、甚至 `setRepeat`/`setShuffle` 重发 `queue` 事件时这个假设都不成立，于是把还没听的推荐当历史踢掉；队列一前移，界面快照里的行号就对不上活队列，`jumpTo` 越界就静默返回（点了没反应）
  - **现在**：这条从源头没了——`roll()` 已整体删除，推荐队列只往后追加（见上面「Changed」）；界面点行也改走 `playQueueTrack(id)`（按曲目 id 定位，行号挪了也播你点的那首；找不着返回 `false`，由调用方给提示，不再静默）
  - **根因二（被新歌顶掉）**：见底续批 `refill(entry, true)` 的批次回来时**无条件** `player.next()`。这批在途的功夫里你点了队列里的一首，回来那一下正好把它跳过去
  - **现在**：只有「播放器仍是 `stopped` 且播放头还在原地」才自动接播，否则新批只挂到队尾
  - 离线单测 `test/queues.test.ts` 补 2 条：点尾部那首之后前面的曲目一首不丢、当前仍是点的那首；补批在途时点歌，批次回来只追加到队尾（`b3` 不再被顶成 `c1`）

- **推荐续批不再截断批次**（`player/queues.ts` 的 `QueueBook.refill()`）
  - **症状**：界面上「又补了一批 4 首」——上游一批明明是 6 首，缺的 2 首凭空没了
  - **根因**：续批把批次 `slice(0, room)` 钳进 `RECOMMEND_WINDOW_MAX`(8) 的窗口，队列当时 4 首就只装 4 首，**多出来的推荐直接丢掉**（推荐是随机流，丢了就再也取不到同一首）
  - **现在**：剩 ≤ `RECOMMEND_REFILL_AT`(2) 首就**整批收下**，给几首收几首，队列长一点无所谓；`RECOMMEND_WINDOW_MAX` 一并删掉（包入口不再导出）
  - 离线单测：`test/queues.test.ts` 那条窗口断言改成「每批都整批收下 + 上游给过的每一首都进过队列」（按 `queue-note` 收每次补的条数、并累计播放序里出现过的 id）

- **推荐队列不再默认开「单曲循环」**（`player/queues.ts` 的 `QueueBook`）
  - 推荐队列是一条**自动续批的流**：单曲循环会让播放头停在原地，`onPlayerQueue` / `onPlayerEnded` 的续批永远不触发 —— 一首歌无限重播，队列再也走不动
  - 现在 `recommend` 队列的循环**固定「关」**：新建时不管 `config.defaultRepeat` 是什么都按「关」起播；切走再切回时若书架里记着「单曲」，也降回「关」（其它队列不动）
  - 顺带修好「默认循环模式」这个设置：此前新队列的 `repeat` 硬编码成 `'off'`，设置页那一项等于失效；现在歌单 / 我喜欢 / 临时队列按 `config.defaultRepeat` 起播
  - 离线单测 `test/queues.test.ts` 补 3 条：配置默认单曲时推荐队列仍是「关」、推荐队列手动开过单曲后切回来变「关」、其它队列认配置

### Added

- **队列书架上限 `MAX_QUEUES = 10`（`player/queues.ts` 的 `QueueBook`）+ `recommendQueueId(ref)`**
  - 每张歌单、每档听歌模式各占一份队列，听久了会攒出几十份；现在 `open()` 之后若超过 10 份就**收起最久没用过的那份**（`Entry.usedAt` 记最近使用时间、`activate` 时刷新；在播的那份永不淘汰），收起的给一条 `queue-note` 提示、不静默丢。`list()` 按「最近用过」倒序
  - `recommendQueueId(ref)`（包入口导出）：把听歌模式（`preference:<mode>` / `scene:<id>`）翻成那份推荐队列的固定 id，界面据此查「这一档上次听到哪」（`QueueInfo` 的 `count` / `current`）
  - 离线单测 `test/queues.test.ts` 补 2 条：超过 10 份时收起最久没用的、在播那份不被淘汰
- **`core.queues`（`player/queues.ts` 的 `QueueBook`）：按来源分的多份播放队列 + 推荐队列的自动续批**
  - **问题**：`Player` 只有一条队列，界面上「换一批推荐 / 点一张歌单 / 搜一首歌」都是整队覆盖 —— 推荐流一旦被覆盖就回不去了，只能从头再取
  - **做法**：`Player` 仍然只有一条「在播队列」，`QueueBook` 在它上面管**多份**（`recommend` / `playlist` / `liked` / `temporary`），每份记自己的曲目、播到第几首、shuffle 偏好；切走时 `park()` 停放、切回 `activate()` 接着上次那一首，不重新取数。`applying` 守卫让「书架自己改播放器队列」不被误当成用户操作再触发续批；`refillGen` 作废在途取数
  - **四种策略**：`recommend` = **只往后追加**（听过的不删、序号不变；剩 ≤2 首补**一整批**、顺序播）+ 队列播完自动重启续批、连续 2 批失败停；`playlist` = 整张顺序播、每张一份（`playlist:<id>` / 本地 `local-playlist:<id>`）；`liked` = 随机；`temporary` = 每次 `open` 整队替换（所有浏览型结果共用一份 `temporary`）
  - **事件**：`queues-changed`（书架/索引变化，界面据此重画）、`queue-note`（续批失败、队列没取到曲目这类要说的话）；`useAccount()` 换号时 `queues.reset()` 整份清空
  - **接口**：`open(opts)` / `activate(id, startTrackId?)` / `remove(id)` / `list()` / `info()` / `loadMore()` / `reset()`，外加常量 `RECOMMEND_REFILL_AT=2` / `RECOMMEND_MAX_FAILURES=2`（包入口导出）
  - 离线单测 `test/queues.test.ts` 10 条：临时队列整队替换且顺序播、歌单切走再切回不重取、重新打开在播的那张歌单不跳回第一首、喜欢随机、推荐续批整批收下且索引不倒退、只有在播那份推荐队列标「自动续批」、推荐恢复不重取、连续 2 批失败停续批、换号清空
- **推荐请求的种子 `played_media`：口径对齐官方 App（反编译 `reaSodaMusic`）**
  - 新增 `buildPlayedMedia(core, opts)`（`src/playedMedia.ts`，包入口导出）：**待播队列**（当前曲目之后、逆序，`played_mills: -1` —— App 对「还没播」就这么标）→ **云端最近播放**（`GetRecentPlayedTracks`，账号级、跨设备，登录态才有）→ **本地 `journal/plays.jsonl`** 里云端没有的按时间新→旧补上；按 `media_id` 去重后截断到 **30 条**（`PLAYED_MEDIA_MAX`，与 App 的 `MAX_COUNT` 同一个值）。`includeQueue`/`includeCloud`/`includeLocal`/`limit` 可分别关。云端没有「听了多久」，本地同曲记录有就补 `played_mills`、没有就不填（不编 0）。未登录/云端失败只剩本地那半，不抛错、不阻断推荐
  - `feedSongTab()` 默认带 `played_media`（`withPlayedMedia: false` 关），并按 App 的字段集补齐 `is_did_first_request` / `did_first_use_time` / `feed_counts.mix_session_count`，偏好档也按 App 塞进 `feed_preference: {preference_mode}`（顶层 `preference_mode` 降级为兼容字段）。`did_first_use_time` 我们没有 App 那个落盘值，用**本机最早一条播放记录的时刻**当代理（`PlayHistory.firstAt()`，新增），没有历史就取当前时刻；`is_did_first_request` = 进程内第一次请求且本机还没有播放记录
  - `catalog.related()` 补齐 App 口径：`media_list` 仍是**1 个种子**，另带该曲全部 `artist_ids`、`scene_name`（默认 `'search'`，App 那条队列就是「搜索推荐」）与 `played_media`。保留两处有意差异：`full_media: true`（要完整实体）与 `req_count`（条数由调用方定）
  - `radioTracks()` 补齐 App 口径：`radio_id` + `cursor` + `flow_type`（默认 2）+ `trigger_info`（默认 `''`）；新增 `radioFlowParams(resource.raw)`，按 App 的做法从队列资源 `style.link` 的查询串里抠后两个参数
  - 离线单测：`test/playedMedia.test.ts` 5 条（队列逆序/本地/云端+本地混合去重/30 条截断/开关）+ `test/discover.test.ts` 6 条（会话字段、`is_did_first_request` 两态、`withPlayedMedia: false`、radio 参数与 `radioFlowParams`）+ `test/catalog.test.ts` 2 条（`related` 请求体逐字段断言、只给 id 时的 `artist_ids` 补取）

- **`Player.removeFromQueue(position)` + `PlayQueue.removeAt(position)`：按「播放顺序」从队列里移除一首**（TUI 播放页右栏的「从队列移除」）
  - 老接口 `PlayQueue.remove(index)` 收的是**加入顺序**下标，而界面（TUI 播放页队列、CLI 的 `queue`）画的是**播放顺序** `playOrder`：随机播放时两者不是一回事，同一首还可能在队列里出现两次（`enqueue` 允许重复），拿 id 反查 `items` 会移错行。新方法直接按 `order` 里的位置取，移除位在当前曲目之前时游标跟着左移（保持「还是在听这一首」）
  - `Player.removeFromQueue` 移完发一次 `queue` 事件（界面才有得重画）；**移掉的正好是当前这首就接着播新的当前**，队列空了就 `stop` —— 否则会留下「在响 A、队列说 B」的分裂状态
  - 离线单测 `test/player.test.ts` 2 条：移当前这首会切到新的当前、队列移空会停、不存在的位置不动也不发事件；随机播放下仍按「界面看到的那一行」移除

- **本地库 `core.local`：本地喜欢 / 本地歌单 / 音乐文件夹（纯本地、不出网、跨账号共享）**
  - **落盘**：`<数据目录>/local/library.json`（`paths.localLibraryFile`）—— 一张表三件事：`tracks` 曲目快照索引（本地文件与云端曲目都留一份，列表页因此离线也能画；快照刻意**不留** `raw` 上游原始响应与 `state` 我态水印，后者会过期）、`likes`（加入顺序）、`playlists`（`keys` 指向索引）、`folders`（音乐文件夹绝对路径）。同步读 + 原子写（`LocalLibraryStore`）：菜单要在同一帧里知道「这首在不在本地喜欢里」，一个 await 就会让行操作菜单晚一帧才出来
  - **曲目键只有两种**：本地文件 `local:<路径 sha1 前 16 位>`、云端曲目 `track:<id>`（`localKeyOf` / `local.keyOf`）。本地喜欢与本地歌单因此能混装两者
  - **文件夹扫描** `local.scan(folder)` / `scanAll()`：递归收 20 种音频扩展名，跳过隐藏项、**不跟符号链接**（软链成环会卡死），上限 5000 文件 / 12 层目录、到上限标 `truncated`；**只认文件名**（`01 - 艺人 - 歌名.flac` 猜艺人/曲名，专辑名用目录名），不引第三方 tag 解析库 —— 时长交给播放器报回来（`local.rememberDuration` 回填快照）。目录读不到返回 `error` 而不是抛，一个坏目录不毁整次扫描
  - **本地喜欢**：`like/unlike/toggleLike/isTrackLiked/likes()`，不联网；**本地歌单**：`createPlaylist/renamePlaylist/deletePlaylist/addToPlaylist/removeFromPlaylist/playlistTracks()`，全在本地库上做，不需要会话
  - **本地文件播放**：`TrackData.localPath` 即播放源 —— `PlaySource.kind` 新增 `'local'`，`Player.startCurrent` 遇到 `localPath` 直接 `local.sourceFor()`（文件不在了就报「本地文件不在了」，不去撞上游分享页），不再走 `media.resolve`；`media.recordPlay` 与「上报最近播放」对本地曲目跳过；`lyricsFor()` 对本地曲目直接 `undefined`（磁盘文件没有上游歌词）
  - **播放历史带上路径**：`PlayRecord` 新增 `path`（`source: 'local'` 时是绝对路径），本地历史据此能重播文件；`local.history(limit)` 是 journal 的曲目视图（纯本地拼装、不发一个请求），`local.clearHistory()` 只清本机 journal
  - `parseTrack/parseTrackRef` 透传 `localPath`（上游没有这个字段），否则过一次 `core.track()` 就把「这是磁盘文件」丢了
  - 离线单测 `test/local.test.ts` 15 条：文件名解析与键稳定性、递归扫描（隐藏项/非音频/上限/坏目录）、文件夹去重与「找不到」、本地喜欢落盘后重开可读、本地歌单增删改、本地文件播放（`source.kind='local'` + 历史记 `path`）、文件被删的报错口径、本地曲目无歌词、历史曲目视图 —— 全程零上游请求（`mock.count()` 断言）
- **听歌模式收成一个值、一处取批**（TUI 把侧边栏第 3 项从「电台」重做成「听歌」单选台的后端口子）：
  - `FeedModeRef = {kind:'preference', mode} | {kind:'scene', radioId}` —— 「当前用哪个模式听」的唯一形态；配 `formatFeedMode()` / `parseFeedMode()`（文法 `preference:<mode>` | `scene:<radioId>`，**认不出或空串一律 `undefined`，不猜**——场景是短数字、首页 `discover_radio` 是雪花 id，「纯数字就当场景 id」这种隐式判定等于替上游下结论）。三个连同 `FEED_PREFERENCE_MODES` 都从包入口导出。
  - `config.feedMode: string`（默认 `''` = 没选过）：上游**没有**「保存听歌模式」的写接口，`feed_mode_bar` 也只回它自己当前的那一条，所以这一项声称的是「本机记住的偏好」，不是上游状态。它同时是全仓唯一带写回通道的配置项（`saveConfig()`），CLI `config set` 的白名单直接取 `CONFIG_DEFAULTS` 的键、字符串原样透传，**不用改 CLI**。
  - `discover.feedModeTracks(ref, opts)`：按模式取一批的收门——偏好档走 `FeedSongTab`、场景档走 `FeedRadioTracks`，上层不必自己分流。
  - 离线单测 `test/discover.test.ts` 6 条：`parseFeedMode`/`formatFeedMode` 往返与坏值、`feedModeTracks` 用 mock 上游断言两条档各打哪个端点。
- **登录同时交出两条二维码出路**：`QishuiLogin` 增加 `qrPng`（api 透传的上游官方图）与 `qrImage` —— core 顺手把它落到 `${TMPDIR}/qishui-login-qr-<token 前 8 位>.png`（**0600**：码里编着登录 token，临时目录又是共享的），`onQr` 回调与返回值给的是同一个路径。上游没给 `data.qrcode`、或文件写不进去 → `qrImage` 为 `undefined`，登录照常进行（出图只是便利，不拦路）。离线单测补 2 条：给了 PNG 就落盘且内容/权限对、没给就是 `undefined`

### Changed

- **缓存账号隔离的判据从「端点类别」改成「这一路回不回实体」**：`KIND_SCOPE` 里 `search` / `discover-home` / `discover-mix` / `feed-song-tab` / `playlist-square` / `radio-tracks` / `artist-tracks` / `artist-albums` / `featured` 从 `public` 挪到 `viewer`（落 `_acct/<uid>/`），只有「只回关键词/枚举/配置」的 `sug` / `suggest-words` / `categories` / `feed-mode` / `launch` / `report-reasons` 继续跨号共享。理由写在 `cache/policy.ts` 的注释里：实测（带会话，见 `packages/qishui-api/test/probe-state.ts` 与 `probe-state2.ts`）Search / FeedSongTab / GetChartDetail / MGetMedia / GetArtistDetail 的响应里都嵌 `state.is_collected`，把 A 号的「已喜欢」缓存给 B 号看就是假状态。连带把实体的三态水印显式化：`Track.liked` / `Album.collected` / `Playlist.collected` / `Artist.following`（响应没带 `state` 就是 `undefined`，不当「没收藏」）。`test/store.test.ts` 与 `test/session.test.ts` 里三条旧断言（把 `search` 当 public）跟着改成新口径，并补上「`sug` 仍跨号共享」这一面
- **`feedSongTab` / `radioTracks` 的口径写清：是「连着播的批次来源」，不是浏览列表**（注释 + README，行为没改）：上游实测两条都**一次只随机回约 6 首**（`items[6]`），而下游曾拿它当「一屏可滚的推荐流/场景列表」做过界面（硬写 `count: 30` 去凑、`hasMore: false`）——那是假象，每进一次都是另一批随机结果。`feedModes()` 的注释同步改成「选出来的那一个喂 `feedModeTracks()`」（只能有一个当前值）。
- **测试从冒烟台改为 vitest 单测**：删 `test/smoke.ts`（真打上游），新增 `test/*.test.ts` 10 个文件（session/store/catalog/search/media/player/history/parse/paths/policy + `support/mockUpstream.ts`）——**全程零网络**：注入 mock fetch + 独立数据目录，覆盖旧冒烟台的可离线断言（缓存命中零请求、媒体断点/校验、播放器状态机、多账号机制）；上游契约回归只由 `qishui-api` 实测台负责。`pnpm --filter qishui-core run test` 跑（先 `pnpm run build`，测试从 `../dist` 导入）
- **`createQishui({account})` 严格化**（`--as` 的后端通道）：uid/昵称没入库 → 构造期抛「没有账号 …（已入库：…）」；登出留下的空壳号 → 抛「没有留存会话」。**不再静默回落到激活号**——指错号还照常跑是最危险的形态。`config.activeUid`（持久化默认值）照旧软回落 lastUsedAt，两套语义在 `SessionOptions` 上显式分成 `explicitUid` / `activeUid`

### Fixed

- **缓存写盘失败会把整条调用带崩**（盘满 / `~/.qishui` 只读 / 权限不对时）：`EntityCache.set()` 原来 `await writeJsonAtomic()` 不接错，`EROFS`/`ENOSPC` 直接冒到 `fetch()` 外面——搜索、详情、歌单这些明明上游已经回数据了，却整条报错（实测：只读 home 下 `qishui artist <id> --albums` 直接 `EROFS` 退出）。缓存是**尽力而为**：内存里已经命中，落盘只影响下次冷启动，现在写盘失败只经 `logger` 提示一次、照常返回结果。离线单测 `test/store.test.ts` 一条（把数据根指到一个文件上，必然 `ENOTDIR`，断言 `fetch` 照常回值、只提示一次）
- **场景模式选不中：选「日语」推中文歌**（听歌页/CLI 的场景档全错在这条路上）：`feedModeTracks({kind:'scene'})` 原来分派到 `FeedRadioTracks {radio_id: scene_mode_id}` —— 那条路的 `radio_id` 是**电台队列**的 id（首页 `discover_radio` 的 `inner_block_id`，雪花大数），喂场景的短数字**不报错、也不生效**，回的是通用推荐池（实测 `radio_id=30`「日语」/`8`「助眠」/`999999999999` 三档各回 6 首、内容同一类中文流行）。现在场景档改走 `FeedSongTab`，场景 id 落在扁平 `feed_preference: { scene_mode_id }` 上——实测 `30` 回 12 首里 9 首日文（中島美嘉/米津玄師/まふまふ…）、`10` 粤语、`32` 古典（Mozart/巴赫）、`22` K-pop（aespa/MOMOLAND），`count=12` 就回 12 首。套一层 `{scene_mode:{scene_mode_id}}` 的形状不生效（同样回通用池），已在 `FeedSongTabOptions.sceneModeId` 上写明
- **`FeedModeRef` 的场景改成「只能是场景」**：`{kind:'scene', radioId: string}` → `{kind:'scene', sceneModeId: number}`。`config.feedMode` 的 `scene:` 后面现在只认纯数字（老版本可能把雪花 id 写进去过，那是电台队列不是场景 → 按「没选过」处理，宁可重选也不把电台当场景播）。`FeedModeOption.radioId` 同步改成 `sceneModeId?: number`，`radioTracks()` 的注释与 README 口径一并纠正（它是电台队列，不是场景）
- **场景批次不再串味**：`feedSongTab` 的缓存键带上 `@scene<id>`（原来只有 `preference_mode`，两个场景会顶掉对方那一批；ttl 0 只是不落盘、内存里还在）
- **搜索结果分组认不出「这一组是什么类型」**（TUI「查看全部」404 的根）：`SearchGroup.type` 是上游 `display_type`，实测 `Search`（`/luna/search/<type>`）每个分组都回**空串**，而分组真正的判别在 `group.id`（实测 `top_results` / `playlists` / `artists` / `tracks` / `albums`）。上层一旦拿 `display_type` 当 `search_type`，请求就打 `/luna/search/` → **HTTP 404**。现在解析时补两个派生字段：`searchType`（`id` 复数 → 单数 `track`/`album`/`artist`/`playlist`；聚合组 `top_results` 映射不到就 `undefined`，不硬凑一个类型）与 `viewAll`（上游 `display_view_all` 原样转布尔，实测「你可能想搜」`false`、其余四组 `true`）——「要不要给查看全部」「这组该用哪个 type」从此只在 core 一处判断。`display_type` 仍原样留在 `type`，注释写明它不是 `search_type`。离线单测：`support/mockUpstream.ts` 的 `/luna/search/<type>` 复刻实测形态（三个分组带真实 id 与 `display_view_all`，**非那 7 个 type 直接回 404**，这条回归一旦被写回就红），`test/search.test.ts` 4 → 6 条
- **按 `l` 一直提示「已取消收藏」、歌也不从「我喜欢的音乐」里走**（TUI 列表页/曲目详情与 CLI `liked check` 共用这条读路径）：`like/unlike` 只失效了 `collectionCache()` 那五档，**漏了 `playlist-detail`**——我的喜欢就是「我喜欢的音乐」（`type=1` 那张自动歌单），`likedTracks()`/`isLiked()` 是从 `GetPlaylistDetail` 重算的，而那一档是 `entity`（6h）。结果写完清掉的只是派生结果、重算时读回的仍是旧页：取消喜欢 → 条目没走 → 下次仍判「已喜欢」，来回按都是同一句。现在写后失效补齐 `playlist-detail`（加歌/删歌原本各自显式带的那条并进同表，不再两处各写一遍），并按 id 清被动过的实体详情（`track`/`album-detail`/`artist-detail`，响应里嵌着「我是否收藏/关注」；只清动过的 id，不把整个 entity 档抹掉，免得白打上游）。新增 `test/library.test.ts` 5 条离线单测（`support/mockUpstream.ts` 补 `/luna/me/playlist` 与 `collection/track[/delete]` 的**有状态**路由：写接口改集合、歌单详情按集合回曲目），断言写完读回真值、取消后条目真的走掉、id 级失效不误伤邻居——把 `playlist-detail` 从失效表里摘掉，其中 2 条当场红
- **扫码登录「显示成功却没入库」（TUI 登录态不刷新的根）**：`QishuiLogin.status()` 只透传上游探测，**入库+激活只挂在 `wait()` 里**——上层（TUI 登录弹层）先轮 `status()` 看到 confirmed、再补一次 `wait()` 想让它走完流程，而 `wait()` 会重新问一遍 `check_qrconnect`，二维码在登录完成后上游常改口 expired/unknown，于是 `persist()` 一次没跑：cookie 没进 `accounts/<uid>.json`、`activeUid` 还是 undefined、`account-changed` 没发。现在 confirmed 是**单向门**：任一入口（`status()` / `wait()`）观测到 confirmed 就当场做且只做一次入库，之后无论上游怎么改口都回 confirmed；`wait()` 改走同一条探测路径，不再另起一轮 `check`。离线单测补 4 条（`support/mockUpstream.ts` 新增 passport `get_qrcode`/`check_qrconnect` 路由，扫码状态可按脚本回放、confirmed 那次下发 `sessionid`）：status 路径入库、确认后上游改口 expired、纯 wait 路径（CLI）不回归、`GetMyInfo` 拿不到身份时 cookie 仍落 `_anon.json`
- **confirmed 不再等于「假装登录成功」**（上一条的续命漏洞）：`persist()` 原来是先把 cookie 灌进内存态 `this.current` 再去写文件，写盘一失败（`accounts/` 被占、只读盘、权限）就成了「界面显示已登录、账号文件一个没有」——重启即蒸发又不自愈。现在**先落盘、后认这条登录**；入库失败时 `status()` 直接抛错并记一条 `[session] 上游已确认登录，但入库失败（下次轮询重试）`，`confirmed` 单向门不回退但这次入库**作废重试**（不会重复问上游），成功之后 `loggedIn`/`activeUid`/`account-changed` 一起到位。离线单测补 1 条：用「`accounts` 是个普通文件」逼出入库失败，断言 `loggedIn=false` → 清掉障碍 → 下一次 `status()` 自己补成 `confirmed` 且 `check_qrconnect` 次数不增
- **试听片段：进度时长错、歌词错位**：分享页给的音频常常只是片段（`演员` 整曲 261.3s，实际 208.9s 起长 52.3s）。`media.resolve` 现在按分享页 `offsetDuration`/`offsetStart` 给出**片段时长** `durationMs` 与 `clipStartMs`，并把区间记进 `track.playableRange`（媒体 meta 升 **v2**；读到 v1 命中只重拉一次分享页补片段信息，音频文件继续用、不重下）。`Player.durationMs` 改为「外部真实时长 > 播放源时长 > 元数据」，新增 `Player.setDuration(ms)`（上层播放器报实际时长）、`clipStartMs` / `songPositionMs`；`lyricState()` 自动把片段起点加回去，歌词不再从 0 开始对不上
- **榜单名次丢失**：上游实测 `track_ranks[].rank` 只有 `rank_type/rank_delta/track_id`，**没有名次数字**，`parseChart` 原来死磕 `rank.rank` 导致 `ChartData.ranks[].rank` 恒为 undefined（CLI `chart <id>` 的名次列整列空白）。现按「数组位次」补名次（跳过非曲目项后 1..n，与 App 显示一致）；上游若哪天给了数字仍优先用数字
- **频繁切歌会异曲同播**：`startCurrent()` 加 loadToken，异步解析晚回来的上一首 `PlaySource` 直接丢弃（`stop()`/`clear()` 也会作废在途解析），不再出现「队列已是新曲、却在响旧曲」的串台

## 0.2.0 — 2026-10-17

### Added

- **多账号会话**：登录态拆成 `device.json`（设备身份，全体账号共用一台「设备」，换号不触发新注册）+ `accounts.json`（索引）+ `accounts/<uid>.json`（每号一份 cookie，0600）。`login()` 新号入库并默认激活、**不再覆盖旧号**（`keepActive` 可只入库不切）；新增 `accounts()` / `activeUid` / `useAccount(uid|昵称)`（cookie jar **先清后灌**，杜绝跨号残留）/ `logout({purge})` / `reset()`；`CoreEvents` 增 `account-changed`；`createQishui({account})` 支持单实例临时激活（CLI `--as` 走这里，不改 `config.activeUid`）
- **缓存账号隔离维度**（与 TTL 档位正交，同在 `policy.ts` 唯一真相）：`CacheScope`（`account` 私有 / `viewer` 带我态 / `public` 共享）+ `KIND_SCOPE` + `scopeFor()`。带态 kind 落 `cache/entities/_acct/<uid>/`，两号互不可见；媒体缓存（匿名分享页来源）跨号共享。`EntityCache` 增 `clearMemory()`（切号作废内存态）、`invalidateAccount(uid)`、`clearShared(kind)`
- **播放历史按账号分文件**：`PlayHistory.setScope(uid?)` → `journal/<uid>/plays.jsonl`；未登录/迁移前继续写 legacy `journal/plays.jsonl`
- `config.json` 新增 `activeUid`（`useAccount`/登录/登出写回，可手改）
- **缓存分档 `src/cache/policy.ts`（唯一真相）**：`CacheTtl` + `CACHE_TIERS`（`none`/`entity`/`chart`/`config`/`staticEnum`/`account`），各服务只引用档位、不写死秒数。原则：**只有长时间不变的数据才落盘**，实时数据 `ttlMs: 0`（`EntityCache.set` 见 0 跳过写盘）。全部 40 处 `cache.fetch`/`cache.set` 已改引用档位；导出 `CacheTtl`/`CACHE_TIERS`/`CacheTier`/`CacheTierKey`
- `discover.feedModes()`：解析 `FeedMode` → `{preferences, bar, scenes}`。`preferences` 是已知的推荐/熟悉/新鲜三项（`FEED_PREFERENCE_MODES`，`current` 标上游选中的），`scenes` 是 45 个场景（`radioId` 即 `scene_mode_id`，可直接 `radioTracks()`）
- `discover.feedSongTab({ preferenceMode })`：偏好流，`default`/`familiar`/`fresh`
- **`feedSongTab` 请求按 App 口径补全**（`FeedSongTabOptions`）：`feed_mode: 'track'`、`count`、会话计数 `is_first_request`/`total_request_count`/`preference_mode_request_count`。`played_tracks` 机制已实现（本地播放历史最近 20 条按时间升序；`TrackPlayed` 在 IDL 里是 opaque `any`，字段名按同构 `MediaPlayed` 推，实测上游全收、`count=3` 就回 3 首），但 `withPlayedTracks` **默认 false** 不带——播放时长还没向上游上报，主动带会暴露「只播不报」；「熟悉/新鲜是否改变出歌分布」仍未验证
- **`feedSongTab` 客户端过滤**：`excludePlayed`（本地 journal 最近 500 条）/`excludeLiked`（需登录，拉不到跳过）/`maxPages`（默认 3，翻页补齐到 `count`）——「只要没播过的」走确定性过滤，不赌上游 `preference_mode`
- `discover.radioTracks(id: string | number)`：短数字 `scene_mode_id` 也能当 `radio_id`（实测两种 id 都吃）

### Changed

- **旧版单账号 `session.json` 由 `SessionManager.init()` 一次性迁移**：拆出 device.json + accounts/（原件改名 `.bak`），并清掉共享位上旧版落过的私有/带我态 kind（代价是一次冷拉，防串号）
- `rememberIdentity` 只在 **uid 真的换人**时才回调写 `config.activeUid`：`--as` 临时实例里 `me()` 顺手记昵称不再把临时号写成默认激活
- **实体元数据缓存从 30 分钟改成 6 小时**（专辑/艺人/歌单详情、曲目元数据），榜单 30 分钟；`entityTtlMs` 配置退化为兜底（所有调用点都显式传档位）
- **写后失效补全**：`library` 新增 `collectionCache()`，收藏/歌单所有写方法统一 `invalidate({kind:'playlist-detail'}, ...collectionCache())`；`collectMedia`/`uncollectMedia` **之前完全没失效**，现补上；`social.follow`/`unfollow` 追加失效 `me`
- 冒烟 `test/smoke.ts` 增到 **46 步**：缓存分档断言（「实时数据不落盘」「元数据落盘第二次零请求」）+ **多账号机制段**（旧 session.json 迁移、`_acct/<uid>` 互不可见、切号编排/cookie 无残留、`--as` 临时态、`logout --purge` —— 该段全程零网络）

### Fixed

- **搜索只出歌曲的 bug**：`unwrap()` 原来只剥 `*_wrapper`（外加一个 `track` 特判），没剥搜索结果的 `entity.<kind>`（`entity.artist`/`entity.album`/`entity.playlist`），导致 `search --type artist|album|playlist`（以及 `all` 的非歌曲分组）实体全为空；`tracks/albums/artists/playlists` 现都解析得出
- **`unwrap()` 剥壳规则重写**：`*_wrapper` 照剥；对**没有字符串 `id`** 的对象，只要**恰好命中一个**实体键（`track`/`album`/…）就落到该实体上 —— 这样既认 `entity.artist` 这种单键壳，也认 `track_wrapper: { track, limited_free_info }` 这种「实体键 + 附属元信息」。**用「无 id」把包装与真实体分开**，曲目自带的 `album` 字段不会被误剥（此前按「键全在实体名集合里」判，会漏掉带 `limited_free_info` 的 `track_wrapper`，把 `catalog.track()` 这类详情打空）

### Removed

- **弃用 h5 版搜索 `Search2023`**：不再调用（旧 h5 接口、要登录、可能过时且易被风控）；`SearchPageOptions.h5` 一并去掉，搜索只走匿名 `/luna/search/<type>`

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
