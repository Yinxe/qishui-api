// 搜索能不能翻页？IDL 里 `SearchResultGroup` 有 `next_cursor` / `has_more`，
// 但 APP_ENDPOINTS 的旧结论是「每类 20 行、has_more 回 false」。这条探针把它问清楚：
//   1. `Search {search_type:'track', cursor:'0'}` → 每组 `has_more` / `next_cursor` 到底是什么；
//   2. 拿 `next_cursor` 再打一次 → 回的曲目和第一页重不重（不重就说明能翻）。
//   3. 对照 `search_type=all` 的分组（预览组）—— 它们没有游标，所以「查看全部」必须按类型再搜。
// 只读，三四个请求。
//   node --experimental-strip-types test/probe-search-cursor.ts
import fs from 'node:fs'
import { createClient } from '../dist/index.js'

const device: any = JSON.parse(fs.readFileSync(`${process.env.HOME}/.qishui/device.json`, 'utf8')).device
const accounts: any = JSON.parse(fs.readFileSync(`${process.env.HOME}/.qishui/accounts.json`, 'utf8'))
const uid = String(accounts.accounts?.[0]?.uid ?? '')
const cookies: any = fs.existsSync(`${process.env.HOME}/.qishui/accounts/${uid}.json`)
  ? JSON.parse(fs.readFileSync(`${process.env.HOME}/.qishui/accounts/${uid}.json`, 'utf8')).cookies
  : undefined
const client = await createClient({ device, cookies, timeout: 20_000 })
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const Q = process.env.PROBE_Q ?? '晴天'

async function page(cursor: string) {
  await sleep(1300)
  const body: any = await client.request('Search' as any, {
    search_type: 'track',
    q: Q,
    cursor,
    search_id: '00000000-0000-0000-0000-000000000000',
    search_method: 'track',
    from_search_id: '',
    search_scene: '',
  })
  const groups: any[] = Array.isArray(body?.result_groups) ? body.result_groups : []
  return groups.map((g) => {
    const items = Array.isArray(g.items) ? g.items : Array.isArray(g.data) ? g.data : []
    return {
      id: g.id,
      display_type: g.display_type,
      has_more: g.has_more,
      next_cursor: g.next_cursor,
      count: items.length,
      ids: items.map((i: any) => String(i?.entity?.track?.id ?? i?.entity?.id ?? i?.id ?? '')),
      names: items.slice(0, 3).map((i: any) => i?.entity?.track?.name ?? i?.entity?.name ?? '?'),
    }
  })
}

console.log(`查询：${Q}（search_type=track）`)
const first = await page('0')
for (const g of first)
  console.log(
    `  第一页 ${g.id} count=${g.count} has_more=${g.has_more} next_cursor=${JSON.stringify(g.next_cursor)} 例：${g.names.join(' / ')}`,
  )

const next = first.find((g) => g.next_cursor && g.has_more)
if (!next) {
  console.log('\n  结论：没有 has_more + next_cursor 的分组 → 这条 type 翻不了页')
} else {
  console.log(`\n  拿 ${next.id} 的 next_cursor=${JSON.stringify(next.next_cursor)} 再打一次`)
  const second = await page(String(next.next_cursor))
  for (const g of second) {
    const prev = first.find((x) => x.id === g.id)
    const overlap = g.ids.filter((id: string) => prev?.ids.includes(id)).length
    console.log(
      `  第二页 ${g.id} count=${g.count} has_more=${g.has_more} next_cursor=${JSON.stringify(g.next_cursor)} 与第一页重复=${overlap} 例：${g.names.join(' / ')}`,
    )
  }
}

// 对照：all 的分组是预览（每类 3~6 条，has_more=false、next_cursor 空）→ 没有游标可翻
await sleep(1300)
const allBody: any = await client.request('Search' as any, {
  search_type: 'all',
  q: Q,
  cursor: '0',
  search_id: '00000000-0000-0000-0000-000000000000',
  search_method: 'track',
  from_search_id: '',
  search_scene: '',
})
console.log('\n== search_type=all 的预览组（翻不了页，只能当入口）')
for (const g of Array.isArray(allBody?.result_groups) ? allBody.result_groups : []) {
  const items = Array.isArray(g.items) ? g.items : Array.isArray(g.data) ? g.data : []
  console.log(
    `  ${String(g.id).padEnd(12)} viewAll=${String(g.display_view_all).padEnd(5)} count=${String(items.length).padEnd(2)} has_more=${g.has_more} next_cursor=${JSON.stringify(g.next_cursor)}`,
  )
}
