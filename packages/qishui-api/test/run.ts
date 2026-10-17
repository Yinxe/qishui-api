// 依次实测「音乐 App 需要的那批接口」，产出可达性 + 能力样本报告。
//   node --experimental-strip-types test/run.ts            # 匿名（有会话才跑登录接口）
//   ALLOW_WRITE=1 node --experimental-strip-types test/run.ts   # 允许跑写接口（默认跳过，防误改账号）
//
// 说明：这是「依次发一遍、看回什么」的实测器，不是断言式测试。
// 写接口在未登录时会被 1000016 挡掉（安全），登录后默认跳过（LLM/人要看就 ALLOW_WRITE=1）。

import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import {
  ApiError,
  AuthRequiredError,
  createClient,
  QishuiError,
  RiskControlError,
  registerDevice,
  TransportError,
} from '../dist/index.js'
import { CATALOG, type Ctx, type Entry, GROUPS } from './catalog.ts'
import { classifyAttempts, probeVariants } from './raw.ts'

const ROOT = new URL('..', import.meta.url).pathname
const DEVICE_FILE = ROOT + 'qishui-device.json'
const SESSION_FILE = ROOT + 'qishui-session.json'
const REPORT_OUT = '/tmp/opencode/endpoint-report.json'
const PACE_MS = 1200

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// ---------------------------------------------------------------- 设备 / 会话
const deviceExisted = fs.existsSync(DEVICE_FILE)
const device = deviceExisted ? JSON.parse(fs.readFileSync(DEVICE_FILE, 'utf8')) : await registerDevice()
if (!deviceExisted) fs.writeFileSync(DEVICE_FILE, JSON.stringify(device, null, 2))
const hasSession = fs.existsSync(SESSION_FILE)
const client = await createClient({
  device,
  cookies: hasSession ? JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8')) : {},
  timeout: 20_000,
})
console.log(`[设备] ${deviceExisted ? '复用 qishui-device.json' : '本次新注册'}  did=${device.deviceId?.slice(0, 8)}…`)
console.log(`[会话] ${client.isLoggedIn() ? '已登录（qishui-session.json）' : '无（登录类接口只验拦截）'}\n`)

// 上一轮报告：用来①复用样本 id（不再为采集重发请求）②跳过已得出结论的接口（防风控）。
// FORCE=1 = 全量重测，两样都关掉。
const prevReport: any =
  fs.existsSync(REPORT_OUT) && process.env.FORCE !== '1' ? JSON.parse(fs.readFileSync(REPORT_OUT, 'utf8')) : null

// ---------------------------------------------------------------- 样本 id 采集
const ctx: Ctx = {
  trackId: '',
  albumId: '',
  artistId: '',
  playlistId: '',
  userId: '',
  commentId: '',
  radioId: '',
  mixBlockType: '',
  chartId: '',
  vid: '',
  searchId: randomUUID(),
}

/** 递归收集：按字段形状猜这个 id 是什么实体（DiscoverView 一趟能凑齐大半） */
function harvest(root: unknown, opts: { radio?: boolean } = {}) {
  const seen = new Set<unknown>()
  const walk = (node: any, path: string[]) => {
    if (!node || typeof node !== 'object' || seen.has(node)) return
    seen.add(node)
    if (Array.isArray(node)) {
      for (const v of node) walk(v, path)
      return
    }
    const p = path.join('.').toLowerCase()
    const id = node.id
    if (typeof id === 'string' && id.length >= 8) {
      // track：有 album + artists；album：有 release_date/url_cover 但没 artists；artist：有 url_avatar
      if (!ctx.trackId && node.album && Array.isArray(node.artists) && node.duration != null) ctx.trackId = id
      if (!ctx.albumId && node.release_date != null && node.url_cover != null && !node.artists) ctx.albumId = id
      if (!ctx.artistId && (node.url_avatar != null || node.simple_display_name != null)) ctx.artistId = id
      if (!ctx.playlistId && (node.count_tracks != null || node.resource_cnt != null) && node.title) ctx.playlistId = id
      if (!ctx.userId && node.nickname != null && node.medium_avatar_url != null && id.length >= 15) ctx.userId = id
      if (opts.radio && !ctx.radioId && /radio/.test(p)) ctx.radioId = id
    }
    // 场景队列的 inner_block 条目只有 inner_block_id，没有 resources —— radio_id 就是它
    if (opts.radio && !ctx.radioId && node.type === 'discover_radio' && typeof node.inner_block_id === 'string') {
      ctx.radioId = node.inner_block_id
    }
    // 榜单块同理：inner_block_id 就是要喂给 GetChartDetail 的 chart_id
    if (!ctx.chartId && node.type === 'discover_track_top_list' && typeof node.inner_block_id === 'string') {
      ctx.chartId = node.inner_block_id
    }
    if (!ctx.vid && typeof node.vid === 'string' && node.duration != null) ctx.vid = node.vid
    if (
      !ctx.mixBlockType &&
      typeof node.type === 'string' &&
      /^discover_(playlist|track)/.test(node.type) &&
      path.length <= 4
    ) {
      ctx.mixBlockType = node.type
    }
    for (const [k, v] of Object.entries(node)) walk(v, [...path, k])
  }
  walk(root, [])
}

async function tryCall(key: any, params: any, tag: string) {
  try {
    return await client.request(key, params)
  } catch (err) {
    console.log(`  · 采集 ${tag} 失败：${(err as Error).name}: ${(err as Error).message.slice(0, 70)}`)
    return null
  }
}

console.log('[采集] 从匿名可读接口里凑真实样本 id …')
if (prevReport?.ctx) {
  // 上一轮已经凑齐过，直接复用 —— 采集本身要发 4 个请求，没必要重复
  Object.assign(ctx, prevReport.ctx)
  console.log('[采集] 复用上一轮报告里的样本 id（FORCE=1 可重新采）')
} else {
  const discover: any = await tryCall('DiscoverView', {}, 'DiscoverView')
  if (discover) harvest(discover)
  await sleep(PACE_MS)
  const scene: any = await tryCall(
    'DiscoverView',
    { first_request: true, pc_new_discover_request: true },
    'DiscoverView(sceneMode)',
  )
  if (scene) harvest(scene, { radio: true })
  await sleep(PACE_MS)
  const songTab: any = await tryCall('FeedSongTab', {}, 'FeedSongTab')
  if (songTab) harvest(songTab)
  await sleep(PACE_MS)
  const recommend: any = await tryCall('SuggestWords', { suggest_type: 'recommendation' }, 'SuggestWords')
  if (recommend) harvest(recommend)
  if (!ctx.trackId) ctx.trackId = '7673377691022084142' // 老冒烟用例里验证过的一首
  // 有 trackId + artistId 后，补齐 commentId / radioId / playlistId
  if (ctx.trackId) {
    await sleep(PACE_MS)
    const comments: any = await tryCall(
      'ListComments',
      { group_id: ctx.trackId, cursor: 0, count: 20, group_type: 1 },
      'ListComments',
    )
    if (comments) harvest(comments)
    const first = comments?.comments?.[0] ?? comments?.comment_list?.[0]
    if (first?.id) ctx.commentId = String(first.id)
    if (first?.user?.id) ctx.userId = String(first.user.id) // 评论作者一定是真实用户，比前面猜的可靠
  }
}
console.log(
  `[采集] track=${ctx.trackId || '-'} album=${ctx.albumId || '-'} artist=${ctx.artistId || '-'} playlist=${ctx.playlistId || '-'}\n` +
    `        user=${ctx.userId || '-'} comment=${ctx.commentId || '-'} radio=${ctx.radioId || '-'} chart=${ctx.chartId || '-'} block=${ctx.mixBlockType || '-'}\n`,
)

// ---------------------------------------------------------------- 依次实测
type Verdict =
  | 'ok_json'
  | 'ok_thin'
  | 'login_required'
  | 'biz_error'
  | 'client_rejected'
  | 'empty_body'
  | 'risk_control'
  | 'skipped'
  | 'error'
interface Result {
  group: string
  name: string
  label?: string
  verdict: Verdict
  detail: string
  sample?: string
  /** 本轮是否真发了请求（false = 沿用结论/跳过） */
  sent?: boolean
}

const SKIP_WRITE = client.isLoggedIn() && process.env.ALLOW_WRITE !== '1'

// 已得出结论的接口不重发（防风控）。规则：上一轮既然已经拿到数据（ok_json/ok_thin）或已确知上游拒答
// （client_rejected/empty_body/unsupported——最后两个是旧报告/写接口报告里的名字），重发不会有新信息，默认跳过；
// 要重测就 FORCE=1。
const DONE_VERDICTS = new Set(['ok_json', 'ok_thin', 'client_rejected', 'empty_body', 'unsupported', 'ok'])
const prevVerdicts = new Map<string, string>()
for (const r of prevReport?.results ?? []) prevVerdicts.set(r.label ? `${r.name} · ${r.label}` : r.name, r.verdict)
const labelOf = (e: Entry) => (e.label ? `${e.name} · ${e.label}` : e.name)

function classify(payload: any): { verdict: Verdict; detail: string; sample?: string } {
  const keys = Object.keys(payload).filter((k) => !['status_code', 'status_info', 'log_id', 'headers'].includes(k))
  const meaningful = keys.filter((k) => {
    const v = payload[k]
    if (Array.isArray(v)) return v.length > 0
    if (v && typeof v === 'object') return Object.keys(v).length > 0
    return v != null && v !== ''
  })
  if (!meaningful.length) return { verdict: 'ok_thin', detail: '空数据（只有 status/log）' }
  const sample = meaningful
    .slice(0, 5)
    .map((k) => {
      const v = payload[k]
      const size = Array.isArray(v) ? `[${v.length}]` : v && typeof v === 'object' ? `{${Object.keys(v).length}}` : ''
      return `${k}${size}`
    })
    .join(', ')
  return { verdict: 'ok_json', detail: `字段 ${meaningful.length} 个`, sample }
}

const results: Result[] = []
const byGroup = new Map<string, Entry[]>()
for (const e of CATALOG) {
  const list = byGroup.get(e.group) ?? []
  list.push(e)
  byGroup.set(e.group, list)
}

let n = 0
for (const group of GROUPS) {
  const entries = byGroup.get(group) ?? []
  if (!entries.length) continue
  console.log(`\n=== ${group} ===`)
  for (const e of entries) {
    n++
    const label = e.label ? `${e.name} · ${e.label}` : e.name
    if (e.deprecated) {
      console.log(`  ${String(n).padStart(2)}. ${label.padEnd(46)} SKIP   已弃用，不发请求`)
      results.push({
        group,
        name: e.name,
        label: e.label,
        verdict: 'skipped',
        detail: '已弃用',
        sent: false,
      })
      continue
    }
    const known = prevVerdicts.get(labelOf(e))
    if (known && DONE_VERDICTS.has(known)) {
      console.log(
        `  ${String(n).padStart(2)}. ${label.padEnd(46)} SKIP   沿用上轮结论（${known}），未重发（FORCE=1 可重测）`,
      )
      // 注意：这里要把**上轮的结论**记下来，不能记 'skipped' —— 否则下一轮就丢了这条的结论，会重复打
      results.push({
        group,
        name: e.name,
        label: e.label,
        verdict: known as Verdict,
        detail: `未重发（沿用上轮结论：${known}）`,
        sent: false,
      })
      continue
    }
    if (e.write && SKIP_WRITE) {
      console.log(`  ${String(n).padStart(2)}. ${label.padEnd(46)} SKIP   有会话，写接口默认不跑（ALLOW_WRITE=1 可开）`)
      results.push({
        group,
        name: e.name,
        label: e.label,
        verdict: 'skipped',
        detail: '有会话，写接口默认跳过',
        sent: false,
      })
      continue
    }
    if (e.auth === 'gated') {
      // 标记类（上游对匿名客户端拒答）。库**照常发请求**、不拦 —— 这里额外把每个 path 变体都打一遍：
      // POST 请求 transport 不回退，只看库选中的那一条可能恰好是「空响应」的变体，信息量不够。
      const attempts = await probeVariants(e.name, e.params(ctx) as any, { device, paceMs: PACE_MS })
      for (const a of attempts) {
        const tail =
          a.statusCode !== undefined ? `code=${a.statusCode} ${a.statusMsg ?? ''}` : (a.error ?? '（无 body）')
        console.log(
          `     · ${a.method.padEnd(4)} ${a.path.padEnd(32)} http=${a.http} len=${String(a.len).padStart(6)}  ${tail}`,
        )
      }
      const c = classifyAttempts(attempts)
      console.log(
        `  ${String(n).padStart(2)}. ${label.padEnd(46)} ${c.verdict.padEnd(14)} ${(c.sample ?? c.detail).slice(0, 64)}`,
      )
      results.push({
        group,
        name: e.name,
        label: e.label,
        verdict: c.verdict,
        detail: `【上游·全变体】${c.detail}`,
        sample: c.sample,
        sent: true,
      })
      continue
    }
    let verdict: Verdict = 'error'
    let detail = ''
    let sample: string | undefined
    try {
      const payload: any = await client.request(e.name as any, e.params(ctx) as any)
      const c = classify(payload)
      verdict = c.verdict
      detail = c.detail
      sample = c.sample
      console.log(`  ${String(n).padStart(2)}. ${label.padEnd(46)} ${verdict.padEnd(14)} ${sample ?? detail}`)
    } catch (err) {
      if (err instanceof AuthRequiredError) {
        verdict = 'login_required'
        detail = '需要登录'
      } else if (err instanceof RiskControlError) {
        verdict = 'risk_control'
        detail = err.message
      } else if (err instanceof TransportError && /空响应体/.test(err.message)) {
        verdict = 'empty_body'
        detail = '200 + 0 字节'
      } else if (err instanceof ApiError) {
        verdict = 'biz_error'
        detail = `status_code=${err.statusCode}`
        if (err.statusCode === 1000016) verdict = 'login_required'
      } else if (err instanceof QishuiError) {
        verdict = 'error'
        detail = `${err.name}: ${err.message.slice(0, 80)}`
      } else {
        verdict = 'error'
        detail = (err as Error).message.slice(0, 80)
      }
      console.log(`  ${String(n).padStart(2)}. ${label.padEnd(46)} ${verdict.padEnd(14)} ${detail}`)
    }
    results.push({ group, name: e.name, label: e.label, verdict, detail, sample, sent: true })
    await sleep(PACE_MS)
  }
}

// ---------------------------------------------------------------- 汇总
const tally = new Map<string, number>()
for (const r of results) tally.set(r.verdict, (tally.get(r.verdict) ?? 0) + 1)
const sent = results.filter((r) => r.sent).length
console.log('\n=== 汇总 ===')
console.log(
  `共 ${results.length} 条（本次发出 ${sent} 条、未重发 ${results.length - sent} 条）：` +
    [...tally.entries()].map(([k, v]) => `${k}=${v}`).join('  '),
)
fs.mkdirSync('/tmp/opencode', { recursive: true })
fs.writeFileSync(
  REPORT_OUT,
  JSON.stringify({ at: new Date().toISOString(), loggedIn: client.isLoggedIn(), ctx, results }, null, 2),
)
console.log(`明细 JSON → ${REPORT_OUT}`)
