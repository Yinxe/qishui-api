/** 页面路由 / 焦点 / 弹层 / 提示的类型（App 与各屏共用） */
import type { SearchType } from 'qishui-core'

export type RootKind = 'discover' | 'listen' | 'queues' | 'search' | 'library' | 'local' | 'settings'

/** 通用列表页的来源参数：一个 ListScreen 覆盖所有「曲目/条目列表」 */
export type ListSource =
  | { kind: 'chart'; id: string }
  | { kind: 'playlist'; id: string }
  | { kind: 'album'; id: string }
  | { kind: 'artist'; id: string; tab: 'hot' | 'tracks' | 'albums' }
  | { kind: 'liked' }
  | { kind: 'recent' }
  | { kind: 'square'; categoryId?: string; categoryName?: string }
  | { kind: 'mixed' }
  | { kind: 'artists' }
  | { kind: 'user-playlists'; uid: string; nickname?: string }
  | { kind: 'user-following'; uid: string; nickname?: string }
  | { kind: 'user-followers'; uid: string; nickname?: string }
  | { kind: 'search'; type: SearchType; query: string }
  | { kind: 'mix'; blockType: string; subChannelId?: string; title?: string }
  /* ---- 本地库（`core.local`，不出网）：本地喜欢 / 本地历史 / 本地歌单 / 音乐文件夹 ---- */
  | { kind: 'local-likes' }
  | { kind: 'local-history' }
  | { kind: 'local-playlist'; id: string }
  | { kind: 'local-folder'; path: string }

export type Route =
  | { kind: 'root'; root: RootKind }
  | { kind: 'list'; source: ListSource }
  | { kind: 'track'; id: string }
  | { kind: 'user'; id: string; nickname?: string }
  | { kind: 'settings' }

export type Overlay =
  | { kind: 'help' }
  | { kind: 'add'; trackIds: string[] }
  | { kind: 'comments'; trackId: string; title: string }
  | { kind: 'confirm'; message: string; hint?: string; onConfirm: () => void }
  | { kind: 'login' }
  /** 单行文本输入（歌单名/改名等） */
  | { kind: 'input'; title: string; label: string; initial?: string; hint?: string; onSubmit: (text: string) => void }
  /** 新建歌单（名字 + 是否私密） */
  | { kind: 'new-playlist'; trackIds?: string[] }
  /** 举报（原因单选） */
  | { kind: 'report'; trackId: string; title: string }
  /** 行操作菜单：条目由 `ui/rowActions.ts` 按行类型在这一刻算好（含收藏状态快照） */
  | { kind: 'actions'; title: string; entries: import('./entries.js').Entry[] }

export type ToastKind = 'info' | 'success' | 'error'
export interface Toast {
  id: number
  message: string
  kind: ToastKind
}

export type Focus = 'sidebar' | 'content'
