/**
 * 通用列表的数据层：一个 ListSource → 头信息 + 行 + 分页。
 * 覆盖设计稿里「所有曲目/条目列表」的变体，屏里只负责画与按键。
 */
import type { Album, Artist, Playlist, QishuiCore, Track, User } from 'qishui-core'
import { useCallback, useEffect, useRef, useState } from 'react'
import { artistNames } from './format.js'
import type { ListSource } from './types.js'

export type ListRow =
  | { kind: 'track'; id: string; name: string; artist: string; durationMs?: number; track: Track }
  | { kind: 'playlist'; id: string; title: string; subtitle?: string; playlist: Playlist }
  | { kind: 'album'; id: string; title: string; subtitle?: string; album: Album }
  | { kind: 'artist'; id: string; title: string; subtitle?: string; artist: Artist }
  | { kind: 'user'; id: string; title: string; subtitle?: string; user: User }

export interface ListState {
  status: 'loading' | 'ready' | 'error'
  error?: string
  title: string
  subtitle?: string
  rows: ListRow[]
  hasMore: boolean
  loadingMore: boolean
  /** 歌单广场的分类（`[`/`]` 切换用），其它列表为空 */
  categories?: SquareCategory[]
}

export interface SquareCategory {
  id: string
  name: string
}

export const trackRow = (track: Track): ListRow => ({
  kind: 'track',
  id: track.id,
  name: track.name,
  artist: artistNames(track.data.artists),
  durationMs: track.data.durationMs,
  track,
})

export const playlistRow = (playlist: Playlist): ListRow => ({
  kind: 'playlist',
  id: playlist.id,
  title: playlist.title,
  subtitle: playlist.countTracks !== undefined ? `${playlist.countTracks} 首` : undefined,
  playlist,
})

export const albumRow = (album: Album): ListRow => ({
  kind: 'album',
  id: album.id,
  title: album.name,
  subtitle: album.artistNames,
  album,
})

export const userRow = (user: User): ListRow => ({
  kind: 'user',
  id: user.id,
  title: user.nickname || user.id,
  subtitle: user.data.signature,
  user,
})

export const artistRow = (artist: Artist): ListRow => ({
  kind: 'artist',
  id: artist.id,
  title: artist.name,
  artist,
})

interface PageResult {
  title?: string
  subtitle?: string
  rows: ListRow[]
  hasMore: boolean
  categories?: SquareCategory[]
  /**
   * 上游给的下一页游标，`loadMore` 会原样回传。
   * 只有实测确认了游标形态的源填（最近播放是偏移量、关注的艺人是 `1774117995_0` 这种串）；
   * 没填的沿用「页序 +1」的老写法，不把没测过的端点拿去试。
   */
  nextCursor?: string | number
}

async function fetchPage(core: QishuiCore, source: ListSource, cursor: string | number): Promise<PageResult> {
  const count = 50
  // 页序 +1 的那几个源只会传数字进来，这里换算一次是给类型检查看的，不是兜底
  const index = typeof cursor === 'number' ? cursor : Number(cursor) || 0
  switch (source.kind) {
    case 'chart': {
      const chart = await core.catalog.chart(source.id)
      return {
        title: `榜单 · ${chart.title ?? source.id}`,
        subtitle: chart.data.description,
        rows: chart.ranked.map((r) => trackRow(r.track)),
        hasMore: false,
      }
    }
    case 'playlist': {
      const playlist = await core.catalog.playlist(source.id)
      const page = await playlist.tracks({ cursor: index, count })
      return {
        title: `歌单 · ${playlist.title}`,
        subtitle: [playlist.description, playlist.countTracks !== undefined ? `${playlist.countTracks} 首` : undefined]
          .filter(Boolean)
          .join(' · '),
        rows: page.items.map(trackRow),
        hasMore: page.hasMore,
      }
    }
    case 'album': {
      if (index > 0) return { rows: [], hasMore: false }
      const album = await core.catalog.album(source.id)
      const tracks = await core.catalog.albumTracks(source.id)
      return {
        title: `专辑 · ${album.name}`,
        subtitle: [album.artistNames, album.data.countTracks !== undefined ? `${album.data.countTracks} 首` : undefined]
          .filter(Boolean)
          .join(' · '),
        rows: tracks.map(trackRow),
        hasMore: false,
      }
    }
    case 'artist': {
      const artist = await core.catalog.artist(source.id)
      const base = { title: `艺人 · ${artist.name}` }
      if (source.tab === 'hot') {
        const tracks = await core.catalog.artistHotTracks(source.id)
        return { ...base, subtitle: '热门曲目', rows: tracks.map(trackRow), hasMore: false }
      }
      if (source.tab === 'tracks') {
        const page = await core.catalog.artistTracks(source.id, { cursor: index, count })
        return { ...base, subtitle: '全部歌曲', rows: page.items.map(trackRow), hasMore: page.hasMore }
      }
      const page = await core.catalog.artistAlbums(source.id, { cursor: index, count })
      return { ...base, subtitle: '专辑', rows: page.items.map(albumRow), hasMore: page.hasMore }
    }
    case 'liked': {
      if (index > 0) return { rows: [], hasMore: false }
      const tracks = await core.library.likedTracks()
      return { title: '我喜欢的音乐', subtitle: `${tracks.length} 首`, rows: tracks.map(trackRow), hasMore: false }
    }
    case 'recent': {
      // 登录后优先用上游的最近播放（跨设备、有分页）；云端**回空也算通**，接着往下走本地历史，
      // 别把「这张表没记录」显示成一片空白 —— 本地历史是播放器每次都记的（`player.recordPlay`）
      if (core.loggedIn) {
        try {
          const page = await core.library.recent({ cursor, count })
          if (page.items.length) {
            return {
              title: '最近播放',
              subtitle: page.total ? `云端 · 共 ${page.total} 条` : '云端',
              rows: page.items.map(trackRow),
              hasMore: page.hasMore,
              nextCursor: page.cursor,
            }
          }
        } catch {
          if (index > 0) return { rows: [], hasMore: false }
        }
      }
      if (index > 0) return { rows: [], hasMore: false }
      const records = core.history.recent(100)
      const ids = records.map((r) => r.trackId).filter(Boolean)
      let tracks: Track[] = []
      try {
        tracks = await core.catalog.tracks(ids)
      } catch {
        tracks = []
      }
      const byId = new Map(tracks.map((t) => [t.id, t]))
      const rows = records.map((record) => {
        const found = byId.get(record.trackId)
        if (found) return trackRow(found)
        const fallback = core.track({
          id: record.trackId,
          name: record.name ?? record.trackId,
          artists: record.artist ? [{ id: '', name: record.artist }] : [],
        })
        return trackRow(fallback)
      })
      return {
        title: '最近播放',
        subtitle: `${records.length} 条（本地历史${core.loggedIn ? '，云端那张表没记录' : '，登录后可与云端同步'}）`,
        rows,
        hasMore: false,
      }
    }
    case 'square': {
      if (index > 0) return { rows: [], hasMore: false }
      const { playlists, categories } = await core.discover.playlistSquare({ categoryId: source.categoryId })
      const picked = (categories as { id?: unknown; name?: unknown }[])
        .map((c) => ({ id: String(c.id ?? ''), name: String(c.name ?? c.id ?? '') }))
        .filter((c) => c.id)
      const current = picked.find((c) => c.id === source.categoryId)
      return {
        title: '歌单广场',
        subtitle: `${current?.name ?? '全部分类'}${picked.length ? ` · ${picked.length} 个分类，[ ] 切换` : ''}`,
        rows: playlists.map(playlistRow),
        hasMore: false,
        categories: picked,
      }
    }
    case 'mixed': {
      if (index > 0) return { rows: [], hasMore: false }
      const { playlists } = await core.library.mixedCollections()
      return { title: '我的收藏（歌单/专辑）', rows: playlists.map(playlistRow), hasMore: false }
    }
    case 'artists': {
      const page = await core.library.collectedArtists({ cursor, count })
      return {
        title: '关注的艺人',
        subtitle: page.total !== undefined ? `共 ${page.total} 位` : undefined,
        rows: page.items.map(artistRow),
        hasMore: page.hasMore,
        nextCursor: page.cursor,
      }
    }
    case 'user-playlists': {
      const page = await core.social.userPlaylists(source.uid, { cursor: index, count })
      return {
        title: `歌单 · ${source.nickname ?? source.uid}`,
        rows: page.items.map(playlistRow),
        hasMore: page.hasMore,
      }
    }
    case 'user-following':
    case 'user-followers': {
      // 风控提醒：`GetFollowingList` / `GetFollowerList` 连打两次就会撞验证码（core 已按 5 分钟缓存兜住），
      // 所以这里不做「一次翻完」，翻页只听上游的 `has_more`
      const page =
        source.kind === 'user-following'
          ? await core.social.following(source.uid, { cursor: index, count })
          : await core.social.followers(source.uid, { cursor: index, count })
      return {
        title: `${source.kind === 'user-following' ? '关注' : '粉丝'} · ${source.nickname ?? source.uid}`,
        subtitle: page.total !== undefined ? `共 ${page.total} 位` : undefined,
        rows: page.items.map(userRow),
        hasMore: page.hasMore,
        nextCursor: page.cursor,
      }
    }
    case 'search': {
      if (index > 0) return { rows: [], hasMore: false }
      const result = await core.search.search(source.query, { type: source.type })
      const rows: ListRow[] = []
      for (const group of result.groups) {
        rows.push(...group.tracks.map(trackRow))
        rows.push(...group.playlists.map(playlistRow))
        rows.push(...group.albums.map(albumRow))
        rows.push(...group.artists.map(artistRow))
      }
      return { title: `搜索「${source.query}」`, rows, hasMore: false }
    }
    case 'mix': {
      if (index > 0) return { rows: [], hasMore: false }
      const inners = await core.discover.mix({ blockType: source.blockType, subChannelId: source.subChannelId })
      const rows: ListRow[] = []
      for (const inner of inners) {
        for (const resource of inner.resources) {
          if (resource.track) rows.push(trackRow(resource.track))
          else if (resource.playlist) rows.push(playlistRow(resource.playlist))
          else if (resource.album) rows.push(albumRow(resource.album))
          else if (resource.artist) rows.push(artistRow(resource.artist))
        }
      }
      return { title: source.title ?? '内容块', rows, hasMore: false }
    }
    default:
      return { rows: [], hasMore: false }
  }
}

export function describeError(err: unknown): string {
  if (err instanceof Error) return err.message
  return String(err)
}

export function useList(
  core: QishuiCore | undefined,
  source: ListSource,
): {
  state: ListState
  reload: () => void
  loadMore: () => void
  tracks: Track[]
} {
  const [state, setState] = useState<ListState>({
    status: 'loading',
    title: '',
    rows: [],
    hasMore: false,
    loadingMore: false,
  })
  const cursorRef = useRef<string | number>(0)
  const generation = useRef(0)
  const sourceKey = JSON.stringify(source)

  // biome-ignore lint/correctness/useExhaustiveDependencies: source 通过 sourceKey 参与依赖，避免按对象引用重取
  const load = useCallback(
    async (reset: boolean) => {
      if (!core) return
      const my = ++generation.current
      if (reset) {
        cursorRef.current = 0
        setState((prev) => ({ ...prev, status: 'loading', error: undefined }))
      } else {
        setState((prev) => ({ ...prev, loadingMore: true }))
      }
      try {
        const page = await fetchPage(core, source, cursorRef.current)
        if (my !== generation.current) return
        // 上游给了游标就照它的来；没给的沿用页序（见 PageResult.nextCursor）
        cursorRef.current = page.nextCursor ?? (cursorRef.current as number) + 1
        setState((prev) => ({
          status: 'ready',
          title: page.title ?? prev.title,
          subtitle: page.subtitle ?? (reset ? undefined : prev.subtitle),
          rows: reset ? page.rows : [...prev.rows, ...page.rows],
          hasMore: page.hasMore,
          loadingMore: false,
          categories: page.categories ?? (reset ? undefined : prev.categories),
        }))
      } catch (err) {
        if (my !== generation.current) return
        setState((prev) => ({
          ...prev,
          status: 'error',
          error: describeError(err),
          loadingMore: false,
        }))
      }
    },
    // source 变了就重取；登录/切号（activeUid 变）也算换源，否则匿名拉到的列表会一直挂在页上
    [core, sourceKey, core?.session.activeUid],
  )

  useEffect(() => {
    void load(true)
  }, [load])

  const tracks = state.rows
    .filter((row): row is Extract<ListRow, { kind: 'track' }> => row.kind === 'track')
    .map((r) => r.track)

  return {
    state,
    reload: () => void load(true),
    loadMore: () => {
      if (state.hasMore && !state.loadingMore) void load(false)
    },
    tracks,
  }
}
