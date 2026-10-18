/**
 * 播放页（压栈，任意页 `f` 进来）：**宽屏左右两栏**（左：曲目信息 + 歌词；右：播放队列），
 * **窄屏单栏 + 顶部 tab**（`[歌词] [队列]`，`t` 或点 tab 切换）——窄屏不再把队列藏掉，
 * 而是明确告诉你「还有一栏，按 t 过去」。
 *
 * 为什么从覆盖层改成页面：歌词要逐字高亮、队列要能逐行操作，弹层里两边都挤在中间一小块，
 * 一开菜单就把歌词盖掉。做成页面后两栏各自常驻，操作菜单照旧以覆盖层压在上面。
 *
 * 两侧的行**都能开操作菜单**（`ui/rowActions.ts` 的 `buildTrackActions`）：
 *  - 左栏 `Enter`（或点曲名 / `[操作]`）= 当前这首：详情 / 喜欢 / 评论 / 加入歌单 / 相似歌曲 / 不感兴趣 / 举报；
 *  - 右栏 `Enter`（或点已选中的行）= 队列里那一行，同一份条目，外加「立即播放」「从队列移除」。
 *
 * 歌词是**局部滚动窗口**（`LYRIC_WINDOW` 行，奇数）：正在唱的那句永远落在正中，窗口整体在
 * 剩余高度里垂直居中，上下留白——不把整块剩余高度铺满歌词（那样一句一行铺到底，眼睛跟着跳）。
 *
 * 焦点只有左右两栏（`t` 切换，点哪边就归哪边）：左栏 ↑↓ 翻歌词、`g` 回到跟随播放头；
 * 右栏 ↑↓/gG 挪队列游标。播放键（Space/n/p/s/r/</>/+/-）不在这里绑，走 `App.tsx` 的全局表。
 */
import { Box, type DOMElement, Text } from 'ink'
import type { LyricLine, Lyrics, LyricWord, TrackData } from 'qishui-core'
import { useEffect, useRef, useState } from 'react'
import { useCore } from '../core/context.js'
import { useUi } from '../ui/context.js'
import { artistNames, barRatio, displayWidth, formatDuration, progressBar, truncate } from '../ui/format.js'
import { useKeys } from '../ui/keys.js'
import { contentWidth, listHeight } from '../ui/layout.js'
import { isMouseInput, Pressable, useRowClick, useWheelScroll } from '../ui/mouse.js'
import { repeatLabel, shuffleLabel, statusLabel, volumeLabel } from '../ui/playMode.js'
import { buildQueueTrackActions, buildTrackActions, type TrackLike } from '../ui/rowActions.js'
import { COLOR, CURRENT_PREFIX, GUTTER, NO_TRACK_TEXT } from '../ui/theme.js'
import { EmptyState, PageTitle, useCursor, windowFor } from '../ui/widgets.js'

type Pane = 'info' | 'queue'

/** 两栏布局的最小总宽；比这窄就退成单栏（`t` 在两侧之间切） */
const SPLIT_MIN = 64
/** 队列栏的宽度区间（含左边那条竖线） */
const QUEUE_MIN = 26
const QUEUE_MAX = 44
/**
 * 歌词窗口的行数（奇数）：正在唱的那句落在正中，上下各 `(N-1)/2` 行做上下文。
 * 刻意**不跟着剩余高度长**——剩 20 行就铺 20 行歌词，一句一行、视线要扫一大片；
 * 固定 7 行再整体居中，位置稳定、眼睛不用动。行数不够时再往下缩（见 `lyricRows`）。
 */
const LYRIC_WINDOW = 7

/** 曲目实体只有列表页才有，播放器手里是 `TrackData`：按同一口径拼一个给菜单用 */
function trackLike(data: TrackData): TrackLike {
  return { id: data.id, data, liked: data.state?.isCollected }
}

export function PlayerScreen({ active }: { active: boolean }) {
  const {
    core,
    player,
    queue,
    activeQueue,
    playTracks,
    playQueueIndex,
    removeQueueIndex,
    seekMs,
    nudgeSeek,
    cycleRepeat,
    toggleShuffle,
    toggleMute,
    nudgeVolume,
    muted,
    toggle,
    playNext,
    playPrevious,
  } = useCore()
  const ui = useUi()
  const [pane, setPane] = useState<Pane>('info')
  const [lyrics, setLyrics] = useState<Lyrics | undefined>()
  /** 手动翻词翻到的窗口起点；null = 跟着播放头走 */
  const [pinned, setPinned] = useState<number | null>(null)
  const lyricsRef = useRef<DOMElement>(null)
  const queueRef = useRef<DOMElement>(null)
  const opened = useRef(false)

  const track = player.track

  // 只按「当前曲目 id」重取歌词：player 对象每次进度事件都换新，别让它进依赖
  // biome-ignore lint/correctness/useExhaustiveDependencies: 见上
  useEffect(() => {
    let alive = true
    if (!core || !track) {
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
  }, [core, track?.id])

  // 换曲就回到「跟随播放头」：上一首的手动位置对这首没意义
  // biome-ignore lint/correctness/useExhaustiveDependencies: 同上
  useEffect(() => setPinned(null), [track?.id])

  const { cursor, setCursor } = useCursor(queue.items.length, {
    active: active && pane === 'queue',
    onEnter: (index) => openQueueMenu(index),
  })

  // 进来先把队列游标落在当前播放的那一行（之后播放头自己往前走也不抢游标）
  // biome-ignore lint/correctness/useExhaustiveDependencies: 只在挂载那一刻对一次
  useEffect(() => {
    if (opened.current) return
    opened.current = true
    if (queue.index > 0) setCursor(Math.min(queue.index, Math.max(0, queue.items.length - 1)))
  }, [])

  const state = core?.player.lyricState()
  const activeIndex = state?.index ?? -1
  // 歌词时间轴是整首歌的，试听片段的播放位置要加上片段起点才能对上词
  const songMs = player.positionMs + player.clipStartMs
  const previewing =
    player.clipStartMs > 0 ||
    (!!track?.durationMs && player.durationMs > 0 && player.durationMs < track.durationMs - 1500)

  const totalWidth = contentWidth(ui.columns, ui.sidebarWidth, 0)
  const split = totalWidth >= SPLIT_MIN
  const queueWidth = Math.max(QUEUE_MIN, Math.min(QUEUE_MAX, Math.round(totalWidth * 0.42)))
  // 左栏要扣掉右栏与它左边那条竖线；单栏时整幅都给当前这一侧
  const infoWidth = split ? Math.max(28, totalWidth - queueWidth) : totalWidth

  // 行数：顶栏 1 + 页头 1 + 播放条 1 + 提示行 1（窄屏再多一行 tab），剩下的归两栏
  const bodyRows = listHeight(ui.rows, split ? 4 : 5, 6)
  // 左栏固定行：曲名 / 艺人·专辑 / 进度 / 控制 / 模式 / 空行（宽屏再加一行「歌词 · 跟随播放头」）
  const infoFixed = split ? 7 : 6
  const lyricArea = Math.max(1, bodyRows - infoFixed)
  // 右栏固定 1 行：队列头
  const queueHeight = Math.max(2, bodyRows - 1)

  const lines = lyrics?.lines ?? []
  // 歌词窗口：最多 LYRIC_WINDOW 行，地方不够就缩；保持奇数，正在唱的那句才有一个「正中」
  const lyricRows = Math.max(
    1,
    Math.min(LYRIC_WINDOW, lyricArea) - (Math.min(LYRIC_WINDOW, lyricArea) % 2 === 0 ? 1 : 0),
  )
  const lyricHalf = Math.floor(lyricRows / 2)
  // 窗口整体在剩余高度里居中：上下各留白，不把这块地方铺满
  const lyricPad = Math.max(0, lyricArea - lyricRows)
  const lyricPadTop = Math.floor(lyricPad / 2)
  // 中间那句 = 手动翻到的位置（pinned）或正在唱的那句；窗口起点允许为负（歌刚开头时上面留白）
  const lyricCenter = pinned ?? Math.max(0, activeIndex)
  const lyricStart = lyricCenter - lyricHalf
  const queueWindow = windowFor(queue.items.length, queueHeight, cursor)

  // 滚轮：歌词翻窗口（pin 住居中那句）、队列挪游标
  useWheelScroll(
    lyricsRef,
    (delta) => setPinned(Math.max(0, Math.min(lyricCenter + delta, Math.max(0, lines.length - 1)))),
    split ? true : pane === 'info',
  )
  useWheelScroll(
    queueRef,
    (delta) => {
      takePane('queue')
      setCursor(Math.max(0, Math.min(queue.items.length - 1, cursor + delta)))
    },
    split ? true : pane === 'queue',
  )
  // 点歌词行 = 跳到那一句；点队列行 = 选中并播它
  useRowClick(
    lyricsRef,
    (row) => {
      takePane('info')
      const index = lyricStart + row
      const line = lines[index]
      // 首尾留白那几行不是歌词；界面用的是整首歌的时间轴，跳到某句要减掉试听片段起点；署名行没有时间，点它没反应
      if (!line || line.startMs == null) return
      seekMs(Math.max(0, line.startMs - player.clipStartMs))
    },
    split ? true : pane === 'info',
  )
  useRowClick(
    queueRef,
    (row) => {
      const index = queueWindow.start + row
      if (!queue.items[index]) return
      takePane('queue')
      setCursor(index)
      void playQueueIndex(index)
    },
    split ? true : pane === 'queue',
  )

  /** 鼠标落在哪一栏就把焦点交给它（窄屏单栏时顺便把它切到前台） */
  function takePane(next: Pane): void {
    if (pane !== next) setPane(next)
    if (ui.focus !== 'content') ui.setFocus('content')
  }

  /** 左栏当前这首的操作菜单：详情 / 喜欢 / 评论 / 加入歌单 / 相似歌曲 / 不感兴趣 / 举报 */
  function openCurrentMenu(): void {
    if (!track) {
      ui.toast(NO_TRACK_TEXT, 'info')
      return
    }
    if (!core) {
      ui.toast('core 还没就绪，稍后再试', 'error')
      return
    }
    const entries = buildTrackActions({ ui, core, track: trackLike(track), play: playTracks })
    ui.openOverlay({ kind: 'actions', title: `${track.name} 的操作`, entries })
  }

  /** 右栏某一行的操作菜单：与当前曲目同一份条目，外加「立即播放」「从队列移除」 */
  function openQueueMenu(index: number): void {
    const item = queue.items[index]
    if (!item) return
    if (!core) {
      ui.toast('core 还没就绪，稍后再试', 'error')
      return
    }
    const entries = buildQueueTrackActions({
      ui,
      core,
      track: trackLike(item),
      position: index,
      jump: () => void playQueueIndex(index),
      remove: () => removeQueueIndex(index),
      play: playTracks,
    })
    ui.openOverlay({ kind: 'actions', title: `${item.name} 的操作`, entries })
  }

  /** 点「艺人 · 专辑」行：有专辑进专辑，否则进艺人热歌 */
  function openParent(): void {
    const album = track?.album
    const artist = track?.artists?.[0]
    if (album?.id) ui.push({ kind: 'list', source: { kind: 'album', id: album.id } })
    else if (artist?.id) ui.push({ kind: 'list', source: { kind: 'artist', id: artist.id, tab: 'hot' } })
    else ui.toast('这首歌没有可跳转的专辑或艺人', 'info')
  }

  // `t`：左右栏换焦点（窄屏时等于换栏）；两栏都在听键盘，所以单独挂一条
  useKeys(
    (input) => {
      if (isMouseInput(input)) return
      if (input === 't') setPane((current) => (current === 'info' ? 'queue' : 'info'))
    },
    { isActive: active },
  )

  // 左栏的键：↑↓ 翻词、g 回到跟随、Enter 开当前曲目的操作菜单
  useKeys(
    (input, key) => {
      if (isMouseInput(input)) return
      if (key.upArrow || input === 'k') {
        setPinned(Math.max(0, lyricCenter - 1))
        return
      }
      if (key.downArrow || input === 'j') {
        setPinned(Math.min(Math.max(0, lines.length - 1), lyricCenter + 1))
        return
      }
      if (input === 'g') {
        setPinned(null)
        return
      }
      if (key.return) {
        openCurrentMenu()
      }
    },
    { isActive: active && pane === 'info' },
  )

  const info = split || pane === 'info'
  const showQueue = split || pane === 'queue'

  return (
    <Box flexDirection="column" flexGrow={1}>
      <PageTitle
        title="正在播放"
        subtitle={[
          statusLabel(player.status),
          `队列 ${queue.items.length} 首`,
          pane === 'queue' ? '焦点：队列' : '焦点：歌词',
        ].join('  ·  ')}
      />
      {split ? null : (
        // 窄屏：一屏只放得下一栏，但两栏都在——用 tab 明确摆出来，`t` 或点 tab 换
        <Box flexShrink={0} paddingX={GUTTER} justifyContent="space-between">
          <Box gap={2}>
            <PaneTab label="歌词" active={pane === 'info'} onPress={() => takePane('info')} />
            <PaneTab label="队列" active={pane === 'queue'} onPress={() => takePane('queue')} />
          </Box>
          <Text dimColor wrap="truncate-end">
            {pane === 'info' ? (pinned === null ? '跟随播放头' : '手动翻词（g 回到当前）') : `${queue.items.length} 首`}
          </Text>
        </Box>
      )}
      <Box flexDirection="row" flexGrow={1} overflow="hidden">
        {info ? (
          <Box flexDirection="column" width={infoWidth} paddingX={GUTTER} flexShrink={0}>
            {track ? (
              <>
                <Pressable onPress={openCurrentMenu}>
                  <Text bold color={COLOR.accent} wrap="truncate-end">
                    {truncate(track.name, infoWidth - GUTTER * 2)}
                  </Text>
                </Pressable>
                <Pressable onPress={openParent}>
                  <Text dimColor underline wrap="truncate-end">
                    {truncate(
                      `${artistNames(track.artists)}${track.album?.name ? `  ·  ${track.album.name}` : ''}`,
                      infoWidth - GUTTER * 2,
                    )}
                  </Text>
                </Pressable>
                <Box flexShrink={0}>
                  <Pressable
                    onPress={(col, width) => {
                      if (player.durationMs > 0) seekMs(Math.round(barRatio(col, width) * player.durationMs))
                    }}
                    onWheel={(delta) => nudgeSeek(delta * 5_000)}
                  >
                    <Text color={COLOR.accent}>
                      {progressBar(player.positionMs, player.durationMs, Math.max(10, Math.min(32, infoWidth - 24)))}
                    </Text>
                  </Pressable>
                  <Text dimColor>
                    {' '}
                    {formatDuration(player.positionMs)}/{formatDuration(player.durationMs)}
                  </Text>
                  {previewing ? <Text color={COLOR.warning}> 试听片段</Text> : null}
                </Box>
                <ChipRow
                  width={infoWidth - GUTTER * 2}
                  chips={[
                    { key: 'prev', label: '上一首', onPress: () => void playPrevious() },
                    { key: 'toggle', label: statusLabel(player.status), onPress: () => void toggle() },
                    { key: 'next', label: '下一首', onPress: () => void playNext() },
                  ]}
                />
                {/* 按优先级排：装不下就从尾巴丢 —— `[操作]` 是鼠标开菜单的唯一入口、`音量` 在这页没有别的口子，
                    循环/随机在播放条上还有一份，所以先丢它们 */}
                <ChipRow
                  width={infoWidth - GUTTER * 2}
                  chips={[
                    { key: 'actions', label: '操作', onPress: openCurrentMenu },
                    {
                      key: 'volume',
                      label: volumeLabel(muted, Math.round(player.volume * 100)),
                      onPress: toggleMute,
                      onWheel: (delta) => nudgeVolume(delta * 0.05),
                    },
                    { key: 'repeat', label: repeatLabel(player.repeat), onPress: cycleRepeat },
                    { key: 'shuffle', label: shuffleLabel(player.shuffle), onPress: toggleShuffle },
                  ]}
                />
                <Text> </Text>
                {split ? (
                  <Box flexShrink={0} justifyContent="space-between">
                    <Text bold color={COLOR.accent}>
                      歌词
                    </Text>
                    <Text dimColor>{pinned === null ? '跟随播放头' : '手动翻词（g 回到当前）'}</Text>
                  </Box>
                ) : null}
                {/* 歌词块：上下留白把它压在剩余高度中间（不铺满），窗口本身固定 lyricRows 行 */}
                <Box flexDirection="column" flexShrink={0}>
                  {/* 上方留白：一个 Text 里塞 lyricPadTop 行空格（不逐个建元素，免得一排 key 都是下标） */}
                  {lyricPadTop > 0 ? <Text>{Array.from({ length: lyricPadTop }, () => ' ').join('\n')}</Text> : null}
                  <Box ref={lyricsRef} flexDirection="column">
                    <LyricsView
                      lyrics={lyrics}
                      activeIndex={activeIndex}
                      songMs={songMs}
                      start={lyricStart}
                      height={lyricRows}
                    />
                  </Box>
                </Box>
              </>
            ) : (
              <EmptyState message={NO_TRACK_TEXT} hint="在列表里 Enter 选一首，或去「听歌」页选个模式" />
            )}
          </Box>
        ) : null}
        {showQueue ? (
          <Box
            flexDirection="column"
            width={split ? queueWidth : infoWidth}
            borderStyle={split ? 'single' : undefined}
            borderTop={false}
            borderBottom={false}
            borderRight={false}
            borderColor="gray"
            paddingLeft={GUTTER}
          >
            {/* 右栏头：这份队列是谁的（推荐 / 歌单 / 我喜欢 / 临时）+ 换队列的入口 */}
            <Box flexShrink={0} justifyContent="space-between">
              <Text bold color={COLOR.accent} wrap="truncate-end">
                {activeQueue ? `播放队列 · ${truncate(activeQueue.title, 10)}` : '播放队列'}
              </Text>
              <Chip label="队列" onPress={() => ui.openOverlay({ kind: 'queues' })} />
            </Box>
            <Box ref={queueRef} flexDirection="column">
              {queue.items.length === 0 ? (
                <Text dimColor>队列为空</Text>
              ) : (
                queue.items.slice(queueWindow.start, queueWindow.end).map((item, offset) => {
                  const index = queueWindow.start + offset
                  const playing = index === queue.index
                  const selected = index === cursor
                  return (
                    <Text
                      key={`${item.id}-${index}`}
                      underline={selected}
                      color={selected ? COLOR.accent : playing ? COLOR.success : undefined}
                      dimColor={!selected && !playing}
                      wrap="truncate-end"
                    >
                      {formatQueueRow(item, index, playing, queueWidth - GUTTER * 2 - 1)}
                    </Text>
                  )
                })
              )}
            </Box>
          </Box>
        ) : null}
      </Box>
    </Box>
  )
}

/**
 * 窄屏的栏 tab：选中项 `[歌词]`（accent + 加粗 + 下划线），未选中写 ` 歌词 `（淡显）。
 * 与侧边栏同一套「激活」口径：**方括号 = 当前**，所以没有颜色也能一眼看出在哪一栏；两者都占 6 列，切换不跳。
 */
function PaneTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <Text color={active ? COLOR.accent : undefined} bold={active} underline={active} dimColor={!active}>
        {active ? `[${label}]` : ` ${label} `}
      </Text>
    </Pressable>
  )
}

/** 一个可点的小按钮：`[标签]`（终端里只用 ASCII 方括号，不用图形） */
function Chip({ label, onPress, onWheel }: { label: string; onPress: () => void; onWheel?: (delta: number) => void }) {
  return (
    <Pressable onPress={onPress} onWheel={onWheel}>
      <Text color={COLOR.accent}>{`[${label}]`}</Text>
    </Pressable>
  )
}

interface ChipSpec {
  key: string
  label: string
  onPress: () => void
  onWheel?: (delta: number) => void
}

/**
 * 一排小按钮：**装不下就从尾巴往后丢**（ink 的 Box 默认不换行，溢出的字会画到右栏上去）。
 * 与播放条同一口径：宁可少一个开关，也不让两栏错位。
 */
function ChipRow({ chips, width }: { chips: ChipSpec[]; width: number }) {
  const kept: ChipSpec[] = []
  let used = 0
  for (const chip of chips) {
    const need = displayWidth(`[${chip.label}]`) + (kept.length > 0 ? 1 : 0)
    if (used + need > width) break
    used += need
    kept.push(chip)
  }
  return (
    <Box flexShrink={0} gap={1}>
      {kept.map((chip) => (
        <Chip key={chip.key} label={chip.label} onPress={chip.onPress} onWheel={chip.onWheel} />
      ))}
    </Box>
  )
}

/**
 * 歌词窗口：固定 `height` 行，**正在唱的那句在正中**（`start = 居中句 - height/2`，可以为负）。
 * 起点为负 = 歌刚开头，窗口上面几行是留白；到结尾同理，下面留白 —— 位置永远稳定，不跟着歌头/歌尾跳。
 */
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

/** 队列行：`> 3 曲名 — 艺人`（当前在播的行用 `>` 标，选中行另走反色） */
function formatQueueRow(item: TrackData, index: number, playing: boolean, width: number): string {
  const marker = playing ? CURRENT_PREFIX : ' '
  const head = `${marker}${String(index + 1).padStart(3)} `
  const artist = item.artists?.length ? artistNames(item.artists) : ''
  const tail = artist ? ` — ${artist}` : ''
  const nameWidth = Math.max(6, width - head.length - displayWidth(tail))
  return `${head}${truncate(item.name, nameWidth)}${tail}`
}
