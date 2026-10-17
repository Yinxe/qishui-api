// 再抓几个详情类接口的真实字段（写文档要对得上字段名）
import fs from 'node:fs'
import { createClient } from '../dist/index.js'

const ROOT = new URL('..', import.meta.url).pathname
const OUT = '/tmp/opencode/samples'
const device = JSON.parse(fs.readFileSync(ROOT + 'qishui-device.json', 'utf8'))
const client = await createClient({ device, timeout: 20_000 })
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const dump = async (tag: string, key: any, params: any) => {
  try {
    const r: any = await client.request(key, params)
    const { headers, ...body } = r
    fs.writeFileSync(`${OUT}/${tag}.json`, JSON.stringify(body, null, 2))
    console.log(`${tag}: ok`)
  } catch (err: any) {
    console.log(`${tag}: ${err.name} ${String(err.message).slice(0, 80)}`)
  }
}

const ALBUM = '7169056608998131714'
const ARTIST = '6799466474814572545'
const TRACK = '7168861366286190604'
const USER = '358919577272700'

await dump('albumDetail', 'GetAlbumDetail', { album_id: ALBUM, ignore_tracks: false })
await sleep(1200)
await dump('artistDetail', 'GetArtistDetail', { artist_id: ARTIST, locate_item_id: 0 })
await sleep(1200)
await dump('listArtistTracks', 'ListArtistTracks', { artist_id: ARTIST, cursor: 0, count: 20 })
await sleep(1200)
await dump('userInfo', 'GetUserInfo', { user_id: USER, sec_uid: '' })
await sleep(1200)
await dump('mcheckMedia', 'MCheckMedia', { media_list: [{ id: TRACK, type: 'track' }] })
await sleep(1200)
await dump('mediaStats', 'GetMediaStats', { media_id: TRACK, media_type: 'track' })
await sleep(1200)
await dump('launch', 'Launch', {})
