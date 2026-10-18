import type { RepeatMode } from '../config.js'
import type { TrackData } from '../types.js'

export interface PlayQueueOptions {
  repeat?: RepeatMode
  shuffle?: boolean
}

/**
 * 播放队列：只关心「下一首是谁」，不碰网络也不碰时钟。
 * `order` 是播放顺序（元素是 items 的下标），`cursor` 指在 order 里的位置 ——
 * 这样随机播放不会破坏原始列表顺序，关掉随机还能回到原顺序。
 */
export class PlayQueue {
  private items: TrackData[] = []
  private order: number[] = []
  private cursor = -1
  private repeatMode: RepeatMode
  private shuffleOn: boolean

  constructor(items: TrackData[] = [], options: PlayQueueOptions = {}) {
    this.repeatMode = options.repeat ?? 'off'
    this.shuffleOn = options.shuffle ?? false
    this.setItems(items)
  }

  get length(): number {
    return this.items.length
  }

  get list(): TrackData[] {
    return [...this.items]
  }

  /** 播放顺序（随机播放时是打乱后的） */
  get playOrder(): TrackData[] {
    return this.order.map((i) => this.items[i])
  }

  get index(): number {
    return this.cursor
  }

  get current(): TrackData | undefined {
    const itemIndex = this.order[this.cursor]
    return itemIndex === undefined ? undefined : this.items[itemIndex]
  }

  get repeat(): RepeatMode {
    return this.repeatMode
  }

  get shuffled(): boolean {
    return this.shuffleOn
  }

  get isEmpty(): boolean {
    return this.items.length === 0
  }

  setItems(items: TrackData[], startIndex = 0): void {
    this.items = [...items]
    this.rebuild(startIndex)
  }

  /** 用新列表替换队列，并定位到指定曲目 id（找不到就从 0 开始） */
  setItemsAt(items: TrackData[], trackId: string): void {
    const start = items.findIndex((t) => t.id === trackId)
    this.setItems(items, start < 0 ? 0 : start)
  }

  append(items: TrackData[]): void {
    const base = this.items.length
    this.items.push(...items)
    for (let i = 0; i < items.length; i++) this.order.push(base + i)
    if (this.shuffleOn) {
      this.rebuild(this.order[this.cursor] ?? 0)
    } else if (this.cursor < 0 && this.items.length) {
      this.cursor = 0
    }
  }

  /** 插到当前曲目后面（「下一首播放」） */
  insertNext(items: TrackData[]): void {
    const at = this.cursor < 0 ? this.items.length : this.order[this.cursor] + 1
    this.items.splice(at, 0, ...items)
    this.order = this.order.map((i) => (i >= at ? i + items.length : i))
    const insertAt = this.cursor < 0 ? this.order.length : this.cursor + 1
    this.order.splice(insertAt, 0, ...items.map((_, k) => at + k))
  }

  remove(index: number): TrackData | undefined {
    if (index < 0 || index >= this.items.length) return undefined
    const [removed] = this.items.splice(index, 1)
    const orderPos = this.order.indexOf(index)
    this.order = this.order.filter((i) => i !== index).map((i) => (i > index ? i - 1 : i))
    if (orderPos >= 0 && orderPos < this.cursor) this.cursor--
    if (this.cursor >= this.order.length) this.cursor = this.order.length - 1
    return removed
  }

  /**
   * 按**播放顺序**下标移除（界面上的队列行就是这个空间，`remove()` 收的是加入顺序下标）。
   * 随机播放时两者不是一回事，同一首也可能在队列里出现两次，所以只能按 order 里的位置取，
   * 不能拿 id 反查 `items`。移除位在当前曲目之前时游标跟着左移，保持「还是在听这一首」。
   */
  removeAt(position: number): TrackData | undefined {
    const itemIndex = this.order[position]
    if (itemIndex === undefined) return undefined
    const [removed] = this.items.splice(itemIndex, 1)
    this.order.splice(position, 1)
    this.order = this.order.map((i) => (i > itemIndex ? i - 1 : i))
    if (position < this.cursor) this.cursor--
    if (this.cursor >= this.order.length) this.cursor = this.order.length - 1
    return removed
  }

  clear(): void {
    this.items = []
    this.order = []
    this.cursor = -1
  }

  setRepeat(mode: RepeatMode): void {
    this.repeatMode = mode
  }

  /** 开随机：以当前曲目为队首重排；关随机：回到原始顺序，位置跟着走 */
  setShuffle(on: boolean): void {
    if (this.shuffleOn === on) return
    this.shuffleOn = on
    const currentItem = this.current
    this.rebuild(currentItem ? this.items.indexOf(currentItem) : 0)
  }

  /** 跳到 order 里的第 n 位 */
  jumpTo(position: number): TrackData | undefined {
    if (position < 0 || position >= this.order.length) return undefined
    this.cursor = position
    return this.current
  }

  /** 按曲目 id 定位（不存在返回 undefined） */
  jumpToTrack(trackId: string): TrackData | undefined {
    const itemIndex = this.items.findIndex((t) => t.id === trackId)
    if (itemIndex < 0) return undefined
    const position = this.order.indexOf(itemIndex)
    return position < 0 ? undefined : this.jumpTo(position)
  }

  hasNext(): boolean {
    if (this.repeatMode === 'all' || this.repeatMode === 'one') return this.order.length > 0
    return this.cursor + 1 < this.order.length
  }

  hasPrevious(): boolean {
    if (this.repeatMode === 'all') return this.order.length > 0
    return this.cursor > 0
  }

  /** 下一首的位置（不改 cursor），到头且不循环时 undefined */
  nextPosition(): number | undefined {
    if (!this.order.length) return undefined
    if (this.cursor + 1 < this.order.length) return this.cursor + 1
    if (this.repeatMode === 'all') return 0
    return undefined
  }

  previousPosition(): number | undefined {
    if (!this.order.length) return undefined
    if (this.cursor > 0) return this.cursor - 1
    if (this.repeatMode === 'all') return this.order.length - 1
    return undefined
  }

  /** 前进/后退，返回新的曲目 */
  step(delta: 1 | -1): TrackData | undefined {
    const position = delta > 0 ? this.nextPosition() : this.previousPosition()
    if (position === undefined) return undefined
    return this.jumpTo(position)
  }

  toJSON(): { items: TrackData[]; index: number; repeat: RepeatMode; shuffle: boolean } {
    return { items: this.list, index: this.cursor, repeat: this.repeatMode, shuffle: this.shuffleOn }
  }

  private rebuild(startIndex: number): void {
    const indices = this.items.map((_, i) => i)
    if (this.shuffleOn) {
      const head = indices.splice(clamp(startIndex, 0, Math.max(0, indices.length - 1)), 1)
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[indices[i], indices[j]] = [indices[j], indices[i]]
      }
      this.order = [...head, ...indices]
      this.cursor = head.length ? 0 : -1
    } else {
      this.order = indices
      this.cursor = this.items.length ? clamp(startIndex, 0, this.items.length - 1) : -1
    }
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
