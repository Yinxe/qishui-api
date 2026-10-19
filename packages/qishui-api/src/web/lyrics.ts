import type { ShareLyricSentence, ShareLyrics } from './sharePage.js'

const LINE_HEAD = /^\[(\d+),(\d+)\]/
const WORD_MARK = /<(\d+),(\d+),?\d*>/g

/**
 * KRC 原文 → ShareLyrics（与分享页 SSR 同一形状）。
 *
 * KRC 一行是 `[句起,句长]<词起,词长,升调>词…`：**词文紧跟在自己的时间戳后面**，
 * 词内时间是**相对句首**的偏移。只有行时间的署名行（作曲/作词）写成
 * `[句起,句长]文本`，没有 `<…>` —— 这种标 `type: 'lrc'`。
 * 唯一的模糊地带：只有一个词且它占满整行时，「相对 0 起」和「绝对句起」算出来同一个形状，
 * 分不开；不标 lrc 也不影响文本与逐字时间。
 */
export function parseKrc(content: unknown): ShareLyrics | undefined {
  if (typeof content !== 'string' || !content.trim()) return undefined

  const sentences: ShareLyricSentence[] = []
  for (const line of content.split(/\r?\n/)) {
    const head = LINE_HEAD.exec(line)
    if (!head) continue
    const start = Number(head[1])
    const end = start + Number(head[2])
    const rest = line.slice(head[0].length)

    const marks: { at: number; tagEnd: number; offset: number; duration: number }[] = []
    for (const m of rest.matchAll(WORD_MARK)) {
      marks.push({ at: m.index, tagEnd: m.index + m[0].length, offset: Number(m[1]), duration: Number(m[2]) })
    }

    if (!marks.length) {
      const text = rest.trim()
      if (!text) continue
      sentences.push({
        text,
        start_ms: start,
        end_ms: end,
        words: [{ text, start_ms: start, end_ms: end }],
        type: 'lrc',
      })
      continue
    }

    const words = marks.map((m, i) => ({
      text: rest.slice(m.tagEnd, marks[i + 1] ? marks[i + 1].at : rest.length),
      start_ms: start + m.offset,
      end_ms: start + m.offset + m.duration,
    }))
    const credit = words.length === 1 && words[0].start_ms === start
    sentences.push({
      text: words.map((w) => w.text).join(''),
      start_ms: start,
      end_ms: end,
      words,
      ...(credit ? { type: 'lrc' as const } : {}),
    })
  }

  if (!sentences.length) return undefined
  return { lyric_type: 'krc', sentences }
}
