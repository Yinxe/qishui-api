/**
 * 歌词窗口：固定 `height` 行，**正在唱的那句永远在正中**（`start = 居中句 - height/2`，可以为负）。
 * 起点为负 = 歌刚开头，窗口上面几行是留白；到结尾同理，下面留白 —— 位置永远稳定，不跟着歌头/歌尾跳。
 *
 * 从旧的 `screens/Player.tsx` 搬出来：播放页合并进听歌页后，歌词仍由这里画。
 */
import { Box, Text } from 'ink'
import type { LyricLine, Lyrics, LyricWord } from 'qishui-core'
import { COLOR, CURRENT_PREFIX } from '../ui/theme.js'

export function LyricsView({
  lyrics,
  activeIndex,
  songMs,
  start,
  height,
}: {
  lyrics: Lyrics | undefined
  activeIndex: number
  songMs: number
  start: number
  height: number
}) {
  const lines = lyrics?.lines ?? []
  // 没歌词也占满 height 行（提示句落在正中），不然整块高度会缩，下面的布局跟着跳。
  // 整块用一个 Text 换行拼出来：留白行没有身份，逐个建元素只会换来一排「key 是下标」的告警。
  if (lines.length === 0) {
    const mid = Math.floor(height / 2)
    const rows = Array.from({ length: height }, (_, i) => (i === mid ? '（没有歌词 / 还没解析出来）' : ' '))
    return <Text dimColor>{rows.join('\n')}</Text>
  }
  return (
    <Box flexDirection="column">
      {Array.from({ length: height }, (_, offset) => {
        const index = start + offset
        const line = lines[index]
        if (!line) return <Text key={`blank-${index}`}> </Text>
        return <LyricRow key={`${index}-${line.text}`} line={line} active={index === activeIndex} songMs={songMs} />
      })}
    </Box>
  )
}

function LyricRow({ line, active, songMs }: { line: LyricLine; active: boolean; songMs: number }) {
  // 署名行（作曲/作词…）不参与逐字高亮，永远淡显
  if (!active || line.credit) {
    return (
      <Text color={active ? COLOR.accent : undefined} dimColor={!active} wrap="truncate-end">
        {active ? `${CURRENT_PREFIX} ` : '  '}
        {line.text || ' '}
      </Text>
    )
  }
  if (!line.words?.length) {
    return (
      <Text bold color={COLOR.accent} wrap="truncate-end">
        {`${CURRENT_PREFIX} `}
        {line.text || ' '}
      </Text>
    )
  }
  const wordIndex = wordIndexAt(line.words, songMs)
  return (
    <Text bold wrap="truncate-end">
      <Text color={COLOR.accent}>{`${CURRENT_PREFIX} `}</Text>
      {line.words.map((word, i) => (
        <Word
          key={`${word.text}-${word.startMs ?? ''}-${word.endMs ?? ''}`}
          word={word}
          state={i < wordIndex ? 'sung' : i === wordIndex ? 'current' : 'next'}
        />
      ))}
    </Text>
  )
}

function Word({ word, state }: { word: LyricWord; state: 'sung' | 'current' | 'next' }) {
  // 只用颜色区分：已唱过 = 青，当前词 = 黄，未唱 = 默认（不上背景块）
  if (state === 'current') return <Text color={COLOR.warning}>{word.text}</Text>
  return <Text color={state === 'sung' ? COLOR.accent : undefined}>{word.text}</Text>
}

/** 当前逐字高亮位置：最后一个 startMs <= ms 的词；没有逐字时间的行返回 -1 */
function wordIndexAt(words: LyricWord[], ms: number): number {
  let index = -1
  for (let i = 0; i < words.length; i++) {
    const start = words[i].startMs
    if (start == null) continue
    if (start <= ms) index = i
    else break
  }
  return index
}
