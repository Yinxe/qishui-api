// 评论回复（ListReplies）与别人主页歌单（GetUserPlaylists）的游标口径 —— 补上「列表分页」表里
// 还没实测的两行。做法同 probe-list-cursor：拿上游 next_cursor 再打一页，看两页 id 交集。
// 只读，最多 5 个请求。
//   node --experimental-strip-types test/probe-replies-paging.ts
import fs from 'node:fs'
import { createClient } from '../dist/index.js'

const device: any = JSON.parse(fs.readFileSync(`${process.env.HOME}/.qishui/device.json`, 'utf8')).device
const accounts: any = JSON.parse(fs.readFileSync(`${process.env.HOME}/.qishui/accounts.json`, 'utf8'))
const uid = String(accounts.accounts?.[0]?.uid ?? '')
const cookies: any = JSON.parse(fs.readFileSync(`${process.env.HOME}/.qishui/accounts/${uid}.json`, 'utf8')).cookies
const client = await createClient({ device, cookies, timeout: 20_000 })
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const SID = '00000000-0000-0000-0000-000000000000'

async function search(type: string, q: string): Promise<any[]> {
  await sleep(1300)
  const body: any = await client.request('Search' as any, {
    search_type: type,
    q,
    cursor: '0',
    search_id: SID,
    search_method: 'track',
    from_search_id: '',
    search_scene: '',
  })
  const groups: any[] = Array.isArray(body?.result_groups) ? body.result_groups : []
  return groups.flatMap((g) => (Array.isArray(g.items) ? g.items : Array.isArray(g.data) ? g.data : []))
}

function report(
  tag: string,
  first: { ids: string[]; hasMore: any; next: any },
  second: { ids: string[]; hasMore: any; next: any },
) {
  const overlap = second.ids.filter((id) => first.ids.includes(id)).length
  console.log(`  ${tag}: 第一页 ${first.ids.length} 条 has_more=${first.hasMore} next=${JSON.stringify(first.next)}`)
  console.log(`  ${tag}: 第二页 ${second.ids.length} 条 has_more=${second.hasMore} next=${JSON.stringify(second.next)}`)
  if (!first.ids.length || !second.ids.length) console.log(`  ${tag}: 两页里有一页是空的，翻页未验证`)
  else
    console.log(
      `  ${tag}: 两页重复 ${overlap} 条 → ${overlap === 0 ? '按 next_cursor 回传就能翻页' : '游标不是纯偏移量'}`,
    )
}

// 1) 回复：找一条「有回复」的评论（热门曲目的评论区更容易有）
const tracks = await search('track', process.env.PROBE_TRACK_Q ?? '晴天')
const track = tracks.map((i) => i?.entity?.track).find((t: any) => t?.id)
await sleep(1300)
const cm: any = await client.request('ListComments' as any, {
  group_id: String(track.id),
  cursor: '0',
  count: 20,
  group_type: 1,
})
const comments: any[] = Array.isArray(cm?.comments) ? cm.comments : []
const withReplies = comments.find((c) => Number(c?.count_reply ?? 0) > 0)
console.log(
  `评论样本：曲目 ${track.name}，20 条评论里 ${withReplies ? `有回复的是 ${withReplies.id}（${withReplies.count_reply} 条回复）` : '没有带回复的'}`,
)
if (withReplies) {
  await sleep(1300)
  const r1: any = await client.request('ListReplies' as any, {
    comment_id: String(withReplies.id),
    cursor: 0,
    count: 10,
    group_id: String(track.id),
    group_type: 1,
  })
  const first = {
    ids: (r1?.reply_infos ?? []).map((c: any) => String(c?.id ?? '')),
    hasMore: r1?.has_more,
    next: r1?.cursor,
  }
  await sleep(1300)
  const r2: any = await client.request('ListReplies' as any, {
    comment_id: String(withReplies.id),
    cursor: Number(first.next ?? 10),
    count: 10,
    group_id: String(track.id),
    group_type: 1,
  })
  const second = {
    ids: (r2?.reply_infos ?? []).map((c: any) => String(c?.id ?? '')),
    hasMore: r2?.has_more,
    next: r2?.cursor,
  }
  report('ListReplies', first, second)
}

// 2) 别人主页的歌单：拿歌单作者当样本
const owner = await search('playlist', process.env.PROBE_PLAYLIST_Q ?? '华语')
const ownerId = String(owner.map((i) => i?.entity?.playlist?.owner?.id).find((id) => id) ?? process.env.PROBE_UID ?? '')
if (ownerId) {
  await sleep(1300)
  const p1: any = await client.request('GetUserPlaylists' as any, {
    user_id: ownerId,
    cursor: '0',
    count: 10,
    scene: '',
    ab_param: '',
  })
  const first = {
    ids: (p1?.playlists ?? []).map((p: any) => String(p?.id ?? '')),
    hasMore: p1?.has_more,
    next: p1?.next_cursor,
  }
  await sleep(1300)
  const p2: any = await client.request('GetUserPlaylists' as any, {
    user_id: ownerId,
    cursor: String(first.next ?? '10'),
    count: 10,
    scene: '',
    ab_param: '',
  })
  const second = {
    ids: (p2?.playlists ?? []).map((p: any) => String(p?.id ?? '')),
    hasMore: p2?.has_more,
    next: p2?.next_cursor,
  }
  console.log(`\n样本用户 ${ownerId}（歌单作者）`)
  report('GetUserPlaylists', first, second)
}
