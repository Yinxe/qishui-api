/**
 * 离线 mock 上游：按 URL 路由回罐头响应，让 core 的服务/播放器/媒体缓存链路
 * 可以**零真实网络**地测（真打上游的口径验证归 `qishui-api` 实测台）。
 *
 * 覆盖的路由（其余 path 一律回 `{status_code:0}` 兜底）：
 *  - `/service/2/desktop/device_register/` → 固定假设备
 *  - `www.qishui.com/share/track` → 带 `_ROUTER_DATA` 的 SSR 分享页（可播/不可播可切）
 *  - `audio.mock` → 支持 `Range: bytes=N-`（206）的音频字节流
 *  - `/luna/media*`（MGetMedia）→ 按请求里的 id 造完整曲目实体（GET 回空 body，逼出 POST 回退）
 *  - `/luna/me`、`/luna/media-stats`、`/luna/media/related`、`/luna/search/*`、`/luna/playlist/detail`、
 *    `/luna/charts/*`、`/luna/albums/*`、`/luna/artists/*(/tracks|/albums)`
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
}

export interface MockUpstream {
  fetchImpl: typeof fetch
  calls: MockCall[]
  /** 已发生的 fetch 次数 */
  count(): number
  /** 清空调用记录（用于「第二次零请求」断言） */
  resetCalls(): void
  audioBytes: Buffer
}

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

function sharePageHtml(playable: boolean): string {
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
  if (playable) audio.url = mockPlayUrl()
  const data = { loaderData: { track_page: { status_code: 0, audioWithLyricsOption: audio } } }
  return `<!doctype html><html><body><script>window._ROUTER_DATA = ${JSON.stringify(data)}</script></body></html>`
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

export function createMockUpstream(options: MockUpstreamOptions = {}): MockUpstream {
  const playable = options.playable !== false
  const size = options.audioSize ?? 2048
  const audioBytes = Buffer.alloc(size, 0x42)
  const coverBytes = Buffer.alloc(512, 0x11)
  const myInfo = options.myInfo === undefined ? { id: '3617835472921684', nickname: '测试小号' } : options.myInfo
  const calls: MockCall[] = []

  const fetchImpl: typeof fetch = async (input, init) => {
    const url = new URL(String(typeof input === 'string' ? input : ((input as URL).toString ?? String(input))))
    const method = (init?.method ?? 'GET').toUpperCase()
    const body = typeof init?.body === 'string' ? init.body : undefined
    calls.push({ method, url: url.toString(), body })

    if (url.pathname.endsWith('/device_register/')) {
      return jsonResponse({
        device_id_str: MOCK_DEVICE.deviceId,
        install_id_str: MOCK_DEVICE.installId,
        device_token: 'mock-device-token',
        ssid: 'mock',
      })
    }
    if (url.hostname === 'www.qishui.com') {
      return new Response(sharePageHtml(playable), { status: 200, headers: { 'content-type': 'text/html' } })
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
      case url.pathname.startsWith('/luna/search/'):
        return jsonResponse({
          status_code: 0,
          result_groups: [
            {
              id: 'g-track',
              display_title: '单曲',
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
              id: 'g-artist',
              display_title: '歌手',
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
      case url.pathname === '/luna/playlist/detail' || url.pathname === '/luna/pc/playlist/detail':
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
    audioBytes,
  }
}
