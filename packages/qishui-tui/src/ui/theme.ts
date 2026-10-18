/**
 * 颜色与度量 token：全 App 一处口径，别在各屏裸写 'cyan'/'green'。
 * muted/次要文字仍统一走 <Text dimColor>（那是 ink 的渲染开关，不是颜色串，故不进 token）。
 */
export const COLOR = {
  /** 强调 / 选中 / 标题 / 当前高亮主色 */
  accent: 'cyan',
  /** 成功 / 正在播放的曲目 / 确认 */
  success: 'green',
  /** 错误 / 危险操作 */
  danger: 'red',
  /** 提示 / 键位 token / 预览 */
  warning: 'yellow',
} as const

/** 内容左右留白（格子数）——各屏 paddingX 用它，别散写 1 */
export const GUTTER = 1

/**
 * 符号词表：界面只用 ASCII + 汉字，不掺表情符号和装饰图形（⏸ 🔊 ♥ ★ ▍ 这类）。
 * 理由不是审美——同一码位在 emoji 呈现/中文字体下常占 2 格，`displayWidth` 估不准，
 * 播放条与列表列会跟着错位；纯字符怎么都只占 1 格。
 * （进度条的 ━●─ 是例外：它本身就是终端图形，且每格只画它一个字符。）
 */

/** 选中行前缀；与 inverse 一起构成「被选中」的统一样子 */
export const SELECT_PREFIX = '>'

/** 当前在播行前缀（列表页/队列/歌词共用） */
export const CURRENT_PREFIX = '>'

/** 错误前缀（顶栏徽标与错误态共用） */
export const ERROR_PREFIX = 'x'

/** 「没有在播的曲目」文案：播放条与正在播放弹层共用一处 */
export const NO_TRACK_TEXT = '没有在播的曲目'
