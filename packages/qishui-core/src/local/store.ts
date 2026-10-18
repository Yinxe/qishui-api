import type { CorePaths } from '../paths.js'
import type { TrackData } from '../types.js'
import { readJsonSync, writeJsonAtomic } from '../util.js'

/** 一张本地歌单：`keys` 指向 `tracks` 索引里的键（本地文件 / 云端曲目都能放进来） */
export interface LocalPlaylist {
  id: string
  title: string
  /** 条目键：本地文件是 `local:<hash>`，云端曲目是 `track:<id>`（见 `keyOf`） */
  keys: string[]
  createdAt: number
  updatedAt: number
}

/**
 * 本地库文件（`<数据目录>/local/library.json`）。
 *
 * 三件事一张表：
 *  - `tracks`：**曲目快照索引** —— 本地喜欢与本地歌单只存键，名字/歌手/时长这些从这儿取，
 *    所以列表页不联网也能画（云端曲目也留一份快照，掉线时照样看得见自己收藏了什么）；
 *  - `likes`：本地喜欢（加入顺序，新的在后）；
 *  - `folders`：音乐文件夹的绝对路径，扫描是**按需**做的，不把几万个文件写进这张表。
 */
export interface LocalLibraryFile {
  v: 1
  tracks: Record<string, TrackData>
  likes: string[]
  playlists: LocalPlaylist[]
  folders: string[]
}

export function emptyLibrary(): LocalLibraryFile {
  return { v: 1, tracks: {}, likes: [], playlists: [], folders: [] }
}

/** 把盘上读到的任意形状收拾成可用形状（手改坏了 / 老版本 / 半截文件都不炸） */
function normalize(raw: unknown): LocalLibraryFile {
  const base = emptyLibrary()
  if (!raw || typeof raw !== 'object') return base
  const node = raw as Partial<LocalLibraryFile>
  if (node.tracks && typeof node.tracks === 'object') {
    for (const [key, value] of Object.entries(node.tracks)) {
      if (value && typeof value === 'object' && typeof (value as TrackData).id === 'string') {
        base.tracks[key] = value as TrackData
      }
    }
  }
  if (Array.isArray(node.likes)) base.likes = node.likes.filter((key): key is string => typeof key === 'string')
  if (Array.isArray(node.playlists)) {
    base.playlists = node.playlists
      .filter((item): item is LocalPlaylist => !!item && typeof item === 'object' && typeof item.id === 'string')
      .map((item) => ({
        id: item.id,
        title: typeof item.title === 'string' ? item.title : item.id,
        keys: Array.isArray(item.keys) ? item.keys.filter((key): key is string => typeof key === 'string') : [],
        createdAt: typeof item.createdAt === 'number' ? item.createdAt : Date.now(),
        updatedAt: typeof item.updatedAt === 'number' ? item.updatedAt : Date.now(),
      }))
  }
  if (Array.isArray(node.folders)) base.folders = node.folders.filter((dir): dir is string => typeof dir === 'string')
  return base
}

/**
 * 本地库的落盘层：同步读（第一次读盘，之后吃内存里那份）+ 原子写。
 *
 * 刻意做成同步读：列表页/菜单都要在**同一帧**里知道「这首在不在本地喜欢里」，
 * 一个 await 就会让菜单晚一帧才出来（行操作菜单是同步构造的，见 `ui/rowActions.ts`）。
 */
export class LocalLibraryStore {
  private data?: LocalLibraryFile

  constructor(private readonly paths: CorePaths) {}

  get file(): string {
    return this.paths.localLibraryFile
  }

  /** 内存里那一份（第一次调用时读盘） */
  read(): LocalLibraryFile {
    if (!this.data) this.data = normalize(readJsonSync<LocalLibraryFile>(this.paths.localLibraryFile))
    return this.data
  }

  /** 丢掉内存副本，下次 read() 重新读盘（外部手改过文件时用） */
  reload(): LocalLibraryFile {
    this.data = undefined
    return this.read()
  }

  async write(next: LocalLibraryFile): Promise<void> {
    this.data = next
    await writeJsonAtomic(this.paths.localLibraryFile, next)
  }
}
