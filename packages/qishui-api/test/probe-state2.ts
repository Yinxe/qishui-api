// probe-state.ts 的续集：状态既然在搜索响应里，那 core 实际用来铺列表的另外几条路给不给？
// 逐个打「列表来源」——MGetMedia / GetTrack(includes) / GetChartDetail / FeedSongTab / GetArtistDetail，
// 只看每条路的实体里有没有 state / my_artist_stats。id 取自 test/probe-state.ts 的实测样本
// （7534647737145477136 = 搜索回了 state.is_collected=true 的那首；7480099355434027025 = 回了空 state 的那首）。
// 只读，不带任何写接口。
//   node --experimental-strip-types test/probe-state2.ts
import fs from 'node:fs'
import { createClient } from '../dist/index.js'

const ROOT = new URL('..', import.meta.url).pathname
const OUT = '/tmp/opencode/state-samples'
fs.mkdirSync(OUT, { recursive: true })
const coreDevice = `${process.env.HOME}/.qishui/device.json`
const device: any = fs.existsSync(coreDevice)
  ? JSON.parse(fs.readFileSync(coreDevice, 'utf8')).device
  : JSON.parse(fs.readFileSync(ROOT + 'qishui-device.json', 'utf8'))
const accounts: any = JSON.parse(fs.readFileSync(`${process.env.HOME}/.qishui/accounts.json`, 'utf8'))
const uid = String(accounts.accounts?.[0]?.uid ?? '')
const cookies: any = JSON.parse(fs.readFileSync(`${process.env.HOME}/.qishui/accounts/${uid}.json`, 'utf8')).cookies
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const LIKED = process.env.PROBE_LIKED ?? '7534647737145477136'
const UNLIKED = process.env.PROBE_UNLIKED ?? '7480099355434027025'
const CHART = process.env.PROBE_CHART ?? '7060812597884869927'
const ARTIST = process.env.PROBE_ARTIST ?? '6806134901079803905'

const urls: string[] = []
const fetchImpl: typeof fetch = async (input, init) => {
  urls.push(
    String(input)
      .replace(/^https?:\/\/[^/]+/, '')
      .split('?')[0],
  )
  return fetch(input, init)
}
const client = await createClient({ device, cookies, timeout: 20_000, fetchImpl })

/** 只报「哪条路径上有状态字段」，值截断，别把整包响应刷到屏幕上 */
const STATE_KEY = /^state$|collect|follow|my_artist_stats|is_collected/i
function scan(v: unknown, path: string, hits: string[]): void {
  if (Array.isArray(v)) {
    for (const [i, x] of v.entries()) scan(x, `${path}[${i}]`, hits)
    return
  }
  if (v && typeof v === 'object')
    for (const [k, x] of Object.entries(v)) {
      const p = `${path}.${k}`
      if (STATE_KEY.test(k)) hits.push(`${p} = ${JSON.stringify(x)?.slice(0, 90) ?? 'null'}`)
      scan(x, p, hits)
    }
}

async function call(tag: string, key: string, params: any) {
  await sleep(1300)
  const before = urls.length
  let body: any = null
  let err = ''
  try {
    const r: any = await client.request(key as any, params)
    body = Object.fromEntries(Object.entries(r).filter(([k]) => k !== 'headers'))
  } catch (e: any) {
    err = `${e?.name ?? 'Error'} code=${e?.statusCode ?? '—'} ${String(e?.message ?? e).slice(0, 120)}`
  }
  fs.writeFileSync(`${OUT}/2${tag}.json`, JSON.stringify(body ?? { error: err }, null, 2))
  console.log(`\n### ${tag}  →  ${urls.slice(before).join(', ') || '(没发出去)'}`)
  if (err) return console.log(`  ✘ ${err}`)
  const hits: string[] = []
  scan(body, '$', hits)
  console.log(`  ✔ 顶层键 ${Object.keys(body).join(', ')} ｜ 命中 ${hits.length} 处`)
  for (const h of hits.slice(0, 12)) console.log(`      ${h}`)
  if (hits.length > 12) console.log(`      …（其余 ${hits.length - 12} 处见 ${OUT}/2${tag}.json）`)
}

await call('01-MGetMedia(liked+unliked)', 'MGetMedia', {
  scene: 'playlist',
  media: [
    { id: LIKED, type: 'track' },
    { id: UNLIKED, type: 'track' },
  ],
})
await call('02-GetTrack+includes(liked)', 'GetTrack', {
  track_id: LIKED,
  media_type: 'track',
  includes: ['is_collected'],
})
await call('03-GetTrack+includes(unliked)', 'GetTrack', {
  track_id: UNLIKED,
  media_type: 'track',
  includes: ['is_collected'],
})
await call('04-GetChartDetail', 'GetChartDetail', { chart_id: CHART })
await call('05-FeedSongTab(发现推流)', 'FeedSongTab', {
  feed_mode: 'track',
  preference_mode: 'default',
  count: 6,
  is_first_request: true,
  total_request_count: 1,
  preference_mode_request_count: 1,
})
await call('06-GetArtistDetail(已关注)', 'GetArtistDetail', { artist_id: ARTIST, locate_item_id: '0' })
await call('07-GetMediaStats(带 artist_ids)', 'GetMediaStats', {
  media_id: LIKED,
  media_type: 'track',
  artist_ids: [ARTIST],
})
