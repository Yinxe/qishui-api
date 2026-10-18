import { hostname } from 'node:os'
import type { CookieJar } from '../cookies.js'
import { AuthRequiredError, QishuiError } from '../errors.js'
import { API_BASE, APP_ID, APP_VERSION, CHANNEL, type DeviceIdentity, userAgent } from '../params.js'

/** passport "lite" jssdk 参数：缺任一项会被网关判成版本过低（error_code 4031） */
const JSSDK = {
  passport_jssdk_version: '4.2.3',
  passport_jssdk_type: 'lite',
  is_from_ttaccountsdk: '1',
  account_sdk_source: 'web',
}

export interface LoginContext {
  device: DeviceIdentity
  cookies: CookieJar
  baseUrl?: string
  fetchImpl?: typeof fetch
  /**
   * App 扫码确认页上显示「在 <电脑名> 上登录」的那行字（深链的 `computer_name`）。
   * 省略则用本机计算机名（`os.hostname()`，与官方 PC 客户端同口径）；
   * 可用 `QISHUI_COMPUTER_NAME` 覆盖。**绝不能写项目名**——扫码的人（和官方）都会看到。
   */
  computerName?: string
}

/**
 * 扫码深链 `computer_name` 的默认值：本机计算机名。
 * 官方 PC 客户端这里传的就是它，App 确认页会显示「在 <电脑名> 上登录」。
 * 可用 `QISHUI_COMPUTER_NAME` 覆盖；**绝不能写项目名**。
 */
export function defaultComputerName(): string {
  const override = process.env.QISHUI_COMPUTER_NAME?.trim()
  if (override) return override
  return hostname().trim() || 'DESKTOP-PC'
}

export type QrStatus = 'waiting' | 'scanned' | 'confirmed' | 'expired' | 'timeout' | 'unknown'

const STATUS_MAP: Record<string, QrStatus> = {
  // passport web 的 check_qrconnect 回字符串；数字是另一套（get_qrcode 侧）表述，两者都收
  '1': 'waiting',
  '2': 'scanned',
  '3': 'confirmed',
  '4': 'expired',
  new: 'waiting',
  waiting: 'waiting',
  scanned: 'scanned',
  scan: 'scanned',
  confirm: 'confirmed',
  confirmed: 'confirmed',
  expired: 'expired',
}

export interface QrLogin {
  token: string
  /** 让**汽水音乐** App 扫的内容（bff-pc.qishui.com 深链）；自行用 qrcode 之类渲染 */
  scanUrl: string
  /**
   * 上游自带的二维码图片（`data:image/png;base64,…`），编码的是它自己的 `qrcode_index_url`。
   * 官方 PC 客户端显示的正是这张图；终端 ASCII 画不出来时的备用出路（存成文件给人点开）。
   */
  qrPng?: string
  expiresAt: number
  /** 单次探测扫码状态；confirmed 时登录 cookie 已写入 ctx.cookies */
  check(): Promise<QrStatus>
  /** 轮询直到 confirmed / expired / 超时 */
  wait(intervalMs?: number, timeoutMs?: number): Promise<QrStatus>
}

async function call(
  ctx: LoginContext,
  method: 'GET' | 'POST',
  path: string,
  query: Record<string, string>,
  form?: Record<string, string>,
) {
  const url = `${ctx.baseUrl ?? API_BASE}${path}?${new URLSearchParams(query)}`
  const headers: Record<string, string> = {
    'user-agent': userAgent(),
    accept: 'application/json',
  }
  const cookie = ctx.cookies.header()
  if (cookie) headers.cookie = cookie
  let body: string | undefined
  if (form) {
    // passport web 接口只认 x-www-form-urlencoded，发 JSON 会被判"缺少参数"
    headers['content-type'] = 'application/x-www-form-urlencoded'
    body = new URLSearchParams(form).toString()
  }
  const res = await (ctx.fetchImpl ?? fetch)(url, { method, headers, body })
  const setCookie = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : []
  ctx.cookies.absorb(setCookie)
  const text = await res.text()
  try {
    return JSON.parse(text) as any
  } catch {
    throw new QishuiError(`${path} 响应非 JSON (http=${res.status})`, text.slice(0, 300))
  }
}

/** 扫码登录（汽水音乐 App）：拿到二维码内容 → 用户扫码 → cookie 落到 ctx.cookies */
export async function startQrLogin(ctx: LoginContext): Promise<QrLogin> {
  const common = {
    aid: APP_ID,
    device_id: ctx.device.deviceId,
    iid: ctx.device.installId,
    cdid: ctx.device.cdid,
    device_platform: 'PC',
    version_code: APP_VERSION,
    version_name: APP_VERSION,
    channel: CHANNEL,
    os: 'Windows',
    language: 'zh',
    ...JSSDK,
  }
  const base = ctx.baseUrl ?? API_BASE

  const qr = await call(ctx, 'GET', '/passport/web/get_qrcode/', {
    ...common,
    next: base,
    need_logo: 'false',
    need_short_url: 'false',
    is_new_login: '1',
  })
  const d = qr?.data ?? {}
  if (!d.token) {
    throw new QishuiError(
      `get_qrcode 未返回 token（error_code=${d.error_code ?? '?'} ${d.description ?? ''}）`,
      JSON.stringify(qr).slice(0, 300),
    )
  }

  // 真正要编码的是 bff-pc 的 scan_login 深链，token 取自 qrcode_index_url
  const indexToken = d.qrcode_index_url ? new URL(d.qrcode_index_url).searchParams.get('token') : null
  const scanUrl = new URL('https://bff-pc.qishui.com/light/invoke/scan_login')
  scanUrl.searchParams.set('token', indexToken ?? d.token)
  scanUrl.searchParams.set('os', 'Windows')
  scanUrl.searchParams.set('computer_name', ctx.computerName?.trim() || defaultComputerName())
  const content = scanUrl.toString().replaceAll('+', '%20')

  const expiresAt = Math.min((d.expire_time ?? Math.floor(Date.now() / 1000) + 60) * 1000, Date.now() + 300_000)

  async function check(): Promise<QrStatus> {
    const r = await call(ctx, 'POST', '/passport/web/check_qrconnect/', common, {
      need_logo: 'false',
      need_short_url: 'false',
      is_frontier: 'true',
      token: d.token,
      is_new_login: '1',
      next: base,
    })
    return STATUS_MAP[String(r?.data?.status ?? '')] ?? 'unknown'
  }

  async function wait(intervalMs = 2000, timeoutMs = Math.max(0, expiresAt - Date.now())): Promise<QrStatus> {
    const deadline = Date.now() + timeoutMs
    while (Date.now() < deadline) {
      const s = await check()
      if (s === 'confirmed') return s
      if (s === 'expired') return s
      await new Promise((r) => setTimeout(r, intervalMs))
    }
    return 'timeout'
  }

  return {
    token: d.token,
    scanUrl: content,
    qrPng: typeof d.qrcode === 'string' ? d.qrcode : undefined,
    expiresAt,
    check,
    wait,
  }
}

/** 登录后自检：确认会话 cookie 已落地 */
export function assertLoggedIn(ctx: LoginContext): void {
  if (!ctx.cookies.isLoggedIn()) throw new AuthRequiredError('cookie 里没有 sessionid，登录未完成')
}
