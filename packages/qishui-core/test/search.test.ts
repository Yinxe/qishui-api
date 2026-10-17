/**
 * 搜索服务离线单测：result_groups 分组解析、`entity.<kind>` 直壳回归、none 档不缓存口径。
 * mock 上游复刻了「pc 变体恒空 → transport 回退 /luna/search」的实测形态。
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createQishui, type QishuiCore } from '../dist/index.js'
import { createMockUpstream, MOCK_DEVICE } from './support/mockUpstream.js'
import { makeTempDir, rmDir } from './support/tmp.js'

let core: QishuiCore
let mock: ReturnType<typeof createMockUpstream>
let home: string

beforeEach(async () => {
  home = makeTempDir('qishui-search-')
  mock = createMockUpstream()
  core = await createQishui({ dataDir: home, device: MOCK_DEVICE, fetchImpl: mock.fetchImpl })
})

afterEach(() => {
  core.dispose()
  rmDir(home)
})

describe('search', () => {
  it('曲目结果按组解析（track_wrapper 壳与 entity.track 直壳都在）', async () => {
    const result = await core.search.search('晴天', { type: 'track' })
    expect(result.query).toBe('晴天')
    const trackGroup = result.groups.find((g) => g.id === 'g-track')
    expect(trackGroup?.title).toBe('单曲')
    expect(trackGroup?.tracks.map((t) => t.id)).toEqual(['7001', '7002'])
    expect(trackGroup?.tracks[0].data.name).toBe('晴天（mock）')
    // entity.track 直壳（无 *_wrapper）也要能剥出来 —— 搜索结果就是这个形态
    expect(trackGroup?.tracks[1].data.name).toBe('晴天版二')
  })

  it('tracks()/artists() 直通各自分组', async () => {
    const tracks = await core.search.tracks('晴天')
    expect(tracks).toHaveLength(2)
    const artists = await core.search.artists('测试')
    expect(artists.map((a) => a.id)).toEqual(['9001'])
    expect(artists[0].data.name).toBe('测试歌手')
  })

  it('none 档：同一查询连打两次都发请求（实时数据不缓存）', async () => {
    await core.search.tracks('晴天')
    const first = mock.count()
    mock.resetCalls()
    await core.search.tracks('晴天')
    expect(mock.count()).toBe(first)
    expect(first).toBeGreaterThan(0)
  })

  it('transport 在 pc 变体空 body 上回退到 /luna/search', async () => {
    await core.search.tracks('晴天')
    const urls = mock.calls.map((c) => c.url)
    expect(urls.some((u) => u.includes('/luna/pc/search/'))).toBe(true)
    expect(urls.some((u) => u.includes('/luna/search/'))).toBe(true)
  })
})
