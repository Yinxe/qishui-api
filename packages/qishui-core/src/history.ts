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
  /**
   * 这次收听的播放位置（ms），由播放器在**切歌/停播/自然播完/退出**时补进来。
   * 没收尾过（老记录、播到一半被 SIGKILL）就是 `undefined` —— 没有就是没有，不拿 0 冒充「一秒没听」。
   */
  playedMs?: number
  /** 有没有播到曲终（收尾那一刻位置已到时长） */
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

/** 给某次播放补的收尾内容 */
export interface PlaySettlement {
  playedMs?: number
  completed?: boolean
}

/** 文件里的一行：一次播放，或一条 `settle: true` 的收尾行（`read()` 时并回它那一行播放） */
type JournalLine = PlayRecord & { settle?: true }

/** 一次播放的身份：`at` 是开始时刻，同一毫秒同一首才算同一次收听 */
function playKey(row: { at: number; trackId: string }): string {
  return `${row.at}#${row.trackId}`
}

/** 收尾行的序列化形态：`settle: true` + 它补的是哪一次播放 */
function settleLine(record: Pick<PlayRecord, 'at' | 'trackId'>, patch: PlaySettlement): string {
  return JSON.stringify({ settle: true, at: record.at, trackId: record.trackId, ...patch })
}

/** 文件（播放行 + 收尾行都算）涨过两倍上限时裁到最近 MAX_LINES 行 */
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
 *
 * 「听了多久」也走 append-only：播放器收尾时追加一条 `{settle: true, at, trackId, …}` 的补丁行，
 * `read()` 再并回那一次播放。**不回写原行**是因为 CLI 与 TUI 可能同时开着同一个数据目录，
 * 整档重写会互相踩（追加一小行不会）。
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

  /** 给 `append` 返回的那一次播放补收尾（收听时长/有没有听完） */
  async settle(record: Pick<PlayRecord, 'at' | 'trackId'>, patch: PlaySettlement): Promise<void> {
    await ensureDir(this.dir)
    await appendLine(this.file, settleLine(record, patch))
  }

  /**
   * 退出路径上的同步版：`core.dispose()` 之后进程就可能走掉，异步那一笔会在落盘前被丢掉。
   * 出错只咽下——正在退出的路上不该为了补一个时长把栈抛给人。
   */
  settleSync(record: Pick<PlayRecord, 'at' | 'trackId'>, patch: PlaySettlement): void {
    try {
      fs.mkdirSync(this.dir, { recursive: true })
      fs.appendFileSync(this.file, `${settleLine(record, patch)}\n`)
    } catch {
      // 磁盘满了/只读：丢的就是这一次收尾，不值得为此让退出路径炸
    }
  }

  /** 文件里的行（跳过坏行与非播放行）；`read()` 负责把收尾行并回去 */
  private lines(): JournalLine[] {
    const out: JournalLine[] = []
    for (const text of readText(this.file).split('\n')) {
      if (!text.trim()) continue
      try {
        const row = JSON.parse(text) as JournalLine
        if (typeof row?.trackId === 'string' && typeof row?.at === 'number') out.push(row)
      } catch {
        // 半截的行（append 到一半断电）：跳过，不炸整档
      }
    }
    return out
  }

  read(): PlayRecord[] {
    const out: PlayRecord[] = []
    const byPlay = new Map<string, PlayRecord>()
    for (const row of this.lines()) {
      if (row.settle) {
        // 补丁行并回它那一行播放；原行已经被 compact 裁掉时这条没有归属，丢掉
        const target = byPlay.get(playKey(row))
        if (!target) continue
        if (typeof row.playedMs === 'number') target.playedMs = row.playedMs
        if (typeof row.completed === 'boolean') target.completed = row.completed
        continue
      }
      const { settle: _settle, ...record } = row
      byPlay.set(playKey(row), record)
      out.push(record)
    }
    return out
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
