// 分页的「页大小」上限：core/TUI 按 count=50 拉歌单，如果上游其实封顶更小（比如 20），
// 翻页游标就是按上游实际返回量走的（我们回传 next_cursor，所以不会漏），但「一次拉 50」的
// 期望值要写对。这里量一下 GetPlaylistDetail 的 count 上限。只读，2 个请求。
//   node --experimental-strip-types test/probe-page-size.ts
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
  search_type: 'playlist',
  q: process.env.PROBE_Q ?? '华语',
  cursor: '0',
  search_id: SID,
  search_method: 'track',
  from_search_id: '',
  search_scene: '',
})
const items: any[] = (found?.result_groups ?? []).flatMap((g: any) =>
  Array.isArray(g.items) ? g.items : Array.isArray(g.data) ? g.data : [],
)
const playlist = items.map((i: any) => i?.entity?.playlist).find((p: any) => p?.id)
console.log(`样本歌单：${playlist?.title} id=${playlist?.id} 上游报 ${playlist?.count_tracks} 首`)

for (const count of [50, 200]) {
  await sleep(1300)
  const res: any = await client.request('GetPlaylistDetail' as any, {
    playlist_id: String(playlist.id),
    cursor: 0,
    count,
    session_id: '',
    reverse: false,
    ab_param: '',
  })
  const list: any[] = Array.isArray(res?.media_resources) ? res.media_resources : []
  console.log(
    `  count=${count} → media_resources ${list.length} 条 has_more=${res?.has_more} next_cursor=${JSON.stringify(res?.next_cursor)}`,
  )
}
