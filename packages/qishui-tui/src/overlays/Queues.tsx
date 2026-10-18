/**
 * 播放队列书架（`Q` / 播放页右栏 `[队列]` 打开）：列出所有还活着的队列，Enter 切过去。
 *
 * 队列是**按来源分的**（推荐 / 我喜欢 / 每张歌单 / 临时），各自记着播到第几首，
 * 切走再切回来接着上次那一首 —— 所以这里不是「换掉当前队列」，而是「换到另一份队列」。
 */
import { useCore } from '../core/context.js'
import { useUi } from '../ui/context.js'
import { type Entry, SectionView, useEntries } from '../ui/entries.js'
import { contentWidth, listHeight } from '../ui/layout.js'
import { queueKindLabel } from '../ui/queues.js'
import { Modal } from '../ui/widgets.js'

export function QueuesOverlay() {
  const ui = useUi()
  const { queues, activateQueue } = useCore()

  const entries: Entry[] = queues.map((queue) => {
    const bits = [queueKindLabel(queue.kind), `${queue.count} 首`]
    if (queue.kind === 'liked') bits.push('随机')
    if (queue.kind === 'recommend' && queue.refilling) bits.push('自动续批')
    return {
      key: queue.id,
      label: queue.active ? `${queue.title}（在播）` : queue.title,
      note: `${bits.join(' · ')}${queue.count > 0 && queue.index >= 0 ? ` · 第 ${queue.index + 1} 首` : ''}`,
      onEnter: () => {
        // 先关弹层再切：切队列会起播，提示别被弹层挡住
        ui.closeOverlay()
        if (!queue.active) void activateQueue(queue.id)
      },
    }
  })
  if (!entries.length) {
    entries.push({
      key: 'none',
      label: '还没有播放队列',
      note: '随便点一首 / 选个听歌模式，队列就建起来了',
      disabled: true,
    })
  }

  const sections = [{ title: `队列（${queues.length}）`, entries }]
  const { cursor, setCursor } = useEntries(sections, true)
  const height = listHeight(ui.rows, 14, 3)

  return (
    <Modal
      title="播放队列"
      footer="↑↓ / 滚轮 选择   Enter / 点击 切过去   Esc 关闭"
      width={contentWidth(ui.columns, ui.sidebarWidth, 8, 56)}
    >
      <SectionView sections={sections} cursor={cursor} height={height} onCursor={setCursor} />
    </Modal>
  )
}
