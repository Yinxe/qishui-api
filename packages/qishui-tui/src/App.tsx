/** 壳：侧边栏 + 顶栏 + 内容 + 播放条 + 提示行 + 全局按键与弹层 */
import { Box, type DOMElement, Text, useStdin } from 'ink'
import { useRef } from 'react'
import { PlayerBar } from './components/PlayerBar.js'
import { NAV_ITEMS, Sidebar } from './components/Sidebar.js'
import { CoreProvider, useCore } from './core/context.js'
import { ActionMenuOverlay } from './overlays/ActionMenu.js'
import { CommentsOverlay } from './overlays/Comments.js'
import { HelpOverlay } from './overlays/Help.js'
import { LoginOverlay } from './overlays/Login.js'
import { AddToPlaylistOverlay, ConfirmOverlay, InputOverlay, NewPlaylistOverlay } from './overlays/Modals.js'
import { NowPlayingOverlay } from './overlays/NowPlaying.js'
import { ReportOverlay } from './overlays/Report.js'
import { DiscoverScreen } from './screens/Discover.js'
import { LibraryScreen } from './screens/Library.js'
import { ListScreen } from './screens/List.js'
import { ListenScreen } from './screens/Listen.js'
import { SearchScreen } from './screens/Search.js'
import { SettingsScreen } from './screens/Settings.js'
import { TrackDetailScreen } from './screens/TrackDetail.js'
import { UserScreen } from './screens/User.js'
import { UiProvider, useUi } from './ui/context.js'
import { useKeys } from './ui/keys.js'
import { isMouseInput, MouseLayer, Pressable } from './ui/mouse.js'
import { COLOR, ERROR_PREFIX, GUTTER } from './ui/theme.js'
import type { RootKind, Route } from './ui/types.js'
import { Hints } from './ui/widgets.js'
import { useFullscreenRows } from './useFullscreenRows.js'

const ROOT_LABEL: Record<RootKind, string> = {
  search: '搜索',
  discover: '发现',
  listen: '听歌',
  library: '我的',
  settings: '设置',
}

/** 面包屑一段：显示文本 + 点它要退到的栈深度 */
interface Crumb {
  label: string
  depth: number
}

function breadcrumbsOf(stack: Route[]): Crumb[] {
  return stack.map((route, depth) => ({
    label:
      route.kind === 'root'
        ? ROOT_LABEL[route.root]
        : route.kind === 'list'
          ? listLabel(route.source.kind)
          : route.kind === 'settings'
            ? '设置'
            : route.kind === 'user'
              ? '用户'
              : '曲目',
    depth,
  }))
}

function listLabel(kind: string): string {
  const map: Record<string, string> = {
    chart: '榜单',
    playlist: '歌单',
    album: '专辑',
    artist: '艺人',
    liked: '我喜欢的音乐',
    recent: '最近播放',
    square: '歌单广场',
    mixed: '我的收藏',
    artists: '关注的艺人',
    'user-playlists': '歌单',
    'user-following': 'TA 的关注',
    'user-followers': 'TA 的粉丝',
    search: '搜索结果',
    mix: '内容块',
  }
  return map[kind] ?? '列表'
}

function Shell() {
  const ui = useUi()
  const { player, toggle, playNext, playPrevious, nudgeSeek, nudgeVolume, cycleRepeat, toggleShuffle } = useCore()
  const { isRawModeSupported } = useStdin()
  const rootRef = useRef<DOMElement>(null)
  const rows = useFullscreenRows(rootRef)

  const interactive = Boolean(isRawModeSupported)

  useKeys(
    (input, key) => {
      if (ui.textFocus) return
      // 鼠标报文（滚轮/点击）不走按键：ink 会把原始报文一并交给 handler，别当成人敲的字
      if (isMouseInput(input)) return

      // 弹层打开时：Esc 关闭，播放键只在「正在播放」里生效
      if (ui.overlay) {
        if (key.escape) {
          ui.closeOverlay()
          return
        }
        if (ui.overlay.kind === 'help' && (input === '?' || input === 'q')) {
          ui.closeOverlay()
          return
        }
      }

      const playbackAllowed = !ui.overlay || ui.overlay.kind === 'now-playing'
      if (playbackAllowed) {
        if (input === ' ') {
          void toggle()
          return
        }
        if (input === 'n') {
          void playNext()
          return
        }
        if (input === 'p') {
          void playPrevious()
          return
        }
        if (input === 's') {
          toggleShuffle()
          return
        }
        if (input === 'r') {
          cycleRepeat()
          return
        }
        if (input === '<') {
          nudgeSeek(-10_000)
          return
        }
        if (input === '>') {
          nudgeSeek(10_000)
          return
        }
        if (input === '+' || input === '=') {
          nudgeVolume(0.05)
          return
        }
        if (input === '-') {
          nudgeVolume(-0.05)
          return
        }
      }

      if (ui.overlay) return

      // 一级导航
      const number = Number.parseInt(input, 10)
      if (!Number.isNaN(number) && number >= 1 && number <= NAV_ITEMS.length) {
        ui.go(NAV_ITEMS[number - 1].root)
        return
      }
      if (input === '0') {
        ui.go('library')
        return
      }
      // `S` 把设置压在当前页之上（Esc 退回原页）；侧边栏第 5 项则直接切过去
      if (input === 'S') {
        ui.push({ kind: 'settings' })
        return
      }
      if (input === '/') {
        ui.go('search')
        return
      }
      if (input === 'f') {
        if (player.track) ui.openOverlay({ kind: 'now-playing' })
        else ui.toast('还没有在播的曲目', 'info')
        return
      }
      if (input === '?') {
        ui.openOverlay({ kind: 'help' })
        return
      }
      if (key.tab) {
        ui.setFocus(ui.focus === 'sidebar' ? 'content' : 'sidebar')
        return
      }
      if (key.escape) {
        if (ui.stack.length > 1) ui.pop()
        else ui.setFocus('sidebar')
        return
      }
      if (input === 'q') {
        ui.quit()
        return
      }
    },
    { isActive: interactive },
  )

  const overlay = ui.overlay
  // login 是唯一真·全屏替换（盖掉侧栏/播放条），不需要保留背景
  const fullscreen = overlay?.kind === 'login'

  return (
    <Box ref={rootRef} width="100%" height={rows} flexDirection="column">
      {fullscreen ? (
        <LoginOverlay />
      ) : (
        <>
          <Header />
          <Box flexGrow={1} flexDirection="row" overflow="hidden">
            {ui.sidebarWidth > 0 ? <Sidebar compact={ui.sidebarWidth <= 4} /> : null}
            <Box flexGrow={1} flexDirection="column" overflow="hidden">
              {/*
                底层页面常驻：弹层开着时不卸载，只收成 0 行 + 关键盘。
                一卸载，关掉弹层就会让 Screen 重新挂载 → useList 重新请求、游标归 0（用户看到的「整页重刷」）。
                保住子树 = 保住已取数据与游标；active 关掉 = 底层自带的 useInput 不和弹层抢方向键。
              */}
              <Box flexDirection="column" flexGrow={overlay ? 0 : 1} height={overlay ? 0 : undefined} overflow="hidden">
                <BaseLayer active={ui.focus === 'content' && !overlay} />
              </Box>
              {overlay ? <OverlayLayer /> : null}
            </Box>
          </Box>
          <PlayerBar />
          <HintBar />
        </>
      )}
    </Box>
  )
}

function Header() {
  const ui = useUi()
  const { core, error, ready, stub } = useCore()
  const crumbs = breadcrumbsOf(ui.stack)
  const account = core?.snapshot()
  const badge = stub
    ? ui.columns >= 60
      ? '骨架模式（QISHUI_TUI_STUB=1）'
      : '骨架'
    : !ready
      ? '启动中…'
      : account?.loggedIn
        ? `${account.nickname ?? account.uid ?? '已登录（身份未知）'}`
        : '未登录'
  return (
    <Box flexShrink={0} paddingX={GUTTER} justifyContent="space-between" gap={1}>
      <Box flexShrink={1}>
        {crumbs.map((crumb, i) => (
          <Pressable key={crumb.depth} onPress={() => ui.popTo(crumb.depth)} active={i < crumbs.length - 1}>
            <Text
              color={i === crumbs.length - 1 ? COLOR.accent : undefined}
              dimColor={i < crumbs.length - 1}
              wrap="truncate-end"
            >
              {`${i > 0 ? ' / ' : ''}${crumb.label}`}
            </Text>
          </Pressable>
        ))}
      </Box>
      <Pressable flexShrink={0} onPress={() => ui.go('library')}>
        <Text color={error ? COLOR.danger : 'gray'} wrap="truncate-end">
          {error ? `${ERROR_PREFIX} ${error}` : badge}
        </Text>
      </Pressable>
    </Box>
  )
}

/** 弹层：盖在常驻页面之上（login 走全屏特例，不会到这里） */
function OverlayLayer() {
  const overlay = useUi().overlay
  if (!overlay) return null
  switch (overlay.kind) {
    case 'help':
      return <HelpOverlay />
    case 'now-playing':
      return <NowPlayingOverlay />
    case 'comments':
      return <CommentsOverlay trackId={overlay.trackId} title={overlay.title} />
    case 'add':
      return <AddToPlaylistOverlay trackIds={overlay.trackIds} />
    case 'confirm':
      return <ConfirmOverlay message={overlay.message} hint={overlay.hint} onConfirm={overlay.onConfirm} />
    case 'input':
      return (
        <InputOverlay
          title={overlay.title}
          label={overlay.label}
          initial={overlay.initial}
          hint={overlay.hint}
          onSubmit={overlay.onSubmit}
        />
      )
    case 'new-playlist':
      return <NewPlaylistOverlay trackIds={overlay.trackIds} />
    case 'report':
      return <ReportOverlay trackId={overlay.trackId} title={overlay.title} />
    case 'actions':
      return <ActionMenuOverlay title={overlay.title} entries={overlay.entries} />
    default:
      return null
  }
}

/** 底层页面：路由对应的屏；窄终端无侧栏且焦点在导航时，用内容区当导航面板 */
function BaseLayer({ active }: { active: boolean }) {
  const ui = useUi()
  if (ui.sidebarWidth === 0 && ui.focus === 'sidebar') {
    return (
      <Box flexDirection="column" paddingX={GUTTER}>
        <Text bold color={COLOR.accent}>
          导航（Enter 进入，Tab 回内容）
        </Text>
        <Sidebar />
      </Box>
    )
  }
  return <Screen route={ui.route} active={active} />
}

function Screen({ route, active }: { route: Route; active: boolean }) {
  if (route.kind === 'list') return <ListScreen source={route.source} active={active} />
  if (route.kind === 'track') return <TrackDetailScreen id={route.id} active={active} />
  if (route.kind === 'user') return <UserScreen id={route.id} nickname={route.nickname} active={active} />
  if (route.kind === 'settings') return <SettingsScreen active={active} />
  switch (route.root) {
    case 'discover':
      return <DiscoverScreen active={active} />
    case 'listen':
      return <ListenScreen active={active} />
    case 'search':
      return <SearchScreen active={active} />
    case 'library':
      return <LibraryScreen active={active} />
    case 'settings':
      return <SettingsScreen active={active} />
    default:
      return null
  }
}

function HintBar() {
  const ui = useUi()
  let items: [string, string][]
  if (ui.overlay) {
    items = [
      ['Esc', '关闭'],
      ['?', '帮助'],
    ]
  } else if (ui.focus === 'sidebar') {
    items = [
      ['↑↓', '选项'],
      ['Enter', '进入'],
      ['Tab', '到内容'],
      ['1–5', '切页'],
      ['0', '我的'],
      ['?', '帮助'],
      ['q', '退出'],
    ]
  } else if (ui.route.kind === 'list') {
    items = [
      ['↑↓', '选行'],
      ['Enter', '操作菜单'],
      ['R', '刷新'],
      ['L', '更多'],
      ['Esc', '返回'],
    ]
  } else if (ui.route.kind === 'settings') {
    items = [
      ['↑↓', '移动'],
      ['Enter', '切换 / 执行'],
      ['R', '刷新'],
      ['Esc', '返回'],
    ]
  } else if (ui.route.kind === 'root' && ui.route.root === 'listen') {
    items = [
      ['↑↓', '选模式'],
      ['Enter', '设为当前并起播'],
      ['R', '刷新'],
      ['Esc', '返回'],
    ]
  } else {
    items = [
      ['↑↓', '移动'],
      ['Enter', '进入'],
      ['f', '正在播放'],
      ['?', '帮助'],
      ['Esc', '返回'],
    ]
  }
  return (
    <Box flexShrink={0} paddingX={GUTTER}>
      <Hints items={items} />
    </Box>
  )
}

export function App() {
  const { isRawModeSupported } = useStdin()
  // 非 TTY：不创建 core（会连网注册设备身份），只画一帧就退出
  if (!isRawModeSupported) return <NonInteractive />
  return (
    // UiProvider 在外层：core 侧的「听歌模式续播」要能 toast（core/context.tsx 用 useUi）
    <UiProvider>
      <CoreProvider>
        <MouseLayer>
          <Shell />
        </MouseLayer>
      </CoreProvider>
    </UiProvider>
  )
}

function NonInteractive() {
  return (
    <Box flexDirection="column" paddingX={GUTTER}>
      <Text dimColor>非交互终端：qishui-tui 需要 TTY（当前 stdin 不是终端）。</Text>
      <Text dimColor>用 `pnpm run tui` 在真终端里跑，或直接看 `qishui --help` 的命令行用法。</Text>
    </Box>
  )
}
