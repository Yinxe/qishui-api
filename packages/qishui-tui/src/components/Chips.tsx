/** 一排可点的小按钮：终端里只用 ASCII 方括号 `[标签]`，不用图形字符 */
import { Box, Text } from 'ink'
import { displayWidth } from '../ui/format.js'
import { Pressable } from '../ui/mouse.js'
import { COLOR } from '../ui/theme.js'

export function Chip({
  label,
  active,
  onPress,
  onWheel,
}: {
  label: string
  /** 高亮当前档（例如选中的听歌模式） */
  active?: boolean
  onPress: () => void
  onWheel?: (delta: number) => void
}) {
  return (
    <Pressable onPress={onPress} onWheel={onWheel}>
      <Text color={COLOR.accent} bold={active} underline={active} dimColor={active === false}>
        {`[${label}]`}
      </Text>
    </Pressable>
  )
}

export interface ChipSpec {
  key: string
  label: string
  active?: boolean
  onPress: () => void
  onWheel?: (delta: number) => void
}

/**
 * 一排小按钮：**装不下就从尾巴往后丢**（ink 的 Box 默认不换行，溢出的字会画到别处）。
 * 与播放条同一口径：宁可少一个开关，也不让布局错位。
 *
 * `cursor` 给某个 chip 的 `key` 时，那一格按键盘选中高亮（`Enter` 按到它）。开关常常排成两行，
 * 用 key 而不是「第几个」——切片之后每行的下标各算各的，只有 key 能跨行对上同一个游标。
 * 被宽度丢掉的那一格，游标仍停在它的 key 上（`Enter` 照样按得到），只是这一行画不出来。
 */
export function ChipRow({ chips, width, cursor }: { chips: ChipSpec[]; width: number; cursor?: string }) {
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
        <Chip
          key={chip.key}
          label={chip.label}
          active={cursor === undefined ? chip.active : cursor === chip.key}
          onPress={chip.onPress}
          onWheel={chip.onWheel}
        />
      ))}
    </Box>
  )
}
