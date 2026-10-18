/**
 * 听歌：听歌模式的**单选台**（侧边栏第 3 项）。
 *
 * 这不是列表页 —— 上游的 `FeedSongTab`/`FeedRadioTracks` 每次只随机回一小批（实测 6 首），
 * 是「随机播放的批次来源」，凑一屏来浏览是假象。所以这一页只做一件事：**定当前模式**（只能一个值），
 * 选中即按它取一批起播，播完由 `../feedStream.ts` 自动续下一批。
 *
 * 两个「当前」要分清：`(x)` = 本机记住的 `config.feedMode`；`（上游当前）` = 上游 `feed_mode_bar`
 * 里那一条（它只是上游栏的显示，不是本机真相源），两者不一致就并存显示。
 */
import { Box } from 'ink'
import { FEED_PREFERENCE_MODES, type FeedModeRef, type FeedModeView, formatFeedMode } from 'qishui-core'
import { useCore } from '../core/context.js'
import { FEED_REFILL_AT } from '../feedStream.js'
import { useUi } from '../ui/context.js'
import { type Entry, type Section, SectionView, useEntries } from '../ui/entries.js'
import { listHeight } from '../ui/layout.js'
import { useAsync } from '../ui/useAsync.js'
import { ErrorState, Loading, PageTitle } from '../ui/widgets.js'

/** 页面状态从这里进、动作从外面注入 —— 条目构造因此可以离线单测（同 `ui/rowActions.ts` 的口径） */
export interface ListenCtx {
  /** `feedModes()` 的结果；没拿到就只画常用三条（它们是 core 的常量，不依赖请求） */
  modes?: FeedModeView
  /** 本机记住的模式；undefined = 没选过 */
  current?: FeedModeRef
  /** 模式流在跑 = 这一批播完自动续下一批 */
  streaming: boolean
  /** 选中即切模式并起播 */
  pick(ref: FeedModeRef): void
  /** 按当前模式再来一批（整队替换） */
  play(): void
  /** 停止自动续播 */
  stop(): void
  openScenes(entries: Entry[]): void
  closeOverlay(): void
}

const isCurrent = (a: FeedModeRef | undefined, b: FeedModeRef): boolean =>
  !!a && formatFeedMode(a) === formatFeedMode(b)

/** 单选标记：一整页只能有一个 `(x)` */
const mark = (selected: boolean): string => (selected ? '(x)' : '( )')

/** 模式 → 给人看的名字；上游没给文案就照实写 id，不编名字 */
export function feedModeLabel(modes: FeedModeView | undefined, ref: FeedModeRef | undefined): string {
  if (!ref) return '未选'
  if (ref.kind === 'preference') {
    return FEED_PREFERENCE_MODES.find((item) => item.mode === ref.mode)?.label ?? ref.mode
  }
  return modes?.scenes.find((item) => item.sceneModeId === ref.sceneModeId)?.text || `场景 ${ref.sceneModeId}`
}

/** 场景档收进弹层（45 条，`ActionMenuOverlay` 自带按游标滚动） */
export function buildSceneEntries(ctx: ListenCtx): Entry[] {
  return (ctx.modes?.scenes ?? [])
    .filter((scene) => scene.sceneModeId !== undefined)
    .map((scene) => {
      const ref: FeedModeRef = { kind: 'scene', sceneModeId: scene.sceneModeId as number }
      return {
        key: `scene:${ref.sceneModeId}`,
        label: `${mark(isCurrent(ctx.current, ref))} ${feedModeLabel(ctx.modes, ref)}`,
        onEnter: () => {
          // 先关弹层再切模式：起播的提示别被弹层挡住（弹层本身是打开那一刻的快照）
          ctx.closeOverlay()
          ctx.pick(ref)
        },
      }
    })
}

export function buildListenSections(ctx: ListenCtx): Section[] {
  const scenes = buildSceneEntries(ctx)
  const preferences: Entry[] = FEED_PREFERENCE_MODES.map((item) => {
    const ref: FeedModeRef = { kind: 'preference', mode: item.mode }
    return {
      key: `pref:${item.mode}`,
      label: `${mark(isCurrent(ctx.current, ref))} ${item.label}`,
      note: ctx.modes?.preferences.find((pref) => pref.mode === item.mode)?.current ? '（上游当前）' : undefined,
      onEnter: () => ctx.pick(ref),
    }
  })
  const sceneGate: Entry = scenes.length
    ? {
        key: 'scenes',
        label: `更多场景（${scenes.length}）> 选择`,
        note: '选一个即按它起播',
        onEnter: () => ctx.openScenes(scenes),
      }
    : { key: 'scenes', label: '更多场景 > 选择', note: '还没拿到场景列表（R 刷新）', disabled: true }

  const stream: Entry[] = []
  if (ctx.streaming) {
    stream.push({
      key: 'stop',
      label: '停止自动续播',
      note: `剩 ${FEED_REFILL_AT} 首就补一批 · 当前 ${feedModeLabel(ctx.modes, ctx.current)}`,
      onEnter: ctx.stop,
    })
  } else if (ctx.current) {
    stream.push({
      key: 'play',
      label: `按「${feedModeLabel(ctx.modes, ctx.current)}」再来一批`,
      note: '整队换一批并起播',
      onEnter: ctx.play,
    })
  } else {
    stream.push({ key: 'none', label: '未选模式：上面选一个就开始随机播', disabled: true })
  }

  return [
    { title: '常用', entries: preferences },
    { title: '场景', entries: [sceneGate] },
    { title: '自动续播', entries: stream },
  ]
}

export function ListenScreen({ active }: { active: boolean }) {
  const core = useCore()
  const ui = useUi()
  const { core: qishui } = core
  const modes = useAsync<FeedModeView>(
    qishui ? () => qishui.discover.feedModes() : undefined,
    `modes:${qishui?.session.activeUid ?? ''}`,
  )

  const ctx: ListenCtx = {
    modes: modes.data,
    current: core.feedMode,
    streaming: core.feedStreaming,
    pick: (ref) => void core.selectFeedMode(ref),
    play: () => void core.playFeedBatch(),
    stop: () => core.stopFeedStream(),
    openScenes: (entries) => ui.openOverlay({ kind: 'actions', title: '听歌场景', entries }),
    closeOverlay: ui.closeOverlay,
  }
  const sections = buildListenSections(ctx)
  const height = listHeight(ui.rows, 5, 6)
  const { cursor, setCursor } = useEntries(sections, active, (input) => {
    if (input === 'R') {
      modes.reload()
      return true
    }
    return false
  })

  return (
    <Box flexDirection="column" flexGrow={1}>
      <PageTitle
        title="听歌"
        subtitle={`选一个模式 · 随机取一批 · 播完自动续 · 当前：${feedModeLabel(modes.data, core.feedMode)}`}
      />
      {modes.status === 'loading' ? <Loading /> : null}
      {modes.status === 'error' ? <ErrorState error={modes.error ?? '模式列表没拿到'} hint="R 重新加载" /> : null}
      <SectionView sections={sections} cursor={cursor} height={height} onCursor={setCursor} />
    </Box>
  )
}
