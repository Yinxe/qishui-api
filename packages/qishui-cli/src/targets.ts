/**
 * 把命令行上的「播放目标」解析成曲目列表。
 *
 * 支持（`play` / `download` 共用）：
 *   `<id>`                 曲目 id（10~20 位数字）
 *   `track:<id>` `album:<id>` `artist:<id>` `playlist:<id>` `chart:<id>` `radio:<id>` `scene:<id>`
 *   （`radio:` 是电台队列的雪花 id，`scene:` 是听歌模式场景的短数字 `scene_mode_id`，两条不同的路）
 *   `liked`                我喜欢的音乐
 *   `https://…`            分享链接（短链会跟一次跳转）
 *   其它文本               当搜索词（`qishui play 晴天`）
 */
import type { QishuiCore, ShareItem, Track } from 'qishui-core'
import { CliError } from './context.js'
import { dim, info } from './output.js'

export interface TargetOptions {
  /** 每个目标最多取几首（歌单/专辑/艺人钻取时用） */
  limit: number
}

const PREFIXED = /^(track|album|artist|playlist|chart|radio|scene|user|video|ugc_video):(.+)$/i

export async function resolveTargets(core: QishuiCore, targets: string[], opts: TargetOptions): Promise<Track[]> {
  const out: Track[] = []
  for (const target of targets) {
    const tracks = await resolveTarget(core, target, opts)
    if (!tracks.length) info(`${target}：没解析出可播曲目`)
    out.push(...tracks)
  }
  const seen = new Set<string>()
  return out.filter((track) => {
    const id = track.id
    if (!id || seen.has(id)) return false
    seen.add(id)
    return true
  })
}

async function resolveTarget(core: QishuiCore, target: string, opts: TargetOptions): Promise<Track[]> {
  const raw = target.trim()
  if (!raw) return []

  if (raw === 'liked' || raw === '我喜欢的音乐' || raw === '喜欢') {
    return await core.library.likedTracks()
  }

  const prefixed = PREFIXED.exec(raw)
  if (prefixed) {
    return await expand(core, { kind: prefixed[1].toLowerCase(), id: prefixed[2] }, opts)
  }

  // 裸 id / 分享链接（含短链，会走一次重定向）
  const direct = core.link.parse(raw)
  if (direct) return await expand(core, direct, opts)
  if (/^https?:\/\//i.test(raw)) {
    const item = await core.link.resolve(raw)
    return await expand(core, item, opts)
  }

  // 剩下的一律当搜索词：`qishui play 晴天` 直接能播第一条相关的
  info(`${dim(raw)} 不是 id/链接，按搜索词处理`)
  const found = await core.search.tracks(raw)
  return found.slice(0, 1)
}

async function expand(core: QishuiCore, item: ShareItem, opts: TargetOptions): Promise<Track[]> {
  const limit = Math.max(1, opts.limit)
  switch (item.kind) {
    case 'track':
      return [await core.catalog.track(item.id)]
    case 'album': {
      const tracks = await core.catalog.albumTracks(item.id)
      return tracks.slice(0, limit)
    }
    case 'artist': {
      const hot = await core.catalog.artistHotTracks(item.id)
      if (hot.length) return hot.slice(0, limit)
      const paged = await core.catalog.artistTracks(item.id, { count: limit })
      return paged.items.slice(0, limit)
    }
    case 'playlist': {
      const paged = await core.catalog.playlistTracks(item.id, { count: limit })
      return paged.items.slice(0, limit)
    }
    case 'chart': {
      const chart = await core.catalog.chart(item.id)
      return chart.tracks.slice(0, limit)
    }
    case 'radio':
      return (await core.discover.radioTracks(item.id)).slice(0, limit)
    case 'scene': {
      // 场景只认短数字 `scene_mode_id`；走 FeedSongTab 的 feed_preference（radio_id 那条路不认场景）
      const id = Number(item.id)
      if (!Number.isSafeInteger(id) || id <= 0)
        throw new CliError(
          `场景 id 要是短数字：${item.id}`,
          '场景 id 见 `qishui scene`（如 30=日语）；电台队列用 radio:<雪花 id>',
        )
      return (await core.discover.feedModeTracks({ kind: 'scene', sceneModeId: id })).slice(0, limit)
    }
    case 'user':
      throw new CliError('用户不能直接当播放目标', `先看 ta 的歌单：qishui user ${item.id} --playlists`)
    case 'video':
    case 'ugc_video':
      throw new CliError('视频类没有音频源', '分享页对 video/ugc_video 给的是视频地址，本 CLI 只播音频（track）')
    default:
      throw new CliError(`不认识的分享类型：${item.kind}`, '可用的前缀：track/album/artist/playlist/chart/radio/scene')
  }
}
