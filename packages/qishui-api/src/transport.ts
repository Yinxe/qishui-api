import { CookieJar } from './cookies.js'
import { ENDPOINT_DATA, type EndpointDef } from './endpoints.js'
import { ApiError, AuthRequiredError, QishuiError, RiskControlError, StatusCode, TransportError } from './errors.js'
import type { IRequestCaller, IRequestPayload } from './idl/_common.js'
import { API_BASE, bodyMd5, commonParams, type DeviceIdentity, userAgent } from './params.js'

export interface TransportOptions {
  device: DeviceIdentity
  cookies?: CookieJar
  baseUrl?: string
  /** 单次请求超时 ms，官方客户端未设默认超时 */
  timeout?: number
  fetchImpl?: typeof fetch
  /** 打印每次请求的 method/path/status/logid */
  logger?: (line: string) => void
}

const byName = new Map<string, EndpointDef>()
for (const e of ENDPOINT_DATA) if (!byName.has(e.name)) byName.set(e.name, e)

/**
 * 纯 HTTP 版的 apiCaller（对应 services/request/request.ts 的 RequestService.apiCaller）。
 * 与官方实现的差异，都是被迫的：
 *  - 官方走 @luna/ttnet(Cronet) + native 签名，这里走 global fetch；
 *  - 官方遇 bdturing-verify 会弹验证码窗口并重放，这里没有 UI，直接抛 RiskControlError；
 *  - 官方 cookie 由 native cookie jar 管理，这里由 CookieJar 显式管理。
 *
 * 关于 goapi 播放地址类接口（`def.gated`）：本库**照常发请求，不代上游下结论**。
 * 上游对匿名/非官方客户端可能回 `1000062 应用版本有风险` 或空响应（实测如此），那就是上游的答案；
 * 是否与登录态/会员有关尚未验证，所以 `gated` 只是元数据标记，不影响调用行为。
 * `1000062` 那道门后来被证明是 **query 参数 `device_platform`**（`commonParams` 发的是 `windows`；
 * `/luna/h5/track_v2` 带 `device_platform=web` 就匿名放行，见 `src/web/h5Track.ts`），不是「客户端完整性校验」。
 * `query` 在 `commonParams()` 之后展开，所以请求级传 `device_platform` 能覆盖这个默认值。
 */
export function createCaller(options: TransportOptions): IRequestCaller {
  const cookies = options.cookies ?? new CookieJar()
  const fetchImpl = options.fetchImpl ?? fetch

  return async (data: IRequestPayload): Promise<any> => {
    const key = (data.context as { __key?: string } | undefined)?.__key
    const def = (key ? ENDPOINT_DATA.find((e) => e.key === key) : undefined) ?? byName.get(data.name)
    if (!def) throw new QishuiError(`IDL 中找不到端点 ${data.name}`)

    // 路径参数在 IDL 函数里已经插值完毕（模板串在 caller 之前求值），所以直接用 data.paths。
    // 选择规则复刻官方 apiCaller：优先 /luna/pc/ 且方法匹配，其次方法匹配，最后第一个。
    // 但实测有的端点 pc 变体是死的（Search：/luna/pc/search/x 恒 200+0字节，/luna/search/x 正常），
    // 所以按候选顺序依次尝试，遇到「空响应体 / 404」就换下一条 —— 只在这些路径级失败上回退。
    const declared = def.declaredMethod
    const seen = new Set<string>()
    const candidates: typeof data.paths = []
    const add = (p: (typeof data.paths)[number] | undefined) => {
      if (!p) return
      const k = `${p.method} ${p.path}`
      if (seen.has(k)) return
      seen.add(k)
      candidates.push(p)
    }
    add(data.paths.find((p) => p.path.startsWith('/luna/pc/') && p.method === declared))
    add(data.paths.find((p) => p.method === declared))
    for (const p of data.paths) add(p)
    if (!candidates.length) throw new QishuiError(`${def.name} 没有可用 path`)

    const timeout = (data.context as { timeout?: number } | undefined)?.timeout ?? options.timeout
    let lastErr: unknown

    for (let i = 0; i < candidates.length; i++) {
      const path = candidates[i]
      // POST 时 body 已有的字段不再进 query —— 官方 apiCaller 的同一段逻辑
      const query: Record<string, unknown> = { ...(data.query ?? {}) }
      if (path.method === 'POST') {
        for (const k of Object.keys(data.body ?? {})) delete query[k]
      }

      const url = new URL(path.path, options.baseUrl ?? API_BASE)
      const all = { ...commonParams({ device: options.device }), ...query }
      for (const [k, v] of Object.entries(all)) {
        if (v === undefined || v === null) continue
        if (Array.isArray(v)) for (const item of v) url.searchParams.append(k, String(item))
        else url.searchParams.set(k, String(v))
      }

      const headers: Record<string, string> = {
        'user-agent': userAgent(),
        accept: 'application/json',
        'x-luna-is-local-user': cookies.isLoggedIn() ? '1' : '0',
      }
      const cookieHeader = cookies.header()
      if (cookieHeader) headers.cookie = cookieHeader

      let payload: string | undefined
      if (path.method !== 'GET' && path.method !== 'HEAD' && data.body != null) {
        payload = JSON.stringify(data.body)
        headers['content-type'] = 'application/json; charset=utf-8'
        headers['x-ss-stub'] = bodyMd5(payload)
      }

      const signal = timeout ? AbortSignal.timeout(timeout) : undefined
      let res: Response
      try {
        res = await fetchImpl(url.toString(), { method: path.method, headers, body: payload, signal })
      } catch (err) {
        throw new TransportError(`${def.name} 请求失败: ${String(err)}`, { cause: err })
      }

      const setCookie = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : []
      cookies.absorb(setCookie)

      const logid = res.headers.get('x-tt-logid') ?? ''
      options.logger?.(`${path.method} ${path.path} http=${res.status} logid=${logid}`)

      // 风控：官方在这里弹窗口，纯 HTTP 客户端只能上抛
      const captcha = res.headers.get('bdturing-verify')
      if (captcha) throw new RiskControlError('captcha', captcha)
      const secondVerify = res.headers.get('x-tt-verify-passport-decision')
      if (secondVerify) throw new RiskControlError('passport-second-verify', secondVerify)

      try {
        if (res.status < 200 || res.status >= 300) {
          throw new TransportError(`${def.name} HTTP ${res.status}`, await safeText(res))
        }

        const text = await res.text()
        if (!text) {
          // 空响应体是网关拒绝的典型形态（native 签名缺失时就是这样）
          throw new TransportError(`${def.name} 返回空响应体（http=${res.status}），网关未放行`)
        }
        let json: any
        try {
          json = JSON.parse(text)
        } catch {
          throw new TransportError(`${def.name} 响应非 JSON`, text.slice(0, 500))
        }

        const code = json?.status_code
        if (typeof code === 'number' && code !== 0) {
          if (code === StatusCode.InvalidSession) {
            throw new AuthRequiredError(`${def.name} 需要登录（status_code=1000016），先跑扫码登录`)
          }
          throw new ApiError(code, json?.status_info, def.name, res.status)
        }

        return { ...json, headers: Object.fromEntries(res.headers.entries()) }
      } catch (err) {
        lastErr = err
        // 只对「读请求」回退：空响应体 / 404 / 405 是路径级失败（网关没放行这条 path），换下一条变体。
        // 写请求（POST/PUT/DELETE）不回退 —— 万一第一条其实已经执行，重发就是重复写入。
        const readOnly = path.method === 'GET' || path.method === 'HEAD'
        const pathLevel =
          err instanceof TransportError && (/空响应体/.test(err.message) || /HTTP 40[45]/.test(err.message))
        if (readOnly && pathLevel && i < candidates.length - 1) {
          options.logger?.(`${def.name} ${path.path} 未放行，回退下一个 path 变体`)
          continue
        }
        throw err
      }
    }
    throw lastErr
  }
}

async function safeText(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 500)
  } catch {
    return ''
  }
}
