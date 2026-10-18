/** 界面状态：页面栈、焦点区、弹层、浮出的提示、终端尺寸 */
import { Box, Text, useApp, useStdout } from 'ink'
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { COLOR, GUTTER } from './theme.js'
import type { Focus, Overlay, RootKind, Route, Toast, ToastKind } from './types.js'

export interface UiValue {
  route: Route
  root: RootKind
  stack: Route[]
  push(route: Route): void
  pop(): void
  /** 直接退回栈里第 `index` 层（面包屑点哪段就回到哪段）；越界或最后一层等于不动 */
  popTo(index: number): void
  go(root: RootKind): void
  focus: Focus
  setFocus(focus: Focus): void
  /** 焦点在可编辑输入行上（此时全局单键快捷键让位给输入） */
  textFocus: boolean
  setTextFocus(value: boolean): void
  overlay: Overlay | null
  openOverlay(overlay: Overlay): void
  closeOverlay(): void
  toast(message: string, kind?: ToastKind): void
  /** 账号/歌单等「异步改了之后要全屏重读」的计数器；bump() 加一 */
  revision: number
  bump(): void
  columns: number
  rows: number
  sidebarWidth: number
  quit(): void
}

const UiContext = createContext<UiValue | null>(null)

export function useUi(): UiValue {
  const value = useContext(UiContext)
  if (!value) throw new Error('useUi() 必须在 <UiProvider> 内使用')
  return value
}

function sidebarWidthFor(columns: number): number {
  if (columns >= 72) return 16
  if (columns >= 48) return 4
  return 0
}

export function UiProvider({ children }: { children: ReactNode }) {
  const { exit } = useApp()
  const { stdout } = useStdout()
  const columns = stdout.columns ?? 80
  const rows = stdout.rows ?? 24
  const [stack, setStack] = useState<Route[]>([{ kind: 'root', root: 'discover' }])
  const [overlay, setOverlay] = useState<Overlay | null>(null)
  const [focus, setFocus] = useState<Focus>('sidebar')
  const [textFocus, setTextFocus] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)
  const [revision, setRevision] = useState(0)
  const toastSeq = useRef(0)
  const toastTimer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current)
    }
  }, [])

  const push = useCallback((route: Route) => {
    setTextFocus(false)
    setOverlay(null)
    setStack((prev) => [...prev, route])
    setFocus('content')
  }, [])

  const pop = useCallback(() => {
    setTextFocus(false)
    setOverlay(null)
    setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev))
  }, [])

  const popTo = useCallback(
    (index: number) => {
      // 点当前页自己（或越界）等于不动；只在真的退层时才动焦点与弹层
      if (index < 0 || index >= stack.length - 1) return
      setTextFocus(false)
      setOverlay(null)
      setStack(stack.slice(0, index + 1))
      setFocus('content')
    },
    [stack],
  )

  const go = useCallback((root: RootKind) => {
    setTextFocus(false)
    setOverlay(null)
    setStack([{ kind: 'root', root }])
    setFocus('content')
  }, [])

  const openOverlay = useCallback((next: Overlay) => {
    setTextFocus(false)
    setOverlay(next)
  }, [])

  const closeOverlay = useCallback(() => {
    setTextFocus(false)
    setOverlay(null)
  }, [])

  const showToast = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = ++toastSeq.current
    setToast({ id, message, kind })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => {
      setToast((current) => (current && current.id === id ? null : current))
    }, 4000)
  }, [])

  const value = useMemo<UiValue>(
    () => ({
      route: stack[stack.length - 1],
      root: (stack[0] as { kind: 'root'; root: RootKind }).root,
      stack,
      push,
      pop,
      popTo,
      go,
      focus,
      setFocus,
      textFocus,
      setTextFocus,
      overlay,
      openOverlay,
      closeOverlay,
      toast: showToast,
      revision,
      bump: () => setRevision((n) => n + 1),
      columns,
      rows,
      sidebarWidth: sidebarWidthFor(columns),
      quit: exit,
    }),
    [
      stack,
      push,
      pop,
      popTo,
      go,
      focus,
      textFocus,
      overlay,
      openOverlay,
      closeOverlay,
      showToast,
      revision,
      columns,
      rows,
      exit,
    ],
  )

  return (
    <UiContext.Provider value={value}>
      {children}
      {toast ? (
        <Box position="absolute" marginLeft={sidebarWidthFor(columns) + 1} marginTop={Math.max(0, rows - 6)}>
          <Box
            borderStyle="round"
            borderColor={toast.kind === 'error' ? COLOR.danger : toast.kind === 'success' ? COLOR.success : 'gray'}
            paddingX={GUTTER}
          >
            <Text color={toast.kind === 'error' ? COLOR.danger : toast.kind === 'success' ? COLOR.success : undefined}>
              {toast.message}
            </Text>
          </Box>
        </Box>
      ) : null}
    </UiContext.Provider>
  )
}
