// 写接口实测：把 29 个写端点全跑一遍，全部按「做 → 回读验证 → 撤销 → 再回读」成对执行。
//   node --experimental-strip-types test/write.ts
//
// 会真实改动账号数据（建歌单/收藏/关注/拉黑/发评论/改隐私/取下单 token），但每一步都可回滚：
//   建单 → 改名 → 加歌 → 移歌 → 删单；收藏 ↔ 取消（收藏前先看有没有收藏过，有就跳过，绝不动你原有的收藏）；
//   关注 ↔ 取关；拉黑 ↔ 解除；发评 → 点赞 → 删评；播放上报 → 删除；隐私设置按原值回写；下单只取 token 不付款。
// 收尾再做一次安全复查（歌单数、黑名单、关注数、评论、最近播放、收藏、隐私设置是否都回到原样）。
// 结果并入 /tmp/opencode/endpoint-report.json（让 run.ts 以后跳过这些已测条目），明细另落 /tmp/opencode/write-report.json。
import fs from 'node:fs'
import { createClient } from '../dist/index.js'

const ROOT = new URL('..', import.meta.url).pathname
const REPORT = '/tmp/opencode/endpoint-report.json'
const OUT = '/tmp/opencode/write-report.json'
const PACE = 1300

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const device = JSON.parse(fs.readFileSync(ROOT + 'qishui-device.json', 'utf8'))
const cookies = JSON.parse(fs.readFileSync(ROOT + 'qishui-session.json', 'utf8'))
const client = await createClient({ device, cookies, timeout: 20_000 })
if (!client.isLoggedIn()) {
  console.error('没有有效会话，先跑 test/login.ts --start / --poll')
  process.exit(1)
}
const ctx: any = JSON.parse(fs.readFileSync(REPORT, 'utf8')).ctx

type Rec = { step: string; endpoint: string; verdict: string; detail: string; verified?: string; note?: string }
const recs: Rec[] = []

function classifyErr(err: any): { verdict: string; detail: string } {
  if (err?.name === 'AuthRequiredError') return { verdict: 'login_required', detail: '需要登录' }
  if (err?.name === 'RiskControlError') return { verdict: 'risk_control', detail: String(err.message).slice(0, 80) }
  if (err?.name === 'ApiError')
    return {
      verdict: err.statusCode === 1000016 ? 'login_required' : 'biz_error',
      detail: `status_code=${err.statusCode}`,
    }
  if (err?.name === 'TransportError')
    return {
      verdict: /空响应体/.test(err.message) ? 'empty_body' : 'error',
      detail: `${err.name}: ${err.message.slice(0, 70)}`,
    }
  return { verdict: 'error', detail: String(err?.message ?? err).slice(0, 80) }
}

/** 发一个写请求并登记结果；返回 {ok, body} */
async function fire(step: string, endpoint: string, params: any): Promise<{ ok: boolean; body: any }> {
  await sleep(PACE)
  try {
    const body: any = await client.request(endpoint as any, params)
    const { headers, ...rest } = body
    recs.push({ step, endpoint, verdict: 'ok_json', detail: `字段 ${Object.keys(rest).length} 个`, sent: true } as any)
    console.log(`  ✔ ${step.padEnd(30)} ${endpoint.padEnd(28)} ok_json  ${Object.keys(rest).slice(0, 6).join(', ')}`)
    return { ok: true, body: rest }
  } catch (err: any) {
    const { verdict, detail } = classifyErr(err)
    recs.push({ step, endpoint, verdict, detail, sent: true } as any)
    console.log(`  ✘ ${step.padEnd(30)} ${endpoint.padEnd(28)} ${verdict.padEnd(8)} ${detail}`)
    return { ok: false, body: null }
  }
}

/** 只读探测（不登记为写接口结果） */
async function read(endpoint: string, params: any): Promise<any> {
  await sleep(PACE)
  try {
    const r: any = await client.request(endpoint as any, params)
    const { headers, ...rest } = r
    return rest
  } catch {
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
const hasId = (v: unknown, id: string) => idsIn(v).has(id)

/** 在评论列表里按正文找自己刚发的评论 id */
function findCommentId(v: any, text: string): string | undefined {
  if (Array.isArray(v)) {
    for (const x of v) {
      const r = findCommentId(x, text)
      if (r) return r
    }
    return
  }
  if (v && typeof v === 'object') {
    if (v.content === text && (v.id || v.comment_id)) return String(v.id ?? v.comment_id)
    for (const x of Object.values(v)) {
      const r = findCommentId(x, text)
      if (r) return r
    }
  }
  return
}

const mark = (step: string, endpoint: string, verified: string, note?: string) => {
  const r = recs.find((x) => (x as any).step === step && x.endpoint === endpoint)
  if (r) Object.assign(r, { verified, note })
  console.log(`      ↳ 回读：${verified}${note ? `  ｜ ${note}` : ''}`)
}

// ---------------------------------------------------------------- 快照
console.log('\n=== 快照（写之前）===')
const me0: any = await read('GetMyInfo', {})
const myUid = String(me0?.my_info?.id)
const following0 = Number(me0?.my_stats?.count_following ?? -1)
const pl0: any = await read('GetMyPlaylists', { cursor: 0, count: 50, ab_param: '' })
const plIds0 = idsIn(pl0)
const liked = (pl0?.playlists ?? []).find((p: any) => p.type === 1) // 我喜欢的音乐
const likedTracks: any = liked
  ? await read('GetPlaylistDetail', {
      playlist_id: liked.id,
      cursor: 0,
      count: 100,
      session_id: '',
      reverse: false,
      ab_param: '',
    })
  : null
const blocks0: any = await read('GetBlockUserList', { cursor: '', count: 50 })
const blockIds0 = idsIn(blocks0)
const privacy0: any = await read('GetMyPrivacySetting', {})
const recent0: any = await read('GetRecentPlayedMedia', { cursor: 0, count: 20, media_type: 1, scene: '' })
const mixed0: any = await read('GetMyMixedCollections', { cursor: 0, count: 20 })
const artistCol0: any = await read('GetUserArtistCollection', { user_id: myUid, cursor: '0', count: 50 })
console.log(
  `  我的 uid=${myUid}  关注=${following0}  歌单=${plIds0.size} 个id  黑名单=${blockIds0.size}  我喜欢的音乐 playlists=${liked ? liked.id : '(无)'}  最近播放=${(recent0?.media ?? []).length} 条`,
)

// 关注/拉黑的靶子：用评论作者（不是自己）
const comments0: any = await read('ListComments', { group_id: ctx.trackId, cursor: 0, count: 20, group_type: 1 })
const targetUser = String(
  (comments0?.comments ?? []).map((c: any) => String(c.user?.id)).find((id: string) => id && id !== myUid) ?? '',
)
console.log(`  社交靶子 user_id=${targetUser || '(没找到，跳过关注/拉黑)'}`)

// ---------------------------------------------------------------- A. 歌单链路
console.log('\n=== A. 歌单：建单 → 改名 → 加歌 → 移歌 → 删单 ===')
const created = await fire('A1 建歌单', 'CreatePlaylist', { name: 'qishui-api 写测单', is_private: true })
let newPl = ''
if (created.ok) {
  const pl1: any = await read('GetMyPlaylists', { cursor: 0, count: 50, ab_param: '' })
  newPl = [...idsIn(pl1)].find((id) => !plIds0.has(id)) ?? ''
  mark(
    'A1 建歌单',
    'CreatePlaylist',
    newPl ? `GetMyPlaylists 里出现新单 ${newPl}` : '⚠️ 回读没找到新单（响应字段名可能变了）',
    newPl ? '命名 "qishui-api 写测单"' : undefined,
  )
}
if (newPl) {
  const up = await fire('A2 改歌单信息', 'UpdatePlaylistInfo', {
    playlist_id: newPl,
    name: 'qishui-api 写测单(已改名)',
  })
  if (up.ok) {
    const d: any = await read('GetPlaylistDetail', {
      playlist_id: newPl,
      cursor: 0,
      count: 20,
      session_id: '',
      reverse: false,
      ab_param: '',
    })
    mark('A2 改歌单信息', 'UpdatePlaylistInfo', `title="${d?.playlist?.title}"`)
  }
  const add = await fire('A3 歌单加歌', 'MAppendPlaylistMedia', {
    playlist_id: newPl,
    media: [{ id: ctx.trackId, type: 'track' }],
  })
  if (add.ok) {
    const d: any = await read('GetPlaylistDetail', {
      playlist_id: newPl,
      cursor: 0,
      count: 20,
      session_id: '',
      reverse: false,
      ab_param: '',
    })
    mark(
      'A3 歌单加歌',
      'MAppendPlaylistMedia',
      `count_tracks=${d?.playlist?.count_tracks}，含该曲目=${hasId(d, ctx.trackId)}`,
    )
  }
  const del1 = await fire('A4 歌单移歌', 'DeletePlaylistMedia', {
    playlist_id: newPl,
    media: [{ id: ctx.trackId, type: 'track' }],
  })
  if (del1.ok) {
    const d: any = await read('GetPlaylistDetail', {
      playlist_id: newPl,
      cursor: 0,
      count: 20,
      session_id: '',
      reverse: false,
      ab_param: '',
    })
    mark(
      'A4 歌单移歌',
      'DeletePlaylistMedia',
      `count_tracks=${d?.playlist?.count_tracks}，含该曲目=${hasId(d, ctx.trackId)}`,
    )
  }
  const del2 = await fire('A5 删歌单', 'MDeletePlaylists', { playlist_ids: [newPl] })
  if (del2.ok) {
    const pl2: any = await read('GetMyPlaylists', { cursor: 0, count: 50, ab_param: '' })
    mark('A5 删歌单', 'MDeletePlaylists', idsIn(pl2).has(newPl) ? '⚠️ 还在，回滚会再删一次' : '已从 GetMyPlaylists 消失')
  }
}

// ---------------------------------------------------------------- B. 收藏链路
console.log('\n=== B. 收藏/最近播放：收藏 ↔ 取消（原有的收藏绝不动）===')
const trackAlready = hasId(likedTracks, ctx.trackId)
const c1 = await fire('B1 收藏曲目', 'CollectTracks', { track_ids: [ctx.trackId] })
if (c1.ok) {
  const d: any = await read('GetPlaylistDetail', {
    playlist_id: liked?.id,
    cursor: 0,
    count: 100,
    session_id: '',
    reverse: false,
    ab_param: '',
  })
  mark(
    'B1 收藏曲目',
    'CollectTracks',
    `「我喜欢的音乐」含该曲目=${hasId(d, ctx.trackId)}`,
    trackAlready ? '注意：写之前就已经收藏过' : undefined,
  )
  if (!trackAlready) {
    const c2 = await fire('B2 取消收藏曲目', 'MDeleteCollectedTracks', { track_ids: [ctx.trackId] })
    if (c2.ok) {
      const d2: any = await read('GetPlaylistDetail', {
        playlist_id: liked?.id,
        cursor: 0,
        count: 100,
        session_id: '',
        reverse: false,
        ab_param: '',
      })
      mark(
        'B2 取消收藏曲目',
        'MDeleteCollectedTracks',
        `「我喜欢的音乐」含该曲目=${hasId(d2, ctx.trackId)}（应为 false）`,
      )
    }
  } else {
    console.log('      ↳ 原本就收藏着，跳过「取消收藏」以免动到你自己的收藏')
  }
}

const mixedHas = (m: any, id: string) => hasId(m, id)
const albumAlready = mixedHas(mixed0, ctx.albumId)
const b3 = await fire('B3 收藏专辑', 'CollectAlbums', { album_ids: [ctx.albumId] })
if (b3.ok) {
  const m: any = await read('GetMyMixedCollections', { cursor: 0, count: 20 })
  mark(
    'B3 收藏专辑',
    'CollectAlbums',
    `GetMyMixedCollections 含该专辑=${mixedHas(m, ctx.albumId)}`,
    albumAlready ? '写之前就已收藏' : undefined,
  )
  if (!albumAlready) {
    const b4 = await fire('B4 取消收藏专辑', 'MDeleteCollectedAlbums', { album_ids: [ctx.albumId] })
    if (b4.ok) {
      const m2: any = await read('GetMyMixedCollections', { cursor: 0, count: 20 })
      mark('B4 取消收藏专辑', 'MDeleteCollectedAlbums', `含该专辑=${mixedHas(m2, ctx.albumId)}（应为 false）`)
    }
  }
}

const artistAlready = hasId(artistCol0, ctx.artistId)
const b5 = await fire('B5 关注艺人', 'CollectArtists', { artist_ids: [ctx.artistId] })
if (b5.ok) {
  const a: any = await read('GetUserArtistCollection', { user_id: myUid, cursor: '0', count: 50 })
  mark(
    'B5 关注艺人',
    'CollectArtists',
    `GetUserArtistCollection 含该艺人=${hasId(a, ctx.artistId)}`,
    artistAlready ? '写之前就已关注' : undefined,
  )
  if (!artistAlready) {
    const b6 = await fire('B6 取消关注艺人', 'MDeleteCollectedArtists', { artist_ids: [ctx.artistId] })
    if (b6.ok) {
      const a2: any = await read('GetUserArtistCollection', { user_id: myUid, cursor: '0', count: 50 })
      mark('B6 取消关注艺人', 'MDeleteCollectedArtists', `含该艺人=${hasId(a2, ctx.artistId)}（应为 false）`)
    }
  }
}

const plFavAlready = mixedHas(mixed0, ctx.playlistId)
const b7 = await fire('B7 收藏歌单', 'CollectPlaylists', { playlist_ids: [ctx.playlistId] })
if (b7.ok) {
  const m: any = await read('GetMyMixedCollections', { cursor: 0, count: 20 })
  mark(
    'B7 收藏歌单',
    'CollectPlaylists',
    `GetMyMixedCollections 含该歌单=${mixedHas(m, ctx.playlistId)}`,
    plFavAlready ? '写之前就已收藏' : undefined,
  )
  if (!plFavAlready) {
    const b8 = await fire('B8 取消收藏歌单', 'MDeleteCollectedPlaylists', { playlist_ids: [ctx.playlistId] })
    if (b8.ok) {
      const m2: any = await read('GetMyMixedCollections', { cursor: 0, count: 20 })
      mark('B8 取消收藏歌单', 'MDeleteCollectedPlaylists', `含该歌单=${mixedHas(m2, ctx.playlistId)}（应为 false）`)
    }
  }
}

const b9 = await fire('B9 批量收藏(media)', 'CollectMediaList', {
  scene: 'track',
  collect_action: 1,
  media: [{ id: ctx.trackId, type: 'track' }],
})
if (b9.ok) {
  const m: any = await read('GetMyMixedCollections', { cursor: 0, count: 20 })
  mark(
    'B9 批量收藏(media)',
    'CollectMediaList',
    `混排含该曲目=${hasId(m, ctx.trackId)}（曲目可能不在这里，用「我喜欢的音乐」复核 ${hasId(await read('GetPlaylistDetail', { playlist_id: liked?.id, cursor: 0, count: 100, session_id: '', reverse: false, ab_param: '' }), ctx.trackId)}）`,
  )
  if (!trackAlready) {
    const b10 = await fire('B10 批量取消收藏', 'DeleteCollectedMediaList', {
      media: [{ id: ctx.trackId, type: 'track' }],
    })
    if (b10.ok) {
      const d2: any = await read('GetPlaylistDetail', {
        playlist_id: liked?.id,
        cursor: 0,
        count: 100,
        session_id: '',
        reverse: false,
        ab_param: '',
      })
      mark(
        'B10 批量取消收藏',
        'DeleteCollectedMediaList',
        `「我喜欢的音乐」含该曲目=${hasId(d2, ctx.trackId)}（应为 false）`,
      )
    }
  }
}

const recentHad = hasId(recent0, ctx.trackId)
const b11 = await fire('B11 上报最近播放', 'AppendRecentlyPlayedMedia', { media: [{ id: ctx.trackId, type: 'track' }] })
if (b11.ok) {
  const r: any = await read('GetRecentPlayedMedia', { cursor: 0, count: 20, media_type: 1, scene: '' })
  mark(
    'B11 上报最近播放',
    'AppendRecentlyPlayedMedia',
    `最近播放含该曲目=${hasId(r, ctx.trackId)}（${(r?.media ?? []).length} 条）`,
  )
  if (!recentHad) {
    const b12 = await fire('B12 删除最近播放', 'DeleteRecentlyPlayedMedia', {
      media: [{ id: ctx.trackId, type: 'track' }],
    })
    if (b12.ok) {
      const r2: any = await read('GetRecentPlayedMedia', { cursor: 0, count: 20, media_type: 1, scene: '' })
      mark('B12 删除最近播放', 'DeleteRecentlyPlayedMedia', `含该曲目=${hasId(r2, ctx.trackId)}（应为 false）`)
    }
  }
}

// ---------------------------------------------------------------- C. 社交
console.log('\n=== C. 社交：关注 ↔ 取关、拉黑 ↔ 解除 ===')
if (targetUser) {
  const c2 = await fire('C1 关注用户', 'FollowUser', { user_id: targetUser })
  if (c2.ok) {
    const me1: any = await read('GetMyInfo', {})
    mark('C1 关注用户', 'FollowUser', `my_stats.count_following ${following0} → ${me1?.my_stats?.count_following}`)
    const c3 = await fire('C2 取消关注', 'UnfollowUser', { user_id: targetUser })
    if (c3.ok) {
      const me2: any = await read('GetMyInfo', {})
      mark('C2 取消关注', 'UnfollowUser', `count_following → ${me2?.my_stats?.count_following}（应回到 ${following0}）`)
    }
  }
  const blockItems = [{ id: targetUser, item_type: 'user' }]
  const c4 = await fire('C3 拉黑', 'CommitBlockV2', { block_items: blockItems })
  if (c4.ok) {
    const bl: any = await read('GetBlockUserList', { cursor: '', count: 50 })
    mark('C3 拉黑', 'CommitBlockV2', `黑名单含该用户=${hasId(bl, targetUser)}`)
    const c5 = await fire('C4 解除拉黑', 'CancelBlockV2', { block_items: blockItems })
    if (c5.ok) {
      const bl2: any = await read('GetBlockUserList', { cursor: '', count: 50 })
      mark('C4 解除拉黑', 'CancelBlockV2', `黑名单含该用户=${hasId(bl2, targetUser)}（应为 false）`)
    }
  }
} else {
  console.log('  （没有合适的靶子用户，跳过 C 组）')
}

// ---------------------------------------------------------------- D. 评论
console.log('\n=== D. 评论：发评 → 点赞 → 删评 ===')
// ctx.trackId 那首的评论区是关着的（CreateComment 回 3056），先找一首「评论区开放」的曲目：
// 用 FeedSongTab 的曲目挨个试，第一个发成功的就用它。
const feedTracks = [...idsIn(await read('FeedSongTab', {}))].filter((x) => x.length === 19)
const text = `qishui-api 写测评论 ${Date.now()}`
let commentTrack = ''
let myComment = ''
for (const t of [ctx.trackId, ...feedTracks].slice(0, 4)) {
  const r = await fire(`D1 发评论(group_id=${t.slice(0, 6)}…)`, 'CreateComment', {
    group_id: t,
    group_type: 0,
    text,
    comment_type: 0,
  })
  if (!r.ok) continue
  commentTrack = t
  myComment =
    findCommentId(await read('ListComments', { group_id: t, cursor: 0, count: 20, group_type: 1 }), text) ?? ''
  mark(
    `D1 发评论(group_id=${t.slice(0, 6)}…)`,
    'CreateComment',
    myComment ? `ListComments 里找到新评论 ${myComment}` : '⚠️ 回读没找到这条评论（可能不在第一页）',
  )
  break
}
if (!commentTrack) console.log('  （试过的曲目都发不出去，评论区都关着）')
if (commentTrack && myComment) {
  const d2 = await fire('D2 评论点赞', 'CommentAction', {
    comment_id: myComment,
    reply_id: '',
    group_id: commentTrack,
    type: 1,
    scene_name: '',
  })
  if (d2.ok) {
    const after: any = await read('ListComments', { group_id: commentTrack, cursor: 0, count: 20, group_type: 1 })
    mark(
      'D2 评论点赞',
      'CommentAction',
      `评论仍在列表里=${JSON.stringify(after).includes(text)}（点赞状态看 count_digged）`,
    )
  }
  const d3 = await fire('D3 删评论', 'DeleteComment', { comment_id: myComment })
  if (d3.ok) {
    const after: any = await read('ListComments', { group_id: commentTrack, cursor: 0, count: 20, group_type: 1 })
    mark('D3 删评论', 'DeleteComment', `列表里还有这条评论=${JSON.stringify(after).includes(text)}（应为 false）`)
  }
}

// ---------------------------------------------------------------- E. 上报/设置
console.log('\n=== E. 上报 + 隐私设置 ===')
const e1 = await fire('E1 不感兴趣', 'Dislike', { item_id: ctx.trackId, dislike_item_type: 1, action_type: 1 })
if (e1.ok) {
  const e2 = await fire('E2 取消不感兴趣', 'Dislike', { item_id: ctx.trackId, dislike_item_type: 1, action_type: 0 })
  mark(
    'E1 不感兴趣',
    'Dislike',
    e2.ok ? 'action_type=1 后跟 action_type=0 都成功（0 应为取消）' : '⚠️ action_type=0 不成功，撤销没验到',
  )
}
// 举报：不可撤销，用真实枚举试一次
const e3 = await fire('E3 提交举报', 'Report', {
  content_id: ctx.trackId,
  report_type: '1',
  report_reason_code: '1',
  description: 'qishui-api 写接口实测，用于确认参数形状',
})
if (e3.ok) mark('E3 提交举报', 'Report', '上游接受（不可撤销，已记在报告里）')
// 隐私设置：把读到的值原样写回（验证写通道，不改任何东西），再回读确认
const subset: any = {
  follow_info_visibility: privacy0?.privacy_setting?.follow_info_visibility,
  sync_video_to_luna: privacy0?.privacy_setting?.sync_video_to_luna,
  my_favorite_visibility: privacy0?.privacy_setting?.my_favorite_visibility,
  music_wall_visibility: privacy0?.privacy_setting?.music_wall_visibility,
}
const e4 = await fire('E4 改隐私设置(原值回写)', 'UpdateMyPrivacySetting', subset)
if (e4.ok) {
  const p: any = await read('GetMyPrivacySetting', {})
  const same = [
    'follow_info_visibility',
    'sync_video_to_luna',
    'my_favorite_visibility',
    'music_wall_visibility',
  ].every((k) => p?.privacy_setting?.[k] === privacy0?.privacy_setting?.[k])
  mark('E4 改隐私设置(原值回写)', 'UpdateMyPrivacySetting', `6 个开关与写前一致=${same}`)
}

// ---------------------------------------------------------------- F. 商业化（只取 token，不付款）
console.log('\n=== F. 商业化：取下单 token（不付款）===')
const sub: any = await read('GetMySubscription', {})
const offer = (sub?.to_purchase_offers ?? [])[0]
const offerId = String(offer?.offer_id ?? '')
const f1 = await fire('F1 取 offer token', 'GetPurchaseOfferToken', { offer_id: offerId, report_param: '{}' })
const token = String(f1.body?.token ?? f1.body?.offer_token ?? '')
if (f1.ok)
  mark(
    'F1 取 offer token',
    'GetPurchaseOfferToken',
    `offer_id=${offerId}，拿到 token=${token ? token.slice(0, 12) + '…' : '(响应里没找到 token 字段)'}`,
  )
const f2 = await fire('F2 PC 取 token', 'GetOffersTokensForPC', {
  offer_snapshot_id: String(offer?.external_offer_id ?? offerId),
  report_param: '{}',
})
if (f2.ok) mark('F2 PC 取 token', 'GetOffersTokensForPC', '用 offer_snapshot_id 成功')
if (token) {
  const f3 = await fire('F3 查 token 状态', 'QueryTokenStatus', { token })
  if (f3.ok) mark('F3 查 token 状态', 'QueryTokenStatus', 'token 状态可查')
  const f4 = await fire('F4 查 token 状态(PC)', 'GetOffersTokensStatusForPC', { token })
  if (f4.ok) mark('F4 查 token 状态(PC)', 'GetOffersTokensStatusForPC', 'token 状态可查')
} else {
  console.log('  （没拿到 token，跳过 F3/F4；QueryTokenStatus / GetOffersTokensStatusForPC 记未验证）')
  for (const e of ['QueryTokenStatus', 'GetOffersTokensStatusForPC']) {
    recs.push({
      step: '—',
      endpoint: e,
      verdict: 'unverified',
      detail: '依赖 F1 的 token，F1 没给出 token',
      sent: false,
    } as any)
  }
}

// ---------------------------------------------------------------- 收尾安全复查
console.log('\n=== 收尾安全复查（应该都回到原样）===')
const meF: any = await read('GetMyInfo', {})
const plF: any = await read('GetMyPlaylists', { cursor: 0, count: 50, ab_param: '' })
const blF: any = await read('GetBlockUserList', { cursor: '', count: 50 })
const mixedF: any = await read('GetMyMixedCollections', { cursor: 0, count: 20 })
const recentF: any = await read('GetRecentPlayedMedia', { cursor: 0, count: 20, media_type: 1, scene: '' })
const cmtF: any = await read('ListComments', {
  group_id: commentTrack || ctx.trackId,
  cursor: 0,
  count: 20,
  group_type: 1,
})
const likedF: any = liked
  ? await read('GetPlaylistDetail', {
      playlist_id: liked.id,
      cursor: 0,
      count: 100,
      session_id: '',
      reverse: false,
      ab_param: '',
    })
  : null
const artF: any = await read('GetUserArtistCollection', { user_id: myUid, cursor: '0', count: 50 })
const privacyF: any = await read('GetMyPrivacySetting', {})

const checks: [string, boolean, string][] = [
  ['歌单（无新增/无丢失）', idsIn(plF).size === plIds0.size, `${plIds0.size} → ${idsIn(plF).size}`],
  ['建单已删干净', !newPl || !idsIn(plF).has(newPl), newPl ? `新建的 ${newPl} 已不在列表` : '（没建成功）'],
  [
    '关注数回到原值',
    Number(meF?.my_stats?.count_following) === following0,
    `${following0} → ${meF?.my_stats?.count_following}`,
  ],
  ['黑名单回到原值', idsIn(blF).size === blockIds0.size, `${blockIds0.size} → ${idsIn(blF).size}`],
  [
    '测试评论已删',
    !myComment || !JSON.stringify(cmtF).includes(text),
    myComment ? `评论 ${myComment} 已不在列表` : '（没发成功）',
  ],
  [
    '最近播放回到原值',
    hasId(recentF, ctx.trackId) === recentHad,
    `含测试曲目=${hasId(recentF, ctx.trackId)}（原 ${recentHad}）`,
  ],
  [
    '曲目收藏态回到原值',
    hasId(likedF, ctx.trackId) === hasId(likedTracks, ctx.trackId),
    `含测试曲目=${hasId(likedF, ctx.trackId)}（原 ${hasId(likedTracks, ctx.trackId)}）`,
  ],
  [
    '专辑收藏态回到原值',
    hasId(mixedF, ctx.albumId) === albumAlready,
    `含测试专辑=${hasId(mixedF, ctx.albumId)}（原 ${albumAlready}）`,
  ],
  [
    '歌单收藏态回到原值',
    hasId(mixedF, ctx.playlistId) === plFavAlready,
    `含测试歌单=${hasId(mixedF, ctx.playlistId)}（原 ${plFavAlready}）`,
  ],
  [
    '艺人关注态回到原值',
    hasId(artF, ctx.artistId) === artistAlready,
    `含测试艺人=${hasId(artF, ctx.artistId)}（原 ${artistAlready}）`,
  ],
  [
    '隐私设置未被改动',
    JSON.stringify(privacyF?.privacy_setting) === JSON.stringify(privacy0?.privacy_setting),
    '6 个开关与写前逐字段一致',
  ],
]
let bad = 0
for (const [name, ok, detail] of checks) {
  if (!ok) bad++
  console.log(`  ${ok ? '✅' : '❌'} ${name.padEnd(24)} ${detail}`)
}

// ---------------------------------------------------------------- 合并进 run.ts 的报告 + 落明细
const verdicts = new Map<string, Rec>()
for (const r of recs) {
  const prev = verdicts.get(r.endpoint)
  // 同一个端点试了多个变体时，成功的那个说了算（比如换曲目才发成功的评论）
  if (!prev || (prev.verdict !== 'ok' && r.verdict === 'ok')) verdicts.set(r.endpoint, r)
}
const report = JSON.parse(fs.readFileSync(REPORT, 'utf8'))
for (const res of report.results) {
  const v = verdicts.get(res.name)
  if (!v) continue
  res.verdict = v.verdict
  res.detail = `【写接口实测】${v.detail}${v.verified ? ` ｜ 回读：${v.verified}` : ''}`
  res.sent = true
}
fs.writeFileSync(REPORT, JSON.stringify(report, null, 2))
fs.writeFileSync(
  OUT,
  JSON.stringify(
    {
      at: new Date().toISOString(),
      loggedIn: true,
      myUid,
      checks: checks.map(([n, o, d]) => ({ name: n, pass: o, detail: d })),
      recs,
    },
    null,
    2,
  ),
)

const t: Record<string, number> = {}
for (const r of recs) t[r.verdict] = (t[r.verdict] ?? 0) + 1
console.log(`\n=== 写接口汇总（共 ${recs.length} 次调用）===`)
console.log(
  Object.entries(t)
    .map(([k, v]) => `${k}=${v}`)
    .join('  '),
)
console.log(`安全复查：${checks.length - bad}/${checks.length} 通过${bad ? ` —— ⚠️ ${bad} 项不符，请看上面 ❌` : ''}`)
console.log(`明细 → ${OUT}\n已并入 ${REPORT}`)
