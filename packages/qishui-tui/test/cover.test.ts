/**
 * 封面渲染的离线单测：只碰纯函数与注入进来的假能力/假字节（终端能力判定、kitty 占位符网格、
 * chafa 两条输出的解析、传图转义的分块、图片引用计数），**不跑 chafa、不打上游**。
 */
import stringWidth from 'string-width'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { TermCaps } from '../dist/ui/caps.js'
import {
  acquireCoverImage,
  clearCoverCache,
  coverId,
  coverMode,
  idColor,
  kittyDelete,
  kittyGrid,
  kittySizeArg,
  kittyTransmit,
  parseAnsiOutput,
  parseKittyOutput,
  releaseCoverImage,
  renderCover,
  resetCoverImages,
} from '../dist/ui/cover.js'
import { PROBE_ID, parseCapsReply, shouldProbe } from '../dist/ui/termProbe.js'

const ESC = String.fromCharCode(0x1b)
const ST = `${ESC}\\`

/** 三条查询各自的标准回音（形状照 kitty 规范 / XTerm DA1 / XTVERSION DCS） */
const KGP_OK = `${ESC}_Gi=${PROBE_ID};OK${ST}`
const XTVERSION_KITTY = `${ESC}P>|kitty 0.41.1${ST}`
const DA1 = `${ESC}[?62;4;18c`

describe('parseCapsReply', () => {
  it('kitty 的全套回音：图形协议 + 牌子 + Sixel，并且 DA1 一到就收工', () => {
    const { caps, done, consumed } = parseCapsReply(`${KGP_OK}${XTVERSION_KITTY}${DA1}`)
    expect(caps).toEqual({ kgp: true, brand: 'kitty', sixel: true, da1: true, probed: true })
    expect(done).toBe(true)
    expect(consumed).toBe(`${KGP_OK}${XTVERSION_KITTY}${DA1}`.length)
  })

  it('只有 DA1（「答了 DA1 但没答查询」= 不支持图形协议）：kgp false，但仍算探过', () => {
    const { caps, done } = parseCapsReply(DA1)
    expect(caps.kgp).toBe(false)
    expect(caps.probed).toBe(true)
    expect(caps.sixel).toBe(true)
    expect(done).toBe(true)
  })

  it('只回 XTVERSION：拿到牌子名；没有 DA1 就还不能收工', () => {
    const { caps, done } = parseCapsReply(XTVERSION_KITTY)
    expect(caps.brand).toBe('kitty')
    expect(caps.kgp).toBe(false)
    expect(done).toBe(false)
  })

  it('牌子名取第一个词、转小写（`DCS >|Ghostty 1.0.0` → ghostty）', () => {
    expect(parseCapsReply(`${ESC}P>|Ghostty 1.0.0${ST}`).caps.brand).toBe('ghostty')
  })

  it('DA1 里不带 `;4` 就不是 Sixel', () => {
    expect(parseCapsReply(`${ESC}[?61;1c`).caps.sixel).toBe(false)
  })

  it('不是我们那个 id 的应答不算数（别的程序也在问终端时别张冠李戴）', () => {
    const { caps } = parseCapsReply(`${ESC}_Gi=998877;OK${ST}${DA1}`)
    expect(caps.kgp).toBe(false)
    expect(caps.probed).toBe(true)
  })

  it('报错的应答（`ENOENT:`…）= 不支持，别走原生贴图', () => {
    expect(parseCapsReply(`${ESC}_Gi=${PROBE_ID};error:bad value${ST}${DA1}`).caps.kgp).toBe(false)
  })

  it('垃圾/半截字节：什么都解不出来，不收工也不退回（consumed 0）', () => {
    const { caps, done, consumed } = parseCapsReply('jj\x1b[?62;4')
    expect(caps).toEqual({ kgp: false, sixel: false, da1: false, probed: false })
    expect(done).toBe(false)
    expect(consumed).toBe(0)
  })
})

describe('shouldProbe', () => {
  it('已经强制走哪条路就别探测（白付一次启动停顿）', () => {
    expect(shouldProbe({})).toBe(true)
    for (const forced of ['off', 'ansi', 'kitty']) expect(shouldProbe({ QISHUI_TUI_COVER: forced })).toBe(false)
    expect(shouldProbe({ QISHUI_TUI_COVER: '' })).toBe(true)
  })
})

describe('coverMode', () => {
  /** 选路只看 `kgp` / `brand` / `probed`，其余字段给默认值 */
  const caps = (over: Partial<TermCaps>): TermCaps => ({
    kgp: false,
    sixel: false,
    da1: false,
    probed: false,
    ...over,
  })

  it('探测说会接图形协议就走原图（**不问环境变量**：ghostty/contour/rio 以前全被漏掉）', () => {
    expect(coverMode({}, caps({ kgp: true, probed: true }))).toBe('kitty')
    expect(coverMode({ TERM: 'xterm-ghostty', TERM_PROGRAM: 'ghostty' }, caps({ kgp: true, probed: true }))).toBe(
      'kitty',
    )
  })

  it('会接图但只有旧协议（没占位符）的牌子留在半块路上', () => {
    const kgp = caps({ kgp: true, probed: true })
    expect(coverMode({}, { ...kgp, brand: 'konsole' })).toBe('ansi')
    expect(coverMode({}, { ...kgp, brand: 'warp' })).toBe('ansi')
    // 牌子未知（没答 XTVERSION）但答了图形查询的，照规范放行——这正是这次放宽的收益
    expect(coverMode({}, kgp)).toBe('kitty')
  })

  it('mux 里探测收不到回音：环境变量透传进来也不认（那就是「一片 U+10EEEE 残字」的来源）', () => {
    expect(coverMode({ KITTY_WINDOW_ID: '1' }, caps({ probed: true }))).toBe('ansi')
  })

  it('压根没探（非 TTY / 单测）才退回环境变量表', () => {
    const never = caps({})
    expect(coverMode({ KITTY_WINDOW_ID: '1' }, never)).toBe('kitty')
    expect(coverMode({ TERM: 'xterm-kitty' }, never)).toBe('kitty')
    expect(coverMode({ TERM_PROGRAM: 'ghostty' }, never)).toBe('kitty')
    expect(coverMode({ TERM: 'xterm-256color' }, never)).toBe('ansi')
    expect(coverMode({}, never)).toBe('ansi')
  })

  it('`QISHUI_TUI_COVER` 永远赢过探测结果', () => {
    const kgp = caps({ kgp: true, probed: true })
    expect(coverMode({ QISHUI_TUI_COVER: 'off' }, kgp)).toBe('off')
    expect(coverMode({ QISHUI_TUI_COVER: 'ansi' }, kgp)).toBe('ansi')
    expect(coverMode({ QISHUI_TUI_COVER: 'kitty' }, caps({ probed: true }))).toBe('kitty')
  })
})

describe('kitty 占位符', () => {
  it('图片 id 稳定、24 位以内、不同 URL 不同', () => {
    const a = coverId('https://x/cover.jpg?a=1')
    const b = coverId('https://x/cover.jpg?a=2')
    expect(a).toBe(coverId('https://x/cover.jpg?a=1'))
    expect(a).toBeGreaterThan(0)
    expect(a).toBeLessThanOrEqual(0xffffff)
    expect(a).not.toBe(b)
    expect(idColor(a)).toMatch(/^#[0-9a-f]{6}$/)
  })

  it('网格每行 cols 个占位符（含组合调谐符，显示宽度仍是 cols）', () => {
    const grid = kittyGrid(4, 3)
    expect(grid).toHaveLength(3)
    for (const line of grid) {
      expect(line.startsWith('\u{10EEEE}')).toBe(true)
      expect([...line].filter((ch) => ch === '\u{10EEEE}')).toHaveLength(4)
      expect(stringWidth(line)).toBe(4)
    }
  })

  it('调谐符用 kitty 那张表（**不是** U+0305 连续编号：索引 1 是 U+030D）', () => {
    const grid = kittyGrid(3, 2)
    const codes = (line: string) => [...line].map((ch) => ch.codePointAt(0))
    // 第 0 行：行符 U+0305；列符 U+0305 / U+030D / U+030E
    expect(codes(grid[0])).toEqual([0x10eeee, 0x0305, 0x0305, 0x10eeee, 0x0305, 0x030d, 0x10eeee, 0x0305, 0x030e])
    // 第 1 行行符是 U+030D（用 0x0305 + 1 推会得到 U+0306，终端不认，图就画不出来）
    expect(codes(grid[1]).slice(1, 3)).toEqual([0x030d, 0x0305])
  })

  it('kitty 路的 chafa 尺寸跟着占位格走（别写死大数：一张图能出到几十兆把终端噎住）', () => {
    expect(kittySizeArg(30, 8)).toBe('30x8')
    expect(kittySizeArg(24, 12)).toBe('24x12')
    expect(kittySizeArg(400, 400)).toBe('60x30')
  })

  it('传图转义带 `a=T,U=1`（虚拟放置，不当场显示）；分块只第一块带 key，最后一块 `m=0`', () => {
    const data = 'A'.repeat(5000)
    const out = kittyTransmit({ id: 7, width: 4, height: 4, cols: 2, rows: 2, data })
    expect(out.startsWith('\u001b_Ga=T,f=32,s=4,v=4,U=1,i=7,c=2,r=2,q=2,m=1;')).toBe(true)
    // 续块只有 `m` + 载荷（重发 key 会被终端当成一次新的传输，图挂不上）
    expect(out).toContain('\u001b_Gm=0;')
    // 只有第一块带 key（拆开正好两段：头 + 余下）
    expect(out.split('\u001b_Ga=T')).toHaveLength(2)
    expect(out.endsWith('\u001b\\')).toBe(true)
    // 两块：第一块 m=1、最后一块 m=0
    expect(out.match(/m=0;/g)).toHaveLength(1)
  })
})

describe('chafa 输出解析', () => {
  it('`-f kitty`：从控制串里拿尺寸，把**各自带 `=` 填充**的分块解成字节再拼（拼字符串会把图截断）', () => {
    // chafa 每块是独立的 base64（512 字节一块、各自填充）；拼字符串的话中间的 `=` 会截断解码
    const raw = Buffer.from(Array.from({ length: 16 }, (_, i) => i))
    const a = raw.subarray(0, 8).toString('base64')
    const b = raw.subarray(8, 16).toString('base64')
    expect(a.endsWith('=')).toBe(true)
    const out = `\u001b[?25l\u001b_Ga=T,f=32,s=2,v=2,c=2,r=2,m=1\u001b\\\u001b_Gm=1;${a}\u001b\\\u001b_Gm=0;${b}\u001b\\\u001b[?25h`
    const parsed = parseKittyOutput(out)
    expect(parsed).toBeDefined()
    expect(Buffer.from(parsed?.data ?? '', 'base64').equals(raw)).toBe(true)
    expect(parsed?.width).toBe(2)
    expect(parsed?.height).toBe(2)
  })

  it('不像 kitty 输出（没有控制串）就返回 undefined', () => {
    expect(parseKittyOutput('hello')).toBeUndefined()
  })

  it('载荷字节数和 s×v×4 对不上就当解析失败（宁可没封面，也别把半张图塞给终端）', () => {
    const out = '\u001b_Ga=T,f=32,s=4,v=2,c=4,r=2,m=0;AAAA\u001b\\'
    expect(parseKittyOutput(out)).toBeUndefined()
  })

  it('`-f symbols --colors full`：逐段解出字符与 fg/bg', () => {
    const out =
      '\u001b[?25l\u001b[0m\u001b[38;2;224;0;30;48;2;246;0;8m▄▄\u001b[0m\n' +
      '\u001b[38;2;181;0;73;48;2;203;0;51m▄▄\u001b[0m\n' +
      '\u001b[?25h'
    const rows = parseAnsiOutput(out, 2)
    expect(rows).toHaveLength(2)
    expect(rows[0]).toEqual([
      { ch: '▄', fg: '#e0001e', bg: '#f60008' },
      { ch: '▄', fg: '#e0001e', bg: '#f60008' },
    ])
    expect(rows[1][0]).toEqual({ ch: '▄', fg: '#b50049', bg: '#cb0033' })
  })

  it('每行按 cols 截断，多余的不画（免得溢出到别的栏）', () => {
    const out = '\u001b[38;2;1;2;3;48;2;4;5;6m▄▄▄▄\u001b[0m\n'
    expect(parseAnsiOutput(out, 2)[0]).toHaveLength(2)
  })
})

describe('kitty 图片生命周期', () => {
  it('删除转义带 `q=2`（不静音的话终端回的 `OK`/`ENOENT:` 会当按键打进界面）', () => {
    expect(kittyDelete(42)).toBe(`${ESC}_Ga=d,i=42,q=2${ST}`)
  })

  it('引用计数归零才真发删除（详情页封面与侧栏头像可能撞同一个 id）', () => {
    resetCoverImages()
    const written: string[] = []
    const write = (chunk: string): void => {
      written.push(chunk)
    }
    acquireCoverImage(7)
    acquireCoverImage(7)
    releaseCoverImage(7, write)
    expect(written).toEqual([])
    releaseCoverImage(7, write)
    expect(written).toEqual([kittyDelete(7)])
    resetCoverImages()
  })
})

describe('renderCover 的本地字节优先', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    clearCoverCache()
  })

  /** 一段绝不是图片的字节：chafa 解不动就快速失败，正好让用例只盯「有没有发请求」 */
  const bytes = Buffer.from([0, 1, 2, 3])

  it('`loadBytes` 命中就不上网拉（换页/换尺寸都不该重新打 CDN）', async () => {
    const fetchSpy = vi.fn(() => {
      throw new Error('不该发请求')
    })
    vi.stubGlobal('fetch', fetchSpy)
    const loadBytes = vi.fn(async () => bytes)
    await renderCover('https://x/cover.jpg', 2, 2, 'kitty', { key: 'track-1', loadBytes })
    expect(loadBytes).toHaveBeenCalledTimes(1)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('`loadBytes` 说没有（没缓存/读失败）才退回 url', async () => {
    const res = { ok: true, arrayBuffer: async () => new Uint8Array([1, 2, 3, 4]).buffer }
    const fetchSpy = vi.fn(async () => res)
    vi.stubGlobal('fetch', fetchSpy)
    await renderCover('https://x/cover.jpg', 2, 2, 'kitty', {
      key: 'track-2',
      loadBytes: async () => {
        throw new Error('本地没有')
      },
    })
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('缓存按 `key` 而不是 url：同一首换页不重解，换尺寸才重解', async () => {
    const loadBytes = vi.fn(async () => bytes)
    await renderCover('https://x/cover.jpg', 2, 2, 'kitty', { key: 'track-3', loadBytes })
    await renderCover('https://x/cover.jpg', 2, 2, 'kitty', { key: 'track-3', loadBytes })
    expect(loadBytes).toHaveBeenCalledTimes(1)
    await renderCover('https://x/cover.jpg', 4, 4, 'kitty', { key: 'track-3', loadBytes })
    expect(loadBytes).toHaveBeenCalledTimes(2)
  })

  it('没有 chafa（解码失败）时静默降级成 undefined，不把页面卡住', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('离线')
      }),
    )
    expect(await renderCover('https://x/cover.jpg', 2, 2, 'kitty')).toBeUndefined()
    expect(await renderCover('', 2, 2, 'kitty')).toBeUndefined()
    expect(await renderCover('https://x/cover.jpg', 0, 2, 'kitty')).toBeUndefined()
    expect(await renderCover('https://x/cover.jpg', 2, 2, 'off')).toBeUndefined()
  })
})
