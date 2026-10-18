/**
 * 播放模式/状态的中文标签：播放条与「正在播放」弹层共用一套写法，免得两边漂移。
 * 一律 ASCII 冒号 + 汉字，不用 `↻` `⇉` `🔊` 这类图形（见 ui/theme.ts 的符号词表）。
 */

const STATUS_LABEL: Record<string, string> = {
  idle: '待播',
  loading: '载入',
  playing: '播放',
  paused: '暂停',
  stopped: '停止',
  error: '出错',
}

const REPEAT_LABEL: Record<string, string> = { off: '关', all: '全', one: '单' }

export function statusLabel(status: string): string {
  return STATUS_LABEL[status] ?? STATUS_LABEL.idle
}

export function repeatLabel(mode: string): string {
  return `循环:${REPEAT_LABEL[mode] ?? '关'}`
}

export function shuffleLabel(on: boolean): string {
  return `随机:${on ? '开' : '关'}`
}

export function volumeLabel(muted: boolean, volume: number): string {
  return muted ? '静音' : `音量:${volume}`
}
