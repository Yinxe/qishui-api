// 全量扫一遍 320 个端点：用启发式参数（已知 id 字段填采集到的真样本，q/cursor/count 给常规值），
// 看除了精选清单之外还有哪些端点匿名就能出数据。
//   node --experimental-strip-types test/sweep-all.ts
// 注意：debug_params 一律不发（实测带了就 1000004）；gated 的三个播放地址接口跳过。
import fs from 'node:fs'
import { ENDPOINT_DATA } from '../dist/endpoints.js'
import { API_BASE, bodyMd5, commonParams, userAgent } from '../dist/params.js'
import { CATALOG, type Ctx } from './catalog.ts'

const ROOT = new URL('..', import.meta.url).pathname
const device = JSON.parse(fs.readFileSync(ROOT + 'qishui-device.json', 'utf8'))
const common = commonParams({ device })
const ctx: Ctx = JSON.parse(fs.readFileSync('/tmp/opencode/endpoint-report.json', 'utf8')).ctx
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** 字段名 → 猜测值 */
function guess(name: string): string | number | undefined {
  const n = name.toLowerCase()
  if (n === 'debug_params') return undefined // 带了就 1000004
  if (/^(track_id|track_ids|media_id|media_ids|item_id|content_id|group_id|id|ids|video_id|modal_id)$/.test(n))
    return ctx.trackId
  if (/album_id/.test(n)) return ctx.albumId
  if (/artist_id/.test(n)) return ctx.artistId
  if (/playlist_id|playlist_ids/.test(n)) return ctx.playlistId
  if (/^user_id|^uid|sec_uid|to_user_id/.test(n)) return ctx.userId
  if (/comment_id/.test(n)) return ctx.commentId
  if (/radio_id/.test(n)) return ctx.radioId
  if (/chart_id/.test(n)) return ctx.chartId
  if (/^vid$/.test(n)) return ctx.vid
  if (/^(q|keyword|keywords|query|search_word|word)$/.test(n)) return '晴天'
  if (/^(cursor|offset|next_cursor|cursor_str)$/.test(n)) return '0'
  if (/^(count|limit|size|page_size|num)$/.test(n)) return 20
  if (/search_type|search_method/.test(n)) return 'track'
  if (/^search_id|^from_search_id/.test(n)) return ctx.searchId
  if (
    /^(scene|scene_name|ab_param|from_query|extra|report_param|debug|sug_scene|sug_search_id|session_id|locale)$/.test(
      n,
    )
  )
    return ''
  return undefined
}

const seenKeys = new Set<string>()
const results: any[] = []
const catalogNames = new Set(CATALOG.map((e) => e.name))

for (const def of ENDPOINT_DATA) {
  if (def.gated) continue
  if (seenKeys.has(def.key)) continue
  seenKeys.add(def.key)

  const params: Record<string, unknown> = {}
  for (const f of def.fields) {
    if (f.name in params) continue
    const v = guess(f.name)
    if (v !== undefined) params[f.name] = v
  }

  let done = false
  for (const p of def.paths) {
    if (done) break
    let missing = false
    const path = p.path.replace(/\$\{requestData\.params\.([A-Za-z0-9_]+)\}/g, (_m, k: string) => {
      const v = params[k]
      if (v === undefined || v === null || v === '') missing = true
      return String(v ?? '')
    })
    if (missing) continue
    // 多条同方法变体时，非 pc 的先试（实测 Search/GetChartDetail 都是 pc 死的）
    const query: Record<string, unknown> = {}
    const body: Record<string, unknown> = {}
    for (const f of def.fields) {
      if (!(f.name in params) || params[f.name] === undefined) continue
      if (f.loc === 'query') query[f.name] = params[f.name]
      if (f.loc === 'body') body[f.name] = params[f.name]
    }
    if (p.method === 'POST') for (const k of Object.keys(body)) delete query[k]
    try {
      const url = new URL(path, API_BASE)
      for (const [k, v] of Object.entries({ ...common, ...query })) {
        if (v === undefined || v === null) continue
        if (Array.isArray(v)) for (const i of v) url.searchParams.append(k, String(i))
        else url.searchParams.set(k, String(v))
      }
      const headers: Record<string, string> = {
        'user-agent': userAgent(),
        accept: 'application/json',
        'x-luna-is-local-user': '0',
      }
      let payload: string | undefined
      if (p.method === 'POST') {
        payload = JSON.stringify(body)
        headers['content-type'] = 'application/json; charset=utf-8'
        headers['x-ss-stub'] = bodyMd5(payload)
      }
      const res = await fetch(url.toString(), {
        method: p.method,
        headers,
        body: payload,
        signal: AbortSignal.timeout(20_000),
      })
      const text = await res.text()
      let verdict = 'other'
      let detail = `http=${res.status} len=${text.length}`
      if (!text) verdict = 'empty_body'
      else {
        try {
          const j = JSON.parse(text)
          const code = j.status_code ?? 0
          if (code === 1000016) verdict = 'login_required'
          else if (code !== 0) verdict = `biz_error_${code}`
          else {
            const keys = Object.keys(j).filter((k) => !['status_code', 'status_info'].includes(k))
            const meaning = keys.filter((k) => {
              const v = j[k]
              if (Array.isArray(v)) return v.length > 0
              if (v && typeof v === 'object') return Object.keys(v).length > 0
              return v != null && v !== ''
            })
            if (meaning.length) {
              verdict = 'ok_json'
              detail = meaning
                .slice(0, 5)
                .map((k) => `${k}${Array.isArray(j[k]) ? `[${j[k].length}]` : ''}`)
                .join(',')
            } else verdict = 'ok_thin'
          }
        } catch {
          verdict = 'non_json'
        }
      }
      if (verdict === 'ok_json' || verdict === 'ok_thin' || verdict === 'empty_body') done = true
      results.push({
        key: def.key,
        name: def.name,
        method: p.method,
        path,
        official: def.official,
        inCatalog: catalogNames.has(def.name),
        verdict,
        detail,
        params: Object.keys(params),
      })
    } catch (err) {
      results.push({
        key: def.key,
        name: def.name,
        method: p.method,
        path,
        verdict: 'ERR',
        detail: String(err).slice(0, 60),
      })
    }
    await sleep(900)
  }
}

fs.writeFileSync('/tmp/opencode/sweep-all.json', JSON.stringify(results, null, 1))
const t: Record<string, number> = {}
for (const r of results) t[r.verdict] = (t[r.verdict] ?? 0) + 1
console.log('扫描条目（path 次数）：', results.length, JSON.stringify(t))
console.log('\n=== 拿到数据的端点（ok_json / ok_thin），★ = 不在精选清单里 ===')
for (const r of results) {
  if (r.verdict !== 'ok_json' && r.verdict !== 'ok_thin') continue
  console.log(
    `  ${r.inCatalog ? ' ' : '★'} ${r.verdict.padEnd(9)} ${r.official ? '官方' : '    '} ${r.method.padEnd(4)} ${r.name.padEnd(34)} ${r.path.replace('/luna', '').padEnd(46)} ${r.detail.slice(0, 60)}`,
  )
}
