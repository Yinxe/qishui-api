/** 底部播放条：状态 + 曲名/歌手 + 进度 + 模式 + 音量 + 来源（每段都可点） */
import { Box, Text } from 'ink'
import { useCore } from '../core/context.js'
import { useUi } from '../ui/context.js'
import { artistNames, barRatio, displayWidth, formatDuration, progressBar, truncate } from '../ui/format.js'
import { Pressable } from '../ui/mouse.js'
import { repeatLabel, shuffleLabel, statusLabel, volumeLabel } from '../ui/playMode.js'
import { COLOR, GUTTER, NO_TRACK_TEXT } from '../ui/theme.js'

/** 曲名/进度条各自的保底宽度：右侧标签装不下就从尾巴往后丢（时间与音量始终保底） */
const NAME_MIN = 12
const PROGRESS_MIN = 8

interface Segment {
  id: string
  text: string
  /** 追加在段尾的提示（试听标记），用警示色单独显示 */
  warn?: string
  onPress?: () => void
  onWheel?: (delta: number) => void
}

export function PlayerBar() {
  const { player, queue, toggle, seekMs, nudgeSeek, nudgeVolume, toggleMute, muted, cycleRepeat, toggleShuffle } =
    useCore()
  const ui = useUi()
  const track = player.track
  const statusText = statusLabel(player.status)
  // `本地` = 媒体缓存里的文件；`文件` = 用户自己磁盘上的（本地库）；`在线` = 只是签名地址
  const sourceTag =
    player.sourceKind === 'cache'
      ? '本地'
      : player.sourceKind === 'local'
        ? '文件'
        : player.sourceKind === 'remote'
          ? '在线'
          : ''
  const previewing =
    player.clipStartMs > 0 ||
    (!!track?.durationMs && player.durationMs > 0 && player.durationMs < track.durationMs - 1500)

  if (!track) {
    return (
      <Box flexShrink={0} paddingX={GUTTER} gap={1}>
        <Text dimColor wrap="truncate-end">
          {NO_TRACK_TEXT}
        </Text>
        {player.audioNote ? <Text color={COLOR.warning}> {player.audioNote}</Text> : null}
      </Box>
    )
  }

  /** 点曲名 / 队列计数 = 进播放页（左栏曲目信息 + 歌词，右栏队列）；已在播放页就退回原页 */
  const openPlayer = (): void => {
    if (ui.route.kind === 'player') ui.pop()
    else ui.push({ kind: 'player' })
  }
  const name = `${track.name}${track.artists?.length ? ` — ${artistNames(track.artists)}` : ''}`
  const volume = Math.round(player.volume * 100)
  const timeText = `${formatDuration(player.positionMs)}/${formatDuration(player.durationMs)}`

  // 优先级从前往后：时间 > 音量 > 循环 > 随机 > 队列位置。装不下就丢尾巴，不硬挤进度条。
  const segments: Segment[] = [
    { id: 'time', text: timeText, warn: previewing ? '试听' : undefined },
    {
      id: 'volume',
      text: volumeLabel(muted, volume),
      onPress: toggleMute,
      onWheel: (delta) => nudgeVolume(delta * 0.05),
    },
    { id: 'repeat', text: repeatLabel(player.repeat), onPress: cycleRepeat },
    { id: 'shuffle', text: shuffleLabel(player.shuffle), onPress: toggleShuffle },
    {
      id: 'queue',
      text: `${queue.index + 1}/${queue.items.length}${sourceTag ? ` ${sourceTag}` : ''}`,
      onPress: openPlayer,
    },
  ]
  const widthOf = (segment: Segment): number =>
    displayWidth(segment.text) + (segment.warn ? displayWidth(` ${segment.warn}`) : 0)
  // 可用宽度 = 终端列宽 − 侧栏；每段自带 1 格间距（keptWidth 里算），曲名与进度条之间还有 2 格
  const available = Math.max(40, ui.columns - ui.sidebarWidth)
  const chrome = displayWidth(statusText) + GUTTER * 2 + 2
  const widthWith = (list: Segment[]): number => list.reduce((acc, segment) => acc + widthOf(segment) + 1, 0)
  let kept = segments
  // 曲名/进度条都要保住下限，装不下就从尾巴往后丢（尾巴是队列位置，其次随机/循环）
  while (kept.length > 2 && chrome + widthWith(kept) + NAME_MIN + PROGRESS_MIN > available) {
    kept = kept.slice(0, -1)
  }
  const keptWidth = widthWith(kept)
  const progressWidth = Math.max(PROGRESS_MIN, Math.min(28, available - chrome - keptWidth - NAME_MIN))
  const nameWidth = Math.max(NAME_MIN, available - chrome - keptWidth - progressWidth)

  return (
    <Box flexShrink={0} paddingX={GUTTER} gap={1}>
      <Pressable flexShrink={0} onPress={() => void toggle()}>
        <Text color={player.status === 'playing' ? COLOR.success : 'gray'}>{statusText}</Text>
      </Pressable>
      <Pressable flexShrink={1} onPress={openPlayer}>
        <Text wrap="truncate-end">{truncate(name, nameWidth)}</Text>
      </Pressable>
      {/* 进度条单独占一个盒子：`barRatio` 反过来算比例时，这一格必须只有进度条本身 */}
      <Pressable
        flexShrink={0}
        onPress={(col, width) => {
          if (player.durationMs > 0) seekMs(Math.round(barRatio(col, width) * player.durationMs))
        }}
        onWheel={(delta) => nudgeSeek(delta * 5_000)}
      >
        <Text color={COLOR.accent}>{progressBar(player.positionMs, player.durationMs, progressWidth)}</Text>
      </Pressable>
      {kept.map((segment) => (
        <Pressable key={segment.id} flexShrink={0} onPress={segment.onPress} onWheel={segment.onWheel}>
          <Text dimColor>{segment.text}</Text>
          {segment.warn ? <Text color={COLOR.warning}> {segment.warn}</Text> : null}
        </Pressable>
      ))}
    </Box>
  )
}
