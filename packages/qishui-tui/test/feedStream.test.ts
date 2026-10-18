/**
 * `FeedStream` 离线单测：只验流的状态机 —— 什么时候取批、取到怎么落队列、
 * 并发怎么挡、在途批次怎么被换模式/停流作废、失败止损到停。
 * 全部注入假 deps，不起播放器、不打上游。
 */

import type { FeedModeRef, TrackData } from 'qishui-core'
import { beforeEach, describe, expect, it } from 'vitest'
import { FEED_MAX_FAILURES, FEED_REFILL_AT, FeedStream } from '../dist/feedStream.js'

const PREF: FeedModeRef = { kind: 'preference', mode: 'familiar' }
const SCENE: FeedModeRef = { kind: 'scene', sceneModeId: 48 }

const batch = (n: number, prefix = 't'): TrackData[] =>
  Array.from({ length: n }, (_, i) => ({ id: `${prefix}${i}`, name: `${prefix}${i}` }) as unknown as TrackData)

interface Spy {
  fetched: FeedModeRef[]
  replaced: TrackData[][]
  appended: TrackData[][]
  notes: [string, string | undefined][]
  /** 每次 fetch 返回一个可控的 promise */
  deferred: { resolve?: (v: TrackData[]) => void; reject?: (e: unknown) => void }[]
}

function makeDeps(handler?: (index: number) => Promise<TrackData[]>) {
  const spy: Spy = { fetched: [], replaced: [], appended: [], notes: [], deferred: [] }
  const deps = {
    fetch: (ref: FeedModeRef) => {
      spy.fetched.push(ref)
      const index = spy.fetched.length - 1
      if (handler) return handler(index)
      return new Promise<TrackData[]>((resolve, reject) => {
        spy.deferred[index] = { resolve, reject }
      })
    },
    replace: (items: TrackData[]) => spy.replaced.push(items),
    append: (items: TrackData[]) => spy.appended.push(items),
    note: (message: string, kind?: 'info' | 'error') => spy.notes.push([message, kind]),
  }
  return { deps, spy }
}

/** 让 handler 立刻给一批，避免手挑 promise */
const ready = (items: TrackData[]) => () => Promise.resolve(items)

const flush = () => new Promise((r) => setImmediate(r))

describe('FeedStream', () => {
  beforeEach(() => {
    // 每条用例自己造 deps
  })

  it('start：按这个模式取一批、整队替换起播', async () => {
    const { deps, spy } = makeDeps(ready(batch(6, 'a')))
    const stream = new FeedStream(deps)
    await stream.start(PREF)
    expect(spy.fetched).toEqual([PREF])
    expect(spy.replaced).toHaveLength(1)
    expect(spy.replaced[0]).toHaveLength(6)
    expect(spy.appended).toHaveLength(0)
    expect(stream.active).toBe(true)
  })

  it('换模式：记的是新那个，后续补批也按新取数', async () => {
    const { deps, spy } = makeDeps(ready(batch(6)))
    const stream = new FeedStream(deps)
    await stream.start(PREF)
    await stream.start(SCENE)
    expect(spy.fetched).toEqual([PREF, SCENE])
    stream.onRemaining(1)
    await flush()
    expect(spy.fetched[2]).toEqual(SCENE)
  })

  it('剩到阈值才补；补的是队尾，不打断当前', async () => {
    const { deps, spy } = makeDeps(ready(batch(6)))
    const stream = new FeedStream(deps)
    await stream.start(PREF)
    stream.onRemaining(FEED_REFILL_AT + 1)
    await flush()
    expect(spy.fetched).toHaveLength(1)
    stream.onRemaining(FEED_REFILL_AT)
    await flush()
    expect(spy.fetched).toHaveLength(2)
    expect(spy.appended).toHaveLength(1)
    expect(spy.replaced).toHaveLength(1)
  })

  it('队列已经空了（剩 0）：整队换一批重新起播，而不是接到空队尾', async () => {
    const { deps, spy } = makeDeps(ready(batch(6)))
    const stream = new FeedStream(deps)
    await stream.start(PREF)
    spy.replaced.length = 0
    stream.onRemaining(0)
    await flush()
    expect(spy.appended).toHaveLength(0)
    expect(spy.replaced).toHaveLength(1)
  })

  it('一批还在途时不并发取第二批', async () => {
    const { deps, spy } = makeDeps()
    const stream = new FeedStream(deps)
    const started = stream.start(PREF)
    stream.onRemaining(0)
    stream.onRemaining(0)
    await flush()
    expect(spy.fetched).toHaveLength(1)
    spy.deferred[0].resolve?.(batch(6))
    await started
    expect(stream.active).toBe(true)
  })

  it('停流后在途的那批回来不落队列', async () => {
    const { deps, spy } = makeDeps()
    const stream = new FeedStream(deps)
    const started = stream.start(PREF)
    spy.deferred[0].resolve?.(batch(6))
    stream.stop()
    await started
    await flush()
    expect(spy.replaced).toHaveLength(0)
    expect(spy.appended).toHaveLength(0)
    expect(stream.active).toBe(false)
  })

  it('连续取不到就撤：到上限自动停、只一句错误、之后不再取数', async () => {
    const { deps, spy } = makeDeps(() => Promise.reject(new Error('上游 500')))
    const stream = new FeedStream(deps)
    await stream.start(PREF)
    expect(stream.active).toBe(true)
    stream.onRemaining(0)
    await flush()
    expect(spy.fetched).toHaveLength(FEED_MAX_FAILURES)
    expect(stream.active).toBe(false)
    const errors = spy.notes.filter(([, kind]) => kind === 'error')
    expect(errors).toHaveLength(2)
    expect(errors[1]?.[0]).toContain('已停止自动续播')
    stream.onRemaining(0)
    await flush()
    expect(spy.fetched).toHaveLength(FEED_MAX_FAILURES)
  })

  it('某批是空的：判「这个模式没回批次」并停，不拿空队列硬撑', async () => {
    const { deps, spy } = makeDeps(ready([]))
    const stream = new FeedStream(deps)
    await stream.start(PREF)
    expect(stream.active).toBe(false)
    expect(spy.replaced).toHaveLength(0)
    expect(spy.notes.some(([m, k]) => k === 'error' && m.includes('空的'))).toBe(true)
  })

  it('取成功就把失败计数清零（不会攒够两次就误停）', async () => {
    let index = 0
    const { deps, spy } = makeDeps(() => {
      const fail = index++ === 0
      return fail ? Promise.reject(new Error('抖一下')) : Promise.resolve(batch(6))
    })
    const stream = new FeedStream(deps)
    await stream.start(PREF)
    stream.onRemaining(1)
    await flush()
    expect(stream.active).toBe(true)
    stream.onRemaining(1)
    await flush()
    expect(spy.fetched).toHaveLength(3)
    expect(stream.active).toBe(true)
  })

  it('停流是幂等的，且没在流里时 onRemaining 什么都不做', async () => {
    const { deps, spy } = makeDeps(ready(batch(6)))
    const stream = new FeedStream(deps)
    stream.stop()
    stream.onRemaining(0)
    await flush()
    expect(spy.fetched).toHaveLength(0)
    expect(stream.active).toBe(false)
  })
})
