/**
 * 「给人看」的列表渲染。
 *
 * 结构化那份不用在这里转换：`output.emit()` 会递归调用实体的 `toJSON()`，
 * 所以命令里直接把**同一组实体**交给 `emit()`，可视化与 `--json` 天然一致：
 *
 * ```ts
 * emit(() => printTrackList(tracks), { query, tracks, total: tracks.length })
 * ```
 */
import type { Album, Artist, Playlist, Track } from 'qishui-core'
import { duration, trackArtists, trackTitle } from './format.js'
import { printTable, withIdColumn } from './output.js'

/** 三线表：序号 / 曲目 / 歌手 / 时长（+ id 列按全局开关）；VIP/试听这类标记只在详情与播放链路提醒 */
/** 空列表不打表：`search --type all` 每组只有一种实体，剩下的组会把版面塞满空表 */
export function printTrackList(tracks: Track[], opts: { start?: number } = {}): void {
  if (!tracks.length) return
  const start = opts.start ?? 0
  const table = withIdColumn(
    ['序号', '曲目', '歌手', '时长'],
    tracks.map((track, index) => [
      String(start + index + 1),
      trackTitle(track.data),
      trackArtists(track.data),
      duration(track.data.durationMs),
    ]),
    tracks.map((t) => t.id),
  )
  printTable(table.headers, table.rows, { right: [0, 3], flex: [1, 2] })
}

export function printAlbumList(albums: Album[]): void {
  if (!albums.length) return
  const table = withIdColumn(
    ['序号', '专辑', '歌手', '曲目数', '发行'],
    albums.map((album, index) => {
      const data = album.data
      const artists = (data.artists ?? [])
        .map((a) => a?.name)
        .filter(Boolean)
        .join(' / ')
      return [
        String(index + 1),
        data.name ?? '',
        artists || '-',
        data.countTracks ? `${data.countTracks}` : '-',
        data.releaseDate ? new Date(data.releaseDate * 1000).toISOString().slice(0, 10) : '-',
      ]
    }),
    albums.map((a) => a.id),
  )
  printTable(table.headers, table.rows, { right: [0, 3], flex: [1, 2] })
}

export function printArtistList(artists: Artist[]): void {
  if (!artists.length) return
  const table = withIdColumn(
    ['序号', '歌手', '曲目数', '专辑数'],
    artists.map((artist, index) => {
      const data = artist.data
      return [
        String(index + 1),
        data.name ?? '',
        data.countTracks ? `${data.countTracks}` : '-',
        data.countAlbums ? `${data.countAlbums}` : '-',
      ]
    }),
    artists.map((a) => a.id),
  )
  printTable(table.headers, table.rows, { right: [0, 2, 3], flex: [1] })
}

export function printPlaylistList(playlists: Playlist[], opts: { owned?: boolean } = {}): void {
  if (!playlists.length) return
  const rows = playlists.map((playlist, index) => {
    const data = playlist.data
    const marks: string[] = []
    if (data.type === 1) marks.push('我喜欢')
    if (data.type === 2 || (opts.owned && data.type !== 3)) marks.push('私有')
    if (data.type === 4) marks.push('抖音收藏')
    return [
      String(index + 1),
      data.title ?? '',
      data.countTracks !== undefined ? `${data.countTracks} 首` : '-',
      marks.join(' '),
    ]
  })
  const table = withIdColumn(
    ['序号', '歌单', '曲目数', '标记'],
    rows,
    playlists.map((p) => p.id),
  )
  printTable(table.headers, table.rows, { right: [0, 2], flex: [1] })
}
