/**
 * 设置页「缓存」那一段的文案：统计数字与校验结果怎么落成人话。
 *
 * 单独一层是为了能离线单测（`test/cacheView.test.ts`），也免得页面里散着拼字符串——
 * 口径只有一处：**所有体积都是磁盘上的真实字节**（core 的 `MediaStats` 已经按文件拆好），
 * 界面不再自己拿 meta 自报的 `audio.bytes` 相加。
 */
import {
  formatBytes,
  type MediaCapacity,
  type MediaStats,
  mediaCapacityLabel,
  type VerifyIssue,
  type VerifyReport,
} from 'qishui-core'

/** `core.cacheStats()` 的形状（只取设置页用到的三段） */
export interface CacheOverview {
  entities: { entries: number; bytes: number; hits: number; misses: number }
  media: MediaStats
  capacity: MediaCapacity
}

export function entityNote(stats: CacheOverview['entities']): string {
  return `${stats.entries} 项 · ${formatBytes(stats.bytes)} · 命中 ${stats.hits} / 未中 ${stats.misses}`
}

/** 媒体缓存一句话：多少首、真实占多少、其中多少只是试听 */
export function mediaNote(stats: MediaStats): string {
  const clip = stats.clips > 0 ? ` · 试听 ${stats.clips} 首` : ''
  return `${stats.tracks} 首 · 真实占用 ${formatBytes(stats.diskBytes)}${clip}`
}

/** 占用拆到四类文件：加起来正好等于 `diskBytes - residueBytes` */
export function breakdownNote(stats: MediaStats): string {
  return [
    `音频 ${formatBytes(stats.audioBytes)}`,
    `封面 ${formatBytes(stats.coverBytes)}`,
    `歌词 ${formatBytes(stats.lyricsBytes)}`,
    `记录 ${formatBytes(stats.metaBytes)}`,
  ].join(' · ')
}

/** 残留：`.part`、孤儿目录这类「不是歌」的东西 */
export function residueNote(stats: MediaStats): string {
  const bits: string[] = []
  if (stats.pendingParts > 0) bits.push(`${stats.pendingParts} 个未完成的 .part`)
  if (stats.orphanDirs > 0) bits.push(`${stats.orphanDirs} 个没有记录的目录`)
  const tail = bits.length ? `（${bits.join(' · ')}）` : ''
  return `${formatBytes(stats.residueBytes)}${tail}`
}

/** 待重下：音频缺失/为空/大小对不上的（试听片段不算——它每次播放都要向上游复核） */
export function incompleteNote(stats: MediaStats): string {
  return stats.incomplete > 0 ? `${stats.incomplete} 首（大小对不上，下次播放会重下）` : '音频都在，没有要重下的'
}

/** 容量：已用 / 上限（档位名 + 百分比）；不限制就直说，超了把超出量也写出来 */
export function capacityNote(capacity: MediaCapacity): string {
  const { usedBytes, limitBytes, percent, overLimit } = capacity
  const label = mediaCapacityLabel(limitBytes)
  const limit =
    limitBytes === 0 ? '不限制' : `${label === '自定义' ? formatBytes(limitBytes) : label}（${percent ?? 0}%）`
  const base = `已用 ${formatBytes(usedBytes)} / ${limit}`
  return overLimit ? `${base} · 超 ${formatBytes(usedBytes - limitBytes)}` : base
}

/** 校验结果第一行：检查了多少、几错几提醒、几项能修 */
export function verifyHeadline(report: VerifyReport): string {
  if (report.issues.length === 0) return `检查 ${report.checked} 个目录 · 没发现问题`
  const { errors, warnings, infos, fixable } = report.summary
  return `检查 ${report.checked} 个目录：错误 ${errors} · 提醒 ${warnings} · 提示 ${infos} · 可修 ${fixable}`
}

/**
 * 校验结果第二行：**把「试听片段」与「旧版记录」讲清楚**——这两个数最容易让人以为缓存坏了，
 * 其实前者本来就不是整曲、后者下次播放会自动重取。
 */
export function verifyDetail(report: VerifyReport): string {
  const bits: string[] = []
  if (report.clips > 0) bits.push(`试听片段 ${report.clips} 首（本来就比整曲短）`)
  if (report.staleMeta > 0) bits.push(`旧版记录 ${report.staleMeta} 首（下次播放会重取）`)
  bits.push(report.deep ? '已算 sha1' : '未算 sha1（深度校验才查内容）')
  bits.push(`用时 ${(report.elapsedMs / 1000).toFixed(1)}s`)
  return bits.join(' · ')
}

const SEVERITY_LABEL = { error: '错误', warn: '提醒', info: '提示' } as const

/** 一条问题的标题：`错误 曲名`（没曲名就用 id） */
export function issueLabel(issue: VerifyIssue): string {
  return `${SEVERITY_LABEL[issue.severity]} ${issue.name || issue.trackId}`
}

/** 一条问题的说明：正文 + id（有曲名时才补 id，方便回查） */
export function issueNote(issue: VerifyIssue): string {
  return issue.name ? `${issue.issue} · ${issue.trackId}` : issue.issue
}

/** 「修复」那一行：有多少能修、修的是什么 */
export function fixNote(report: VerifyReport | undefined): string {
  if (!report) return '先跑一次校验'
  const { fixable } = report.summary
  if (fixable === 0) return '没有可修项'
  return `${fixable} 项可修（只改记录，不删能播的音频；缺音频的目录才删）`
}
