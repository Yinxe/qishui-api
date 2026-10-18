// `ListComments` 的 next_cursor 是按「请求的 count」还是「实际返回条数」前进？count=5 与 count=10 各量一遍。
// 只读，3 个请求。
//   node --experimental-strip-types test/probe-comment-page-size.ts
import fs from 'node:fs'
import { createClient } from '../dist/index.js'

const device: any = JSON.parse(fs.readFileSync(`${process.env.HOME}/.qishui/device.json`, 'utf8')).device
const accounts: any = JSON.parse(fs.readFileSync(`${process.env.HOME}/.qishui/accounts.json`, 'utf8'))
const uid = String(accounts.accounts?.[0]?.uid ?? '')
const cookies: any = JSON.parse(fs.readFileSync(`${process.env.HOME}/.qishui/accounts/${uid}.json`, 'utf8')).cookies
const client = await createClient({ device, cookies, timeout: 20_000 })
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const trackId = process.env.PROBE_TRACK ?? '7485660908549720080'

async function page(cursor: string, count: number) {
  await sleep(1300)
  const res: any = await client.request('ListComments' as any, { group_id: trackId, cursor, count, group_type: 1 })
  const list: any[] = Array.isArray(res?.comments) ? res.comments : []
  return { ids: list.map((c: any) => String(c?.id ?? '')), n: list.length, next: res?.cursor, hasMore: res?.has_more }
}

for (const count of [5, 10]) {
  const p1 = await page('0', count)
  const p2 = await page(String(p1.next ?? count), count)
  const overlap = p2.ids.filter((id) => p1.ids.includes(id)).length
  console.log(
    `count=${count}: 第一页 ${p1.n} 条 next=${JSON.stringify(p1.next)}；第二页 ${p2.n} 条 next=${JSON.stringify(p2.next)}；重复 ${overlap} 条`,
  )
  console.log(
    `  → next_cursor ${Number(p1.next) === count ? '按请求的 count 前进' : `按实际返回条数前进（${p1.n}）`}${overlap ? '，所以按 count 跳会重复' : '，不重复'}`,
  )
}
