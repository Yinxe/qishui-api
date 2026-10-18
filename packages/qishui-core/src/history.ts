import fs from 'node:fs'
import fsp from 'node:fs/promises'
import type { CorePaths } from './paths.js'
import type { TrackData } from './types.js'
import { appendLine, ensureDir, removeQuiet } from './util.js'

export interface PlayRecord {
  /** 播放开始时刻（ms） */
  at: number
  trackId: string
  name?: string
  artist?: string
  album?: string
  durationMs?: number
  /** 这首歌实际听了多久（暂停/切歌时会把最后的位置补进来） */
  playedMs?: number
  completed?: boolean
  /** 播放源：媒体缓存 / 远程签名地址 / 用户磁盘上的文件（本地库） */
  source?: 'cache' | 'remote' | 'local'
  /** 播放源是磁盘文件时的绝对路径（`source: 'local'`）—— 本地历史据此能重播文件 */
  path?: string
}

export interface PlayStats {
  records: number
  tracks: number
  /** 每个曲目的播放次数，按次数降序 */
  top: { trackId: string; name?: string; plays: number }[]
}

/** 文件涨过两倍上限时裁到最近 MAX_LINES 行 */
const MAX_LINES = 2000

function readText(file: string): string {
  try {
    return fs.readFileSync(file, 'utf8')
  } catch {
    return ''
  }
}

/**
 * 本地播放历史（数据目录下 `journal/plays.jsonl`，一行一次播放，append-only）。
 * 这记的是「这台机器放过什么」；上游那张「最近播放」（`GetRecentPlayedTracks`）是账号级、
 * 跨设备的，两边不是一回事，各自都是自己的真相源。
 * 多账号：`setScope(uid)` 后读写各号自己的 `journal/<uid>/plays.jsonl`，互不串记录。
 */
export class PlayHistory {
  private file: string
  private dir: string

  constructor(private paths: CorePaths) {
    this.file = paths.playsFile
    this.dir = paths.journalDir
  }

  /** 换账号 scope；undefined = 回共享的 legacy 原位 */
  setScope(uid?: string): void {
    this.file = this.paths.journalFileFor(uid)
    this.dir = uid ? this.paths.journalFileFor(uid).replace(/plays\.jsonl$/, '') : this.paths.journalDir
  }

  get scopeFile(): string {
    return this.file
  }

  async append(track: TrackData, extra: Omit<PlayRecord, 'at' | 'trackId'> = {}): Promise<PlayRecord> {
    const record: PlayRecord = {
      at: Date.now(),
      trackId: track.id,
      name: track.name || undefined,
      artist:
        track.artists
          .map((a) => a.name)
          .filter(Boolean)
          .join(',') || undefined,
      album: track.album?.name,
      durationMs: track.durationMs,
      ...extra,
    }
    await ensureDir(this.dir)
    await appendLine(this.file, JSON.stringify(record))
    return record
  }

  read(): PlayRecord[] {
    return readText(this.file)
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line) as PlayRecord
        } catch {
          return undefined
        }
      })
      .filter((record): record is PlayRecord => record !== undefined)
  }

  /** 最近播放（新的在前），可直接喂给「最近听过」页 */
  recent(limit = 50): PlayRecord[] {
    return this.read().slice(-limit).reverse()
  }

  /**
   * 本机最早一条播放记录的时间（ms）—— 没有历史就是 `undefined`。
   *
   * 推荐请求里的 `did_first_use_time`（App 存的是「这台设备第一次用」的时刻）拿它当代理：
   * 我们没把那个值落盘，但「本机第一次播放」是这个口径里最接近、且真实存在的时刻。
   * 注意 `compactIfNeeded()` 会裁掉老记录，裁过之后这里会漂到裁剩下的最早一条。
   */
  firstAt(): number | undefined {
    const first = readText(this.file)
      .split('\n')
      .find((line) => line.trim() !== '')
    if (!first) return undefined
    try {
      const record = JSON.parse(first) as PlayRecord
      return typeof record?.at === 'number' ? record.at : undefined
    } catch {
      return undefined
    }
  }

  stats(): PlayStats {
    const records = this.read()
    const byTrack = new Map<string, { trackId: string; name?: string; plays: number }>()
    for (const record of records) {
      const hit = byTrack.get(record.trackId)
      if (hit) hit.plays++
      else byTrack.set(record.trackId, { trackId: record.trackId, name: record.name, plays: 1 })
    }
    return {
      records: records.length,
      tracks: byTrack.size,
      top: [...byTrack.values()].sort((a, b) => b.plays - a.plays).slice(0, 50),
    }
  }

  async clear(): Promise<void> {
    await removeQuiet(this.file)
  }

  async compactIfNeeded(): Promise<boolean> {
    const lines = readText(this.file)
      .split('\n')
      .filter((line) => line.trim() !== '')
    if (lines.length <= MAX_LINES * 2) return false
    await ensureDir(this.dir)
    await fsp.writeFile(this.file, `${lines.slice(-MAX_LINES).join('\n')}\n`)
    return true
  }
}
