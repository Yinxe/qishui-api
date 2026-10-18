/**
 * 音乐文件夹扫描：把一个目录（含子目录）里的音频文件读成 `TrackData`，一行一个文件。
 *
 * 三条口径：
 *  - **只认文件名**：不引第三方 tag 解析库（core 现在零运行时依赖，不想为 ID3 拉一个进来），
 *    曲名/艺人从文件名猜（`01 - 艺人 - 歌名.flac` / `艺人 - 歌名.mp3`），时长交给播放器报
 *    （TUI 侧 mpv 的 `duration` 会回填 `player.setDuration`）；
 *  - **id 由路径算**：`local:<sha1 前 16 位>`，同一个文件挪了位置就是另一首（这是「文件」不是「曲目」），
 *    路径本身不塞进 id —— 免得队列/日志里出现一整条绝对路径；
 *  - **不跟符号链接**：软链成环会把扫描卡死，`readdir(withFileTypes)` 本来就按 lstat 判类型，直接不跟。
 */
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import type { TrackData } from '../types.js'

/** 认这些扩展名（大小写不敏感）；mpv 能播的音频格式基本都在里头 */
export const AUDIO_EXTENSIONS = [
  '.mp3',
  '.flac',
  '.m4a',
  '.m4b',
  '.aac',
  '.ogg',
  '.oga',
  '.opus',
  '.wav',
  '.wma',
  '.ape',
  '.alac',
  '.aiff',
  '.aif',
  '.dsf',
  '.dff',
  '.wv',
  '.mpc',
  '.mka',
]

/** 单次扫描最多收多少个文件（防着有人指到 `/` 上） */
export const SCAN_MAX_FILES = 5000
/** 子目录最多下钻几层 */
export const SCAN_MAX_DEPTH = 12

export function isAudioFile(file: string): boolean {
  return AUDIO_EXTENSIONS.includes(path.extname(file).toLowerCase())
}

/** 本地文件的稳定键（也是 `TrackData.id`）：`local:<路径 sha1 前 16 位>` */
export function localKeyOf(file: string): string {
  const digest = createHash('sha1').update(path.resolve(file)).digest('hex').slice(0, 16)
  return `local:${digest}`
}

/** `01 - 艺人 - 歌名` → `{ artist, name }`；猜不出艺人就整段当曲名 */
export function parseFileName(base: string): { name: string; artist?: string } {
  let text = base.replace(/\.[^.]+$/, '').trim()
  // 开头的曲序：`01 ` / `01.` / `01 -` / `1_`；纯数字开头但后面没分隔符的不动（`2000 年` 别削成 `0 年`）
  text = text.replace(/^\d{1,3}(?:\s*[.\-_、)]\s*|\s+)/, '').trim() || text
  const parts = text.split(/\s+-\s+/)
  if (parts.length >= 2 && parts[0].trim()) {
    return { artist: parts[0].trim(), name: parts.slice(1).join(' - ').trim() }
  }
  return { name: text }
}

/** 一个音频文件 → 曲目（曲名/艺人猜自文件名，专辑名用所在目录） */
export function trackFromFile(file: string): TrackData {
  const resolved = path.resolve(file)
  const base = path.basename(resolved)
  const { name, artist } = parseFileName(base)
  const folder = path.basename(path.dirname(resolved))
  return {
    id: localKeyOf(resolved),
    name: name || base,
    artists: artist ? [{ id: '', name: artist }] : [],
    album: folder ? { id: '', name: folder } : undefined,
    mediaType: 'local',
    localPath: resolved,
  }
}

export interface ScanOptions {
  /** 最多收多少个文件，默认 `SCAN_MAX_FILES` */
  limit?: number
  /** 最多下钻几层，默认 `SCAN_MAX_DEPTH` */
  maxDepth?: number
}

export interface ScanResult {
  folder: string
  tracks: TrackData[]
  /** 触到上限（没扫完，界面照实说） */
  truncated: boolean
  /** 目录本身读不到（不存在 / 没权限） */
  error?: string
}

/**
 * 递归扫一个目录。顺序是「按路径排序」，让同一张专辑的文件挨在一起、两次扫描结果稳定
 * （列表页的游标/滚动因此不会每次刷新都跳）。
 */
export async function scanFolder(folder: string, opts: ScanOptions = {}): Promise<ScanResult> {
  const root = path.resolve(folder)
  const limit = opts.limit ?? SCAN_MAX_FILES
  const maxDepth = opts.maxDepth ?? SCAN_MAX_DEPTH
  const files: string[] = []
  let truncated = false

  const walk = async (dir: string, depth: number): Promise<void> => {
    if (truncated) return
    let entries: fs.Dirent[]
    try {
      entries = await fsp.readdir(dir, { withFileTypes: true })
    } catch (err) {
      // 子目录读不到就跳过（一个没权限的目录不该毁掉整次扫描），根目录的错由调用方先挡
      if (depth === 0) throw err
      return
    }
    // 目录先按名字排，再按「文件在前、目录在后」走，结果稳定且好读
    entries.sort((a, b) => a.name.localeCompare(b.name))
    for (const entry of entries) {
      if (truncated) return
      if (entry.name.startsWith('.')) continue
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        if (depth + 1 <= maxDepth) await walk(full, depth + 1)
        continue
      }
      if (!entry.isFile()) continue
      if (!isAudioFile(entry.name)) continue
      files.push(full)
      if (files.length >= limit) {
        truncated = true
        return
      }
    }
  }

  try {
    await walk(root, 0)
  } catch (err) {
    return { folder: root, tracks: [], truncated: false, error: err instanceof Error ? err.message : String(err) }
  }
  files.sort((a, b) => a.localeCompare(b))
  return { folder: root, tracks: files.map(trackFromFile), truncated }
}

/** 目录存不存在（文件夹列表要照实说「找不到」） */
export function folderExists(dir: string): boolean {
  try {
    return fs.statSync(dir).isDirectory()
  } catch {
    return false
  }
}
