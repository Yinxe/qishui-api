/**
 * 行操作菜单：Enter 打开，选中一项即执行（第一项就是这行最热的动作）。
 *
 * 条目是打开那一刻由 `ui/rowActions.ts` 按行类型算好的快照，这里只负责画与按键 ——
 * 键盘/鼠标沿用 `useEntries` + `SectionView`（和曲目详情页同一套），`disabled` 项自然置灰、不可选中。
 */
import { useUi } from '../ui/context.js'
import { type Entry, SectionView, useEntries } from '../ui/entries.js'
import { contentWidth, listHeight } from '../ui/layout.js'
import { Modal } from '../ui/widgets.js'

export function ActionMenuOverlay({ title, entries }: { title: string; entries: Entry[] }) {
  const ui = useUi()
  const sections = [{ entries }]
  const { cursor, setCursor } = useEntries(sections, true)
  // 边框 + 标题 + footer 之外的可视行；菜单项比终端高时按游标滚动
  const height = listHeight(ui.rows, 14, 3)

  return (
    <Modal
      title={`操作 · ${title}`}
      footer="↑↓ / 滚轮 选择   Enter / 点击 执行   Esc 关闭"
      width={contentWidth(ui.columns, ui.sidebarWidth, 8, 50)}
    >
      <SectionView sections={sections} cursor={cursor} height={height} onCursor={setCursor} />
    </Modal>
  )
}
