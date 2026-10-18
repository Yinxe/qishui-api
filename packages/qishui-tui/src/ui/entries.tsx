/** 「分区条目」渲染：多段列表共用一个游标（发现/听歌/我的/设置都用它） */
import { Box, type DOMElement, type Key, Text } from 'ink'
import { useRef } from 'react'
import { useUi } from './context.js'
import { useRowClick, useWheelScroll } from './mouse.js'
import { COLOR, GUTTER } from './theme.js'
import { Row, useCursor, windowFor } from './widgets.js'

export interface Entry {
  key: string
  label: string
  note?: string
  /** 不可选中（例如纯信息行） */
  disabled?: boolean
  onEnter?: () => void
}

export interface Section {
  title?: string
  entries: Entry[]
}

interface Line {
  type: 'header' | 'gap' | 'entry'
  text?: string
  /** 指向 entries 数组下标；undefined = 不可选中 */
  entryIndex?: number
}

function flatten(sections: Section[]): { lines: Line[]; entries: Entry[] } {
  const lines: Line[] = []
  const entries: Entry[] = []
  sections.forEach((section, sectionIndex) => {
    if (sectionIndex > 0) lines.push({ type: 'gap' })
    if (section.title) lines.push({ type: 'header', text: section.title })
    for (const entry of section.entries) {
      const entryIndex = entry.disabled ? undefined : entries.length
      if (!entry.disabled) entries.push(entry)
      lines.push({ type: 'entry', entryIndex, text: entry.label })
    }
  })
  return { lines, entries }
}

/** 键盘：↑↓/jk 移动、Enter 进入；额外键走 onKey */
export function useEntries(
  sections: Section[],
  active: boolean,
  onKey?: (input: string, key: Key, entry: Entry) => boolean,
): { cursor: number; setCursor: (n: number) => void } {
  const entries = sections.flatMap((s) => s.entries).filter((e) => !e.disabled)
  const { cursor, setCursor } = useCursor(entries.length, {
    active,
    onEnter: (index) => entries[index]?.onEnter?.(),
    onKey: (input, key, index) => {
      const entry = entries[index]
      if (!entry) return false
      return onKey?.(input, key, entry) ?? false
    },
  })
  return { cursor, setCursor }
}

export function SectionView({
  sections,
  cursor,
  height,
  onCursor,
}: {
  sections: Section[]
  cursor: number
  height: number
  /** 给了才接鼠标（滚轮挪游标、点条目选中 / 点在已选条目上 = Enter） */
  onCursor?: (n: number) => void
}) {
  const { lines, entries } = flatten(sections)
  let cursorLine = 0
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].type === 'entry' && lines[i].entryIndex === cursor) {
      cursorLine = i
      break
    }
  }
  const start = windowFor(lines.length, height, cursorLine).start
  const visible = lines.slice(start, start + height)

  const boxRef = useRef<DOMElement>(null)
  const ui = useUi()
  /** 这一层挂起来的时刻（见下面 `useRowClick` 里的「不吃那一下点击」） */
  const mountedAt = useRef(Date.now())
  const mouseActive = Boolean(onCursor)
  /** 鼠标落在内容区就把焦点交给内容（和键盘 Tab 一致），否则点完条目 Enter 仍走侧边栏 */
  const takeFocus = () => {
    if (mouseActive && ui.focus !== 'content') ui.setFocus('content')
  }
  useWheelScroll(
    boxRef,
    (delta) => {
      takeFocus()
      onCursor?.(Math.max(0, Math.min(entries.length - 1, cursor + delta)))
    },
    mouseActive,
  )
  useRowClick(
    boxRef,
    (row) => {
      const line = lines[start + row]
      if (!line || line.entryIndex === undefined) return
      takeFocus()
      const entry = entries[line.entryIndex]
      if (!entry) return
      onCursor?.(line.entryIndex)
      // 刚画出来的这一层不吃「那一下点击」：开弹层的按下余波（双击的第二下）会落在弹层的同一格上，
      // 不设这道闸就是点击穿透执行。只挡执行、游标照挪；键盘 Enter 不受影响（Enter Enter 是主路径）。
      if (Date.now() - mountedAt.current < 350) return
      // 单击直达：点条目就跑它的 onEnter（进页/播放），和键盘 Enter 同一条路
      entry.onEnter?.()
    },
    mouseActive,
  )

  return (
    <Box ref={boxRef} flexDirection="column" paddingX={GUTTER}>
      {visible.map((line, offset) => {
        const lineIndex = start + offset
        if (line.type === 'gap') return <Text key={`gap-${lineIndex}`}> </Text>
        if (line.type === 'header') {
          return (
            <Box key={`h-${lineIndex}`} flexShrink={0}>
              <Text bold color={COLOR.accent} wrap="truncate-end">
                {line.text}
              </Text>
            </Box>
          )
        }
        const index = line.entryIndex ?? -1
        const selected = index === cursor
        const note = index >= 0 ? entries[index]?.note : undefined
        return <Row key={`e-${lineIndex}`} selected={selected} label={line.text ?? ''} note={note} />
      })}
    </Box>
  )
}
