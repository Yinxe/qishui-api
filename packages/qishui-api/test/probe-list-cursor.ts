// 「列表类接口的 cursor 是不是偏移量、count 认不认」——core 的 `Paged.cursor` 原样回传上游 `next_cursor`，
// 上层（TUI 列表翻页 / CLI --pages）要照着传，而不是自己页号 +1。这条探针一次验三处：
//   ListArtistTracks / ListArtistAlbums / ListComments
// 做法：先打第一页，拿它的 `next_cursor` 再打第二页，看两页 id 交集。
//   交集 0 → 游标能翻页（按 next_cursor 原样回传就是对的）
//   交集 > 0 → 游标不是纯偏移量，得另找形态
// 样本艺人默认林俊杰（曲目 200+，能翻出第二页）；`PROBE_ARTIST` / `PROBE_TRACK_Q` 可换。只读，5 个请求。
//   node --experimental-strip-types test/probe-list-cursor.ts
import fs from 'node:fs'
import { createClient } from '../dist/index.js'

const device: any = JSON.parse(fs.readFileSync(`${process.env.HOME}/.qishui/device.json`, 'utf8')).device
const accounts: any = JSON.parse(fs.readFileSync(`${process.env.HOME}/.qishui/accounts.json`, 'utf8'))
const uid = String(accounts.accounts?.[0]?.uid ?? '')
const cookies: any = JSON.parse(fs.readFileSync(`${process.env.HOME}/.qishui/accounts/${uid}.json`, 'utf8')).cookies
const client = await createClient({ device, cookies, timeout: 20_000 })
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const SID = '00000000-0000-0000-0000-000000000000'

async function search(type: string, q: string): Promise<any[]> {
  await sleep(1300)
  const body: any = await client.request('Search' as any, {
    search_type: type,
    q,
    cursor: '0',
    search_id: SID,
    search_method: 'track',
    from_search_id: '',
    search_scene: '',
  })
  const groups: any[] = Array.isArray(body?.result_groups) ? body.result_groups : []
  return groups.flatMap((g) => (Array.isArray(g.items) ? g.items : Array.isArray(g.data) ? g.data : []))
}

async function artistTracks(artistId: string, cursor: string, count: string) {
  await sleep(1300)
  const res: any = await client.request('ListArtistTracks' as any, { artist_id: artistId, cursor, count })
  const list: any[] = Array.isArray(res?.tracks) ? res.tracks : []
  return { ids: list.map((t: any) => String(t?.id ?? '')), hasMore: res?.has_more, next: res?.next_cursor }
}

async function artistAlbums(artistId: string, cursor: string, count: string) {
  await sleep(1300)
  const res: any = await client.request('ListArtistAlbums' as any, { artist_id: artistId, cursor, count })
  const list: any[] = Array.isArray(res?.albums) ? res.albums : []
  return { ids: list.map((a: any) => String(a?.id ?? '')), hasMore: res?.has_more, next: res?.next_cursor }
}

async function comments(trackId: string, cursor: string, count: number) {
  await sleep(1300)
  const res: any = await client.request('ListComments' as any, { group_id: trackId, cursor, count, group_type: 1 })
  const list: any[] = Array.isArray(res?.comments) ? res.comments : []
  return { ids: list.map((c: any) => String(c?.id ?? '')), hasMore: res?.has_more, next: res?.cursor }
}

type Page = { ids: string[]; hasMore: any; next: any }

function report(tag: string, first: Page, second: Page) {
  const overlap = second.ids.filter((id) => first.ids.includes(id)).length
  console.log(
    `  ${tag}: 第一页 ${first.ids.length} 条 has_more=${first.hasMore} next_cursor=${JSON.stringify(first.next)}`,
  )
  console.log(
    `  ${tag}: 第二页 ${second.ids.length} 条 has_more=${second.hasMore} next_cursor=${JSON.stringify(second.next)}`,
  )
  if (!first.ids.length) console.log(`  ${tag}: 第一页就是空的（该端点上没数据），翻页未验证`)
  else if (!second.ids.length) console.log(`  ${tag}: 第二页为空，翻页未验证`)
  else
    console.log(
      `  ${tag}: 两页重复 ${overlap} 条 → ${overlap === 0 ? '按 next_cursor 回传就能翻页' : '游标不是纯偏移量（别自己页号 +1，也别按 count 累加）'}`,
    )
}

const artists = await search('artist', process.env.PROBE_ARTIST_Q ?? '林俊杰')
const artist = artists.map((i) => i?.entity?.artist).find((a: any) => a?.id)
const artistId = String(process.env.PROBE_ARTIST ?? artist?.id)
console.log(`样本艺人：${artist?.name} id=${artistId}（count 统一传字符串 '50'）`)

const at1 = await artistTracks(artistId, '0', '50')
const at2 = await artistTracks(artistId, String(at1.next ?? '50'), '50')
report('ListArtistTracks', at1, at2)

const aa1 = await artistAlbums(artistId, '0', '50')
const aa2 = await artistAlbums(artistId, String(aa1.next ?? '50'), '50')
report('ListArtistAlbums', aa1, aa2)

const tracks = await search('track', process.env.PROBE_TRACK_Q ?? '周杰伦')
const track = tracks.map((i) => i?.entity?.track).find((t: any) => t?.id)
const cm1 = await comments(String(track.id), '0', 10)
const cm2 = await comments(String(track.id), String(cm1.next ?? '10'), 10)
report('ListComments', cm1, cm2)
