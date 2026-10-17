// Search 系接口的手工变体试探：绕过 transport 的自动选路，直接按 path × method × 参数形态打。
//   node --experimental-strip-types test/probe-search.ts
import fs from 'node:fs'
import { randomUUID } from 'node:crypto'
import { createHash } from 'node:crypto'
import { commonParams, userAgent, API_BASE, bodyMd5 } from '../dist/params.js'

const ROOT = new URL('..', import.meta.url).pathname
const device = JSON.parse(fs.readFileSync(ROOT + 'qishui-device.json', 'utf8'))
const common = commonParams({ device })
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function raw(path: string, method: 'GET' | 'POST', query: Record<string, string>, body?: unknown) {
  const url = new URL(path, API_BASE)
  for (const [k, v] of Object.entries({ ...common, ...query })) if (v !== undefined && v !== null) url.searchParams.set(k, String(v))
  const headers: Record<string, string> = { 'user-agent': userAgent(), accept: 'application/json', 'x-luna-is-local-user': '0' }
  let payload: string | undefined
  if (method === 'POST' && body !== undefined) {
    payload = JSON.stringify(body)
    headers['content-type'] = 'application/json; charset=utf-8'
    headers['x-ss-stub'] = bodyMd5(payload)
  }
  const res = await fetch(url.toString(), { method, headers, body: payload, signal: AbortSignal.timeout(20_000) })
  const text = await res.text()
  return { http: res.status, len: text.length, body: text.slice(0, 300) }
}

const SEARCH_ID = randomUUID()
const baseQuery = (searchType: string, debug: string | undefined) => {
  const q: Record<string, string> = {
    q: '晴天',
    cursor: '0',
    search_id: SEARCH_ID,
    search_method: searchType,
    from_search_id: '',
    search_scene: '',
  }
  if (debug !== undefined) q.debug_params = debug
  return q
}

const noDebug = (searchType: string) => {
  const q = baseQuery(searchType, undefined)
  delete q.debug_params
  return q
}

const cases: Array<[string, string, 'GET' | 'POST', Record<string, string>, unknown?]> = [
  ['裸 GET · debug=""', '/luna/search/track', 'GET', baseQuery('track', '')],
  ['裸 GET · debug 完全省略', '/luna/search/track', 'GET', noDebug('track')],
  ['裸 GET · debug="null"', '/luna/search/track', 'GET', baseQuery('track', 'null')],
  ['裸 GET · debug="{}"', '/luna/search/track', 'GET', baseQuery('track', '{}')],
  ['裸 GET all · debug=""', '/luna/search/all', 'GET', baseQuery('all', '')],
  ['裸 GET artist · debug=""', '/luna/search/artist', 'GET', baseQuery('artist', '')],
  ['裸 GET playlist · debug=""', '/luna/search/playlist', 'GET', baseQuery('playlist', '')],
  ['裸 GET · method=search', '/luna/search/track', 'GET', { ...baseQuery('track', ''), search_method: 'search' }],
  ['裸 GET · 无 cursor/search_scene', '/luna/search/track', 'GET', { q: '晴天', search_id: SEARCH_ID, search_method: 'track', debug_params: '' }],
  ['裸 POST · body 带 debug=""', '/luna/search/track', 'POST', {}, { ...baseQuery('track', ''), search_type: 'track' }],
  ['pc GET · debug="" + scene_name', '/luna/pc/search/track', 'GET', { ...baseQuery('track', ''), scene_name: 'search_page' }],
  ['pc GET · method=search', '/luna/pc/search/track', 'GET', { ...baseQuery('track', ''), search_method: 'search' }],
]

for (const [tag, path, method, query, body] of cases) {
  try {
    const r = await raw(path, method, query, body)
    const head = r.body.replace(/\s+/g, ' ').slice(0, 160)
    console.log(`${r.http}  len=${String(r.len).padStart(6)}  ${tag.padEnd(34)} ${path}\n        ${head}`)
  } catch (err) {
    console.log(`ERR ${tag}: ${String(err).slice(0, 80)}`)
  }
  await sleep(1200)
}
