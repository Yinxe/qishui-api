// 手写 HTTP 直打（不走本库 transport）—— 用来做对照实验，接口结论只看真实响应。
//
// 什么时候用它：① 一个端点的 path 变体可能只有某几条是活的（Search / GetChartDetail 就是这么救回来的），
// 而 transport 每次只走一条候选；② 端点的行为可能随登录态/会员态变化，需要用同一组参数在不同会话下对照；
// ③ 库返回了什么就记什么 —— 本库不代上游下结论（早先那种「自己抛 UnsupportedError 拦截请求」已删除）。
import fs from 'node:fs'
import { ENDPOINT_DATA } from '../dist/endpoints.js'
import { API_BASE, bodyMd5, commonParams, userAgent } from '../dist/params.js'

export type EndpointDef = (typeof ENDPOINT_DATA)[number]

const DEFS = new Map<string, EndpointDef>()
for (const e of ENDPOINT_DATA) if (!DEFS.has(e.name)) DEFS.set(e.name, e)

export function endpointDef(name: string): EndpointDef | undefined {
  return DEFS.get(name)
}

export function loadDevice(root: string, file = 'qishui-device.json') {
  return JSON.parse(fs.readFileSync(root + file, 'utf8'))
}

export interface Attempt {
  method: string
  path: string
  http: number
  len: number
  /** 业务 status_code（响应是 JSON 才有） */
  statusCode?: number
  statusMsg?: string
  /** 顶层有内容的业务字段（不含 status_code/status_info） */
  meaningful?: string[]
  /** 原始响应文本（截断） */
  text: string
  error?: string
}

/** 按字段 loc 把参数拆成 query / body（POST 时 body 里的字段不再重复出现在 query） */
export function splitParams(def: EndpointDef, params: Record<string, unknown>, method: string) {
  const query: Record<string, unknown> = {}
  const body: Record<string, unknown> = {}
  for (const f of def.fields) {
    const v = params[f.name]
    if (v === undefined || v === null) continue
    if (f.loc === 'query') query[f.name] = v
    if (f.loc === 'body') body[f.name] = v
  }
  if (method === 'POST') for (const k of Object.keys(body)) delete query[k]
  return { query, body }
}

/** 路径插值；有路径参数缺失时返回 null */
export function fillPath(path: string, params: Record<string, unknown>): string | null {
  let missing = false
  const filled = path.replace(/\$\{requestData\.params\.([A-Za-z0-9_]+)\}/g, (_m, k: string) => {
    const v = params[k]
    if (v === undefined || v === null || v === '') missing = true
    return String(v ?? '')
  })
  return missing ? null : filled
}

async function send(
  device: any,
  path: string,
  method: string,
  query: Record<string, unknown>,
  body?: Record<string, unknown>,
  cookie?: string,
) {
  const url = new URL(path, API_BASE)
  for (const [k, v] of Object.entries({ ...commonParams({ device }), ...query })) {
    if (v === undefined || v === null) continue
    if (Array.isArray(v)) for (const i of v) url.searchParams.append(k, String(i))
    else url.searchParams.set(k, String(v))
  }
  const headers: Record<string, string> = {
    'user-agent': userAgent(),
    accept: 'application/json',
    'x-luna-is-local-user': '0',
  }
  if (cookie) headers.cookie = cookie
  let payload: string | undefined
  if (method === 'POST' && body !== undefined) {
    payload = JSON.stringify(body)
    headers['content-type'] = 'application/json; charset=utf-8'
    headers['x-ss-stub'] = bodyMd5(payload)
  }
  const res = await fetch(url.toString(), { method, headers, body: payload, signal: AbortSignal.timeout(20_000) })
  const text = await res.text()
  return { http: res.status, len: text.length, text }
}

/** 把某个端点的每条 path 变体都打一遍（含方法），返回逐条观测结果 */
export async function probeVariants(
  name: string,
  params: Record<string, unknown>,
  opts: { device: any; paceMs?: number; cookie?: string; stopOnSuccess?: boolean },
): Promise<Attempt[]> {
  const def = endpointDef(name)
  if (!def) return []
  const out: Attempt[] = []
  for (const p of def.paths) {
    const path = fillPath(p.path, params)
    if (path === null) continue
    const { query, body } = splitParams(def, params, p.method)
    try {
      const r = await send(opts.device, path, p.method, query, p.method === 'POST' ? body : undefined, opts.cookie)
      const a: Attempt = {
        method: p.method,
        path,
        http: r.http,
        len: r.len,
        text: r.text.replace(/\s+/g, ' ').slice(0, 400),
      }
      if (r.text) {
        try {
          const j = JSON.parse(r.text)
          if (typeof j.status_code === 'number') a.statusCode = j.status_code
          a.statusMsg = j.status_info?.status_msg
          a.meaningful = Object.keys(j).filter((k) => {
            if (['status_code', 'status_info', 'log_id', 'headers'].includes(k)) return false
            const v = j[k]
            if (Array.isArray(v)) return v.length > 0
            if (v && typeof v === 'object') return Object.keys(v).length > 0
            return v != null && v !== ''
          })
        } catch {
          /* 非 JSON，原文已留 */
        }
      }
      out.push(a)
      // 写接口用：一条成功就停，避免同一件事提交多次
      if (opts.stopOnSuccess && a.statusCode === 0) break
    } catch (err) {
      out.push({ method: p.method, path, http: 0, len: 0, text: '', error: String(err).slice(0, 80) })
    }
    if (opts.paceMs) await new Promise((r) => setTimeout(r, opts.paceMs))
  }
  return out
}

/** 把逐条观测归成一个接口级结论（只看响应，不看库） */
export function classifyAttempts(attempts: Attempt[]): {
  verdict: 'ok_json' | 'ok_thin' | 'client_rejected' | 'biz_error' | 'empty_body' | 'error'
  detail: string
  sample?: string
} {
  if (!attempts.length) return { verdict: 'error', detail: '没有可打的 path（路径参数缺失）' }
  const withData = attempts.find((a) => a.statusCode === 0 && a.meaningful?.length)
  if (withData) {
    return {
      verdict: 'ok_json',
      detail: `${withData.method} ${withData.path} 有业务数据`,
      sample: withData.meaningful!.slice(0, 5).join(', '),
    }
  }
  const thin = attempts.find((a) => a.statusCode === 0)
  if (thin) return { verdict: 'ok_thin', detail: `${thin.method} ${thin.path} status_code=0 但无数据` }
  // 1000062 = 上游明确回「应用版本有风险，请从应用商店下载正式版本」：这是上游对客户端的拒绝，
  // 不是参数问题、也不是本库的策略 —— 换个参数 / 带 cookie 都不会变。
  const gated = attempts.find((a) => a.statusCode === 1000062)
  if (gated)
    return {
      verdict: 'client_rejected',
      detail: `status_code=1000062 ${gated.statusMsg ?? ''}（${gated.method} ${gated.path}）`,
    }
  const rejected = attempts.find((a) => a.statusCode !== undefined && a.statusCode !== 0)
  if (rejected) {
    return {
      verdict: 'biz_error',
      detail: `status_code=${rejected.statusCode} ${rejected.statusMsg ?? ''} (${rejected.method} ${rejected.path})`,
    }
  }
  const dead = attempts.find((a) => a.http === 200 && a.len === 0)
  if (dead) return { verdict: 'empty_body', detail: `${dead.method} ${dead.path} → 200 + 0 字节` }
  const err = attempts.find((a) => a.error || a.http >= 400)
  if (err)
    return {
      verdict: 'error',
      detail: err.error ? `${err.method} ${err.path} ${err.error}` : `HTTP ${err.http} (${err.method} ${err.path})`,
    }
  return { verdict: 'error', detail: `${attempts[0].len} 字节响应无法归类` }
}
