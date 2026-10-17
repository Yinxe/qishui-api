// catalog 体检（纯离线，不碰上游）：拿 dist 里的 ENDPOINT_DATA + 生成的 IDL 函数跑一遍假 caller，
// 机械地查出「写了但会被静默丢掉」的参数（= 名字写错）、不存在的端点 key、结构字段缺失。
//
//   node --experimental-strip-types test/check-catalog.ts
//
// 为什么需要它：transport 是「按 IDL 字段名挑值」的（fieldsAssign），参数名写错不会报错，请求照发、
// 上游当没传 —— 2026-10-17 就是这么发现 GetRelatedMedia 的 media_id / ShareCount 的 item_id 被丢掉的。
import { ENDPOINT_DATA, ENDPOINT_NAMES, type EndpointDef, endpointFn } from '../dist/index.js'
import { CATALOG, type Ctx, GROUPS } from './catalog.ts'

/** 假样本 id：只用来喂 params(ctx)，不发给上游，值只要非空即可 */
const ctx: Ctx = {
  trackId: '7068138081588611073',
  albumId: '7068138079545985025',
  artistId: '6810215791951087618',
  playlistId: '7031081053599238175',
  userId: '4075251663115050',
  commentId: '7419250301448733455',
  radioId: '7598207133906632731',
  mixBlockType: 'discover_playlist',
  chartId: '7036274230471712007',
  vid: 'v10ad6g50000da5sbdfog65llf93093g',
  searchId: 'e3752657-6003-49bf-859f-b616d7a9e112',
}

const defs = new Map<string, EndpointDef>()
for (const d of ENDPOINT_DATA) {
  if (!defs.has(d.key)) defs.set(d.key, d)
  if (d.alias && !defs.has(d.alias)) defs.set(d.alias, d)
}

const AUTH_LEVELS = ['anon', 'login', 'gated']
const problems: string[] = []
const hints: string[] = []
const seen = new Map<string, number>()

for (const entry of CATALOG) {
  const label = entry.label ? `${entry.name} · ${entry.label}` : entry.name
  const bad: string[] = []

  // ---- 结构字段（catalog.ts 的 Entry 约束，运行时再兜一层）
  if (!entry.group) bad.push('缺 group')
  else if (!(GROUPS as readonly string[]).includes(entry.group)) bad.push(`group 不在 GROUPS 里：${entry.group}`)
  if (!entry.name) bad.push('缺 name')
  if (!entry.auth) bad.push('缺 auth')
  else if (!AUTH_LEVELS.includes(entry.auth)) bad.push(`auth 取值非法：${entry.auth}`)
  if (!entry.capability) bad.push('缺 capability')
  if (typeof entry.params !== 'function') bad.push('缺 params 函数')
  if (entry.write && entry.auth !== 'login') bad.push('write 接口的 auth 不是 login')
  const dup = `${entry.group}|${entry.name}|${entry.label ?? ''}`
  seen.set(dup, (seen.get(dup) ?? 0) + 1)

  // ---- 端点 key 真实性
  const def = defs.get(entry.name)
  if (!ENDPOINT_NAMES.includes(entry.name as never) || !def) bad.push(`端点 key 不在 IDL 里：${entry.name}`)

  let params: Record<string, unknown> = {}
  if (typeof entry.params === 'function') {
    try {
      params = entry.params(ctx) as Record<string, unknown>
    } catch (err) {
      bad.push(`params(ctx) 抛错：${(err as Error).message.slice(0, 80)}`)
    }
  }

  // ---- 真实映射：让生成的 IDL 函数跑一遍，看哪些字段真进了 query/body
  let recorded: { query: unknown; body: unknown; paths: unknown } | undefined
  if (def) {
    try {
      const fn = endpointFn(entry.name as never) as unknown as (
        caller: unknown,
        req: unknown,
        context: unknown,
      ) => Promise<unknown>
      await fn(
        async (payload: any) => {
          recorded = { query: payload.query, body: payload.body, paths: payload.paths }
          return {}
        },
        params,
        { __key: entry.name },
      )
    } catch (err) {
      bad.push(`跑 IDL 函数抛错：${(err as Error).message.slice(0, 80)}`)
    }
  }

  if (recorded) {
    const used = new Set([
      ...Object.keys((recorded.query ?? {}) as object),
      ...Object.keys((recorded.body ?? {}) as object),
    ])
    const pathText = JSON.stringify(recorded.paths ?? [])
    for (const [key, value] of Object.entries(params)) {
      if (used.has(key)) continue
      // 路径参数：生成函数把值插值进 path，能在 path 文本里找到（空串没法判断，跳过）
      const inPath = value !== undefined && value !== null && value !== '' && pathText.includes(String(value))
      if (!inPath) bad.push(`参数 ${key} 会被丢弃（不在 query/body/path，值=${JSON.stringify(value)}）`)
    }
    // ---- 必填未送：只是提示（thrift 的 required 常跟上游实际口味对不上，如 search.SearchRequest 的 debug_params 带了反而 1000004）
    const missing = def!.fields
      .filter((f) => f.required && f.name !== 'debug_params' && !(f.name in params))
      .map((f) => `${f.name}(${f.loc})`)
    if (missing.length) hints.push(`${label}：必填未送 ${missing.join(' ')}`)
  }

  if (bad.length) problems.push(`${label}\n    ${bad.join('\n    ')}`)
}

for (const [key, n] of seen) if (n > 1) problems.push(`重复条目 ×${n}：${key}`)

const byAuth = new Map<string, number>()
for (const e of CATALOG) byAuth.set(e.auth, (byAuth.get(e.auth) ?? 0) + 1)

if (hints.length) {
  console.log(`\n提示（不影响结论，thrift 的 required 与上游实际口味不一致）：`)
  for (const h of hints) console.log(`  · ${h}`)
}
if (problems.length) {
  console.log(`\n问题：`)
  for (const p of problems) console.log(`  ✗ ${p}`)
}
const tally = [...byAuth].map(([k, v]) => `${k}=${v}`).join(' ')
console.log(`\n${CATALOG.length} 条（${tally}），${problems.length} 条有问题`)
process.exit(problems.length ? 1 : 0)
