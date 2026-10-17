// 实测：FeedSongTab 的 `preference_mode`（App 底部「推荐/熟悉/新鲜」）到底吃哪些值，
// 以及 FeedMode 里的 `scene_mode_id` 能不能直接当 FeedRadioTracks 的 `radio_id` 用。
// 读接口，匿名可用；每次请求间隔 1.2s，跑一次 ~8 个请求。
import fs from 'node:fs'
import { createClient } from '../dist/index.js'

const ROOT = new URL('..', import.meta.url).pathname
const device = JSON.parse(fs.readFileSync(ROOT + 'qishui-device.json', 'utf8'))
const client = await createClient({ device, timeout: 20_000 })
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const ids = (r: any): string[] =>
  (Array.isArray(r.items) ? r.items : [])
    .map((i: any) => i?.entity?.track_wrapper?.track?.id ?? i?.entity?.track?.id ?? i?.track?.id)
    .filter(Boolean)
    .map(String)

// 1) 偏好模式取值
const modes = ['default', 'familiar', 'fresh', 'recommend', '熟悉', '新鲜']
for (const mode of modes) {
  try {
    const r: any = await client.request('FeedSongTab', { preference_mode: mode } as any)
    const list = ids(r)
    console.log(
      `[FeedSongTab] preference_mode=${mode.padEnd(10)} status=${r.status_code} items=${list.length} first=${list[0] ?? '-'} 全部=[${list.slice(0, 3).join(', ')}]`,
    )
  } catch (err: any) {
    console.log(`[FeedSongTab] preference_mode=${mode.padEnd(10)} ${err.name} ${String(err.message).slice(0, 80)}`)
  }
  await sleep(1200)
}

// 2) FeedMode → 场景 id 直接当 radio_id
const mode: any = await client.request('FeedMode', {})
fs.writeFileSync('/tmp/opencode/samples/feedMode.json', JSON.stringify(mode, null, 2))
const bar = (mode.feed_mode_bar?.feed_mode ?? []).filter((m: any) => m.type === 'preference_mode')
console.log(
  '偏好栏 preference_mode:',
  bar.map((m: any) => `${m.text}=${m.entity?.feed_preference_mode?.mode}`).join(' '),
)
const scenes = (mode.feed_mode_block?.[0]?.feed_mode ?? []).slice(0, 3)
await sleep(1200)
for (const scene of scenes) {
  const id = scene.entity?.feed_scene_mode?.scene_mode_id
  try {
    const r: any = await client.request('FeedRadioTracks', { radio_id: id } as any)
    const list = ids(r)
    console.log(
      `[FeedRadioTracks] radio_id=${String(id).padEnd(6)} (${scene.text}) status=${r.status_code} items=${list.length} 前两首=[${list.slice(0, 2).join(', ')}]`,
    )
  } catch (err: any) {
    console.log(`[FeedRadioTracks] radio_id=${id} (${scene.text}) ${err.name} ${String(err.message).slice(0, 80)}`)
  }
  await sleep(1200)
}
