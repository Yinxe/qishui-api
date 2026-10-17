import { QishuiError } from '../errors.js'
import { getImageUrl, type ImageResource } from './image.js'
import { resolveShareLink, type ResolveOptions, type ShareItem } from './share.js'

/** KRC 逐字歌词的一个词：带本词的起止毫秒 */
export interface ShareLyricWord {
  text: string
  start_ms?: number
  /** 末行会是 `Number.MAX_SAFE_INTEGER` 哨兵（持续到曲终），已归一化为 undefined */
  end_ms?: number
}

/** KRC 歌词的一行 */
export interface ShareLyricSentence {
  text: string
  start_ms?: number
  /** 末行会是 `Number.MAX_SAFE_INTEGER` 哨兵（持续到曲终），已归一化为 undefined */
  end_ms?: number
  /** 逐字时间戳；署名行（作曲/作词/贡献者）整句一个词 */
  words?: ShareLyricWord[]
  /** `'lrc'` = 只有行级时间的署名行；正文行（逐字滚动）不带此字段 */
  type?: string
}

/** KRC 结构化歌词，来自分享页 `audioWithLyricsOption.lyrics`（只有 track 有） */
export interface ShareLyrics {
  lyric_type: string
  sentences: ShareLyricSentence[]
}

/** 分享页 SSR 里就带着的可播媒体（track 音频 / ugc_video 视频） */
export interface ShareMedia {
  kind: ShareItem['kind']
  id: string
  play_url: string
  /** `audio_mp4` / `video_mp4`，取自 URL 上的 mime_type */
  mime_type?: string
  duration_ms?: number
  title?: string
  artist?: string
  cover_url?: string
  /** 字节内部媒体 ID，换源/重签时要用它 */
  vid?: string
  /** 签名 URL 的过期时刻（unix 秒）；过期后这条地址失效，需重新解析 */
  expires_at?: number
  /** KRC 结构化歌词（行级 + 逐字时间戳）；只有 track 且该曲有歌词时才有 */
  lyrics?: ShareLyrics
  /** 视频分辨率宽；只有 ugc_video 有 */
  width?: number
  /** 视频分辨率高；只有 ugc_video 有 */
  height?: number
  /** 视频首帧图（签名 URL，会过期）；只有 ugc_video 有 */
  first_frame_url?: string
  /** 作者头像（签名 URL，会过期）；只有 ugc_video 有 */
  artist_avatar_url?: string
}

/** 只有这两种形态的分享页 SSR 里带流地址 */
const PAGE_KINDS = new Set(['track', 'ugc_video'])

export interface ShareMediaOptions extends ResolveOptions {
  /** 默认桌面 UA；移动端分享页结构不同 */
  userAgent?: string
  /** 解析出的封面宽度 */
  cover_width?: number
}

/**
 * `_ROUTER_DATA = {...}` 是页内 `<script>` 的一段 JSON，不能靠正则截尾巴（值里有 `}` 和 `<`），
 * 所以从 `{` 起做括号配平，字符串内的括号和转义都跳过。
 */
function extractRouterData(html: string): any {
  const at = html.indexOf('_ROUTER_DATA')
  if (at < 0) throw new QishuiError('分享页里没有 _ROUTER_DATA，页面结构可能已改版')
  const open = html.indexOf('{', at)
  if (open < 0) throw new QishuiError('分享页的 _ROUTER_DATA 后面没有对象')

  let depth = 0
  let inStr = false
  let esc = false
  for (let i = open; i < html.length; i++) {
    const c = html[i]
    if (inStr) {
      if (esc) esc = false
      else if (c === '\\') esc = true
      else if (c === '"') inStr = false
      continue
    }
    if (c === '"') inStr = true
    else if (c === '{' || c === '[') depth++
    else if (c === '}' || c === ']') {
      if (--depth === 0) return JSON.parse(html.slice(open, i + 1))
    }
  }
  throw new QishuiError('分享页的 _ROUTER_DATA 括号不配平')
}

/** 字节 CDN 的签名地址形如 `https://<host>/<token>/<过期时刻16进制>/...` */
function expiresAtOf(url: string): number | undefined {
  const seg = new URL(url).pathname.split('/').filter(Boolean)[1]
  if (!seg || !/^[0-9a-f]{8}$/.test(seg)) return undefined
  const ts = parseInt(seg, 16)
  // 只接受「此刻 ~ 一年后」，避免把路径里的其它 hex 当时间
  const now = Math.floor(Date.now() / 1000)
  return ts >= now - 3600 && ts <= now + 31_536_000 ? ts : undefined
}

function mimeOf(url: string): string | undefined {
  return new URL(url).searchParams.get('mime_type') ?? undefined
}

function pageUrlFor(item: ShareItem): string {
  return `https://www.qishui.com/share/${item.kind}?${item.kind}_id=${item.id}&auto_play_bgm=1`
}

/** 末行 endMs 是 MAX_SAFE_INTEGER 哨兵（"持续到曲终"），对消费方没意义，归一化掉 */
function normMs(ms: unknown): number | undefined {
  return typeof ms === 'number' && ms < Number.MAX_SAFE_INTEGER ? ms : undefined
}

/**
 * `audioWithLyricsOption.lyrics`（KRC）→ ShareLyrics。
 * 无歌词的曲该字段直接缺省/为 null，返回 undefined。
 */
function toLyrics(raw: any): ShareLyrics | undefined {
  if (!raw || !Array.isArray(raw.sentences)) return undefined
  return {
    lyric_type: raw.lyricType,
    sentences: raw.sentences.map((s: any) => ({
      text: s?.text ?? '',
      start_ms: normMs(s?.startMs),
      end_ms: normMs(s?.endMs),
      words: Array.isArray(s?.words)
        ? s.words.map((w: any) => ({ text: w?.text ?? '', start_ms: normMs(w?.startMs), end_ms: normMs(w?.endMs) }))
        : undefined,
      type: s?.type,
    })),
  }
}

function toMedia(item: ShareItem, loader: any, coverWidth?: number): ShareMedia {
  const status = Number(loader?.status_code ?? 0)
  if (status !== 0) throw new QishuiError(`分享页标记该条目不可用 status_code=${status}：${item.kind}/${item.id}`)

  // track 的字段在 audioWithLyricsOption（含 trackInfo），ugc_video 在 videoOptions（扁平）
  const track = item.kind === 'track' ? loader?.audioWithLyricsOption : loader?.videoOptions
  const info = track?.trackInfo
  const play_url = track?.url
  if (typeof play_url !== 'string' || !/^https:\/\//.test(play_url))
    throw new QishuiError(`分享页没有给出可播地址（多为版权或 VIP 限制）：${item.kind}/${item.id}`)

  // getImageUrl 拿不到图时给空串，所以用 || 依次回落
  const albumCover = item.kind === 'track' ? getImageUrl(info?.album?.url_cover as ImageResource, { width: coverWidth }) : ''
  const cover = albumCover || track?.coverURL || track?.metaURL || undefined

  return {
    kind: item.kind,
    id: item.id,
    play_url,
    mime_type: mimeOf(play_url),
    duration_ms:
      info?.duration ?? (typeof track?.duration === 'number' ? Math.round(track.duration * 1000) : undefined),
    title: info?.name ?? track?.videoName,
    artist: info?.artists?.map((a: any) => a?.name).filter(Boolean).join(',') || track?.artistName || undefined,
    cover_url: cover,
    vid: track?.vid,
    expires_at: expiresAtOf(play_url),
    // 只有 track 的 audioWithLyricsOption 里有 lyrics；ugc_video 的 videoOptions 没有
    lyrics: item.kind === 'track' ? toLyrics(track?.lyrics) : undefined,
    // ugc_video 独有的几个扁平字段（track 侧取不到，自然 undefined）
    width: track?.width,
    height: track?.height,
    first_frame_url: track?.firstFrameURL,
    artist_avatar_url: track?.artistThumbAvatarArr?.[0],
  }
}

/**
 * 分享链接/ID → 可播地址。
 * 只 GET 一次 `www.qishui.com/share/<kind>` 的 SSR 页面并从 `_ROUTER_DATA` 取值，
 * 不请求 goapi 的 `GetTrackV2`/`GetMediaPlayer`/`GetVideoV2`，也不构造它们的签名。
 * 地址是带签名的，`expires_at` 到期就废，需要重新解析。
 */
export async function getShareMedia(
  input: string | ShareItem,
  options: ShareMediaOptions = {},
): Promise<ShareMedia> {
  const item = await resolveShareLink(input, options)
  if (!PAGE_KINDS.has(item.kind))
    throw new QishuiError(`分享页只有 track / ugc_video 带可播地址，当前是 ${item.kind}/${item.id}`)

  const res = await (options.fetchImpl ?? fetch)(pageUrlFor(item), {
    headers: { 'user-agent': options.userAgent ?? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36' },
  })
  if (!res.ok) throw new QishuiError(`分享页 HTTP ${res.status}：${item.kind}/${item.id}`)

  const loaderData = extractRouterData(await res.text())?.loaderData
  const loader = item.kind === 'track' ? loaderData?.track_page : loaderData?.ugc_video_page
  if (!loader) throw new QishuiError(`分享页缺少 loaderData.${item.kind === 'track' ? 'track_page' : 'ugc_video_page'}，页面可能已改版`)
  return toMedia(item, loader, options.cover_width)
}
