// 歌单详情的 `cursor` 到底是不是偏移量？core 的 `playlistTracks({cursor: index, count})` 当它是偏移量用，
// TUI 的歌单列表翻页也按「页序 +1」传。这条探针验一下：同 count 连打 cursor 0 / 5 / 10，
// 看三段曲目重不重复、`next_cursor` 回什么。只读四个请求。
//   node --experimental-strip-types test/probe-playlist-paging.ts
import fs from 'node:fs'
import { createClient } from '../dist/index.js'

const device: any = JSON.parse(fs.readFileSync(`${process.env.HOME}/.qishui/device.json`, 'utf8')).device
const accounts: any = JSON.parse(fs.readFileSync(`${process.env.HOME}/.qishui/accounts.json`, 'utf8'))
const uid = String(accounts.accounts?.[0]?.uid ?? '')
const cookies: any = JSON.parse(fs.readFileSync(`${process.env.HOME}/.qishui/accounts/${uid}.json`, 'utf8')).cookies
const client = await createClient({ device, cookies, timeout: 20_000 })
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// 先搜一个歌单当样本（歌单 id 是长数字）
await sleep(1300)
const found: any = await client.request('Search' as any, {
  search_type: 'playlist',
  q: process.env.PROBE_Q ?? '华语',
  cursor: '0',
  search_id: '00000000-0000-0000-0000-000000000000',
  search_method: 'track',
  from_search_id: '',
  search_scene: '',
})
const groups: any[] = Array.isArray(found?.result_groups) ? found.result_groups : []
const items: any[] = groups.flatMap((g) => (Array.isArray(g.items) ? g.items : Array.isArray(g.data) ? g.data : []))
const playlist = items.map((i) => i?.entity?.playlist).find((p: any) => p?.id)
if (!playlist) throw new Error('没搜到歌单样本')
console.log(
  `样本歌单：${playlist.title ?? playlist.name} id=${playlist.id} 上游报 ${playlist.count_tracks ?? playlist.count ?? '?'} 首`,
)

async function page(cursor: number, count = 5) {
  await sleep(1300)
  const res: any = await client.request('GetPlaylistDetail' as any, {
    playlist_id: String(playlist.id),
    cursor,
    count,
    session_id: '',
    reverse: false,
    ab_param: '',
  })
  const list: any[] = Array.isArray(res?.media_resources) ? res.media_resources : []
  const ids = list.map((x: any) => String(x?.track?.id ?? x?.id ?? ''))
  const names = list.map((x: any) => x?.track?.name ?? x?.name ?? '?')
  return { ids, names, has_more: res?.has_more, next_cursor: res?.next_cursor }
}

const pages = [await page(0), await page(5), await page(10)]
pages.forEach((p, i) => {
  console.log(
    `  cursor=${i * 5} count=5 → ${p.ids.length} 条 has_more=${p.has_more} next_cursor=${JSON.stringify(p.next_cursor)} 例：${p.names.slice(0, 3).join(' / ')}`,
  )
})
const overlap01 = pages[1].ids.filter((id) => pages[0].ids.includes(id)).length
const overlap12 = pages[2].ids.filter((id) => pages[1].ids.includes(id)).length
console.log(
  `\n  结论：0↔5 重复 ${overlap01} 条，5↔10 重复 ${overlap12} 条 → ${overlap01 + overlap12 === 0 ? 'cursor 就是偏移量，能翻页' : '有重复，cursor 不是纯偏移量'}`,
)
