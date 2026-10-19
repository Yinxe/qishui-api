/**
 * core 上下文：惰性创建 `QishuiCore`、订阅播放器事件、把播放源喂给 mpv。
 *
 * 首帧不依赖 core（侧边栏/播放条先渲染），core 就绪前各页面显示「启动中」；
 * 创建失败（例如首次注册设备身份失败）也不崩，页面里给一句可读的错误。
 *
 * 这里还负责「播放队列书架」的接线：`core.queues` 管四种队列（推荐 / 我喜欢 / 每张歌单 / 临时）
 * 的切换与位置，推荐队列的自动续批（只往队尾追加、听过的不删）也在那边（core 层，不再是界面里的流状态机）；
 * 本文件只把书架状态搬进 React，并把各屏的「播放」按来源路由到对应队列。
 */

import {
  createQishui,
  type FeedModeRef,
  formatFeedMode,
  type PlayerStatus,
  parseFeedMode,
  type QishuiCore,
  type QueueInfo,
  type RepeatMode,
  recommendQueueId,
  type TrackData,
} from 'qishui-core'
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useUi } from '../ui/context.js'
import { type QueueSpec, recommendTitle } from '../ui/queues.js'
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
  sourceKind: 'cache' | 'remote' | 'local' | null
  error?: string
  /** 起播出声失败的那句话，只跟着**它发生的那一首**（换曲即消失，见 `AudioNote`） */
  audioNote?: string
}

/** 出声报错 + 它属于哪一首（`trackId` 为空 = 报的时候本来就没曲目） */
interface AudioNote {
  trackId?: string
  text: string
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

/** 没记住过模式时，启动起播用哪一档（= 推荐；只写内存，不落配置） */
const DEFAULT_FEED_MODE: FeedModeRef = { kind: 'preference', mode: 'default' }

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
  /** 播放队列书架：推荐 / 我喜欢 / 每张歌单 / 临时（各自记位置，切走再切回来接着上次那一首） */
  queues: QueueInfo[]
  /** 正在播的那份队列 */
  activeQueue?: QueueInfo
  /**
   * 出声入口。`queue` 给了就切到那份队列（歌单 / 喜欢 / 推荐各自是独立的一份），
   * 没给 = 这批是**浏览型结果**（搜索/榜单/专辑/艺人/首页块）→ 进临时队列，整队替换上一批。
   */
  playTracks(tracks: TrackData[], startTrackId?: string, queue?: QueueSpec): Promise<void>
  /** 打开一份队列并起播（临时队列用 `tracks` 装这一批） */
  openQueue(queue: QueueSpec, opts?: { tracks?: TrackData[]; startTrackId?: string; refresh?: boolean }): Promise<void>
  /** 切到书架上已有的队列（各自记位置） */
  activateQueue(id: string): Promise<void>
  /** 把某份队列从书架收起（在播的那份不给删：先切走）；书架随之刷新 */
  removeQueue(id: string): void
  toggle(): Promise<void>
  playNext(): Promise<void>
  playPrevious(): Promise<void>
  /** 播队列里的某一首（按曲目 id：界面那一刻的行号可能已经过期（有人被移出队列），点谁就得播谁） */
  playQueueTrack(trackId: string): Promise<void>
  /** 从队列里移除播放顺序第 n 位；移掉的正好是在播的那首就接着播新的当前 */
  removeQueueIndex(position: number): void
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
  /** 选中一个听歌模式：记住它（落 `config.feedMode`）并立刻按它取一批起播 */
  selectFeedMode(ref: FeedModeRef): Promise<void>
  /** 按当前记住的模式重新来一批（整队替换） */
  playFeedBatch(): Promise<void>
  /**
   * 主动要下一批（界面在队列末尾按 `↓`）：只给在播的**推荐**队列补，一批几首收几首挂队尾。
   * 返回加进去的首数（0 = 这份不是推荐队列 / 没有档位可取 / 上一批还在路上）。
   */
  loadMoreFeed(): Promise<number>
}

const CoreContext = createContext<CoreValue | null>(null)

export function useCore(): CoreValue {
  const value = useContext(CoreContext)
  if (!value) throw new Error('useCore() 必须在 <CoreProvider> 内使用')
  return value
}

function snapshotOf(core: QishuiCore, note?: AudioNote): PlayerSnapshot {
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
    // 报的是哪一首的错就贴在哪儿：这一首之外一律不带过来
    // （`mpv` 不在、这个源没地址…都是一次性的事，一直挂在条上会把好歌也说成坏的）
    audioNote: note && note.trackId === state.track?.id ? note.text : undefined,
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
  const [queues, setQueues] = useState<QueueInfo[]>([])
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
  /** 起播出声的报错，连同「报的是哪一首」：新一首选掉它，播放条据此决定这句话还贴不贴 */
  const noteRef = useRef<AudioNote | undefined>(undefined)

  /**
   * 书架快照：`core.queues.list()` 是唯一真相，这里只是搬进 React（事件驱动刷新）。
   * `useCallback([])`：只碰 ref 与 setState，引用恒定，各处 effect 把它列进依赖不会反复重订阅。
   */
  const syncQueues = useCallback((): void => {
    const q = coreRef.current
    if (q) setQueues(q.queues.list())
  }, [])

  useEffect(() => {
    if (stub) return
    let alive = true
    const sink = new AudioSink()
    sinkRef.current = sink
    sink.onError = (message) => {
      if (!alive) return
      noteRef.current = { trackId: coreRef.current?.player.state.track?.id, text: message }
      setPlayer((prev) => ({ ...prev, audioNote: message }))
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

  /**
   * **启动即起播**：启动页是「听歌」，core 一就绪就按记住的模式（`config.feedMode`）来第一批并自动播；
   * 没记住过就用推荐档 —— 只写内存、不落配置（没选过还是没选过，别替人做选择）。
   * `QISHUI_TUI_AUTOPLAY=0` 可关掉（离线自检、或不想一开就被声音打断）。
   * 只在第一次就绪时跑一次：之后切页/切号都不再自动换队。
   */
  const autoStartedRef = useRef(false)
  useEffect(() => {
    if (!core || stub || autoStartedRef.current) return
    if (process.env.QISHUI_TUI_AUTOPLAY === '0') return
    // 已经有在播/在队里的曲目（比如上层先手播了）就不抢
    if (core.player.state.track) return
    autoStartedRef.current = true
    const ref = feedMode ?? DEFAULT_FEED_MODE
    setFeedMode(ref)
    void (async () => {
      try {
        // 书架是持久化的：这一档上次听到一半就接着听（refresh 会把批次和位置清掉）；
        // 没记住过、或记的是空架，才按新模式重新来一批
        const remembered = core.queues.info(recommendQueueId(ref))
        const refresh = !remembered || remembered.count === 0
        await core.queues.open({ kind: 'recommend', feed: ref, title: recommendTitle(ref), refresh })
        syncQueues()
      } catch (err) {
        toast(err instanceof Error ? err.message : String(err), 'error')
      }
    })()
  }, [core, stub, feedMode, toast, syncQueues])

  useEffect(() => {
    if (!core) return
    const instance = core
    const p = instance.player
    const sink = sinkRef.current
    let lastStatus: PlayerStatus = p.state.status
    setPlayer(snapshotOf(instance))
    setQueue(queueOf(instance))
    syncQueues()

    const offs = [
      p.on('track', () => setPlayer(snapshotOf(instance, noteRef.current))),
      p.on('progress', () => setPlayer(snapshotOf(instance, noteRef.current))),
      p.on('error', () => setPlayer(snapshotOf(instance, noteRef.current))),
      p.on('queue', () => {
        const snapshot = queueOf(instance)
        setQueue(snapshot)
        setPlayer(snapshotOf(instance, noteRef.current))
        // 推荐队列在这条路上记下播放头 / 续批（core 的 QueueBook 自己动手），这里只跟着重画书架
        syncQueues()
      }),
      p.on('source', ({ source }) => {
        // 新一首的出声是另一回事：上一首那句「打不开」不能跟着贴过来（同一首重播也一样，先清）
        noteRef.current = undefined
        const audio: AudioSource = { kind: source.kind, path: source.path, url: source.url }
        // 先把活跃 generation 清掉：换曲时旧 mpv 的退出不能算作「这一首播完了」
        activeGenRef.current = -1
        realDurationRef.current = undefined
        const request = ++sourceSeqRef.current
        void sinkRef.current?.start(audio, { volume: p.volume, startAtMs: p.positionMs }).then((generation) => {
          if (request === sourceSeqRef.current) activeGenRef.current = generation
        })
      }),
      // 书架变了（打开 / 切换 / 推荐队列补进来一批）→ 重画队列弹层与播放页头部
      instance.events.on('queues-changed', () => syncQueues()),
      // 队列自己要说的话（续批失败、停止自动续播）直接冒给 toast
      instance.events.on('queue-note', ({ message, kind }) => toast(message, kind)),
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
            // 本地文件在库里没记时长（不引 ID3 解析）：播放器报回来就补进本地库快照，
            // 下次列表里这一行就有真时长了（纯本地写，不动上游）
            const current = p.current
            if (current?.localPath) void instance.local.rememberDuration(current, duration)
          }
        }
      })()
    }, 400)

    return () => {
      clearInterval(timer)
      if (sink) sink.onExit = undefined
      for (const off of offs) off()
    }
  }, [core, toast, syncQueues])

  const value = useMemo<CoreValue>(() => {
    const instance = () => coreRef.current
    const seek = (ms: number): void => {
      const q = instance()
      if (!q) return
      const clamped = Math.max(0, Math.min(ms, q.player.durationMs || ms))
      q.player.seek(clamped)
      void sinkRef.current?.seek(clamped)
    }
    /** 打开一份队列并起播（所有「点播」的唯一出口，见 `CoreValue.playTracks` 的注释） */
    const openQueue = async (
      spec: QueueSpec,
      opts: { tracks?: TrackData[]; startTrackId?: string; refresh?: boolean } = {},
    ): Promise<void> => {
      const q = instance()
      if (!q) {
        toast(stub ? '骨架模式不连 core，播不了' : 'core 还没就绪，稍后再试', 'error')
        return
      }
      await q.queues.open({
        kind: spec.kind,
        // 推荐 / 临时 / 我喜欢各只有一份（id 固定）；歌单按来源区分，一份歌单一个队列
        id: spec.kind === 'playlist' || spec.kind === 'liked' ? spec.id : undefined,
        title: spec.title,
        // 推荐队列的批次由 core 自己按 `feed` 取；歌单/喜欢给取数入口
        feed: spec.kind === 'recommend' ? spec.feed : undefined,
        load: spec.kind === 'playlist' || spec.kind === 'liked' ? spec.load : undefined,
        items: spec.kind === 'temporary' ? opts.tracks : undefined,
        startTrackId: opts.startTrackId,
        refresh: opts.refresh,
      })
      syncQueues()
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
      queues,
      activeQueue: queues.find((item) => item.active),
      openQueue,
      async playTracks(tracks, startTrackId, queue) {
        if (tracks.length === 0) return
        // 没给队列 = 浏览型结果（搜索/榜单/专辑/艺人/首页块）→ 临时队列，整队替换上一批
        await openQueue(queue ?? { kind: 'temporary', title: '临时播放' }, { tracks, startTrackId })
      },
      async activateQueue(id) {
        const q = instance()
        if (!q) return
        await q.queues.activate(id)
        syncQueues()
      },
      removeQueue(id) {
        // `Queues.remove` 自己发 `queues-changed`（这里再 sync 一次也无妨，幂等）
        instance()?.queues.remove(id)
        syncQueues()
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
        // 每档听歌模式各有一条推荐队列：切到别的档 = 接着上次那一首听；
        // 但「再选一次当前这一档」= 明确的「换一批」（和页面上那条「再来一批」同义）
        const id = recommendQueueId(ref)
        const remembered = q.queues.info(id)
        const refresh = q.queues.active?.id === id || !remembered || remembered.count === 0
        await q.queues.open({ kind: 'recommend', feed: ref, title: recommendTitle(ref), refresh })
        syncQueues()
      },
      async playFeedBatch() {
        const q = instance()
        if (!q) return
        if (!feedMode) {
          toast('还没选过听歌模式（在「听歌」页选一个）', 'info')
          return
        }
        await q.queues.open({ kind: 'recommend', feed: feedMode, title: recommendTitle(feedMode), refresh: true })
        syncQueues()
      },
      async loadMoreFeed() {
        const q = instance()
        if (!q) return 0
        const added = await q.queues.loadMore()
        syncQueues()
        return added
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
      async playQueueTrack(trackId) {
        const q = instance()
        if (!q) return
        // 找不着这首 = 它在你点下来之前已经不在队列里了（比如被「从队列移除」），给句准话，别静默
        if (!(await q.player.playQueueTrack(trackId))) toast('这一首已经不在队列里了', 'info')
      },
      removeQueueIndex(position) {
        // 队列事件由 core 自己发（移完一次、接上播下一首再一次），这里不用手动同步快照
        instance()?.player.removeFromQueue(position)
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
        // 推荐队列是一条自动续批的流：单曲循环会让播放头停在原地、续批永远不触发。
        // 默认已经固定成「关」，手动按到「单曲」是明确的例外，但得提醒一句，别让人以为卡住了
        if (next === 'one' && queues.find((item) => item.active)?.kind === 'recommend') {
          toast('推荐队列是自动续批的流，单曲循环会停在这一首（再按 r 回到「关」）', 'info')
        }
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
  }, [core, error, player, queue, sessionRevision, muted, stub, feedMode, queues, toast, syncQueues])

  return <CoreContext.Provider value={value}>{children}</CoreContext.Provider>
}
