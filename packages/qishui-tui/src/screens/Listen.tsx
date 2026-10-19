/**
 * 听歌（侧边栏第 3 项）= **听歌模式单行 + 正在播放**，一页收齐。
 *
 * 原本「正在播放」另有一个独立播放页（`f` 压栈的两栏页），现已并进这一页——听歌页本来就回答
 * 「现在在听什么」，再单开一页只是多一次跳转。版式沿用当年的两栏**照旧保留播放队列栏**：
 *
 * ```
 * 听歌模式：推荐   推荐  熟悉  新鲜  场景              [再来一批]
 * ┌ 正在播放 ────────────────────────┬ 播放队列 · 推荐 ──────┐
 * │ 曲名                             │    1 晴天 — 周杰伦    │
 * │ 周杰伦  ·  叶惠美                │ >  3 稻香 — 周杰伦    │
 * │ （封面，拉不到就整块不画）        │    4 七里香 — 周杰伦  │
 * │ ●────────── 1:02/4:29            │    …（固定 10 行窗口）│
 * │ [上一首] [播放] [下一首] [喜欢]  │                       │
 * │ [操作] [音量:60] [循环:关] …    │                       │
 * │ 歌词                             │                       │
 * │    上一句                        │                       │
 * │  > 当前行（逐字高亮）            │                       │
 * │    下一句                        │                       │
 * └──────────────────────────────────┴───────────────────────┘
 * ```
 *
 * **窄屏（内容区 < `SPLIT_MIN`）一屏只放得下一栏**，但两栏都在——顶上用 `[歌词] [队列]` tab
 * 明确摆出来（`t` 或点 tab 换），不把队列藏掉。**宽屏**右栏是**可收起的播放队列侧栏**：栏头顶着
 * `[切换队列]`（弹层用 `(x)` 标当前那份，点谁切谁；末尾一条进「播放队列」页管理）和 `[收起]`，
 * 收起后剩一条摘要横带 + `[展开]`，曲目区自己铺满。多份队列的**选择 / 管理**在「播放队列」页
 * （侧边栏第 4 项 / `Q`），这里的右栏只管**当前这一份**。
 *
 * 键位：`←/→`（`h/l`）挪模式高亮、`Enter` 应用（偏好档 = 取一批起播，`场景` = 开弹层）；
 * `b` 把游标交给两排操作按钮（`←/→` 挪、`Enter` 按下去、`b` 还回模式行）——没有选中按钮时
 * `Enter` 才是「应用模式」，治的就是「在听歌页按回车全是切模式」；
 * `t` 歌词 ↔ 队列换栏（右栏收起时 = 展开并切过去），`q` 收起 / 展开右栏（窄屏 = 切到队列栏）；
 * 换到队列后 `↑/↓` 挪队列游标（**游标一出可视窗口就带着窗口滚**：向上回看已经播过的那些，
 * 向下走到最后一行再按一次 = 主动去取下一批），`Enter` 开那一行的操作菜单（`o` 是当前曲目的菜单，两栏都能按）；
 * 歌词栏 `↑/↓`（`k/j`）翻词、`g` 回到跟随播放头。播放键走 `App.tsx` 全局表。
 * 鼠标：点哪栏归哪栏（**与键盘焦点无关**——焦点还在侧边栏也要点得动）、点歌词跳句、
 * 点队列行播它、点 [操作] 开当前曲目的菜单、队列栏上滚轮挪游标（窗口跟着滚）。
 *
 * **右栏那个窗口固定 10 行**（终端太矮就退让给可用高度）：推荐队列**只往后追加、听过的不删**，
 * 于是每首的序号从头到尾就是它自己那一号，窗口只是「看到哪一段」，滚回去还能把听过的再点一遍。
 */
import { Box, type DOMElement, Text } from 'ink'
import {
  FEED_PREFERENCE_MODES,
  type FeedModeRef,
  type FeedModeView,
  type Lyrics,
  MAX_QUEUES,
  recommendQueueId,
  type TrackData,
} from 'qishui-core'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Chip, ChipRow, type ChipSpec } from '../components/Chips.js'
import { Cover } from '../components/Cover.js'
import { LyricsView } from '../components/Lyrics.js'
import { useCore } from '../core/context.js'
import { useUi } from '../ui/context.js'
import type { Entry } from '../ui/entries.js'
import { artistNames, barRatio, displayWidth, formatDuration, progressBar, truncate } from '../ui/format.js'
import { useKeys } from '../ui/keys.js'
import { contentWidth, listHeight } from '../ui/layout.js'
import { isMouseInput, Pressable, useRowClick, useWheelScroll } from '../ui/mouse.js'
import { repeatLabel, shuffleLabel, statusLabel, volumeLabel } from '../ui/playMode.js'
import { queueNote } from '../ui/queues.js'
import {
  buildQueueTrackActions,
  buildTrackActions,
  toggleTrackLike,
  trackLiked,
  trackLikeOf,
} from '../ui/rowActions.js'
import { COLOR, CURRENT_PREFIX, GUTTER, NO_TRACK_TEXT } from '../ui/theme.js'
import { useAsync } from '../ui/useAsync.js'
import { EmptyState, PageTitle, useCursor, windowFor } from '../ui/widgets.js'

/** 焦点栏：宽屏两栏都画（决定 `↑↓`/`Enter` 归谁），窄屏就是当前那一栏 */
type Pane = 'lyrics' | 'queue'

/** 两栏布局的最小内容宽度；比这窄就退成单栏 + 顶部 tab */
const SPLIT_MIN = 64
/** 队列栏的宽度区间（含左边那条竖线） */
const QUEUE_MIN = 26
const QUEUE_MAX = 44
/**
 * 队列栏固定画这么多行（推荐队列只追加、能长到几百首，可视区不能跟着长）：
 * 游标一出这 10 行就带着窗口滚，所以「往上一行」就是回看上一首播过的。
 */
const QUEUE_WINDOW = 10
/** 歌词窗口行数（奇数）：正在唱的那句居中，上下各 `(N-1)/2` 行上下文 */
const LYRIC_WINDOW = 7
/** 模式行右侧那句「没选模式」提示要这么宽才画得下，窄屏省掉它、别把模式挤没了 */
const HINT_MIN_WIDTH = 60

/** 页面状态从这里进、动作从外面注入 —— 条目构造因此可以离线单测 */
export interface ListenCtx {
  /** `feedModes()` 的结果；没拿到就只画偏好三档（core 常量，不依赖请求） */
  modes?: FeedModeView
  /** 本机记住的模式；undefined = 没选过 */
  current?: FeedModeRef
  /** 选中即切模式并起播 */
  pick(ref: FeedModeRef): void
  /** 按当前模式再来一批（`refresh: true` = 整台重来：停掉在播那首，新一批从第一首起播） */
  play(): void
  /** 这一档听歌模式上次听到哪（每档一条推荐队列，切走再切回来接着上次那首）；没播过就是 undefined */
  memory?(ref: FeedModeRef): { count: number; current?: string } | undefined
  closeOverlay(): void
}

export type ModeKey = 'default' | 'familiar' | 'fresh' | 'scene'

export interface ModeOption {
  key: ModeKey
  label: string
  /** 本机记住的就是这一档 */
  active: boolean
  /** 「上次听到哪」；没播过就是 undefined */
  note?: string
  /** 偏好档对应的 `FeedModeRef`；`场景`没有（要开弹层） */
  ref?: FeedModeRef
}

/** 模式 → 给人看的名字；上游没给文案就照实写 id，不编名字 */
export function feedModeLabel(modes: FeedModeView | undefined, ref: FeedModeRef | undefined): string {
  if (!ref) return '未选'
  if (ref.kind === 'preference') {
    return FEED_PREFERENCE_MODES.find((item) => item.mode === ref.mode)?.label ?? ref.mode
  }
  return modes?.scenes.find((item) => item.sceneModeId === ref.sceneModeId)?.text || `场景 ${ref.sceneModeId}`
}

const isCurrent = (a: FeedModeRef | undefined, b: FeedModeRef): boolean =>
  !!a &&
  a.kind === b.kind &&
  (a.kind === 'preference'
    ? b.kind === 'preference' && a.mode === b.mode
    : b.kind === 'scene' && a.sceneModeId === b.sceneModeId)

/** 「这一档上次听到哪」：每档一条推荐队列，切走再切回来接着上次那首，所以这一行能回溯 */
export function memoryNote(ctx: ListenCtx, ref: FeedModeRef): string | undefined {
  const remembered = ctx.memory?.(ref)
  if (!remembered || remembered.count <= 0) return undefined
  return remembered.current ? `上次：${remembered.current}` : `上次取过 ${remembered.count} 首`
}

/** 单选标记：一整页只能有一个 `(x)`（场景弹层里用） */
const mark = (selected: boolean): string => (selected ? '(x)' : '( )')

/** 模式单行：偏好三档（core 常量，不依赖请求）+「场景」（开弹层选） */
export function buildModeOptions(ctx: ListenCtx): ModeOption[] {
  const preferences: ModeOption[] = FEED_PREFERENCE_MODES.map((item) => {
    const ref: FeedModeRef = { kind: 'preference', mode: item.mode }
    return {
      key: item.mode as ModeKey,
      label: item.label,
      active: isCurrent(ctx.current, ref),
      note: memoryNote(ctx, ref),
      ref,
    }
  })
  return [...preferences, { key: 'scene', label: '场景', active: ctx.current?.kind === 'scene' }]
}

/** 场景档收进弹层（四十多条，`ActionMenuOverlay` 自带按游标滚动） */
export function buildSceneEntries(ctx: ListenCtx): Entry[] {
  return (ctx.modes?.scenes ?? [])
    .filter((scene) => scene.sceneModeId !== undefined)
    .map((scene) => {
      const ref: FeedModeRef = { kind: 'scene', sceneModeId: scene.sceneModeId as number }
      return {
        key: `scene:${ref.sceneModeId}`,
        label: `${mark(isCurrent(ctx.current, ref))} ${feedModeLabel(ctx.modes, ref)}`,
        note: memoryNote(ctx, ref),
        onEnter: () => {
          // 先关弹层再切模式：起播的提示别被弹层挡住（弹层本身是打开那一刻的快照）
          ctx.closeOverlay()
          ctx.pick(ref)
        },
      }
    })
}

/** 队列行：`> 3 曲名 — 艺人`（在播那行前缀 `>`），与播放队列页同一口径 */
function formatQueueRow(item: TrackData, index: number, playing: boolean, width: number): string {
  const marker = playing ? CURRENT_PREFIX : ' '
  const head = `${marker}${String(index + 1).padStart(3)} `
  const artist = item.artists?.length ? artistNames(item.artists) : ''
  const tail = artist ? ` — ${artist}` : ''
  const nameWidth = Math.max(6, width - head.length - displayWidth(tail))
  return `${head}${truncate(item.name, nameWidth)}${tail}`
}

export function ListenScreen({ active }: { active: boolean }) {
  const {
    core,
    player,
    feedMode,
    queues,
    activeQueue,
    queue,
    activateQueue,
    playTracks,
    toggle,
    playNext,
    playPrevious,
    playQueueTrack,
    removeQueueIndex,
    seekMs,
    nudgeSeek,
    nudgeVolume,
    toggleMute,
    muted,
    cycleRepeat,
    toggleShuffle,
    selectFeedMode,
    playFeedBatch,
    loadMoreFeed,
  } = useCore()
  const ui = useUi()
  const qishui = core

  const modes = useAsync<FeedModeView>(
    qishui ? () => qishui.discover.feedModes() : undefined,
    `modes:${qishui?.session.activeUid ?? ''}`,
  )

  const [highlight, setHighlight] = useState(0)
  const [pane, setPane] = useState<Pane>('lyrics')
  /** 宽屏右栏（播放队列侧栏）展开还是收起；窄屏不适用（走 tab） */
  const [queueOpen, setQueueOpen] = useState(true)
  const [lyrics, setLyrics] = useState<Lyrics | undefined>()
  /** 手动翻词翻到的居中句；null = 跟着播放头走 */
  const [pinned, setPinned] = useState<number | null>(null)
  /** `b` 把键盘游标交给两排操作按钮（按钮的 key）；null = 游标在模式行 */
  const [btn, setBtn] = useState<string | null>(null)
  /** 这张封面确实拉不到（无 url / 无 chafa / 断网）：整块收掉，别留一坨空白 */
  const [coverGone, setCoverGone] = useState(false)
  const lyricsRef = useRef<DOMElement>(null)
  const queueRef = useRef<DOMElement>(null)
  const modeRef = useRef<DOMElement>(null)
  /** 「下一批已经在路上」：连着按 ↓ 只发一次请求（core 那边也有互斥，这里免得按下没反馈还重复问） */
  const morePending = useRef(false)

  const track = player.track
  /** 封面确认拉不到：把那一块整个收掉、行数还给歌词（换封面时下面的 effect 会重置） */
  const onCoverEmpty = useCallback(() => setCoverGone(true), [])
  const ctx: ListenCtx = {
    modes: modes.data,
    current: feedMode,
    pick: (ref) => void selectFeedMode(ref),
    play: () => void playFeedBatch(),
    memory: (ref) => {
      const found = queues.find((item) => item.id === recommendQueueId(ref))
      return found ? { count: found.count, current: found.current } : undefined
    },
    closeOverlay: ui.closeOverlay,
  }
  const options = buildModeOptions(ctx)
  const sceneCount = ctx.modes?.scenes.filter((scene) => scene.sceneModeId !== undefined).length ?? 0

  // 高亮跟着本机记住的模式走（别处在外部切了模式，这一行也要跟）
  const feedKey = feedMode ? (feedMode.kind === 'preference' ? `p:${feedMode.mode}` : `s:${feedMode.sceneModeId}`) : ''
  // biome-ignore lint/correctness/useExhaustiveDependencies: 只认「换成哪一档」这一个信号
  useEffect(() => {
    const index = options.findIndex((option) => option.active)
    if (index >= 0) setHighlight(index)
  }, [feedKey])

  // 只按「当前曲目 id」重取歌词：player 对象每次进度事件都换新，别让它进依赖
  // biome-ignore lint/correctness/useExhaustiveDependencies: 见上
  useEffect(() => {
    let alive = true
    if (!qishui || !track) {
      setLyrics(undefined)
      return
    }
    qishui.player
      .lyricsFor()
      .then((loaded) => {
        if (alive) setLyrics(loaded)
      })
      .catch(() => {
        if (alive) setLyrics(undefined)
      })
    return () => {
      alive = false
    }
  }, [qishui, track?.id])

  // 换曲就回到「跟随播放头」：上一首的手动位置对这首没意义；按钮游标也交还给模式行
  // biome-ignore lint/correctness/useExhaustiveDependencies: 同上
  useEffect(() => {
    setPinned(null)
    setBtn(null)
  }, [track?.id])

  // 换封面就重新试一次（上一张拉不到不代表这张也不行）
  // biome-ignore lint/correctness/useExhaustiveDependencies: 只认「换的是哪张图」
  useEffect(() => setCoverGone(false), [track?.coverUrl])

  // 队列栏游标：`↑↓` 挪（游标一出可视窗口就带着窗口滚）、`Enter` 开这一行的操作菜单（窄屏换到队列栏才吃键）
  const { cursor: queueCursor, setCursor: setQueueCursor } = useCursor(queue.items.length, {
    active: active && pane === 'queue',
    // 一页 = 队列栏那个**固定 10 行**的窗口（`QUEUE_WINDOW`），不是左栏歌词的高度：
    // 这条游标只在队列栏生效（`active` 就这么写着），`PgDn` 该跳的是「看得见的这一屏」。
    pageSize: QUEUE_WINDOW,
    onEnter: (index) => openQueueMenu(index),
    // 停在最后一行还按 ↓ = **主动要下一批**（不等 core 那个「剩 ≤2 首」的阈值）；只有推荐队列会长
    onTailDown: () => {
      if (activeQueue?.kind !== 'recommend') return false
      if (!activeQueue.refilling) {
        ui.toast('这一档已经不再自动补批（连续几批没取到）——把当前模式再选一次就重新来一批', 'info')
        return true
      }
      if (morePending.current) return true
      morePending.current = true
      const at = queue.items.length
      void loadMoreFeed().then((added) => {
        morePending.current = false
        // 游标落到新增那批的第一首：按 ↓ 的手感就是「往下走到了新的一首」
        if (added > 0) setQueueCursor(at)
      })
      return true
    },
  })

  // 换队列（或首次填充进来）：游标落到当前在播那一首；之后播放头自己往前走不抢游标
  // biome-ignore lint/correctness/useExhaustiveDependencies: 只认「换的是哪一份队列」
  useEffect(() => {
    setQueueCursor(Math.max(0, Math.min(queue.index, Math.max(0, queue.items.length - 1))))
  }, [activeQueue?.id])

  const state = qishui?.player.lyricState()
  const activeIndex = state?.index ?? -1
  // 歌词时间轴是整首歌的，试听片段的播放位置要加上片段起点才能对上词
  const songMs = player.positionMs + player.clipStartMs
  const previewing =
    player.clipStartMs > 0 ||
    (!!track?.durationMs && player.durationMs > 0 && player.durationMs < track.durationMs - 1500)

  // 宽度：够宽就并排两栏（左曲目信息 + 歌词 / 右队列侧栏），窄了就只剩一栏、顶上给 tab
  const totalCols = contentWidth(ui.columns, ui.sidebarWidth, 0)
  const split = totalCols >= SPLIT_MIN
  const queueWidth = Math.max(QUEUE_MIN, Math.min(QUEUE_MAX, Math.round(totalCols * 0.42)))
  /** 右栏此刻占不占竖排位置：宽屏看「收起没有」，窄屏看当前 tab */
  const queuePane = split ? queueOpen : pane === 'queue'
  const infoWidth = split && queuePane ? Math.max(28, totalCols - queueWidth) : totalCols

  const contentRows = listHeight(ui.rows, 3, 6)
  // 两栏之外的固定行：页头 + 模式行；再除一行 —— 窄屏是 tab 行、宽屏收起时是摘要横带
  const bodyRows = Math.max(4, contentRows - 2 - (split && queuePane ? 0 : 1))
  // 左栏固定行：正在播放 / 曲名 / 作者 / 进度 / 两排开关 / 歌词标题
  const INFO_FIXED = 7
  const room = Math.max(3, bodyRows - INFO_FIXED)
  // 封面：**有图才占位置**——没 url 直接不留，拉不到由 Cover 回调把这块收掉、行数还给歌词；
  // 有 url 就先按方形留位（`2N × N` 格 ≈ 平等像素），等真图/失败回来再定
  const hasCover = Boolean(track?.coverUrl) && !coverGone
  const coverRows = hasCover ? Math.max(3, Math.min(12, Math.floor(room / 2))) : 0
  const coverCols = Math.max(8, Math.min(Math.max(coverRows, 4) * 2, Math.max(8, infoWidth - 4)))
  const lyricArea = Math.max(1, room - coverRows)
  const lines = lyrics?.lines ?? []
  const lyricCap = Math.min(LYRIC_WINDOW, lyricArea)
  const lyricRows = Math.max(1, lyricCap - (lyricCap % 2 === 0 ? 1 : 0))
  const lyricHalf = Math.floor(lyricRows / 2)
  const lyricPadTop = Math.floor(Math.max(0, lyricArea - lyricRows) / 2)
  const lyricCenter = pinned ?? Math.max(0, activeIndex)
  const lyricStart = lyricCenter - lyricHalf
  const highlighted = options[highlight]
  // 右栏：头 1 行 + 列表。**窗口固定 10 行**（`QUEUE_WINDOW`），可用高度不够才退让——
  // 推荐队列只往后追加、能长到几百首，可视区跟着长就没法看了，所以「看到哪一段」由游标决定、行号不变
  const queueHeight = Math.max(2, bodyRows - 1)
  const queueWindow = windowFor(queue.items.length, Math.min(QUEUE_WINDOW, queueHeight), queueCursor)

  /**
   * 两排操作按钮（合成一份，渲染时切成两段）：`b` 的游标在这一份上前后挪，
   * 「喜欢」跟着当前曲目的水印/本地库状态显示「喜欢 / 已喜欢」，按下去走与菜单同一套 toggle。
   */
  const controls: ChipSpec[] = track
    ? [
        { key: 'prev', label: '上一首', onPress: () => void playPrevious() },
        { key: 'toggle', label: statusLabel(player.status), onPress: () => void toggle() },
        { key: 'next', label: '下一首', onPress: () => void playNext() },
        {
          key: 'like',
          label: trackLiked(qishui, trackLikeOf(track)) ? '已喜欢' : '喜欢',
          onPress: () => void toggleTrackLike({ ui, core: qishui, track: trackLikeOf(track) }),
        },
        { key: 'actions', label: '操作', onPress: openCurrentMenu },
        {
          key: 'volume',
          label: volumeLabel(muted, Math.round(player.volume * 100)),
          onPress: toggleMute,
          onWheel: (delta) => nudgeVolume(delta * 0.05),
        },
        { key: 'repeat', label: repeatLabel(player.repeat), onPress: cycleRepeat },
        { key: 'shuffle', label: shuffleLabel(player.shuffle), onPress: toggleShuffle },
      ]
    : []

  /** 鼠标/键把焦点交给哪一栏（窄屏时顺便把它切到前台） */
  function takePane(next: Pane): void {
    if (pane !== next) setPane(next)
    if (ui.focus !== 'content') ui.setFocus('content')
  }

  /** 高亮的那档模式：偏好档直接取一批起播，`场景`开弹层 */
  function applyOption(index: number): void {
    const option = options[index]
    if (!option) return
    ui.setFocus('content')
    if (option.ref) {
      void selectFeedMode(option.ref)
      return
    }
    const entries = buildSceneEntries(ctx)
    if (!entries.length) {
      ui.toast('还没拿到场景列表（R 刷新）', 'info')
      return
    }
    ui.openOverlay({ kind: 'actions', title: `听歌场景（${entries.length}）`, entries })
  }

  /** 当前这首的操作菜单：详情 / 喜欢 / 评论 / 加入歌单 / 相似歌曲 / 不感兴趣 / 举报 */
  function openCurrentMenu(): void {
    if (!track) {
      ui.toast(NO_TRACK_TEXT, 'info')
      return
    }
    if (!qishui) {
      ui.toast('core 还没就绪，稍后再试', 'error')
      return
    }
    const entries = buildTrackActions({ ui, core: qishui, track: trackLikeOf(track), play: playTracks })
    ui.openOverlay({ kind: 'actions', title: `${track.name} 的操作`, entries })
  }

  /** 队列栏某一行的操作菜单：同一份条目，外加「立即播放」「从队列移除」 */
  function openQueueMenu(index: number): void {
    const item = queue.items[index]
    if (!item) return
    if (!qishui) {
      ui.toast('core 还没就绪，稍后再试', 'error')
      return
    }
    const entries = buildQueueTrackActions({
      ui,
      core: qishui,
      track: trackLikeOf(item),
      position: index,
      jump: () => void playQueueTrack(item.id),
      remove: () => removeQueueIndex(index),
      play: playTracks,
    })
    ui.openOverlay({ kind: 'actions', title: `${item.name} 的操作`, entries })
  }

  /** 切换队列弹层：`(x)` 标着当前在播那份，点谁切谁；末尾一条进「播放队列」页管理 */
  function openQueueSwitcher(): void {
    const entries: Entry[] = queues.map((item) => ({
      key: `switch:${item.id}`,
      label: `${mark(item.active)} ${truncate(item.title, 24)}`,
      note: queueNote(item),
      onEnter: () => {
        // 先关弹层再起播：切队列的 toast 别被弹层挡住（同场景弹层的口径）
        ui.closeOverlay()
        if (!item.active) void activateQueue(item.id)
      },
    }))
    if (!entries.length) {
      entries.push({ key: 'empty', label: '书架是空的', note: '点一首歌或选个听歌模式，队列就建起来', disabled: true })
    }
    entries.push({
      key: 'manage',
      label: '管理播放队列',
      note: `去「播放队列」页收起队列 / 看当前队列曲目（${queues.length}/${MAX_QUEUES}）`,
      onEnter: () => {
        ui.closeOverlay()
        ui.push({ kind: 'root', root: 'queues' })
      },
    })
    ui.openOverlay({ kind: 'actions', title: `切换播放队列（${queues.length}）`, entries })
  }

  /** 点「艺人 · 专辑」行：有专辑进专辑，否则进艺人热歌 */
  function openParent(): void {
    const album = track?.album
    const artist = track?.artists?.[0]
    if (album?.id) ui.push({ kind: 'list', source: { kind: 'album', id: album.id } })
    else if (artist?.id) ui.push({ kind: 'list', source: { kind: 'artist', id: artist.id, tab: 'hot' } })
    else ui.toast('这首歌没有可跳转的专辑或艺人', 'info')
  }

  // 滚轮：模式行挪高亮、歌词翻窗口（pin 住居中那句）、队列挪游标
  // 鼠标**不吃「键盘焦点在不在内容区」**：启动时焦点默认在侧边栏（`ui/context.tsx`），
  // 拿 `active` 门控就等于「刚进来点队列没反应」；点完由 `takePane`/`setFocus` 把焦点交给内容，
  // 与列表页 `List.tsx` 的 `mouseActive` 同一口径。键盘照旧只认 `active`。
  const mouseActive = !ui.overlay
  useWheelScroll(
    modeRef,
    (delta) => setHighlight((current) => (current + delta + options.length) % options.length),
    mouseActive,
  )
  useWheelScroll(
    lyricsRef,
    (delta) => {
      takePane('lyrics')
      setPinned(Math.max(0, Math.min(lyricCenter + delta, Math.max(0, lines.length - 1))))
    },
    mouseActive && (split || pane === 'lyrics'),
  )
  useWheelScroll(
    queueRef,
    (delta) => {
      takePane('queue')
      setQueueCursor(Math.max(0, Math.min(queue.items.length - 1, queueCursor + delta)))
    },
    mouseActive && (split || pane === 'queue'),
  )
  // 点歌词行 = 跳到那一句；点队列行 = 选中并播它
  useRowClick(
    lyricsRef,
    (row) => {
      takePane('lyrics')
      const index = lyricStart + row
      const line = lines[index]
      // 首尾留白那几行不是歌词；界面用的是整首歌的时间轴，跳到某句要减掉试听片段起点；署名行没有时间，点它没反应
      if (!line || line.startMs == null) return
      seekMs(Math.max(0, line.startMs - player.clipStartMs))
    },
    mouseActive && (split || pane === 'lyrics'),
  )
  useRowClick(
    queueRef,
    (row) => {
      const item = queue.items[queueWindow.start + row]
      if (!item) return
      const index = queueWindow.start + row
      takePane('queue')
      setQueueCursor(index)
      // 按 id 播：这一行点下来是谁就播谁，队列刚好挪了位也不会播成隔壁那首
      void playQueueTrack(item.id)
    },
    mouseActive && (split || pane === 'queue'),
  )

  // `t`：歌词 ↔ 队列换栏（窄屏等于换 tab；宽栏收起时 = 展开并切过去）。
  // `q`：收起 / 展开右栏队列侧栏（窄屏没有可收起的侧栏，等于切到队列栏）。两栏都在听键盘，单独挂一条。
  useKeys(
    (input) => {
      if (isMouseInput(input)) return
      if (input === 't') {
        if (split && !queueOpen) {
          setQueueOpen(true)
          setPane('queue')
          return
        }
        setPane((current) => (current === 'lyrics' ? 'queue' : 'lyrics'))
        return
      }
      if (input === 'q') {
        if (split) setQueueOpen((open) => !open)
        else setPane((current) => (current === 'lyrics' ? 'queue' : 'lyrics'))
      }
    },
    { isActive: active },
  )

  // 歌词栏 + 模式行 / 操作按钮的键（队列栏的 `↑↓`/`Enter` 归 `useCursor`）
  // `b` = 把游标交给两排操作按钮：此后 `←/→` 在按钮间挪、`Enter` 按下游标那颗；游标回模式行才轮到「应用模式」
  useKeys(
    (input, key) => {
      if (isMouseInput(input)) return
      if (input === 'b') {
        if (!track) {
          ui.toast(NO_TRACK_TEXT, 'info')
          return
        }
        setBtn((current) => (current ? null : 'toggle'))
        return
      }
      if (btn) {
        const at = controls.findIndex((item) => item.key === btn)
        if (key.leftArrow || input === 'h') {
          setBtn(controls[(at - 1 + controls.length) % controls.length].key)
          return
        }
        if (key.rightArrow || input === 'l') {
          setBtn(controls[(at + 1) % controls.length].key)
          return
        }
        if (key.return) {
          controls[at]?.onPress()
          return
        }
      } else {
        if (key.leftArrow || input === 'h') {
          setHighlight((current) => (current - 1 + options.length) % options.length)
          return
        }
        if (key.rightArrow || input === 'l') {
          setHighlight((current) => (current + 1) % options.length)
          return
        }
        if (key.return) {
          applyOption(highlight)
          return
        }
      }
      if (key.upArrow || input === 'k') {
        setPinned(Math.max(0, lyricCenter - 1))
        return
      }
      if (key.downArrow || input === 'j') {
        setPinned(Math.min(Math.max(0, lines.length - 1), lyricCenter + 1))
        return
      }
      if (input === 'g') {
        setPinned(null)
        return
      }
      if (input === 'o') {
        openCurrentMenu()
        return
      }
      if (input === 'R') {
        modes.reload()
      }
    },
    { isActive: active && pane === 'lyrics' },
  )

  const showInfo = split || pane === 'lyrics'
  const showQueue = queuePane

  return (
    <Box flexDirection="column" flexGrow={1}>
      <PageTitle
        title="听歌"
        subtitle={[
          statusLabel(player.status),
          `队列 ${queue.items.length} 首`,
          split ? undefined : pane === 'queue' ? '焦点：队列' : '焦点：歌词',
        ]
          .filter(Boolean)
          .join('  ·  ')}
      />
      {/* 听歌模式：单行选择（←/→ 挪、Enter 应用；场景开弹层） */}
      <Box flexShrink={0} paddingX={GUTTER} justifyContent="space-between" gap={1}>
        <Box gap={2} ref={modeRef}>
          <Text color={COLOR.accent}>听歌模式：{feedModeLabel(modes.data, feedMode)}</Text>
          {options.map((option, index) => (
            <Pressable key={option.key} onPress={() => applyOption(index)}>
              <Text
                color={COLOR.accent}
                bold={index === highlight}
                underline={index === highlight}
                dimColor={index !== highlight}
              >
                {index === highlight ? `[${option.label}]` : ` ${option.label} `}
              </Text>
            </Pressable>
          ))}
        </Box>
        {highlighted?.note && !highlighted.active ? (
          // 挪到别的档时先给你看「上次听到哪」，比一句泛泛的提示有用
          <Text dimColor>{highlighted.note}</Text>
        ) : feedMode ? (
          <Pressable onPress={() => void playFeedBatch()}>
            <Text dimColor>[再来一批]</Text>
          </Pressable>
        ) : totalCols >= HINT_MIN_WIDTH ? (
          <Text dimColor>{sceneCount > 0 ? `场景 ${sceneCount} 个` : '选一个模式就开始随机播'}</Text>
        ) : null}
      </Box>

      {split ? null : (
        // 窄屏：一屏只放得下一栏，但两栏都在——用 tab 明确摆出来，`t` 或点 tab 换
        <Box flexShrink={0} paddingX={GUTTER} gap={2}>
          <PaneTab label="歌词" active={pane === 'lyrics'} onPress={() => takePane('lyrics')} />
          <PaneTab label="队列" active={pane === 'queue'} onPress={() => takePane('queue')} />
        </Box>
      )}
      {split && !queuePane ? (
        // 收起时剩这一条摘要带：这份队列是谁、几首、播到第几首，`[展开]`（或 `q`）把侧栏收回来
        <Box flexShrink={0} paddingX={GUTTER} gap={1}>
          <Box flexGrow={1}>
            <Text dimColor wrap="truncate-end">
              {`播放队列 ${queue.items.length} 首${
                activeQueue ? ` · ${truncate(activeQueue.title, 16)}` : ''
              }${queue.index >= 0 ? ` · 第 ${queue.index + 1} 首` : ''}`}
            </Text>
          </Box>
          <Chip label="展开" onPress={() => setQueueOpen(true)} />
        </Box>
      ) : null}

      <Box flexDirection="row" flexGrow={1} overflow="hidden">
        {showInfo ? (
          <Box flexDirection="column" width={infoWidth} paddingX={GUTTER} flexShrink={0}>
            <Text bold color={COLOR.accent}>
              正在播放
            </Text>
            {track ? (
              <>
                <Pressable onPress={openCurrentMenu}>
                  <Text bold color={COLOR.accent} wrap="truncate-end">
                    {truncate(track.name, infoWidth - GUTTER * 2)}
                  </Text>
                </Pressable>
                <Pressable onPress={openParent}>
                  <Text dimColor underline wrap="truncate-end">
                    {truncate(
                      `${artistNames(track.artists)}${track.album?.name ? `  ·  ${track.album.name}` : ''}`,
                      infoWidth - GUTTER * 2,
                    )}
                  </Text>
                </Pressable>
                {hasCover ? (
                  <Cover
                    url={track.coverUrl}
                    cols={coverCols}
                    rows={coverRows}
                    onEmpty={onCoverEmpty}
                    cacheKey={track.id}
                    load={async () => await core?.media.cachedCover(track.id)}
                  />
                ) : null}
                <Box flexShrink={0}>
                  <Pressable
                    onPress={(col, width) => {
                      if (player.durationMs > 0) seekMs(Math.round(barRatio(col, width) * player.durationMs))
                    }}
                    onWheel={(delta) => nudgeSeek(delta * 5_000)}
                  >
                    <Text color={COLOR.accent}>
                      {progressBar(player.positionMs, player.durationMs, Math.max(10, Math.min(32, infoWidth - 26)))}
                    </Text>
                  </Pressable>
                  <Text dimColor>
                    {' '}
                    {formatDuration(player.positionMs)}/{formatDuration(player.durationMs)}
                  </Text>
                  {previewing ? <Text color={COLOR.warning}> 试听片段</Text> : null}
                </Box>
                <ChipRow width={infoWidth - GUTTER * 2} chips={controls.slice(0, 4)} cursor={btn ?? undefined} />
                {/* 按优先级排：装不下从尾巴丢 —— `[操作]` 是鼠标开菜单的唯一入口、`音量` 在这页没有别的口子 */}
                <ChipRow width={infoWidth - GUTTER * 2} chips={controls.slice(4)} cursor={btn ?? undefined} />
                <Box flexShrink={0}>
                  <Text bold color={COLOR.accent}>
                    歌词
                  </Text>
                </Box>
                <Box flexDirection="column" flexShrink={0}>
                  {/* 上方留白：一个 Text 里塞 lyricPadTop 行空格（不逐个建元素，免得一排 key 都是下标） */}
                  {lyricPadTop > 0 ? <Text>{Array.from({ length: lyricPadTop }, () => ' ').join('\n')}</Text> : null}
                  <Box ref={lyricsRef} flexDirection="column">
                    <LyricsView
                      lyrics={lyrics}
                      activeIndex={activeIndex}
                      songMs={songMs}
                      start={lyricStart}
                      height={lyricRows}
                    />
                  </Box>
                </Box>
              </>
            ) : (
              <EmptyState message={NO_TRACK_TEXT} hint="选一个听歌模式起播，或去列表里 Enter 点一首" />
            )}
          </Box>
        ) : null}
        {showQueue ? (
          <Box
            flexDirection="column"
            width={split ? queueWidth : infoWidth}
            borderStyle={split ? 'single' : undefined}
            borderTop={false}
            borderBottom={false}
            borderRight={false}
            borderColor={COLOR.muted}
            paddingLeft={GUTTER}
          >
            {/* 栏头：这份队列是谁的（推荐 / 歌单 / 我喜欢 / 临时）+ `[切换队列]` 弹层 + `[收起]`（`q` 同义） */}
            <Box flexShrink={0} justifyContent="space-between" gap={1}>
              <Text bold color={COLOR.accent} wrap="truncate-end">
                {activeQueue ? `播放队列 · ${truncate(activeQueue.title, 12)}` : '播放队列'}
              </Text>
              <ChipRow
                width={Math.max(0, (split ? queueWidth : infoWidth) - (split ? 3 : 2) - 15)}
                chips={[
                  { key: 'switch', label: '切换队列', onPress: openQueueSwitcher },
                  // 窄屏走 tab，没有「收起」这一说
                  ...(split ? [{ key: 'collapse', label: '收起', onPress: () => setQueueOpen(false) }] : []),
                ]}
              />
            </Box>
            <Box ref={queueRef} flexDirection="column">
              {queue.items.length === 0 ? (
                <Text dimColor>队列为空</Text>
              ) : (
                queue.items.slice(queueWindow.start, queueWindow.end).map((item, offset) => {
                  const index = queueWindow.start + offset
                  const playing = index === queue.index
                  const selected = index === queueCursor
                  return (
                    <Text
                      key={`${item.id}-${index}`}
                      underline={selected}
                      color={selected ? COLOR.accent : playing ? COLOR.success : undefined}
                      dimColor={!selected && !playing}
                      wrap="truncate-end"
                    >
                      {formatQueueRow(item, index, playing, (split ? queueWidth : infoWidth) - GUTTER * 2 - 1)}
                    </Text>
                  )
                })
              )}
            </Box>
          </Box>
        ) : null}
      </Box>
    </Box>
  )
}

/**
 * 窄屏的栏 tab：选中项 `[歌词]`（accent + 加粗 + 下划线），未选中写 ` 歌词 `（淡显）。
 * 与侧边栏同一套「激活」口径：**方括号 = 当前**，所以没有颜色也能一眼看出在哪一栏。
 */
function PaneTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <Text color={active ? COLOR.accent : undefined} bold={active} underline={active} dimColor={!active}>
        {active ? `[${label}]` : ` ${label} `}
      </Text>
    </Pressable>
  )
}
