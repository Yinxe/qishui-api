/**
 * 播放队列书架：**同一时刻只有一份在播，但不是只有一份存在**。
 *
 * 早先播放器只有一个队列，谁点播谁就把它覆盖掉 —— 听推荐听到一半去点了张歌单，
 * 推荐那条流就没了。这里把「队列」变成有名字、各自记位置的东西，按来源分四种策略：
 *
 * | 种类 | 谁产生 | 曲目 | 策略 |
 * |---|---|---|---|
 * | `recommend` 推荐 | 听歌模式（场景 / 新鲜 / 熟悉 / 默认） | 上游每次给一小批（实测 6 首） | **滑动窗口**：每前进一首就把「上上个」踢掉；剩 ≤2 首时补一批，窗口钳在 2~8 首；**顺序播、不随机** |
 * | `playlist` 歌单 | 每张歌单一份（本地歌单也算） | 整张 | 顺序播；切走再切回来接着上次那一首 |
 * | `liked` 我喜欢 | 「我喜欢的音乐」/ 本地喜欢 | 全部 | **随机** |
 * | `temporary` 临时 | 搜索 / 榜单 / 专辑 / 艺人 / 首页推荐块 | 这一次点播的那一批 | 顺序播；**每次点播整队替换上一批**（临时就是不留旧账） |
 *
 * 「在播的那一份」仍然是 `Player` 里那个 `PlayQueue`（时钟、歌词、mpv 都对着它），
 * 书架只负责**换出去时存位置、换回来时装回去**，以及在推荐队列上跑滑动窗口与续批。
 * 取数（歌单曲目 / 喜欢列表 / 推荐批次）由调用方给 `load` 或 `feed`，书架自己不猜上游。
 */
import type { RepeatMode } from '../config.js'
import type { QishuiCore } from '../core.js'
import type { FeedModeRef } from '../services/discover.js'
import type { TrackData } from '../types.js'

export type QueueKind = 'recommend' | 'playlist' | 'liked' | 'temporary'

/** 推荐队列的窗口上限：曲目数钳在 2~8 首（见类注释的滑动窗口） */
export const RECOMMEND_WINDOW_MAX = 8
/** 后面还剩这几首就去补下一批（一批约 6 首，再晚会听见停顿） */
export const RECOMMEND_REFILL_AT = 2
/** 连续这么多批取不到就停掉自动续播（不留重试定时器） */
export const RECOMMEND_MAX_FAILURES = 2

export interface QueueInfo {
  id: string
  kind: QueueKind
  title: string
  /** 这份队列里现在有几首 */
  count: number
  /** 播放顺序里的当前位（-1 = 还没定位） */
  index: number
  /** 是不是播放器正在放的那一份 */
  active: boolean
  /** 还会自动续批（推荐队列且没停） */
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
}

/** 没给 id 时的默认 id：推荐 / 我喜欢 / 临时各一份，歌单按来源区分 */
function defaultIdOf(opts: OpenQueueOptions): string {
  if (opts.kind === 'playlist') return `playlist:${opts.id ?? opts.title}`
  return opts.kind
}

export class QueueBook {
  private readonly entries = new Map<string, Entry>()
  private activeId?: string
  /** 本类自己在动播放器队列时置位：`queue` 事件会把自己再叫一遍，滚窗口就会多踢一首 */
  private applying = false
  /** 互斥：一批还在取的时候不再取第二批 */
  private refillPending = false
  /** 换队列/停续播后作废在途请求：慢回来的那批不能落进队列 */
  private refillGen = 0
  private refillFailures = 0

  constructor(private readonly core: QishuiCore) {}

  /* ------------------------------------------------------------ 读 */

  get activeQueueId(): string | undefined {
    return this.activeId
  }

  list(): QueueInfo[] {
    const live = this.core.player.queue
    return [...this.entries.values()].map((entry) => {
      const active = entry.id === this.activeId
      return {
        id: entry.id,
        kind: entry.kind,
        title: entry.title,
        count: active ? live.length : entry.items.length,
        index: active ? live.index : entry.index,
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
        repeat: 'off',
        shuffle: opts.shuffle ?? opts.kind === 'liked',
        load: opts.load,
        feed: opts.feed,
        loaded: false,
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
      this.refillFailures = 0
    }

    await this.activate(id, opts.startTrackId)
    return this.info(id)
  }

  /** 切到某份队列（换出去的那份存好位置，换回来的那份接着上次那一首） */
  async activate(id: string, startTrackId?: string): Promise<void> {
    const entry = this.entries.get(id)
    if (!entry) throw new Error(`没有这个播放队列：${id}`)
    const player = this.core.player
    if (this.activeId && this.activeId !== id) this.park(this.activeId)
    this.activeId = id
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
      player.stop()
      this.emitChanged()
      return
    }
    const start = startTrackId ?? entry.resumeId ?? entry.items[Math.max(0, entry.index)]?.id ?? entry.items[0].id
    this.applying = true
    try {
      await player.playList(entry.items, start)
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

  /** 账号切换/清场：书架一起清空 */
  reset(): void {
    this.entries.clear()
    this.activeId = undefined
    this.refillGen += 1
    this.refillPending = false
    this.refillFailures = 0
    this.emitChanged()
  }

  /** 停掉推荐队列的自动续批（队列里已有的照样播完） */
  stopRefill(): void {
    const entry = this.activeId ? this.entries.get(this.activeId) : undefined
    if (entry) entry.feed = undefined
    for (const item of this.entries.values()) if (item.kind === 'recommend') item.feed = undefined
    this.refillGen += 1
    this.refillPending = false
    this.emitChanged()
  }

  /* ------------------------------------------------------------ 播放器事件 */

  /** 播放器动了队列（换曲/插队/移除）：推荐队列在这条路上滚窗口 + 续批 */
  onPlayerQueue(): void {
    if (this.applying) return
    const entry = this.activeId ? this.entries.get(this.activeId) : undefined
    if (entry?.kind !== 'recommend') return
    this.roll(entry)
    void this.refill(entry)
  }

  /** 曲终：队列见底（`repeat=off`）时推荐队列自己补一批接着来 */
  onPlayerEnded(action: 'next' | 'stop' | 'repeat'): void {
    if (action !== 'stop') return
    const entry = this.activeId ? this.entries.get(this.activeId) : undefined
    if (entry?.kind !== 'recommend') return
    void this.refill(entry, true)
  }

  /* ------------------------------------------------------------ 内部 */

  private park(id: string): void {
    const entry = this.entries.get(id)
    if (!entry) return
    const queue = this.core.player.queue
    entry.items = queue.list
    entry.index = queue.index
    entry.resumeId = queue.current?.id
    entry.repeat = queue.repeat
    entry.shuffle = queue.shuffled
    entry.loaded = entry.items.length > 0
  }

  private async fill(entry: Entry): Promise<void> {
    if (entry.kind === 'recommend') {
      const batch = await this.fetchBatch(entry)
      entry.items = batch
      entry.index = -1
      entry.loaded = batch.length > 0
      return
    }
    const items = entry.load ? await entry.load() : []
    entry.items = items
    entry.index = -1
    entry.loaded = true
  }

  private async fetchBatch(entry: Entry): Promise<TrackData[]> {
    const feed = entry.feed
    if (!feed) return []
    const tracks = await this.core.discover.feedModeTracks(feed)
    return tracks.map((track) => track.data).filter((track) => Boolean(track?.id))
  }

  /**
   * 滑动窗口：**把「上上个」踢掉**（只留当前这首前面那一首）。
   * 一次只留 1 首历史 —— 界面上看得见的仍然是「上一首 / 当前 / 后面一批」。
   */
  private roll(entry: Entry): void {
    const queue = this.core.player.queue
    const drop = queue.index - 1
    if (drop <= 0) return
    this.applying = true
    try {
      for (let i = 0; i < drop; i++) this.core.player.removeFromQueue(0)
    } finally {
      this.applying = false
    }
    entry.index = this.core.player.queue.index
    this.emitChanged()
  }

  /**
   * 续批：后面剩 ≤2 首时补一批，**窗口钳在 2~8 首**（装不下就先不取，
   * 免得队尾堆着一串还没听就被踢掉的歌）。`restart` = 队列已经见底、停了，补完接着播。
   */
  private async refill(entry: Entry, restart = false): Promise<void> {
    if (!entry.feed || this.refillPending) return
    const queue = this.core.player.queue
    const remaining = queue.index < 0 ? queue.length : queue.length - 1 - queue.index
    if (!restart && remaining > RECOMMEND_REFILL_AT) return
    const room = RECOMMEND_WINDOW_MAX - queue.length
    if (room <= 0) return
    this.refillPending = true
    const gen = ++this.refillGen
    try {
      const batch = (await this.fetchBatch(entry)).slice(0, room)
      if (gen !== this.refillGen || this.activeId !== entry.id) return
      if (!batch.length) {
        this.fail(entry, '这批推荐是空的')
        return
      }
      this.core.player.enqueue(batch)
      this.refillFailures = 0
      this.note(`又补了一批 ${batch.length} 首`, 'info')
      if (restart) void this.core.player.next()
    } catch (err) {
      if (gen !== this.refillGen) return
      this.fail(entry, err instanceof Error ? err.message : String(err))
    } finally {
      if (gen === this.refillGen) this.refillPending = false
    }
  }

  private fail(entry: Entry, reason: string): void {
    this.refillFailures += 1
    if (this.refillFailures >= RECOMMEND_MAX_FAILURES) {
      entry.feed = undefined
      this.note(`连续 ${this.refillFailures} 批没取到，已停止自动续播：${reason}`, 'error')
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
  }
}
