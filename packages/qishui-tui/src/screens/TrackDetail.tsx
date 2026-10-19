/** 曲目详情：封面 + 信息 + 入口（相似 / 评论 / 专辑 / 艺人 / 收藏） */
import { Box, Text } from 'ink'
import type { Track } from 'qishui-core'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Cover } from '../components/Cover.js'
import { useCore } from '../core/context.js'
import { useUi } from '../ui/context.js'
import { type Section, SectionView, useEntries } from '../ui/entries.js'
import { artistNames, formatDuration } from '../ui/format.js'
import { contentWidth, listHeight } from '../ui/layout.js'
import { GUTTER } from '../ui/theme.js'
import { useAsync } from '../ui/useAsync.js'
import { EmptyState, ErrorState, Loading, PageTitle } from '../ui/widgets.js'

/** 封面上下限：4 行以下半块就糊成一片了，8 行再高就把操作列表挤没了 */
const COVER_MIN_ROWS = 4
const COVER_MAX_ROWS = 8
/** 封面右边至少还要给 meta 留这么多列，否则不并排（退成封面单独一行） */
const META_MIN_WIDTH = 24

export function TrackDetailScreen({ id, active }: { id: string; active: boolean }) {
  const { core, playTracks } = useCore()
  const ui = useUi()
  const playRef = useRef(playTracks)
  playRef.current = playTracks
  const [liked, setLiked] = useState<boolean | undefined>()
  /** 这张封面确实拿不到（没图 / 没 chafa / 断网）：整块收掉，把位置还给文字 */
  const [coverGone, setCoverGone] = useState(false)
  const onCoverEmpty = useCallback(() => setCoverGone(true), [])

  const detail = useAsync<Track>(core ? () => core.catalog.track(id) : undefined, `track:${id}`)
  const track = detail.data

  // biome-ignore lint/correctness/useExhaustiveDependencies: toggleLike 每次渲染重建；只随曲目与收藏态重建菜单
  const sections = useMemo<Section[]>(() => {
    if (!track) return []
    const artist = track.data.artists[0]
    const albumEntity = track.data.album
    const entries = [
      {
        key: 'play',
        label: '播放这首',
        onEnter: () => void playRef.current([track.data], track.id, { kind: 'temporary', title: '临时 · 曲目详情' }),
      },
      {
        key: 'like',
        label: '我的喜欢（切换）',
        note: liked === undefined ? undefined : liked ? '已喜欢' : '未喜欢',
        onEnter: () => void toggleLike(),
      },
      {
        key: 'related',
        label: '相似歌曲（播放入队）',
        onEnter: () => {
          void (async () => {
            try {
              const related = await core?.catalog.related(track, 30)
              if (related?.length)
                await playRef.current(
                  related.map((item) => item.data),
                  related[0].id,
                  {
                    kind: 'temporary',
                    title: '临时 · 相似歌曲',
                  },
                )
            } catch (err) {
              ui.toast(err instanceof Error ? err.message : String(err), 'error')
            }
          })()
        },
      },
      {
        key: 'comments',
        label: '评论',
        onEnter: () => ui.openOverlay({ kind: 'comments', trackId: track.id, title: track.name }),
      },
      ...(albumEntity
        ? [
            {
              key: 'album',
              label: `专辑：${albumEntity.name}`,
              onEnter: () => ui.push({ kind: 'list', source: { kind: 'album', id: albumEntity.id } }),
            },
          ]
        : []),
      ...(artist
        ? [
            {
              key: 'artist',
              label: `艺人：${artist.name}`,
              onEnter: () => ui.push({ kind: 'list', source: { kind: 'artist', id: artist.id, tab: 'hot' } }),
            },
          ]
        : []),
    ]
    return [{ title: '操作', entries }]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track, liked, core, ui])

  async function toggleLike(): Promise<void> {
    if (!track || !core) return
    if (!core.loggedIn) {
      ui.toast('「我的喜欢」需要登录（按 0 进「我的」扫码）', 'error')
      return
    }
    try {
      const current = liked ?? (await core.library.isLiked(track.id))
      if (current) {
        await core.library.unlike(track.id)
        setLiked(false)
        ui.toast('已取消喜欢', 'info')
      } else {
        await core.library.like(track.id)
        setLiked(true)
        ui.toast('已加入「我的喜欢」', 'success')
      }
    } catch (err) {
      ui.toast(err instanceof Error ? err.message : String(err), 'error')
    }
  }

  const height = listHeight(ui.rows, 8, 5)
  const { cursor, setCursor } = useEntries(sections, active)

  // 换封面就重新试一次（上一张拿不到不代表这张也不行）
  // biome-ignore lint/correctness/useExhaustiveDependencies: 只认「换的是哪张图」
  useEffect(() => setCoverGone(false), [track?.coverUrl])

  // 封面：方形源图按 `2N × N` 格铺开（一格的像素宽≈高两倍）；上下限见常量
  const coverRows = Math.max(COVER_MIN_ROWS, Math.min(COVER_MAX_ROWS, Math.floor((ui.rows - 8) / 3)))
  const coverCols = coverRows * 2
  const avail = contentWidth(ui.columns, ui.sidebarWidth, GUTTER * 2, 0)
  /** 并排要封面右边还放得下一栏文字，否则退成封面单独一行 */
  const sideBySide = avail - coverCols - 1 >= META_MIN_WIDTH
  const hasCover = Boolean(track?.coverUrl) && !coverGone

  const meta = track ? (
    <Box flexDirection="column" flexGrow={1}>
      <Text dimColor wrap="truncate-end">
        {[
          track.data.album?.name ? `专辑 ${track.data.album.name}` : undefined,
          formatDuration(track.data.durationMs),
          track.data.vip?.onlyVipPlayable ? 'VIP 可播' : undefined,
          track.data.playableRange ? '仅试听区间' : undefined,
        ]
          .filter(Boolean)
          .join('  ·  ')}
      </Text>
      <Text dimColor wrap="truncate-end">
        {track.data.stats
          ? `收藏 ${track.data.stats.collected ?? '-'}  评论 ${track.data.stats.comment ?? '-'}  分享 ${track.data.stats.shared ?? '-'}`
          : `id ${track.id}`}
      </Text>
    </Box>
  ) : null
  const cover =
    track && hasCover ? (
      <Cover
        url={track.coverUrl}
        cols={coverCols}
        rows={coverRows}
        onEmpty={onCoverEmpty}
        cacheKey={track.id}
        load={async () => await core?.media.cachedCover(track.id)}
      />
    ) : null

  return (
    <Box flexDirection="column" flexGrow={1}>
      <PageTitle title={track?.name ?? '曲目'} subtitle={track ? artistNames(track.data.artists) : undefined} />
      {detail.status === 'loading' ? <Loading label="读取曲目" /> : null}
      {detail.status === 'error' ? <ErrorState error={detail.error ?? '加载失败'} /> : null}
      {track ? (
        <Box marginBottom={1} paddingX={GUTTER} flexDirection={sideBySide && cover ? 'row' : 'column'} gap={1}>
          {sideBySide ? cover : null}
          {meta}
          {sideBySide ? null : cover}
        </Box>
      ) : null}
      {sections.length > 0 ? (
        <SectionView sections={sections} cursor={cursor} height={height} onCursor={setCursor} />
      ) : null}
      {detail.status === 'ready' && !track ? <EmptyState message="拿不到这条曲目" /> : null}
    </Box>
  )
}
