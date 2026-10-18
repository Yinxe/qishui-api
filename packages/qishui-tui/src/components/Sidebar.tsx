/** 左侧边栏：一级导航 + 底部账号状态（状态行点击 = 进「我的」，账号与「我的」已合并） */
import { Box, type DOMElement, Text } from 'ink'
import { useEffect, useRef, useState } from 'react'
import { useCore } from '../core/context.js'
import { useUi } from '../ui/context.js'
import { truncate } from '../ui/format.js'
import { useKeys } from '../ui/keys.js'
import { useRowClick, useWheelScroll } from '../ui/mouse.js'
import { COLOR, GUTTER, SELECT_PREFIX } from '../ui/theme.js'
import type { RootKind } from '../ui/types.js'

interface NavItem {
  root: RootKind
  label: string
  short: string
  hint: string
}

export const NAV_ITEMS: NavItem[] = [
  { root: 'search', label: '搜索', short: '搜', hint: '/' },
  { root: 'discover', label: '发现', short: '发', hint: '2' },
  { root: 'listen', label: '听歌', short: '听', hint: '3' },
  { root: 'library', label: '我的', short: '我', hint: '4' },
  { root: 'settings', label: '设置', short: '设', hint: '5' },
]

/** 导航项逐个可选；底部账号状态行不算游标项（点它 = 进「我的」） */
export function Sidebar({ compact = false }: { compact?: boolean }) {
  const ui = useUi()
  const { core } = useCore()
  const roots = NAV_ITEMS.map((item) => item.root)
  const activeIndex = roots.indexOf(ui.root)
  const [cursor, setCursor] = useState(activeIndex < 0 ? 0 : activeIndex)

  useEffect(() => {
    if (activeIndex >= 0) setCursor(activeIndex)
  }, [activeIndex])

  const count = NAV_ITEMS.length
  useKeys(
    (input, key) => {
      if (key.upArrow || input === 'k') setCursor((c) => Math.max(0, c - 1))
      else if (key.downArrow || input === 'j') setCursor((c) => Math.min(count - 1, c + 1))
      else if (key.return) ui.go(NAV_ITEMS[cursor].root)
      else if (input === 'g') setCursor(0)
      else if (input === 'G') setCursor(count - 1)
    },
    { isActive: ui.focus === 'sidebar' && !ui.overlay },
  )

  // 鼠标：滚轮挪游标、点哪项去哪项（弹层打开时不接事件，免得隔层导航）。
  // 布局是「5 个导航项 + 弹性空白 + 分隔线 + 账号状态行」，所以前 5 行与最后一行算可点。
  const boxRef = useRef<DOMElement>(null)
  const mouseActive = !ui.overlay
  useWheelScroll(boxRef, (delta) => setCursor((c) => Math.max(0, Math.min(count - 1, c + delta))), mouseActive)
  useRowClick(
    boxRef,
    (row, boxHeight) => {
      // 点哪项去哪项（`go` 自己会把焦点交给内容区）
      if (row < NAV_ITEMS.length) {
        setCursor(row)
        ui.go(NAV_ITEMS[row].root)
        return
      }
      // 最后一行 = 账号状态行：进「我的」（账号操作就在那一页）
      if (row === boxHeight - 1) {
        setCursor(roots.indexOf('library'))
        ui.go('library')
      }
    },
    mouseActive,
  )

  const loggedIn = core?.loggedIn ?? false
  const nickname = core?.session.activeUid
    ? (core.accounts().find((a) => a.uid === core.session.activeUid)?.nickname ?? core.session.activeUid)
    : undefined

  return (
    <Box ref={boxRef} flexDirection="column" width={compact ? 4 : 16} paddingX={compact ? 0 : GUTTER} flexShrink={0}>
      {NAV_ITEMS.map((item, index) => {
        const selected = ui.focus === 'sidebar' && cursor === index
        const current = ui.root === item.root
        return (
          <Box key={item.root} flexShrink={0}>
            <Text
              inverse={selected}
              color={current ? COLOR.accent : selected ? COLOR.accent : undefined}
              bold={current}
              wrap="truncate-end"
            >
              {compact ? ` ${item.short}` : `${current ? SELECT_PREFIX : ' '}${item.label}`}
            </Text>
          </Box>
        )
      })}
      <Box flexGrow={1} />
      {!compact ? (
        <Box flexShrink={0}>
          <Text dimColor>──────────</Text>
        </Box>
      ) : null}
      <Box flexShrink={0}>
        <Text dimColor={!loggedIn} wrap="truncate-end">
          {compact ? ` ${loggedIn ? '登' : '未'}` : ` ${truncate(nickname ?? (loggedIn ? '已登录' : '未登录'), 12)}`}
        </Text>
      </Box>
    </Box>
  )
}
