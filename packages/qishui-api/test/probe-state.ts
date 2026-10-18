// 「列表里为什么看不到喜欢/关注状态」的只读实测台：带会话逐条打，把响应里所有
// 状态类字段（collect / follow / like / mark / boost / state）连同路径打出来，
// 看上游到底给不给、给在哪一层。只发读接口，收尾不写任何东西。
//   node --experimental-strip-types test/probe-state.ts [q=黄霄雲]
import fs from 'node:fs'
import { createClient } from '../dist/index.js'

const ROOT = new URL('..', import.meta.url).pathname
const OUT = '/tmp/opencode/state-samples'
fs.mkdirSync(OUT, { recursive: true })
/** cookie 与 device 成对：cookie 是 core 那台设备注册后拿到的，所以设备身份也一起取 core 的 */
const coreDevice = `${process.env.HOME}/.qishui/device.json`
const device: any = fs.existsSync(coreDevice)
  ? JSON.parse(fs.readFileSync(coreDevice, 'utf8')).device
  : JSON.parse(fs.readFileSync(ROOT + 'qishui-device.json', 'utf8'))
const accounts: any = JSON.parse(fs.readFileSync(`${process.env.HOME}/.qishui/accounts.json`, 'utf8'))
const MY_UID = process.env.PROBE_UID ?? String(accounts.accounts?.[0]?.uid ?? '')
/** 优先用 core 那份按 uid 存的 cookie（最新）；没有才退回包内的 qishui-session.json */
const cookies: any =
  MY_UID && fs.existsSync(`${process.env.HOME}/.qishui/accounts/${MY_UID}.json`)
    ? JSON.parse(fs.readFileSync(`${process.env.HOME}/.qishui/accounts/${MY_UID}.json`, 'utf8')).cookies
    : JSON.parse(fs.readFileSync(ROOT + 'qishui-session.json', 'utf8'))
const QUERY = (process.argv.find((a) => a.startsWith('q=')) ?? 'q=黄霄雲').slice(2)
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** 记录每次实际打出去的 path（选路是不是选对了，直接决定结论可不可信） */
const urls: string[] = []
const fetchImpl: typeof fetch = async (input, init) => {
  urls.push(
    String(input)
      .replace(/^https?:\/\/[^/]+/, '')
      .slice(0, 90),
  )
  return fetch(input, init)
}
const client = await createClient({ device, cookies, timeout: 20_000, fetchImpl })

const STATE_KEY = /collect|follow|like|mark|boost|state|subscri|red/i

function scan(v: unknown, path = '$', hits: string[] = []): string[] {
  if (Array.isArray(v)) {
    for (const [i, x] of v.entries()) scan(x, `${path}[${i}]`, hits)
    return hits
  }
  if (v && typeof v === 'object') {
    for (const [k, x] of Object.entries(v)) {
      const p = `${path}.${k}`
      if (STATE_KEY.test(k)) hits.push(`${p} = ${JSON.stringify(x)?.slice(0, 120) ?? 'null'}`)
      scan(x, p, hits)
    }
  }
  return hits
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
    err = `${e?.name ?? 'Error'} code=${e?.statusCode ?? '—'} ${String(e?.message ?? e).slice(0, 110)}`
  }
  fs.writeFileSync(`${OUT}/${tag}.json`, JSON.stringify(body ?? { error: err }, null, 2))
  console.log(`\n### ${tag}  →  ${urls.slice(before).join(', ') || '(没发出去)'}`)
  if (err) return console.log(`  ✘ ${err}`)
  const hits = scan(body)
  console.log(`  ✔ 顶层键 ${Object.keys(body).join(', ')} ｜ 状态字段 ${hits.length} 处`)
  for (const h of hits.slice(0, 40)) console.log(`      ${h}`)
  return body
}

const me = await call('00-GetMyInfo', 'GetMyInfo', {})
if (!me?.user) console.log('  ⚠️ 会话可能已失效 —— 下面所有「没给状态」的结论都不作数')

const detail = await call('01-Search-artist', 'Search', {
  search_type: 'artist',
  q: QUERY,
  cursor: '0',
  search_id: crypto.randomUUID(),
  search_method: 'artist',
})
const artistId = String(detail?.result_groups?.[0]?.items?.[0]?.entity?.artist?.id ?? '')

const tracks = await call('02-Search-track', 'Search', {
  search_type: 'track',
  q: QUERY,
  cursor: '0',
  search_id: crypto.randomUUID(),
  search_method: 'track',
})
const trackIds: string[] = (tracks?.result_groups ?? [])
  .flatMap((g: any) => g.items ?? [])
  .map((i: any) => String(i?.entity?.track?.id ?? ''))
  .filter(Boolean)
  .slice(0, 3)
console.log(`\n拿到的 id：artist=${artistId || '—'} track=${trackIds.join(', ') || '—'}`)

if (artistId) await call('03-GetArtistDetail', 'GetArtistDetail', { artist_id: artistId, locate_item_id: '0' })
if (trackIds[0])
  await call('04-GetMediaStats', 'GetMediaStats', {
    media_id: trackIds[0],
    media_type: 'track',
    ...(artistId ? { artist_ids: [artistId] } : {}),
  })
if (trackIds[0])
  await call('05-GetTrack+includes', 'GetTrack', {
    track_id: trackIds[0],
    media_type: 'track',
    includes: ['is_collected'],
  })
if (trackIds.length)
  await call('06-MGetMedia', 'MGetMedia', {
    media: trackIds.map((id) => ({ id, type: 'track' })),
    scene: 1,
  })
await call('07-GetArtistCollection', 'GetArtistCollection', { cursor: '0', count: 30 })
if (MY_UID)
  await call('08-GetUserArtistCollection', 'GetUserArtistCollection', { user_id: MY_UID, cursor: '0', count: 30 })
if (MY_UID) await call('09-GetFollowingList', 'GetFollowingList', { user_id: MY_UID, cursor: '0', count: 30, scene: 0 })
await call('10-GetMyMixedCollections', 'GetMyMixedCollections', {
  cursor: '0',
  count: '30',
  item_types: ['track', 'artist'],
})
