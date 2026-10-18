/**
 * 听歌模式的「一批接一批」：上游每次只随机给一小批（实测 6 首），所以连着听就得在见底前补下一批。
 *
 * 这里只管流的状态（在不在流里、能不能并发、失败几次就撤），取数与落队列都由调用方注入 ——
 * core 的 Player 不该知道「模式流」这个界面概念，`core/context.tsx` 因此只做接线。
 */
import type { FeedModeRef, TrackData } from 'qishui-core'

/** 剩这几首就去补下一批（一批约 6 首，再晚会听见停顿） */
export const FEED_REFILL_AT = 2
/** 连续这么多批取不到就停掉整个流，不留任何重试定时器 */
export const FEED_MAX_FAILURES = 2

export interface FeedStreamDeps {
  /** 取一批（约 6 首）；抛错=这一批没取到 */
  fetch(ref: FeedModeRef): Promise<TrackData[]>
  /** 整队替换并起播（用户选模式、或队列已经空了要重新起来） */
  replace(items: TrackData[]): void
  /** 接到队尾（不打断当前这首） */
  append(items: TrackData[]): void
  /** 界面提示：失败一定有一句，成功说一句「又补了一批」 */
  note(message: string, kind?: 'info' | 'error'): void
}

export class FeedStream {
  private ref?: FeedModeRef
  private streaming = false
  /** 互斥：一批还在取的时候不再取第二批 */
  private pending = false
  private failures = 0
  /** 换模式/停流后作废在途请求：慢回来的那批不能落进队列 */
  private generation = 0

  constructor(private readonly deps: FeedStreamDeps) {}

  get active(): boolean {
    return this.streaming
  }

  /** 选中一个模式：立刻按它取一批替换队列起播 */
  async start(ref: FeedModeRef): Promise<void> {
    this.ref = ref
    this.streaming = true
    this.failures = 0
    await this.take('replace')
  }

  /**
   * 队列还剩几首（播放顺序口径）。剩得不多就补一批；
   * 已经是 0（队列见底、播放器停了）就整队换一批重新起播。
   */
  onRemaining(remaining: number): void {
    if (!this.streaming || this.pending || remaining > FEED_REFILL_AT) return
    void this.take(remaining > 0 ? 'append' : 'replace')
  }

  /** 幂等；用户明确点了别的内容（某张歌单/搜索结果的某首）也走这里 */
  stop(): void {
    if (!this.streaming && !this.pending) return
    this.streaming = false
    this.pending = false
    this.failures = 0
    this.generation += 1
  }

  private async take(via: 'append' | 'replace'): Promise<void> {
    const ref = this.ref
    if (!ref || this.pending) return
    this.pending = true
    const my = ++this.generation
    try {
      const items = await this.deps.fetch(ref)
      if (my !== this.generation || !this.streaming) return
      this.pending = false
      if (items.length === 0) {
        this.fail('这个模式这次没回批次（上游给的是空的）')
        return
      }
      if (via === 'append') this.deps.append(items)
      else this.deps.replace(items)
      this.deps.note(`按当前听歌模式取了一批 ${items.length} 首`)
    } catch (err) {
      if (my !== this.generation) return
      this.pending = false
      const reason = err instanceof Error ? err.message : String(err)
      this.failures += 1
      if (this.failures >= FEED_MAX_FAILURES) this.fail(`连续 ${this.failures} 批没取到，已停止自动续播：${reason}`)
      else this.deps.note(`这一批没取到（${reason}）`, 'error')
    }
  }

  private fail(message: string): void {
    this.stop()
    this.deps.note(message, 'error')
  }
}
