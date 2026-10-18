/**
 * core 上下文：惰性创建 `QishuiCore`、订阅播放器事件、把播放源喂给 mpv。
 *
 * 首帧不依赖 core（侧边栏/播放条先渲染），core 就绪前各页面显示「启动中」；
 * 创建失败（例如首次注册设备身份失败）也不崩，页面里给一句可读的错误。
 *
 * 这里还负责「听歌模式」的接线：记住当前模式（`config.feedMode`）+ 让 `FeedStream`
 * 在队列见底前按它续一批。取数与状态机都在 `../feedStream.ts`，本文件只做事件接线。
 */

import {
  createQishui,
  type FeedModeRef,
  formatFeedMode,
  type PlayerStatus,
  parseFeedMode,
  type QishuiCore,
  type RepeatMode,
  type TrackData,
} from 'qishui-core'
import { createContext, type ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { FeedStream } from '../feedStream.js'
import { useUi } from '../ui/context.js'
import { AudioSink, type AudioSource } from './mpv.js'

export interface PlayerSnapshot {
  status: PlayerStatus
  track: TrackData | null
  positionMs: number
  durationMs: number
  /** 试听片段在整首歌里的起点（ms）；整曲可播时为 0 */
  clipStartMs: number
  volume: number
  repeat: RepeatMode
  shuffle: boolean
  sourceKind: 'cache' | 'remote' | null
  error?: string
  audioNote?: string
}

export interface QueueSnapshot {
  items: TrackData[]
  index: number
  repeat: RepeatMode
  shuffle: boolean
}

const INITIAL_PLAYER: PlayerSnapshot = {
  status: 'idle',
  track: null,
  positionMs: 0,
  durationMs: 0,
  clipStartMs: 0,
  volume: 0.8,
  repeat: 'off',
  shuffle: false,
  sourceKind: null,
}

export interface CoreValue {
  core: QishuiCore | undefined
  ready: boolean
  error?: string
  /** 骨架模式（`QISHUI_TUI_STUB=1`）：不创建 core，只画外壳，供 UI 自检/离线改版 */
  stub: boolean
  /** 登录态变更序号（登录/切号/登出、以及身份补全都会 +1）；读它只为「跟着重渲染」 */
  sessionRevision: number
  player: PlayerSnapshot
  queue: QueueSnapshot
  playTracks(tracks: TrackData[], startTrackId?: string): Promise<void>
  toggle(): Promise<void>
  playNext(): Promise<void>
  playPrevious(): Promise<void>
  /** 直接播播放顺序里的第 n 位（`queue.items` 与 `queue.index` 都是这个空间） */
  playQueueIndex(position: number): Promise<void>
  seekMs(ms: number): void
  nudgeSeek(deltaMs: number): void
  nudgeVolume(delta: number): void
  /** 静音/取消静音（取消回到静音前的音量） */
  toggleMute(): void
  muted: boolean
  cycleRepeat(): void
  toggleShuffle(): void
  /** 本机记住的听歌模式；`undefined` = 没选过（`config.feedMode` 为空或解析不出） */
  feedMode?: FeedModeRef
  /** 听歌模式流在跑 = 这一批播完会自动续下一批 */
  feedStreaming: boolean
  /** 选中一个听歌模式：记住它（落 `config.feedMode`）并立刻按它取一批起播 */
  selectFeedMode(ref: FeedModeRef): Promise<void>
  /** 按当前记住的模式重新来一批（整队替换） */
  playFeedBatch(): Promise<void>
  /** 停掉自动续播；队列里已有的还是照样播完 */
  stopFeedStream(): void
}

const CoreContext = createContext<CoreValue | null>(null)

export function useCore(): CoreValue {
  const value = useContext(CoreContext)
  if (!value) throw new Error('useCore() 必须在 <CoreProvider> 内使用')
  return value
}

function snapshotOf(core: QishuiCore, audioNote?: string): PlayerSnapshot {
  const state = core.player.state
  return {
    status: state.status,
    track: state.track,
    positionMs: state.positionMs,
    durationMs: state.durationMs,
    clipStartMs: state.clipStartMs,
    volume: state.volume,
    repeat: state.repeat,
    shuffle: state.shuffle,
    sourceKind: state.source?.kind ?? null,
    error: state.error,
    audioNote,
  }
}

function queueOf(core: QishuiCore): QueueSnapshot {
  const q = core.player.queue
  // `items` 与 `index` 必须同一个空间：`index`/`playIndex` 都是「播放顺序」下标，
  // 用 `list`（加入顺序）会在随机播放时对不上行——显示与点击都按 `playOrder`。
  return { items: q.playOrder, index: q.index, repeat: q.repeat, shuffle: q.shuffled }
}

export function CoreProvider({ children }: { children: ReactNode }) {
  const stub = process.env.QISHUI_TUI_STUB === '1'
  // UiProvider 在本组件外层（见 App.tsx）；toast 是 `useCallback([])`，闭包捕获稳定
  const { toast } = useUi()
  const [core, setCore] = useState<QishuiCore>()
  const [error, setError] = useState<string>()
  const [player, setPlayer] = useState<PlayerSnapshot>(INITIAL_PLAYER)
  const [queue, setQueue] = useState<QueueSnapshot>({ items: [], index: -1, repeat: 'off', shuffle: false })
  const [sessionRevision, setSessionRevision] = useState(0)
  const [muted, setMuted] = useState(false)
  const [feedMode, setFeedMode] = useState<FeedModeRef>()
  const [feedStreaming, setFeedStreaming] = useState(false)
  const sinkRef = useRef<AudioSink | null>(null)
  const coreRef = useRef<QishuiCore | null>(null)
  /** 静音前的音量；`toggleMute` 关掉静音时回到这里（0 时用默认 0.8） */
  const preMuteRef = useRef(0)
  /** 当前这一首 mpv 进程的 generation；-1 = 没有活跃的（用于过滤换曲/收尾时的退出） */
  const activeGenRef = useRef(-1)
  /** 起播请求序号：慢的 start() 回来时别把上一首的 generation 写回去 */
  const sourceSeqRef = useRef(0)
  /** mpv 报过的真实时长；换曲清空，重新问一次 */
  const realDurationRef = useRef<number | undefined>(undefined)

  /**
   * 听歌模式的「一批接一批」。`note` 是它唯一往外说话的地方，
   * 顺手把 `active` 同步进 state —— 自动续播那一路是 fire-and-forget，
   * 只有这里能知道「失败到上限、流自己停了」。
   */
  const streamRef = useRef<FeedStream | null>(null)
  if (!streamRef.current) {
    streamRef.current = new FeedStream({
      async fetch(ref) {
        const q = coreRef.current
        if (!q) return []
        const tracks = await q.discover.feedModeTracks(ref)
        return tracks.map((t) => t.data)
      },
      replace(items) {
        const q = coreRef.current
        if (!q) return
        void q.player.playList(items, items[0].id)
      },
      append(items) {
        coreRef.current?.player.enqueue(items)
      },
      note(message, kind) {
        toast(message, kind ?? 'info')
        setFeedStreaming(streamRef.current?.active ?? false)
      },
    })
  }
  const stream = streamRef.current

  useEffect(() => {
    if (stub) return
    let alive = true
    const sink = new AudioSink()
    sinkRef.current = sink
    sink.onError = (message) => {
      if (alive) setPlayer((prev) => ({ ...prev, audioNote: message }))
    }
    createQishui()
      .then((instance) => {
        if (!alive) {
          instance.dispose()
          return
        }
        coreRef.current = instance
        setCore(instance)
        setFeedMode(parseFeedMode(instance.config.feedMode))
      })
      .catch((err: unknown) => {
        if (alive) setError(err instanceof Error ? err.message : String(err))
      })
    return () => {
      alive = false
      void sink.stop()
      coreRef.current?.dispose()
      coreRef.current = null
    }
  }, [stub])

  useEffect(() => {
    if (!core) return
    // 登录/切号/登出、以及 me() 事后补全身份，core 都会发这个事件：登录态由此变成「事件驱动刷新」，
    // 不靠某个入口自己记得 bump
    return core.events.on('account-changed', () => setSessionRevision((n) => n + 1))
  }, [core])

  useEffect(() => {
    if (!core) return
    const instance = core
    const p = instance.player
    const sink = sinkRef.current
    let lastStatus: PlayerStatus = p.state.status
    setPlayer(snapshotOf(instance))
    setQueue(queueOf(instance))

    const offs = [
      p.on('track', () => setPlayer((prev) => ({ ...snapshotOf(instance), audioNote: prev.audioNote }))),
      p.on('progress', () => setPlayer((prev) => ({ ...snapshotOf(instance), audioNote: prev.audioNote }))),
      p.on('error', () => setPlayer((prev) => ({ ...snapshotOf(instance), audioNote: prev.audioNote }))),
      p.on('queue', () => {
        const snapshot = queueOf(instance)
        setQueue(snapshot)
        setPlayer((prev) => ({ ...snapshotOf(instance), audioNote: prev.audioNote }))
        // 续播的触发点在这里而不是 `ended`：core 到曲总是**先发 ended 再动队列**，
        // ended 回调里同步算「还剩几首」算的是上一首那一刻的数。
        stream?.onRemaining(snapshot.index >= 0 ? snapshot.items.length - 1 - snapshot.index : 0)
      }),
      p.on('ended', ({ action }) => {
        // 队列见底（repeat=one 不会走到这里）：core 之后不再发 queue，只能在这儿补
        if (action === 'stop') stream?.onRemaining(0)
      }),
      p.on('source', ({ source }) => {
        const audio: AudioSource = { kind: source.kind, path: source.path, url: source.url }
        // 先把活跃 generation 清掉：换曲时旧 mpv 的退出不能算作「这一首播完了」
        activeGenRef.current = -1
        realDurationRef.current = undefined
        const request = ++sourceSeqRef.current
        void sinkRef.current?.start(audio, { volume: p.volume, startAtMs: p.positionMs }).then((generation) => {
          if (request === sourceSeqRef.current) activeGenRef.current = generation
        })
      }),
      p.on('status', ({ status }) => {
        const prev = lastStatus
        lastStatus = status
        setPlayer((s) => ({ ...snapshotOf(instance), audioNote: s.audioNote }))
        if (status === 'playing' && prev !== 'playing') void sinkRef.current?.pause(false)
        else if (status === 'paused') void sinkRef.current?.pause(true)
        else if (status === 'stopped' || status === 'idle') {
          sourceSeqRef.current++
          activeGenRef.current = -1
          void sinkRef.current?.stop()
        }
      }),
    ]

    // mpv 自己到 EOF：core 时钟没走完也推进（试听片段/转码时元数据时长不可靠，得兜住）。
    // 把位置推到末尾交给 core 的曲终逻辑处理，这样 repeat=one 之类的模式不会被跳过。
    if (sink) {
      sink.onExit = ({ generation }) => {
        if (generation !== activeGenRef.current) return
        activeGenRef.current = -1
        if (p.status !== 'playing') return
        const total = p.durationMs
        if (total > 0) p.seek(total)
        else void p.next()
      }
    }

    // 真实进度：每 400ms 拿 mpv 的 time-pos/duration，纠偏 core 时钟、并把真实时长喂回去
    const timer = setInterval(() => {
      void (async () => {
        const s = sinkRef.current
        if (!s?.ipcEnabled) return
        const status = p.status
        if (status !== 'playing' && status !== 'paused') return
        const position = await s.timePosMs()
        if (position !== undefined && status === 'playing' && Math.abs(position - p.positionMs) > 500) {
          p.seek(position)
        }
        if (realDurationRef.current === undefined) {
          const duration = await s.durationMs()
          if (duration !== undefined) {
            realDurationRef.current = duration
            p.setDuration(duration)
          }
        }
      })()
    }, 400)

    return () => {
      clearInterval(timer)
      if (sink) sink.onExit = undefined
      for (const off of offs) off()
    }
    // stream 是 useRef 里的单例，方法引用恒定：加进依赖不会让订阅重建
  }, [core, stream?.onRemaining])

  const value = useMemo<CoreValue>(() => {
    const instance = () => coreRef.current
    const seek = (ms: number): void => {
      const q = instance()
      if (!q) return
      const clamped = Math.max(0, Math.min(ms, q.player.durationMs || ms))
      q.player.seek(clamped)
      void sinkRef.current?.seek(clamped)
    }
    const applyVolume = (volume: number): void => {
      const q = instance()
      if (!q) return
      const next = Math.max(0, Math.min(1, volume))
      q.player.setVolume(next)
      void sinkRef.current?.setVolume(next)
      setPlayer((s) => ({ ...s, volume: next }))
    }
    return {
      core,
      ready: !!core,
      error,
      stub,
      sessionRevision,
      player,
      queue,
      muted,
      feedMode,
      feedStreaming,
      async playTracks(tracks, startTrackId) {
        const q = instance()
        if (!q || tracks.length === 0) return
        // 用户明确点了某个内容（某张歌单/搜索结果的某首/专辑…）= 不再按听歌模式续播。
        // 这里是所有「点播」的唯一漏斗；空格、n/p/s/r 都不该关流。
        stream?.stop()
        setFeedStreaming(false)
        if (tracks.length === 1) await q.player.play(tracks[0])
        else await q.player.playList(tracks, startTrackId)
      },
      async selectFeedMode(ref) {
        const q = instance()
        if (!q) {
          toast(stub ? '骨架模式不连 core，播不了' : 'core 还没就绪，稍后再试', 'error')
          return
        }
        setFeedMode(ref)
        q.config.feedMode = formatFeedMode(ref)
        // 只是本机记住的偏好：上游没有「保存听歌模式」的写接口，下次启动还是它
        void q.saveConfig()
        await stream?.start(ref)
        setFeedStreaming(stream?.active ?? false)
      },
      async playFeedBatch() {
        const q = instance()
        if (!q) return
        if (!feedMode) {
          toast('还没选过听歌模式（在「听歌」页选一个）', 'info')
          return
        }
        await stream?.start(feedMode)
        setFeedStreaming(stream?.active ?? false)
      },
      stopFeedStream() {
        stream?.stop()
        setFeedStreaming(false)
      },
      async toggle() {
        await instance()?.player.toggle()
      },
      async playNext() {
        await instance()?.player.next()
      },
      async playPrevious() {
        await instance()?.player.previous()
      },
      async playQueueIndex(position) {
        await instance()?.player.playIndex(position)
      },
      seekMs(ms) {
        seek(ms)
      },
      nudgeSeek(deltaMs) {
        const q = instance()
        if (!q) return
        seek(q.player.positionMs + deltaMs)
      },
      nudgeVolume(delta) {
        const q = instance()
        if (!q) return
        const next = Math.max(0, Math.min(1, q.player.volume + delta))
        applyVolume(next)
        // 音量被推离 0 就算退出静音，别让「静音」和实际音量对不上
        if (next > 0) setMuted(false)
      },
      toggleMute() {
        const q = instance()
        if (!q) return
        if (muted) {
          setMuted(false)
          applyVolume(preMuteRef.current > 0 ? preMuteRef.current : 0.8)
          return
        }
        preMuteRef.current = q.player.volume
        setMuted(true)
        applyVolume(0)
      },
      cycleRepeat() {
        const q = instance()
        if (!q) return
        const order: RepeatMode[] = ['off', 'all', 'one']
        const next = order[(order.indexOf(q.player.state.repeat) + 1) % order.length]
        q.player.setRepeat(next)
        setPlayer((s) => ({ ...s, repeat: next }))
      },
      toggleShuffle() {
        const q = instance()
        if (!q) return
        const next = !q.player.state.shuffle
        q.player.setShuffle(next)
        setPlayer((s) => ({ ...s, shuffle: next }))
        setQueue(queueOf(q))
      },
    }
  }, [core, error, player, queue, sessionRevision, muted, stub, feedMode, feedStreaming, stream, toast])

  return <CoreContext.Provider value={value}>{children}</CoreContext.Provider>
}
