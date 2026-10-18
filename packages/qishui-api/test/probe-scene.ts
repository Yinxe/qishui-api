// 「场景模式」到底怎么请求才真的按场景出歌 —— 这条探针就是那个结论的现场记录。
//
// 起因：选了「日语」场景，推回来的却是中文流行。三条只读请求把口径钉死：
//   1. FeedMode：45 个场景，每个带 `feed_scene_mode{scene_mode_id, sub_queue_type}`（日语 = 30）；
//   2. FeedRadioTracks { radio_id: 30 }：**不报错，但回的是通用推荐池**（中文歌）；
//      连不存在的 `999999999999` 也照回 6 首 —— 说明这条路的 id 空间是「电台队列」，短数字被忽略；
//   3. FeedSongTab { feed_preference: { scene_mode_id: 30 } }：真出日文歌（中島美嘉/米津玄師/まふまふ…）。
//      形状必须是**扁平**的 `{scene_mode_id}`；套一层 `{scene_mode:{scene_mode_id}}` 也回通用池。
//
// 只读，三个请求。结论同步写进 `docs/APP_ENDPOINTS.md` 与 core 的 `FeedSongTabOptions.sceneModeId`。
//   node --experimental-strip-types test/probe-scene.ts
import fs from 'node:fs'
import { createClient } from '../dist/index.js'

const device: any = JSON.parse(fs.readFileSync(`${process.env.HOME}/.qishui/device.json`, 'utf8')).device
const accounts: any = JSON.parse(fs.readFileSync(`${process.env.HOME}/.qishui/accounts.json`, 'utf8'))
const uid = String(accounts.accounts?.[0]?.uid ?? '')
const cookies: any = JSON.parse(fs.readFileSync(`${process.env.HOME}/.qishui/accounts/${uid}.json`, 'utf8')).cookies
const client = await createClient({ device, cookies, timeout: 20_000 })
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
/** 假名：日语歌几乎必有，用来给人一个「像不像」的粗信号，不当作判定 */
const KANA = /[\u3040-\u30ff]/

const tracksOf = (body: any): any[] =>
  (Array.isArray(body?.items) ? body.items : [])
    .map((item: any) => item?.entity?.track_wrapper?.track ?? item?.entity?.track ?? item?.entity?.media)
    .filter(Boolean)

function report(tag: string, list: any[]): void {
  const kana = list.filter((t) => KANA.test(`${t?.name ?? ''}${(t?.artists ?? []).map((a: any) => a?.name).join('')}`))
  console.log(`\n== ${tag}  items=${list.length}  假名命中=${kana.length}`)
  for (const t of list)
    console.log(`   - ${t?.name ?? '?'} — ${(t?.artists ?? []).map((a: any) => a?.name ?? '?').join('/')}`)
}

// 1) 场景表
const mode: any = await client.request('FeedMode' as any, {})
const scenes: any[] = []
for (const block of Array.isArray(mode?.feed_mode_block) ? mode.feed_mode_block : [])
  for (const item of Array.isArray(block?.feed_mode) ? block.feed_mode : []) scenes.push(item)
const ja = scenes.find((item) => (item?.text ?? '').includes('日语')) ?? scenes[0]
const sceneId = Number(ja?.entity?.feed_scene_mode?.scene_mode_id)
console.log(`== FeedMode：${scenes.length} 个场景；取「${ja?.text}」scene_mode_id=${sceneId}`)
console.log(`   形状：${JSON.stringify({ type: ja?.type, entity: ja?.entity, text: ja?.text })}`)

// 2) 错路：把场景 id 当 radio_id
await sleep(1300)
const wrong: any = await client.request('FeedRadioTracks' as any, { radio_id: String(sceneId) })
report(`FeedRadioTracks { radio_id: ${sceneId} }（错路：id 空间是电台队列）`, tracksOf(wrong))

// 3) 正路：FeedSongTab + 扁平 feed_preference.scene_mode_id
await sleep(1300)
const right: any = await client.request('FeedSongTab' as any, {
  feed_mode: 'track',
  preference_mode: 'default',
  count: 12,
  feed_preference: { scene_mode_id: sceneId },
})
report(`FeedSongTab { feed_preference: { scene_mode_id: ${sceneId} } }（正路）`, tracksOf(right))
