/** 时间 / 文本格式化（与 CLI 同口径） */

export function formatDuration(ms?: number): string {
  if (typeof ms !== 'number' || !Number.isFinite(ms) || ms <= 0) return '--:--'
  const total = Math.round(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function formatClock(ms: number): string {
  return formatDuration(ms)
}

/** 按「显示宽度」粗略截断（CJK 按 2 计），超出加 `…` */
export function truncate(input: string, width: number): string {
  if (width <= 0) return ''
  const chars = [...input]
  let used = 0
  let out = ''
  for (const ch of chars) {
    const w = isWide(ch) ? 2 : 1
    if (used + w > width - 1) return `${out}…`
    out += ch
    used += w
  }
  return out
}

export function displayWidth(input: string): number {
  let w = 0
  for (const ch of [...input]) w += isWide(ch) ? 2 : 1
  return w
}

/** 窄/宽字符粗判：CJK、全角标点、常见 emoji 记 2 列 */
function isWide(ch: string): boolean {
  const code = ch.codePointAt(0) ?? 0
  return (
    (code >= 0x1100 && code <= 0x115f) ||
    (code >= 0x2e80 && code <= 0xa4cf) ||
    (code >= 0xac00 && code <= 0xd7a3) ||
    (code >= 0xf900 && code <= 0xfaff) ||
    (code >= 0xfe30 && code <= 0xfe4f) ||
    (code >= 0xff00 && code <= 0xff60) ||
    (code >= 0xffe0 && code <= 0xffe6) ||
    (code >= 0x1f300 && code <= 0x1f9ff)
  )
}

/** 用空格把已渲染文本补齐到指定显示宽度（给表格列对齐用） */
export function padRight(input: string, width: number): string {
  const text = displayWidth(input) > width ? truncate(input, width) : input
  return text + ' '.repeat(Math.max(0, width - displayWidth(text)))
}

export function artistNames(artists: { name: string }[] | undefined): string {
  if (!artists || artists.length === 0) return ''
  return artists.map((a) => a.name).join(' / ')
}

export function progressBar(positionMs: number, durationMs: number, width: number): string {
  if (!durationMs || durationMs <= 0 || width <= 2) return '─'.repeat(Math.max(0, width))
  const ratio = Math.max(0, Math.min(1, positionMs / durationMs))
  const filled = Math.round(ratio * (width - 1))
  return `${'━'.repeat(filled)}●${'─'.repeat(Math.max(0, width - 1 - filled))}`
}

/**
 * `progressBar` 的逆运算：盒内 0 基列 → 0..1 比例（点击进度条定位用）。
 * 正变换是 `filled = round(ratio*(width-1))`，所以分母是 `width-1` 不是 `width`；
 * 前提是这一格里只有进度条本身（━/●/─ 都是单宽字符，别和别的字混在同一个盒子里）。
 */
export function barRatio(col: number, width: number): number {
  if (width <= 1) return 0
  return Math.max(0, Math.min(1, col / (width - 1)))
}
