// 补一次采集：sceneMode 版 DiscoverView 的块结构（找 radio / playlist 样本 id），以及几个参数拿不准的端点的试探。
import fs from 'node:fs'
import { createClient } from '../dist/index.js'

const ROOT = new URL('..', import.meta.url).pathname
const device = JSON.parse(fs.readFileSync(ROOT + 'qishui-device.json', 'utf8'))
const client = await createClient({ device, timeout: 20_000 })
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const brief = (v: any, d = 0, maxd = 2): string => {
  if (Array.isArray(v)) return `[${v.length}]` + (v.length ? `(${brief(v[0], d + 1, maxd)})` : '')
  if (v && typeof v === 'object') {
    if (d >= maxd) return `{${Object.keys(v).slice(0, 12).join(',')}}`
    return `{${Object.keys(v).map((k) => `${k}:${brief(v[k], d + 1, maxd)}`).join(', ')}}`
  }
  return JSON.stringify(v)?.slice(0, 26) ?? 'null'
}

const scene: any = await client.request('DiscoverView', { first_request: true, pc_new_discover_request: true } as any)
fs.writeFileSync('/tmp/opencode/samples/discoverView-scene.json', JSON.stringify(scene, null, 2))
console.log('### sceneMode blocks:', scene.blocks?.map((b: any) => b.type ?? b.title).join(', '))
for (const b of scene.blocks ?? []) {
  console.log(`  block ${b.type}: inner_block=${b.inner_block?.length}`)
  for (const ib of b.inner_block ?? []) {
    console.log(`    - ${ib.type} title=${ib.title ?? '-'} resources=${ib.resources?.length ?? 0}`)
    const e = ib.resources?.[0]?.entity
    if (e) console.log(`      entity: ${brief(e, 0, 2).slice(0, 400)}`)
  }
}
await sleep(1200)

// 参数试探：拿不准的几个
const tries: Array<[string, any, any]> = [
  ['GetMediaStats', 'media_id+media_type:track', { media_id: '7168861366286190604', media_type: 'track' }],
  ['GetMediaStats', 'media_ids', { media_ids: ['7168861366286190604'], media_type: 'track' }],
  ['SearchCategories', '空 body', {}],
  ['SearchCategories', 'search_type only', { search_type: 'track' }],
  ['FeedRadioTracks', 'radio_id=inner_block_id', { radio_id: '7036274230471712007' }],
  ['FeedRadioTracks', 'scene_mode_id', { radio_id: 48 }],
  ['GetUserMixedCollections', 'user_id=评论区用户', { user_id: '1513348910037939', cursor: 0, count: 20 }],
  ['GetUserInfo', 'user_id=评论区用户', { user_id: '1513348910037939', sec_uid: '' }],
  ['GetFollowerList', 'user_id=评论区用户', { user_id: '1513348910037939', cursor: 0, count: 20, scene: '' }],
  ['GetBlocksSample', '占位', {}],
]
for (const [key, tag, params] of tries) {
  if (key === 'GetBlocksSample') continue
  try {
    const r: any = await client.request(key as any, params)
    const keys = Object.keys(r).filter((k) => !['status_code', 'status_info', 'log_id', 'headers'].includes(k))
    console.log(`[try] ${key.padEnd(24)} ${tag.padEnd(26)} ok  ${brief(keys.reduce((a: any, k) => ((a[k] = r[k]), a), {}), 0, 1).slice(0, 220)}`)
  } catch (err: any) {
    console.log(`[try] ${key.padEnd(24)} ${tag.padEnd(26)} ${err.name} ${String(err.message).slice(0, 70)}`)
  }
  await sleep(1200)
}
