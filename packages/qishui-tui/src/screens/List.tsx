/** 通用列表页：所有曲目/条目列表（榜单/歌单/专辑/艺人/搜索/最近/歌单广场…；听歌模式不在这——它走推荐队列） */
import { Box, type DOMElement, Text } from 'ink'
import { useMemo, useRef, useState } from 'react'
import { useCore } from '../core/context.js'
import { useUi } from '../ui/context.js'
import { padRight, truncate } from '../ui/format.js'
import { contentWidth, listHeight } from '../ui/layout.js'
import { Pressable, useRowClick, useWheelScroll } from '../ui/mouse.js'
import { queueSpecOfSource } from '../ui/queues.js'
import { buildRowActions } from '../ui/rowActions.js'
import { COLOR, CURRENT_PREFIX, GUTTER } from '../ui/theme.js'
import type { ListSource } from '../ui/types.js'
import { type ListRow, type SquareCategory, useList } from '../ui/useList.js'
import { EmptyState, ErrorState, Loading, PageTitle, useCursor, windowFor } from '../ui/widgets.js'

/** 歌单广场的分类导航：第一项固定是「全部」 */
const ALL_CATEGORY: SquareCategory = { id: '', name: '全部' }

export function ListScreen({ source, active }: { source: ListSource; active: boolean }) {
  const { core, playTracks, player } = useCore()
  const ui = useUi()
  const playRef = useRef(playTracks)
  playRef.current = playTracks
  const [categoryId, setCategoryId] = useState<string | undefined>(
    source.kind === 'square' ? source.categoryId : undefined,
  )

  // 歌单广场靠本地 state 换分类（不改路由栈，Esc 仍然退回上一层）
  const effective: ListSource = useMemo(
    () => (source.kind === 'square' ? { ...source, categoryId } : source),
    [source, categoryId],
  )

  const { state, reload, loadMore, tracks } = useList(core, effective)
  const height = listHeight(ui.rows, 6, 4)
  /**
   * 这一页的曲目属于哪份播放队列：歌单页 = 这张歌单的队列（顺序、各自记位置），
   * 「我喜欢的音乐」= 随机队列，其余浏览型结果（搜索/榜单/专辑/艺人/最近）= 临时队列。
   */
  const pageQueue = useMemo(
    () => (core ? queueSpecOfSource(core, effective, state.title) : undefined),
    [core, effective, state.title],
  )
  /** 当前页就是一张歌单：菜单里才有改名 / 删歌单 / 把这首移出去 */
  const playlist =
    source.kind === 'playlist' ? { id: source.id, title: state.title.replace(/^歌单 · /, '') } : undefined
  /** 当前页是一张本地歌单：菜单里才有「从本歌单移出」（本地库自己管，不需要登录） */
  const localPlaylist =
    source.kind === 'local-playlist' ? { id: source.id, title: state.title.replace(/^本地歌单 · /, '') } : undefined
  /** 歌单广场的分类环（键盘 `[`/`]` 与鼠标点 tab 共用同一个序列） */
  const categoryList = source.kind === 'square' ? [ALL_CATEGORY, ...(state.categories ?? [])] : []

  const { cursor, setCursor } = useCursor(state.rows.length, {
    active,
    // 行操作一律进菜单：键位表因此只留方向键 + Enter（播放是菜单第一项）
    onEnter: (index) => openMenu(state.rows[index]),
    onKey: (input) => {
      if (input === 'L') {
        loadMore()
        return true
      }
      if (input === 'R') {
        reload()
        return true
      }
      if (source.kind === 'square' && (input === '[' || input === ']')) {
        cycleCategory(input === '[' ? -1 : 1)
        return true
      }
      return false
    },
  })

  /** 打开这一行的操作菜单（同步构造：不等任何请求，点下去立刻有画面） */
  function openMenu(row: ListRow | undefined): void {
    if (!row) return
    if (!core) {
      ui.toast('core 还没就绪，稍后再试', 'error')
      return
    }
    const actions = buildRowActions({
      ui,
      core,
      row,
      list: tracks,
      playlist,
      localPlaylist,
      afterWrite: reload,
      // 曲目行不带队列 → 落到本页这份；歌单/专辑行自己带（「播放整张」进它自己的队列）
      play: (list, startTrackId, queue) => playRef.current(list, startTrackId, queue ?? pageQueue),
    })
    if (actions.entries.length > 0) ui.openOverlay({ kind: 'actions', title: actions.title, entries: actions.entries })
  }

  /** 歌单广场分类环（全部 → 各分类 → 全部…） */
  function cycleCategory(step: number): void {
    const index = categoryList.findIndex((item) => item.id === (categoryId ?? ''))
    const next = categoryList[(Math.max(0, index) + step + categoryList.length) % categoryList.length]
    if (next) setCategoryId(next.id || undefined)
  }

  const listWidth = contentWidth(ui.columns, ui.sidebarWidth, 2)
  const { start, end } = windowFor(state.rows.length, height, cursor)
  // 整页只要有行带「我」态水印就留出那一列（没带时列宽还给曲名，不白占）
  const stateCol = state.rows.some((row) => stateMark(row) !== undefined)
  const visible = state.rows.slice(start, end)

  // 鼠标：滚轮挪游标（感应面是整个内容列，标题/空行处也能滚）；点未选中的行只挪游标（单击就写操作太容易误触），点在已选行上才开菜单
  const screenRef = useRef<DOMElement>(null)
  const rowsRef = useRef<DOMElement>(null)
  const mouseActive = state.rows.length > 0
  useWheelScroll(
    screenRef,
    (delta) => {
      if (ui.focus !== 'content') ui.setFocus('content')
      setCursor(Math.max(0, Math.min(state.rows.length - 1, cursor + delta)))
    },
    mouseActive,
  )
  useRowClick(
    rowsRef,
    (row) => {
      const index = start + row
      const target = state.rows[index]
      if (!target) return
      // 点内容区即把焦点交给内容（和键盘 Tab 的效果一致，点完就能用键）
      if (ui.focus !== 'content') ui.setFocus('content')
      // 单击直达：开菜单本身不动任何东西，写操作还得在菜单里再选一次（删歌单另过确认框）
      setCursor(index)
      openMenu(target)
    },
    mouseActive,
  )

  const hints = [
    'Enter 操作菜单',
    '↑↓ 选行',
    'R 刷新',
    ...(playlist ? ['歌单操作也在菜单里'] : []),
    ...(source.kind === 'local-folder' ? ['R 重新扫描'] : []),
    ...(source.kind === 'square' ? ['[ ] 切分类'] : []),
  ]

  return (
    <Box ref={screenRef} flexDirection="column" flexGrow={1}>
      <PageTitle
        title={state.title || '列表'}
        subtitle={[state.subtitle, state.rows.length ? `${state.rows.length} 项` : undefined]
          .filter(Boolean)
          .join(' · ')}
      />
      {state.status === 'loading' ? <Loading label="读取列表" /> : null}
      {state.status === 'error' ? <ErrorState error={state.error ?? '加载失败'} hint="R 重新加载" /> : null}
      {state.status === 'ready' && state.rows.length === 0 ? (
        <EmptyState message="空列表" hint="换个来源或刷新" />
      ) : null}
      {categoryList.length > 1 ? (
        <Box paddingX={GUTTER} flexWrap="wrap">
          {categoryList.map((item) => {
            const selected = (categoryId ?? '') === item.id
            return (
              <Pressable key={item.id || 'all'} onPress={() => setCategoryId(item.id || undefined)}>
                <Text color={selected ? COLOR.accent : undefined} dimColor={!selected}>
                  {`[${item.name}] `}
                </Text>
              </Pressable>
            )
          })}
        </Box>
      ) : null}
      <Box ref={rowsRef} flexDirection="column" flexShrink={0}>
        {visible.map((row, offset) => {
          const index = start + offset
          const selected = index === cursor
          const current = row.kind === 'track' && player.track?.id === row.id
          return (
            <Box key={`${row.kind}:${row.id}:${index}`} flexShrink={0} paddingX={GUTTER}>
              <Text
                underline={selected}
                color={selected ? COLOR.accent : current ? COLOR.success : undefined}
                wrap="truncate-end"
              >
                {formatRow(row, index + 1, listWidth, current, stateCol)}
              </Text>
            </Box>
          )
        })}
      </Box>
      <Box flexGrow={1} />
      <Box paddingX={GUTTER}>
        <Pressable onPress={loadMore} active={state.hasMore && !state.loadingMore}>
          <Text dimColor wrap="truncate-end">
            {state.hasMore ? 'L 加载更多' : `共 ${state.rows.length} 项`}
          </Text>
        </Pressable>
        <Text dimColor wrap="truncate-end">
          {state.loadingMore ? ' 正在加载…' : ''}
          {state.rows.length > 0 ? `   ${hints.join('   ')}` : ''}
        </Text>
      </Box>
    </Box>
  )
}

/** 「我」态那一列的宽度（`已喜欢` = 6 列） */
const MARK_WIDTH = 6

/**
 * 这一行的「我」态徽标 —— 三态，不是布尔：
 *  - `undefined`：上游这一路没带水印（匿名、或实体没 `state`）→ 不占列、不写状态；
 *  - `''`：带了且明确「没收藏」→ 占列但留空；
 *  - 文本：已喜欢 / 已关注 / 已收藏。
 */
function stateMark(row: ListRow): string | undefined {
  switch (row.kind) {
    case 'track':
      return row.track.liked === undefined ? undefined : row.track.liked ? '已喜欢' : ''
    case 'artist':
      return row.artist.following === undefined ? undefined : row.artist.following ? '已关注' : ''
    case 'album':
      return row.album.collected === undefined ? undefined : row.album.collected ? '已收藏' : ''
    case 'playlist':
      return row.playlist.collected === undefined ? undefined : row.playlist.collected ? '已收藏' : ''
    default:
      return undefined
  }
}

function formatRow(row: ListRow, rank: number, width: number, current: boolean, stateCol: boolean): string {
  const idx = `${String(rank).padStart(3)} `
  const marker = current ? `${CURRENT_PREFIX} ` : '  '
  const mark = stateMark(row)
  if (row.kind === 'track') {
    const showId = width >= 74
    const artistWidth = Math.min(18, Math.max(8, Math.round(width * 0.18)))
    const fixed = 4 + 2 + artistWidth + 6 + (stateCol ? MARK_WIDTH : 0) + (showId ? 19 : 0)
    const nameWidth = Math.max(10, width - fixed)
    const duration = row.durationMs
      ? `${Math.floor(row.durationMs / 60000)}:${String(Math.floor((row.durationMs % 60000) / 1000)).padStart(2, '0')}`
      : '--:--'
    const liked = stateCol ? padRight(mark ?? '', MARK_WIDTH) : ' '
    return `${idx}${marker}${padRight(row.name, nameWidth)} ${padRight(row.artist, artistWidth)} ${padRight(duration, 5)}${liked}${
      showId ? ` ${row.id}` : ''
    }`
  }
  const labelWidth = Math.max(12, width - 6 - (mark ? MARK_WIDTH + 1 : 0))
  const note = row.kind === 'playlist' || row.kind === 'album' ? row.subtitle : undefined
  return `${idx}  ${padRight(row.title, labelWidth)}${note ? ` ${truncate(note, 20)}` : ''}${mark ? ` ${mark}` : ''}`
}
