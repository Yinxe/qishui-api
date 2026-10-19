/**
 * `useKeys` 的拆键判定（纯函数部分，离线单测）。
 *
 * 这条闸守的是「一次 read 带回多个字符」：ink 的 `useInput` 把整串交给 handler，而命令 handler
 * 比的都是 `input === 'j'`——不拆就是「按了两下、列表没动」。同时必须**不拆**两类东西：
 * 鼠标报文（拆开会把 `<` `;` `M` 当成人敲的键）与带 ESC 的方向键序列。
 */
import type { Key } from 'ink'
import { beforeEach, describe, expect, it } from 'vitest'
import { shouldSplitInput } from '../dist/ui/keys.js'
import { armReportGuard, resetReportState, stripReports } from '../dist/ui/reports.js'

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

/**
 * 探测回音**迟到**（慢终端把回音落在 ink 接手之后）时，整串会当按键交给每个活跃 handler：
 * 按键处要**整个不理**，文本输入处要**剔干净但留下真按键**。见 `ui/reports.ts`。
 *
 * 关键：ink 会把一条 APC/DCS 回音**切成好几个事件，并把开头的 ESC 剥掉**（`_` / 正文 / `\`），
 * 所以这里喂的是「事件序列」而不是一整串——按完整报文匹配是挡不住的（PTY 用例就是这么漏进搜索框的）。
 * 挡法分两档：**形状本身就没人敲得出来的**永久剔；被剥成 `_` `P` `\` 的碎片只在
 * `armReportGuard()` 开的窗口里吞（真终端都答 DA1 → 窗口根本不开，`_` 照旧是普通输入）。
 */
describe('终端回报报文（按 ink 实际切出来的事件序列喂）', () => {
  const esc = String.fromCharCode(0x1b)
  const st = `${esc}\\`

  /** 按事件顺序过一遍过滤器，返回「还该留在界面上的字」 */
  const feed = (events: string[]): string => events.map((event) => stripReports(event)).join('')

  /** 三条查询的回音，ink 实际切出来的样子（PTY 里实录的切片） */
  const REPLY = ['[?62;4;18c', '_', 'Gi=278941603;OK', '\\', 'P', '>|kitty 0.41.1', '\\']

  beforeEach(() => {
    resetReportState()
  })

  it('窗口开着：整串回音一个字都不该留下，回音之后的真按键照旧', () => {
    armReportGuard()
    expect(feed(REPLY)).toBe('')
    expect(feed([...REPLY, 'abc'])).toBe('abc')
  })

  it('窗口开着也不会把输入吃掉：`_` 之后跟的不是回音正文，就原样交回去', () => {
    armReportGuard()
    expect(feed(['_', '晴天'])).toBe('晴天')
    expect(feed(['_', 'j'])).toBe('j') // `j` 是可打印 ASCII，顺带被当正文吞掉一次；汉字/控制字符立刻收场
  })

  it('窗口没开：只有「人敲不出来的形状」才剔，`_` 与 `\\` 是正常输入', () => {
    expect(feed(['[?62;4;18c'])).toBe('') // DA1 整条：形状就没人敲得出来
    expect(feed([`${esc}[>0;4101;0c`])).toBe('')
    expect(feed([`${esc}_Gi=1;OK${st}`])).toBe('') // 带 ESC 的完整一条
    expect(feed([`${esc}P>|kitty 0.41.1${st}`])).toBe('')
    expect(feed([`${esc}_Gi=1;OK${st}x`])).toBe('x') // 报文后面跟着的真按键要留下
    expect(feed(['_', 'Gi=1;OK', '\\'])).toBe('_Gi=1;OK\\') // 碎片：没窗口就别动用户的字
  })

  it('一个事件被每个活跃 handler 各读一次：结论一致，不会第二个人漏出字来', () => {
    armReportGuard()
    for (const event of REPLY) {
      const once = stripReports(event)
      expect(stripReports(event), JSON.stringify(event)).toBe(once)
    }
    expect(stripReports('k')).toBe('k')
  })

  it('半截报文（一次 read 只送到开头）不当键派发', () => {
    expect(feed([`${esc}_Gi=1`])).toBe('') // 带 ESC 的半条 APC：到串尾也算
    armReportGuard()
    expect(feed([`${esc}[?62;4`])).toBe('') // 带 ESC 的半条 DA1：窗口里整坨不理
  })

  it('人敲的字不算回报（否则键位与输入会被吃掉）', () => {
    for (const benign of ['j', 'jj', 'q', '?', '晴天', `${esc}[A`, '[?abc', '周杰伦 晴', '_']) {
      expect(stripReports(benign) === benign, JSON.stringify(benign)).toBe(true)
    }
  })

  it('回报整串不进拆键（拆开派发就是一次凭空的多按键）', () => {
    expect(shouldSplitInput(`${esc}_Gi=1;OK${st}jj`, key())).toBe(false)
    expect(shouldSplitInput('jj', key())).toBe(true)
  })
})
