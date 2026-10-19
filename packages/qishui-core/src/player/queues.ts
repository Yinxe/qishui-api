/**
 * 播放队列书架：**同一时刻只有一份在播，但不是只有一份存在**。
 *
 * 早先播放器只有一个队列，谁点播谁就把它覆盖掉 —— 听推荐听到一半去点了张歌单，
 * 推荐那条流就没了。这里把「队列」变成有名字、各自记位置的东西，按来源分四种策略：
 *
 * | 种类 | 谁产生 | 曲目 | 策略 |
 * |---|---|---|---|
 * | `recommend` 推荐 | 听歌模式（场景 / 新鲜 / 熟悉 / 默认） | 上游每次给一小批（实测 6 首） | **只往后追加**：听过的不删、每首的序号从头到尾不变（界面按固定 10 行的窗口来回滚动看这条流）；剩 ≤2 首自动补**一整批**（一批几首收几首，不截断），队尾见底时界面也能主动要下一批；**顺序播、不随机** |
 * | `playlist` 歌单 | 每张歌单一份（本地歌单也算） | 整张 | 顺序播；切走再切回来接着上次那一首 |
 * | `liked` 我喜欢 | 「我喜欢的音乐」/ 本地喜欢 | 全部 | **随机** |
 * | `temporary` 临时 | 搜索 / 榜单 / 专辑 / 艺人 / 首页推荐块 | 这一次点播的那一批 | 顺序播；**每次点播整队替换上一批**（临时就是不留旧账） |
 *
 * **循环模式**：新队列的默认循环取 `config.defaultRepeat`（设置页的「默认循环模式」），
 * 唯独推荐队列**固定「关」**——它是一条自动续批的流，单曲循环会让播放头停在原地、
 * 续批（`onPlayerQueue` / `onPlayerEnded`）永远不触发，一首歌就无限重播了。
 *
 * 「在播的那一份」仍然是 `Player` 里那个 `PlayQueue`（时钟、歌词、mpv 都对着它），
 * 书架只负责**换出去时存位置、换回来时装回去**，以及在推荐队列上跑续批（只往队尾追加，
 * 已经排好的那些一首不动 —— 界面上第几行从头到尾是同一首）。
 * 取数（歌单曲目 / 喜欢列表 / 推荐批次）由调用方给 `load` 或 `feed`，书架自己不猜上游。
 *
 * **上限**：书架最多同时留 `MAX_QUEUES`（10）份队列 —— 每张歌单、每档听歌模式各占一份，
 * 听久了会攒出几十份。超了就在开新队列时**收起最久没用过的那份**（在播的那份永不淘汰），
 * 并给一句提示。界面里的「播放队列」页把这份书架摆出来，可切换、可删。
 *
 * **持久化**：书架每次变化都落盘 `<数据目录>/queues.json`，启动时读回来 —— 重启后书架还在、
 * 每份队列还记着上次听到哪一首，切过去接着听。落盘的是曲目**快照**（去掉上游原始响应 `raw`，
 * 它只增体积、不参与播放），所以离线也看得见、点得开（真播还得联网解析，照实由播放器报错）。
 * `load` 是回调、进不了 JSON：曲目当初没落进盘的那份，重启后要回列表页重新点播一次才补得上。
 * 换号仍然整架作废（`reset`），作废后那一次也会写回盘，不会把上个号的书架留给下一个号。
 */
import { mkdirSync, renameSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import type { RepeatMode } from '../config.js'
import type { QishuiCore } from '../core.js'
import { type FeedModeRef, formatFeedMode } from '../services/discover.js'
import type { TrackData } from '../types.js'
import { readJsonSync } from '../util.js'

export type QueueKind = 'recommend' | 'playlist' | 'liked' | 'temporary'

/** 后面还剩这几首就去补下一批（一批约 6 首，再晚会听见停顿） */
export const RECOMMEND_REFILL_AT = 2
/** 连续这么多批取不到就停掉自动续播（不留重试定时器） */
export const RECOMMEND_MAX_FAILURES = 2
/**
 * 书架最多同时留存这么多份队列。每张歌单 / 每档听歌模式各占一份，听久了会越攒越多
 * （读者可能点了几十张歌单），这里做上限：超过就**收起最久没用过的那份**（在播的那份永不淘汰），
 * 界面里给一句提示，不是静默丢。
 */
export const MAX_QUEUES = 10

export interface QueueInfo {
  id: string
  kind: QueueKind
  title: string
  /** 这份队列里现在有几首 */
  count: number
  /** 播放顺序里的当前位（-1 = 还没定位） */
  index: number
  /** 当前（或停放在这个位置）的曲目名：书架与听歌页用来说「上次听到哪首」 */
  current?: string
  /** 是不是播放器正在放的那一份 */
  active: boolean
  /** 还会自动续批（推荐队列且还有档位可取 —— 只有「连续几批取不到」会把它停掉） */
  refilling: boolean
}

export interface OpenQueueOptions {
  kind: QueueKind
  /** 队列 id；不给就按 kind 生成（歌单用 `playlist:<id>`，其余三种各一份） */
  id?: string
  title: string
  /** 取曲目（歌单 / 我喜欢：第一次打开时调一次，之后切回来用存下的那份） */
  load?: () => Promise<TrackData[]>
  /** 临时队列：这一次装进去的曲目（**整队替换**上一批） */
  items?: TrackData[]
  /** 从哪首开始（按 id 定位；找不到就从头） */
  startTrackId?: string
  /** 推荐队列按哪个听歌模式取批 */
  feed?: FeedModeRef
  /** 打开时是否随机（`liked` 默认开，其余默认关；显式给了就照给的） */
  shuffle?: boolean
  /** 已经取过曲目也重新取（「按这个模式重新来一批」） */
  refresh?: boolean
}

interface Entry {
  id: string
  kind: QueueKind
  title: string
  /** 存着的曲目（加入顺序）与上次听到哪一首 */
  items: TrackData[]
  index: number
  /** 换出去那一刻在播的那首：切回来从它接着听（随机队列的 `index` 对不上 `items`） */
  resumeId?: string
  repeat: RepeatMode
  shuffle: boolean
  load?: () => Promise<TrackData[]>
  feed?: FeedModeRef
  /** 曲目是否已经取过（歌单/喜欢只取一次；推荐每批由续批补） */
  loaded: boolean
  /** 连续几批没取到（每档推荐队列各自记，`RECOMMEND_MAX_FAILURES` 到了就停这一档的续批） */
  failures: number
  /** 最近一次被打开 / 切到（单调递增序号）：书架满了按它淘汰最久没用的那份 */
  usedAt: number
}

/* --------------------------------------------------------------- 落盘 */

/** 盘上的一份队列：`load` 是回调进不了 JSON，曲目快照去掉 `raw`（上游原始响应，不参与播放） */
interface StoredQueue {
  id: string
  kind: QueueKind
  title: string
  items: TrackData[]
  index: number
  resumeId?: string
  repeat: RepeatMode
  shuffle: boolean
  feed?: FeedModeRef
  loaded: boolean
  usedAt: number
}

interface QueueFile {
  v: 1
  queues: StoredQueue[]
}

/** 播放器里那份队列的当前形态（`liveOf` 的返回值：落盘与停放都取它，不再各自翻 `player.queue`） */
interface LiveQueue {
  items: TrackData[]
  index: number
  resumeId?: string
  repeat: RepeatMode
  shuffle: boolean
}

const QUEUE_KINDS: QueueKind[] = ['recommend', 'playlist', 'liked', 'temporary']

/** 把盘上的任意形状收拾成可用形状（手改坏了 / 半截文件都不炸，同 `local/store.ts` 的口径） */
function normalizeQueues(raw: unknown): StoredQueue[] {
  const list = (raw as QueueFile | undefined)?.queues
  if (!Array.isArray(list)) return []
  const out: StoredQueue[] = []
  for (const node of list) {
    if (!node || typeof node !== 'object') continue
    if (typeof node.id !== 'string' || !QUEUE_KINDS.includes(node.kind)) continue
    out.push({
      id: node.id,
      kind: node.kind,
      title: typeof node.title === 'string' ? node.title : node.id,
      items: Array.isArray(node.items) ? node.items.filter((t) => t && typeof t.id === 'string') : [],
      index: Number.isInteger(node.index) ? node.index : -1,
      resumeId: typeof node.resumeId === 'string' ? node.resumeId : undefined,
      repeat: node.repeat === 'all' || node.repeat === 'one' ? node.repeat : 'off',
      shuffle: node.shuffle === true,
      feed: node.feed && typeof node.feed === 'object' ? node.feed : undefined,
      loaded: node.loaded === true,
      usedAt: Number.isFinite(node.usedAt) ? node.usedAt : 0,
    })
  }
  // 手改超了上限就留最新的 MAX_QUEUES 份（淘汰口径与内存里一致：按 `usedAt`）
  return out.sort((a, b) => b.usedAt - a.usedAt).slice(0, MAX_QUEUES)
}

/**
 * 推荐队列的 id：**一档听歌模式一份**（`recommend:preference:familiar` / `recommend:scene:30`）。
 *
 * 早先所有推荐流共用一条 `recommend` 队列：换个场景，上一档的批次与位置就被清掉了。
 * 现在每档各占一条，切走再切回来接着上次那一首（书架 `Q` 里也能看到每档一条）。
 */
export function recommendQueueId(feed: FeedModeRef): string {
  return `recommend:${formatFeedMode(feed)}`
}

/** 没给 id 时的默认 id：推荐按听歌模式分份，我喜欢 / 临时各一份，歌单按来源区分 */
function defaultIdOf(opts: OpenQueueOptions): string {
  if (opts.kind === 'playlist') return `playlist:${opts.id ?? opts.title}`
  if (opts.kind === 'recommend' && opts.feed) return recommendQueueId(opts.feed)
  return opts.kind
}

export class QueueBook {
  private readonly entries = new Map<string, Entry>()
  private activeId?: string
  /**
   * 播放器里现在装的到底是哪一份（`activate()` 走完 `playList` 才更新）。
   * 换队列时 `activeId` 先变、曲目还在 await 里取，那段时间播放器里仍是**上一份**的队列 ——
   * 落盘/停放都要按这个字段核对，才不至于把旧队列的曲位置和 `resumeId` 记到新队列头上。
   */
  private liveId?: string
  /** 本类自己在动播放器队列时置位：`queue` 事件会把自己再叫一遍（换队列时装回去那一下不算用户动作） */
  private applying = false
  /** 互斥：一批还在取的时候不再取第二批 */
  private refillPending = false
  /** 换队列后作废在途请求：慢回来的那批不能落进队列 */
  private refillGen = 0
  /** 「最近使用」的单调序号：`usedAt` 的分配源（不依赖墙钟，只看先后） */
  private seq = 0
  /** 落盘防抖：连续变化（换曲 + 续批）只写一次；退出前 `flush()` 收尾 */
  private saveTimer?: NodeJS.Timeout

  constructor(private readonly core: QishuiCore) {
    this.hydrate()
  }

  /* ------------------------------------------------------------ 持久化 */

  /** 读回上次那份书架（构造时一次）：曲目、播到第几首、循环/随机都带回来 */
  hydrate(): void {
    this.entries.clear()
    this.activeId = undefined
    this.liveId = undefined
    this.seq = 0
    this.refillGen += 1
    this.refillPending = false
    for (const node of normalizeQueues(readJsonSync<QueueFile>(this.core.paths.queuesFile))) {
      this.entries.set(node.id, {
        id: node.id,
        kind: node.kind,
        title: node.title,
        items: node.items,
        index: node.index,
        resumeId: node.resumeId,
        repeat: node.repeat,
        shuffle: node.shuffle,
        feed: node.feed,
        // 曲目都在盘上了就别再让 `fill` 去取一遍（它也没有 `load` 可取）
        loaded: node.loaded || node.items.length > 0,
        load: undefined,
        failures: 0,
        usedAt: node.usedAt,
      })
      if (node.usedAt > this.seq) this.seq = node.usedAt
    }
  }

  /** 立即落盘（防抖还没到就要退出时用；CLI 那种跑一条命令就走的过程靠它收尾） */
  flush(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer)
    this.saveTimer = undefined
    this.writeNow()
  }

  /**
   * 在播那份的**当前真实形态**（播放器才是真相，书架里的 entry 只是停放时的快照）。
   * 播放器里装的不是这份就返回 undefined —— 见 `liveId` 那段：换队列的 await 里不能拿旧队列充当新队列的位置。
   */
  private liveOf(id: string | undefined): LiveQueue | undefined {
    if (!id || id !== this.liveId) return undefined
    const queue = this.core.player.queue
    return {
      items: queue.list,
      index: queue.index,
      resumeId: queue.current?.id,
      repeat: queue.repeat,
      shuffle: queue.shuffled,
    }
  }

  /**
   * 同步原子写：「重启还接得上」要的就是最后那几次变化，异步写在短命进程里正好会丢。
   * 先 tmp 再 rename，挂掉也不会留下半截 JSON（口径同 `util.writeJsonAtomic`）。
   */
  private writeNow(): void {
    // 在播那份的真实位置只有播放器知道，所以盘上的那份要用播放器的形态覆盖一遍；
    // 但**不改书架里的 entry**：这次防抖写很可能正好落在「重新取一批」的 await 中间
    // （点「再来一批」时播放器里还是旧的那批），改写 entry 会把旧队列、旧 `resumeId`
    // 复活成新批次的位置 —— 现象就是「刷出来的新一批没从第一首开始」。
    const live = this.liveOf(this.activeId)
    const file = this.core.paths.queuesFile
    const queues: StoredQueue[] = [...this.entries.values()].map((entry) => {
      const snap = live && entry.id === this.activeId ? live : undefined
      return {
        id: entry.id,
        kind: entry.kind,
        title: entry.title,
        items: (snap ? snap.items : entry.items).map(stripRaw),
        index: snap ? snap.index : entry.index,
        resumeId: snap ? snap.resumeId : entry.resumeId,
        repeat: snap ? snap.repeat : entry.repeat,
        shuffle: snap ? snap.shuffle : entry.shuffle,
        feed: entry.feed,
        loaded: snap ? snap.items.length > 0 : entry.loaded,
        usedAt: entry.usedAt,
      }
    })
    try {
      mkdirSync(path.dirname(file), { recursive: true })
      const tmp = `${file}.tmp-${process.pid}`
      writeFileSync(tmp, JSON.stringify({ v: 1, queues } satisfies QueueFile))
      renameSync(tmp, file)
    } catch (err) {
      // 落盘失败不影响听歌：只是下次启动看不到这份书架，别把它炸成播放错误
      this.core.logger(`播放队列书架没存下：${err instanceof Error ? err.message : String(err)}`)
    }
  }

  /* ------------------------------------------------------------ 读 */

  get activeQueueId(): string | undefined {
    return this.activeId
  }

  list(): QueueInfo[] {
    const live = this.core.player.queue
    // 最近用过的排前面：书架（界面）先看到「刚刚听的那几份」，久没碰的自然沉底、也最先被淘汰
    return [...this.entries.values()]
      .sort((a, b) => b.usedAt - a.usedAt)
      .map((entry) => {
        const active = entry.id === this.activeId
        return {
          id: entry.id,
          kind: entry.kind,
          title: entry.title,
          count: active ? live.length : entry.items.length,
          index: active ? live.index : entry.index,
          current: active ? live.current?.name : entry.items[entry.index]?.name,
          active,
          // 只有「在播的那份推荐队列」才会真的续批（停放中的补不了）
          refilling: active && entry.kind === 'recommend' && Boolean(entry.feed),
        }
      })
  }

  info(id: string): QueueInfo | undefined {
    return this.list().find((item) => item.id === id)
  }

  get active(): QueueInfo | undefined {
    return this.list().find((item) => item.active)
  }

  /* ------------------------------------------------------------ 打开 / 切换 */

  /**
   * 打开一份队列并起播（不存在就建）。
   * 已经存在的那份**不重建**：切回来接着上次那一首，除非给了 `startTrackId` / `refresh`。
   */
  async open(opts: OpenQueueOptions): Promise<QueueInfo | undefined> {
    const id = opts.id ?? defaultIdOf(opts)
    let entry = this.entries.get(id)
    // 重新打开「正在播的那一份」：先把在播的真实位置记回书架，别拿上次停放时的老快照当起点
    // （下面的临时/推荐重置会再把它清掉，所以不影响「整队替换 / 换一批」）
    if (entry && id === this.activeId) this.park(id)
    if (!entry) {
      entry = {
        id,
        kind: opts.kind,
        title: opts.title,
        items: [],
        index: -1,
        // 推荐队列是流，单曲循环会冻住续批，固定关；其余队列认「默认循环模式」这个设置
        repeat: opts.kind === 'recommend' ? 'off' : this.core.config.defaultRepeat,
        shuffle: opts.shuffle ?? opts.kind === 'liked',
        load: opts.load,
        feed: opts.feed,
        loaded: false,
        failures: 0,
        usedAt: 0,
      }
      this.entries.set(id, entry)
    } else {
      if (opts.title) entry.title = opts.title
      if (opts.load) entry.load = opts.load
      if (opts.feed) entry.feed = opts.feed
      if (opts.shuffle !== undefined) entry.shuffle = opts.shuffle
    }

    if (opts.kind === 'temporary') {
      // 临时队列每次点播都是新的一批：上一批清掉，不攒着
      entry.items = [...(opts.items ?? [])]
      entry.index = -1
      entry.resumeId = undefined
      entry.loaded = true
    }
    if (opts.kind === 'recommend' && (opts.refresh || !entry.loaded)) {
      // 换听歌模式 = 换一条流：旧批次作废（不 refresh 且已有曲目时则接着听）
      entry.items = []
      entry.index = -1
      entry.resumeId = undefined
      entry.loaded = false
      entry.failures = 0
      // 「再来一批」= **整台重来**：先把播放器清干净（在播的那首连同它的时钟、播放源、以及还在
      // 路上的那一次解析一起作废），上层据此把 mpv 停掉。不清的话新一批是「盖」在还在响的旧曲上换的，
      // 上一首的退出/收尾会连着把新一批的头两首推过去（现象：刚下载完就跳下一首、又立马跳第三首）。
      if (opts.refresh) this.resetPlayer()
    }

    await this.activate(id, opts.startTrackId)
    // 新开一份就可能超上限：收起最久没用过的那份（在播的不动），别让书架无限长
    this.evictOverflow()
    return this.info(id)
  }

  /** 切到某份队列（换出去的那份存好位置，换回来的那份接着上次那一首） */
  async activate(id: string, startTrackId?: string): Promise<void> {
    const entry = this.entries.get(id)
    if (!entry) throw new Error(`没有这个播放队列：${id}`)
    const player = this.core.player
    if (this.activeId && this.activeId !== id) this.park(this.activeId)
    this.activeId = id
    // 记一笔「刚刚用过」：书架满了淘汰最久没用的那份时，它就是最新的
    entry.usedAt = ++this.seq
    // 换队列 = 换一条流：在途的那批推荐不算数了
    this.refillGen += 1
    this.refillPending = false
    if (!entry.loaded) {
      try {
        await this.fill(entry)
      } catch (err) {
        // 取不到就留一份空队列（界面上一句报错），别把「切队列」整个炸掉
        this.note(`队列没取到曲目（${err instanceof Error ? err.message : String(err)}）`, 'error')
      }
    }
    if (!entry.items.length) {
      this.liveId = undefined
      player.stop()
      this.emitChanged()
      return
    }
    const start = startTrackId ?? entry.resumeId ?? entry.items[Math.max(0, entry.index)]?.id ?? entry.items[0].id
    this.applying = true
    try {
      await player.playList(entry.items, start)
      // 从这一刻起播放器里装的才是这份队列（在那之前 `fill` 还在 await、播放器里是上一份）
      this.liveId = id
      // 推荐队列切回来也不认单曲循环（上一次听的时候手动开过也一样）：
      // 这条流的下一首由续批给，单曲循环会让它原地打转、永远等不到续批
      if (entry.kind === 'recommend' && entry.repeat === 'one') entry.repeat = 'off'
      player.setRepeat(entry.repeat)
      player.setShuffle(entry.shuffle)
    } finally {
      this.applying = false
    }
    this.emitChanged()
  }

  /** 丢掉某份队列（在播的那份不给删：先切走） */
  remove(id: string): boolean {
    if (id === this.activeId) return false
    const gone = this.entries.delete(id)
    if (gone) this.emitChanged()
    return gone
  }

  /**
   * 书架超出上限（`MAX_QUEUES`）时收起**最久没用过**的那些：只在开新队列后调用。
   * 在播的那份永不淘汰 —— 它正对着播放器，删了队列就断了。收起的会在界面给一句提示。
   */
  private evictOverflow(): void {
    let changed = false
    while (this.entries.size > MAX_QUEUES) {
      let victim: Entry | undefined
      for (const entry of this.entries.values()) {
        if (entry.id === this.activeId) continue
        if (!victim || entry.usedAt < victim.usedAt) victim = entry
      }
      if (!victim) break // 只剩在播那一份（正常不会走到：size 只会到 1）
      this.entries.delete(victim.id)
      changed = true
      this.note(`书架最多留 ${MAX_QUEUES} 份队列，已收起最久没用的「${victim.title}」`, 'info')
    }
    if (changed) this.emitChanged()
  }

  /** 账号切换/清场：书架一起清空 */
  reset(): void {
    this.entries.clear()
    this.activeId = undefined
    this.liveId = undefined
    this.seq = 0
    this.refillGen += 1
    this.refillPending = false
    this.emitChanged()
  }

  /**
   * 主动要下一批（界面在队列末尾按 `↓`）：不等「剩 ≤2 首」那个阈值，补回来的一批照旧挂队尾，
   * 已经排好的那些一首不动。返回**加进去的首数**（0 = 在播这份不是推荐队列、没有档位可取、
   * 或上一批还在路上）。
   */
  async loadMore(): Promise<number> {
    const entry = this.activeId ? this.entries.get(this.activeId) : undefined
    if (entry?.kind !== 'recommend') return 0
    return await this.refill(entry, { force: true })
  }

  /* ------------------------------------------------------------ 播放器事件 */

  /** 播放器动了队列（换曲/插队/移除）：推荐队列在这条路上检查要不要续批 */
  onPlayerQueue(): void {
    if (this.applying) return
    // 在播那份的真实位置只有播放器知道（停放着的才记在书架上），所以每次队列动作都排一次落盘
    this.scheduleWrite()
    const entry = this.activeId ? this.entries.get(this.activeId) : undefined
    if (entry?.kind !== 'recommend') return
    entry.index = this.core.player.queue.index
    void this.refill(entry)
  }

  /** 曲终：队列见底（`repeat=off`）时推荐队列自己补一批接着来 */
  onPlayerEnded(action: 'next' | 'stop' | 'repeat'): void {
    if (action !== 'stop') return
    const entry = this.activeId ? this.entries.get(this.activeId) : undefined
    if (entry?.kind !== 'recommend') return
    void this.refill(entry, { restart: true })
  }

  /* ------------------------------------------------------------ 内部 */

  /**
   * 换出去 / 重新打开「在播那份」之前，把播放器里的真实位置记回 entry。
   * 播放器里装的不是这份（还在取新批次、播放器仍是旧的）就不记 —— 记了就是把旧队列的位置
   * 写到新队列头上，切回来从中间开始播。
   */
  /**
   * 整台重来：清空队列并回到 `idle`。播放器是唯一真相，`clear()` 一并作废时钟、当前播放源
   * 和**还在路上的那一次解析**（`loadToken`）；`idle` 这个状态会让上层（TUI/CLI）把还在响的
   * 外置播放器停掉，新一批再从第一首起播时不带上一首的尾巴。
   * `applying` 是为了别把「队列被清空」当成「队列见底了，去补一批」。
   */
  private resetPlayer(): void {
    this.applying = true
    try {
      this.core.player.clear()
    } finally {
      this.applying = false
    }
  }

  private park(id: string): void {
    const entry = this.entries.get(id)
    const live = this.liveOf(id)
    if (!entry || !live) return
    entry.items = live.items
    entry.index = live.index
    entry.resumeId = live.resumeId
    entry.repeat = live.repeat
    entry.shuffle = live.shuffle
    entry.loaded = entry.items.length > 0
  }

  private async fill(entry: Entry): Promise<void> {
    if (entry.kind === 'recommend') {
      const batch = await this.fetchBatch(entry)
      entry.items = batch
      entry.index = -1
      // 新一批从头开始：上一批停在哪儿跟这一批没关系（`resumeId` 认不出来的 id 也会静默落到第 0 首）
      entry.resumeId = undefined
      entry.loaded = batch.length > 0
      return
    }
    const items = entry.load ? await entry.load() : []
    entry.items = items
    entry.index = -1
    entry.resumeId = undefined
    entry.loaded = true
  }

  private async fetchBatch(entry: Entry): Promise<TrackData[]> {
    const feed = entry.feed
    if (!feed) return []
    const tracks = await this.core.discover.feedModeTracks(feed)
    return tracks.map((track) => track.data).filter((track) => Boolean(track?.id))
  }

  /**
   * 续批：补**一整批**挂到队尾 —— 上游给几首收几首，队列长一点没关系，
   * 截掉的那几首是白拿的推荐，丢了就没有了。**不删任何东西**：已经排好的、听过的都留在原地，
   * 所以每首在队列里的序号从头到尾不变。返回加进去的首数。
   *
   * `restart` = 队列已经见底、播放器停了，补完要接着播；`force` = 不看阈值（界面主动要下一批）。
   */
  private async refill(entry: Entry, opts: { restart?: boolean; force?: boolean } = {}): Promise<number> {
    if (!entry.feed || this.refillPending) return 0
    const queue = this.core.player.queue
    const remaining = queue.index < 0 ? queue.length : queue.length - 1 - queue.index
    if (!opts.restart && !opts.force && remaining > RECOMMEND_REFILL_AT) return 0
    this.refillPending = true
    const gen = ++this.refillGen
    const at = queue.index
    try {
      const batch = await this.fetchBatch(entry)
      if (gen !== this.refillGen || this.activeId !== entry.id) return 0
      if (!batch.length) {
        this.fail(entry, '这批推荐是空的')
        return 0
      }
      const player = this.core.player
      player.enqueue(batch)
      entry.failures = 0
      this.note(`又补了一批 ${batch.length} 首`, 'info')
      // 见底接播只认「播放器还停在原地等歌」这一种：这批在途的功夫里你可能已经点了队列里的
      // 一首，那一下是用户的意思，别拿 next() 把它跳过去
      if (opts.restart && player.status === 'stopped' && player.queue.index === at) void player.next()
      return batch.length
    } catch (err) {
      if (gen === this.refillGen) this.fail(entry, err instanceof Error ? err.message : String(err))
      return 0
    } finally {
      if (gen === this.refillGen) this.refillPending = false
    }
  }

  private fail(entry: Entry, reason: string): void {
    entry.failures += 1
    if (entry.failures >= RECOMMEND_MAX_FAILURES) {
      entry.feed = undefined
      this.note(`连续 ${entry.failures} 批没取到，已停止自动续播：${reason}`, 'error')
      this.emitChanged()
      return
    }
    this.note(`这一批没取到（${reason}）`, 'error')
  }

  private note(message: string, kind: 'info' | 'error'): void {
    this.core.events.emit('queue-note', { message, kind })
  }

  private emitChanged(): void {
    this.core.events.emit('queues-changed', { activeId: this.activeId })
    this.scheduleWrite()
  }

  /**
   * 变化后防抖落盘（300ms）：一首歌里常连着好几次变化（换曲 + 续批 + 落位），
   * 每次都同步重写一遍整个书架太浪费。退出前由 `flush()` 收尾。
   */
  private scheduleWrite(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer)
    // `unref`：别让一个等着写盘的定时器把退出拖住
    this.saveTimer = setTimeout(() => {
      this.saveTimer = undefined
      this.writeNow()
    }, 300)
    this.saveTimer.unref?.()
  }
}

/** 落盘/读档都只留能播、能显示的那部分：`raw` 是上游原始响应，几十 KB 一首，不参与播放 */
function stripRaw(track: TrackData): TrackData {
  if (track.raw === undefined) return track
  const { raw: _raw, ...rest } = track
  return rest
}
