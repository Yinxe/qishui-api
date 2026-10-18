/**
 * 分享链接 / 裸 ID → 该落到 TUI 的哪一页。
 *
 * 纯函数，不碰网络：解析本身走 core 的 `link.parse`（纯字符串）或 `link.resolve`（短链才跟一次重定向），
 * 这里只判断「输入像不像分享物」和「条目类型映射到哪个路由」，方便单测。
 *
 * 为什么要有这一层：搜索框是用户手里唯一能粘贴的地方，粘一条 App/微信分享链接进去，
 * 以前会被当关键词搜（搜不到，还白问一次联想）。现在直接打开对应的曲目/歌单/专辑/艺人/用户页。
 */
import type { Route } from './types.js'

/** 只要 `{kind, id}`，不依赖 qishui-api 的类型（TUI 只依赖 core） */
export interface ShareRef {
  kind: string
  id: string
}

/** 像分享物才值得问 core：完整 URL，或 10~20 位裸 ID（裸 ID 按 track 处理，与 CLI 的 `link` 同口径） */
export function looksLikeShareInput(text: string): boolean {
  const raw = text.trim()
  if (!raw) return false
  return /^https?:\/\//i.test(raw) || /^\d{10,20}$/.test(raw)
}

export type ShareTarget = { route: Route } | { note: string }

/**
 * 条目类型 → 路由。能打开的都给路由，打不开的给一句人话（别静默什么都不做）。
 *
 * `radio` / `podcast` / `video` / `ugc_video` 在 TUI 里没有对应页面：
 * 视频/播客要播放器支持，TUI 只出声不出画，所以照实说，并指路 CLI。
 */
export function shareTarget(item: ShareRef): ShareTarget {
  switch (item.kind) {
    case 'track':
      return { route: { kind: 'track', id: item.id } }
    case 'playlist':
      return { route: { kind: 'list', source: { kind: 'playlist', id: item.id } } }
    case 'album':
      return { route: { kind: 'list', source: { kind: 'album', id: item.id } } }
    case 'artist':
      return { route: { kind: 'list', source: { kind: 'artist', id: item.id, tab: 'hot' } } }
    case 'user':
      return { route: { kind: 'user', id: item.id } }
    default:
      return { note: `分享的是「${item.kind}」，TUI 里没有这一页；qishui link 能看它的详情` }
  }
}
