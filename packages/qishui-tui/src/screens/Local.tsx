/**
 * 本地：**这台机器自己的音乐** —— 本地喜欢 / 本地历史 / 本地歌单 / 音乐文件夹，一页收齐。
 *
 * 与「我的」的分工（两个真相源，各管各的）：
 *  - 「我的」= 账号侧（我喜欢的音乐、云端歌单、云端最近播放），要登录、要联网；
 *  - 「本地」= `core.local` + 播放历史 journal，**不出网、匿名也能用**，谁登录都看见同一份。
 *
 * 全部数据都是同步读（本地库在内存里、历史读一个 jsonl），所以这页不用 `useAsync`：
 * `ui.revision` 一变就重读，写完 `bump()` 立刻见到结果。
 */
import { Box } from 'ink'
import type { LocalFolder, LocalPlaylist, Track } from 'qishui-core'
import { useMemo, useRef } from 'react'
import { useCore } from '../core/context.js'
import { useUi } from '../ui/context.js'
import { type Entry, type Section, SectionView, useEntries } from '../ui/entries.js'
import { truncate } from '../ui/format.js'
import { listHeight } from '../ui/layout.js'
import { GUTTER } from '../ui/theme.js'
import type { Route } from '../ui/types.js'
import { EmptyState, Hints, PageTitle } from '../ui/widgets.js'

interface LocalData {
  likes: Track[]
  history: Track[]
  playlists: LocalPlaylist[]
  folders: LocalFolder[]
  /** 本地库文件路径（界面里给人看） */
  file: string
}

export function LocalScreen({ active }: { active: boolean }) {
  const { core, playTracks } = useCore()
  const ui = useUi()
  const playRef = useRef(playTracks)
  playRef.current = playTracks

  // biome-ignore lint/correctness/useExhaustiveDependencies: ui.revision 只是「强制重读」的触发器（本地库是同步读）
  const data = useMemo<LocalData | undefined>(() => {
    if (!core) return undefined
    return {
      likes: core.local.likes(),
      history: core.local.history(200),
      playlists: core.local.playlists(),
      folders: core.local.folders(),
      file: core.local.file,
    }
  }, [core, ui.revision])

  const fail = (err: unknown): void => ui.toast(err instanceof Error ? err.message : String(err), 'error')
  /** 先关菜单再执行（否则 toast 被菜单挡着），与行操作菜单同一口径 */
  const act =
    (run: () => void): (() => void) =>
    () => {
      ui.closeOverlay()
      run()
    }

  /* ------------------------------------------------------------ 写操作（本地库，不需要登录） */

  const promptNewPlaylist = (): void => {
    if (!core) {
      ui.toast('core 还没就绪，稍后再试', 'error')
      return
    }
    ui.openOverlay({
      kind: 'input',
      title: '新建本地歌单',
      label: '歌单名（Enter 确定，Esc 取消）',
      hint: '只在这台机器上，匿名也能用',
      onSubmit: (text) => {
        void (async () => {
          try {
            const playlist = await core.local.createPlaylist(text)
            ui.toast(`已新建本地歌单《${playlist.title}》`, 'success')
            ui.bump()
          } catch (err) {
            fail(err)
          }
        })()
      },
    })
  }

  const promptRenamePlaylist = (playlist: LocalPlaylist): void => {
    if (!core) {
      ui.toast('core 还没就绪，稍后再试', 'error')
      return
    }
    ui.openOverlay({
      kind: 'input',
      title: '重命名本地歌单',
      label: '新名字（Enter 确定，Esc 取消）',
      initial: playlist.title,
      hint: `当前：${playlist.title}`,
      onSubmit: (text) => {
        void (async () => {
          try {
            await core.local.renamePlaylist(playlist.id, text)
            ui.toast(`已改名为《${text}》`, 'success')
            ui.bump()
          } catch (err) {
            fail(err)
          }
        })()
      },
    })
  }

  const confirmDeletePlaylist = (playlist: LocalPlaylist): void => {
    if (!core) {
      ui.toast('core 还没就绪，稍后再试', 'error')
      return
    }
    ui.openOverlay({
      kind: 'confirm',
      message: `删除本地歌单《${playlist.title}》？`,
      hint: '只删这张表，磁盘上的音频文件不动',
      onConfirm: () => {
        void (async () => {
          try {
            await core.local.deletePlaylist(playlist.id)
            ui.toast('已删除本地歌单', 'success')
            ui.bump()
          } catch (err) {
            fail(err)
          }
        })()
      },
    })
  }

  const promptAddFolder = (): void => {
    if (!core) {
      ui.toast('core 还没就绪，稍后再试', 'error')
      return
    }
    ui.openOverlay({
      kind: 'input',
      title: '添加音乐文件夹',
      label: '目录路径（Enter 确定，Esc 取消）',
      initial: process.cwd(),
      hint: '支持 ~/Music 写法；扫这个目录及其子目录里的音频文件',
      onSubmit: (text) => {
        void (async () => {
          try {
            const folder = await core.local.addFolder(text)
            ui.toast(`已添加文件夹：${folder.path}`, 'success')
            ui.bump()
          } catch (err) {
            fail(err)
          }
        })()
      },
    })
  }

  const confirmRemoveFolder = (folder: LocalFolder): void => {
    if (!core) {
      ui.toast('core 还没就绪，稍后再试', 'error')
      return
    }
    ui.openOverlay({
      kind: 'confirm',
      message: `把文件夹移出本地列表？`,
      hint: `${folder.path}（只从列表里去掉，磁盘文件不动）`,
      onConfirm: () => {
        void (async () => {
          try {
            await core.local.removeFolder(folder.path)
            ui.toast('已移出文件夹列表', 'success')
            ui.bump()
          } catch (err) {
            fail(err)
          }
        })()
      },
    })
  }

  const confirmClearHistory = (): void => {
    if (!core) {
      ui.toast('core 还没就绪，稍后再试', 'error')
      return
    }
    ui.openOverlay({
      kind: 'confirm',
      message: '清空本地播放历史？',
      hint: '只清这台机器的 journal，云端「最近播放」不动',
      onConfirm: () => {
        void (async () => {
          try {
            await core.local.clearHistory()
            ui.toast('已清空本地历史', 'success')
            ui.bump()
          } catch (err) {
            fail(err)
          }
        })()
      },
    })
  }

  /** 扫一遍全部登记的文件夹：把「几个目录、各多少首、哪个目录读不到」如实说出来 */
  const scanAllFolders = (): void => {
    if (!core) {
      ui.toast('core 还没就绪，稍后再试', 'error')
      return
    }
    void (async () => {
      try {
        const summaries = await core.local.scanAll()
        if (!summaries.length) {
          ui.toast('还没有登记任何音乐文件夹', 'info')
          return
        }
        const total = summaries.reduce((sum, item) => sum + item.count, 0)
        const bad = summaries.filter((item) => item.error)
        ui.toast(
          `扫完 ${summaries.length} 个文件夹，共 ${total} 首${bad.length ? `；${bad.length} 个读不到` : ''}`,
          bad.length ? 'info' : 'success',
        )
        ui.bump()
      } catch (err) {
        fail(err)
      }
    })()
  }

  /* ------------------------------------------------------------ 分区 */

  // biome-ignore lint/correctness/useExhaustiveDependencies: data 每次渲染都是新对象；这些回调也是（原「我的」页同口径）
  const sections = useMemo<Section[]>(() => {
    const push = (route: Route) => ui.push(route)

    const openPlaylistMenu = (playlist: LocalPlaylist): void => {
      if (!core) {
        ui.toast('core 还没就绪，稍后再试', 'error')
        return
      }
      const tracks = core.local.playlistTracks(playlist.id)
      const entries: Entry[] = [
        {
          key: 'open',
          label: '打开歌单',
          onEnter: act(() => push({ kind: 'list', source: { kind: 'local-playlist', id: playlist.id } })),
        },
        {
          key: 'play',
          label: '播放整张',
          note: `${tracks.length} 首`,
          onEnter: act(() => {
            if (!tracks.length) return ui.toast('这张本地歌单还是空的', 'info')
            // 本地歌单也是一份独立队列（和云端歌单同一套策略：整张顺序播、各自记位置）
            void playRef.current(
              tracks.map((track) => track.data),
              undefined,
              {
                kind: 'playlist',
                id: `local-playlist:${playlist.id}`,
                title: `本地歌单 · ${playlist.title}`,
                load: async () => tracks.map((track) => track.data),
              },
            )
          }),
        },
        { key: 'rename', label: '改名', onEnter: act(() => promptRenamePlaylist(playlist)) },
        { key: 'delete', label: '删歌单', onEnter: act(() => confirmDeletePlaylist(playlist)) },
      ]
      ui.openOverlay({ kind: 'actions', title: `${playlist.title} 的操作`, entries })
    }

    const openFolderMenu = (folder: LocalFolder): void => {
      if (!core) {
        ui.toast('core 还没就绪，稍后再试', 'error')
        return
      }
      const entries: Entry[] = [
        {
          key: 'open',
          label: '打开（扫这个目录）',
          onEnter: act(() => push({ kind: 'list', source: { kind: 'local-folder', path: folder.path } })),
        },
        {
          key: 'play',
          label: '播放这个文件夹',
          onEnter: act(() => {
            void (async () => {
              try {
                const result = await core.local.scan(folder.path)
                if (result.error) return ui.toast(result.error, 'error')
                if (!result.tracks.length) return ui.toast('这个目录里没找到音频文件', 'info')
                // 扫出来的这一批是浏览型结果 → 临时队列
                await playRef.current(result.tracks, undefined, {
                  kind: 'temporary',
                  title: `临时 · 文件夹 ${folder.path.split('/').pop() || folder.path}`,
                })
                ui.toast(`已起播 ${result.tracks.length} 首`, 'success')
              } catch (err) {
                fail(err)
              }
            })()
          }),
        },
        {
          key: 'rescan',
          label: '重新扫描',
          onEnter: act(() => {
            void (async () => {
              try {
                const result = await core.local.scan(folder.path)
                if (result.error) return ui.toast(result.error, 'error')
                ui.toast(`${result.tracks.length} 首${result.truncated ? '（到上限了，只扫了一部分）' : ''}`, 'success')
                ui.bump()
              } catch (err) {
                fail(err)
              }
            })()
          }),
        },
        { key: 'remove', label: '移出文件夹列表', onEnter: act(() => confirmRemoveFolder(folder)) },
        { key: 'path', label: `路径：${truncate(folder.path, 60)}`, note: '本机路径', disabled: true },
      ]
      ui.openOverlay({ kind: 'actions', title: `${folder.name} 的操作`, entries })
    }

    const likes: Section = {
      title: '本地喜欢',
      entries: [
        {
          key: 'likes',
          label: '本地喜欢',
          note: data ? `${data.likes.length} 首 · Enter 打开` : undefined,
          onEnter: () => push({ kind: 'list', source: { kind: 'local-likes' } }),
        },
      ],
    }

    const history: Section = {
      title: '播放历史',
      entries: [
        {
          key: 'history',
          label: '本地历史',
          note: data ? `${data.history.length} 条 · 这台机器放过什么` : undefined,
          onEnter: () => push({ kind: 'list', source: { kind: 'local-history' } }),
        },
        {
          key: 'clear-history',
          label: '清空本地历史…',
          note: '云端「最近播放」不动',
          onEnter: confirmClearHistory,
        },
      ],
    }

    const playlists: Section = {
      title: '本地歌单',
      entries: [
        ...(data?.playlists ?? []).map((playlist) => ({
          key: `lp:${playlist.id}`,
          label: playlist.title,
          note: `${playlist.keys.length} 首 · Enter 操作`,
          onEnter: () => openPlaylistMenu(playlist),
        })),
        { key: 'new-playlist', label: '新建本地歌单…', note: 'N', onEnter: promptNewPlaylist },
      ],
    }

    const folders: Section = {
      title: '音乐文件夹',
      entries: [
        ...(data?.folders ?? []).map((folder) => ({
          key: `dir:${folder.path}`,
          label: folder.name,
          note: folder.exists ? `${truncate(folder.path, 40)} · Enter 操作` : '找不到这个目录',
          onEnter: () => openFolderMenu(folder),
        })),
        { key: 'add-folder', label: '添加文件夹…', note: 'A', onEnter: promptAddFolder },
        { key: 'scan-all', label: '全部扫描一遍', note: '只报数量，不落盘', onEnter: scanAllFolders },
      ],
    }

    const actions: Section = {
      title: '操作',
      entries: [
        { key: 'refresh', label: '刷新', note: 'R', onEnter: () => ui.bump() },
        { key: 'file', label: `本地库文件：${truncate(data?.file ?? '', 60)}`, note: '本机路径', disabled: true },
      ],
    }

    return [likes, history, playlists, folders, actions]
  }, [data, core, ui.push, ui.bump])

  const height = listHeight(ui.rows, 5, 6)
  const { cursor, setCursor } = useEntries(sections, active, (input) => {
    if (input === 'R') {
      ui.bump()
      return true
    }
    if (input === 'N') {
      promptNewPlaylist()
      return true
    }
    if (input === 'A') {
      promptAddFolder()
      return true
    }
    return false
  })

  const empty = data
    ? !data.likes.length && !data.history.length && !data.playlists.length && !data.folders.length
    : false

  return (
    <Box flexDirection="column" flexGrow={1}>
      <PageTitle
        title="本地"
        subtitle={
          data
            ? `本地喜欢 ${data.likes.length} · 历史 ${data.history.length} · 歌单 ${data.playlists.length} · 文件夹 ${data.folders.length}`
            : '本地库（不出网，匿名可用）'
        }
      />
      {empty ? (
        <EmptyState message="本地库还是空的" hint="按 A 添加一个音乐文件夹，或在任意曲目的菜单里选「本地喜欢」" />
      ) : null}
      <SectionView sections={sections} cursor={cursor} height={height} onCursor={setCursor} />
      <Box paddingX={GUTTER}>
        <Hints
          items={[
            ['Enter', '打开 / 操作菜单'],
            ['N', '新建本地歌单'],
            ['A', '添加文件夹'],
            ['R', '刷新'],
          ]}
        />
      </Box>
    </Box>
  )
}
