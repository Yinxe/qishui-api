/**
 * 封面渲染：把一首歌的封面画进终端。
 *
 * 两条路，按终端能力自动选（`QISHUI_TUI_COVER` 可强制 `kitty` / `ansi` / `off`）：
 *  - **图形协议（kitty）**：用 chafa 把任意格式的封面解码成原始 RGBA，再走 kitty 的图形协议把**原图**
 *    传进去，正文里只画 `U+10EEEE` 占位符（unicode placeholder）。占位符就是普通文字，ink 重画一帧它
 *    自然跟着走、图也还在——这是唯一能和 ink 的差异重绘共存的贴图方式（直接定位贴的图会被下一帧擦掉）。
 *  - **ANSI 半块**：没有图形协议时，用 chafa 输出彩色半块 `▄`，解析成每格的 fg/bg，再由 ink 的
 *    `<Text color backgroundColor>` 画出来。任意真彩终端都能看，不依赖图形协议。
 *
 * 「有没有图形协议」**问终端，不猜环境变量**（见 `ui/termProbe.ts`）：查询有回音才走原图。会接图但只实现
 * 旧草案、**没有占位符**的那几个牌子（Konsole / Warp）留在半块路上——给它们发占位符就是一片残字。
 * 只会解 Sixel 的（foot / mintty / konsole）和 iTerm2 也一律走半块：那两种协议没有占位符机制，贴上去的图
 * 活不过 ink 的下一次差异重绘。
 *
 * 两条路都**只依赖本机的 `chafa`**（解码/缩放）。取字节优先用调用方给的本地文件（core 的媒体缓存里
 * 已经落盘的封面），没有才上网拉；拉图 / 解码 / 超时一律静默降级，不拦住页面。
 */
import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { type TermCaps, termCaps } from './caps.js'

/** 一格：字符 + 前景/背景色（ANSI 半块用；`▄` 的前景是下半格、背景是上半格） */
export interface CoverCell {
  ch: string
  fg?: string
  bg?: string
}

export type CoverArt =
  | {
      kind: 'kitty'
      id: number
      cols: number
      rows: number
      /** 先发一次：把原图按虚拟放置传进终端（`U=1`，不直接显示） */
      transmit: string
      /** 正文里逐行画的占位符（每行 `cols` 个 U+10EEEE + 双调谐符） */
      grid: string[]
    }
  | { kind: 'ansi'; rows: CoverCell[][] }

export type CoverMode = 'kitty' | 'ansi' | 'off'

/**
 * 会接 kitty 图形协议、但实现的是**旧草案**（没有 unicode 占位符）的牌子：即使查询回了 `OK` 也留在
 * 半块路上——给它们发占位符就是画一片 `U+10EEEE` 残字（`a=q` 证明不了占位符能力，见 `ui/termProbe.ts`）。
 */
const OLD_PROTOCOL_BRANDS = ['konsole', 'warp']

/**
 * 走哪条路：**启动时问终端的回音说了算**（`caps.kgp`），环境变量只在一条回音都没收到时兜底。
 *
 * 为什么不干脆用环境变量：`KITTY_WINDOW_ID` 会跟着进 tmux / zellij 里的会话，可图形报文被 mux 吃掉，
 * 占位符没人解——原来就是这么认出「一片空白」的封面来的。探测在 mux 里收不到回音，于是自然退回半块。
 */
export function coverMode(env: NodeJS.ProcessEnv = process.env, caps: TermCaps = termCaps()): CoverMode {
  const forced = env.QISHUI_TUI_COVER
  if (forced === 'off' || forced === 'ansi' || forced === 'kitty') return forced
  const brand = caps.brand ?? ''
  if (caps.kgp && !OLD_PROTOCOL_BRANDS.includes(brand)) return 'kitty'
  if (!caps.probed && envKittyish(env)) return 'kitty'
  return 'ansi'
}

/** 没人答探测时的兜底猜测：只认 kitty / ghostty 这两家确实在实现里放了占位符的 */
function envKittyish(env: NodeJS.ProcessEnv): boolean {
  const term = (env.TERM ?? '').toLowerCase()
  const program = (env.TERM_PROGRAM ?? '').toLowerCase()
  return (
    Boolean(env.KITTY_WINDOW_ID) ||
    term.includes('kitty') ||
    term.includes('ghostty') ||
    program === 'kitty' ||
    program === 'ghostty' ||
    Boolean(env.GHOSTTY_RESOURCES_DIR)
  )
}

/**
 * 行/列调谐符表——**必须照抄 kitty 给的这张表**：它是从 Unicode 里筛出来的组合记号，编号
 * **不连续**（索引 0 是 U+0305，索引 1 是 U+030D，不是 U+0306）。照 `0x0305 + n` 推出来的字符
 * 终端不认，占位符要么只画出图像的一部分（错位的行列），要么干脆一片空白——「封面不显示」就是这个。
 * 源：https://sw.kovidgoyal.net/kitty/_downloads/f0a0de9ec8d9ff4456206db8e0814937/rowcolumn-diacritics.txt
 */
const DIACRITICS =
  '\u0305\u030d\u030e\u0310\u0312\u033d\u033e\u033f\u0346\u034a\u034b\u034c\u0350\u0351' +
  '\u0352\u0357\u035b\u0363\u0364\u0365\u0366\u0367\u0368\u0369\u036a\u036b\u036c\u036d' +
  '\u036e\u036f\u0483\u0484\u0485\u0486\u0487\u0592\u0593\u0594\u0595\u0597\u0598\u0599' +
  '\u059c\u059d\u059e\u059f\u05a0\u05a1\u05a8\u05a9\u05ab\u05ac\u05af\u05c4\u0610\u0611' +
  '\u0612\u0613\u0614\u0615\u0616\u0617\u0657\u0658\u0659\u065a\u065b\u065d\u065e\u06d6' +
  '\u06d7\u06d8\u06d9\u06da\u06db\u06dc\u06df\u06e0\u06e1\u06e2\u06e4\u06e7\u06e8\u06eb' +
  '\u06ec\u0730\u0732\u0733\u0735\u0736\u073a\u073d\u073f\u0740\u0741\u0743\u0745\u0747' +
  '\u0749\u074a\u07eb\u07ec\u07ed\u07ee\u07ef\u07f0\u07f1\u07f3\u0816\u0817\u0818\u0819' +
  '\u081b\u081c\u081d\u081e\u081f\u0820\u0821\u0822\u0823\u0825\u0826\u0827\u0829\u082a' +
  '\u082b\u082c\u082d\u0951\u0953\u0954\u0f82\u0f83\u0f86\u0f87\u135d\u135e\u135f\u17dd' +
  '\u193a\u1a17\u1a75\u1a76\u1a77\u1a78\u1a79\u1a7a\u1a7b\u1a7c\u1b6b\u1b6d\u1b6e\u1b6f' +
  '\u1b70\u1b71\u1b72\u1b73\u1cd0\u1cd1\u1cd2\u1cda\u1cdb\u1ce0\u1dc0\u1dc1\u1dc3\u1dc4' +
  '\u1dc5\u1dc6\u1dc7\u1dc8\u1dc9\u1dcb\u1dcc\u1dd1\u1dd2\u1dd3\u1dd4\u1dd5\u1dd6\u1dd7' +
  '\u1dd8\u1dd9\u1dda\u1ddb\u1ddc\u1ddd\u1dde\u1ddf\u1de0\u1de1\u1de2\u1de3\u1de4\u1de5' +
  '\u1de6\u1dfe\u20d0\u20d1\u20d4\u20d5\u20d6\u20d7\u20db\u20dc\u20e1\u20e7\u20e9\u20f0' +
  '\u2cef\u2cf0\u2cf1\u2de0\u2de1\u2de2\u2de3\u2de4\u2de5\u2de6\u2de7\u2de8\u2de9\u2dea' +
  '\u2deb\u2dec\u2ded\u2dee\u2def\u2df0\u2df1\u2df2\u2df3\u2df4\u2df5\u2df6\u2df7\u2df8' +
  '\u2df9\u2dfa\u2dfb\u2dfc\u2dfd\u2dfe\u2dff\ua66f\ua67c\ua67d\ua6f0\ua6f1\ua8e0\ua8e1' +
  '\ua8e2\ua8e3\ua8e4\ua8e5\ua8e6\ua8e7\ua8e8\ua8e9\ua8ea\ua8eb\ua8ec\ua8ed\ua8ee\ua8ef' +
  '\ua8f0\ua8f1\uaab0\uaab2\uaab3\uaab7\uaab8\uaabe\uaabf\uaac1\ufe20\ufe21\ufe22\ufe23' +
  '\ufe24\ufe25\ufe26\u{10a0f}\u{10a38}\u{1d185}\u{1d186}\u{1d187}\u{1d188}\u{1d189}' +
  '\u{1d1aa}\u{1d1ab}\u{1d1ac}\u{1d1ad}\u{1d242}\u{1d243}\u{1d244}'

/** 按码点切表（尾几条在增补平面，按 UTF-16 下标取会取到半个代理对） */
const DIACRITIC_CHARS = [...DIACRITICS]

/** 调谐符：把 0-based 的行/列号编进 kitty 指定的组合字符（占位符规范见 kitty graphics-protocol） */
function diacritic(value: number): string {
  const last = DIACRITIC_CHARS.length - 1
  return DIACRITIC_CHARS[Math.min(Math.max(0, value), last)] ?? ''
}

/**
 * `ESC` 字符。正则**字面量**里写 `\u001b` 会被 lint 的 `noControlCharactersInRegex` 拦下，
 * 所以凡是要匹配 ESC 的正则一律用字符串动态拼（与 `ui/mouse.tsx` 同一口径）。
 */
const ESC = String.fromCharCode(0x1b)

/** 图片 id：24 位以内（直接编进占位符的前景色里，不用第三个调谐符），从 URL 稳定推出来 */
export function coverId(url: string): number {
  const digest = createHash('sha1').update(url).digest()
  // 取 3 字节，避开 0（0 是「任意放置」的保留值）
  const id = (digest[0] << 16) | (digest[1] << 8) | digest[2] || 1
  return id & 0xffffff
}

/** 占位符网格：每格 `U+10EEEE` + 行调谐符 + 列调谐符；前景色由调用方设成图片 id */
export function kittyGrid(cols: number, rows: number): string[] {
  const grid: string[] = []
  for (let r = 0; r < rows; r++) {
    let line = ''
    for (let c = 0; c < cols; c++) line += `\u{10EEEE}${diacritic(r)}${diacritic(c)}`
    grid.push(line)
  }
  return grid
}

/** 图片 id → 24 位真彩色十六进制（kitty 拿前景色当前景色的同时，也当图片 id 读） */
export function idColor(id: number): string {
  return `#${(id & 0xffffff).toString(16).padStart(6, '0')}`
}

/**
 * chafa `-f kitty` 的输出：`a=T,f=32,s=W,v=H,...` + base64 载荷。抽出尺寸与原始 RGBA。
 *
 * 关键坑：chafa **每一块都是独立 base64**（512 字节一块，各自带自己的 `=` 填充），所以把各块
 * 的 base64 字符串直接拼起来是错的——中间的 `=` 会让终端的 base64 解码器提前收工，图就只剩前
 * 几百字节，终端干脆不画（一路「封面空白」就是这么来的）。必须**逐块解码成字节再重新编码**。
 */
export function parseKittyOutput(out: string): { width: number; height: number; data: string } | undefined {
  const control = /_Ga=T,f=32,s=(\d+),v=(\d+)/.exec(out)
  if (!control) return undefined
  const width = Number(control[1])
  const height = Number(control[2])
  const payload = new RegExp(`_G(?:[^;]*);([A-Za-z0-9+/=]+)${ESC}\\\\`, 'g')
  const parts: Buffer[] = []
  for (const chunk of out.matchAll(payload)) parts.push(Buffer.from(chunk[1], 'base64'))
  if (!parts.length) return undefined
  const raw = Buffer.concat(parts)
  // `f=32` 每像素 4 字节：对不上就是块没解析全（比如中间多了个 `=`），当没封面，别把半张图塞给终端
  if (raw.length !== width * height * 4) return undefined
  return { width, height, data: raw.toString('base64') }
}

/**
 * 把原始 RGBA 包成我们自己的「传图 + 虚拟放置」转义（分块 4096）。
 * 分块形状照抄 chafa 自己的输出：**只有第一块带全套 key，后续块只留 `m`**——重发 key 会让
 * 终端把续块当成新的传输（图就挂不上，占位符一片空白）。
 */
export function kittyTransmit(opts: {
  id: number
  width: number
  height: number
  cols: number
  rows: number
  data: string
}): string {
  const { id, width, height, cols, rows, data } = opts
  const head = `\u001b_Ga=T,f=32,s=${width},v=${height},U=1,i=${id},c=${cols},r=${rows},q=2`
  const parts: string[] = []
  const size = 4096
  for (let i = 0; i < data.length; i += size) {
    const chunk = data.slice(i, i + size)
    const last = i + size >= data.length
    const keys = parts.length === 0 ? `${head},m=${last ? 0 : 1}` : `\u001b_Gm=${last ? 0 : 1}`
    parts.push(`${keys};${chunk}\u001b\\`)
  }
  return parts.join('')
}

/**
 * 删掉一张已经传进终端的图（`a=d`）。必须带 `q=2`：不静音的话终端会回一条 `OK`/`ENOENT:`，
 * 那条回音会当成按键打进界面（和 `ui/termProbe.ts` 挡回音同一类问题）。
 */
export function kittyDelete(id: number): string {
  return `\u001b_Ga=d,i=${id},q=2\u001b\\`
}

/**
 * 还挂在终端里的图：`id → 有几个格子在用`。归零才真发删除——详情页封面和侧栏头像可能共用同一个 id
 * （`coverId` 只有 24 位，跨 url 也可能撞），少数一次就会把还在显示的那张擦掉。
 */
const held = new Map<number, number>()

export function acquireCoverImage(id: number): void {
  held.set(id, (held.get(id) ?? 0) + 1)
}

/** 引用降到 0 时发删除（`write` 由调用方给：组件里是 `stdout.write`，单测里是个数组） */
export function releaseCoverImage(id: number, write: (chunk: string) => void): void {
  const left = (held.get(id) ?? 0) - 1
  if (left > 0) {
    held.set(id, left)
    return
  }
  held.delete(id)
  write(kittyDelete(id))
}

/** 测试用：清掉引用计数 */
export function resetCoverImages(): void {
  held.clear()
}

/**
 * 解析 chafa `-f symbols --colors full` 的输出：每行是若干 `ESC[38;2;r;g;b;48;2;r;g;bm<字符>` 段。
 * 只认它真会输出的几种 SGR（真彩前景/背景、`0` 复位），产出每格的字符与色。
 */
export function parseAnsiOutput(out: string, cols: number): CoverCell[][] {
  const rows: CoverCell[][] = []
  for (const rawLine of out.split('\n')) {
    const line = rawLine.replace(new RegExp(`${ESC}\\[\\?25[lh]`, 'g'), '')
    if (!line.includes('m')) continue
    const cells: CoverCell[] = []
    let fg: string | undefined
    let bg: string | undefined
    let index = 0
    const re = new RegExp(`${ESC}\\[([0-9;]*)m`, 'g')
    let match = re.exec(line)
    while (match) {
      const params = match[1]
      // 段文本 = 下一条 SGR 之前的内容
      const start = re.lastIndex
      const next = line.indexOf(`${ESC}[`, start)
      const text = line.slice(start, next === -1 ? line.length : next)
      if (params === '0') {
        fg = undefined
        bg = undefined
      } else {
        const parsed = parseSgr(params)
        if (parsed.fg) fg = parsed.fg
        if (parsed.bg) bg = parsed.bg
      }
      for (const ch of text) {
        if (ch === '\r') continue
        cells.push({ ch, fg, bg })
        index += 1
        if (index >= cols) break
      }
      if (next === -1) break
      re.lastIndex = next
      match = re.exec(line)
    }
    if (cells.length) rows.push(cells)
  }
  return rows
}

function parseSgr(params: string): { fg?: string; bg?: string } {
  const codes = params.split(';').map(Number)
  const result: { fg?: string; bg?: string } = {}
  for (let i = 0; i < codes.length; i++) {
    const code = codes[i]
    if ((code === 38 || code === 48) && codes[i + 1] === 2) {
      const hex = rgb(codes[i + 2], codes[i + 3], codes[i + 4])
      if (code === 38) result.fg = hex
      else result.bg = hex
      i += 4
    } else if ((code === 38 || code === 48) && codes[i + 1] === 5) {
      const hex = ansi256(codes[i + 2])
      if (code === 38) result.fg = hex
      else result.bg = hex
      i += 2
    }
  }
  return result
}

function rgb(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, n | 0))
  return `#${[r, g, b].map((n) => clamp(n).toString(16).padStart(2, '0')).join('')}`
}

function ansi256(n: number): string {
  if (!Number.isFinite(n) || n < 0) return '#000000'
  if (n < 16) {
    const base = [
      '#000000',
      '#800000',
      '#008000',
      '#808000',
      '#000080',
      '#800080',
      '#008080',
      '#c0c0c0',
      '#808080',
      '#ff0000',
      '#00ff00',
      '#ffff00',
      '#0000ff',
      '#ff00ff',
      '#00ffff',
      '#ffffff',
    ]
    return base[n] ?? '#000000'
  }
  if (n < 232) {
    const i = n - 16
    const level = (v: number) => (v === 0 ? 0 : 55 + v * 40)
    return rgb(level(Math.floor(i / 36)), level(Math.floor((i % 36) / 6)), level(i % 6))
  }
  const gray = 8 + (n - 232) * 10
  return rgb(gray, gray, gray)
}

/** chafa 跑一次，图从 stdin 进；超时就杀掉，不拖住界面 */
function runChafa(args: string[], input: Buffer, timeoutMs = 6000): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn('chafa', args, { stdio: ['pipe', 'pipe', 'ignore'] })
    let out = ''
    const timer = setTimeout(() => {
      child.kill('SIGKILL')
      reject(new Error('chafa 超时'))
    }, timeoutMs)
    child.stdout.setEncoding('utf8')
    child.stdout.on('data', (chunk: string) => {
      out += chunk
    })
    child.on('error', (err) => {
      clearTimeout(timer)
      reject(err)
    })
    child.on('close', (code) => {
      clearTimeout(timer)
      if (code === 0) resolve(out)
      else reject(new Error(`chafa 退出码 ${code}`))
    })
    child.stdin.on('error', () => {})
    child.stdin.end(input)
  })
}

/** 拉封面字节：10 秒超时、5MB 上限，失败/超限一律 undefined（页面只当没封面） */
async function fetchCover(url: string): Promise<Buffer | undefined> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 10_000)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) return undefined
    const buffer = Buffer.from(await res.arrayBuffer())
    return buffer.length > 5_000_000 ? undefined : buffer
  } catch {
    return undefined
  } finally {
    clearTimeout(timer)
  }
}

/**
 * 给 chafa 的尺寸上限（**格**，不是像素）。`--size` 在管道下按 chafa 默认的 10×20 px/格换算，
 * 于是传的字节数 ≈ `cols*10 × rows*20 × 4 × 4/3`——不压住这个上限（从前固定写 `256x256`），
 * 一张封面就能出 2560×2560 的图、base64 三十多兆，终端直接噎住、图也就画不出来。
 */
const KITTY_MAX_COLS = 60
const KITTY_MAX_ROWS = 30

/**
 * kitty 路的 chafa `--size`：**跟着占位格走**再夹上限。格数直接决定像素数（chafa 管道下按
 * 10×20 px/格 换算），所以尺寸必须由调用方给，不能写死一个大数。
 */
export function kittySizeArg(cols: number, rows: number): string {
  return `${Math.min(KITTY_MAX_COLS, cols)}x${Math.min(KITTY_MAX_ROWS, rows)}`
}

const cache = new Map<string, CoverArt | null>()
/** 槽位从一页变四页（听歌 / 详情 / 用户 / 侧栏）而且尺寸随窗口变，16 张会来回踢掉刚解好的 */
const MAX_CACHE = 32

/** `renderCover` 的附加项 */
export interface CoverOpts {
  /**
   * 缓存键：有曲目 id 就用它（同一张封面换窗口尺寸才重解，换页不重取），没给就退回 url。
   */
  key?: string
  /**
   * 本地字节优先（core 的媒体缓存里已经落盘的封面），返回 undefined 才走 `url` 上网拉。
   * 这里不直接依赖 `qishui-core`：这一层要保持离线可测。
   */
  loadBytes?: () => Promise<Buffer | undefined>
}

/**
 * 渲染一张封面。`cols`/`rows` 是占位格数；同一 key + 尺寸命中内存缓存，避免重画时反复解码。
 * 拿不到图 / 没有 chafa / 解析失败 → undefined（调用方画占位）。
 */
export async function renderCover(
  url: string,
  cols: number,
  rows: number,
  mode: CoverMode,
  opts: CoverOpts = {},
): Promise<CoverArt | undefined> {
  if (mode === 'off' || (!url && !opts.loadBytes) || cols <= 0 || rows <= 0) return undefined
  const key = `${mode}:${cols}x${rows}:${opts.key ?? url}`
  const hit = cache.get(key)
  if (hit !== undefined) return hit ?? undefined

  const art = await buildCover(url, cols, rows, mode, opts)
  cache.set(key, art ?? null)
  if (cache.size > MAX_CACHE) {
    const oldest = cache.keys().next().value
    if (oldest !== undefined) cache.delete(oldest)
  }
  return art
}

async function buildCover(
  url: string,
  cols: number,
  rows: number,
  mode: CoverMode,
  opts: CoverOpts,
): Promise<CoverArt | undefined> {
  const bytes = (await opts.loadBytes?.().catch(() => undefined)) ?? (url ? await fetchCover(url) : undefined)
  if (!bytes) return undefined
  try {
    if (mode === 'kitty') {
      // `--stretch`：源图正好铺满这块占位格。不加它 chafa 会按图片比例缩，而 kitty 的 `c=`/`r=`
      // 是按格拉伸的，两者对不上就变形（方形封面贴进 `2N × N` 格子会变扁）。
      const size = kittySizeArg(cols, rows)
      const out = await runChafa(['--format', 'kitty', '--stretch', '--size', size, '-'], bytes)
      const parsed = parseKittyOutput(out)
      if (!parsed) return undefined
      const id = coverId(url)
      return {
        kind: 'kitty',
        id,
        cols,
        rows,
        transmit: kittyTransmit({ id, width: parsed.width, height: parsed.height, cols, rows, data: parsed.data }),
        grid: kittyGrid(cols, rows),
      }
    }
    const out = await runChafa(
      ['--format', 'symbols', '--colors', 'full', '--symbols', 'vhalf', '--stretch', '--size', `${cols}x${rows}`, '-'],
      bytes,
    )
    const parsed = parseAnsiOutput(out, cols)
    return parsed.length ? { kind: 'ansi', rows: parsed } : undefined
  } catch {
    return undefined
  }
}

/** 测试/自检用：清掉内存缓存 */
export function clearCoverCache(): void {
  cache.clear()
}
