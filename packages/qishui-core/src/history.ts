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
  /** 播放源：本地缓存 or 远程签名地址 */
  source?: 'cache' | 'remote'
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
 * 这是「听过什么」的真相源；上游的最近播放接口实测写回不落地，不能当依据。
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
