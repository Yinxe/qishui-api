/** 底部播放条：状态 + 曲名/歌手 + 进度 + 模式 + 音量 + 来源（每段都可点） */
import { Box, Text } from 'ink'
import { useCore } from '../core/context.js'
import { useUi } from '../ui/context.js'
import { artistNames, barRatio, displayWidth, formatDuration, progressBar, truncate } from '../ui/format.js'
import { Pressable } from '../ui/mouse.js'
import { repeatLabel, shuffleLabel, statusLabel, volumeLabel } from '../ui/playMode.js'
import { toggleTrackLike, trackLiked, trackLikeOf } from '../ui/rowActions.js'
import { COLOR, GUTTER, NO_TRACK_TEXT } from '../ui/theme.js'

/**
 * 曲名/进度条各自的保底宽度：右侧标签先被丢掉，剩下的宽度再按这两个下限收窄。
 * 下限压得很小是故意的——窄终端里宁可曲名只有 4 列，也不能让整条超出实际列宽折行。
 */
const NAME_MIN = 4
const PROGRESS_MIN = 2
/** 出声报错的宽度区间：短到 `NOTE_MIN` 列就宁可不说（见下面 `noteWidth`） */
const NOTE_MIN = 8
const NOTE_MAX = 24

/**
 * 出声报错占几列（0 = 这一帧不说）：最多 `NOTE_MAX`，长句按余量截断；
 * 连 `NOTE_MIN` 都凑不出（还要给曲名/进度条留下保底）就宁可不说——
 * 播放条在定高（`height={rows}`）布局里，折一行会把 HintBar 顶出屏外。
 */
export function noteWidthOf(note: string | undefined, room: number): number {
  if (!note) return 0
  // 末尾那个 `- 1` 是这一格前面的间距（`gap={1}`）：不扣就会在「刚好挤满」时多出一列折行
  const width = Math.min(NOTE_MAX, displayWidth(note), room - NAME_MIN - PROGRESS_MIN - 1)
  return width >= NOTE_MIN ? width : 0
}

interface Segment {
  id: string
  text: string
  /** 追加在段尾的提示（试听标记），用警示色单独显示 */
  warn?: string
  onPress?: () => void
  onWheel?: (delta: number) => void
}

export function PlayerBar() {
  const { core, player, queue, toggle, seekMs, nudgeSeek, nudgeVolume, toggleMute, muted, cycleRepeat, toggleShuffle } =
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
        {/* 报错本来就没认到某一首（起播前就停了）：照样得说一句，但别把它撑成两行 */}
        {player.audioNote ? (
          <Box flexShrink={1}>
            <Text color={COLOR.warning} wrap="truncate-end">
              {` ${player.audioNote}`}
            </Text>
          </Box>
        ) : null}
      </Box>
    )
  }

  /** 点曲名 = 去「听歌」页的正在播放区（原来那页独立播放页已并入）；已在听歌就不动 */
  const openPlayer = (): void => {
    if (ui.route.kind === 'root' && ui.route.root === 'listen') return
    ui.push({ kind: 'root', root: 'listen' })
  }
  /** 点队列计数 = 去「播放队列」页（切/收队列、看当前队列曲目）；这也是队列管理的可点入口 */
  const openQueues = (): void => {
    if (ui.route.kind === 'root' && ui.route.root === 'queues') return
    ui.push({ kind: 'root', root: 'queues' })
  }
  const name = `${track.name}${track.artists?.length ? ` — ${artistNames(track.artists)}` : ''}`
  const volume = Math.round(player.volume * 100)
  const timeText = `${formatDuration(player.positionMs)}/${formatDuration(player.durationMs)}`

  // 优先级从前往后：时间 > 音量 > 喜欢 > 循环 > 随机 > 队列位置。装不下就丢尾巴，不硬挤进度条。
  const like = trackLikeOf(track)
  const segments: Segment[] = [
    { id: 'time', text: timeText, warn: previewing ? '试听' : undefined },
    {
      id: 'volume',
      text: volumeLabel(muted, volume),
      onPress: toggleMute,
      onWheel: (delta) => nudgeVolume(delta * 0.05),
    },
    {
      id: 'like',
      text: trackLiked(core, like) ? '已喜欢' : '喜欢',
      onPress: () => void toggleTrackLike({ ui, core, track: like }),
    },
    { id: 'repeat', text: repeatLabel(player.repeat), onPress: cycleRepeat },
    { id: 'shuffle', text: shuffleLabel(player.shuffle), onPress: toggleShuffle },
    {
      id: 'queue',
      text: `${queue.index + 1}/${queue.items.length}${sourceTag ? ` ${sourceTag}` : ''}`,
      onPress: openQueues,
    },
  ]
  const widthOf = (segment: Segment): number =>
    displayWidth(segment.text) + (segment.warn ? displayWidth(` ${segment.warn}`) : 0)
  // 播放条是侧栏的**兄弟盒**，占满整屏宽度：过去按 `columns − sidebarWidth` 算，白白少用十几列；
  // 更糟的是那个 40 的下限——窄终端里硬撑到 40 列就超过实际列宽，整条折行，
  // 定高（`height={rows}`）布局下 HintBar 会被挤出屏外，看着像「提示行没了」。
  const available = ui.columns
  const chrome = displayWidth(statusText) + GUTTER * 2 + 2
  const widthWith = (list: Segment[]): number => list.reduce((acc, segment) => acc + widthOf(segment) + 1, 0)
  let kept = segments
  // 曲名/进度条都要保住下限，装不下就从尾巴往后丢（尾巴是队列位置，其次随机/循环）
  while (kept.length > 1 && chrome + widthWith(kept) + NAME_MIN + PROGRESS_MIN > available) {
    kept = kept.slice(0, -1)
  }
  const keptWidth = widthWith(kept)
  // 剩下的宽度由曲名和进度条分：先保证曲名至少 NAME_MIN 列，再让总宽一步收进 available
  const room = Math.max(0, available - chrome - keptWidth)
  // 出声失败的那句话（`找不到播放器…` / `这个播放源…`）：以前只在「没有在播曲目」那一支露出来，
  // 而 mpv 起不来时 core 的状态照走、曲名照显——于是「按了播放、进度条在走、一点声音没有」
  // 界面上一句也不说。宽度从「曲名 + 进度条」的余量里切。
  const note = player.audioNote
  const noteWidth = noteWidthOf(note, room)
  const rest = room - noteWidth
  const progressWidth = Math.max(PROGRESS_MIN, Math.min(28, rest - NAME_MIN))
  const nameWidth = Math.max(NAME_MIN, rest - progressWidth)

  return (
    <Box flexShrink={0} paddingX={GUTTER} gap={1}>
      <Pressable flexShrink={0} onPress={() => void toggle()}>
        <Text color={player.status === 'playing' ? COLOR.success : COLOR.muted}>{statusText}</Text>
      </Pressable>
      {note && noteWidth ? (
        <Box flexShrink={0} width={noteWidth}>
          <Text color={COLOR.warning} wrap="truncate-end">
            {truncate(note, noteWidth)}
          </Text>
        </Box>
      ) : null}
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
