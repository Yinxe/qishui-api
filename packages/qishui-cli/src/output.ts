/**
 * 终端输出：颜色、表格、状态行/进度条、JSON、确认提问。
 *
 * 约定：
 *  - **人类可读的输出走 stdout**，日志/警告走 stderr（`--json` 时 stdout 只有 JSON，能直接管进 jq）；
 *  - 每条命令都走 `emit()`：默认渲染给人看，`--json` 输出同一个数据的结构化形态——
 *    **两条路吃的是同一份数据**，不存在"可视化有的字段 JSON 里没有"；
 *  - 颜色用 Node 内置 `util.styleText`（不引 chalk），`NO_COLOR` / `--no-color` 关掉；
 *  - 非 TTY（管道）自动降级：不出颜色、不画进度条、不覆盖状态行。
 */
import { createInterface } from 'node:readline/promises'
import { styleText } from 'node:util'

type Fmt = Parameters<typeof styleText>[0]

let useColor = process.env.NO_COLOR == null
let jsonMode = false
let rawMode = false
let showId = true

export function setColor(enabled: boolean): void {
  useColor = enabled
}

/** 由 `context.setGlobals()` 在命令执行前设置 */
export function setOutputMode(opts: { json: boolean; raw: boolean; id?: boolean }): void {
  jsonMode = opts.json
  rawMode = opts.raw
  if (opts.id !== undefined) showId = opts.id
}

export function isJsonMode(): boolean {
  return jsonMode
}

/**
 * 人读输出里带不带 id（默认带）。
 *
 * 默认带是有意的：不带 id 的列表**没法直接接着用**（`qishui play <id>` / `qishui like <id>`），
 * 要么重跑一遍 `--json` 浪费 token，要么肉眼从别名反推 —— 两种都糟。
 * 嫌吵就 `--no-id`（全局开关，一处生效）。
 */
export function isIdVisible(): boolean {
  return showId
}

/** 一行式描述尾部的 id 片段（`--no-id` 时返回 undefined，交给 `tailParts` 拼） */
export function idTag(id?: string): string | undefined {
  return showId && id ? dim(id) : undefined
}

function paint(text: string, fmt: Fmt): string {
  if (!useColor) return text
  // styleText 自己会看 stdout 是不是 TTY，管道里再退化成纯文本
  return styleText(fmt, text)
}

export const dim = (s: string): string => paint(s, 'dim')
export const bold = (s: string): string => paint(s, 'bold')
export const red = (s: string): string => paint(s, 'red')
export const green = (s: string): string => paint(s, 'green')
export const yellow = (s: string): string => paint(s, 'yellow')
export const blue = (s: string): string => paint(s, 'blue')
export const magenta = (s: string): string => paint(s, 'magenta')
export const cyan = (s: string): string => paint(s, 'cyan')
export const gray = (s: string): string => paint(s, 'gray')

export const isTty = (): boolean => process.stdout.isTTY === true

/* ------------------------------------------------------------ 宽度与截断 */

/** 全角/宽字符按 2 列算（够用的近似：CJK + 全角标点） */
export function charWidth(ch: string): number {
  const cp = ch.codePointAt(0) ?? 0
  if (cp === 0x200d || (cp >= 0x0300 && cp <= 0x036f)) return 0
  if (
    (cp >= 0x1100 && cp <= 0x115f) ||
    (cp >= 0x2e80 && cp <= 0x303e) ||
    (cp >= 0x3041 && cp <= 0x33ff) ||
    (cp >= 0x3400 && cp <= 0x4dbf) ||
    (cp >= 0x4e00 && cp <= 0x9fff) ||
    (cp >= 0xa000 && cp <= 0xa4cf) ||
    (cp >= 0xac00 && cp <= 0xd7a3) ||
    (cp >= 0xf900 && cp <= 0xfaff) ||
    (cp >= 0xfe30 && cp <= 0xfe6f) ||
    (cp >= 0xff00 && cp <= 0xff60) ||
    (cp >= 0xffe0 && cp <= 0xffe6) ||
    (cp >= 0x1f300 && cp <= 0x1f9ff)
  )
    return 2
  return 1
}

/** 去掉 ANSI 转义（量宽度前必须做，否则 `green('●')` 这种染色单元格会把列宽算歪） */
// 用 String.fromCharCode 拼正则：字面量里写 \u001b/\x1b 会被 noControlCharactersInRegex 拦下
const ANSI = new RegExp(`${String.fromCharCode(0x1b)}\\[[0-9;]*m`, 'g')

export function stripAnsi(text: string): string {
  return text.replace(ANSI, '')
}

export function displayWidth(text: string): number {
  let width = 0
  for (const ch of stripAnsi(text)) width += charWidth(ch)
  return width
}

export function truncate(text: string, width: number): string {
  if (width <= 0) return ''
  if (displayWidth(text) <= width) return text
  // 要截了就退回纯文本（不然转义序列会被腰斩）
  const plain = stripAnsi(text)
  let out = ''
  let used = 0
  for (const ch of plain) {
    const w = charWidth(ch)
    if (used + w > width - 1) break
    out += ch
    used += w
  }
  return out + '…'
}

export function pad(text: string, width: number, align: 'left' | 'right' = 'left'): string {
  const gap = Math.max(0, width - displayWidth(text))
  return align === 'left' ? text + ' '.repeat(gap) : ' '.repeat(gap) + text
}

export function termWidth(): number {
  const cols = process.stdout.columns
  return cols && cols > 20 ? Math.min(cols, 200) : 100
}

/* ------------------------------------------------------------ 排版 */

export function print(text = ''): void {
  process.stdout.write(text + '\n')
}

/** 一行小标题：`▍曲目` */
export function heading(text: string, extra?: string): void {
  print(`${bold(cyan('▍' + text))}${extra ? ' ' + dim(extra) : ''}`)
}

export function hr(): void {
  print(dim('─'.repeat(Math.min(termWidth(), 72))))
}

export function printList(items: string[]): void {
  for (const item of items) print(item)
}

/** 两列 key/value（统计、快照这类） */
export function printKeyValues(pairs: [string, string | number | undefined | null][], indent = ''): void {
  const keys = pairs.map(([k]) => k)
  const width = Math.max(0, ...keys.map((k) => displayWidth(k)))
  for (const [key, value] of pairs) {
    if (value === undefined || value === null || value === '') continue
    print(`${indent}${pad(dim(key), width)}  ${value}`)
  }
}

/**
 * 三线表：顶线 / 表头 / 表头线 / 数据行 / 底线，无竖线（全 CLI 表格统一这个样式）。
 * `flex` 列在总宽超过终端宽度时从宽到窄压缩并截断（`…`），其余列保持自然宽。
 */
export function printTable(
  headers: string[],
  rows: string[][],
  opts: { right?: number[]; flex?: number[] } = {},
): void {
  const right = new Set(opts.right ?? [])
  const flex = new Set(opts.flex ?? [])
  const gap = '  '
  const widths = headers.map((h, i) => Math.max(displayWidth(h), ...rows.map((r) => displayWidth(r[i] ?? '')), 0))
  const total = () => widths.reduce((sum, w) => sum + w, 0) + gap.length * (widths.length - 1)
  const avail = termWidth() - 1
  if (total() > avail && flex.size) {
    let excess = total() - avail
    for (const i of [...flex].sort((a, b) => widths[b] - widths[a])) {
      if (excess <= 0) break
      const min = Math.max(displayWidth(headers[i]), 6)
      const cut = Math.min(excess, Math.max(0, widths[i] - min))
      widths[i] -= cut
      excess -= cut
    }
  }
  const rule = (): void => print(dim('─'.repeat(Math.min(total(), avail))))
  const line = (cells: string[]): string =>
    cells
      .map((cell, i) => pad(truncate(cell, widths[i]), widths[i], right.has(i) ? 'right' : 'left'))
      .join(gap)
      .replace(/\s+$/, '')
  rule()
  print(dim(line(headers)))
  rule()
  for (const row of rows) print(line(row))
  rule()
}

/**
 * 表格尾部按需追加一列 `id`（`--no-id` 时整列去掉）。
 *
 * 表格里其它列都是人读信息（名称/歌手…），id 只用来"接着操作"，所以它跟着全局开关走；
 * 命令本身的主要产物是 id 时（如 `qishui modes` 的 radio_id）别用它，那个列是正事。
 */
export function withIdColumn(
  headers: string[],
  rows: string[][],
  ids: (string | undefined)[],
): { headers: string[]; rows: string[][] } {
  if (!showId) return { headers, rows }
  return {
    headers: [...headers, 'id'],
    rows: rows.map((row, index) => [...row, ids[index] ?? '']),
  }
}

/* ------------------------------------------------------------ 状态行 / 进度条 */

export function statusLine(text: string): void {
  if (!isTty() || jsonMode) return
  process.stdout.write('\r\x1b[2K' + text)
}

export function clearStatusLine(): void {
  if (!isTty() || jsonMode) return
  process.stdout.write('\r\x1b[2K')
}

/** 单行进度条（宽度按终端自适应） */
export function progressBar(ratio: number, width = 24): string {
  const clamped = Math.max(0, Math.min(1, Number.isFinite(ratio) ? ratio : 0))
  const filled = Math.round(clamped * width)
  return green('█'.repeat(filled)) + gray('░'.repeat(Math.max(0, width - filled)))
}

/* ------------------------------------------------------------ JSON */

/** 实体（有 toJSON）→ 普通对象；`raw` 键默认丢掉（`--raw` 保留） */
function normalize(value: unknown, keepRaw: boolean, depth = 0): unknown {
  if (value === null || typeof value !== 'object') return value
  if (depth > 10) return undefined
  if (Array.isArray(value)) return value.map((item) => normalize(item, keepRaw, depth + 1))
  const obj = value as Record<string, unknown> & { toJSON?: () => unknown }
  if (typeof obj.toJSON === 'function') return normalize(obj.toJSON(), keepRaw, depth + 1)
  const out: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(obj)) {
    if (!keepRaw && key === 'raw') continue
    if (val === undefined) continue
    out[key] = normalize(val, keepRaw, depth + 1)
  }
  return out
}

/** App 形状的 JSON（默认剥掉每个实体的 `raw`） */
export function toJsonValue(value: unknown, keepRaw = false): unknown {
  return normalize(value, keepRaw)
}

export function printJson(value: unknown, keepRaw = false): void {
  print(JSON.stringify(toJsonValue(value, keepRaw), null, 2))
}

/**
 * 命令输出的**唯一出口**：`--json` 走结构化，否则渲染给人看。
 *
 * ```ts
 * emit(
 *   () => { heading('搜索结果'); printTrackList(tracks) },
 *   { query, tracks, total: tracks.length },
 * )
 * ```
 *
 * 结构化那份**就是渲染用的同一组实体**（`normalize()` 会递归调 `toJSON()`，默认剥掉 `raw`），
 * 别在渲染里另算一套字段——那正是「可视化有、JSON 没有」的来源。
 */
export function emit(render: () => void, data: unknown): void {
  if (jsonMode) printJson(data, rawMode)
  else render()
}

/* ------------------------------------------------------------ 提问与提示 */

export function warn(message: string): void {
  process.stderr.write(`${yellow('!')} ${message}\n`)
}

export function info(message: string): void {
  process.stderr.write(`${dim('·')} ${dim(message)}\n`)
}

export async function askYesNo(question: string, opts: { default?: boolean } = {}): Promise<boolean> {
  const fallback = opts.default ?? false
  if (!process.stdin.isTTY) return fallback
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  try {
    const hint = fallback ? '[Y/n]' : '[y/N]'
    const answer = (await rl.question(`${question} ${hint} `)).trim().toLowerCase()
    if (!answer) return fallback
    return answer === 'y' || answer === 'yes'
  } finally {
    rl.close()
  }
}
