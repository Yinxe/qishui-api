/**
 * 人类可读的格式化：时长、时间、以及各类实体的一行式描述。
 *
 * 这里只吃 core 的 **数据结构**（`TrackData` / `AlbumData` / …），实体（Track/Album/…）先过 `toData()`。
 */
import type { CommentData, Membership, TrackData, UserData } from 'qishui-core'
import { bold, dim, green, idTag, yellow } from './output.js'

/** 实体（有 toJSON）→ 数据结构；本来就是数据就原样返回 */
export function toData<T>(value: T | { toJSON: () => T }): T {
  const node = value as { toJSON?: () => unknown }
  return typeof node.toJSON === 'function' ? (node.toJSON() as T) : (value as T)
}

/* ------------------------------------------------------------ 时间与体积 */

export function duration(ms?: number): string {
  if (!ms || ms < 0) return '--:--'
  return durationLong(ms)
}

export function durationLong(ms: number): string {
  const total = Math.round(ms / 1000)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  const mm = hours > 0 ? String(minutes).padStart(2, '0') : String(minutes)
  return hours > 0 ? `${hours}:${mm}:${String(seconds).padStart(2, '0')}` : `${mm}:${String(seconds).padStart(2, '0')}`
}

/** 曲目总时长（播放队列/歌单汇总用） */
export function totalDuration(ms: number): string {
  const total = Math.round(ms / 1000)
  if (total < 3600) return `${Math.floor(total / 60)} 分钟`
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  return `${hours} 小时 ${minutes} 分`
}

/** unix 秒 → `2026-10-17` */
export function day(unixSec?: number): string | undefined {
  if (!unixSec) return undefined
  return new Date(unixSec * 1000).toISOString().slice(0, 10)
}

/** unix 秒 → `3 天前` / `2026-10-17` */
export function ago(unixSec?: number): string | undefined {
  if (!unixSec) return undefined
  const diff = Date.now() - unixSec * 1000
  if (diff < 60_000) return '刚刚'
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)} 分钟前`
  if (diff < 86_400_000) return `${Math.floor(diff / 3600_000)} 小时前`
  if (diff < 30 * 86_400_000) return `${Math.floor(diff / 86_400_000)} 天前`
  return day(unixSec)
}

export function count(n?: number): string {
  if (n === undefined) return '-'
  if (n < 10_000) return String(n)
  if (n < 100_000_000) return `${(n / 10_000).toFixed(n < 100_000 ? 1 : 0)} 万`
  return `${(n / 100_000_000).toFixed(1)} 亿`
}

/* ------------------------------------------------------------ 一行式描述 */

/**
 * 一行式描述的统一骨架（所有 `*Line()` 都照这个来）：
 *
 * ```text
 * [序号.] 标题 — 副标题  元信息  标记  id
 * ```
 *
 * - 副标题用灰 `—` 连接（歌手/作者这类"隶属"信息）；
 * - 元信息、标记、id 之间固定两个空格；
 * - id 在最后（`--no-id` 关掉），方便直接 `qishui play <id>` 接着用。
 */
export function tailParts(...parts: (string | undefined)[]): string {
  const kept = parts.filter((part): part is string => !!part)
  return kept.length ? '  ' + kept.join('  ') : ''
}

export function trackTitle(track: TrackData): string {
  return track.name || `(无标题 ${track.id})`
}

export function trackArtists(track: TrackData): string {
  const names = (track.artists ?? []).map((a) => a?.name).filter((n): n is string => !!n)
  return names.length ? names.join(' / ') : '未知歌手'
}

export function userLine(userOrEntity: UserData | { toJSON: () => UserData }, opts: { index?: number } = {}): string {
  const user = toData(userOrEntity)
  const prefix = opts.index !== undefined ? dim(String(opts.index).padStart(2) + '.') + ' ' : ''
  const marks: string[] = []
  if (user.isVip) marks.push(yellow('VIP'))
  if (user.isMusician) marks.push(dim('音乐人'))
  const stats = user.stats
  return (
    `${prefix}${user.nickname || user.id}` +
    tailParts(
      marks.join(' '),
      stats
        ? dim(`${count(stats.liked)} 喜欢 · ${count(stats.followers)} 粉丝 · ${count(stats.following)} 关注`)
        : undefined,
      idTag(user.id),
    )
  )
}

export function commentLine(
  commentOrEntity: CommentData | { toJSON: () => CommentData },
  opts: { index?: number; time?: string } = {},
): string {
  const comment = toData(commentOrEntity)
  const prefix = opts.index !== undefined ? dim(String(opts.index).padStart(2) + '.') + ' ' : ''
  const who = comment.user?.nickname ?? '匿名'
  const when = opts.time ?? ago(comment.createdAt) ?? ''
  const marks = [
    comment.liked ? green('已赞') : '',
    comment.countDigged ? dim(`♥ ${comment.countDigged}`) : '',
    comment.countReply ? dim(`↩ ${comment.countReply}`) : '',
  ].filter(Boolean)
  return (
    `${prefix}${bold(who)} ${dim(when)}` +
    tailParts(marks.join(' '), idTag(comment.id)) +
    '\n' +
    `     ${comment.content}`
  )
}

/** 会员态一行摘要（whoami / membership 用） */
export function membershipLine(membership: Membership): string {
  if (!membership.isVip) return `${yellow('免费账号')} ${dim('（音质/下载权益未开通）')}`
  const parts = [`${yellow('VIP')} ${membership.vipStage ?? ''}`.trim()]
  if (membership.vipExpireAt) parts.push(dim(`到期 ${day(membership.vipExpireAt)}`))
  if (membership.hasLosslessEntitlement) parts.push(green('无损'))
  if (membership.autoRenew) parts.push(dim('自动续费'))
  return parts.join('  ')
}
