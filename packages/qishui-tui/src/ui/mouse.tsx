/**
 * 鼠标：滚轮滚动 + 点击选中 + 通用可点盒 `Pressable`。**点击以「按下」(press) 触发**——
 * 不等抬起，避免各终端把抬起坐标报偏导致 click 打不出来。
 *
 * 报文解析交给 `@ink-tools/ink-mouse`（xterm SGR，坐标 **1 基**）：它按盒子的矩形做命中判定，
 * 所以「滚轮/点击作用在哪个盒子」天然由指针位置决定，不需要自己做全局路由。
 *
 * 必须记住的坑：
 *  1) ink 的 `useInput` 也会收到原始鼠标报文（ink 里没有「消费」语义，每个活跃 handler 都收）——
 *     文本输入和全局按键都得先过 `stripMouse()` / `isMouseInput()`，否则终端会把 `\x1b[<64;10;5M`
 *     当成人敲的字打进搜索框；ink 还会把开头的 ESC 剥掉，剩下 `[<64;10;5M`（甚至更碎的尾巴）。
 *  2) 一开追踪，终端原生「拖选复制」就被接管（多数终端按住 Shift 仍能选）——
 *     不想用鼠标就设 `QISHUI_TUI_MOUSE=0` 启动，或去设置页关 `tuiMouse`。
 *  3) ink-mouse 的命中判定是**闭区间** `left..right`/`top..bottom`，而 `right = left + width`、
 *     `bottom = top + height`，等于每个盒子都多盖了右边一列、下面一行——相邻盒子会在接缝上双触发
 *     （100 列下点内容区第 17 列，宽 16 的侧边栏也算命中）。所以进来先过 `hitTest()` 换成**半开区间**
 *     `[left, right)` / `[top, bottom)`，归属只给真正的持有者。
 *  4) 同类型的 handler 别挂在父子两个盒子上：ink-mouse 会把一份报文发给**每个**命中的 handler，
 *     父子都注册就双跑。现在的接法是「一个盒子管一段行」（列表/歌词/队列用 `useRowClick` 按行号分发），
 *     按钮之间都是兄弟盒，不存在嵌套。
 *  5) 弹层开着时底层页面**不卸载**（卸载会丢数据与游标），于是它的矩形还在、照样命中——
 *     靠 `MouseBlock` 把那棵子树整片挡掉（见 `BlockedLayer`），不然就是点击穿透与两边一起滚。
 */

import {
  getBoundingClientRect,
  type InkMouseEvent,
  MouseProvider,
  useMouse,
  useOnPress,
  useOnWheel,
} from '@ink-tools/ink-mouse'
import { Box, type BoxProps, type DOMElement, useStdout } from 'ink'
import { createContext, type ReactNode, type RefObject, useContext, useEffect, useRef } from 'react'
import { useCore } from '../core/context.js'
import { useUi } from './context.js'

/**
 * 「这一层被弹层盖住了」：`BaseLayer` 在弹层开着时不卸载（保住已取的数据与游标），
 * 但它那些盒子的布局矩形还在——`hitTest` 照样命中，于是点弹层里的按钮会**同时**驱动底下
 * 那一行（滚轮也是两边一起滚）。所以把「挡」做成一层作用域：`App.tsx` 只包底层页面，
 * 弹层自己不在这棵子树里，照常接鼠标。
 */
const BlockedLayer = createContext(false)

export function MouseBlock({ blocked, children }: { blocked: boolean; children: ReactNode }) {
  return <BlockedLayer.Provider value={blocked}>{children}</BlockedLayer.Provider>
}

function useLayerBlocked(): boolean {
  return useContext(BlockedLayer)
}

/** 关追踪：按键/滚轮 + SGR 编码 + 拖动/移动上报（退出或关鼠标时统一还原，别把终端留在鼠标模式） */
const MOUSE_OFF = '\x1b[?1000l\x1b[?1006l\x1b[?1002l\x1b[?1003l'

/** 命中结果：盒内 **0 基** 行列 + 盒子尺寸（坐标与 rect 都是 1 基，相减即得） */
export interface Hit {
  row: number
  col: number
  width: number
  height: number
}

/** 鼠标层：包住整棵树（ink-mouse 的 hooks 必须在 Provider 里），真终端里自动开追踪 */
export function MouseLayer({ children }: { children: ReactNode }) {
  // `autoEnable={false}` **不是关鼠标**：追踪在下面 `MouseSetup` 里自己开（要让 `QISHUI_TUI_MOUSE=0`
  // 和设置页 `tuiMouse` 有地方生效，并且退出时统一收线）。
  // `cacheInvalidationMs: 0`：默认 16ms 的盒子尺寸缓存在「刚点完 → 重排 → 再点」时会拿陈旧矩形判命中
  return (
    <MouseProvider autoEnable={false} cacheInvalidationMs={0}>
      {children}
      <MouseSetup />
    </MouseProvider>
  )
}

/**
 * 开鼠标追踪：直接走库的 `enable()`——`?1000`（按键/滚轮）+ `?1002`（拖动）+ `?1003`（移动）+
 * `?1006`（SGR 编码）全开，**运行期别关 `?1002`/`?1003`**。曾经补一条 `\x1b[?1003l\x1b[?1002l` 想省
 * stdin 流量，结果在 VTE 系终端（gnome-terminal 等）上把点击整个废掉：只开 `?1000` 时终端把界面当
 * 「仍可拖选复制的文本区」，光标一直是 I 型文本态、不把按下转给程序，现象就是「滚轮能动、点没反应」。
 * 我们没注册 move/hover handler，移动报文分发时命中为空、开销可忽略。
 */
function MouseSetup() {
  const { isTracking, enable, disable } = useMouse()
  const { stdout } = useStdout()
  const { core } = useCore()
  // 订阅 ui context：设置页改完 `tuiMouse` 会 `bump()`，靠这次重渲染让下面的 `want` 重新算
  useUi()
  const live = useRef(false)
  // enable/disable 的标识每次状态变化都会变，effect 里读最新的（依赖它会把 effect 拖成「开→关→开」死循环）
  const api = useRef({ enable, disable })
  api.current = { enable, disable }

  const envOff = (() => {
    const v = (process.env.QISHUI_TUI_MOUSE ?? '').toLowerCase()
    return v === '0' || v === 'off' || v === 'false' || v === 'no'
  })()
  // core 还没就绪（骨架/启动早期）按默认「开」；`ui.revision` 让设置页改完 tuiMouse 后这里跟着重算
  const want = !envOff && (core?.config.tuiMouse ?? true)

  // 依赖 `isTracking`（= 终端支持且 Mouse 实例已建好）：Provider 建实例的 effect 在父组件里，
  // 比子组件的 effect 晚跑——不等它，`enable()` 会打在还没建好的实例上，静默变成一次空操作。
  useEffect(() => {
    if (!isTracking) return
    if (!want) {
      if (live.current) {
        live.current = false
        api.current.disable()
        stdout.write(MOUSE_OFF)
      }
      return
    }
    api.current.enable()
    live.current = true
    // 兜底：被强杀/异常退出时别把终端留在鼠标模式（正常退出走 cleanup）
    const restore = () => {
      if (!live.current) return
      try {
        stdout.write(MOUSE_OFF)
      } catch {
        // 退出阶段 stdout 可能已经关了，尽力而为
      }
    }
    process.on('exit', restore)
    return () => {
      process.off('exit', restore)
      if (live.current) {
        live.current = false
        api.current.disable()
      }
    }
  }, [isTracking, stdout, want])

  return null
}

/**
 * 命中判定：报文的绝对坐标落在盒子的半开区间 `[left,right)`×`[top,bottom)` 里才算，
 * 返回盒内 0 基行列。没命中（含相邻盒子接缝上那多出来的一列/一行）返回 null。
 */
function hitTest(ref: RefObject<DOMElement | null>, event: InkMouseEvent): Hit | null {
  const rect = getBoundingClientRect(ref.current)
  if (!rect) return null
  const col = event.x - rect.left
  const row = event.y - rect.top
  if (col < 0 || row < 0 || col >= rect.width || row >= rect.height) return null
  return { row, col, width: rect.width, height: rect.height }
}

/** 滚轮增量：向上 -1、向下 +1（横向滚轮与其它按钮不计） */
function wheelDelta(event: InkMouseEvent): number {
  if (event.button === 'wheel-up') return -1
  if (event.button === 'wheel-down') return 1
  return 0
}

/** 左键按下即触发；按下 (press) 报文恒比抬起 (click) 可靠，不等抬起坐标 */
function useLeftPress(ref: RefObject<DOMElement | null>, handler: ((event: InkMouseEvent) => void) | null): void {
  const blocked = useLayerBlocked()
  useOnPress(
    ref,
    handler && !blocked
      ? (event) => {
          if (event.button === 'left') handler(event)
        }
      : null,
  )
}

/** 滚轮落在盒子里就报增量；传 null（不接）或整层被弹层盖住就不注册 handler */
function useWheelDelta(ref: RefObject<DOMElement | null>, onDelta: ((delta: number) => void) | null): void {
  const blocked = useLayerBlocked()
  useOnWheel(
    ref,
    onDelta && !blocked
      ? (event) => {
          if (!hitTest(ref, event)) return
          const delta = wheelDelta(event)
          if (delta !== 0) onDelta(delta)
        }
      : null,
  )
}

/**
 * 滚轮：指针在这个盒子里时，向上滚 -1、向下滚 +1（终端一次滚轮 = 一条报文，一次走一格）。
 * `active=false` 时不接事件（比如弹层打开时的侧边栏）。
 */
export function useWheelScroll(
  ref: RefObject<DOMElement | null>,
  onDelta: (delta: number) => void,
  active = true,
): void {
  useWheelDelta(ref, active ? onDelta : null)
}

/**
 * 左键按下命中这个盒子时回调「盒内第几行」（0 基）与该盒子高度。
 * 行号口径见 `hitTest`——半开区间，所以 `row` 恒在 `[0, height)` 内。
 */
export function useRowClick(
  ref: RefObject<DOMElement | null>,
  onRow: (row: number, boxHeight: number) => void,
  active = true,
): void {
  useLeftPress(
    ref,
    active
      ? (event) => {
          const hit = hitTest(ref, event)
          if (hit) onRow(hit.row, hit.height)
        }
      : null,
  )
}

interface PressableProps extends BoxProps {
  /** 左键命中这个盒子；参数是盒内 0 基列（进度条这类「按列定位」的控件要用，不需要就忽略） */
  onPress?: (col: number, width: number) => void
  /** 滚轮落在盒子里时回调（±1） */
  onWheel?: (delta: number) => void
  /** false 时彻底不接事件（不可点的按钮就传 false，别在外面判） */
  active?: boolean
  children: ReactNode
}

/** 一个小盒子的点击/滚轮容器（按钮、tab、进度条、徽章），自带 ref，省掉每个调用点手写 useRef */
export function Pressable({ onPress, onWheel, active = true, children, ...props }: PressableProps) {
  const ref = useRef<DOMElement>(null)
  useLeftPress(
    ref,
    onPress && active
      ? (event) => {
          const hit = hitTest(ref, event)
          if (hit) onPress(hit.col, hit.width)
        }
      : null,
  )
  useWheelDelta(ref, onWheel && active ? onWheel : null)
  return (
    <Box ref={ref} {...props}>
      {children}
    </Box>
  )
}

/** 用 String.fromCharCode 拼正则：字面量里写 \x1b 会被 noControlCharactersInRegex 拦下（同 qishui-cli/output.ts） */
const SGR_SOURCE = `${String.fromCharCode(0x1b)}?\\[<\\d+(?:;\\d+)*[Mm]?`
/** SGR 鼠标报文（完整或半截，ink 可能已经把开头的 ESC 剥掉） */
const MOUSE_RE = new RegExp(SGR_SOURCE, 'g')
/** 同上的非全局版：`.test()` 会动 `g` 正则的 lastIndex，测一个、替一个，两把分开用 */
const MOUSE_TEST_RE = new RegExp(SGR_SOURCE)
/** 被终端拆碎、只剩尾巴的那种：`10;5M` */
const MOUSE_TAIL_RE = /^\d+(?:;\d+){1,2}[Mm]$/

/** 这一坨输入是不是鼠标报文（全局按键用：是就直接不理） */
export function isMouseInput(input: string): boolean {
  if (!input) return false
  if (!input.includes('<') && !/[Mm]$/.test(input)) return false
  return MOUSE_TEST_RE.test(input) || MOUSE_TAIL_RE.test(input)
}

/**
 * 把鼠标报文从一次输入里剔掉（文本输入用：剔完可能还剩真按键）。
 * 快速路径：不含 `<` 又不是尾巴碎片的，原样返回。
 */
export function stripMouse(input: string): string {
  if (!input) return input
  if (MOUSE_TAIL_RE.test(input)) return ''
  if (!input.includes('<')) return input
  return input.replace(MOUSE_RE, '')
}
