/**
 * 推荐请求的「播放过的媒体」种子（goapi `media.MediaPlayed`）。
 *
 * 官方 App 的 `getMediaPlayed()`（反编译 `reaSodaMusic`：
 * `recovered/src/services/queue/queueItemUnlimited.ts`）是**单一实现**，三处共用：
 * `FeedSongTab`（推荐流）、`FeedSongTab` 场景档（听歌模式）、`GetRelatedMedia`（相似/搜索推荐）。
 * 口径拆开看是两段：
 *
 *  1. **待播队列**：当前曲目之后、按播放顺序逆序，`played_mills: -1`（还没播）；
 *  2. **播放记录**：最近的在前，`played_mills` 填实际听了多久；
 *  3. 两段拼起来截断到 **30 条**（`MAX_COUNT`）。
 *
 * 官方 App 的「播放记录」是本地播放器存储；本项目按需求做**云端 + 本地混合**：
 * 云端 `GetRecentPlayedTracks`（账号级、跨设备，登录态才有）在前，
 * 本地 `journal/plays.jsonl`（这台机器放过什么，未登录也有）里云端没有的按时间补在后。
 * 去重按 `media_id`，先出现的赢。
 */

import type { QishuiCore } from './core.js'
import type { PlayRecord } from './history.js'
import type { TrackData } from './types.js'

/** 一条播放过的媒体种子（= goapi `media.MediaPlayed`，字段名用上游的 snake_case） */
export interface MediaPlayedSeed {
  media_id: string
  type: string
  /** 整曲时长（**秒**，上游就是这个单位；本地记录是 ms，这里换过） */
  duration?: number
  /** 已听时长（毫秒）；`-1` = 队列里还没播（App 对「待播」就是这么标） */
  played_mills?: number
}

/** 与 App 的 `getMediaPlayed()` 一致：一次最多 30 条 */
export const PLAYED_MEDIA_MAX = 30

export interface PlayedMediaOptions {
  /** 最多几条，默认 `PLAYED_MEDIA_MAX`（30） */
  limit?: number
  /** 带待播队列（当前曲目之后、逆序）—— 默认带 */
  includeQueue?: boolean
  /** 带云端最近播放（`GetRecentPlayedTracks`）—— 默认带，未登录/失败自动跳过 */
  includeCloud?: boolean
  /** 带本地播放历史（`journal/plays.jsonl`）—— 默认带 */
  includeLocal?: boolean
}

function fromTrack(track: TrackData, playedMills?: number): MediaPlayedSeed {
  const seed: MediaPlayedSeed = { media_id: track.id, type: track.mediaType ?? 'track' }
  if (typeof track.durationMs === 'number' && track.durationMs > 0) seed.duration = Math.floor(track.durationMs / 1000)
  if (playedMills !== undefined) seed.played_mills = playedMills
  return seed
}

function fromRecord(record: PlayRecord): MediaPlayedSeed {
  const seed: MediaPlayedSeed = { media_id: record.trackId, type: 'track' }
  if (typeof record.durationMs === 'number' && record.durationMs > 0)
    seed.duration = Math.floor(record.durationMs / 1000)
  // 本地记录里的「听了多久」可能缺（老记录没这个字段），缺就按 0 报，不编一个数
  seed.played_mills = record.playedMs ?? 0
  return seed
}

/**
 * 构建推荐请求的 `played_media` 种子（App 口径 + 云端/本地混合）。
 *
 * 顺序：**待播队列（逆序，`played_mills: -1`）→ 云端最近播放（新→旧）→ 本地历史（云端没有的，新→旧）**，
 * 去重后截断到 `limit`（默认 30）。云端那半需要登录态；拿不到就只剩本地，不抛错、不阻断推荐。
 */
export async function buildPlayedMedia(core: QishuiCore, opts: PlayedMediaOptions = {}): Promise<MediaPlayedSeed[]> {
  const limit = Math.max(0, opts.limit ?? PLAYED_MEDIA_MAX)
  if (limit === 0) return []

  const out: MediaPlayedSeed[] = []
  const seen = new Set<string>()
  const push = (seed: MediaPlayedSeed): void => {
    if (!seed.media_id || seen.has(seed.media_id)) return
    seen.add(seed.media_id)
    out.push(seed)
  }

  // 1) 待播队列：当前曲目之后、逆序（App: unplayed 放最前，played_mills: -1）
  if (opts.includeQueue !== false) {
    const queue = core.player.queue
    const order = queue.playOrder
    if (queue.index >= 0) {
      for (const track of order.slice(queue.index + 1).reverse()) push(fromTrack(track, -1))
    }
  }

  // 本地历史先读出来：既当「云端没有的补充」，也用来给云端条目补 played_mills / duration
  const local = opts.includeLocal === false ? [] : core.history.recent(Math.max(limit * 4, limit))
  // 同一首听过几次就用**最近那一次**的时长：`recent()` 是新→旧，所以「先见到的赢」。
  // （`new Map(local.map(…))` 会把最旧那条留在最后，补出来的就是几周前那一次听到哪儿。）
  const localByTrack = new Map<string, PlayRecord>()
  for (const record of local) if (!localByTrack.has(record.trackId)) localByTrack.set(record.trackId, record)

  // 2) 云端最近播放（账号级、跨设备，新→旧）；未登录或失败就是这半缺席
  if (opts.includeCloud !== false) {
    try {
      const page = await core.library.recent({ count: limit })
      for (const track of page.items) {
        // 云端没有「听了多久」，本地同曲记录有就补上（App 的 played_mills 就是这个语义）
        push(fromTrack(track, localByTrack.get(track.id)?.playedMs))
      }
    } catch {
      // 匿名/网络失败：不阻断推荐，剩下的交给本地历史
    }
  }

  // 3) 本地历史里云端没有的，按时间新→旧补上（本机放过、但没上报/没登录的那些）
  if (opts.includeLocal !== false) {
    for (const record of local) push(fromRecord(record))
  }

  return out.slice(0, limit)
}
