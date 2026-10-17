import type { ShareLyricSentence, ShareLyrics } from 'qishui-api'

export interface LyricWord {
  text: string
  startMs?: number
  endMs?: number
}

export interface LyricLine {
  text: string
  startMs?: number
  endMs?: number
  words?: LyricWord[]
  /** `'lrc'` = 只有行级时间的署名行（作曲/作词），正文行没有这个字段 */
  type?: string
  /** 署名行（作曲：/作词：/制作人：…）：滚动歌词界面通常要过滤掉 */
  credit: boolean
}

const CREDIT = /^(作曲|作词|编曲|制作人|出品|监制|混音|母带|录音|吉他|贝斯|鼓|键盘|和声|录音室|OP|SP|发行|统筹|企划|艺人统筹|歌曲制作|音乐制作)[:：]/

/**
 * 结构化歌词（KRC，行级 + 逐字）。
 * 只做「时间轴查询」这一件事：播放器每帧问 `lineAt(ms)` / `wordAt(ms)` 就够了，
 * 渲染（滚动动画、卡拉OK 高亮）是上层的事。
 */
export class Lyrics {
  readonly lines: LyricLine[]
  readonly type: string

  constructor(raw: ShareLyrics | { sentences?: ShareLyricSentence[]; lyric_type?: string } | undefined) {
    const sentences = (raw?.sentences ?? []) as ShareLyricSentence[]
    this.type = raw?.lyric_type ?? 'krc'
    this.lines = sentences
      .map((s) => {
        const line: LyricLine = {
          text: s.text ?? '',
          startMs: norm(s.start_ms),
          endMs: norm(s.end_ms),
          type: s.type,
          credit: CREDIT.test(s.text ?? ''),
        }
        if (Array.isArray(s.words) && s.words.length) {
          line.words = s.words.map((w) => ({ text: w.text ?? '', startMs: norm(w.start_ms), endMs: norm(w.end_ms) }))
        }
        return line
      })
      .filter((line) => line.text.trim() !== '' || line.words?.length)
  }

  /** 歌词正文（不含署名行），一行一句 */
  get text(): string {
    return this.lines.filter((l) => !l.credit).map((l) => l.text).join('\n')
  }

  /** 正文行（歌手指向的「要唱的部分」） */
  get contentLines(): LyricLine[] {
    return this.lines.filter((l) => !l.credit)
  }

  get durationMs(): number | undefined {
    return this.lines.reduce<number | undefined>((max, line) => (line.endMs && (!max || line.endMs > max) ? line.endMs : max), undefined)
  }

  /** 当前时刻所在行；返回行号（在 this.lines 里的下标），没有就是 -1 */
  indexAt(ms: number): number {
    let index = -1
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i]
      if (line.startMs == null) continue
      if (line.startMs <= ms) index = i
      else break
    }
    return index
  }

  lineAt(ms: number): LyricLine | undefined {
    const index = this.indexAt(ms)
    return index < 0 ? undefined : this.lines[index]
  }

  /** 当前逐字高亮位置：{line, wordIndex}；整句无逐字时间时 wordIndex = -1 */
  wordAt(ms: number): { line: LyricLine; wordIndex: number } | undefined {
    const line = this.lineAt(ms)
    if (!line) return undefined
    if (!line.words?.length) return { line, wordIndex: -1 }
    let wordIndex = -1
    for (let i = 0; i < line.words.length; i++) {
      const start = line.words[i].startMs
      if (start == null) continue
      if (start <= ms) wordIndex = i
      else break
    }
    return { line, wordIndex }
  }

  /** 加 `offsetMs` 让歌词更贴播放进度（正数 = 歌词提前） */
  view(ms: number, offsetMs = 0): { line?: LyricLine; index: number; next?: LyricLine } {
    const at = ms + offsetMs
    const index = this.indexAt(at)
    return {
      line: index < 0 ? undefined : this.lines[index],
      index,
      next: index + 1 < this.lines.length ? this.lines[index + 1] : undefined,
    }
  }

  toJSON(): LyricLine[] {
    return this.lines
  }
}

/** 末行 endMs 是 MAX_SAFE_INTEGER 哨兵（持续到曲终），归一化掉 */
function norm(value: unknown): number | undefined {
  if (typeof value !== 'number') return undefined
  return value < Number.MAX_SAFE_INTEGER ? value : undefined
}
