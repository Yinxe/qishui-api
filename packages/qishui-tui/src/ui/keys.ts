/**
 * 单键命令的入口：`useKeys` = ink 的 `useInput` + **把一次 read 里的多个字符拆成单键**。
 *
 * 为什么需要这一层：ink 的 `useInput` 把一次 stdin read 的**整串**交给 handler。人快手连按
 * `jj` / `gG`、或者用 `printf` 灌键（单测里就是这么干的）时，一次 read 可能带回 `'jj'`，
 * 而所有命令 handler 比的都是 `input === 'j'` —— 整串比对必然不中，现象就是「按了两下，列表没动」。
 * 文本输入处（搜索框/评论/歌单名）自己就会按字符收下，所以那些地方继续用 `useInput`。
 *
 * 三条不拆的例外：
 *  1. 单字符（绝大多数情况）；
 *  2. 鼠标报文与它的碎片（`[<64;10;5M` / `10;5M`）—— 拆开会把 `<` `;` `M` 当成人敲的键（`<` 是后退 10 秒）；
 *  3. 带 ESC 的序列（方向键等）：ink 已经把方向键解析成 `key.upArrow`，带 ESC 的多字符串不是按键。
 */
import { type Key, useInput } from 'ink'
import { isMouseInput } from './mouse.js'

/** 拆键时传给 handler 的「空 key」：没有任何修饰键/特殊键位（字段与 ink 的 `Key` 一一对应） */
const NO_KEY: Key = {
  upArrow: false,
  downArrow: false,
  leftArrow: false,
  rightArrow: false,
  pageDown: false,
  pageUp: false,
  home: false,
  end: false,
  return: false,
  escape: false,
  ctrl: false,
  shift: false,
  tab: false,
  backspace: false,
  delete: false,
  meta: false,
  super: false,
  hyper: false,
  capsLock: false,
  numLock: false,
}

/** 这一坨输入该不该按字符拆开派发（见文件头三条例外） */
export function shouldSplitInput(input: string, key: Key): boolean {
  if ([...input].length <= 1) return false
  if (input.includes('<') || input.includes(String.fromCharCode(0x1b))) return false
  if (/[Mm]$/.test(input) || isMouseInput(input)) return false
  return !Object.values(key).some(Boolean)
}

export function useKeys(handler: (input: string, key: Key) => void, opts: { isActive?: boolean } = {}): void {
  useInput((input, key) => {
    if (shouldSplitInput(input, key)) {
      for (const char of input) handler(char, NO_KEY)
      return
    }
    handler(input, key)
  }, opts)
}
