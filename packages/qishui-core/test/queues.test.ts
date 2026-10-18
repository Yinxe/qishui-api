/**
 * 播放队列书架离线单测：临时队列整队替换、歌单队列各自记位置、推荐队列的滑动窗口与续批、
 * 「我喜欢」随机。全程 mock 上游（推荐批次直接 stub `discover.feedModeTracks`），不打网络。
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createQishui, type QishuiCore, RECOMMEND_WINDOW_MAX, type TrackData } from '../dist/index.js'
import { createMockUpstream, MOCK_DEVICE } from './support/mockUpstream.js'
import { makeTempDir, rmDir, sleep } from './support/tmp.js'

let home: string
let core: QishuiCore

// 队列只关心 id/name；`artists` 是 TrackData 的必填项，给个空数组就行
const track = (id: string): TrackData => ({ id, name: `曲目 ${id}`, artists: [] })

beforeEach(async () => {
  home = makeTempDir('qishui-queues-')
  core = await createQishui({
    dataDir: home,
    device: MOCK_DEVICE,
    fetchImpl: createMockUpstream().fetchImpl,
    // 队列测试不关心出声：关掉「出错就跳下一首」，否则假曲目解析失败会把队列推着走
    player: { tickMs: 10, skipOnError: false },
  })
})

afterEach(() => {
  core.player.dispose()
  core.dispose()
  rmDir(home)
})

/** 推荐批次的假上游：每次给 6 首，id 递增（b1..b6、b7..b12…） */
function stubFeed(batchSize = 6): { calls: () => number } {
  let call = 0
  core.discover.feedModeTracks = async () => {
    call += 1
    const base = (call - 1) * batchSize
    return Array.from({ length: batchSize }, (_, i) => ({ data: track(`b${base + i + 1}`) })) as never
  }
  return { calls: () => call }
}

const ids = (): string[] => core.player.queue.playOrder.map((t) => t.id)

describe('队列书架：临时队列', () => {
  it('每次点播整队替换上一批（搜索/榜单/专辑都走这一份）', async () => {
    await core.queues.open({ kind: 'temporary', title: '搜索结果', items: [track('a'), track('b'), track('c')] })
    expect(ids()).toEqual(['a', 'b', 'c'])
    await core.queues.open({ kind: 'temporary', title: '榜单', items: [track('d'), track('e')] })
    expect(ids()).toEqual(['d', 'e'])
    // 只有一份临时队列（id 固定），不会越点越多
    expect(core.queues.list().filter((q) => q.kind === 'temporary')).toHaveLength(1)
    expect(core.queues.active?.title).toBe('榜单')
  })

  it('顺序播、不随机；从指定的那首开始', async () => {
    await core.queues.open({
      kind: 'temporary',
      title: '专辑',
      items: [track('a'), track('b'), track('c')],
      startTrackId: 'b',
    })
    expect(core.player.queue.shuffled).toBe(false)
    expect(core.player.queue.current?.id).toBe('b')
    expect(core.player.queue.index).toBe(1)
  })
})

describe('队列书架：歌单与我喜欢', () => {
  it('每张歌单是一份队列，切走再切回来接着上次那一首', async () => {
    await core.queues.open({
      kind: 'playlist',
      id: 'playlist:p1',
      title: '歌单一',
      load: async () => [track('a'), track('b'), track('c')],
    })
    await core.player.next()
    expect(core.player.queue.current?.id).toBe('b')
    // 切去临时队列听点别的
    await core.queues.open({ kind: 'temporary', title: '搜索', items: [track('x')] })
    expect(core.player.queue.current?.id).toBe('x')
    expect(
      core.queues
        .list()
        .map((q) => q.id)
        .sort(),
    ).toEqual(['playlist:p1', 'temporary'])
    // 切回来：还是 b，没重新取数
    await core.queues.activate('playlist:p1')
    expect(core.player.queue.current?.id).toBe('b')
    expect(core.queues.active?.id).toBe('playlist:p1')
  })

  it('重新打开「正在听的那张歌单」：接着当前这首，不拿上次停放时的老快照跳回第一首', async () => {
    const load = async () => ['a', 'b', 'c', 'd'].map(track)
    await core.queues.open({ kind: 'playlist', id: 'playlist:p1', title: '歌单一', load })
    await core.player.playIndex(2)
    expect(core.player.queue.current?.id).toBe('c')
    // 再 open 一次同一张（不给起点）：书架先把在播位置记回来，再恢复 —— 还在 c
    await core.queues.open({ kind: 'playlist', id: 'playlist:p1', title: '歌单一', load })
    expect(core.player.queue.current?.id).toBe('c')
  })

  it('「我喜欢的音乐」= 随机（曲目一首不少，顺序被打乱）', async () => {
    await core.queues.open({
      kind: 'liked',
      id: 'liked',
      title: '我喜欢的音乐',
      load: async () => ['a', 'b', 'c', 'd', 'e', 'f'].map(track),
    })
    expect(core.player.queue.shuffled).toBe(true)
    expect(ids().sort()).toEqual(['a', 'b', 'c', 'd', 'e', 'f'])
    // 当前这首留在队首（随机只打乱后面）
    expect(core.player.queue.index).toBe(0)
  })
})

describe('队列书架：推荐队列（滑动窗口 + 续批）', () => {
  it('顺序播、不随机；每前进一首踢掉「上上个」；剩 ≤2 首补一批且窗口 ≤8', async () => {
    const feed = stubFeed(6)
    await core.queues.open({
      kind: 'recommend',
      title: '推荐 · 默认',
      feed: { kind: 'preference', mode: 'default' },
      refresh: true,
    })
    expect(core.player.queue.shuffled).toBe(false)
    expect(ids()).toHaveLength(6)
    expect(feed.calls()).toBe(1)

    const played: string[] = []
    for (let i = 0; i < 12; i++) {
      const before = core.player.queue.index
      const current = core.player.queue.current?.id
      if (current) played.push(current)
      await core.player.next()
      await sleep(20) // 续批是异步的（fire-and-forget）
      const queue = core.player.queue
      // 窗口永远 ≤8，且当前这首前面最多留 1 首（上上个已经被踢掉）
      expect(queue.length).toBeLessThanOrEqual(RECOMMEND_WINDOW_MAX)
      expect(queue.index).toBeLessThanOrEqual(1)
      if (before >= 0) expect(queue.current?.id).not.toBe(undefined)
    }
    // 连听 12 首没断流：补过好几批
    expect(feed.calls()).toBeGreaterThan(1)
    expect(new Set(played).size).toBeGreaterThanOrEqual(12)
  })

  it('只有「在播的那份」推荐队列才标「自动续批」（停放着补不了）', async () => {
    stubFeed(6)
    await core.queues.open({
      kind: 'recommend',
      title: '推荐',
      feed: { kind: 'preference', mode: 'default' },
      refresh: true,
    })
    expect(core.queues.info('recommend')?.refilling).toBe(true)
    await core.queues.open({ kind: 'temporary', title: '搜索', items: [track('x')] })
    expect(core.queues.info('recommend')?.refilling).toBe(false)
    await core.queues.activate('recommend')
    expect(core.queues.info('recommend')?.refilling).toBe(true)
  })

  it('切走再切回推荐队列：不重新取批，接着上次那一首', async () => {
    const feed = stubFeed(6)
    await core.queues.open({
      kind: 'recommend',
      title: '推荐',
      feed: { kind: 'preference', mode: 'fresh' },
      refresh: true,
    })
    await core.player.next()
    const current = core.player.queue.current?.id
    const callsBefore = feed.calls()
    await core.queues.open({ kind: 'temporary', title: '搜索', items: [track('x')] })
    await core.queues.activate('recommend')
    expect(core.player.queue.current?.id).toBe(current)
    expect(feed.calls()).toBe(callsBefore)
  })

  it('连续两批取不到就停掉自动续播（队列里已有的照样播完）', async () => {
    let call = 0
    core.discover.feedModeTracks = async () => {
      call += 1
      if (call === 1) return Array.from({ length: 6 }, (_, i) => ({ data: track(`b${i + 1}`) })) as never
      throw new Error('上游 500')
    }
    const notes: string[] = []
    core.events.on('queue-note', ({ message }) => notes.push(message))
    await core.queues.open({
      kind: 'recommend',
      title: '推荐',
      feed: { kind: 'preference', mode: 'default' },
      refresh: true,
    })
    expect(core.player.queue.length).toBe(6)
    // 一路听到只剩 1 首：连着两次补批都失败
    for (let i = 0; i < 5; i++) {
      await core.player.next()
      await sleep(20)
    }
    expect(notes.some((line) => line.includes('这一批没取到'))).toBe(true)
    expect(notes.some((line) => line.includes('已停止自动续播'))).toBe(true)
    expect(core.queues.info('recommend')?.refilling).toBe(false)
  })
})

describe('队列书架：切号', () => {
  it('清空书架（换号 = 换一份我的喜欢/我的歌单）', async () => {
    await core.queues.open({ kind: 'temporary', title: '搜索', items: [track('a')] })
    expect(core.queues.list()).toHaveLength(1)
    core.queues.reset()
    expect(core.queues.list()).toHaveLength(0)
    expect(core.queues.activeQueueId).toBe(undefined)
  })
})

describe('队列书架：默认循环模式', () => {
  it('推荐队列固定「关」：配置里默认循环是单曲也不开（否则续批被冻住）', async () => {
    core.config.defaultRepeat = 'one'
    stubFeed()
    await core.queues.open({
      kind: 'recommend',
      title: '推荐 · 默认',
      feed: { kind: 'preference', mode: 'default' },
      refresh: true,
    })
    expect(core.player.state.repeat).toBe('off')
    // 队列本身照常取到并起播
    expect(core.player.queue.length).toBeGreaterThan(0)
  })

  it('推荐队列上手动开过单曲循环，切走再切回来又回到「关」', async () => {
    stubFeed()
    await core.queues.open({
      kind: 'recommend',
      title: '推荐',
      feed: { kind: 'preference', mode: 'default' },
      refresh: true,
    })
    core.player.setRepeat('one')
    expect(core.player.state.repeat).toBe('one')
    await core.queues.open({ kind: 'temporary', title: '搜索', items: [track('x')] })
    await core.queues.activate('recommend')
    expect(core.player.state.repeat).toBe('off')
  })

  it('其它队列认「默认循环模式」这个设置（歌单 / 我喜欢 / 临时）', async () => {
    core.config.defaultRepeat = 'all'
    await core.queues.open({ kind: 'temporary', title: '榜单', items: [track('a'), track('b')] })
    expect(core.player.state.repeat).toBe('all')
  })
})
