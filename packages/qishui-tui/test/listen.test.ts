/**
 * 听歌页条目构造的离线单测：单选标记、两个「当前」并存、场景弹层的执行顺序、没数据时的骨架。
 * `buildListenSections` 是纯函数（状态进、动作出），所以这里不起 core、不打上游。
 */
import type { FeedModeRef, FeedModeView } from 'qishui-core'
import { describe, expect, it } from 'vitest'
import { buildListenSections, buildSceneEntries, feedModeLabel, type ListenCtx } from '../dist/screens/Listen.js'
import type { Entry } from '../dist/ui/entries.js'

const modes = (): FeedModeView =>
  ({
    preferences: [{ mode: 'familiar', label: '熟悉', current: true }],
    bar: [],
    scenes: [
      { type: 'scene_mode', text: '专注模式', sceneModeId: 48 },
      { type: 'scene_mode', text: '通勤', sceneModeId: 52 },
      // 没有 sceneModeId 的场景取不了批次，不该出现在弹层里
      { type: 'scene_mode', text: '缺 id 的' },
      { type: 'scene_mode', text: '', sceneModeId: 77 },
    ],
    raw: {},
  }) as unknown as FeedModeView

interface Spy {
  picked: FeedModeRef[]
  played: number
  stopped: number
  opened: Entry[][]
  closed: number
}

function ctx(over: Partial<ListenCtx> = {}): { c: ListenCtx; spy: Spy } {
  const spy: Spy = { picked: [], played: 0, stopped: 0, opened: [], closed: 0 }
  const c: ListenCtx = {
    modes: undefined,
    current: undefined,
    streaming: false,
    pick: (ref) => spy.picked.push(ref),
    play: () => {
      spy.played += 1
    },
    stop: () => {
      spy.stopped += 1
    },
    openScenes: (entries) => spy.opened.push(entries),
    closeOverlay: () => {
      spy.closed += 1
    },
    ...over,
  }
  return { c, spy }
}

const labelOf = (entry: Entry | undefined): string => entry?.label ?? ''

describe('buildListenSections', () => {
  it('常用三档永远画得出来（core 的常量，不依赖请求）', () => {
    const { c } = ctx()
    const sections = buildListenSections(c)
    const preferences = sections[0].entries
    expect(preferences.map((e) => e.key)).toEqual(['pref:default', 'pref:familiar', 'pref:fresh'])
    expect(labelOf(preferences[1])).toBe('( ) 熟悉')
  })

  it('`(x)` 只标本机记住的那个，且整页只有一个', () => {
    const { c } = ctx({ current: { kind: 'preference', mode: 'fresh' }, modes: modes() })
    const entries = buildListenSections(c)[0].entries
    expect(entries.filter((e) => e.label.startsWith('(x)'))).toHaveLength(1)
    expect(labelOf(entries[2])).toBe('(x) 新鲜')
  })

  it('`（上游当前）`只标上游栏里那一条，可以与本机的 `(x)` 并存', () => {
    // 本机记住 fresh、上游栏当前是 familiar —— 两个标记各说各的
    const { c } = ctx({ current: { kind: 'preference', mode: 'fresh' }, modes: modes() })
    const entries = buildListenSections(c)[0].entries
    expect(entries[1]?.note).toBe('（上游当前）')
    expect(entries[2]?.label).toBe('(x) 新鲜')
    expect(entries[0]?.note).toBeUndefined()
  })

  it('Enter 就是选模式并起播（一次 pick，没有额外的播放条目）', () => {
    const { c, spy } = ctx({ modes: modes() })
    buildListenSections(c)[0].entries[0]?.onEnter?.()
    expect(spy.picked).toEqual([{ kind: 'preference', mode: 'default' }])
  })

  it('场景收进弹层：只有带 sceneModeId 的进得去，点它是先关弹层再切模式', () => {
    const { c, spy } = ctx({ modes: modes() })
    const gate = buildListenSections(c)[1].entries[0]
    expect(labelOf(gate)).toBe('更多场景（3）> 选择')
    gate?.onEnter?.()
    expect(spy.opened).toHaveLength(1)
    expect(spy.opened[0].map((e) => e.key)).toEqual(['scene:48', 'scene:52', 'scene:77'])
    spy.opened[0][0]?.onEnter?.()
    expect(spy.closed).toBe(1)
    expect(spy.picked).toEqual([{ kind: 'scene', sceneModeId: 48 }])
  })

  it('没拿到模式列表时场景档置灰，不假装认得', () => {
    const { c, spy } = ctx()
    const gate = buildListenSections(c)[1].entries[0]
    expect(gate?.disabled).toBe(true)
    gate?.onEnter?.()
    expect(spy.opened).toHaveLength(0)
  })

  it('流状态档三态：在跑 → 停止；没跑但记住过 → 再来一批；没记住 → 说明行', () => {
    const running = ctx({ streaming: true, current: { kind: 'preference', mode: 'familiar' }, modes: modes() })
    const stopEntry = buildListenSections(running.c)[2].entries[0]
    expect(labelOf(stopEntry)).toBe('停止自动续播')
    stopEntry?.onEnter?.()
    expect(running.spy.stopped).toBe(1)

    const idle = ctx({ current: { kind: 'scene', sceneModeId: 48 }, modes: modes() })
    const playEntry = buildListenSections(idle.c)[2].entries[0]
    expect(labelOf(playEntry)).toBe('按「专注模式」再来一批')
    playEntry?.onEnter?.()
    expect(idle.spy.played).toBe(1)

    const none = ctx()
    expect(buildListenSections(none.c)[2].entries[0]?.disabled).toBe(true)
  })
})

describe('feedModeLabel', () => {
  it('偏好给中文、场景给上游文案、缺文案就照实写 id', () => {
    expect(feedModeLabel(modes(), { kind: 'preference', mode: 'familiar' })).toBe('熟悉')
    expect(feedModeLabel(modes(), { kind: 'scene', sceneModeId: 48 })).toBe('专注模式')
    expect(feedModeLabel(modes(), { kind: 'scene', sceneModeId: 77 })).toBe('场景 77')
    expect(feedModeLabel(modes(), { kind: 'scene', sceneModeId: 999 })).toBe('场景 999')
    expect(feedModeLabel(undefined, { kind: 'preference', mode: 'fresh' })).toBe('新鲜')
    expect(feedModeLabel(modes(), undefined)).toBe('未选')
  })
})

describe('buildSceneEntries', () => {
  it('记住的场景带 `(x)`，其余 `( )`', () => {
    const { c } = ctx({ modes: modes(), current: { kind: 'scene', sceneModeId: 52 } })
    const entries = buildSceneEntries(c)
    expect(entries.map((e) => e.label)).toEqual(['( ) 专注模式', '(x) 通勤', '( ) 场景 77'])
  })
})
