// 抓几个匿名接口的真实响应，落在 /tmp/opencode/samples/*.json，用来核对字段结构（写文档/改采参都靠它）。
import fs from 'node:fs'
import { createClient } from '../dist/index.js'

const ROOT = new URL('..', import.meta.url).pathname
const OUT = '/tmp/opencode/samples'
fs.mkdirSync(OUT, { recursive: true })
const device = JSON.parse(fs.readFileSync(ROOT + 'qishui-device.json', 'utf8'))
const client = await createClient({ device, timeout: 20_000 })

const dump = async (tag: string, key: any, params: any) => {
  try {
    const r: any = await client.request(key, params)
    const { headers, ...body } = r
    fs.writeFileSync(`${OUT}/${tag}.json`, JSON.stringify(body, null, 2))
    console.log(`${tag}: ok, keys=${Object.keys(body).join(',')}`)
    return body
  } catch (err: any) {
    console.log(`${tag}: ${err.name} ${err.message.slice(0, 90)}`)
    return null
  }
}

await dump('discoverView', 'DiscoverView', {})
await new Promise((r) => setTimeout(r, 1200))
await dump('feedSongTab', 'FeedSongTab', {})
await new Promise((r) => setTimeout(r, 1200))
await dump('relatedMedia', 'GetRelatedMedia', { media_list: [{ id: '7168861366286190604', type: 'track' }] })
await new Promise((r) => setTimeout(r, 1200))
await dump('shareInfo', 'GetShareInfo', { item_type: 'track', item_id: '7168861366286190604', extra: {}, scene: '' })
await new Promise((r) => setTimeout(r, 1200))
await dump('listComments', 'ListComments', { group_id: '7168861366286190604', cursor: 0, count: 20, group_type: 1 })
await new Promise((r) => setTimeout(r, 1200))
await dump('playlistDetail', 'GetPlaylistDetail', {
  playlist_id: '7031087145604745223',
  cursor: 0,
  count: 20,
  session_id: '',
  reverse: false,
  ab_param: '',
})
await new Promise((r) => setTimeout(r, 1200))
await dump('sug', 'Sug', { q: '晴天', sug_scene: 'search_sug', sug_search_id: '' })
await new Promise((r) => setTimeout(r, 1200))
await dump('searchBlock', 'GetSearchBlock', {})
await new Promise((r) => setTimeout(r, 1200))
await dump('feedMode', 'FeedMode', {})
await new Promise((r) => setTimeout(r, 1200))
await dump('feedPlaylistSquare', 'FeedPlaylistSquare', { category_id: '' })
await new Promise((r) => setTimeout(r, 1200))
await dump('discoverMix', 'DiscoverMix', {
  block_type: 'discover_feed_playlist',
  sub_channel_id: 'discover_feed_playlist',
})
