/**
 * 离线 mock 上游：按 URL 路由回罐头响应，让 core 的服务/播放器/媒体缓存链路
 * 可以**零真实网络**地测（真打上游的口径验证归 `qishui-api` 实测台）。
 *
 * 覆盖的路由（其余 path 一律回 `{status_code:0}` 兜底）：
 *  - `/service/2/desktop/device_register/` → 固定假设备
 *  - `/luna/h5/track_v2`（认 `device_platform=web`）→ 曲目详情/档位/歌词/权益（core 取址正口）
 *  - `www.qishui.com/share/track` → 带 `_ROUTER_DATA` 的 SSR 分享页（可播/不可播可切，h5 之外的兜底）
 *  - `audio.mock` → 支持 `Range: bytes=N-`（206）的音频字节流
 *  - `/luna/media*`（MGetMedia）→ 按请求里的 id 造完整曲目实体（GET 回空 body，逼出 POST 回退）
 *  - `/luna/me`、`/luna/media-stats`、`/luna/media/related`、`/luna/search/*`、`/luna/playlist/detail`、
 *    `/luna/charts/*`、`/luna/albums/*`、`/luna/artists/*(/tracks|/albums)`
 *  - `/luna/me/playlist`（「我喜欢的音乐」`type=1`）+ `/luna/me/collection/track[/delete]`：
 *    我的喜欢是**有状态**的（`liked` 集合被写接口改，`GetPlaylistDetail` 按集合回曲目），
 *    这样才能测「写完读回真值」这条缓存失效底线
 *  - `/passport/web/get_qrcode|check_qrconnect`（扫码登录；状态按 `qrStatuses` 脚本回放，
 *    回 confirmed 时顺带下发 `sessionid` cookie）
 */
import type { DeviceIdentity } from 'qishui-api'

export interface MockCall {
  method: string
  url: string
  body?: string
}

export interface MockUpstreamOptions {
  /** 分享页是否给可播地址（默认 true；false = 版权受限形态） */
  playable?: boolean
  /** mock 音频字节数（默认 2048） */
  audioSize?: number
  /** GetMyInfo 回的 my_info（默认给一个测试号；null = 未登录形态） */
  myInfo?: Record<string, unknown> | null
  /** 分享页标记为试听片段（秒）；给了就写 offsetStart/offsetDuration */
  clip?: { startSec?: number; durationSec: number }
  /**
   * `/luna/h5/track_v2` 是否可用（默认 true = 曲目取址走 h5 这条正口）。
   * 设 false 复刻「上游改版/接口拿不出曲目」，用来验 core 回落到分享页 SSR 那条兜底路径。
   */
  h5?: boolean
  /**
   * 扫码状态脚本（`check_qrconnect` 每次调用 consume 一格，走完停在最后一格）。
   * 默认 `['waiting', 'confirmed']`；要复刻「确认后上游把 token 判成 expired」就写
   * `['waiting', 'confirmed', 'expired']`。
   */
  qrStatuses?: string[]
  /** `get_qrcode` 里的 `data.qrcode`（上游官方二维码 PNG，`data:image/png;base64,…`）；默认不给 */
  qrPng?: string
  /** 「我喜欢的音乐」初始曲目（写接口会改这份状态） */
  liked?: string[]
  /** 上游「最近播放」表的初始曲目（最近的在前）；`AppendRecentPlayedTracks` 会往头部加 */
  recent?: string[]
  /** 初始关注的艺人 id（`CollectArtists`/`MDeleteCollectedArtists` 改这份） */
  followedArtists?: string[]
}

export interface MockUpstream {
  fetchImpl: typeof fetch
  calls: MockCall[]
  /** 已发生的 fetch 次数 */
  count(): number
  /** 清空调用记录（用于「第二次零请求」断言） */
  resetCalls(): void
  /** 当前「我喜欢的音乐」里的曲目 id（写接口改的就是这份状态） */
  liked(): string[]
  /** 上游「最近播放」那张表，最近的在前（`AppendRecentPlayedTracks`/`Delete...` 改的就是它） */
  recent(): string[]
  /** 上游「关注的艺人」（`CollectArtists`/`MDeleteCollectedArtists` 改的就是它） */
  followed(): string[]
  audioBytes: Buffer
}

/** 「我喜欢的音乐」那张自动歌单（`type=1`）的 mock id */
export const MOCK_LIKED_PLAYLIST_ID = '7000000000000000001'

export const MOCK_DEVICE: DeviceIdentity = {
  deviceId: '9000000000000000001',
  installId: '9000000000000000002',
  cdid: 'mock-cdid',
}

/** MGetMedia/搜索共用的「完整曲目实体」（字段对齐 parseTrack 的口径） */
export function trackEntity(id: string, name = `曲目 ${id.slice(-4)}`, durationMs = 12_345): Record<string, unknown> {
  return {
    id,
    name,
    duration: durationMs,
    vid: `vid-${id}`,
    media_type: 'track',
    artists: [{ id: `a-${id}`, name: `${name}歌手` }],
    album: {
      id: `alb-${id}`,
      name: `${name} 专辑`,
      release_date: 1_700_000_000,
      url_cover: { uri: 'cover-uri', urls: ['https://cover.mock/cover.jpg'] },
    },
    stats: { count_collected: 111, count_comment: 22, count_shared: 33 },
    label_info: { only_vip_playable: false },
  }
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json', 'x-tt-logid': 'mock-logid' },
  })
}

/** 签名地址路径第二段是「过期时刻 16 进制」，expiresAtOf 认这个形态 */
function mockPlayUrl(): string {
  const hex = Math.floor(Date.now() / 1000 + 86_400).toString(16)
  return `https://audio.mock/tok1/${hex}/audio.m4a?mime_type=audio_mp4`
}

function sharePageHtml(playable: boolean, clip?: MockUpstreamOptions['clip']): string {
  const audio: Record<string, unknown> = {
    vid: 'mock-vid',
    trackInfo: {
      name: '晴天（mock）',
      duration: 12_345,
      artists: [{ id: 'a1', name: '测试歌手' }],
      album: { id: 'alb1', name: 'mock 专辑', release_date: 1_700_000_000 },
    },
    lyrics: {
      lyricType: 'krc',
      sentences: [
        { text: '作曲：测试', startMs: 0, endMs: Number.MAX_SAFE_INTEGER, type: 'lrc' },
        {
          text: '第一行歌词',
          startMs: 1000,
          endMs: 4000,
          words: [
            { text: '第一', startMs: 1000, endMs: 2500 },
            { text: '行歌词', startMs: 2500, endMs: 4000 },
          ],
        },
        { text: '第二行歌词', startMs: 4000, endMs: 8000 },
      ],
    },
  }
  if (clip) {
    audio.offsetStart = clip.startSec ?? 0
    audio.offsetDuration = clip.durationSec
  }
  if (playable) audio.url = mockPlayUrl()
  const data = { loaderData: { track_page: { status_code: 0, audioWithLyricsOption: audio } } }
  return `<!doctype html><html><body><script>window._ROUTER_DATA = ${JSON.stringify(data)}</script></body></html>`
}

/**
 * `/luna/h5/track_v2` 的响应骨架（与实测同形：`video_model` 是 JSON 字符串，
 * 档位时长是 `video_duration` **秒**，`preview` 描述本次地址那一段）。
 */
function h5TrackJson(id: string, playable: boolean, clip?: MockUpstreamOptions['clip']): Record<string, unknown> {
  const clipSeconds = clip?.durationSec
  const durationMs = 12_345
  const tiers = [
    { quality: 'medium', bitrate: 66_160, size: 1550 },
    { quality: 'higher', bitrate: 132_195, size: 3098 },
    { quality: 'highest', bitrate: 260_197, size: 6098 },
  ]
  return {
    status_info: { log_id: 'mock-h5', now: Math.floor(Date.now() / 1000) },
    expire_at: Math.floor(Date.now() / 1000) + 86_400,
    track: {
      ...trackEntity(id, '晴天（mock）', durationMs),
      audition_info: { vid: 'mock-audition-vid', start_time_ms: 0, duration_ms: 30_001 },
      // 上游 `preview.start`/`duration` 是**毫秒**（分享页的 offsetStart 才是秒），这里照实测口径
      preview:
        clipSeconds == null
          ? undefined
          : { start: Math.round((clip?.startSec ?? 0) * 1000), duration: Math.round(clipSeconds * 1000) },
      bit_rates: tiers.map((t) => ({ br: t.bitrate, size: t.size, quality: t.quality })),
      label_info: {
        only_vip_playable: !playable,
        quality_map: {
          medium: {
            play_detail: { condition: 'benefit_play_medium', need_vip: false },
            download_detail: { condition: 'benefit_download_medium', need_vip: true },
          },
          lossless: {
            play_detail: { condition: 'benefit_play_lossless', need_vip: true },
            download_detail: { condition: 'benefit_download_lossless', need_vip: true },
          },
        },
      },
    },
    // 与分享页 SSR 那三行同内容：一行署名行（无逐字标记）+ 两行正文
    lyric: {
      type: 1,
      content: '[0,1000]作曲：测试\n[1000,3000]<0,1500,0>第一行歌词\n[4000,4000]<0,4000,0>第二行歌词\n',
    },
    track_player: {
      expire_at: Math.floor(Date.now() / 1000) + 86_400,
      media_id: 'mock-vid',
      video_model: JSON.stringify({
        status: 10,
        video_id: 'mock-vid',
        video_duration: clipSeconds == null ? durationMs / 1000 : clipSeconds,
        video_list: playable
          ? tiers.map((t) => ({
              main_url: mockPlayUrl(),
              gear_des_key: `0:M4A|1:audio|2:aac|5:${t.quality}`,
              video_meta: {
                quality: t.quality,
                vtype: 'm4a',
                bitrate: t.bitrate,
                real_bitrate: t.bitrate,
                codec_type: 'aac',
                size: t.size,
                audio_sample_rate: '44100',
              },
            }))
          : [],
      }),
    },
  }
}

/** MGetMedia 的请求参数可能走 POST body，也可能被 GET 序列化进 query —— 两处一起捞 id */
function requestedIds(url: URL, body?: string): string[] {
  try {
    const parsed = JSON.parse(body ?? '')
    const media: unknown[] = Array.isArray(parsed?.media) ? parsed.media : []
    const ids = media
      .map((item) => (typeof (item as { id?: unknown }).id === 'string' ? (item as { id: string }).id : ''))
      .filter(Boolean)
    if (ids.length) return [...new Set(ids)]
  } catch {
    // body 不是 JSON：走 query 正则
  }
  const raw = `${url.searchParams.toString()} ${body ?? ''}`
  return [...new Set(url.pathname.includes('media') ? (raw.match(/\d{10,20}/g) ?? []) : [])]
}

/** 写接口 body 里的 id 数组（transport 原样 JSON.stringify 过来）——字段名各端点不同，统一从这里取 */
function idsFromBody(body: string | undefined, field: string): string[] {
  try {
    const parsed = JSON.parse(body ?? '') as Record<string, unknown>
    return Array.isArray(parsed[field]) ? (parsed[field] as unknown[]).map(String) : []
  } catch {
    return []
  }
}

/** 收藏类写接口的 `track_ids` */
function trackIdsFromBody(body?: string): string[] {
  return idsFromBody(body, 'track_ids')
}

export function createMockUpstream(options: MockUpstreamOptions = {}): MockUpstream {
  const playable = options.playable !== false
  const h5 = options.h5 !== false
  const size = options.audioSize ?? 2048
  const audioBytes = Buffer.alloc(size, 0x42)
  const coverBytes = Buffer.alloc(512, 0x11)
  const myInfo = options.myInfo === undefined ? { id: '3617835472921684', nickname: '测试小号' } : options.myInfo
  const qrStatuses = options.qrStatuses ?? ['waiting', 'confirmed']
  /** 「我喜欢的音乐」里的曲目：写接口改这份，`GetPlaylistDetail` 按它回曲目 */
  const liked = new Set(options.liked ?? [])
  /** 上游「最近播放」那张表，最近的在前；`Append...` 插到头部、`Delete...` 摘掉（同首重复播只留最新一条） */
  const recent: string[] = [...(options.recent ?? [])]
  /** 上游「关注的艺人」：两条写路径增删，`collection/artist` 按它回 */
  const followed = new Set(options.followedArtists ?? [])
  let qrStep = 0
  const calls: MockCall[] = []

  const fetchImpl: typeof fetch = async (input, init) => {
    const url = new URL(String(typeof input === 'string' ? input : ((input as URL).toString ?? String(input))))
    const method = (init?.method ?? 'GET').toUpperCase()
    const body = typeof init?.body === 'string' ? init.body : undefined
    calls.push({ method, url: url.toString(), body })

    if (url.pathname === '/passport/web/get_qrcode/') {
      return jsonResponse({
        data: {
          token: 'mock-qr-token',
          qrcode_index_url: 'https://bff-pc.qishui.com/light/invoke/scan_login?token=mock-qr-token',
          ...(options.qrPng ? { qrcode: options.qrPng } : {}),
          expire_time: Math.floor(Date.now() / 1000) + 300,
        },
      })
    }
    if (url.pathname === '/passport/web/check_qrconnect/') {
      const status = qrStatuses[Math.min(qrStep, qrStatuses.length - 1)]
      qrStep += 1
      // 只有 confirmed 那一次上游才下发登录 cookie（跟真实扫码一致：确认后 Set-Cookie）
      const headers: Record<string, string> = { 'content-type': 'application/json' }
      if (status === 'confirmed') headers['set-cookie'] = 'sessionid=MOCK_SESSIONID; Path=/; HttpOnly'
      return new Response(JSON.stringify({ data: { status } }), { status: 200, headers })
    }
    if (url.pathname.endsWith('/device_register/')) {
      return jsonResponse({
        device_id_str: MOCK_DEVICE.deviceId,
        install_id_str: MOCK_DEVICE.installId,
        device_token: 'mock-device-token',
        ssid: 'mock',
      })
    }
    if (url.hostname === 'www.qishui.com') {
      return new Response(sharePageHtml(playable, options.clip), {
        status: 200,
        headers: { 'content-type': 'text/html' },
      })
    }
    // 曲目取址的正口：放行只认 device_platform=web 这个 query（缺了就回 1000062，与 UA/签名无关）
    if (url.pathname === '/luna/h5/track_v2') {
      if (url.searchParams.get('device_platform') !== 'web') {
        return jsonResponse({
          status_code: 1000062,
          status_info: { log_id: 'mock-h5', status_msg: '应用版本有风险，请从应用商店下载正式版本' },
        })
      }
      if (!h5) return jsonResponse({ status_code: 0, status_info: { log_id: 'mock-h5' } })
      return jsonResponse(h5TrackJson(url.searchParams.get('track_id') ?? '0', playable, options.clip))
    }
    if (url.hostname === 'cover.mock') {
      return new Response(coverBytes, { status: 200, headers: { 'content-type': 'image/jpeg' } })
    }
    if (url.hostname === 'audio.mock') {
      const range = new Headers(init?.headers ?? {}).get('range')
      const from = range ? Number(/bytes=(\d+)-/.exec(range)?.[1] ?? 0) : 0
      const slice = audioBytes.subarray(from)
      if (range) {
        return new Response(slice, {
          status: 206,
          headers: { 'content-range': `bytes ${from}-${size - 1}/${size}`, 'content-length': String(slice.length) },
        })
      }
      return new Response(slice, { status: 200, headers: { 'content-length': String(size) } })
    }

    switch (true) {
      case url.pathname === '/luna/me' || url.pathname === '/luna/pc/me':
        return jsonResponse(myInfo ? { status_code: 0, my_info: myInfo } : { status_code: 0 })
      case url.pathname === '/luna/media' || url.pathname === '/luna/pc/media': {
        // transport 对 MGetMedia 先试 GET（query 里的 media 序列化不出 id）；
        // mock 回空 body 逼它回退到带 JSON body 的 POST，才能按请求 id 造实体
        if (method === 'GET') return new Response('', { status: 200 })
        const media = requestedIds(url, body).map((id) => ({
          entity: { track_wrapper: { track: trackEntity(id) } },
        }))
        return jsonResponse({ status_code: 0, media })
      }
      case url.pathname === '/luna/media-stats' || url.pathname === '/luna/pc/media-stats':
        return jsonResponse({
          status_code: 0,
          stats: { count_collected: 4001, count_comment: 77, count_shared: 9 },
        })
      case url.pathname === '/luna/media/related' || url.pathname === '/luna/pc/media/related':
        return jsonResponse({
          status_code: 0,
          items: ['7001', '7002', '7003'].map((id) => ({ entity: { track_wrapper: { track: trackEntity(id) } } })),
        })
      // 复刻实测口径：Search 的 pc 变体恒空 body，transport 自动回退到 /luna/search/<type>
      case url.pathname.startsWith('/luna/pc/search/'):
        return new Response('', { status: 200 })
      case url.pathname.startsWith('/luna/search/'): {
        // 上游按 `<type>` 分路由：不是那 7 个 search_type 就是 404（实测 `/luna/search/`（空 type）也 404）
        const searchType = url.pathname.split('/').pop() ?? ''
        if (!['all', 'track', 'video', 'artist', 'album', 'playlist', 'user'].includes(searchType)) {
          return new Response('not found', { status: 404 })
        }
        return jsonResponse({
          status_code: 0,
          result_groups: [
            // 聚合组：上游 display_view_all=false，id 也映射不到单一 search_type
            {
              id: 'top_results',
              display_title: '你可能想搜',
              display_type: '',
              display_view_all: false,
              has_more: false,
              items: [],
            },
            {
              id: 'tracks',
              display_title: '单曲',
              display_type: '',
              display_view_all: true,
              has_more: false,
              next_cursor: '20',
              items: [
                {
                  id: '7001',
                  type: 'track',
                  entity: { track_wrapper: { track: trackEntity('7001', '晴天（mock）') } },
                },
                {
                  id: '7002',
                  type: 'track',
                  entity: { track: { ...trackEntity('7002', '晴天版二'), release_date: null } },
                },
              ],
            },
            {
              id: 'artists',
              display_title: '歌手',
              display_type: '',
              display_view_all: true,
              has_more: false,
              items: [
                {
                  id: '9001',
                  type: 'artist',
                  entity: {
                    artist: {
                      id: '9001',
                      name: '测试歌手',
                      simple_display_name: '测试歌手',
                      count_albums: 3,
                      count_tracks: 40,
                    },
                  },
                },
              ],
            },
          ],
        })
      }
      // 「我喜欢的音乐」（type=1）：曲目就是 liked 集合，收藏/取消写接口直接改它
      case url.pathname === '/luna/me/playlist' || url.pathname === '/luna/pc/me/playlist':
        return jsonResponse({
          status_code: 0,
          playlists: [
            {
              id: MOCK_LIKED_PLAYLIST_ID,
              title: '我喜欢的音乐',
              type: 1,
              count_tracks: liked.size,
              url_cover: null,
            },
          ],
        })
      case url.pathname === '/luna/me/collection/track':
        for (const id of trackIdsFromBody(body)) liked.add(id)
        return jsonResponse({ status_code: 0 })
      case url.pathname === '/luna/me/collection/track/delete':
        for (const id of trackIdsFromBody(body)) liked.delete(id)
        return jsonResponse({ status_code: 0 })
      case url.pathname === '/luna/playlist/detail' || url.pathname === '/luna/pc/playlist/detail': {
        const playlistId = url.searchParams.get('playlist_id') ?? ''
        if (playlistId === MOCK_LIKED_PLAYLIST_ID) {
          return jsonResponse({
            status_code: 0,
            playlist: { id: playlistId, title: '我喜欢的音乐', count_tracks: liked.size, type: 1, url_cover: null },
            media_resources: [...liked].map((id) => ({ entity: { track_wrapper: { track: trackEntity(id) } } })),
            has_more: false,
            next_cursor: '',
          })
        }
        return jsonResponse({
          status_code: 0,
          playlist: { id: '7031081053599238175', title: 'mock 歌单', count_tracks: 2, type: 3, url_cover: null },
          media_resources: [
            { entity: { track_wrapper: { track: trackEntity('7001') } } },
            { entity: { track_wrapper: { track: trackEntity('7002') } } },
          ],
          has_more: false,
          next_cursor: '',
        })
      }
      case /^\/luna(\/pc)?\/albums\//.test(url.pathname):
        return jsonResponse({
          status_code: 0,
          album_info: {
            id: url.pathname.split('/').pop(),
            name: 'mock 专辑',
            release_date: 1_700_000_000,
            count_tracks: 2,
            artists: [{ id: 'a1', name: '测试歌手' }],
            url_cover: { uri: 'cover-uri', urls: ['https://cover.mock/cover.jpg'] },
          },
          tracks: [
            { entity: { track_wrapper: { track: trackEntity('7001') } } },
            { entity: { track_wrapper: { track: trackEntity('7002') } } },
          ],
        })
      case /^\/luna(\/pc)?\/artists\/[^/]+\/tracks$/.test(url.pathname):
        return jsonResponse({
          status_code: 0,
          tracks: [
            { entity: { track_wrapper: { track: trackEntity('7001') } } },
            { entity: { track_wrapper: { track: trackEntity('7002') } } },
          ],
          has_more: true,
          next_cursor: '20',
        })
      case /^\/luna(\/pc)?\/artists\/[^/]+\/albums$/.test(url.pathname):
        return jsonResponse({
          status_code: 0,
          albums: [
            {
              id: 'alb-1',
              name: 'mock 专辑一',
              release_date: 1_700_000_000,
              count_tracks: 5,
            },
          ],
          has_more: false,
          next_cursor: '',
        })
      case /^\/luna(\/pc)?\/artists\//.test(url.pathname):
        return jsonResponse({
          status_code: 0,
          artist_info: {
            id: url.pathname.split('/').pop(),
            name: '测试歌手',
            simple_display_name: '测试歌手',
            count_albums: 3,
            count_tracks: 40,
            url_avatar: { uri: 'avatar-uri', urls: ['https://cover.mock/cover.jpg'] },
          },
          hot_tracks: [{ entity: { track_wrapper: { track: trackEntity('7001') } } }],
        })
      // 听歌模式的两条取批路径：上游实测每次只回 6 首（随机批次，不是浏览列表）
      case url.pathname === '/luna/pc/feed/song-tab':
        return jsonResponse({
          status_code: 0,
          items: ['7101', '7102', '7103', '7104', '7105', '7106'].map((id) => ({
            entity: { track_wrapper: { track: trackEntity(id) } },
          })),
        })
      case url.pathname === '/luna/pc/feed/radio/tracks':
        return jsonResponse({
          status_code: 0,
          items: ['7201', '7202', '7203', '7204', '7205', '7206'].map((id) => ({
            entity: { track_wrapper: { track: trackEntity(id) } },
          })),
        })
      case /^\/luna(\/pc)?\/charts\//.test(url.pathname):
        return jsonResponse({
          status_code: 0,
          chart: {
            id: 'chart-1',
            title: 'mock 榜单',
            count_tracks: 2,
            track_ranks: [
              {
                rank: { rank: 1, rank_type: 'up', rank_delta: '2' },
                track: { entity: { track_wrapper: { track: trackEntity('7001') } } },
              },
              {
                rank: { rank: 2, rank_type: 'flat', rank_delta: '0' },
                track: { ranked_track: { track: trackEntity('7002') } },
              },
            ],
          },
        })
      // 最近播放：真数据在 `/luna/me/recently-played`（曲目表，游标是偏移量的字符串）
      case url.pathname === '/luna/me/recently-played' && method === 'GET': {
        const from = Number(url.searchParams.get('cursor') ?? 0) || 0
        const size = Number(url.searchParams.get('count') ?? 20) || 20
        const slice = recent.slice(from, from + size)
        return jsonResponse({
          status_info: {},
          tracks: slice.map((id) => trackEntity(id)),
          has_more: from + size < recent.length,
          next_cursor: String(from + size),
          total_num: recent.length,
        })
      }
      // 同一首歌重复播只留最新一条，所以插到表头
      case url.pathname === '/luna/me/recently-played' && method === 'POST': {
        for (const id of idsFromBody(body, 'track_ids')) {
          const at = recent.indexOf(id)
          if (at >= 0) recent.splice(at, 1)
          recent.unshift(id)
        }
        return jsonResponse({ status_info: {} })
      }
      case url.pathname === '/luna/me/recently-played/delete': {
        const ids = idsFromBody(body, 'track_ids')
        for (const id of ids) {
          const at = recent.indexOf(id)
          if (at >= 0) recent.splice(at, 1)
        }
        return jsonResponse({ status_info: {}, deleted_track_ids: ids })
      }
      // 实测：这张 media 表同一账号在登录态下只回 `{}`，`{}` 就是它的真实形态
      case url.pathname === '/luna/pc/me/recently-played-media':
        return jsonResponse({})
      // 关注/取关：IDL 标了 `pcVariant`，客户端发的其实是 `/luna/pc/...` 那条，两条都认
      case /^\/luna\/(pc\/)?me\/collection\/artist$/.test(url.pathname) && method === 'POST': {
        for (const id of idsFromBody(body, 'artist_ids')) followed.add(id)
        return jsonResponse({ status_info: {}, artist_ids: [...followed] })
      }
      case /^\/luna\/(pc\/)?me\/collection\/artist\/delete$/.test(url.pathname): {
        const ids = idsFromBody(body, 'artist_ids')
        for (const id of ids) followed.delete(id)
        return jsonResponse({
          status_info: {},
          deleted_artists: ids,
          deleted_artist_status: Object.fromEntries(ids.map((id) => [id, 0])),
        })
      }
      // 关注艺人的读：`me` 与 `user` 两条路由实测回同一个形状；空表时上游连 `artists`/`total_num` 都不给
      case /^\/luna\/(pc\/)?(me|user)\/collection\/artist$/.test(url.pathname) && method === 'GET': {
        const items = [...followed].map((id) => ({
          id,
          name: `艺人 ${id.slice(-4)}`,
          simple_display_name: `艺人 ${id.slice(-4)}`,
          count_albums: 3,
          count_tracks: 40,
          state: { is_collected: true, follow_status: 1, blocked_by_me: false },
        }))
        return jsonResponse({
          status_info: {},
          artists: items.length ? items : undefined,
          total_num: items.length || undefined,
          next_cursor: items.length ? '1774117995_0' : undefined,
        })
      }
      default:
        return jsonResponse({ status_code: 0, status_info: { log_id: 'mock' } })
    }
  }

  return {
    fetchImpl,
    calls,
    count: () => calls.length,
    resetCalls: () => {
      calls.length = 0
    },
    liked: () => [...liked],
    recent: () => [...recent],
    followed: () => [...followed],
    audioBytes,
  }
}
