/** 我的：账号（登录/切号/登出）+ 快捷入口 + 我的歌单（动作全在 `Enter` 的操作菜单里） */
import { Box } from 'ink'
import type { Playlist } from 'qishui-core'
import { useMemo, useRef } from 'react'
import { useCore } from '../core/context.js'
import { useUi } from '../ui/context.js'
import { type Entry, type Section, SectionView, useEntries } from '../ui/entries.js'
import { listHeight } from '../ui/layout.js'
import { promptNewPlaylist } from '../ui/playlistActions.js'
import { buildRowActions } from '../ui/rowActions.js'
import { GUTTER } from '../ui/theme.js'
import type { Route } from '../ui/types.js'
import { useAsync } from '../ui/useAsync.js'
import { playlistRow } from '../ui/useList.js'
import { EmptyState, ErrorState, Hints, Loading, PageTitle } from '../ui/widgets.js'

interface LibraryData {
  playlists: Playlist[]
  membership?: { isVip: boolean; vipStage?: string; offers: unknown[] }
}

export function LibraryScreen({ active }: { active: boolean }) {
  const { core, playTracks } = useCore()
  const ui = useUi()
  const loggedIn = core?.loggedIn ?? false
  /** 出声入口：菜单里的「播放整张」走这里（与列表页同一个漏斗） */
  const playRef = useRef(playTracks)
  playRef.current = playTracks

  const data = useAsync<LibraryData>(
    core
      ? async () => {
          if (!loggedIn) return { playlists: [] }
          const [playlists, membership] = await Promise.all([
            core.library.playlists(),
            core.account.membership().catch(() => undefined),
          ])
          return { playlists, membership }
        }
      : undefined,
    `library:${loggedIn ? 'in' : 'out'}:${core?.session.activeUid ?? 'anon'}:${ui.revision}`,
  )

  // biome-ignore lint/correctness/useExhaustiveDependencies: ui.revision 只是「强制重读」的触发器，accounts() 是同步读本地
  const accounts = useMemo(() => core?.accounts() ?? [], [core, ui.revision])

  const snapshot = core?.snapshot()

  const openLogin = (): void => ui.openOverlay({ kind: 'login' })

  const logout = (): void => {
    void (async () => {
      await core?.logout()
      ui.toast('已退出', 'info')
      ui.bump()
    })()
  }

  const switchAccount = (uid: string, nickname?: string): void => {
    void (async () => {
      try {
        // biome-ignore lint/correctness/useHookAtTopLevel: core 的切号方法恰好叫 useAccount（切活跃账号），不是 React hook
        await core?.useAccount(uid)
        ui.toast(`已切换到 ${nickname ?? uid}`, 'success')
        ui.bump()
      } catch (err) {
        ui.toast(err instanceof Error ? err.message : String(err), 'error')
      }
    })()
  }

  /** 账号动作：登录 / 换号 / 退出 / 刷新。原先散在 `l`、`x` 两个键上，现在收进这一行的菜单 */
  const openAccountMenu = (): void => {
    const entries: Entry[] = [
      { key: 'login', label: loggedIn ? '扫码登录（换号 / 补登）' : '扫码登录（全屏二维码）', onEnter: openLogin },
    ]
    if (loggedIn)
      entries.push({
        key: 'logout',
        label: '退出当前账号',
        note: '只清本机 cookie，歌单与收藏不动',
        onEnter: () => {
          ui.closeOverlay()
          logout()
        },
      })
    entries.push({
      key: 'refresh',
      label: '刷新资料 / 会员 / 歌单',
      onEnter: () => {
        ui.closeOverlay()
        ui.bump()
        data.reload()
      },
    })
    if (snapshot?.dataDir)
      entries.push({ key: 'dir', label: `数据目录：${snapshot.dataDir}`, note: '本机路径', disabled: true })
    ui.openOverlay({ kind: 'actions', title: '账号', entries })
  }

  /**
   * 我的歌单的一行：走**同一套**行操作菜单（打开 / 播放整张 / 收藏 / 改名 / 删歌单），
   * 不再给 `e` / `D` 两个只在「我的」页才有意义的散键。
   */
  const openPlaylistMenu = (playlist: Playlist): void => {
    if (!core) {
      ui.toast('core 还没就绪，稍后再试', 'error')
      return
    }
    const actions = buildRowActions({
      ui,
      core,
      row: playlistRow(playlist),
      owned: true,
      afterWrite: () => {
        ui.bump()
        data.reload()
      },
      play: (list, startTrackId) => playRef.current(list, startTrackId),
    })
    ui.openOverlay({ kind: 'actions', title: actions.title, entries: actions.entries })
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: data 与 openXxx 每次渲染都是新引用，跟着进依赖会让分区每帧重建（原账号页同口径）
  const sections = useMemo<Section[]>(() => {
    const push = (route: Route) => ui.push(route)
    const membership = data.data?.membership
    const current: Section = {
      title: '当前账号',
      entries: [
        {
          key: 'state',
          label: loggedIn ? `已登录 ${snapshot?.nickname ?? core?.session.activeUid ?? '（身份未知）'}` : '未登录',
          note: loggedIn ? 'Enter 账号操作（换号 / 退出）' : 'Enter 扫码登录（汽水音乐 App）',
          onEnter: openAccountMenu,
        },
        ...(loggedIn && membership
          ? [
              {
                key: 'vip',
                label: membership.isVip ? `VIP ${membership.vipStage ?? ''}`.trim() : '非会员',
                note: membership.offers.length ? `${membership.offers.length} 个可购套餐` : undefined,
                disabled: true,
              },
            ]
          : []),
      ],
    }
    const accountList: Section = {
      title: '已入库账号',
      entries: accounts.map((account) => ({
        key: `acct:${account.uid}`,
        label: `${account.active ? '* ' : '  '}${account.nickname ?? account.uid}`,
        note: account.active ? '当前' : 'Enter 切换',
        onEnter: account.active ? undefined : () => switchAccount(account.uid, account.nickname),
      })),
    }
    const shortcuts: Section = {
      title: '快捷入口',
      entries: [
        { key: 'liked', label: '我喜欢的音乐', onEnter: () => push({ kind: 'list', source: { kind: 'liked' } }) },
        {
          key: 'recent',
          label: '最近播放',
          note: '登录后走云端',
          onEnter: () => push({ kind: 'list', source: { kind: 'recent' } }),
        },
        { key: 'artists', label: '关注的艺人', onEnter: () => push({ kind: 'list', source: { kind: 'artists' } }) },
        {
          key: 'mixed',
          label: '我的收藏（歌单/专辑）',
          onEnter: () => push({ kind: 'list', source: { kind: 'mixed' } }),
        },
      ],
    }
    const playlists: Section = {
      title: '我的歌单',
      entries: [
        ...(data.data?.playlists ?? []).map((playlist) => ({
          key: `p:${playlist.id}`,
          label: playlist.title,
          note: [playlist.countTracks !== undefined ? `${playlist.countTracks} 首` : undefined, 'Enter 操作']
            .filter(Boolean)
            .join(' · '),
          onEnter: () => openPlaylistMenu(playlist),
        })),
        {
          key: 'new-playlist',
          label: '新建歌单…',
          note: 'N',
          onEnter: () => promptNewPlaylist({ ui, core }),
        },
      ],
    }
    const actions: Section = {
      title: '操作',
      entries: [
        {
          key: 'refresh',
          label: '刷新',
          note: 'R',
          onEnter: () => {
            ui.bump()
            data.reload()
          },
        },
      ],
    }
    const built: Section[] = [current]
    if (accounts.length > 0) built.push(accountList)
    built.push(shortcuts, playlists, actions)
    return built
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.data, core, snapshot, accounts, loggedIn, ui.push])

  const playlistSection = sections.find((s) => s.title === '我的歌单')

  const height = listHeight(ui.rows, 5, 6)
  // 页面级只留两个不会和别处撞的键：`N` 新建、`R` 刷新。
  // 歌单的改名/删除、账号的登录/退出都在 `Enter` 打开的操作菜单里（原先的 `e`/`D`/`l`/`x` 已删）
  const { cursor, setCursor } = useEntries(sections, active, (input) => {
    if (input === 'R') {
      ui.bump()
      data.reload()
      return true
    }
    if (input === 'N') {
      promptNewPlaylist({ ui, core })
      return true
    }
    return false
  })

  return (
    <Box flexDirection="column" flexGrow={1}>
      <PageTitle title="我的" subtitle={loggedIn ? '账号 / 收藏 / 歌单 / 最近' : '未登录（匿名可读发现与搜索）'} />
      {data.status === 'loading' ? <Loading /> : null}
      {data.status === 'error' ? <ErrorState error={data.error ?? '加载失败'} hint="R 重新加载" /> : null}
      {loggedIn && data.status === 'ready' && (playlistSection?.entries.length ?? 0) <= 1 ? (
        <EmptyState message="还没有歌单" hint="按 N 或选中「新建歌单…」" />
      ) : null}
      <SectionView sections={sections} cursor={cursor} height={height} onCursor={setCursor} />
      <Box paddingX={GUTTER}>
        <Hints
          items={[
            ['Enter', '打开 / 操作菜单'],
            ['N', '新建歌单'],
            ['R', '刷新'],
          ]}
        />
      </Box>
    </Box>
  )
}
