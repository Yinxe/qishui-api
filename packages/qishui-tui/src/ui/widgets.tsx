/** 复用组件：加载 / 空 / 错误 / 页头 / 弹层 / 选中行 / 键盘提示 + 游标 hook */
import { Box, type Key, Text, useStdout } from 'ink'
import { type ReactNode, useEffect, useState } from 'react'
import { truncate } from './format.js'
import { useKeys } from './keys.js'
import { COLOR, ERROR_PREFIX, GUTTER, SELECT_PREFIX } from './theme.js'

/** 转圈帧（AGENTS.md：界面只用 ASCII + 汉字，这四格本来就是 ASCII） */
const SPINNER = ['|', '/', '-', '\\'] as const

export function Loading({ label = '加载中' }: { label?: string }) {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    // 依赖必须是空数组：没有它，每次重画（播放条 400ms 一跳、鼠标事件、resize）都会重建
    // 计时器，把 80ms 的相位归零——渲染比 80ms 密时转圈就整个停住。
    const timer = setInterval(() => setIndex((i) => (i + 1) % SPINNER.length), 80)
    return () => clearInterval(timer)
  }, [])
  return (
    <Box paddingX={GUTTER}>
      <Text color={COLOR.accent}>{SPINNER[index]} </Text>
      <Text dimColor>{label}…</Text>
    </Box>
  )
}

export function EmptyState({ message, hint }: { message: string; hint?: string }) {
  return (
    <Box flexDirection="column" paddingX={GUTTER} paddingY={1}>
      <Text>{message}</Text>
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

/**
 * 居中弹层。
 *
 * 宽度上限跟着终端走：原来那条 `Math.max(40, …)` 的下限在窄终端（分屏、tmux 侧栏、
 * 80 列以下的调试窗口）会把框顶出屏幕——边框和文字一起没了，人只看到半句话。
 */
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
  const { stdout } = useStdout()
  const cols = stdout.columns || 80
  const desired = Math.max(40, Math.min(width, 96))
  // 下限 12：再窄就装不下「边框 + 左右 padding」，内容直接是 0 格
  const boxWidth = Math.max(12, Math.min(desired, cols))
  return (
    <Box justifyContent="center" alignItems="center" flexGrow={1}>
      <Box flexDirection="column" width={boxWidth} borderStyle="round" borderColor={COLOR.accent} paddingX={GUTTER}>
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
  /**
   * `↓` 落在**最后一行**时先问这里（返回 true = 已处理）——给「到队尾再去取下一批」这类动作留的口子；
   * 不接就照旧停在最后一行。
   */
  onTailDown?: (index: number) => boolean
  /** 额外按键；返回 true 表示已消费 */
  onKey?: (input: string, key: Key, index: number) => boolean
  /**
   * 一屏可视行数——`PageUp`/`PageDown` 按它整页跳。
   * 不给就按 10（几百行的「我喜欢的音乐」只靠 ↑↓ 一格一格挪，人先累）。
   */
  pageSize?: number
}

/**
 * 列表游标：↑↓ / j k 移动、g G 与 Home/End 跳顶底、PageUp/PageDown 整页挪、Enter 选中。
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
      const page = Math.max(1, handlers.pageSize ?? 10)
      if (key.upArrow || input === 'k') {
        setCursor((c) => Math.max(0, c - 1))
        return
      }
      if (key.downArrow || input === 'j') {
        if (cursor === last && handlers.onTailDown?.(cursor)) return
        setCursor((c) => Math.min(last, c + 1))
        return
      }
      if (key.pageUp) {
        setCursor((c) => Math.max(0, c - page))
        return
      }
      if (key.pageDown) {
        setCursor((c) => Math.min(last, c + page))
        return
      }
      if (key.home || input === 'g') {
        setCursor(0)
        return
      }
      if (key.end || input === 'G') {
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
 * 统一的「列表行」：选中 = **下划线 + accent 色 + `>` 前缀**；未选中留一格对齐位。
 * 不用反色块：整行反色在浅色/透明背景下会糊成一条，还把行内的颜色信息（在播绿、错误红）盖掉。
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
      <Text underline={selected} color={selected ? COLOR.accent : undefined} wrap="truncate-end">
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
