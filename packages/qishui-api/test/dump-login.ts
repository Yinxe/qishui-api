// 抓「登录态才拿到数据」那批接口的真实响应，落在 /tmp/opencode/samples/login-*.json。
// 只在带会话时跑一次，用来看清字段结构（文档靠它）；不是回归测试。
//   node --experimental-strip-types test/dump-login.ts
import fs from 'node:fs'
import { createClient } from '../dist/index.js'

const ROOT = new URL('..', import.meta.url).pathname
const OUT = '/tmp/opencode/samples'
fs.mkdirSync(OUT, { recursive: true })
const device = JSON.parse(fs.readFileSync(ROOT + 'qishui-device.json', 'utf8'))
const cookies = JSON.parse(fs.readFileSync(ROOT + 'qishui-session.json', 'utf8'))
const client = await createClient({ device, cookies, timeout: 20_000 })
if (!client.isLoggedIn()) throw new Error('没有有效会话，先跑 test/login.ts')
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const brief = (v: any, d = 0, maxd = 2): string => {
  if (Array.isArray(v)) return `[${v.length}]` + (v.length ? `(${brief(v[0], d + 1, maxd)})` : '')
  if (v && typeof v === 'object') {
    if (d >= maxd) return `{${Object.keys(v).slice(0, 16).join(',')}}`
    return `{${Object.keys(v)
      .map((k) => `${k}:${brief(v[k], d + 1, maxd)}`)
      .join(', ')}}`
  }
  return JSON.stringify(v)?.slice(0, 24) ?? 'null'
}

const dump = async (tag: string, key: string, params: any = {}) => {
  try {
    const r: any = await client.request(key as any, params)
    const { headers, ...body } = r
    fs.writeFileSync(`${OUT}/login-${tag}.json`, JSON.stringify(body, null, 1))
    console.log(`\n### ${key} → ${tag}.json\n${brief(body, 0, 2).slice(0, 900)}`)
  } catch (err: any) {
    console.log(`\n### ${key} → ✗ ${err.name}: ${String(err.message).slice(0, 90)}`)
  }
  await sleep(1500)
}

await dump('myInfo', 'GetMyInfo')
await dump('myPlaylists', 'GetMyPlaylists')
await dump('blockUserList', 'GetBlockUserList', { cursor: '', count: 20 })
await dump('uploaderInfo', 'GetUploaderInfo', { sec_user_id: '' })
await dump('myPrivacySetting', 'GetMyPrivacySetting')
await dump('search2023', 'Search2023', {
  search_type: 'track',
  q: '晴天',
  cursor: '0',
  search_id: 'x',
  search_method: 'track',
})
await dump('userInfoRetry', 'GetUserInfo', { user_id: '3617835472921684' })
