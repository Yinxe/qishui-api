/** 搜索：输入行 + 联想下拉 + 分类 tab + 结果分组（←→ 切分类，Enter 搜索，结果行进操作菜单） */
import { Box, Text, useInput } from 'ink'
import type { SearchResult, SearchType, SuggestItem, Track } from 'qishui-core'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useCore } from '../core/context.js'
import { useUi } from '../ui/context.js'
import { type Entry, type Section, SectionView, useEntries } from '../ui/entries.js'
import { artistNames, truncate } from '../ui/format.js'
import { useKeys } from '../ui/keys.js'
import { listHeight } from '../ui/layout.js'
import { Pressable, stripMouse } from '../ui/mouse.js'
import { buildRowActions } from '../ui/rowActions.js'
import { looksLikeShareInput, type ShareRef, shareTarget } from '../ui/shareLink.js'
import { COLOR, GUTTER } from '../ui/theme.js'
import type { Route } from '../ui/types.js'
import { useAsync } from '../ui/useAsync.js'
import { albumRow, artistRow, describeError, type ListRow, playlistRow, trackRow } from '../ui/useList.js'
import { EmptyState, ErrorState, Loading, PageTitle, Row } from '../ui/widgets.js'

const FALLBACK_CATEGORIES: { type: string; name: string }[] = [
  { type: 'all', name: '综合' },
  { type: 'track', name: '歌曲' },
  { type: 'album', name: '专辑' },
  { type: 'artist', name: '歌手' },
  { type: 'playlist', name: '歌单' },
]

/** 联想防抖：手停下来这么久才去问一次 `Sug`——每敲一个字都问等于拿输入速度打上游 */
const SUGGEST_DEBOUNCE_MS = 250

/** 下拉最多几行，再多吃掉结果区的高度 */
const SUGGEST_ROWS = 6

/** `Sug` 的 `content_type` 只有 artist/playlist/track 这几种（见 docs/APP_ENDPOINTS.md） */
const SUG_TYPE_LABEL: Record<string, string> = {
  track: '歌曲',
  album: '专辑',
  artist: '歌手',
  playlist: '歌单',
  user: '用户',
  video: '视频',
}

export function SearchScreen({ active }: { active: boolean }) {
  const { core, playTracks } = useCore()
  const ui = useUi()
  const playRef = useRef(playTracks)
  playRef.current = playTracks

  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState('')
  const [editing, setEditing] = useState(true)
  const [categoryIndex, setCategoryIndex] = useState(0)

  // 联想下拉：只有「在输入框里打字」才刷新；从下拉里挑一条是回填，不再问一次
  const [sugs, setSugs] = useState<SuggestItem[]>([])
  const [sugLoading, setSugLoading] = useState(false)
  const [sugError, setSugError] = useState<string | null>(null)
  const [navSug, setNavSug] = useState(false)
  const [sugIndex, setSugIndex] = useState(0)
  /** 在途请求的序号：回来的比当前这轮旧就丢掉（快速连打时别把慢的旧结果盖上） */
  const sugGen = useRef(0)
  /** 刚回填进输入框的那个词，effect 见到就跳过一次；一次性，用完即清 */
  const pickedRef = useRef('')
  /** 上一次真的问出去的词：同一个词不重复问（失败时清掉，留给重试） */
  const askedRef = useRef('')

  const categoriesAsync = useAsync(
    core ? () => core.search.categories() : undefined,
    `categories:${core?.session.activeUid ?? ''}`,
  )
  const categories = categoriesAsync.data?.length ? categoriesAsync.data : FALLBACK_CATEGORIES
  const category = categories[Math.min(categoryIndex, categories.length - 1)]?.type ?? 'all'

  const result = useAsync<SearchResult>(
    // 分类 tab 的 type 来自 `SearchCategories`（实测就是那 7 个 search_type）
    core && submitted ? () => core.search.search(submitted, { type: category as SearchType }) : undefined,
    `search:${submitted}:${category}`,
  )

  // 编辑态：让全局单键快捷键让位给输入
  useEffect(() => {
    ui.setTextFocus(active && editing)
    return () => ui.setTextFocus(false)
  }, [active, editing, ui])

  useEffect(() => {
    if (!core || !editing) return
    const text = query.trim()
    if (!text) {
      pickedRef.current = ''
      askedRef.current = ''
      sugGen.current++
      setSugs([])
      setSugLoading(false)
      setSugError(null)
      return
    }
    if (text === pickedRef.current) {
      pickedRef.current = ''
      return
    }
    if (text === askedRef.current) return
    const timer = setTimeout(() => {
      pickedRef.current = ''
      askedRef.current = text
      const my = ++sugGen.current
      setSugLoading(true)
      core.search
        .suggest(text)
        .then((items) => {
          if (my !== sugGen.current) return
          setSugs(items.filter((item) => item.keyword).slice(0, SUGGEST_ROWS))
          setSugError(null)
        })
        .catch((err) => {
          if (my !== sugGen.current) return
          askedRef.current = ''
          setSugs([])
          setSugError(describeError(err))
        })
        .finally(() => {
          if (my === sugGen.current) setSugLoading(false)
        })
    }, SUGGEST_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [core, editing, query])

  /** 挑一条联想词：只把词送回输入框，面板留着，也不重新联想 */
  const pickSug = (keyword: string) => {
    const text = keyword.trim()
    if (!text) return
    pickedRef.current = text
    ui.setFocus('content')
    setNavSug(false)
    setSugIndex(0)
    setQuery(text)
  }

  /** 分享链接解析中（短链要跟一次重定向，慢一点；期间别让输入框看起来没反应） */
  const [linkBusy, setLinkBusy] = useState(false)

  /** 粘进来的是分享物就直接开对应页；返回 true 表示「这不是关键词，别搜了」 */
  const openShare = useCallback(
    (item: ShareRef): void => {
      const target = shareTarget(item)
      if ('note' in target) {
        ui.toast(target.note, 'info')
        return
      }
      setSubmitted('')
      setEditing(false)
      ui.setFocus('content')
      ui.push(target.route)
    },
    [ui],
  )

  /** Enter 时先看是不是分享链接/裸 ID：能解析就开页面，解析不出再当关键词搜（不拦着正常搜索） */
  const tryOpenShare = useCallback(
    (text: string): boolean => {
      if (!core || !looksLikeShareInput(text)) return false
      const direct = core.link.parse(text)
      if (direct) {
        openShare(direct)
        return true
      }
      // 短链（qishui.douyin.com/s/xxxx）解析不出 ID：跟一次重定向，失败就退回关键词搜索
      setLinkBusy(true)
      core.link
        .resolve(text)
        .then((item) => openShare(item))
        .catch(() => {
          ui.toast('这条链接没解析出条目，按关键词搜一下', 'info')
          setSubmitted(text)
          setEditing(false)
        })
        .finally(() => setLinkBusy(false))
      return true
    },
    [core, openShare, ui],
  )

  useInput(
    (input, key) => {
      if (key.upArrow || key.downArrow) {
        if (sugs.length === 0) return
        const last = sugs.length - 1
        if (!navSug) {
          setNavSug(true)
          setSugIndex(key.upArrow ? last : 0)
          return
        }
        setSugIndex((index) => Math.max(0, Math.min(last, index + (key.downArrow ? 1 : -1))))
        return
      }
      if (key.return) {
        const picked = navSug ? sugs[Math.min(sugIndex, sugs.length - 1)] : undefined
        if (picked) {
          pickSug(picked.keyword)
          return
        }
        const text = query.trim()
        if (text && !tryOpenShare(text)) {
          setSubmitted(text)
          setEditing(false)
          setNavSug(false)
        }
        return
      }
      if (key.backspace || key.delete) {
        setNavSug(false)
        setQuery((current) => [...current].slice(0, -1).join(''))
        return
      }
      if (key.escape) {
        if (navSug) {
          setNavSug(false)
          return
        }
        setEditing(false)
        return
      }
      // 一次 read 可能带回多个字符（粘贴/快速输入），逐个收下；控制字符丢掉。
      // 鼠标报文也是「一次 read 多个字符」，先剔掉，否则滚轮一动就往输入框里塞 `[<64;10;5M`
      const printable = [...stripMouse(input)].filter((ch) => ch >= ' ').join('')
      if (printable && !key.ctrl && !key.meta) {
        setNavSug(false)
        setQuery((current) => current + printable)
      }
    },
    { isActive: active && editing && !ui.overlay },
  )

  // 结果导航时的分类切换
  useKeys(
    (input, key) => {
      if (key.leftArrow) setCategoryIndex((i) => Math.max(0, i - 1))
      else if (key.rightArrow) setCategoryIndex((i) => Math.min(categories.length - 1, i + 1))
      else if (input === '/') setEditing(true)
      else if (input === 'R' && submitted) result.reload()
    },
    { isActive: active && !editing && !ui.overlay },
  )

  /** 结果行进的是「操作菜单」，和列表页同一条路：`Enter` 不再直接出声，播放是菜单第一项 */
  const openMenu = useCallback(
    (row: ListRow, list?: Track[]) => {
      if (!core) {
        ui.toast('core 还没就绪，稍后再试', 'error')
        return
      }
      const actions = buildRowActions({
        ui,
        core,
        row,
        list,
        // 搜索结果 = 浏览型结果 → 临时队列（每次搜一批就整队替换上一批）
        play: (tracks, startTrackId, queue) =>
          playRef.current(
            tracks,
            startTrackId,
            queue ?? { kind: 'temporary', title: `临时 · 搜索「${submitted || query}」` },
          ),
      })
      if (actions.entries.length > 0)
        ui.openOverlay({ kind: 'actions', title: actions.title, entries: actions.entries })
    },
    // submitted / query 只用来给临时队列起名，但它们变了菜单标题也该跟着变，所以照实进依赖
    [core, ui, submitted, query],
  )

  const sections = useMemo<Section[]>(() => {
    const push = (route: Route) => ui.push(route)
    if (!submitted) return []
    if (!result.data) return []
    return result.data.groups.map((group) => {
      const entries: Entry[] = []
      for (const track of group.tracks) {
        const row = trackRow(track)
        entries.push({
          key: `t:${track.id}`,
          label: track.name,
          note: artistNames(track.data.artists),
          onEnter: () => openMenu(row, group.tracks),
        })
      }
      for (const playlist of group.playlists) {
        entries.push({
          key: `p:${playlist.id}`,
          label: playlist.title,
          note: '歌单',
          onEnter: () => openMenu(playlistRow(playlist)),
        })
      }
      for (const album of group.albums) {
        entries.push({
          key: `al:${album.id}`,
          label: album.name,
          note: '专辑',
          onEnter: () => openMenu(albumRow(album)),
        })
      }
      for (const artist of group.artists) {
        entries.push({
          key: `ar:${artist.id}`,
          label: artist.name,
          note: '歌手',
          onEnter: () => openMenu(artistRow(artist)),
        })
      }
      // 「查看全部」只在上游说要看、且这一组能映射回一个 search_type 时给：
      // 分组判别看 `group.id`（实测 tracks/albums/artists/playlists），`group.type` 是展示字段、实测恒为空串，
      // 拿它去请求就是 `/luna/search/` 的 404；聚合组 `top_results` 上游本来就给 display_view_all=false。
      const searchType = group.viewAll ? group.searchType : undefined
      if (entries.length > 0 && searchType) {
        entries.push({
          key: `more:${group.id ?? searchType}`,
          label: '查看全部',
          onEnter: () => push({ kind: 'list', source: { kind: 'search', type: searchType, query: submitted } }),
        })
      }
      return { title: group.title ?? '结果', entries }
    })
  }, [submitted, result.data, ui.push, openMenu])

  const showSugs = editing && Boolean(core) && (sugs.length > 0 || sugLoading || sugError !== null)
  const sugRows = sugs.length > 0 ? sugs.length : sugLoading ? 1 : sugError ? 1 : 0
  const height = listHeight(ui.rows, 6 + (showSugs ? sugRows : 0), 5)
  const { cursor, setCursor } = useEntries(sections, active && !editing, undefined)

  return (
    <Box flexDirection="column" flexGrow={1}>
      <PageTitle title="搜索" />
      <Box paddingX={GUTTER} flexShrink={0}>
        <Pressable
          onPress={() => {
            ui.setFocus('content')
            setEditing(true)
          }}
        >
          <Text color={editing ? COLOR.accent : 'gray'}>关键词 </Text>
          <Text inverse={editing} wrap="truncate-end">
            {query || (editing ? '' : '（按 / 继续输入）')}
          </Text>
        </Pressable>
      </Box>
      {showSugs ? (
        <Box flexDirection="column" paddingX={GUTTER} flexShrink={0}>
          {sugs.length === 0 && sugLoading ? <Text dimColor>联想中…</Text> : null}
          {sugs.length === 0 && !sugLoading && sugError ? (
            <Text color={COLOR.danger} wrap="truncate-end">{`联想失败：${sugError}`}</Text>
          ) : null}
          {sugs.map((item, index) => (
            <Pressable key={item.keyword} onPress={() => pickSug(item.keyword)}>
              <Row
                selected={navSug ? index === Math.min(sugIndex, sugs.length - 1) : item.keyword === query}
                label={item.keyword}
                note={SUG_TYPE_LABEL[item.type ?? '']}
              />
            </Pressable>
          ))}
        </Box>
      ) : null}
      <Box paddingX={GUTTER} flexShrink={0}>
        {categories.map((item, index) => (
          <Pressable
            key={item.type}
            onPress={() => {
              ui.setFocus('content')
              setCategoryIndex(index)
            }}
          >
            <Text color={index === categoryIndex ? COLOR.accent : undefined} dimColor={index !== categoryIndex}>
              {index === categoryIndex ? `[${item.name}]` : ` ${item.name} `}
            </Text>
          </Pressable>
        ))}
        <Text dimColor> ←→ 切分类</Text>
      </Box>
      <Box marginTop={1} />
      {linkBusy ? <Loading label="解析分享链接" /> : null}
      {result.status === 'loading' && submitted ? <Loading label="搜索中" /> : null}
      {result.status === 'error' ? <ErrorState error={result.error ?? '搜索失败'} hint="R 重试" /> : null}
      {sections.length === 0 && submitted && result.status === 'ready' ? (
        <EmptyState message={`没有找到「${submitted}」`} hint="换个关键词，或切分类看看" />
      ) : null}
      {sections.length > 0 ? (
        <SectionView sections={sections} cursor={cursor} height={height} onCursor={setCursor} />
      ) : null}
      <Box paddingX={GUTTER}>
        <Text dimColor wrap="truncate-end">
          {editing
            ? 'Enter 搜索（粘分享链接/裸 ID 直接打开）   ↑↓ 选联想词   Esc 收起输入   Ctrl+C 退出'
            : submitted
              ? truncate(`结果：${submitted}   Enter 操作菜单   / 改关键词   ←→ 切分类`, 72)
              : '按 / 或 Enter 输入关键词'}
        </Text>
      </Box>
    </Box>
  )
}
