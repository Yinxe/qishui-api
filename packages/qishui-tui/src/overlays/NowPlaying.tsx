/** 正在播放（覆盖层）：歌词 / 队列 + 控制 */
import { Box, type DOMElement, Text } from 'ink'
import type { LyricLine, Lyrics, LyricWord } from 'qishui-core'
import { useEffect, useRef, useState } from 'react'
import { useCore } from '../core/context.js'
import { useUi } from '../ui/context.js'
import { artistNames, barRatio, formatDuration, progressBar, truncate } from '../ui/format.js'
import { useKeys } from '../ui/keys.js'
import { contentWidth } from '../ui/layout.js'
import { isMouseInput, Pressable, useRowClick, useWheelScroll } from '../ui/mouse.js'
import { repeatLabel, shuffleLabel, volumeLabel } from '../ui/playMode.js'
import { COLOR, CURRENT_PREFIX, NO_TRACK_TEXT } from '../ui/theme.js'
import { EmptyState, Modal } from '../ui/widgets.js'

/** 歌词/队列各画多少行（点击与滚轮都按这个窗口换算） */
const LYRIC_WINDOW = 7
const QUEUE_WINDOW = 9

export function NowPlayingOverlay() {
  const {
    core,
    player,
    queue,
    seekMs,
    nudgeSeek,
    playQueueIndex,
    cycleRepeat,
    toggleShuffle,
    toggleMute,
    nudgeVolume,
    muted,
  } = useCore()
  const ui = useUi()
  const [view, setView] = useState<'lyrics' | 'queue'>('lyrics')
  const [lyrics, setLyrics] = useState<Lyrics | undefined>()
  /** 滚轮翻到的窗口起点；null = 跟着播放头走 */
  const [pinned, setPinned] = useState<number | null>(null)
  const bodyRef = useRef<DOMElement>(null)

  // biome-ignore lint/correctness/useExhaustiveDependencies: 只按“当前曲目 id”重取歌词，player 对象本身每次进度事件都变
  useEffect(() => {
    let alive = true
    if (!core || !player.track) {
      setLyrics(undefined)
      return
    }
    core.player
      .lyricsFor()
      .then((loaded) => {
        if (alive) setLyrics(loaded)
      })
      .catch(() => {
        if (alive) setLyrics(undefined)
      })
    return () => {
      alive = false
    }
  }, [core, player.track?.id])

  // biome-ignore lint/correctness/useExhaustiveDependencies: 手动翻词是临时状态，换曲/切视图就回到跟随播放头
  useEffect(() => setPinned(null), [view, player.track?.id])

  useKeys(
    (input) => {
      if (isMouseInput(input)) return
      if (input === 't') setView((v) => (v === 'lyrics' ? 'queue' : 'lyrics'))
    },
    { isActive: true },
  )

  const state = core?.player.lyricState()
  const activeIndex = state?.index ?? -1
  // 歌词时间轴是整首歌的，试听片段的播放位置要加上片段起点才能对上词
  const songMs = player.positionMs + player.clipStartMs
  const track = player.track
  const barWidth = Math.max(10, Math.min(40, ui.columns - ui.sidebarWidth - 24))
  const previewing =
    player.clipStartMs > 0 ||
    (!!track?.durationMs && player.durationMs > 0 && player.durationMs < track.durationMs - 1500)

  const lines = lyrics?.lines ?? []
  const size = view === 'lyrics' ? LYRIC_WINDOW : QUEUE_WINDOW
  const total = view === 'lyrics' ? lines.length : queue.items.length
  const head = view === 'lyrics' ? activeIndex : queue.index
  const maxStart = Math.max(0, total - size)
  const autoStart = Math.max(0, Math.min(head - Math.floor(size / 2), maxStart))
  const start = pinned === null ? autoStart : Math.min(Math.max(pinned, 0), maxStart)

  useWheelScroll(bodyRef, (delta) => setPinned(Math.max(0, Math.min(start + delta, maxStart))))
  useRowClick(bodyRef, (row) => {
    const index = start + row
    if (index >= total) return
    if (view === 'lyrics') {
      // 界面用的是整首歌的时间轴，跳到某句要减掉试听片段起点；署名行没有时间，点它没反应
      const line = lines[index]
      if (line?.startMs == null) return
      seekMs(Math.max(0, line.startMs - player.clipStartMs))
      return
    }
    void playQueueIndex(index)
  })

  /** 点「艺人 · 专辑」行：等价列表页的 `o`（有专辑进专辑，否则进艺人热歌） */
  function openParent(): void {
    const album = track?.album
    const artist = track?.artists?.[0]
    if (album?.id) ui.push({ kind: 'list', source: { kind: 'album', id: album.id } })
    else if (artist?.id) ui.push({ kind: 'list', source: { kind: 'artist', id: artist.id, tab: 'hot' } })
    else ui.toast('这首歌没有可跳转的专辑或艺人', 'info')
  }

  return (
    <Modal
      title="正在播放"
      footer="Space 播放/暂停  n/p 上下首  s 随机  r 循环  ←/→ </> 快进  +/- 音量  t 歌词/队列  Esc 关闭 | 点进度条定位 / 点歌词跳句 / 点队列播它 / 滚轮翻词"
      width={contentWidth(ui.columns, ui.sidebarWidth, 4)}
    >
      {track ? (
        <>
          <Text bold color={COLOR.accent} wrap="truncate-end">
            {track.name}
          </Text>
          <Pressable onPress={openParent}>
            <Text dimColor underline wrap="truncate-end">
              {artistNames(track.artists)}
              {track.album?.name ? `  ·  ${track.album.name}` : ''}
            </Text>
          </Pressable>
          <Box marginTop={1}>
            <Pressable
              onPress={(col, width) => {
                if (player.durationMs > 0) seekMs(Math.round(barRatio(col, width) * player.durationMs))
              }}
              onWheel={(delta) => nudgeSeek(delta * 5_000)}
            >
              <Text color={COLOR.accent}>{progressBar(player.positionMs, player.durationMs, barWidth)}</Text>
            </Pressable>
            <Text dimColor>
              {' '}
              {formatDuration(player.positionMs)}/{formatDuration(player.durationMs)}
            </Text>
            {previewing ? <Text color={COLOR.warning}> 试听片段</Text> : null}
          </Box>
          <Box marginTop={1} gap={1}>
            <Pressable onPress={cycleRepeat}>
              <Text dimColor>{repeatLabel(player.repeat)}</Text>
            </Pressable>
            <Pressable onPress={toggleShuffle}>
              <Text dimColor>{shuffleLabel(player.shuffle)}</Text>
            </Pressable>
            <Pressable onPress={toggleMute} onWheel={(delta) => nudgeVolume(delta * 0.05)}>
              <Text dimColor>{volumeLabel(muted, Math.round(player.volume * 100))}</Text>
            </Pressable>
            <Text dimColor>{`${queue.index + 1}/${queue.items.length}`}</Text>
          </Box>
          <Box marginTop={1} gap={1}>
            <Pressable onPress={() => setView('lyrics')}>
              <Text color={view === 'lyrics' ? COLOR.accent : undefined} dimColor={view !== 'lyrics'}>
                [歌词]
              </Text>
            </Pressable>
            <Pressable onPress={() => setView('queue')}>
              <Text color={view === 'queue' ? COLOR.accent : undefined} dimColor={view !== 'queue'}>
                {`[队列 ${queue.items.length}]`}
              </Text>
            </Pressable>
          </Box>
          <Box ref={bodyRef} marginTop={1} flexDirection="column">
            {view === 'lyrics' ? (
              <LyricsView lyrics={lyrics} activeIndex={activeIndex} songMs={songMs} start={start} />
            ) : (
              <Queue items={queue.items} index={queue.index} start={start} />
            )}
          </Box>
        </>
      ) : (
        <EmptyState message={NO_TRACK_TEXT} />
      )}
    </Modal>
  )
}

function LyricsView({
  lyrics,
  activeIndex,
  songMs,
  start,
}: {
  lyrics: Lyrics | undefined
  activeIndex: number
  songMs: number
  start: number
}) {
  const lines = lyrics?.lines ?? []
  if (lines.length === 0) return <Text dimColor>（没有歌词 / 还没解析出来）</Text>
  const window = lines.slice(start, start + LYRIC_WINDOW)
  return (
    <Box flexDirection="column">
      {window.map((line, offset) => {
        const index = start + offset
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

function Queue({
  items,
  index,
  start,
}: {
  items: { id: string; name: string; artists?: { name: string }[] }[]
  index: number
  start: number
}) {
  if (items.length === 0) return <Text dimColor>队列为空</Text>
  const window = items.slice(start, start + QUEUE_WINDOW)
  return (
    <Box flexDirection="column">
      {window.map((item, offset) => {
        const row = start + offset
        const active = row === index
        return (
          <Text
            key={`${item.id}-${row}`}
            color={active ? COLOR.accent : undefined}
            dimColor={!active}
            wrap="truncate-end"
          >
            {`${active ? CURRENT_PREFIX : ' '} ${String(row + 1).padStart(3)} ${truncate(item.name, 40)}${
              item.artists?.length ? ` — ${truncate(artistNames(item.artists), 20)}` : ''
            }`}
          </Text>
        )
      })}
    </Box>
  )
}
