/**
 * 播放队列页（任意页 `Q` 压栈进来）：**书架的选择 + 管理**，外加当前队列的曲目。
 *
 * 为什么单独一页：队列按来源分成好几份（推荐 / 我喜欢 / 每张歌单 / 临时），需要有个地方把
 * 「有哪些队列 / 切到哪一份 / 把哪份收起」摆成整幅。做成整页而不是弹层——弹层有最小宽度，
 * 窄终端会溢出；页面则任何宽度都进得来，是队列的**兜底入口**。
 *
 * 两段一个游标（`useEntries`）：
 *  - 「队列」段：每份一行（`种类 · 数量 · 第几首 · 当前曲目`），`Enter` 切过去（在播那份不动），
 *    `d` 把选中的**非在播**队列从书架收起（过确认框；在播的删不得，先切走）；
 *  - 「当前队列」段：按**播放顺序**列当前这份队列的曲目，`Enter` 开这一行的操作菜单（与列表页
 *    同一份 `buildQueueTrackActions`），`d` 直接把这一行从队列移除。
 *
 * 上限（`MAX_QUEUES`）由 core 的 `QueueBook` 自动维护：超了收起最久没用过的那份并在标题里标出，
 * 这里只把「N/10」显示出来，不自己动手。
 */
import { Box } from 'ink'
import { MAX_QUEUES, type QueueInfo, type TrackData } from 'qishui-core'
import { useEffect } from 'react'
import { useCore } from '../core/context.js'
import { useUi } from '../ui/context.js'
import { type Entry, type Section, SectionView, useEntries } from '../ui/entries.js'
import { artistNames, truncate } from '../ui/format.js'
import { listHeight } from '../ui/layout.js'
import { queueNote } from '../ui/queues.js'
import { buildQueueTrackActions, type TrackLike } from '../ui/rowActions.js'
import { PageTitle } from '../ui/widgets.js'

/** 页面状态从外面注入 —— 条目构造因此可以离线单测（同 `Listen.tsx` / `ui/rowActions.ts` 的口径） */
export interface QueuePageCtx {
  queues: QueueInfo[]
  /** 当前在播队列的**播放顺序**（与播放页右栏同一份：`player.queue.playOrder`） */
  tracks: TrackData[]
  /** 播放顺序里当前在播的下标（-1 = 没定位） */
  trackIndex: number
  /** 书架上限（core 的 `MAX_QUEUES`）：标题里显示「N/10」 */
  max: number
  switchTo(id: string): void
  openTrackMenu(index: number): void
}

/** 在播的那份删不得（删了等于把播放器脚下的队列抽走）：返回一句为什么，undefined = 可以删 */
export function queueDeleteBlocker(queue: QueueInfo): string | undefined {
  return queue.active ? '在播的队列不能删，先切到别的队列' : undefined
}

/** 两段：书架（选择 / 管理）+ 当前队列的曲目（播放顺序） */
export function buildQueueSections(ctx: QueuePageCtx): Section[] {
  const queueEntries: Entry[] = ctx.queues.map((queue) => ({
    key: `queue:${queue.id}`,
    label: queue.active ? `${queue.title}（在播）` : queue.title,
    note: queueNote(queue),
    onEnter: () => {
      if (queue.active) return
      ctx.switchTo(queue.id)
    },
  }))
  if (!queueEntries.length) {
    queueEntries.push({
      key: 'none',
      label: '书架是空的',
      note: '随便点一首 / 选个听歌模式，队列就建起来了',
      disabled: true,
    })
  }

  const trackEntries: Entry[] = ctx.tracks.map((item, index) => {
    const bits: string[] = []
    if (index === ctx.trackIndex) bits.push('在播')
    const artist = item.artists?.length ? artistNames(item.artists) : ''
    if (artist) bits.push(artist)
    return {
      key: `track:${index}:${item.id}`,
      label: `${String(index + 1).padStart(3)}  ${item.name}`,
      note: bits.join(' · ') || undefined,
      onEnter: () => ctx.openTrackMenu(index),
    }
  })
  if (!trackEntries.length) {
    trackEntries.push({ key: 'empty', label: '当前队列为空', note: '切一份别的队列，或去列表里点一首', disabled: true })
  }

  const title = ctx.queues.find((queue) => queue.active)?.title ?? '—'
  return [
    { title: `队列（${ctx.queues.length}/${ctx.max}）`, entries: queueEntries },
    { title: `当前队列 · ${title}（${ctx.tracks.length}）`, entries: trackEntries },
  ]
}

export function QueueScreen({ active }: { active: boolean }) {
  const ui = useUi()
  const { core, queues, activeQueue, queue, playTracks, activateQueue, removeQueue, playQueueTrack, removeQueueIndex } =
    useCore()

  /** 当前队列某一行的操作菜单：与播放页右栏同一份条目（详情 / 喜欢 / … / 立即播放 / 从队列移除） */
  function openTrackMenu(index: number): void {
    const item = queue.items[index]
    if (!item) return
    if (!core) {
      ui.toast('core 还没就绪，稍后再试', 'error')
      return
    }
    const track: TrackLike = { id: item.id, data: item, liked: item.state?.isCollected }
    const entries = buildQueueTrackActions({
      ui,
      core,
      track,
      position: index,
      jump: () => void playQueueTrack(item.id),
      remove: () => removeQueueIndex(index),
      play: playTracks,
    })
    ui.openOverlay({ kind: 'actions', title: `${item.name} 的操作`, entries })
  }

  const ctx: QueuePageCtx = {
    queues,
    tracks: queue.items,
    trackIndex: queue.index,
    max: MAX_QUEUES,
    switchTo: (id) => void activateQueue(id),
    openTrackMenu,
  }
  const sections = buildQueueSections(ctx)
  const height = listHeight(ui.rows, 5, 6)
  const { cursor, setCursor } = useEntries(sections, active, (input, key, entry) => {
    if (input !== 'd' && !key.delete) return false
    if (entry.key.startsWith('queue:')) {
      // 管理：把选中的队列从书架收起。在播的删不得，先切走（见 queueDeleteBlocker）
      const id = entry.key.slice('queue:'.length)
      const target = queues.find((item) => item.id === id)
      if (!target) return true
      const blocked = queueDeleteBlocker(target)
      if (blocked) {
        ui.toast(blocked, 'info')
        return true
      }
      ui.openOverlay({
        kind: 'confirm',
        message: `把「${truncate(target.title, 24)}」从书架收起？`,
        hint: '只是移出书架；正在听的歌不受影响（切走再切回来就没了）',
        onConfirm: () => removeQueue(id),
      })
      return true
    }
    if (entry.key.startsWith('track:')) {
      // 直接管理当前队列：把这一行从队列里移除（与行菜单里的「从队列移除」同一动作）
      const index = Number(entry.key.split(':')[1])
      if (Number.isInteger(index)) removeQueueIndex(index)
      return true
    }
    return true
  })

  // 换了在播队列：游标回到队首（刚切过去的那份现在排在最前）
  // biome-ignore lint/correctness/useExhaustiveDependencies: 只认「换成哪一份」
  useEffect(() => setCursor(0), [activeQueue?.id])

  return (
    <Box flexDirection="column" flexGrow={1}>
      <PageTitle
        title="播放队列"
        subtitle={`${queues.length}/${MAX_QUEUES} 份 · Enter 切过去 · d 收起选中的${activeQueue ? ` · 在播：${truncate(activeQueue.title, 16)}` : ''}`}
      />
      <SectionView sections={sections} cursor={cursor} height={height} onCursor={setCursor} />
    </Box>
  )
}
