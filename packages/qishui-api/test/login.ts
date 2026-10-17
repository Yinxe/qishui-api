// 扫码登录（分两步，方便"先把码给人看、再慢慢等扫"）：
//   node --experimental-strip-types test/login.ts --start   # 取二维码，打印 + 存中间态，立刻退出
//   node --experimental-strip-types test/login.ts --poll    # 轮询扫码状态，confirmed 就落 qishui-session.json
//   node --experimental-strip-types test/login.ts           # 不带参数 = start + poll(150s)，人就在旁边时用
//
// **扫的是「汽水音乐」App**，不是抖音：二维码内容 = bff-pc.qishui.com/light/invoke/scan_login?token=…
// （汽水 PC 客户端同款深链，passport 侧 aid=386088 = com.soda.music）。
// 本机没有 qrencode / python-qrcode，这里借 npx 缓存里的 qrcode-terminal 画 ASCII 二维码，不给项目加依赖。
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { createClient } from '../dist/index.js'
import { API_BASE, APP_ID, APP_VERSION, CHANNEL, userAgent } from '../dist/params.js'
import { CookieJar } from '../dist/cookies.js'

const ROOT = new URL('..', import.meta.url).pathname
const DEVICE_FILE = ROOT + 'qishui-device.json'
const SESSION_FILE = ROOT + 'qishui-session.json'
const STATE_FILE = '/tmp/opencode/qr-login-state.json'

// passport "lite" jssdk 参数（与 src/auth/qr.ts 保持一致，缺任一项会被判版本过低 error_code=4031）
const JSSDK = {
  passport_jssdk_version: '4.2.3',
  passport_jssdk_type: 'lite',
  is_from_ttaccountsdk: '1',
  account_sdk_source: 'web',
}

/** 把文本画成终端二维码；没有可用工具就返回 null（调用方退回打印链接） */
function renderQr(text: string): string | null {
  try {
    return execFileSync('qrencode', ['-t', 'ANSIUTF8', text], { encoding: 'utf8' })
  } catch {
    /* 没装 qrencode，继续找 qrcode-terminal */
  }
  const npxRoot = join(homedir(), '.npm', '_npx')
  let dirs: string[] = []
  try {
    dirs = fs.readdirSync(npxRoot)
  } catch {
    return null
  }
  for (const d of dirs) {
    const mod = join(npxRoot, d, 'node_modules', 'qrcode-terminal')
    if (!fs.existsSync(mod)) continue
    try {
      return execFileSync(
        process.execPath,
        ['-e', `require(${JSON.stringify(mod)}).generate(process.argv[1],{small:true},(s)=>process.stdout.write(s))`, text],
        { encoding: 'utf8' },
      )
    } catch {
      /* 换下一个缓存目录 */
    }
  }
  return null
}

async function newClient() {
  const device = fs.existsSync(DEVICE_FILE) ? JSON.parse(fs.readFileSync(DEVICE_FILE, 'utf8')) : undefined
  const cookies = fs.existsSync(SESSION_FILE) ? JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8')) : {}
  const client = await createClient({ device, cookies, timeout: 20_000 })
  if (!device) fs.writeFileSync(DEVICE_FILE, JSON.stringify(client.device, null, 2))
  return client
}

const needState = () => {
  if (!fs.existsSync(STATE_FILE)) throw new Error(`没有中间态 ${STATE_FILE}，先跑 --start`)
  return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) as { token: string; scanUrl: string; expiresAt: number; cookies: Record<string, string>; device: any }
}

async function start() {
  const client = await newClient()
  if (client.isLoggedIn()) {
    console.log('[登录] qishui-session.json 里的会话已经有效；要换号就先删掉它')
    return
  }
  const qr = await client.qrLogin()
  fs.writeFileSync(
    STATE_FILE,
    JSON.stringify({ token: qr.token, scanUrl: qr.scanUrl, expiresAt: qr.expiresAt, cookies: client.exportCookies(), device: client.device }, null, 2),
  )
  console.log('[登录] 请用**汽水音乐 App**扫码（我的 → 扫一扫）：\n')
  const art = renderQr(qr.scanUrl)
  if (art) console.log(art)
  else console.log('（本机没有可用二维码渲染器，把下面这条链接丢给任意二维码生成器）')
  console.log(qr.scanUrl + '\n')
  console.log(`[登录] 中间态已存 ${STATE_FILE}（token 过期时间 ${new Date(qr.expiresAt).toLocaleTimeString()}），接着跑 --poll`)
}

async function poll(timeoutMs: number) {
  const st = needState()
  const cookies = new CookieJar()
  cookies.absorb(Object.entries(st.cookies).map(([k, v]) => `${k}=${v}`))
  const common: Record<string, string> = {
    aid: APP_ID,
    device_id: st.device?.deviceId,
    iid: st.device?.installId,
    cdid: st.device?.cdid,
    device_platform: 'PC',
    version_code: APP_VERSION,
    version_name: APP_VERSION,
    channel: CHANNEL,
    os: 'Windows',
    language: 'zh',
    ...JSSDK,
  }
  const url = `${API_BASE}/passport/web/check_qrconnect/?${new URLSearchParams(common)}`
  const STATUS: Record<string, string> = { '1': 'waiting', '2': 'scanned', '3': 'confirmed', '4': 'expired', new: 'waiting', waiting: 'waiting', scanned: 'scanned', scan: 'scanned', confirm: 'confirmed', confirmed: 'confirmed', expired: 'expired' }
  const deadline = Date.now() + timeoutMs
  let last = ''
  while (Date.now() < deadline) {
    const form = new URLSearchParams({
      need_logo: 'false',
      need_short_url: 'false',
      is_frontier: 'true',
      token: st.token,
      is_new_login: '1',
      next: API_BASE,
    })
    let status = 'unknown'
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'user-agent': userAgent(), accept: 'application/json', 'content-type': 'application/x-www-form-urlencoded', ...(cookies.header() ? { cookie: cookies.header() } : {}) },
        body: form.toString(),
      })
      const setCookie = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : []
      cookies.absorb(setCookie)
      const j: any = JSON.parse(await res.text())
      status = STATUS[String(j?.data?.status ?? '')] ?? 'unknown'
    } catch (err) {
      console.log(`[登录] 轮询出错（继续试）：${String(err).slice(0, 80)}`)
    }
    if (status !== last) {
      console.log(`[登录] 状态：${status}`)
      last = status
    }
    if (status === 'confirmed') break
    if (status === 'expired') break
    await new Promise((r) => setTimeout(r, 2000))
  }
  if (last !== 'confirmed') {
    console.log(`[登录] 没成功（${last || 'timeout'}）：token 过期或超时，重跑 --start 再扫一次`)
    return
  }
  fs.writeFileSync(SESSION_FILE, JSON.stringify(cookies.toObject(), null, 2))
  const client = await createClient({ device: st.device, cookies: JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8')), timeout: 20_000 })
  try {
    const me: any = await client.request('GetMyInfo', {})
    console.log(`[登录] 会话已写入 ${SESSION_FILE}  昵称=${me.my_info?.nickname ?? '?'}  uid=${me.my_info?.id ?? '?'}`)
  } catch (err) {
    console.log(`[登录] cookie 已落盘，但 GetMyInfo 自检失败：${String(err).slice(0, 120)}`)
  }
}

const mode = process.argv[2]
if (mode === '--start') await start()
else if (mode === '--poll') await poll(300_000)
else {
  await start()
  await poll(150_000)
}
