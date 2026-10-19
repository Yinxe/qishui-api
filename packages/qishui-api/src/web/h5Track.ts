import { QishuiError } from '../errors.js'
import { mimeOf } from './cdn.js'
import { getImageUrl, type ImageResource } from './image.js'
import { parseKrc } from './lyrics.js'
import { BROWSER_USER_AGENT, type ShareLyrics, type ShareMedia } from './sharePage.js'

/** 一档音频：`quality` 是档位名（medium/higher/highest/lossless），`url` 是带签名的地址 */
export interface TrackQuality {
  quality: string
  url: string
  backup_url?: string
  /** 这个地址实际能听的毫秒数 —— 整曲还是试听片段，以它为准 */
  duration_ms?: number
  bytes?: number
  bitrate?: number
  real_bitrate?: number
  codec_type?: string
  /** `m4a` 之类容器 */
  container?: string
  sample_rate?: string
  file_id?: string
  file_hash?: string
}

/** `label_info` 的一档权益：能不能播/能不能下，要会员还是要单买 */
export interface QualityEntitlement {
  play?: { condition?: string; need_vip?: boolean; need_purchase?: boolean }
  download?: { condition?: string; need_vip?: boolean; need_purchase?: boolean }
}

export interface TrackDetail {
  kind: 'track'
  id: string
  title?: string
  /** 歌手，`artists` 拼串 */
  artist?: string
  album?: { id?: string; name?: string }
  /** **整曲**时长（ms），与地址实际长度无关 */
  duration_ms?: number
  cover_url?: string
  vid?: string
  /** true = 这一批地址只是整曲里的一段，不是整曲 */
  clip: boolean
  /** 试听片段在整曲里的起点/长度（ms）；整曲可播时缺省 */
  clip_start_ms?: number
  clip_duration_ms?: number
  /** 上游给的地址过期时刻（unix 秒），到期需重新取 */
  expires_at?: number
  mime_type?: string
  /** 实际能取到地址的档位（含 URL） */
  qualities: TrackQuality[]
  /** `bit_rates` 声明的档位（只有码率/体积，不代表取得到地址；`lossless` 常出现在这里却不在 `qualities`） */
  declared_qualities?: { quality?: string; bitrate?: number; bytes?: number }[]
  /** 权益矩阵：哪档要会员、哪档要单买 */
  entitlements?: Record<string, QualityEntitlement>
  only_vip_playable?: boolean
  only_vip_download?: boolean
  /** 完整 KRC 歌词（行级 + 逐字时间戳），与可播性无关 */
  lyrics?: ShareLyrics
}

export interface TrackDetailOptions {
  fetchImpl?: typeof fetch
  /** 默认桌面浏览器 UA；实测这个口对 UA 不敏感（`LunaPC/*`、空 UA 都放行） */
  userAgent?: string
  baseUrl?: string
  signal?: AbortSignal
  timeout?: number
  /** 匿名可用；带 cookie 时原样附上（会员态是否放行未验证） */
  cookie?: string
  cover_width?: number
}

/**
 * 曲目详情 + 音频地址 + 完整歌词 + 权益矩阵，一次拿全。
 *
 * 走 `GET /luna/h5/track_v2`，**放行条件是 query 里 `device_platform=web`** ——
 * 缺它回 `1000062 应用版本有风险`，与 UA、签名、cookie 都无关；不需要设备注册，
 * 所以不经 `createClient()`（那会先打一次 device_register）。
 *
 * 地址是带签名的字节 CDN，`expires_at` 到期作废。取到的是整曲还是试听片段由
 * **可播性**决定：整曲可播时 `qualities` 给整曲各档；VIP 曲匿名只给试听段
 * （`clip: true`，多档是同一段的不同码率）。实测与 web 分享页 SSR 的音频**逐字节相同**，
 * 但整曲可播时这里还会多给 `medium`/`highest` 档（SSR 只有一条 `higher`）。
 */
export async function getTrackDetail(id: string, options: TrackDetailOptions = {}): Promise<TrackDetail> {
  const trackId = String(id ?? '').trim()
  if (!trackId) throw new QishuiError('getTrackDetail: 缺少 track_id')

  const url = new URL(`${options.baseUrl ?? 'https://api.qishui.com'}/luna/h5/track_v2`)
  url.searchParams.set('track_id', trackId)
  url.searchParams.set('device_platform', 'web')

  const headers: Record<string, string> = {
    'user-agent': options.userAgent ?? BROWSER_USER_AGENT,
    accept: 'application/json',
  }
  if (options.cookie) headers.cookie = options.cookie

  const signal = options.timeout ? AbortSignal.timeout(options.timeout) : options.signal
  let res: Response
  try {
    res = await (options.fetchImpl ?? fetch)(url.toString(), { headers, signal })
  } catch (err) {
    throw new QishuiError(`getTrackDetail 请求失败: ${String(err)}`, { cause: err })
  }
  if (!res.ok) throw new QishuiError(`getTrackDetail HTTP ${res.status}：${trackId}`)

  const text = await res.text()
  if (!text) throw new QishuiError(`getTrackDetail 返回空响应体：${trackId}`)
  let json: any
  try {
    json = JSON.parse(text)
  } catch {
    throw new QishuiError(`getTrackDetail 响应非 JSON：${trackId}`, text.slice(0, 200))
  }

  const code = json?.status_code
  if (typeof code === 'number' && code !== 0) {
    const msg = json?.status_info?.status_msg
    throw new QishuiError(`getTrackDetail 被拒 status_code=${code}${msg ? ` ${msg}` : ''}：${trackId}`)
  }

  return toTrackDetail(trackId, json, options.cover_width)
}

function toTrackDetail(trackId: string, json: any, coverWidth?: number): TrackDetail {
  const t = json?.track
  if (!t?.id) throw new QishuiError(`getTrackDetail 响应里没有 track：${trackId}`)

  const durationMs = typeof t.duration === 'number' ? t.duration : undefined
  const { qualities, vid: mediaVid } = parseVideoModel(json?.track_player?.video_model)

  /**
   * 「整曲还是片段」只认地址的实际长度：`video_model.video_duration`（在 JSON 串里，
   * 不在 `track_player` 顶层）。`audition_info`/`preview` 对整曲可播的曲也在给**另一个**
   * vid 的试听段，拿它当本次地址的片段会判错（实测「别说我的眼泪你无所谓」整曲可播，
   * 但 audition_info 仍指着一段 30 秒）。取不到地址长度时按片段处理。
   */
  const clipDurationMs = qualities[0]?.duration_ms
  const fullTrack = clipDurationMs != null && durationMs != null && clipDurationMs >= durationMs - 2000

  const label = t.label_info ?? {}
  // 片段起点优先取 `preview`（它总是描述本次地址这一段）；`audition_info` 只在
  // 说的是同一个 vid 时才可信 —— 整曲可播的曲也会带 audition_info，指的是另一段试听
  const sameAudition = t.audition_info?.vid != null && t.audition_info.vid === mediaVid
  const clipStartMs = firstNumber(t.preview?.start, sameAudition ? t.audition_info?.start_time_ms : undefined) ?? 0
  const entitlements: Record<string, QualityEntitlement> = {}
  for (const [quality, map] of Object.entries<any>(label.quality_map ?? {})) {
    entitlements[quality] = { play: map?.play_detail, download: map?.download_detail }
  }

  return {
    kind: 'track',
    id: String(t.id),
    title: t.name,
    artist:
      (t.artists ?? [])
        .map((a: any) => a?.name)
        .filter(Boolean)
        .join(',') || undefined,
    album: t.album ? { id: t.album.id ? String(t.album.id) : undefined, name: t.album.name } : undefined,
    duration_ms: durationMs,
    cover_url: getImageUrl(t.album?.url_cover as ImageResource, { width: coverWidth }) || undefined,
    vid: t.vid,
    clip: !fullTrack,
    clip_start_ms: fullTrack ? undefined : clipStartMs,
    clip_duration_ms: fullTrack ? undefined : clipDurationMs,
    expires_at: firstNumber(json?.track_player?.expire_at, json?.expire_at),
    mime_type: qualities[0] ? mimeOf(qualities[0].url) : undefined,
    qualities,
    declared_qualities: (t.bit_rates ?? []).map((b: any) => ({
      quality: b?.quality,
      bitrate: b?.br,
      bytes: b?.size,
    })),
    entitlements: Object.keys(entitlements).length ? entitlements : undefined,
    only_vip_playable: label.only_vip_playable,
    only_vip_download: label.only_vip_download,
    lyrics: parseKrc(json?.lyric?.content),
  }
}

/** `track_player.video_model` 是 JSON 字符串（不是对象），档位地址在它的 `video_list` 里 */
function parseVideoModel(raw: unknown): { qualities: TrackQuality[]; vid?: string } {
  let vm: any
  try {
    vm = typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch {
    return { qualities: [] }
  }
  if (!Array.isArray(vm?.video_list)) return { qualities: [] }

  const clipMs = typeof vm.video_duration === 'number' ? Math.round(vm.video_duration * 1000) : undefined
  const list: any[] = vm.video_list
  return {
    vid: typeof vm.video_id === 'string' ? vm.video_id : undefined,
    qualities: list
      .map((v: any): TrackQuality | undefined => {
        if (typeof v?.main_url !== 'string') return undefined
        const meta = v?.video_meta ?? {}
        return {
          quality: String(meta.quality ?? v?.gear_des_key ?? 'unknown'),
          url: v.main_url,
          backup_url: typeof v?.backup_url === 'string' ? v.backup_url : undefined,
          duration_ms: clipMs,
          bytes: meta.size,
          bitrate: meta.bitrate,
          real_bitrate: meta.real_bitrate,
          codec_type: meta.codec_type,
          container: meta.vtype,
          sample_rate: meta.audio_sample_rate,
          file_id: meta.file_id,
          file_hash: meta.file_hash,
        } as TrackQuality
      })
      .filter((q): q is TrackQuality => q != null)
      .sort((a, b) => (b.bitrate ?? 0) - (a.bitrate ?? 0)),
  }
}

function firstNumber(...values: unknown[]): number | undefined {
  return values.find((v): v is number => typeof v === 'number' && Number.isFinite(v))
}

/** `qualities` 已按码率降序，默认取最高档 */
export interface TrackMediaOptions extends TrackDetailOptions {
  /** 要哪一档（`medium`/`higher`/`highest`/`lossless`）；缺省取地址里码率最高的一档 */
  quality?: string
}

/**
 * 曲目可播媒体，归一到与分享页 SSR 同一形状（`getShareMedia` 的返回型）。
 *
 * 实测同一首曲两条路拿到的音频**逐字节相同**，差别在：
 *  - 整曲可播时这里还会多给 `medium`/`highest`（SSR 只有一条 `higher`）；
 *  - `ugc_video` 没有 h5 对应接口（`/luna/h5/video*` 全 404），视频只能继续走 SSR；
 *  - 上游改版/拒答时，调用方应回落到 `getShareMedia`。
 */
export async function getTrackMedia(id: string, options: TrackMediaOptions = {}): Promise<ShareMedia> {
  const detail = await getTrackDetail(id, options)
  const qualities = detail.qualities
  if (!qualities.length) throw new QishuiError(`h5 曲目接口没给可播地址：${detail.id}`)
  const chosen = (options.quality ? qualities.find((q) => q.quality === options.quality) : undefined) ?? qualities[0]

  return {
    kind: 'track',
    id: detail.id,
    play_url: chosen.url,
    mime_type: chosen.url ? mimeOf(chosen.url) : undefined,
    duration_ms: detail.duration_ms,
    // 这次实际给到的区间；整曲时也照实填，core 的 clipOf() 会把「等于整曲」的判成非片段
    offset_start_ms: detail.clip ? (detail.clip_start_ms ?? 0) : 0,
    offset_duration_ms: chosen.duration_ms,
    title: detail.title,
    artist: detail.artist,
    cover_url: detail.cover_url,
    vid: detail.vid,
    expires_at: detail.expires_at,
    lyrics: detail.lyrics,
  }
}
