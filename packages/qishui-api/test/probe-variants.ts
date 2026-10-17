// 通用变体试探：对指定端点，逐个 path 变体（含方法）实打一遍，找真正可用的那条。
// 起因：Search 的 /luna/pc/ 变体恒 0 字节，而 /luna/search/ 变体匿名可用 —— transport 自动选路选错了。
//   node --experimental-strip-types test/probe-variants.ts [端点名 ...] [k=v 覆盖参数 ...]
// 直打逻辑共用 test/raw.ts（与 run.ts 同一套，保证「接口结论只看响应」）。
import fs from 'node:fs'
import { CATALOG, type Ctx } from './catalog.ts'
import { loadDevice, probeVariants, classifyAttempts } from './raw.ts'

const ROOT = new URL('..', import.meta.url).pathname
const device = loadDevice(ROOT)
const report = JSON.parse(fs.readFileSync('/tmp/opencode/endpoint-report.json', 'utf8'))
const ctx: Ctx = report.ctx

// 默认只探「上一轮没拿到数据」的那些
const DEFAULT = [
  'Search',
  'Search2023',
  'FlowSearch',
  'GetFeaturedContents',
  'GetChartDetail',
  'GetSearchBlock',
  'GetOffersTokensForPC',
  'GetOffersTokensStatusForPC',
  'GetBlockUserList',
  'GetUserMixedCollections',
  'GetTrackV2',
  'GetMediaPlayer',
  'GetVideoV2',
]
const targets = process.argv.slice(2).filter((a) => !a.includes('=') )
const overrides: Record<string, string> = {}
for (const a of process.argv.slice(2)) {
  const i = a.indexOf('=')
  if (i > 0) overrides[a.slice(0, i)] = a.slice(i + 1)
}

const list = targets.length ? targets : DEFAULT
for (const name of list) {
  const entry = CATALOG.find((e) => e.name === name)
  const params = { ...(entry ? (entry.params(ctx) as Record<string, unknown>) : {}), ...overrides }
  console.log(`\n### ${name}  (params: ${JSON.stringify(params).slice(0, 120)})`)
  const attempts = await probeVariants(name, params, { device, paceMs: 1200 })
  if (!attempts.length) {
    console.log('  （不在端点表里，或路径参数缺失）')
    continue
  }
  for (const a of attempts) {
    const head = a.statusCode !== undefined ? `code=${a.statusCode} ${a.statusMsg ?? ''}` : a.error ?? a.text.slice(0, 150)
    console.log(`  - ${a.method.padEnd(4)} ${a.path.padEnd(38)} http=${a.http} len=${String(a.len).padStart(6)}  ${head}`)
  }
  const c = classifyAttempts(attempts)
  console.log(`  => ${c.verdict}  ${c.sample ?? c.detail}`)
}
