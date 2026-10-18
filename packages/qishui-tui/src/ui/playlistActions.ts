/**
 * 歌单写操作（新建/改名/删除/移除曲目）的共用流程：登录前置检查 → 弹层 → 调 core → toast。
 *
 * 这些是**写接口**，只在用户真的按键时发；返回前把「谁来做后续刷新」交给调用方（onDone）。
 * 歌单相关接口都要会话，匿名时一律先在本地挡住并提示怎么登录，不去撞上游的 1000016。
 */
import type { QishuiCore } from 'qishui-core'
import type { UiValue } from './context.js'

export function requireLogin(ui: UiValue, core: QishuiCore | undefined, what: string): core is QishuiCore {
  if (!core) {
    ui.toast('core 还没就绪，稍后再试', 'error')
    return false
  }
  if (!core.loggedIn) {
    ui.toast(`${what}需要登录（按 0 进「我的」扫码）`, 'error')
    return false
  }
  return true
}

function report(ui: UiValue, err: unknown): void {
  ui.toast(err instanceof Error ? err.message : String(err), 'error')
}

/** 新建歌单（带 trackIds 时顺手加歌） */
export function promptNewPlaylist(opts: { ui: UiValue; core?: QishuiCore; trackIds?: string[] }): void {
  if (!requireLogin(opts.ui, opts.core, '新建歌单')) return
  opts.ui.openOverlay({ kind: 'new-playlist', trackIds: opts.trackIds })
}

/** 改名：先读回当前歌单，把 description/is_private 一起带上，避免上游把没传的字段清空 */
export function promptRenamePlaylist(opts: { ui: UiValue; core?: QishuiCore; id: string; onDone?: () => void }): void {
  const { ui, core, id, onDone } = opts
  if (!requireLogin(ui, core, '改歌单名')) return
  void (async () => {
    try {
      const playlist = await core.catalog.playlist(id)
      ui.openOverlay({
        kind: 'input',
        title: '重命名歌单',
        label: '新名字（Enter 确定，Esc 取消）',
        initial: playlist.title,
        hint: `当前：${playlist.title}`,
        onSubmit: (text) => {
          void (async () => {
            try {
              await core.library.updatePlaylist(id, {
                title: text,
                description: playlist.description,
                isPrivate: playlist.isPrivate,
              })
              ui.toast(`已改名为《${text}》`, 'success')
              ui.bump()
              onDone?.()
            } catch (err) {
              report(ui, err)
            }
          })()
        },
      })
    } catch (err) {
      report(ui, err)
    }
  })()
}

/** 删歌单（上游不可恢复，必须过一次确认框） */
export function confirmDeletePlaylist(opts: {
  ui: UiValue
  core?: QishuiCore
  id: string
  title: string
  onDone?: () => void
}): void {
  const { ui, core, id, title, onDone } = opts
  if (!requireLogin(ui, core, '删歌单')) return
  ui.openOverlay({
    kind: 'confirm',
    message: `删除歌单《${title}》？`,
    hint: '上游不可恢复；歌单里的歌本身不受影响',
    onConfirm: () => {
      void (async () => {
        try {
          await core.library.deletePlaylists([id])
          ui.toast('已删除歌单', 'success')
          ui.bump()
          onDone?.()
        } catch (err) {
          report(ui, err)
        }
      })()
    },
  })
}

/** 从歌单里移除一首（曲目本身不动） */
export function confirmRemoveFromPlaylist(opts: {
  ui: UiValue
  core?: QishuiCore
  playlistId: string
  trackId: string
  name: string
  onDone?: () => void
}): void {
  const { ui, core, playlistId, trackId, name, onDone } = opts
  if (!requireLogin(ui, core, '从歌单移除')) return
  ui.openOverlay({
    kind: 'confirm',
    message: `把《${name}》从这张歌单移除？`,
    hint: '只从歌单里去掉，曲目本身还在',
    onConfirm: () => {
      void (async () => {
        try {
          await core.library.removeFromPlaylist(playlistId, [trackId])
          ui.toast(`已移除：${name}`, 'success')
          ui.bump()
          onDone?.()
        } catch (err) {
          report(ui, err)
        }
      })()
    },
  })
}
