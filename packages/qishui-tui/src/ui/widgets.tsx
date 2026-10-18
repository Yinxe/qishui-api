/** 复用组件：加载 / 空 / 错误 / 页头 / 弹层 / 选中行 / 键盘提示 + 游标 hook */
import { Box, type Key, Text } from 'ink'
import { type ReactNode, useEffect, useState } from 'react'
import { truncate } from './format.js'
import { useKeys } from './keys.js'
import { COLOR, ERROR_PREFIX, GUTTER, SELECT_PREFIX } from './theme.js'

export function Loading({ label = '加载中' }: { label?: string }) {
  const frames = ['|', '/', '-', '\\']
  const [index, setIndex] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % frames.length), 80)
    return () => clearInterval(timer)
  })
  return (
    <Box paddingX={GUTTER}>
      <Text color={COLOR.accent}>{frames[index]} </Text>
      <Text dimColor>{label}…</Text>
    </Box>
  )
}

export function EmptyState({ message, hint }: { message: string; hint?: string }) {
  return (
    <Box flexDirection="column" paddingX={GUTTER} paddingY={1}>
      <Text color="gray">{message}</Text>
      {hint ? <Text dimColor>{hint}</Text> : null}
    </Box>
  )
}

export function ErrorState({ error, hint }: { error: string; hint?: string }) {
  return (
    <Box flexDirection="column" paddingX={GUTTER} paddingY={1}>
      <Text color={COLOR.danger}>{`${ERROR_PREFIX} ${error}`}</Text>
      {hint ? <Text dimColor>{hint}</Text> : null}
    </Box>
  )
}

/** 页头：标题 + 副标题 */
export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <Box paddingX={GUTTER} flexShrink={0}>
      <Text bold color={COLOR.accent}>
        {title}
      </Text>
      {subtitle ? <Text dimColor> {truncate(subtitle, 80)}</Text> : null}
    </Box>
  )
}

/** 滚动窗口：内容比可视高度高时，围绕游标取一段 [start, end)（弹层/列表共用同一套算法） */
export function windowFor(count: number, height: number, cursor: number): { start: number; end: number } {
  const start = Math.max(0, Math.min(cursor - Math.floor(height / 2), Math.max(0, count - height)))
  return { start, end: Math.min(count, start + Math.max(0, height)) }
}

/** 居中弹层 */
export function Modal({
  title,
  footer,
  width,
  children,
}: {
  title: string
  footer?: string
  width: number
  children: ReactNode
}) {
  return (
    <Box justifyContent="center" alignItems="center" flexGrow={1}>
      <Box
        flexDirection="column"
        width={Math.max(40, Math.min(width, 96))}
        borderStyle="round"
        borderColor={COLOR.accent}
        paddingX={GUTTER}
      >
        <Box flexShrink={0} justifyContent="space-between">
          <Text bold color={COLOR.accent}>
            {title}
          </Text>
        </Box>
        <Box flexDirection="column" marginTop={1}>
          {children}
        </Box>
        {footer ? (
          <Box marginTop={1} flexShrink={0}>
            <Text dimColor wrap="truncate-end">
              {footer}
            </Text>
          </Box>
        ) : null}
      </Box>
    </Box>
  )
}

export interface CursorHandlers {
  active: boolean
  onEnter?: (index: number) => void
  /** 额外按键；返回 true 表示已消费 */
  onKey?: (input: string, key: Key, index: number) => boolean
}

/**
 * 列表游标：↑↓ / j k 移动、g G 跳顶底、Enter 选中。
 * 各屏自带的额外键走 `onKey`。
 */
export function useCursor(count: number, handlers: CursorHandlers): { cursor: number; setCursor: (n: number) => void } {
  const [cursor, setCursor] = useState(0)

  useEffect(() => {
    setCursor((current) => (count === 0 ? 0 : Math.max(0, Math.min(current, count - 1))))
  }, [count])

  useKeys(
    (input, key) => {
      const last = Math.max(0, count - 1)
      if (key.upArrow || input === 'k') {
        setCursor((c) => Math.max(0, c - 1))
        return
      }
      if (key.downArrow || input === 'j') {
        setCursor((c) => Math.min(last, c + 1))
        return
      }
      if (input === 'g') {
        setCursor(0)
        return
      }
      if (input === 'G') {
        setCursor(last)
        return
      }
      if (key.return) {
        handlers.onEnter?.(cursor)
        return
      }
      handlers.onKey?.(input, key, cursor)
    },
    { isActive: handlers.active && count > 0 },
  )

  return { cursor, setCursor }
}

/**
 * 统一的「列表行」：选中 = 反色 + `>` 前缀 + accent；未选中留一格对齐位。
 * `SectionView` 与各弹层的手搓选中行都收敛到这里，全 App 一个「被选中」的样子。
 */
export function Row({
  selected,
  label,
  note,
  prefix,
}: {
  selected: boolean
  label: string
  note?: string
  /** 选中行前缀，默认 SELECT_PREFIX；要显示序号或行标记可覆盖 */
  prefix?: string
}) {
  return (
    <Box flexShrink={0}>
      <Text inverse={selected} color={selected ? COLOR.accent : undefined} wrap="truncate-end">
        {`${selected ? (prefix ?? SELECT_PREFIX) : ' '}${label}`}
      </Text>
      {note ? <Text dimColor> {note}</Text> : null}
    </Box>
  )
}

/** 底部键盘提示：`Enter 播放  a 队尾 …` */
export function Hints({ items }: { items: [string, string][] }) {
  return (
    <Text dimColor wrap="truncate-end">
      {items.map(([key, label]) => `${key} ${label}`).join('  ')}
    </Text>
  )
}
