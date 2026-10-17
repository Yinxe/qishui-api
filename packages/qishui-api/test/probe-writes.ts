// 写接口里 4 条「没跑通」的翻案探针（别急着判死）：
//   ① UpdatePlaylistInfo  → 1000014      ② CreateComment → status_code=5
//   ③ Report              → HTTP 500      ④ AppendRecentlyPlayedMedia → 写成功但读回没落地
//   node --experimental-strip-types test/probe-writes.ts
// 每个变体都换参数/换 path 再试；建出来的临时歌单/评论收尾删掉。
import fs from 'node:fs'
import { createClient } from '../dist/index.js'
import { probeVariants } from './raw.ts'

const ROOT = new URL('..', import.meta.url).pathname
const ctx: any = JSON.parse(fs.readFileSync('/tmp/opencode/endpoint-report.json', 'utf8')).ctx
const device = JSON.parse(fs.readFileSync(ROOT + 'qishui-device.json', 'utf8'))
const cookies = JSON.parse(fs.readFileSync(ROOT + 'qishui-session.json', 'utf8'))
const client = await createClient({ device, cookies, timeout: 20_000 })
const cookieHeader = Object.entries(cookies as Record<string, string>)
  .map(([k, v]) => `${k}=${v}`)
  .join('; ')
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const desc = async (label: string, key: string, params: any) => {
  await sleep(1300)
  try {
    const r: any = await client.request(key as any, params)
    const { headers, ...body } = r
    console.log(`  ✔ ${label}: ok  ${Object.keys(body).slice(0, 6).join(', ')}`)
    return body
  } catch (err: any) {
    console.log(`  ✘ ${label}: ${err.name} ${String(err.message ?? err.statusCode ?? '').slice(0, 90)}`)
    return null
  }
}
const idsIn = (v: unknown, out = new Set<string>()): Set<string> => {
  if (typeof v === 'string' || typeof v === 'number') {
    const s = String(v)
    if (/^\d{15,25}$/.test(s)) out.add(s)
    return out
  }
  if (Array.isArray(v)) {
    for (const x of v) idsIn(x, out)
    return out
  }
  if (v && typeof v === 'object') for (const x of Object.values(v)) idsIn(x, out)
  return out
}

// ---------------------------------------------------------------- ① UpdatePlaylistInfo
console.log('\n=== ① UpdatePlaylistInfo（原：1000014）===')
const before = await desc('GetMyPlaylists(写前)', 'GetMyPlaylists', { cursor: 0, count: 50, ab_param: '' })
const ids0 = idsIn(before)
const made: string[] = []
for (const [tag, params] of [
  ['私有单', { name: 'qishui-api 探针-私有', is_private: true }],
  ['公开单', { name: 'qishui-api 探针-公开', is_private: false }],
] as const) {
  const c = await desc(`CreatePlaylist(${tag})`, 'CreatePlaylist', params)
  if (!c) continue
  const now = await desc('GetMyPlaylists(写后)', 'GetMyPlaylists', { cursor: 0, count: 50, ab_param: '' })
  const fresh = [...idsIn(now)].find((id) => !ids0.has(id))
  if (!fresh) {
    console.log(`  ⚠️ ${tag}：回读没找到新单`)
    continue
  }
  made.push(fresh)
  await desc(`UpdatePlaylistInfo(${tag}, 只给 name)`, 'UpdatePlaylistInfo', {
    playlist_id: fresh,
    name: 'qishui-api 探针改写',
  })
  await desc(`UpdatePlaylistInfo(${tag}, name+desc+is_private)`, 'UpdatePlaylistInfo', {
    playlist_id: fresh,
    name: 'qishui-api 探针改写2',
    description: '来自 test/probe-writes.ts',
    is_private: tag === '私有单',
  })
  await desc(`UpdatePlaylistInfo(${tag}, name+cover_uri='')`, 'UpdatePlaylistInfo', {
    playlist_id: fresh,
    name: 'qishui-api 探针改写3',
    cover_uri: '',
  })
  const d: any = await desc(`GetPlaylistDetail(${tag})`, 'GetPlaylistDetail', {
    playlist_id: fresh,
    cursor: 0,
    count: 20,
    session_id: '',
    reverse: false,
    ab_param: '',
  })
  console.log(
    `      ↳ title="${d?.playlist?.title}"  desc="${d?.playlist?.desc ?? d?.playlist?.description ?? ''}"  is_private=${d?.playlist?.is_private ?? '?'}`,
  )
}

// ---------------------------------------------------------------- ② CreateComment
console.log('\n=== ② CreateComment（原：status_code=5）===')
const text = `qishui-api 探针评论 ${Date.now()}`
const variants: [string, any][] = [
  ['group_type=0(Track) 最小', { group_id: ctx.trackId, group_type: 0, text, comment_type: 0 }],
  [
    'group_type=0 补全可选字段',
    {
      group_id: ctx.trackId,
      group_type: 0,
      text: text + ' b',
      comment_type: 0,
      reply_id: '',
      reply_to_reply_id: '',
      reply_to_user_id: '',
      hashtags: [],
      text_extra: [],
    },
  ],
  ['group_type=1(UgcVideo) 最小', { group_id: ctx.trackId, group_type: 1, text: text + ' c', comment_type: 0 }],
]
for (const [label, params] of variants) {
  const r = await desc(`CreateComment(${label})`, 'CreateComment', params)
  if (r) {
    console.log(`      ↳ 成功变体：${label}`)
    break
  }
}
await sleep(1300)
const cmts: any = await client
  .request('ListComments' as any, { group_id: ctx.trackId, cursor: 0, count: 20, group_type: 0 })
  .catch(() => null)
if (cmts) {
  const mine = (cmts.comments ?? []).filter((c: any) => String(c.content ?? '').includes('qishui-api 探针评论'))
  console.log(`      ↳ 列表里我发的探针评论：${mine.length} 条`)
  for (const c of mine) {
    await desc(`DeleteComment(${c.id})`, 'DeleteComment', { comment_id: String(c.id) })
  }
}

// ---------------------------------------------------------------- ③ Report
console.log('\n=== ③ Report（原：HTTP 500）===')
const attempts = await probeVariants(
  'Report',
  {
    content_id: ctx.trackId,
    report_type: '1',
    report_reason_code: '1',
    description: 'qishui-api 探针：确认 path 与参数形状',
  },
  { device, cookie: cookieHeader, paceMs: 1300, stopOnSuccess: true },
)
for (const a of attempts)
  console.log(
    `  · ${a.method} ${a.path} http=${a.http} len=${a.len} code=${a.statusCode ?? '—'} ${a.statusMsg ?? a.text.slice(0, 80)}`,
  )

// ---------------------------------------------------------------- ④ AppendRecentlyPlayedMedia
console.log('\n=== ④ AppendRecentlyPlayedMedia（写 ok 但读回没落地）===')
await desc('Append(media 带 attr.duration)', 'AppendRecentlyPlayedMedia', {
  media: [{ id: ctx.trackId, type: 'track', attr: { duration: 240000 } }],
})
const rec = await desc('GetRecentPlayedMedia(media_type 用字符串)', 'GetRecentPlayedMedia', {
  cursor: '0',
  count: '20',
  media_type: '1',
  scene: '',
})
console.log(
  `      ↳ media 条数 = ${(rec?.media ?? []).length}，含测试曲目 = ${rec ? [...idsIn(rec)].includes(ctx.trackId) : '读失败'}`,
)
await desc('DeleteRecentlyPlayedMedia', 'DeleteRecentlyPlayedMedia', { media: [{ id: ctx.trackId, type: 'track' }] })

// ---------------------------------------------------------------- 收尾：删掉探针歌单
console.log('\n=== 收尾 ===')
for (const id of made) await desc(`MDeletePlaylists(${id})`, 'MDeletePlaylists', { playlist_ids: [id] })
const after: any = await desc('GetMyPlaylists(收尾)', 'GetMyPlaylists', { cursor: 0, count: 50, ab_param: '' })
const left = made.filter((id) => idsIn(after).has(id))
console.log(left.length ? `  ⚠️ 还有探针歌单没删掉：${left.join(', ')}` : '  ✅ 探针歌单已清干净')
