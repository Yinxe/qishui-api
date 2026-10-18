/**
 * 扫码登录探针（临时排查用，不进回归测试）。
 *
 * 要回答的两个问题：
 *  1. App 那边显示扫码成功了，为什么 `~/.qishui/` 里连 `accounts/` 都没有 —— confirmed 那一刻
 *     上游到底有没有下发 `sessionid`？下发的是哪些 cookie？
 *  2. 二维码识别慢 —— 上游给的官方二维码（`data.qrcode` 那张 PNG）编的内容是 `qrcode_index_url`
 *     （`/ucenter_web/app/sdk-next?...&uc_sdk=scan-auth`），跟我们自己拼的
 *     `/light/invoke/scan_login?token=…` **不是同一条链接**。到底是哪条能被汽水 App 立刻认出？
 *
 * 默认模式（raw）：同时开**两个独立 token**，一个用我们的深链、一个用上游的 index_url，
 * 两张码并排打出来，谁被扫了、谁 confirmed、confirmed 时下发哪些 cookie，全部记进日志。
 * **只记 cookie 名字，绝不落任何凭据值**。
 *
 *   pnpm run build
 *   node --experimental-strip-types packages/qishui-cli/test/probe-qr-login.ts        # 并排两张码
 *   node --experimental-strip-types packages/qishui-cli/test/probe-qr-login.ts --core  # 跑产品真实路径（core.login）
 *
 * 提示：上游 `expire_time` 距现在只有 **299 秒**，认码慢就会过期，别当成接口坏了。
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import qrcode from 'qrcode-terminal'
// cli 包只依赖 qishui-core，api 不在它的依赖里 —— 探针直接按相对路径进 api 的 dist（先 pnpm run build）
import {
  API_BASE,
  APP_ID,
  APP_VERSION,
  CHANNEL,
  type Client,
  CookieJar,
  createClient,
  type DeviceIdentity,
  userAgent,
} from '../../qishui-api/dist/index.js'

const LOG_FILE = '/tmp/opencode/qr-probe.log'
fs.writeFileSync(LOG_FILE, '')
const log = (...lines: string[]): void => {
  const text = lines.join('')
  console.log(text)
  fs.appendFileSync(LOG_FILE, `${text}\n`)
}
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

const HOME_QISHUI = process.env.QISHUI_HOME ?? path.join(os.homedir(), '.qishui')
const device: DeviceIdentity = readJson<{ device?: DeviceIdentity }>(path.join(HOME_QISHUI, 'device.json'))?.device ??
  readJson(path.join(import.meta.dirname, '../../qishui-api/qishui-device.json')) ?? {
    deviceId: '',
    installId: '',
    cdid: '',
  }
function readJson<T>(file: string): T | undefined {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')) as T
  } catch {
    return undefined
  }
}

const JSSDK = {
  passport_jssdk_version: '4.2.3',
  passport_jssdk_type: 'lite',
  is_from_ttaccountsdk: '1',
  account_sdk_source: 'web',
}
const common: Record<string, string> = {
  aid: APP_ID,
  device_id: device.deviceId,
  iid: device.installId,
  cdid: device.cdid,
  device_platform: 'PC',
  version_code: APP_VERSION,
  version_name: APP_VERSION,
  channel: CHANNEL,
  os: 'Windows',
  language: 'zh',
  ...JSSDK,
}

async function call(
  jar: CookieJar,
  method: 'GET' | 'POST',
  endpoint: string,
  query: Record<string, string>,
  form?: Record<string, string>,
): Promise<any> {
  const headers: Record<string, string> = { 'user-agent': userAgent(), accept: 'application/json' }
  const cookie = jar.header()
  if (cookie) headers.cookie = cookie
  let body: string | undefined
  if (form) {
    headers['content-type'] = 'application/x-www-form-urlencoded'
    body = new URLSearchParams(form).toString()
  }
  const res = await fetch(`${API_BASE}${endpoint}?${new URLSearchParams(query)}`, { method, headers, body })
  const setCookies = res.headers.getSetCookie?.() ?? []
  jar.absorb(setCookies)
  const text = await res.text()
  return {
    http: res.status,
    json: JSON.parse(text) as any,
    cookieNames: setCookies.map((c) => c.split('=')[0]),
    raw: text,
  }
}

/** 我们的深链（与 src/auth/qr.ts 同一口径） */
function ourScanUrl(token: string): string {
  const url = new URL('https://bff-pc.qishui.com/light/invoke/scan_login')
  url.searchParams.set('token', token)
  url.searchParams.set('os', 'Windows')
  url.searchParams.set('computer_name', process.env.QISHUI_COMPUTER_NAME?.trim() || os.hostname().trim())
  return url.toString().replaceAll('+', '%20')
}

interface Candidate {
  label: string
  jar: CookieJar
  token: string
  payload: string
  lastStatus: string
  confirmedAt?: number
}

async function openCandidate(label: string, payloadKind: 'ours' | 'index'): Promise<Candidate> {
  const jar = new CookieJar()
  const res = await call(jar, 'GET', '/passport/web/get_qrcode/', {
    ...common,
    next: API_BASE,
    need_logo: 'false',
    need_short_url: 'false',
    is_new_login: '1',
  })
  const d = res.json?.data ?? {}
  const payload = payloadKind === 'ours' ? ourScanUrl(d.token) : String(d.qrcode_index_url)
  log(`[${label}] token=${String(d.token).slice(0, 8)}… 载荷 ${payload.length} 字符`, `\n[${label}] ${payload}`)
  if (payloadKind === 'index') {
    log(`[${label}] 上游 copywriting: ${String(d.copywriting ?? '').slice(0, 160)}`)
  }
  return { label, jar, token: d.token, payload, lastStatus: '' }
}

async function probeOne(candidate: Candidate): Promise<void> {
  const res = await call(candidate.jar, 'POST', '/passport/web/check_qrconnect/', common, {
    need_logo: 'false',
    need_short_url: 'false',
    is_frontier: 'true',
    token: candidate.token,
    is_new_login: '1',
    next: API_BASE,
  })
  const d = res.json?.data ?? {}
  const status = String(d.status ?? '')
  if (status !== candidate.lastStatus) {
    candidate.lastStatus = status
    log(
      `[${candidate.label}] status=${status || '(空)'} error_code=${d.error_code ?? '-'} scan_app_id=${d.scan_app_id ?? '-'} ` +
        `下发 cookie: ${res.cookieNames.join(' ') || '(无)'}`,
    )
    if (status === 'confirmed') {
      candidate.confirmedAt = Date.now()
      log(`[${candidate.label}] confirmed 原始响应: ${res.raw.slice(0, 500)}`)
    }
  }
}

function art(text: string): string {
  let out = ''
  qrcode.generate(text, { small: true }, (a: string) => {
    out = a
  })
  return out
}

/* --------------------------------------------------------------- --core：跑产品真实路径 */

if (process.argv.includes('--core')) {
  const { createQishui } = await import('qishui-core')
  log('[core] 走 createQishui() + core.login() 的真实路径（含入库与落盘）')
  const recording: typeof fetch = async (input, init) => {
    const url = new URL(typeof input === 'string' ? input : String(input))
    const res = await globalThis.fetch(input, init as RequestInit)
    if (url.pathname.includes('passport')) {
      const mirror = res.clone()
      const text = await mirror.text().catch((err: unknown) => String(err))
      log(
        `[core][net] ${url.pathname} ← http=${res.status} 下发 cookie: ${(res.headers.getSetCookie?.() ?? []).map((c) => c.split('=')[0]).join(' ') || '(无)'}`,
      )
      log(`[core][net] body: ${text.slice(0, 400)}`)
    }
    return res
  }
  const core = await createQishui({
    fetchImpl: recording,
    logger: (line) => log(`[core] ${line}`),
  })
  core.events.on('account-changed', ({ uid }) => log(`[core][event] account-changed uid=${uid ?? '(匿名)'}`))
  const login = await core.login({
    intervalMs: 2000,
    timeoutMs: 320_000,
    onQr: ({ scanUrl, expiresAt, qrImage }) => {
      log(`[core] 深链 ${scanUrl.length} 字符，${Math.round((expiresAt - Date.now()) / 1000)}s 后过期`)
      log(`[core] ${scanUrl}`)
      if (qrImage) log(`[core] 上游官方 PNG（带静区，更好认）已落盘：${qrImage}`)
      process.stdout.write(art(scanUrl))
      console.log('\n用「汽水音乐」App 扫这张（我的 → 扫一扫）；日志同步写 /tmp/opencode/qr-probe.log\n')
    },
  })
  try {
    for (let i = 0; i < 160; i += 1) {
      const status = await login.status()
      log(`[core] status=${status}`)
      if (status === 'confirmed' || status === 'expired') break
      await sleep(2000)
    }
  } catch (err) {
    log(`[core] status 抛错：${err instanceof Error ? `${err.message}\n${err.stack}` : String(err)}`)
  }
  const accountsDir = path.join(HOME_QISHUI, 'accounts')
  log(
    `[core][结果] loggedIn=${core.loggedIn} uid=${core.uid ?? '(无)'} 昵称=${core.snapshot().nickname ?? '(无)'}`,
    `\n[core][结果] jar 里的 cookie 名：${Object.keys(core.session.exportCookies()).join(' ') || '(空)'}`,
    `\n[core][结果] ${accountsDir}：${fs.existsSync(accountsDir) ? fs.readdirSync(accountsDir).join(' ') : '不存在'}`,
    `\n[core][结果] accounts.json：${fs.existsSync(path.join(HOME_QISHUI, 'accounts.json')) ? '存在' : '不存在'}，索引 ${JSON.stringify(core.accounts())}`,
  )
  core.dispose()
  process.exit(0)
}

/* --------------------------------------------------------------- 默认：两张码并排 */

log(`[probe] 设备 ${device.deviceId.slice(0, 8)}… 数据目录 ${HOME_QISHUI}`)
const candidates = [await openCandidate('A 我们的深链', 'ours'), await openCandidate('B 上游 index_url', 'index')]

console.log('\n===== A：我们自己拼的 /light/invoke/scan_login =====')
process.stdout.write(art(candidates[0].payload))
console.log('\n===== B：上游 PNG 编的 /ucenter_web/app/sdk-next =====')
process.stdout.write(art(candidates[1].payload))
console.log(
  '\n先扫 **A**（这是产品现在实际用的那条）。汽水 App：我的 → 扫一扫。' +
    '\nA 认不出来 / 转圈很久就改扫 B。两张码相互独立，扫哪条就只有哪条变。5 分钟内有效。\n',
)

const started = Date.now()
while (Date.now() - started < 300_000) {
  for (const candidate of candidates) await probeOne(candidate)
  if (candidates.some((c) => c.confirmedAt)) break
  if (candidates.every((c) => c.lastStatus === '4' || c.lastStatus === 'expired')) break
  await sleep(2000)
}

for (const candidate of candidates) {
  if (!candidate.confirmedAt) {
    log(`[${candidate.label}] 未 confirmed（最后状态 ${candidate.lastStatus || '(没变化)'}）`)
    continue
  }
  const names = Object.keys(candidate.jar.toObject()).filter((k) => candidate.jar.toObject()[k])
  log(
    `\n[${candidate.label}] confirmed ✅ jar 里已有：${names.join(' ')}`,
    `\n[${candidate.label}] 有 sessionid 吗：${names.includes('sessionid') ? '有' : '没有'} → 这条载荷可用：${names.some((n) => ['sessionid', 'sid_tt', 'passport_assist_user'].includes(n)) ? '能登录' : '不能登录'}`,
  )
  const me = await verifyWithClient(candidate.jar)
  log(`[${candidate.label}] GetMyInfo → ${me}`)
}
log('\n[probe] 结论看上面：哪条载荷 confirmed、confirmed 时下发了什么。日志副本在 /tmp/opencode/qr-probe.log')

/** 用这批 cookie 建一个 api Client 问一次身份（走真实 transport，不手搓 RPC 包） */
async function verifyWithClient(jar: CookieJar): Promise<string> {
  try {
    const client: Client = await createClient({ device, cookies: jar, timeout: 15_000 })
    const res: any = await client.request('GetMyInfo', {})
    return `uid=${res?.my_info?.id ?? '(空)'} 昵称=${res?.my_info?.nickname ?? '(空)'}`
  } catch (err) {
    return `✗ ${err instanceof Error ? err.message : String(err)}`
  }
}
