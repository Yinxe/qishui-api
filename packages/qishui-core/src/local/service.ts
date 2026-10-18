/**
 * 本地库：**不联网**的那一半音乐 —— 本地喜欢、本地歌单、音乐文件夹，再加上播放历史（复用 journal）。
 *
 * 与账号侧的分工（两边都是自己的真相源，互不冒充）：
 *  - 账号的「我喜欢的音乐 / 我的歌单」在上游，换设备能带走，但**要登录、要联网**；
 *  - 这里的本地喜欢 / 本地歌单只在本机 `local/library.json`，匿名也能用，谁登录都看见同一份；
 *  - 播放历史（`history.ts` 的 `journal/*.jsonl`）本来就是「这台机器放过什么」，这里只是给它一个曲目视图。
 *
 * 曲目键（`keyOf`）只有两种：本地文件 `local:<路径 sha1>`、云端曲目 `track:<id>`。
 * 所以「本地喜欢」里可以同时躺着磁盘上的文件和云端曲目的快照 —— 后者离线时照样看得见、点得开
 * （真播还得联网，界面会照实报错，不假装能播）。
 */
import fs from 'node:fs'
import path from 'node:path'
import type { PlaySource } from '../cache/media.js'
import type { QishuiCore } from '../core.js'
import { Track } from '../entities.js'
import { CoreError } from '../errors.js'
import type { TrackData } from '../types.js'
import { folderExists, localKeyOf, type ScanOptions, type ScanResult, scanFolder } from './scan.js'
import { type LocalLibraryFile, LocalLibraryStore, type LocalPlaylist } from './store.js'

export interface LocalFolder {
  /** 绝对路径（原样存原样显示，不做缩写） */
  path: string
  /** 末级目录名（列表里当标题用） */
  name: string
  /** 现在还找得到吗 */
  exists: boolean
}

export interface LocalScanSummary {
  folder: string
  count: number
  truncated: boolean
  error?: string
}

export interface LocalStats {
  likes: number
  playlists: number
  folders: number
  /** 本地库索引里记着的曲目快照数（不等于磁盘上的文件数） */
  tracks: number
  file: string
}

/** 入参既可以是实体也可以是裸数据（两个前端都顺手） */
type TrackLike = TrackData | Track | { data: TrackData }

function dataOf(input: TrackLike): TrackData {
  return 'data' in input ? input.data : input
}

/** 存快照：`raw` 是上游原始响应（可能几十 KB），本地库不要它；`state` 是「我」态水印，会过期 */
function snapshotOf(track: TrackData): TrackData {
  const { raw: _raw, state: _state, ...rest } = track
  return { ...rest, state: undefined }
}

/** `~/Music` 这种写法展开成绝对路径；其它原样解析 */
export function resolveFolderInput(input: string): string {
  const text = input.trim()
  if (!text) return ''
  if (text === '~') return path.resolve(process.env.HOME ?? '')
  if (text.startsWith('~/')) return path.resolve(path.join(process.env.HOME ?? '', text.slice(2)))
  return path.resolve(text)
}

export class LocalService {
  readonly store: LocalLibraryStore

  constructor(private readonly core: QishuiCore) {
    this.store = new LocalLibraryStore(core.paths)
  }

  /** 本地库文件路径（界面里给人看） */
  get file(): string {
    return this.store.file
  }

  /** 整份本地库（同步；第一次读盘） */
  library(): LocalLibraryFile {
    return this.store.read()
  }

  stats(): LocalStats {
    const lib = this.store.read()
    return {
      likes: lib.likes.length,
      playlists: lib.playlists.length,
      folders: lib.folders.length,
      tracks: Object.keys(lib.tracks).length,
      file: this.file,
    }
  }

  /* ------------------------------------------------------------ 键 */

  /** 曲目的本地库键：磁盘文件按路径，云端曲目按 id */
  keyOf(input: TrackLike): string {
    const track = dataOf(input)
    return track.localPath ? localKeyOf(track.localPath) : `track:${track.id}`
  }

  /* ------------------------------------------------------------ 本地喜欢 */

  /** 本地喜欢（新的在前）。不联网，名字来自入库时的快照 */
  likes(): Track[] {
    const lib = this.store.read()
    return [...lib.likes]
      .reverse()
      .map((key) => lib.tracks[key])
      .filter((data): data is TrackData => !!data)
      .map((data) => new Track(this.core, data))
  }

  likeKeys(): string[] {
    return [...this.store.read().likes]
  }

  isLiked(key: string): boolean {
    return this.store.read().likes.includes(key)
  }

  isTrackLiked(input: TrackLike): boolean {
    return this.isLiked(this.keyOf(input))
  }

  /** 加进本地喜欢（已存在就只刷新快照） */
  async like(input: TrackLike): Promise<void> {
    const track = dataOf(input)
    const key = this.keyOf(track)
    const lib = this.store.read()
    lib.tracks[key] = snapshotOf(track)
    if (!lib.likes.includes(key)) lib.likes = [...lib.likes, key]
    await this.store.write(lib)
  }

  /** 从本地喜欢里去掉；返回它原本在不在 */
  async unlike(key: string): Promise<boolean> {
    const lib = this.store.read()
    if (!lib.likes.includes(key)) return false
    lib.likes = lib.likes.filter((item) => item !== key)
    await this.store.write(lib)
    return true
  }

  /** 切换本地喜欢；返回切换后的状态 */
  async toggleLike(input: TrackLike): Promise<boolean> {
    const key = this.keyOf(input)
    if (this.isLiked(key)) {
      await this.unlike(key)
      return false
    }
    await this.like(input)
    return true
  }

  /* ------------------------------------------------------------ 本地歌单 */

  playlists(): LocalPlaylist[] {
    return [...this.store.read().playlists]
  }

  playlist(id: string): LocalPlaylist | undefined {
    return this.store.read().playlists.find((item) => item.id === id)
  }

  /** 歌单里的曲目（按歌单顺序；快照丢了的条目跳过，不凭空造一首） */
  playlistTracks(id: string): Track[] {
    const lib = this.store.read()
    const playlist = lib.playlists.find((item) => item.id === id)
    if (!playlist) return []
    return playlist.keys
      .map((key) => lib.tracks[key])
      .filter((data): data is TrackData => !!data)
      .map((data) => new Track(this.core, data))
  }

  async createPlaylist(title: string): Promise<LocalPlaylist> {
    const name = title.trim()
    if (!name) throw new CoreError('歌单名不能为空')
    const lib = this.store.read()
    const now = Date.now()
    const playlist: LocalPlaylist = {
      id: `lp-${now.toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      title: name,
      keys: [],
      createdAt: now,
      updatedAt: now,
    }
    lib.playlists = [...lib.playlists, playlist]
    await this.store.write(lib)
    return playlist
  }

  async renamePlaylist(id: string, title: string): Promise<LocalPlaylist> {
    const name = title.trim()
    if (!name) throw new CoreError('歌单名不能为空')
    const lib = this.store.read()
    const playlist = lib.playlists.find((item) => item.id === id)
    if (!playlist) throw new CoreError(`没有这张本地歌单：${id}`)
    playlist.title = name
    playlist.updatedAt = Date.now()
    await this.store.write(lib)
    return playlist
  }

  async deletePlaylist(id: string): Promise<boolean> {
    const lib = this.store.read()
    const before = lib.playlists.length
    lib.playlists = lib.playlists.filter((item) => item.id !== id)
    if (lib.playlists.length === before) return false
    await this.store.write(lib)
    return true
  }

  /** 加曲目进歌单（已存在的不重复加）；返回实际新加了几首 */
  async addToPlaylist(id: string, tracks: TrackLike[]): Promise<number> {
    const lib = this.store.read()
    const playlist = lib.playlists.find((item) => item.id === id)
    if (!playlist) throw new CoreError(`没有这张本地歌单：${id}`)
    let added = 0
    for (const input of tracks) {
      const track = dataOf(input)
      const key = this.keyOf(track)
      lib.tracks[key] = snapshotOf(track)
      if (playlist.keys.includes(key)) continue
      playlist.keys = [...playlist.keys, key]
      added++
    }
    playlist.updatedAt = Date.now()
    await this.store.write(lib)
    return added
  }

  /** 从歌单里移除一条（曲目快照本身留着：本地喜欢里可能还用它） */
  async removeFromPlaylist(id: string, key: string): Promise<boolean> {
    const lib = this.store.read()
    const playlist = lib.playlists.find((item) => item.id === id)
    if (!playlist) return false
    if (!playlist.keys.includes(key)) return false
    playlist.keys = playlist.keys.filter((item) => item !== key)
    playlist.updatedAt = Date.now()
    await this.store.write(lib)
    return true
  }

  /* ------------------------------------------------------------ 音乐文件夹 */

  folders(): LocalFolder[] {
    return this.store.read().folders.map((dir) => ({
      path: dir,
      name: path.basename(dir) || dir,
      exists: folderExists(dir),
    }))
  }

  /** 加一个音乐文件夹（去重；目录不存在直接报错，不静默收下一条死路径） */
  async addFolder(input: string): Promise<LocalFolder> {
    const dir = resolveFolderInput(input)
    if (!dir) throw new CoreError('文件夹路径不能为空')
    if (!folderExists(dir)) throw new CoreError(`找不到这个目录：${dir}`)
    const lib = this.store.read()
    if (!lib.folders.includes(dir)) {
      lib.folders = [...lib.folders, dir]
      await this.store.write(lib)
    }
    return { path: dir, name: path.basename(dir) || dir, exists: true }
  }

  async removeFolder(input: string): Promise<boolean> {
    const dir = resolveFolderInput(input)
    const lib = this.store.read()
    const before = lib.folders.length
    lib.folders = lib.folders.filter((item) => item !== dir)
    if (lib.folders.length === before) return false
    await this.store.write(lib)
    return true
  }

  /** 扫一个目录（按需，不落盘：文件几万个也不该塞进 library.json） */
  async scan(dir: string, opts: ScanOptions = {}): Promise<ScanResult> {
    return await scanFolder(resolveFolderInput(dir), opts)
  }

  /** 把登记的文件夹都扫一遍（一个目录出错不影响其它目录） */
  async scanAll(opts: ScanOptions = {}): Promise<LocalScanSummary[]> {
    const out: LocalScanSummary[] = []
    for (const folder of this.store.read().folders) {
      const result = await scanFolder(folder, opts)
      out.push({
        folder: result.folder,
        count: result.tracks.length,
        truncated: result.truncated,
        error: result.error,
      })
    }
    return out
  }

  /* ------------------------------------------------------------ 播放历史（曲目视图） */

  /**
   * 本地播放历史的曲目视图（新的在前）：**纯本地拼装，不发一个请求**。
   * 名字/艺人/时长优先用本地库里的快照，没有再退回 journal 那一行记下的字段。
   */
  history(limit = 100): Track[] {
    const lib = this.store.read()
    return this.core.history.recent(limit).map((record) => {
      const key = record.path ? localKeyOf(record.path) : `track:${record.trackId}`
      const known = lib.tracks[key]
      if (known) return new Track(this.core, { ...known, localPath: known.localPath ?? record.path })
      return new Track(this.core, {
        id: record.trackId,
        name: record.name ?? record.trackId,
        artists: record.artist ? [{ id: '', name: record.artist }] : [],
        album: record.album ? { id: '', name: record.album } : undefined,
        durationMs: record.durationMs,
        mediaType: record.path ? 'local' : undefined,
        localPath: record.path,
      })
    })
  }

  /** 清空本地播放历史（只动这台机器的 journal，不碰上游「最近播放」） */
  async clearHistory(): Promise<void> {
    await this.core.history.clear()
  }

  /**
   * 播放器报回来的真实时长回填到本地库快照（只在曲目已经在库里时才写：喜欢/歌单/历史里出现过）。
   * 扫描不解析 ID3，时长本来只能靠播放时问出来 —— 回填一次，之后列表里就有真时长。
   */
  async rememberDuration(input: TrackLike, durationMs: number): Promise<boolean> {
    if (!Number.isFinite(durationMs) || durationMs <= 0) return false
    const key = this.keyOf(input)
    const lib = this.store.read()
    const known = lib.tracks[key]
    if (!known) return false
    const rounded = Math.round(durationMs)
    if (known.durationMs === rounded) return false
    lib.tracks[key] = { ...known, durationMs: rounded }
    await this.store.write(lib)
    return true
  }

  /* ------------------------------------------------------------ 播放源 */

  /**
   * 本地曲目的播放源：直接把磁盘路径交出去（上层 mpv 认 `kind: 'local'`）。
   * 文件被删了就在这里说清楚，不去撞上游的分享页。
   */
  sourceFor(input: TrackLike): PlaySource {
    const track = dataOf(input)
    const file = track.localPath
    if (!file) throw new CoreError(`不是本地曲目：${track.name || track.id}`)
    if (!fs.existsSync(file)) throw new CoreError(`本地文件不在了：${file}`)
    return { track, kind: 'local', path: file, fromCache: true }
  }
}
