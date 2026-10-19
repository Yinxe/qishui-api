import { describe, expect, it } from 'vitest'
import { getTrackDetail } from '../dist/index.js'

/** 2026-10 实测的 `/luna/h5/track_v2` 响应骨架（`video_model` 是 JSON 字符串，不是对象） */
function fixture(input: { durationMs: number; clipSeconds: number; previewStart?: number }) {
  const tiers = [
    { quality: 'medium', bitrate: 66160, size: 1550319 },
    { quality: 'higher', bitrate: 132195, size: 3098456 },
    { quality: 'highest', bitrate: 260197, size: 6098643 },
  ]
  return {
    status_info: { now: 1792388902 },
    expire_at: 1792390702,
    track: {
      id: '7081109921765853186',
      name: '太短',
      duration: input.durationMs,
      vid: 'v10ad6g50000c9eihbrc77ufu4uuegpg',
      artists: [{ name: 'IN-K' }, { name: '刘大拿' }],
      album: { id: '7081109926029821954', name: '太短' },
      bit_rates: tiers.map((t) => ({ br: t.bitrate, size: t.size, quality: t.quality })),
      // 整曲可播的曲也带 audition_info，指的是**另一个** vid 的一段试听 —— 不能当本次地址的片段
      audition_info: { vid: 'v02ad6g10000d7l220fog65jv8ovd9j0', start_time_ms: 208320, duration_ms: 30001 },
      preview: { start: input.previewStart, duration: Math.round(input.clipSeconds * 1000) },
      label_info: {
        only_vip_playable: true,
        only_vip_download: true,
        quality_only_vip_can_play: ['lossless'],
        quality_map: {
          medium: {
            play_detail: { condition: 'benefit_play_medium', need_vip: false, need_purchase: false },
            download_detail: { condition: 'benefit_download_medium', need_vip: true, need_purchase: false },
          },
          lossless: {
            play_detail: { condition: 'benefit_play_lossless', need_vip: true, need_purchase: false },
            download_detail: { condition: 'benefit_download_lossless', need_vip: true, need_purchase: false },
          },
        },
      },
    },
    lyric: { type: 1, content: '[17340,1740]<0,210,0>夜<210,390,0>总\n' },
    track_player: {
      expire_at: 1792476081,
      media_id: 'v10ad6g50000cgen0q3c77ucefq83ml0',
      video_model: JSON.stringify({
        status: 10,
        video_id: 'v10ad6g50000cgen0q3c77ucefq83ml0',
        video_duration: input.clipSeconds,
        video_list: tiers.map((t) => ({
          main_url: `https://v26-luna.douyinvod.com/6ad70ef2/video/tos/cn/x?mime_type=audio_mp4&br=${Math.round(t.bitrate / 1000)}`,
          backup_url: 'https://v95-se-luna.douyinvod.com/backup',
          gear_des_key: `0:M4A|1:audio|2:aac|5:${t.quality}`,
          video_meta: {
            quality: t.quality,
            vtype: 'm4a',
            bitrate: t.bitrate,
            real_bitrate: t.bitrate,
            codec_type: 'aac',
            size: t.size,
            audio_sample_rate: '44100',
            file_id: '4a8db35622264d32a7ccb32f230d449f',
            file_hash: '2924e6be14603408971196ec6319b2a4',
          },
        })),
      }),
    },
  }
}

function mockFetch(body: unknown, init: { status?: number; text?: string } = {}) {
  const calls: { url: string; headers: Record<string, string> }[] = []
  const fetchImpl = (async (url: any, options: any) => {
    calls.push({ url: String(url), headers: options?.headers ?? {} })
    return new Response(init.text ?? JSON.stringify(body), {
      status: init.status ?? 200,
      headers: { 'content-type': 'application/json' },
    })
  }) as unknown as typeof fetch
  return { fetchImpl, calls }
}

const CLIP = { durationMs: 187461, clipSeconds: 60.001, previewStart: 0 }

describe('getTrackDetail', () => {
  it('放行条件是 device_platform=web 这个 query，且不注册设备、不带 cookie', async () => {
    const { fetchImpl, calls } = mockFetch(fixture(CLIP))
    await getTrackDetail('7081109921765853186', { fetchImpl })

    const url = new URL(calls[0].url)
    expect(url.pathname).toBe('/luna/h5/track_v2')
    expect(url.searchParams.get('device_platform')).toBe('web')
    expect(url.searchParams.get('track_id')).toBe('7081109921765853186')
    // 公共参数（device_id/iid/aid/version_name…）一个都不带 —— 走 client 那条路要先打 device_register
    expect([...url.searchParams.keys()]).toEqual(['track_id', 'device_platform'])
    expect(calls[0].headers.cookie).toBeUndefined()
    expect(calls[0].headers['user-agent']).toMatch(/^Mozilla\/5\.0/)
  })

  it('上游回 1000062 时如实抛，不粉饰成「不可用」', async () => {
    const { fetchImpl } = mockFetch({
      status_code: 1000062,
      status_info: { status_msg: '应用版本有风险，请从应用商店下载正式版本' },
    })
    await expect(getTrackDetail('123', { fetchImpl })).rejects.toThrow(/1000062.*应用版本有风险/)
  })

  it('空响应体 / 非 JSON / HTTP 错误 / 空 id 都抛错', async () => {
    await expect(getTrackDetail('1', { fetchImpl: mockFetch(null, { text: '' }).fetchImpl })).rejects.toThrow(
      /空响应体/,
    )
    await expect(getTrackDetail('1', { fetchImpl: mockFetch(null, { text: '<html>' }).fetchImpl })).rejects.toThrow(
      /非 JSON/,
    )
    await expect(getTrackDetail('1', { fetchImpl: mockFetch(null, { status: 500 }).fetchImpl })).rejects.toThrow(
      /HTTP 500/,
    )
    await expect(getTrackDetail('  ')).rejects.toThrow(/缺少 track_id/)
  })

  it('试听片段：clip 为真，起点取 preview（audition_info 说的是另一个 vid 时不信它）', async () => {
    const d = await getTrackDetail('1', { fetchImpl: mockFetch(fixture(CLIP)).fetchImpl })
    expect(d.clip).toBe(true)
    expect(d.clip_duration_ms).toBe(60001)
    expect(d.clip_start_ms).toBe(0)
    expect(d.duration_ms).toBe(187461)
  })

  it('整曲可播：clip 为假，片段字段缺省，档位全给（分享页 SSR 只给一条 higher）', async () => {
    const d = await getTrackDetail('1', {
      fetchImpl: mockFetch(fixture({ durationMs: 291818, clipSeconds: 291.819, previewStart: 208320 })).fetchImpl,
    })
    expect(d.clip).toBe(false)
    expect(d.clip_start_ms).toBeUndefined()
    expect(d.clip_duration_ms).toBeUndefined()
    expect(d.qualities.map((q) => q.quality)).toEqual(['highest', 'higher', 'medium'])
    expect(d.qualities[0]).toMatchObject({ duration_ms: 291819, bytes: 6098643, codec_type: 'aac', container: 'm4a' })
  })

  it('拿不到地址长度时按片段处理（宁可保守，别让播放页把半首歌当整曲）', async () => {
    const bad = fixture(CLIP)
    bad.track_player.video_model = JSON.stringify({ status: 10, video_list: [] })
    const d = await getTrackDetail('1', { fetchImpl: mockFetch(bad).fetchImpl })
    expect(d.clip).toBe(true)
    expect(d.qualities).toEqual([])
  })

  it('权益矩阵与声明档位分开透出：lossless 只在声明里，不在可取地址里', async () => {
    const d = await getTrackDetail('1', { fetchImpl: mockFetch(fixture(CLIP)).fetchImpl })
    expect(d.only_vip_playable).toBe(true)
    expect(d.entitlements?.lossless).toMatchObject({ play: { need_vip: true }, download: { need_vip: true } })
    expect(d.entitlements?.medium?.play?.need_vip).toBe(false)
    expect(d.declared_qualities?.map((q) => q.quality)).toEqual(['medium', 'higher', 'highest'])
    expect(d.qualities.map((q) => q.quality)).not.toContain('lossless')
  })

  it('地址过期时间优先用 track_player 的，歌词解析成结构化 KRC', async () => {
    const d = await getTrackDetail('1', { fetchImpl: mockFetch(fixture(CLIP)).fetchImpl })
    expect(d.expires_at).toBe(1792476081)
    expect(d.mime_type).toBe('audio_mp4')
    expect(d.lyrics?.sentences[0]).toMatchObject({ text: '夜总', start_ms: 17340 })
    expect(d.artist).toBe('IN-K,刘大拿')
    expect(d.album).toEqual({ id: '7081109926029821954', name: '太短' })
  })

  it('显式传 cookie 才带上（会员态是否放行未验证，不默认发会话）', async () => {
    const { fetchImpl, calls } = mockFetch(fixture(CLIP))
    await getTrackDetail('1', { fetchImpl, cookie: 'sessionid=abc' })
    expect(calls[0].headers.cookie).toBe('sessionid=abc')
  })

  it('响应里没有 track 就是改版/拒答，报清楚', async () => {
    await expect(
      getTrackDetail('1', { fetchImpl: mockFetch({ status_code: 0, status_info: {} }).fetchImpl }),
    ).rejects.toThrow(/没有 track/)
  })
})
