import type { PlaySource } from '../cache/media.js'
import type { RepeatMode } from '../config.js'
import type { QishuiCore } from '../core.js'
import { Emitter } from '../events.js'
import type { TrackData } from '../types.js'
import type { Lyrics } from './lyrics.js'
import { PlayQueue } from './queue.js'

export type PlayerStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'stopped' | 'error'

/** 队列/单首/裸 id 都能喂进来（实体类有 `.data`） */
export type TrackInput = TrackData | string | { data: TrackData }

export interface PlayerEvents {
  status: { status: PlayerStatus; previous: PlayerStatus }
  track: { track: TrackData | null; index: number }
  progress: { positionMs: number; durationMs: number }
  queue: { items: TrackData[]; index: number; repeat: RepeatMode; shuffle: boolean }
  source: { source: PlaySource }
  ended: { track: TrackData | null; action: 'next' | 'repeat' | 'stop' }
  error: { error: Error; track: TrackData | null }
}

export interface PlayerState {
  status: PlayerStatus
  track: TrackData | null
  index: number
  positionMs: number
  durationMs: number
  volume: number
  rate: number
  repeat: RepeatMode
  shuffle: boolean
  error?: string
  /** 当前播放源：cache = 媒体缓存里的文件；remote = 只是签名地址；local = 用户磁盘上的文件 */
  source: { kind: 'cache' | 'remote' | 'local'; path?: string; url?: string; fromCache: boolean } | null
  /** 试听片段在整首歌里的起点（ms）；整曲可播时为 0 */
  clipStartMs: number
}

export interface PlayOptions {
  /** false = 只用远程签名地址，不落盘（想自己接管流式播放时用） */
  download?: boolean
  /** 已经缓存也重新解析一次 */
  refresh?: boolean
  /** 从指定位置开始（ms） */
  startAtMs?: number
  onProgress?: (progress: { phase: string; received: number; total?: number }) => void
}

export interface PlayerOptions {
  /** 进度时钟粒度（ms），默认 250 */
  tickMs?: number
  /** 解析不到播放地址时自动跳下一首（默认 true；队列里全是坏歌时会停下来） */
  skipOnError?: boolean
}

/**
 * 播放器状态机 —— **只维护状态，不出声**。
 *
 * Node 里没有音频输出，真出声要外部进程（mpv/ffplay/上层 App 的原生播放器），
 * 那属于上层决定的事。core 负责的是「播什么、播到哪了、歌词到哪了、该谁了」：
 *
 * ```
 * idle ──play()──► loading ──解析到播放源──► playing ⇄ paused
 *                     │                       │         │
 *                     └──失败──► error        └─到曲终─► ended → next / repeat / stopped
 * ```
 *
 * 上一层的用法：`player.on('track', …)` 拿曲子、`player.source` 拿本地文件路径或签名地址喂给自己的播放器，
 * 然后周期性把真实播放位置 `player.seek(ms)` 打回来（或干脆用 core 自带的时钟做进度）。
 */
export class Player {
  readonly queue: PlayQueue
  readonly events = new Emitter<PlayerEvents>()

  private statusValue: PlayerStatus = 'idle'
  private sourceValue: PlaySource | null = null
  private lyricsValue: Lyrics | undefined
  private positionValue = 0
  /** 真实可播时长覆盖（外部播放器报的时长优先于元数据）；换曲时清空 */
  private durationOverride: number | undefined
  private volumeValue = 1
  private rateValue = 1
  private errorValue: string | undefined
  private timer?: NodeJS.Timeout
  private lastTickAt = 0
  private consecutiveErrors = 0
  /** 每次起播递增；慢的解析回来时若 token 已过期（用户又切歌了）就整段丢弃 */
  private loadToken = 0
  private readonly tickMs: number
  private readonly skipOnError: boolean

  constructor(
    private core: QishuiCore,
    options: PlayerOptions = {},
  ) {
    this.queue = new PlayQueue([], { repeat: core.config.defaultRepeat, shuffle: core.config.defaultShuffle })
    this.tickMs = options.tickMs ?? 250
    this.skipOnError = options.skipOnError !== false
  }

  get status(): PlayerStatus {
    return this.statusValue
  }

  get current(): TrackData | null {
    return this.queue.current ?? null
  }

  get positionMs(): number {
    return this.positionValue
  }

  /**
   * 可播时长（ms），优先级：外部播放器报的真实时长（`setDuration`）> 解析出的播放源时长
   * （试听片段是片段长度）> 曲目元数据时长。**试听片段下元数据时长会明显偏长**，别拿它当进度终点。
   */
  get durationMs(): number {
    return this.durationOverride ?? this.sourceValue?.durationMs ?? this.current?.durationMs ?? 0
  }

  /** 试听片段在整首歌里的起点（ms）；整曲可播时为 0 */
  get clipStartMs(): number {
    return this.sourceValue?.clipStartMs ?? 0
  }

  /** 播放位置换算到「整首歌时间轴」（试听片段要加上片段起点），歌词对齐用它 */
  get songPositionMs(): number {
    return this.positionValue + this.clipStartMs
  }

  get volume(): number {
    return this.volumeValue
  }

  get rate(): number {
    return this.rateValue
  }

  get source(): PlaySource | null {
    return this.sourceValue
  }

  get lyrics(): Lyrics | undefined {
    return this.lyricsValue
  }

  get state(): PlayerState {
    return {
      status: this.statusValue,
      track: this.current,
      index: this.queue.index,
      positionMs: this.positionValue,
      durationMs: this.durationMs,
      volume: this.volumeValue,
      rate: this.rateValue,
      repeat: this.queue.repeat,
      shuffle: this.queue.shuffled,
      error: this.errorValue,
      source: this.sourceValue
        ? {
            kind: this.sourceValue.kind,
            path: this.sourceValue.path,
            url: this.sourceValue.url,
            fromCache: this.sourceValue.fromCache,
          }
        : null,
      clipStartMs: this.clipStartMs,
    }
  }

  /* ------------------------------------------------------------ 播放控制 */

  /** 不带参数 = 继续播当前曲目；带参数 = 用这首（或这批）替换队列并开播 */
  async play(input?: TrackInput | TrackInput[], opts: PlayOptions = {}): Promise<void> {
    if (input !== undefined) {
      const tracks = (Array.isArray(input) ? input : [input]).map(toTrackData).filter((t): t is TrackData => !!t?.id)
      if (!tracks.length) return
      this.queue.setItems(tracks)
      this.emitQueue()
    }
    if (!this.queue.current) return
    await this.startCurrent(opts)
  }

  /** 播放一批曲目，可指定从哪首开始（按 id 定位） */
  async playList(tracks: TrackInput[], startTrackId?: string, opts: PlayOptions = {}): Promise<void> {
    const list = tracks.map(toTrackData).filter((t): t is TrackData => !!t?.id)
    if (!list.length) return
    if (startTrackId) this.queue.setItemsAt(list, startTrackId)
    else this.queue.setItems(list)
    this.emitQueue()
    await this.startCurrent(opts)
  }

  /** 跳到队列里第 n 位（指播放顺序） */
  async playIndex(position: number, opts: PlayOptions = {}): Promise<void> {
    if (!this.queue.jumpTo(position)) return
    this.emitQueue()
    await this.startCurrent(opts)
  }

  /**
   * 播队列里的**某一首**（按曲目 id）—— 界面上点队列行走这条，别用行号。
   * 行号是「界面那一刻看到的」，中途从队列里移除某一首会让后面那些集体前移：拿老行号跳要么播成隔壁那首，
   * 要么越界被 `jumpTo` 静默拒掉（点了没反应）。id 才是「你点的是谁」，找得着就播它。
   */
  async playQueueTrack(trackId: string, opts: PlayOptions = {}): Promise<boolean> {
    if (!this.queue.jumpToTrack(trackId)) return false
    this.emitQueue()
    await this.startCurrent(opts)
    return true
  }

  /** 追加到队尾（不打断当前播放） */
  enqueue(tracks: TrackInput | TrackInput[]): void {
    const list = (Array.isArray(tracks) ? tracks : [tracks]).map(toTrackData).filter((t): t is TrackData => !!t?.id)
    if (!list.length) return
    this.queue.append(list)
    this.emitQueue()
  }

  /** 插到当前曲目后面 */
  playNext(tracks: TrackInput | TrackInput[]): void {
    const list = (Array.isArray(tracks) ? tracks : [tracks]).map(toTrackData).filter((t): t is TrackData => !!t?.id)
    if (!list.length) return
    this.queue.insertNext(list)
    this.emitQueue()
  }

  /**
   * 从队列里移除**播放顺序**第 n 位（上层队列行点的就是这一位）。
   * 移掉的正好是当前这首时接着播队列里新的当前（空了就 `stop`）——
   * 否则会留下「在响 A、队列说 B」的分裂状态。
   */
  removeFromQueue(position: number): TrackData | undefined {
    const wasCurrent = position === this.queue.index
    const removed = this.queue.removeAt(position)
    if (!removed) return undefined
    this.emitQueue()
    if (wasCurrent) {
      if (this.queue.current) void this.playIndex(this.queue.index)
      else this.stop()
    }
    return removed
  }

  pause(): void {
    if (this.statusValue !== 'playing') return
    this.stopClock()
    this.setStatus('paused')
  }

  async resume(opts: PlayOptions = {}): Promise<void> {
    if (this.statusValue === 'paused') {
      this.startClock()
      this.setStatus('playing')
      return
    }
    if (this.statusValue === 'idle' || this.statusValue === 'stopped') await this.play(undefined, opts)
  }

  async toggle(opts: PlayOptions = {}): Promise<void> {
    if (this.statusValue === 'playing') this.pause()
    else await this.resume(opts)
  }

  stop(): void {
    this.stopClock()
    this.loadToken++
    this.positionValue = 0
    this.sourceValue = null
    this.lyricsValue = undefined
    this.durationOverride = undefined
    this.setStatus('stopped')
  }

  /** 下一首；到队尾且不循环时返回 false（不改状态） */
  async next(opts: PlayOptions = {}): Promise<boolean> {
    const track = this.queue.step(1)
    if (!track) return false
    this.emitQueue()
    await this.startCurrent(opts)
    return true
  }

  /** 上一首：播过 3 秒以上先回到本曲开头（和主流播放器一致） */
  async previous(opts: PlayOptions = {}): Promise<boolean> {
    if (this.positionValue > 3000) {
      this.seek(0)
      return true
    }
    const track = this.queue.step(-1)
    if (!track) return false
    this.emitQueue()
    await this.startCurrent(opts)
    return true
  }

  seek(positionMs: number): void {
    const clamped = Math.max(0, this.durationMs ? Math.min(positionMs, this.durationMs) : positionMs)
    this.positionValue = clamped
    this.lastTickAt = Date.now()
    this.events.emit('progress', { positionMs: clamped, durationMs: this.durationMs })
  }

  /**
   * 外部播放器报来的**真实可播时长**（试听片段/CDN 转码常与元数据不符，以实际为准）。
   * 传 `undefined` 清掉覆盖，回到播放源/元数据时长；比当前进度短时把进度钳到末尾。
   */
  setDuration(durationMs: number | undefined): void {
    this.durationOverride =
      typeof durationMs === 'number' && Number.isFinite(durationMs) && durationMs > 0 ? durationMs : undefined
    const duration = this.durationMs
    if (duration > 0 && this.positionValue > duration) this.positionValue = duration
    this.events.emit('progress', { positionMs: this.positionValue, durationMs: duration })
  }

  setRepeat(mode: RepeatMode): void {
    this.queue.setRepeat(mode)
    this.emitQueue()
  }

  setShuffle(on: boolean): void {
    this.queue.setShuffle(on)
    this.emitQueue()
  }

  setVolume(volume: number): void {
    this.volumeValue = Math.min(1, Math.max(0, volume))
  }

  /** 倍速（只影响进度时钟；真出声的倍速在上层的播放器里） */
  setRate(rate: number): void {
    this.rateValue = Math.max(0.25, Math.min(4, rate))
  }

  /** 清空队列并回到 idle */
  clear(): void {
    this.stopClock()
    this.loadToken++
    this.queue.clear()
    this.sourceValue = null
    this.lyricsValue = undefined
    this.durationOverride = undefined
    this.positionValue = 0
    this.setStatus('idle')
    this.emitQueue()
  }

  /* ------------------------------------------------------------ 歌词与元数据 */

  /** 当前曲目的结构化歌词（缓存里没有就顺势解析一次，会顺带落盘） */
  async lyricsFor(input?: TrackInput | null): Promise<Lyrics | undefined> {
    const track = input ? toTrackData(input) : this.current
    if (!track?.id) return undefined
    // 磁盘上的文件没有上游歌词可拿（也不该拿它的假 id 去问）：照实返回「没有歌词」
    if (track.localPath) {
      this.lyricsValue = undefined
      return undefined
    }
    this.lyricsValue = await this.core.media.lyrics(track)
    return this.lyricsValue
  }

  /**
   * 播放位置对应的歌词行（含下一行，滚动界面直接用）。
   * 试听片段会自动加上片段起点：歌词时间轴是整首歌的，播放位置是片段内的。
   */
  lyricState(
    offsetMs = 0,
  ): { line?: ReturnType<Lyrics['lineAt']>; index: number; next?: ReturnType<Lyrics['lineAt']> } | undefined {
    if (!this.lyricsValue) return undefined
    return this.lyricsValue.view(this.songPositionMs, offsetMs)
  }

  /** 当前曲目对应的本地缓media（下载/清理时用） */
  async ensureMedia(opts: { refresh?: boolean; onProgress?: PlayOptions['onProgress'] } = {}) {
    const track = this.current
    if (!track?.id) return undefined
    return await this.core.media.ensure(track, opts)
  }

  /* ------------------------------------------------------------ 事件订阅 */

  on<K extends keyof PlayerEvents>(event: K, handler: (payload: PlayerEvents[K]) => void): () => void {
    return this.events.on(event, handler)
  }

  off<K extends keyof PlayerEvents>(event: K, handler: (payload: PlayerEvents[K]) => void): void {
    this.events.off(event, handler)
  }

  once<K extends keyof PlayerEvents>(event: K, handler: (payload: PlayerEvents[K]) => void): () => void {
    return this.events.once(event, handler)
  }

  dispose(): void {
    this.stopClock()
    this.events.removeAll()
  }

  /* ------------------------------------------------------------ 内部 */

  private async startCurrent(opts: PlayOptions = {}): Promise<void> {
    const token = ++this.loadToken
    const track = this.queue.current
    if (!track) {
      this.setStatus('idle')
      return
    }
    this.setStatus('loading')
    this.positionValue = opts.startAtMs ?? 0
    this.errorValue = undefined

    let source: PlaySource
    try {
      // 本地库的曲目（`localPath`）不走上游：直接把磁盘路径当播放源，别为了「解析地址」去问分享页
      source = track.localPath
        ? this.core.local.sourceFor(track)
        : await this.core.media.resolve(track, {
            download: opts.download,
            refresh: opts.refresh,
            onProgress: opts.onProgress,
          })
    } catch (err) {
      // 解析期间用户已经切到别的歌：这次失败属于上一首，别改当前状态
      if (token !== this.loadToken) return
      await this.handleFailure(err instanceof Error ? err : new Error(String(err)), track)
      return
    }
    // 慢请求后返回：当前曲目早就换了，丢弃这份旧 source（否则会串台/异曲同播）
    if (token !== this.loadToken) return

    this.consecutiveErrors = 0
    this.sourceValue = source
    this.durationOverride = undefined
    this.lyricsValue = source.lyrics
    this.events.emit('source', { source })
    this.events.emit('track', { track: source.track, index: this.queue.index })

    await this.recordPlay(source)
    this.startClock()
    this.setStatus('playing')
  }

  private async handleFailure(error: Error, track: TrackData): Promise<void> {
    this.errorValue = error.message
    this.stopClock()
    this.setStatus('error')
    this.events.emit('error', { error, track })
    this.core.logger(`[player] ${track.name || track.id} 解析播放源失败：${error.message}`)

    this.consecutiveErrors++
    if (!this.skipOnError) return
    if (this.consecutiveErrors >= Math.max(1, this.queue.length)) return
    const next = this.queue.nextPosition()
    if (next === undefined) return
    this.queue.jumpTo(next)
    this.emitQueue()
    await this.startCurrent()
  }

  /** 本地历史永远记；上报上游要 config.reportPlayback 显式打开 */
  private async recordPlay(source: PlaySource): Promise<void> {
    const track = source.track
    try {
      // 媒体缓存侧记一次「被拿去播了」（plays 计数 + accessedAt，供 LRU/prune 用，纯本地）。
      // 本地文件不在媒体缓存里，没有这一笔可记
      if (source.kind !== 'local') await this.core.media.recordPlay(track.id)
      await this.core.history.append(track, {
        source: source.kind,
        // 记下路径：本地历史据此能重播磁盘文件（云端曲目没有这一项）
        path: source.kind === 'local' ? source.path : undefined,
      })
      await this.core.history.compactIfNeeded()
    } catch (err) {
      this.core.logger(`[player] 写播放记录失败：${String(err)}`)
    }
    // 磁盘上的文件不是上游的曲目，没有「最近播放」可上报
    if (source.kind === 'local') return
    if (!this.core.config.reportPlayback) return
    try {
      await this.core.account.reportPlayed([track])
    } catch (err) {
      this.core.logger(`[player] 上报最近播放失败（不影响播放）：${String(err)}`)
    }
  }

  private startClock(): void {
    this.stopClock()
    this.lastTickAt = Date.now()
    this.timer = setInterval(() => this.tick(), this.tickMs)
    // 库不该拖着进程不让退出
    this.timer.unref?.()
  }

  private stopClock(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = undefined
    }
  }

  private tick(): void {
    if (this.statusValue !== 'playing') return
    const now = Date.now()
    this.positionValue += (now - this.lastTickAt) * this.rateValue
    this.lastTickAt = now
    const duration = this.durationMs
    if (duration > 0 && this.positionValue >= duration) {
      this.positionValue = duration
      this.events.emit('progress', { positionMs: this.positionValue, durationMs: duration })
      void this.handleEnded()
      return
    }
    this.events.emit('progress', { positionMs: this.positionValue, durationMs: duration })
  }

  private async handleEnded(): Promise<void> {
    const track = this.queue.current ?? null
    if (this.queue.repeat === 'one') {
      this.events.emit('ended', { track, action: 'repeat' })
      this.positionValue = 0
      await this.startCurrent()
      return
    }
    const next = this.queue.nextPosition()
    if (next !== undefined) {
      this.events.emit('ended', { track, action: 'next' })
      this.queue.jumpTo(next)
      this.emitQueue()
      await this.startCurrent()
      return
    }
    this.events.emit('ended', { track, action: 'stop' })
    this.stopClock()
    this.setStatus('stopped')
  }

  private setStatus(status: PlayerStatus): void {
    if (status === this.statusValue) return
    const previous = this.statusValue
    this.statusValue = status
    this.events.emit('status', { status, previous })
  }

  private emitQueue(): void {
    this.events.emit('queue', {
      items: this.queue.list,
      index: this.queue.index,
      repeat: this.queue.repeat,
      shuffle: this.queue.shuffled,
    })
  }
}

function toTrackData(input: TrackInput | undefined): TrackData | undefined {
  if (!input) return undefined
  if (typeof input === 'string') return { id: input, name: '', artists: [] }
  if ('data' in input && input.data?.id) return input.data
  const track = input as TrackData
  return track.id ? track : undefined
}
