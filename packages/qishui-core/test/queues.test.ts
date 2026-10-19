/**
 * 播放队列书架离线单测：临时队列整队替换、歌单队列各自记位置、推荐队列只往后追加与续批、
 * 「我喜欢」随机。全程 mock 上游（推荐批次直接 stub `discover.feedModeTracks`），不打网络。
 */
import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createQishui, MAX_QUEUES, type QishuiCore, recommendQueueId, type TrackData } from '../dist/index.js'
import { createMockUpstream, MOCK_DEVICE } from './support/mockUpstream.js'
import { makeTempDir, rmDir, sleep } from './support/tmp.js'

let home: string
let core: QishuiCore

// 队列只关心 id/name；`artists` 是 TrackData 的必填项，给个空数组就行
const track = (id: string): TrackData => ({ id, name: `曲目 ${id}`, artists: [] })

/** 推荐队列的 id 按听歌模式分份：测试里要按 id 查/切，就用 core 的同一个算式 */
const recId = (mode = 'default'): string => recommendQueueId({ kind: 'preference', mode })

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

describe('队列书架：连点切换（两次切换撞在一起）', () => {
  /** 一张「取数要等人放行」的歌单：模拟上游慢，好把两次切换逼成交错 */
  function slowPlaylist(
    id: string,
    title: string,
  ): { open: Promise<unknown>; release: () => void; loads: () => number } {
    let release: () => void = () => {}
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    let loads = 0
    const open = core.queues.open({
      kind: 'playlist',
      id,
      title,
      load: async () => {
        loads += 1
        await gate
        return [track('a'), track('b')]
      },
    })
    return { open, release, loads: () => loads }
  }

  const fastPlaylist = (id = 'playlist:fast', title = '快的那张') =>
    core.queues.open({ kind: 'playlist', id, title, load: async () => [track('x'), track('y')] })

  it('第一份的取数已经在路上：后点的这份最后装在播放器里，慢回来的那份不许再盖上去', async () => {
    const slow = slowPlaylist('playlist:slow', '慢的那张')
    await sleep(0) // 让第一格真的跑到 `load` 里（不是还没起步就被顶掉）
    const fast = fastPlaylist()
    slow.release()
    await Promise.all([slow.open, fast])

    expect(core.queues.active?.id).toBe('playlist:fast')
    expect(ids()).toEqual(['x', 'y'])
    // 交错跑时慢回来的那份会把自己最后 `playList` 进去：现象就是「响的是慢那张的第一首」
    expect(slow.loads()).toBe(1)
    // 慢那张也没丢：用户确实点过它，书架上留着这一行，等真点开时再认
    expect(core.queues.info('playlist:slow')?.title).toBe('慢的那张')
  })

  it('两次切换在同一拍点下去：被顶掉的那份一趟上游都不去取（还没起步就不必敲门）', async () => {
    const slow = slowPlaylist('playlist:slow', '慢的那张')
    const fast = fastPlaylist()
    slow.release()
    await Promise.all([slow.open, fast])

    expect(slow.loads()).toBe(0)
    expect(core.queues.active?.id).toBe('playlist:fast')
    expect(ids()).toEqual(['x', 'y'])
    expect(core.queues.info('playlist:slow')?.title).toBe('慢的那张')
  })

  it('前一份还在往播放器里装时后一份才起步：两次 `playList` 不交错（交错会把 liveId 记到错的份上）', async () => {
    await core.queues.open({
      kind: 'playlist',
      id: 'playlist:p1',
      title: '甲',
      load: async () => ['a', 'b', 'c'].map(track),
    })
    await core.queues.open({
      kind: 'playlist',
      id: 'playlist:p2',
      title: '乙',
      load: async () => ['x', 'y', 'z'].map(track),
    })

    let release: () => void = () => {}
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    const real = core.player.playList.bind(core.player)
    const log: string[] = []
    core.player.playList = async (tracks, startTrackId, opts) => {
      const head = tracks[0] as unknown as { id?: string; data?: { id?: string } }
      log.push(`进:${head.id ?? head.data?.id}`)
      await gate
      await real(tracks, startTrackId, opts)
      log.push(`出:${head.id ?? head.data?.id}`)
    }

    const first = core.queues.activate('playlist:p1')
    await sleep(0) // 让第一次切换真的进到 `playList` 里卡住
    const second = core.queues.activate('playlist:p2')
    release()
    await Promise.all([first, second])

    expect(log).toEqual(['进:a', '出:a', '进:x', '出:x'])
    expect(core.queues.active?.id).toBe('playlist:p2')
    expect(ids()).toEqual(['x', 'y', 'z'])
  })
})

describe('队列书架：推荐队列（只往后追加 + 续批）', () => {
  it('顺序播、不随机；听过的不删、每首的序号不变；剩 ≤2 首补一整批（一批 6 首全收，不截断）', async () => {
    const feed = stubFeed(6)
    const refilled: number[] = []
    core.events.on('queue-note', ({ message }) => {
      const match = /又补了一批 (\d+) 首/.exec(message)
      if (match) refilled.push(Number(match[1]))
    })
    await core.queues.open({
      kind: 'recommend',
      title: '推荐 · 默认',
      feed: { kind: 'preference', mode: 'default' },
      refresh: true,
    })
    expect(core.player.queue.shuffled).toBe(false)
    expect(ids()).toHaveLength(6)
    expect(feed.calls()).toBe(1)

    // 一路往前播 12 首：播放头就是「第 n 首」，第 n 首永远是当初那首 b(n) —— 一首没被踢掉
    for (let i = 0; i < 12; i++) {
      await core.player.next()
      await sleep(20) // 续批是异步的（fire-and-forget）
      const queue = core.player.queue
      expect(queue.index).toBe(i + 1)
      expect(queue.current?.id).toBe(`b${i + 2}`)
    }
    // 队头还是第一批那一首（听过的不删，界面往上滚还能看到它）
    expect(ids()[0]).toBe('b1')
    // 连听 12 首没断流：补过好几批，而且每一批都整批收下（会被截断的话这里就出现 <6 的批次）
    expect(feed.calls()).toBeGreaterThan(1)
    expect(refilled.length).toBeGreaterThan(0)
    expect(refilled.every((n) => n === 6)).toBe(true)
    // 上游给过的每一首都还在队列里，一首没丢、也没重复
    expect(ids()).toHaveLength(feed.calls() * 6)
    expect(new Set(ids()).size).toBe(ids().length)
  })

  it('跳到队列里任一首都只动播放头：已经排好的那些一首不挪、号也不变（补批只挂队尾）', async () => {
    stubFeed(6)
    await core.queues.open({
      kind: 'recommend',
      title: '推荐 · 默认',
      feed: { kind: 'preference', mode: 'default' },
      refresh: true,
    })
    const first = ids()
    // 跳到中间：剩 ≤2 首 → 补第二批，多出来的那些只挂在队尾
    await core.player.playIndex(4)
    await sleep(20)
    const after = ids()
    expect(after.length).toBeGreaterThan(first.length)
    expect(after.slice(0, first.length)).toEqual(first)
    // 点尾巴那一行：该播这一首，前面那些还是原样（界面里的行号不会从指头下挪走）
    await core.player.playIndex(after.length - 1)
    await sleep(20)
    expect(core.player.queue.current?.id).toBe(after[after.length - 1])
    expect(ids().slice(0, after.length)).toEqual(after)
  })

  it('队尾主动要下一批（`loadMore`）：不等「剩 ≤2 首」那个阈值，补回来的一批挂队尾、播放头不动', async () => {
    const feed = stubFeed(6)
    await core.queues.open({
      kind: 'recommend',
      title: '推荐 · 默认',
      feed: { kind: 'preference', mode: 'default' },
      refresh: true,
    })
    expect(feed.calls()).toBe(1) // 第一批是打开队列时取的，此刻还剩 5 首（远没到阈值）
    expect(await core.queues.loadMore()).toBe(6)
    expect(feed.calls()).toBe(2)
    expect(ids()).toHaveLength(12)
    expect(ids().slice(0, 6)).toEqual(['b1', 'b2', 'b3', 'b4', 'b5', 'b6'])
    expect(core.player.queue.current?.id).toBe('b1')
  })

  it('下一批还在路上时再要一次拿不到（0 首）：不会连着插两队', async () => {
    let call = 0
    let release: ((value: unknown) => void) | undefined
    core.discover.feedModeTracks = (async () => {
      call += 1
      if (call === 1) return Array.from({ length: 6 }, (_, i) => ({ data: track(`b${i + 1}`) })) as never
      return new Promise((resolve) => {
        release = resolve
      }) as never
    }) as never
    await core.queues.open({
      kind: 'recommend',
      title: '推荐 · 默认',
      feed: { kind: 'preference', mode: 'default' },
      refresh: true,
    })
    const pending = core.queues.loadMore()
    expect(await core.queues.loadMore()).toBe(0) // 互斥：这一会就当我没按
    release?.(Array.from({ length: 6 }, (_, i) => ({ data: track(`c${i + 1}`) })))
    expect(await pending).toBe(6)
    expect(call).toBe(2)
    expect(ids()).toHaveLength(12)
  })

  it('`loadMore` 只认在播的推荐队列：歌单 / 临时队列返回 0，不发请求', async () => {
    const feed = stubFeed(6)
    await core.queues.open({
      kind: 'playlist',
      id: 'playlist:p1',
      title: '歌单一',
      load: async () => ['a', 'b', 'c'].map(track),
    })
    expect(await core.queues.loadMore()).toBe(0)
    await core.queues.open({ kind: 'temporary', title: '搜索', items: [track('x')] })
    expect(await core.queues.loadMore()).toBe(0)
    expect(feed.calls()).toBe(0)
    expect(ids()).toEqual(['x'])
  })

  it('见底续批的「接着播」不抢在用户刚点的那首之后', async () => {
    let call = 0
    let release: ((value: unknown) => void) | undefined
    core.discover.feedModeTracks = (async () => {
      call += 1
      if (call === 1) return Array.from({ length: 6 }, (_, i) => ({ data: track(`b${i + 1}`) })) as never
      if (call === 2) return [] as never // 第一次续批空手而归（队列就此见底）
      return new Promise((resolve) => {
        release = resolve
      }) as never // 第三批慢回来（模拟「见底后补批」还在路上）
    }) as never
    await core.queues.open({
      kind: 'recommend',
      title: '推荐 · 默认',
      feed: { kind: 'preference', mode: 'default' },
      refresh: true,
    })
    await core.player.playIndex(5) // 播到队尾
    await sleep(20) // 那一轮续批先失败
    core.queues.onPlayerEnded('stop') // 曲终、队列见底 → 书架去补下一批（在途）
    await sleep(0)
    await core.player.playIndex(2) // 用户在补批回来之前点了队列里的一首
    release?.(Array.from({ length: 6 }, (_, i) => ({ data: track(`c${i + 1}`) })))
    await sleep(20)
    expect(core.player.queue.current?.id).toBe('b3') // 还停在用户点的那首
    expect(ids()).toContain('c1') // 补回来的一照样接在队尾
  })

  it('只有「在播的那份」推荐队列才标「自动续批」（停放着补不了）', async () => {
    stubFeed(6)
    await core.queues.open({
      kind: 'recommend',
      title: '推荐',
      feed: { kind: 'preference', mode: 'default' },
      refresh: true,
    })
    expect(core.queues.info(recId())?.refilling).toBe(true)
    await core.queues.open({ kind: 'temporary', title: '搜索', items: [track('x')] })
    expect(core.queues.info(recId())?.refilling).toBe(false)
    await core.queues.activate(recId())
    expect(core.queues.info(recId())?.refilling).toBe(true)
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
    await core.queues.activate(recId('fresh'))
    expect(core.player.queue.current?.id).toBe(current)
    expect(feed.calls()).toBe(callsBefore)
  })

  it('「再来一批」是整台重来：先重置播放器（停掉在播那首），新一批只装这批、从第一首起播', async () => {
    let call = 0
    core.discover.feedModeTracks = async () => {
      call += 1
      const prefix = call === 1 ? 'b' : 'c'
      return Array.from({ length: 6 }, (_, i) => ({ data: track(`${prefix}${i + 1}`) })) as never
    }
    await core.queues.open({
      kind: 'recommend',
      title: '推荐',
      feed: { kind: 'preference', mode: 'default' },
      refresh: true,
    })
    await core.player.playIndex(2) // 在播 b3（还剩 3 首，没到续批阈值）
    const statuses: string[] = []
    core.player.on('status', ({ status }) => statuses.push(status))

    await core.queues.open({
      kind: 'recommend',
      title: '推荐',
      feed: { kind: 'preference', mode: 'default' },
      refresh: true,
    })
    // 播放列表整个换掉：老的 b 批一首不留
    expect(ids()).toEqual(['c1', 'c2', 'c3', 'c4', 'c5', 'c6'])
    expect(core.player.queue.index).toBe(0)
    expect(core.player.current?.id).toBe('c1')
    // 换批前先 `idle` 一次 —— 上层（TUI/CLI）据此把还在响的外置播放器停掉，才不会带着上一首的尾巴连着跳
    expect(statuses.indexOf('idle')).toBeGreaterThanOrEqual(0)
    expect(statuses[statuses.length - 1]).toBe('playing')
  })

  it('「再来一批」期间那次防抖落盘不会把旧批次的位置带进新一批：新一批从第一首开始', async () => {
    // 慢半拍的一批（比 300ms 的落盘防抖还慢），而且**把正在播的那首又推一次** —— 推荐本来就会重复推
    let call = 0
    core.discover.feedModeTracks = (async () => {
      call += 1
      if (call === 1) return Array.from({ length: 6 }, (_, i) => ({ data: track(`b${i + 1}`) })) as never
      await sleep(400)
      return Array.from({ length: 6 }, (_, i) => ({ data: track(i === 2 ? 'b3' : `c${i + 1}`) })) as never
    }) as never
    await core.queues.open({
      kind: 'recommend',
      title: '推荐',
      feed: { kind: 'preference', mode: 'default' },
      refresh: true,
    })
    await core.player.playIndex(2) // 停在 b3，顺带排上一次还没跑的落盘定时器
    const refreshed = core.queues.open({
      kind: 'recommend',
      title: '推荐',
      feed: { kind: 'preference', mode: 'default' },
      refresh: true,
    })
    await sleep(500) // 取批还在 await 里，那次防抖写正好插在中间
    await refreshed
    // 新一批整队替换、从第一首开始：旧批次「停在 b3」不能变成新批次的「从第 3 首开始」
    expect(ids()).toEqual(['c1', 'c2', 'b3', 'c4', 'c5', 'c6'])
    expect(core.player.queue.index).toBe(0)
    expect(core.player.queue.current?.id).toBe('c1')
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
    expect(core.queues.info(recId())?.refilling).toBe(false)
  })
})

describe('队列书架：每档听歌模式各一份推荐队列', () => {
  const sceneId = (id = 30): string => recommendQueueId({ kind: 'scene', sceneModeId: id })

  /** 每档给不同前缀的批次，能一眼看出「切回来的是不是原来那一批」 */
  function stubFeedByMode(): { calls: () => number } {
    let call = 0
    core.discover.feedModeTracks = (async (ref: { kind: string; mode?: string; sceneModeId?: number }) => {
      call += 1
      const tag = ref.kind === 'scene' ? `s${ref.sceneModeId}` : `p${ref.mode}`
      return Array.from({ length: 6 }, (_, i) => ({ data: track(`${tag}-${i + 1}`) })) as never
    }) as never
    return { calls: () => call }
  }

  it('换一档再换回来：两档各记自己的批次与位置，互不清空', async () => {
    const feed = stubFeedByMode()
    const pref = { kind: 'preference', mode: 'default' } as const
    await core.queues.open({ kind: 'recommend', title: '推荐 · 默认', feed: pref })
    await core.player.next()
    const firstCurrent = core.player.queue.current?.id
    const callsAfterFirst = feed.calls()

    await core.queues.open({ kind: 'recommend', title: '推荐 · 场景 30', feed: { kind: 'scene', sceneModeId: 30 } })
    expect(feed.calls()).toBe(callsAfterFirst + 1)
    expect(core.player.queue.current?.id).not.toBe(firstCurrent)
    expect(core.queues.list().filter((item) => item.kind === 'recommend')).toHaveLength(2)

    // 切回默认档：不重新取批，回到上次那一首
    await core.queues.activate(recommendQueueId(pref))
    expect(feed.calls()).toBe(callsAfterFirst + 1)
    expect(core.player.queue.current?.id).toBe(firstCurrent)
    // 场景档那一条还在书架里（各自记位置）
    expect(core.queues.info(sceneId())?.count).toBeGreaterThan(0)
  })

  it('每档都有自己的一条流：切到别的档不影响这一档的续批', async () => {
    stubFeedByMode()
    const pref = { kind: 'preference', mode: 'default' } as const
    await core.queues.open({ kind: 'recommend', title: '推荐 · 默认', feed: pref })
    await core.queues.open({ kind: 'recommend', title: '推荐 · 场景 30', feed: { kind: 'scene', sceneModeId: 30 } })
    // 切回默认档：两档各自还标着「自动续批」（档位是每条队列自己的，不共享一个总开关）
    await core.queues.activate(recommendQueueId(pref))
    expect(core.queues.info(recommendQueueId(pref))?.refilling).toBe(true)
    expect(core.queues.info(sceneId())?.refilling).toBe(false)
    await core.queues.activate(sceneId())
    expect(core.queues.info(sceneId())?.refilling).toBe(true)
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

  it('退登也作废书架：退到匿名后不该把「我的」那批留给下一个号', async () => {
    await core.queues.open({ kind: 'liked', title: '我喜欢的音乐', load: async () => [track('a')] })
    core.queues.flush()
    expect(core.queues.list()).toHaveLength(1)
    await core.logout()
    expect(core.queues.list()).toHaveLength(0)
    // 只清内存不够：`qishui logout` 这种跑完就退的进程，要的是盘上那一次也作废
    expect(readFileSync(core.paths.queuesFile, 'utf8')).not.toContain('"id":"a"')
  })
})

describe('队列书架：上限（自动维护不超过 10 份）', () => {
  const openPlaylist = (id: string) =>
    core.queues.open({ kind: 'playlist', id: `playlist:${id}`, title: `歌单 ${id}`, load: async () => [track(id)] })

  it(`超过 ${MAX_QUEUES} 份就收起最久没用过的；在播的那份永不淘汰`, async () => {
    for (let i = 1; i <= MAX_QUEUES; i++) await openPlaylist(`p${i}`)
    expect(core.queues.list()).toHaveLength(MAX_QUEUES)

    // 再开两份：最早的两份（p1、p2）被收起
    await openPlaylist('p11')
    await openPlaylist('p12')
    const ids = core.queues.list().map((q) => q.id)
    expect(ids).toHaveLength(MAX_QUEUES)
    expect(ids).not.toContain('playlist:p1')
    expect(ids).not.toContain('playlist:p2')
    expect(ids).toContain('playlist:p12')
    // 在播的那份永远在书架上（不然队列就断了）
    expect(core.queues.active?.id).toBe('playlist:p12')

    // 切回 p3（刚用过）再开新的：这回该收起 p4，而不是刚用过的 p3
    await core.queues.activate('playlist:p3')
    await openPlaylist('p13')
    const after = core.queues.list().map((q) => q.id)
    expect(after).toHaveLength(MAX_QUEUES)
    expect(after).toContain('playlist:p3')
    expect(after).not.toContain('playlist:p4')
  })

  it('收起最久没用的那份时会说一句（queue-note），不是静默丢', async () => {
    const notes: string[] = []
    core.events.on('queue-note', ({ message }) => notes.push(message))
    for (let i = 1; i <= MAX_QUEUES + 1; i++) await openPlaylist(`p${i}`)
    expect(notes.some((line) => line.includes('书架最多留'))).toBe(true)
  })
})

describe('队列书架：持久化（重启还看得见）', () => {
  /** 同一个数据目录再起一次（= 重启）：书架应当从 `queues.json` 读回来 */
  const reopen = () =>
    createQishui({
      dataDir: home,
      device: MOCK_DEVICE,
      fetchImpl: createMockUpstream().fetchImpl,
      player: { tickMs: 10, skipOnError: false },
    })

  it('书架每次变化就落盘（不等退出）', async () => {
    await core.queues.open({ kind: 'temporary', title: '搜索', items: [track('a'), track('b')] })
    await sleep(350) // 防抖 300ms
    const fresh = await reopen()
    try {
      expect(fresh.queues.list().map((q) => q.id)).toEqual(['temporary'])
    } finally {
      fresh.dispose()
    }
  })

  it('重启后各份队列还记着上次听到哪一首，切过去接着听', async () => {
    stubFeed(6)
    await core.queues.open({
      kind: 'recommend',
      title: '推荐 · 默认',
      feed: { kind: 'preference', mode: 'default' },
      refresh: true,
    })
    await core.player.next()
    const recCurrent = core.player.queue.current?.id
    await core.queues.open({
      kind: 'playlist',
      id: 'playlist:p1',
      title: '歌单一',
      load: async () => ['a', 'b', 'c'].map(track),
    })
    await core.player.next() // 歌单听到第 2 首
    core.dispose() // flush 收尾

    const fresh = await reopen()
    try {
      // 播放器是空的：不假装「在播」，但书架与每份的位置都在
      expect(fresh.queues.activeQueueId).toBe(undefined)
      expect(fresh.queues.info('playlist:p1')?.count).toBe(3)
      expect(fresh.queues.info('playlist:p1')?.current).toBe('曲目 b')
      // 顺序队列那两个下标空间是同一个：`第 2 首` 与曲名指的是同一首
      expect(fresh.queues.info('playlist:p1')?.index).toBe(1)
      await fresh.queues.activate('playlist:p1')
      expect(fresh.player.queue.current?.id).toBe('b')
      // 推荐那档：曲目和听歌模式都在盘上 → 切回来接着上次那一首，且不重新取批
      fresh.discover.feedModeTracks = async () => {
        throw new Error('不该重新取批')
      }
      await fresh.queues.activate(recId())
      expect(fresh.player.queue.current?.id).toBe(recCurrent)
    } finally {
      fresh.dispose()
    }
  })

  it('停放着的随机队列：那一行说的是「上次听到的那首」，不是拿播放顺序下标去点加入顺序', async () => {
    // 随机顺序由 `Math.random` 排：钉住它，保证这两个下标空间确实错位
    // （不钉的话，本条偶尔摊上一个恒等排列，断言就成了白跑）
    const random = vi.spyOn(Math, 'random').mockReturnValue(0)
    try {
      await core.queues.open({
        kind: 'liked',
        id: 'liked',
        title: '我喜欢的音乐',
        load: async () => ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(track),
      })
      const queue = core.player.queue
      expect(queue.shuffled).toBe(true)
      await core.player.next()
      expect(queue.current?.id).not.toBe(queue.list[queue.index]?.id)
      const heard = queue.current?.name
      // 切去别的队列，把「我喜欢」停放下来
      await core.queues.open({ kind: 'temporary', title: '搜索', items: [track('x')] })
      const parked = core.queues.info('liked')
      expect(parked?.current).toBe(heard)
      // 随机那份索性不报「第 k 首」：那个数属于上一次的重排，切回来还要再排一次
      expect(parked?.index).toBe(-1)
    } finally {
      random.mockRestore()
    }
  })

  it('曲目快照不带上游原始响应（`raw` 只增体积）', async () => {
    await core.queues.open({
      kind: 'temporary',
      title: '搜索',
      items: [{ ...track('a'), raw: { 上游: '几十 KB 的原始响应' } }],
    })
    core.dispose()
    const file = readFileSync(core.paths.queuesFile, 'utf8')
    expect(file).not.toContain('原始响应')
    expect(file).toContain('"id":"a"')
  })

  it('换号清空后那一次也写回盘：下一个实例看不到上个号的书架', async () => {
    await core.queues.open({ kind: 'temporary', title: '搜索', items: [track('a')] })
    core.queues.reset()
    core.dispose()
    const fresh = await reopen()
    try {
      expect(fresh.queues.list()).toHaveLength(0)
    } finally {
      fresh.dispose()
    }
  })

  it('重启后点一首快照里没有的歌：播的就是这首，不是第一首', async () => {
    await core.queues.open({
      kind: 'playlist',
      id: 'playlist:p9',
      title: '老歌单',
      load: async () => ['a', 'b'].map(track),
    })
    core.dispose() // flush 把只有 a/b 的快照写回盘

    const fresh = await reopen()
    try {
      // 重启后 entry.load 是 undefined、`loaded` 却因为「曲目都在盘上」置了真；
      // 从歌单页重新点播会带回新的 `load`（这次多了 c）和 startTrackId
      await fresh.queues.open({
        kind: 'playlist',
        id: 'playlist:p9',
        title: '老歌单',
        load: async () => ['a', 'b', 'c'].map(track),
        startTrackId: 'c',
      })
      expect(fresh.player.queue.current?.id).toBe('c')
      expect(fresh.player.queue.list.map((t) => t.id)).toEqual(['a', 'b', 'c'])
    } finally {
      fresh.dispose()
    }
  })

  it('快照里确实没这首、又没带新的 load：说一句「已从第一首开始」，不静默换歌', async () => {
    await core.queues.open({
      kind: 'playlist',
      id: 'playlist:p8',
      title: '老歌单',
      load: async () => ['a', 'b'].map(track),
    })
    core.dispose()

    const fresh = await reopen()
    try {
      const notes: string[] = []
      fresh.events.on('queue-note', ({ message }) => notes.push(message))
      await fresh.queues.open({ kind: 'playlist', id: 'playlist:p8', title: '老歌单', startTrackId: 'zzz' })
      expect(fresh.player.queue.current?.id).toBe('a')
      expect(notes.join(' ')).toContain('已从第一首开始')
    } finally {
      fresh.dispose()
    }
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
    await core.queues.activate(recId())
    expect(core.player.state.repeat).toBe('off')
  })

  it('其它队列认「默认循环模式」这个设置（歌单 / 我喜欢 / 临时）', async () => {
    core.config.defaultRepeat = 'all'
    await core.queues.open({ kind: 'temporary', title: '榜单', items: [track('a'), track('b')] })
    expect(core.player.state.repeat).toBe('all')
  })
})
