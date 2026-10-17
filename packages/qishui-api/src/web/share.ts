import { getImageUrl, type ImageResource } from './image.js'
import { QishuiError } from '../errors.js'
import type { Client } from '../client.js'

/** 分享链接的条目类型；官方 path 段就是这个词，未知形态原样透传 */
export type ShareKind =
  | 'track'
  | 'album'
  | 'playlist'
  | 'video'
  | 'ugc_video'
  | 'user'
  | 'radio'
  | 'podcast'
  | (string & {})

export interface ShareItem {
  kind: ShareKind
  id: string
}

const NUM_ID = /^\d{10,20}$/

/**
 * 纯字符串解析，不发请求。支持：
 *   https://music.douyin.com/qishui/share/track?track_id=…
 *   https://music.douyin.com/qishui/share/ugc_video?ugc_video_id=…&hybrid_sdk_version=bullet&…
 *   https://www.qishui.com/share/track?track_id=…
 *   以及裸 ID（按 track 处理）
 * 短链 https://qishui.douyin.com/s/XXXX/ 解析不出 ID，要走 resolveShareLink。
 *
 * 找 ID 不靠硬编码映射表：先按 `<kind>_id`，再退到「任意以 `_id` 结尾且值是数字」，最后 `item_id`/`id`。
 * exact 优先是必要的——`/share/track` 的链接上常挂着 comment_id、user_id 之类的旁支 ID。
 */
export function parseShareLink(input: string): ShareItem | undefined {
  const raw = input.trim()
  if (NUM_ID.test(raw)) return { kind: 'track', id: raw }

  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return undefined
  }

  const kind = url.pathname.match(/\/share\/([a-zA-Z_]+)/)?.[1]?.toLowerCase()
  const params = [...url.searchParams.entries()]
  const idHit = (predicate: (key: string) => boolean) => params.find(([k, v]) => predicate(k) && NUM_ID.test(v))

  if (kind) {
    // 精确键存在就只认它：值为空或不是数字时宁可不返回，也不能让旁支 ID 顶上来——
    // `/share/album?album_id=&comment_id=…` 会把评论 ID 误报成专辑 ID
    const exact = params.find(([k]) => k === `${kind}_id`)
    if (exact) return NUM_ID.test(exact[1]) ? { kind, id: exact[1] } : undefined
    const hit = idHit((k) => /_id$/.test(k)) ?? idHit((k) => k === 'item_id' || k === 'id')
    return hit ? { kind, id: hit[1] } : undefined
  }

  // 少数形态没有 /share/<kind>，只带某个 *_id
  const loose = idHit((k) => /_id$/.test(k) || k === 'item_id' || k === 'id')
  return loose ? { kind: loose[0].replace(/_id$/, '').replace(/^id$/, 'track'), id: loose[1] } : undefined
}

export interface ResolveOptions {
  fetchImpl?: typeof fetch
  /** 最多跟几跳；抖音短链实测一跳 */
  maxHops?: number
}

/**
 * 把任意形态的分享链接归一化成 { kind, id }。
 * 已经是 ID 或完整链接时不发请求；只有 /s/<code> 短链才跟重定向，
 * 且只读 3xx 的 Location，不请求页面内容。
 */
export async function resolveShareLink(input: string | ShareItem, options: ResolveOptions = {}): Promise<ShareItem> {
  if (typeof input !== 'string') return input
  const direct = parseShareLink(input)
  if (direct) return direct

  const fetchImpl = options.fetchImpl ?? fetch
  let current = /^https?:\/\//i.test(input) ? input : `https://qishui.douyin.com/s/${input}`
  for (let hop = 0; hop < (options.maxHops ?? 4); hop++) {
    const res = await fetchImpl(current, { method: 'GET', redirect: 'manual', headers: { 'user-agent': 'Mozilla/5.0' } })
    const location = res.headers.get('location')
    if (!location) break
    current = new URL(location, current).toString()
    const item = parseShareLink(current)
    if (item) return item
  }
  throw new QishuiError(`没能从分享链接里解析出条目 ID：${input}`)
}

export interface TrackRef {
  track_id: string
  name: string
  duration_ms?: number
  album?: { album_id?: string; name?: string; release_date?: number }
  artists: { artist_id?: string; name?: string }[]
  cover_url?: string
}

export interface ShareMeta {
  kind: ShareKind
  id: string
  title?: string
  /** GetShareInfo 的 share_desc，就是「- 歌手名」那串文案，不是结构化歌手 */
  artist_text?: string
  cover_url?: string
  share?: { link_desc?: string; weibo_desc?: string; common_desc?: string }
  links?: { share_link?: string; system_link?: string; short_link?: string }
  /** 可播性/权益标记，来自 MCheckMedia；只有 track 才查得到 */
  access?: {
    status?: number
    only_vip_playable?: boolean
    only_vip_download?: boolean
    vip_only_qualities?: string[]
  }
  related?: TrackRef[]
}

export interface ShareMetaOptions {
  cover_width?: number
  /** 相关曲目条数，0 关闭；只对 track 有效 */
  related_count?: number
}

// 原始响应里还带音频/试听相关字段，按项目边界不取、不转发，见 README「能力边界」
function toTrackRef(t: any, coverWidth?: number): TrackRef | undefined {
  const track = t?.entity?.track_wrapper?.track ?? t?.track ?? t
  if (!track?.id) return undefined
  return {
    track_id: String(track.id),
    name: track.name ?? '',
    duration_ms: typeof track.duration === 'number' ? track.duration : undefined,
    album: track.album
      ? { album_id: track.album.id ? String(track.album.id) : undefined, name: track.album.name, release_date: track.album.release_date }
      : undefined,
    artists: (track.artists ?? []).map((a: any) => ({ artist_id: a?.id ? String(a.id) : undefined, name: a?.name })),
    cover_url: getImageUrl(track.album?.url_cover as ImageResource, { width: coverWidth }),
  }
}

/**
 * 用已封装的匿名接口组装分享条目的元数据：
 *   GetShareInfo  → 标题/歌手文案/封面/各平台分享文案与链接（track 与 ugc_video 都有）
 *   MCheckMedia   → 可播性与 VIP 权益标记（只对 track 有效，ugc_video 会回 1000004）
 *   GetRelatedMedia → 相关曲目（带完整 album/歌手/时长/封面）
 * 曲目自身的结构化时长和专辑要走 GetTrackV2（本项目不实现），所以这里没有。
 * 封面的两种形态都支持：`uri + urls[0]` 拼串，以及 ugc_video 那种直接给签名完整 URL。
 */
export async function getShareMeta(
  item: ShareItem,
  client: Client,
  options: ShareMetaOptions = {},
): Promise<ShareMeta> {
  const meta: ShareMeta = { kind: item.kind, id: item.id }

  const { share_info } = await client.request('GetShareInfo', { item_type: item.kind, item_id: item.id })
  if (share_info) {
    meta.title = share_info.share_title
    meta.artist_text = share_info.share_desc
    meta.cover_url = getImageUrl(share_info.share_cover as ImageResource, { width: options.cover_width })
    meta.share = {
      link_desc: share_info.share_link_desc,
      weibo_desc: share_info.share_weibo_desc,
      common_desc: share_info.common_desc,
    }
    meta.links = {
      share_link: share_info.share_link,
      system_link: share_info.system_share_link,
      short_link: share_info.short_share_link,
    }
  }

  if (item.kind === 'track') {
    try {
      const { media_status } = await client.request('MCheckMedia', {
        media_list: [{ id: item.id, type: 'track' }],
        scene: 0,
        scene_name: '',
        queue_type: '',
      })
      const st = media_status?.[0]
      if (st) {
        meta.access = {
          status: st.status,
          only_vip_playable: st.label_info?.only_vip_playable,
          only_vip_download: st.label_info?.only_vip_download,
          vip_only_qualities: st.label_info?.quality_only_vip_can_play,
        }
      }
    } catch {
      // 可播性只是附加信息，拿不到不影响元数据
    }

    const relatedCount = options.related_count ?? 8
    if (relatedCount > 0) {
      const rel = await client.request('GetRelatedMedia', {
        media_list: [{ id: item.id, type: 'track' }],
        full_media: true,
        req_count: relatedCount,
      })
      meta.related = (rel.items ?? []).map((t: any) => toTrackRef(t, options.cover_width)).filter(Boolean) as TrackRef[]
    }
  }

  return meta
}

/**
 * 链接/ID → 元数据，一步到位。
 * 已经有 ID 就直接传 `{ kind, id }`，一次多余请求都不会发。
 */
export async function shareLinkToMeta(
  input: string | ShareItem,
  client: Client,
  options: ShareMetaOptions & ResolveOptions = {},
): Promise<ShareMeta> {
  const item = await resolveShareLink(input, options)
  return getShareMeta(item, client, options)
}
