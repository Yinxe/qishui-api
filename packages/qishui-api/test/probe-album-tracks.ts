// 专辑详情一次回多少首？`GetAlbumDetail` 没有分页参数（只有 ignore_tracks），
// 而 core 的 `albumTracks()` 直接把 `tracks[]` 当整张专辑 —— 如果上游只回一部分，
// 「播放整张」就会少歌。挑一张大专辑（搜索里报 50 曲的）量一下。只读，2 个请求。
//   node --experimental-strip-types test/probe-album-tracks.ts
import fs from 'node:fs'
import { createClient } from '../dist/index.js'

const device: any = JSON.parse(fs.readFileSync(`${process.env.HOME}/.qishui/device.json`, 'utf8')).device
const accounts: any = JSON.parse(fs.readFileSync(`${process.env.HOME}/.qishui/accounts.json`, 'utf8'))
const uid = String(accounts.accounts?.[0]?.uid ?? '')
const cookies: any = JSON.parse(fs.readFileSync(`${process.env.HOME}/.qishui/accounts/${uid}.json`, 'utf8')).cookies
const client = await createClient({ device, cookies, timeout: 20_000 })
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const SID = '00000000-0000-0000-0000-000000000000'

await sleep(1300)
const found: any = await client.request('Search' as any, {
  search_type: 'album',
  q: process.env.PROBE_Q ?? '华语经典',
  cursor: '0',
  search_id: SID,
  search_method: 'track',
  from_search_id: '',
  search_scene: '',
})
const items: any[] = (found?.result_groups ?? []).flatMap((g: any) =>
  Array.isArray(g.items) ? g.items : Array.isArray(g.data) ? g.data : [],
)
const albums = items.map((i: any) => i?.entity?.album).filter(Boolean)
const big = albums.sort((a: any, b: any) => (b.count_tracks ?? 0) - (a.count_tracks ?? 0))[0]
console.log(`样本专辑：${big.name} id=${big.id} 上游报 ${big.count_tracks} 曲`)

await sleep(1300)
const res: any = await client.request('GetAlbumDetail' as any, { album_id: String(big.id), ignore_tracks: false })
const tracks: any[] = Array.isArray(res?.tracks) ? res.tracks : []
console.log(
  `GetAlbumDetail ignore_tracks=false → tracks ${tracks.length} 条；album_info.count_tracks=${res?.album_info?.count_tracks}`,
)

await sleep(1300)
const res2: any = await client.request('GetAlbumDetail' as any, { album_id: String(big.id), ignore_tracks: true })
console.log(
  `GetAlbumDetail ignore_tracks=true → keys=${Object.keys(res2 ?? {}).join(',')}；tracks=${Array.isArray(res2?.tracks) ? res2.tracks.length : '(无此键)'}`,
)
console.log(
  tracks.length >= Number(res?.album_info?.count_tracks ?? 0)
    ? '  结论：一次回全量，播放整张不会少歌'
    : '  结论：一次回不全 —— 播放整张会少歌（需要另找分页入口）',
)
