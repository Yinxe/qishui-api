/** 发现：首页大盘的**内容浏览**（榜单 / 歌单 / 专辑 / 艺人 / 曲目）+ 歌单广场唯一入口。
 *  听歌模式与场景电台不在这里——那是「听歌」页的职责；「更多歌单」段也不在这（内容与歌单广场重复，入口只留广场一个）。 */
import { Box } from 'ink'
import type { HomeView, Track } from 'qishui-core'
import { useMemo, useRef } from 'react'
import { useCore } from '../core/context.js'
import { useUi } from '../ui/context.js'
import { type Entry, type Section, SectionView, useEntries } from '../ui/entries.js'
import { artistNames } from '../ui/format.js'
import { listHeight } from '../ui/layout.js'
import type { Route } from '../ui/types.js'
import { useAsync } from '../ui/useAsync.js'
import { EmptyState, ErrorState, Loading, PageTitle } from '../ui/widgets.js'

export function DiscoverScreen({ active }: { active: boolean }) {
  const { core, playTracks } = useCore()
  const ui = useUi()
  const playRef = useRef(playTracks)
  playRef.current = playTracks

  const home = useAsync<HomeView>(
    core ? () => core.discover.home() : undefined,
    `home:${core?.session.activeUid ?? ''}`,
  )

  const sections = useMemo<Section[]>(() => {
    if (!home.data) return []
    const push = ui.push
    // 首页推荐块 = 浏览型结果 → 临时队列
    const playTrack = (track: Track) =>
      void playRef.current([track.data], track.id, { kind: 'temporary', title: '临时 · 首页推荐' })
    return buildSections(home.data, { push, playTrack })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [home.data, ui.push])

  const height = listHeight(ui.rows, 5, 6)
  const { cursor, setCursor } = useEntries(sections, active)

  return (
    <Box flexDirection="column" flexGrow={1}>
      <PageTitle title="发现" subtitle="首页大盘（匿名可读）" />
      {home.status === 'loading' ? <Loading /> : null}
      {home.status === 'error' ? <ErrorState error={home.error ?? '加载失败'} hint="r 重试（见提示行）" /> : null}
      {home.status === 'ready' && sections.length === 0 ? <EmptyState message="首页没有内容" /> : null}
      {sections.length > 0 ? (
        <SectionView sections={sections} cursor={cursor} height={height} onCursor={setCursor} />
      ) : null}
    </Box>
  )
}

interface DiscoverHandlers {
  push(route: Route): void
  playTrack(track: Track): void
}

function buildSections(home: HomeView, h: DiscoverHandlers): Section[] {
  const sections: Section[] = [
    {
      title: '浏览',
      entries: [
        {
          key: 'square',
          label: '歌单广场',
          note: '[ ] 切分类',
          onEnter: () => h.push({ kind: 'list', source: { kind: 'square' } }),
        },
      ],
    },
  ]

  for (const block of home.blocks) {
    const entries: Entry[] = []
    for (const inner of block.inner) {
      if (/top_list/.test(inner.type) && inner.id) {
        entries.push({
          key: `chart:${inner.id}`,
          label: inner.title ?? '榜单',
          note: `${inner.resources.length} 首`,
          onEnter: () => h.push({ kind: 'list', source: { kind: 'chart', id: inner.id as string } }),
        })
        continue
      }
      // 场景电台（radio）不在发现页处理——「选模式起播/续播」是听歌页的职责，这里不混
      if (inner.resources.length === 1 && inner.resources[0].playlist && inner.title) {
        const playlist = inner.resources[0].playlist
        entries.push({
          key: `p:${playlist.id}`,
          label: inner.title,
          note: playlist.countTracks !== undefined ? `${playlist.countTracks} 首` : undefined,
          onEnter: () => h.push({ kind: 'list', source: { kind: 'playlist', id: playlist.id } }),
        })
        continue
      }
      for (const resource of inner.resources.slice(0, 6)) {
        if (resource.playlist) {
          const playlist = resource.playlist
          entries.push({
            key: `p:${playlist.id}`,
            label: playlist.title,
            note: playlist.countTracks !== undefined ? `${playlist.countTracks} 首` : undefined,
            onEnter: () => h.push({ kind: 'list', source: { kind: 'playlist', id: playlist.id } }),
          })
        } else if (resource.track) {
          const track = resource.track
          entries.push({
            key: `t:${track.id}`,
            label: track.name,
            note: artistNames(track.data.artists),
            onEnter: () => h.playTrack(track),
          })
        } else if (resource.album) {
          const album = resource.album
          entries.push({
            key: `a:${album.id}`,
            label: album.name,
            note: '专辑',
            onEnter: () => h.push({ kind: 'list', source: { kind: 'album', id: album.id } }),
          })
        } else if (resource.artist) {
          const artist = resource.artist
          entries.push({
            key: `ar:${artist.id}`,
            label: artist.name,
            note: '艺人',
            onEnter: () => h.push({ kind: 'list', source: { kind: 'artist', id: artist.id, tab: 'hot' } }),
          })
        }
      }
    }
    if (entries.length > 0) sections.push({ title: block.title ?? block.type, entries })
  }

  return sections
}
