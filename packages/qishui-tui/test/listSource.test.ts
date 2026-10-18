/**
 * 列表翻页的游标口径（`ui/useList.ts` 的 `fetchPage`）离线单测 —— 不联网、不落盘。
 *
 * 背景：上游这些列表的 `cursor` 是**偏移量字符串**（实测：歌单 `cursor 0/5/10` 三段零重复；
 * 艺人曲目 50 条/页、`cursor "50"` 的第二页零重复；搜索 `cursor "20"` 零重复），
 * 而 `useList` 早先按「页序 +1」传 —— `count=50` 时页序 1 会被当成偏移 1，第二页整页重复。
 * 所以这里钉住两件事：**翻页要回传上游 next_cursor**、**没有 next_cursor 的源不许假装还有下一页**。
 */
import type { QishuiCore } from 'qishui-core'
import { describe, expect, it, vi } from 'vitest'
import { fetchPage } from '../dist/ui/useList.js'

const track = (id: string) => ({ id, name: `曲 ${id}`, data: { id, name: `曲 ${id}`, artists: [] } })

describe('fetchPage：翻页游标', () => {
  it('搜索「查看全部」：第二页把上游 next_cursor 原样回传，并带回新的游标', async () => {
    const search = vi
      .fn()
      .mockResolvedValueOnce({
        query: '晴天',
        groups: [
          {
            id: 'tracks',
            title: '歌曲',
            hasMore: true,
            cursor: '20',
            tracks: [track('1'), track('2')],
            albums: [],
            artists: [],
            playlists: [],
            users: [],
          },
        ],
        raw: {},
      })
      .mockResolvedValueOnce({
        query: '晴天',
        groups: [
          {
            id: 'tracks',
            title: '歌曲',
            hasMore: true,
            cursor: '40',
            tracks: [track('21')],
            albums: [],
            artists: [],
            playlists: [],
            users: [],
          },
        ],
        raw: {},
      })
    const core = { search: { search } } as unknown as QishuiCore
    const source = { kind: 'search', query: '晴天', type: 'track' } as const

    const first = await fetchPage(core, source, 0)
    expect(first.hasMore).toBe(true)
    expect(first.nextCursor).toBe('20')
    expect(first.rows).toHaveLength(2)

    const second = await fetchPage(core, source, first.nextCursor as string)
    expect(second.nextCursor).toBe('40')
    // 第二页请求必须带上游游标，不能是「页序 1」
    expect(search.mock.calls[1][1]).toEqual({ type: 'track', cursor: '20' })
  })

  it('搜索综合预览（all）：没有游标就不给 loadMore', async () => {
    const core = {
      search: {
        search: vi.fn().mockResolvedValue({
          query: '晴天',
          groups: [
            {
              id: 'tracks',
              title: '歌曲',
              hasMore: false,
              cursor: '',
              tracks: [track('1')],
              albums: [],
              artists: [],
              playlists: [],
              users: [],
            },
          ],
          raw: {},
        }),
      },
    } as unknown as QishuiCore
    const page = await fetchPage(core, { kind: 'search', query: '晴天', type: 'all' } as const, 0)
    expect(page.hasMore).toBe(false)
    expect(page.nextCursor).toBeUndefined()
  })

  it('歌单：第二页传的是上游偏移量 50，不是页序 1（否则第二页整页重复）', async () => {
    const tracks = vi
      .fn()
      .mockResolvedValueOnce({ items: [track('1')], hasMore: true, cursor: '50' })
      .mockResolvedValueOnce({ items: [track('51')], hasMore: false, cursor: '' })
    const core = {
      catalog: {
        playlist: vi.fn().mockResolvedValue({ title: '样本', description: '', countTracks: 51 }),
        playlistTracks: tracks,
      },
    } as unknown as QishuiCore
    // `Playlist.tracks()` 在实体上；这里直接喂实体替身
    const playlist = { title: '样本', description: '', countTracks: 51, tracks }
    ;(core as unknown as { catalog: { playlist: () => Promise<unknown> } }).catalog.playlist = vi
      .fn()
      .mockResolvedValue(playlist)

    const first = await fetchPage(core, { kind: 'playlist', id: 'p1' } as const, 0)
    expect(first.nextCursor).toBe('50')
    const second = await fetchPage(core, { kind: 'playlist', id: 'p1' } as const, first.nextCursor as string)
    expect(tracks.mock.calls[0][0]).toEqual({ cursor: 0, count: 50 })
    expect(tracks.mock.calls[1][0]).toEqual({ cursor: 50, count: 50 })
    expect(second.hasMore).toBe(false)
  })

  it('艺人曲目：游标同口径回传', async () => {
    const artistTracks = vi.fn().mockResolvedValueOnce({ items: [track('1')], hasMore: true, cursor: '50' })
    const core = {
      catalog: { artist: vi.fn().mockResolvedValue({ name: '林俊杰' }), artistTracks },
    } as unknown as QishuiCore
    const page = await fetchPage(core, { kind: 'artist', id: 'a1', tab: 'tracks' } as const, 0)
    expect(page.nextCursor).toBe('50')
    expect(artistTracks.mock.calls[0][0]).toBe('a1')
    expect(artistTracks.mock.calls[0][1]).toEqual({ cursor: 0, count: 50 })
  })
})
