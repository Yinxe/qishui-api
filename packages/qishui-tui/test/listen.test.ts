/**
 * 听歌页条目构造的离线单测：模式单行（三档偏好 + 场景）的标记与「上次听到哪」、
 * 场景弹层的执行顺序、没数据时的退化。`buildModeOptions` / `buildSceneEntries` 是纯函数
 * （状态进、动作出），所以这里不起 core、不打上游。
 */
import type { FeedModeRef, FeedModeView } from 'qishui-core'
import { describe, expect, it } from 'vitest'
import { buildModeOptions, buildSceneEntries, feedModeLabel, type ListenCtx } from '../dist/screens/Listen.js'

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
  closed: number
}

function ctx(over: Partial<ListenCtx> = {}): { c: ListenCtx; spy: Spy } {
  const spy: Spy = { picked: [], closed: 0 }
  const c: ListenCtx = {
    modes: undefined,
    current: undefined,
    pick: (ref) => spy.picked.push(ref),
    play: () => {},
    closeOverlay: () => {
      spy.closed += 1
    },
    ...over,
  }
  return { c, spy }
}

describe('buildModeOptions', () => {
  it('偏好三档（core 常量，不依赖请求）+「场景」永远画得出来', () => {
    const { c } = ctx()
    const options = buildModeOptions(c)
    expect(options.map((option) => option.key)).toEqual(['default', 'familiar', 'fresh', 'scene'])
    expect(options.map((option) => option.label)).toEqual(['推荐', '熟悉', '新鲜', '场景'])
    expect(options.every((option) => !option.active)).toBe(true)
  })

  it('`active` 只标本机记住的那一档；偏好档带 `ref`，「场景」不带（要开弹层）', () => {
    const { c } = ctx({ current: { kind: 'preference', mode: 'fresh' } })
    const options = buildModeOptions(c)
    expect(options.filter((option) => option.active).map((option) => option.key)).toEqual(['fresh'])
    expect(options.find((option) => option.key === 'default')?.ref).toEqual({ kind: 'preference', mode: 'default' })
    expect(options.find((option) => option.key === 'scene')?.ref).toBeUndefined()
  })

  it('记住的场景档让「场景」亮起', () => {
    const { c } = ctx({ current: { kind: 'scene', sceneModeId: 48 }, modes: modes() })
    expect(buildModeOptions(c).find((option) => option.key === 'scene')?.active).toBe(true)
  })

  it('「上次听到哪」随记忆挂在对应那一档：有记忆写「上次：曲名」，没播过不写', () => {
    const { c } = ctx({
      memory: (ref) =>
        ref.kind === 'preference' && ref.mode === 'familiar' ? { count: 6, current: '晴天' } : undefined,
    })
    const options = buildModeOptions(c)
    expect(options.find((option) => option.key === 'familiar')?.note).toBe('上次：晴天')
    expect(options.find((option) => option.key === 'fresh')?.note).toBeUndefined()
  })

  it('只有条数没有曲名时退成「上次取过 N 首」', () => {
    const { c } = ctx({ memory: () => ({ count: 4 }) })
    expect(buildModeOptions(c)[0].note).toBe('上次取过 4 首')
  })
})

describe('buildSceneEntries', () => {
  it('只有带 sceneModeId 的场景进得去，记住那个带 `(x)`', () => {
    const { c } = ctx({ modes: modes(), current: { kind: 'scene', sceneModeId: 52 } })
    const entries = buildSceneEntries(c)
    expect(entries.map((entry) => entry.key)).toEqual(['scene:48', 'scene:52', 'scene:77'])
    expect(entries.map((entry) => entry.label)).toEqual(['( ) 专注模式', '(x) 通勤', '( ) 场景 77'])
  })

  it('点场景是「先关弹层再切模式」——起播提示别被弹层挡住', () => {
    const { c, spy } = ctx({ modes: modes() })
    buildSceneEntries(c)[0]?.onEnter?.()
    expect(spy.closed).toBe(1)
    expect(spy.picked).toEqual([{ kind: 'scene', sceneModeId: 48 }])
  })

  it('场景档也带「上次听到哪」：切走再切回来接着上次那首，所以能回溯', () => {
    const { c } = ctx({
      modes: modes(),
      memory: (ref) => (ref.kind === 'scene' && ref.sceneModeId === 48 ? { count: 6, current: '夜曲' } : undefined),
    })
    const entries = buildSceneEntries(c)
    expect(entries.find((entry) => entry.key === 'scene:48')?.note).toBe('上次：夜曲')
    expect(entries.find((entry) => entry.key === 'scene:52')?.note).toBeUndefined()
  })

  it('没拿到模式列表时弹层是空的（调用方据此提示刷新），不假装认得', () => {
    const { c } = ctx()
    expect(buildSceneEntries(c)).toEqual([])
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
