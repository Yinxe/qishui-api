/**
 * `useKeys` 的拆键判定（纯函数部分，离线单测）。
 *
 * 这条闸守的是「一次 read 带回多个字符」：ink 的 `useInput` 把整串交给 handler，而命令 handler
 * 比的都是 `input === 'j'`——不拆就是「按了两下、列表没动」。同时必须**不拆**两类东西：
 * 鼠标报文（拆开会把 `<` `;` `M` 当成人敲的键）与带 ESC 的方向键序列。
 */
import type { Key } from 'ink'
import { expect, it } from 'vitest'
import { shouldSplitInput } from '../dist/ui/keys.js'

const key = (overrides: Partial<Key> = {}): Key =>
  ({
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
    ...overrides,
  }) as Key

it('多字符的可打印输入按字符拆（快打 `jj` / 粘贴都要逐键生效）', () => {
  expect(shouldSplitInput('jj', key())).toBe(true)
  expect(shouldSplitInput('gG', key())).toBe(true)
  expect(shouldSplitInput('12', key())).toBe(true)
  expect(shouldSplitInput('晴天', key())).toBe(true)
})

it('单字符不拆（绝大多数按键）', () => {
  for (const single of ['j', 'q', '?', '/', ' ', '1']) expect(shouldSplitInput(single, key()), single).toBe(false)
  expect(shouldSplitInput('', key())).toBe(false)
})

it('带特殊键标记的不拆：方向键/回车/ESC 是 ink 解析好的单个事件', () => {
  expect(shouldSplitInput('ab', key({ upArrow: true }))).toBe(false)
  expect(shouldSplitInput('ab', key({ return: true }))).toBe(false)
  expect(shouldSplitInput('ab', key({ escape: true }))).toBe(false)
  expect(shouldSplitInput('ab', key({ ctrl: true }))).toBe(false)
})

it('鼠标报文与它的碎片不拆（拆了会把 `<` `;` `M` 当成真按键，`<` 还是后退 10 秒）', () => {
  const esc = String.fromCharCode(0x1b)
  expect(shouldSplitInput(`${esc}[<64;10;5M`, key())).toBe(false)
  expect(shouldSplitInput('[<0;10;5M', key())).toBe(false)
  expect(shouldSplitInput('10;5M', key())).toBe(false)
  expect(shouldSplitInput(`${esc}[A`, key())).toBe(false)
})
