/**
 * 播放器状态机离线单测：状态流、进度时钟、暂停/恢复、队列操作、曲终行为、失败路径。
 * 全程 mock 上游；tickMs 调到 10 让时间断言快起来。
 */
import fs from 'node:fs'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createQishui, type PlayerStatus, type QishuiCore } from '../dist/index.js'
import { createMockUpstream, MOCK_DEVICE } from './support/mockUpstream.js'
import { makeTempDir, rmDir, sleep } from './support/tmp.js'

const T1 = '7068138081588611073'
const T2 = '7168965360136226827'

let home: string
let mock: ReturnType<typeof createMockUpstream>
let core: QishuiCore

beforeEach(async () => {
  home = makeTempDir('qishui-player-')
  mock = createMockUpstream()
  core = await createQishui({ dataDir: home, device: MOCK_DEVICE, fetchImpl: mock.fetchImpl, player: { tickMs: 10 } })
})

afterEach(() => {
  core.player.dispose()
  core.dispose()
  rmDir(home)
})

function statusRecorder(player: QishuiCore['player']): PlayerStatus[] {
  const seen: PlayerStatus[] = [player.status]
  player.on('status', (e) => seen.push(e.status))
  return seen
}

describe('player：首播与时钟', () => {
  it('play(id) 走 idle→loading→playing，落盘出 cache 源，记一次播放', async () => {
    const seen = statusRecorder(core.player)
    const tracks: string[] = []
    core.player.on('track', (e) => tracks.push(e.track?.id ?? ''))
    await core.player.play(T1)
    expect(seen).toEqual(['idle', 'loading', 'playing'])
    expect(tracks).toEqual([T1])
    const source = core.player.source
    expect(source?.kind).toBe('cache')
    expect(source?.path && fs.existsSync(source.path)).toBe(true)
    // 裸 id 进来时队列里就是壳，曲名以解析后的 source.track 为准
    expect(source?.track.name).toBe('晴天（mock）')
    expect(core.plays()).toHaveLength(1)
  })

  it('进度时钟推进；pause 冻结位置；resume 续走', async () => {
    await core.player.play(T1)
    await sleep(120)
    expect(core.player.positionMs).toBeGreaterThanOrEqual(80)
    core.player.pause()
    expect(core.player.status).toBe('paused')
    const frozen = core.player.positionMs
    await sleep(80)
    expect(core.player.positionMs).toBe(frozen)
    await core.player.resume()
    expect(core.player.status).toBe('playing')
    await sleep(60)
    expect(core.player.positionMs).toBeGreaterThan(frozen)
  })

  it('歌词行跟着位置走（lyricState 给当前行）', async () => {
    await core.player.play(T1)
    core.player.seek(2000)
    expect(core.player.lyricState()?.line?.text).toBe('第一行歌词')
    core.player.seek(5000)
    expect(core.player.lyricState()?.line?.text).toBe('第二行歌词')
  })

  it('stop 后重播命中媒体缓存（零请求、fromCache）', async () => {
    await core.player.play(T1)
    core.player.stop()
    expect(core.player.status).toBe('stopped')
    mock.resetCalls()
    await core.player.play()
    expect(core.player.status).toBe('playing')
    expect(core.player.source?.fromCache).toBe(true)
    expect(mock.count()).toBe(0)
  })
})

describe('player：队列与模式', () => {
  it('seek 按曲长钳位；volume/rate 有边界', async () => {
    // 钳位用的是队列曲目自己的 durationMs，所以喂带完整元数据的实体而不是裸 id
    await core.player.play(await core.catalog.track(T1))
    core.player.seek(1000)
    expect(core.player.positionMs).toBe(1000)
    core.player.seek(999_999)
    expect(core.player.positionMs).toBe(core.player.durationMs)
    core.player.setVolume(2)
    expect(core.player.volume).toBe(1)
    core.player.setRate(10)
    expect(core.player.rate).toBe(4)
  })

  it('enqueue/playNext/next/previous/playIndex 都按播放顺序走', async () => {
    await core.player.play(T1)
    core.player.enqueue(T2)
    core.player.setRepeat('all')
    const moved = await core.player.next()
    expect(moved).toBe(true)
    expect(core.player.current?.id).toBe(T2)
    await core.player.previous()
    expect(core.player.current?.id).toBe(T1)
    await core.player.playIndex(1)
    expect(core.player.current?.id).toBe(T2)
    core.player.enqueue(T1) // 已在队列里也应能再排一次位置
    expect(core.player.queue.length).toBe(3)
  })

  it('playList(startTrackId) 从指定曲目开播；clear 回 idle', async () => {
    await core.player.playList([T1, T2], T2)
    expect(core.player.current?.id).toBe(T2)
    expect(core.player.state.index).toBe(1)
    core.player.clear()
    expect(core.player.status).toBe('idle')
    expect(core.player.queue.length).toBe(0)
  })

  it('曲尾：repeat off → stopped；repeat all → 换下一首接着播', async () => {
    const t1 = await core.catalog.track(T1)
    const t2 = await core.catalog.track(T2)
    await core.player.play(t1)
    core.player.seek(core.player.durationMs - 20)
    await sleep(150)
    expect(core.player.status).toBe('stopped')

    await core.player.play([t1, t2])
    core.player.setRepeat('all')
    core.player.seek(core.player.durationMs - 20)
    await sleep(150)
    expect(core.player.current?.id).toBe(T2)
    expect(['loading', 'playing']).toContain(core.player.status)
  })

  it('repeat one：曲终原地重播', async () => {
    await core.player.play(await core.catalog.track(T1))
    core.player.setRepeat('one')
    const actions: string[] = []
    core.player.on('ended', (e) => actions.push(e.action))
    core.player.seek(core.player.durationMs - 20)
    await sleep(150)
    expect(actions).toContain('repeat')
    expect(core.player.status).toBe('playing')
    expect(core.player.current?.id).toBe(T1)
    expect(core.player.positionMs).toBeLessThan(1000)
  })
})

describe('player：试听片段与真实时长', () => {
  it('片段：durationMs 用片段长度、clipStartMs 给出起点，歌词按整曲时间轴对齐', async () => {
    const home2 = makeTempDir('qishui-player-clip-')
    try {
      const clipMock = createMockUpstream({ clip: { startSec: 2, durationSec: 4 } })
      const core2 = await createQishui({
        dataDir: home2,
        device: MOCK_DEVICE,
        fetchImpl: clipMock.fetchImpl,
        player: { tickMs: 10 },
      })
      await core2.player.play(T1)
      expect(core2.player.durationMs).toBe(4000)
      expect(core2.player.clipStartMs).toBe(2000)
      expect(core2.player.songPositionMs).toBe(core2.player.positionMs + 2000)
      // 播放位置 0 = 歌曲第 2s，落在「第一行歌词」（整曲 1s 起）
      expect(core2.player.lyricState()?.line?.text).toBe('第一行歌词')
      core2.player.seek(0)
      expect(core2.player.lyricState()?.line?.text).toBe('第一行歌词')
      core2.player.dispose()
      core2.dispose()
    } finally {
      rmDir(home2)
    }
  })

  it('setDuration：外部播放器报的真实时长优先，钳位进度；清空后回落元数据', async () => {
    await core.player.play(T1)
    expect(core.player.durationMs).toBe(12_345)
    core.player.setDuration(3000)
    expect(core.player.durationMs).toBe(3000)
    core.player.seek(999_999)
    expect(core.player.positionMs).toBe(3000)
    core.player.setDuration(undefined)
    expect(core.player.durationMs).toBe(12_345)
  })
})

describe('player：频繁切歌的竞态', () => {
  it('慢的上一首解析回来时不能覆盖新曲目（不串台、不重复起播）', async () => {
    const home2 = makeTempDir('qishui-player-race-')
    try {
      const mock2 = createMockUpstream()
      // 只让 T1 的分享页慢 200ms；T2 立即返回
      const slowFetch: typeof fetch = async (input, init) => {
        const url = String(input)
        if (url.includes('www.qishui.com') && url.includes(T1)) await sleep(200)
        return mock2.fetchImpl(input, init)
      }
      const core2 = await createQishui({
        dataDir: home2,
        device: MOCK_DEVICE,
        fetchImpl: slowFetch,
        player: { tickMs: 10 },
      })
      const started: string[] = []
      core2.player.on('source', (e) => started.push(e.source.track.id))

      // 开播 T1（慢），不等它解析完就切到 T2
      const first = core2.player.playList([T1, T2])
      await sleep(20)
      expect(core2.player.current?.id).toBe(T1)
      await core2.player.next()
      await first

      expect(core2.player.current?.id).toBe(T2)
      expect(core2.player.source?.track.id).toBe(T2)
      // 只有 T2 真正起播；T1 的迟到结果被丢弃
      expect(started).toEqual([T2])
      core2.player.dispose()
      core2.dispose()
    } finally {
      rmDir(home2)
    }
  })
})

describe('player：失败路径（skipOnError）', () => {
  it('单首不可播 → error 且停在原地', async () => {
    const deadHome = makeTempDir('qishui-player-dead-')
    try {
      const dead = createMockUpstream({ playable: false })
      const core2 = await createQishui({
        dataDir: deadHome,
        device: MOCK_DEVICE,
        fetchImpl: dead.fetchImpl,
        player: { tickMs: 10 },
      })
      const errors: string[] = []
      core2.player.on('error', (e) => errors.push(e.error.message))
      await core2.player.play(T1)
      expect(core2.player.status).toBe('error')
      expect(errors.length).toBe(1)
      expect(core2.player.state.error).toContain('可播地址')
      core2.player.dispose()
      core2.dispose()
    } finally {
      rmDir(deadHome)
    }
  })

  it('两首都不可播：第一首失败后自动跳第二首，全败则停下（错误不风暴）', async () => {
    const deadHome = makeTempDir('qishui-player-dead2-')
    try {
      const dead = createMockUpstream({ playable: false })
      const core2 = await createQishui({
        dataDir: deadHome,
        device: MOCK_DEVICE,
        fetchImpl: dead.fetchImpl,
        player: { tickMs: 10 },
      })
      let errorCount = 0
      core2.player.on('error', () => errorCount++)
      await core2.player.play([T1, T2])
      expect(errorCount).toBe(2)
      expect(core2.player.status).toBe('error')
      expect(core2.player.current?.id).toBe(T2)
      core2.player.dispose()
      core2.dispose()
    } finally {
      rmDir(deadHome)
    }
  })
})
