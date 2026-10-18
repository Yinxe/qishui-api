/**
 * 「这份曲目属于哪份播放队列」的翻译层（`ui/queues.ts`）离线单测。
 *
 * 规则来自产品口径：歌单 / 我喜欢的音乐各是一份**自己的**队列（顺序 / 随机、各自记位置），
 * 搜索·榜单·专辑·艺人·首页块这些**浏览型结果**统一进临时队列（每次点播整队替换）。
 */

import type { QishuiCore } from 'qishui-core'
import { describe, expect, it, vi } from 'vitest'
import { queueKindLabel, queueSpecOfSource, recommendTitle } from '../dist/ui/queues.js'

const data = (id: string) => ({ id, name: `曲目 ${id}` })
const entity = (id: string) => ({ data: data(id) })

function fakeCore(overrides: Record<string, unknown> = {}): QishuiCore {
  return {
    catalog: {
      playlist: vi.fn(async () => ({ allTracks: async () => [entity('a'), entity('b')] })),
    },
    library: { likedTracks: vi.fn(async () => [entity('l1')]) },
    local: {
      playlistTracks: vi.fn(() => [entity('lp1')]),
      likes: vi.fn(() => [entity('ll1')]),
    },
    ...overrides,
  } as unknown as QishuiCore
}

describe('queueSpecOfSource：来源 → 队列', () => {
  it('歌单页 = 这张歌单自己的队列（整张取一次，标题去掉页面前缀）', async () => {
    const spec = queueSpecOfSource(fakeCore(), { kind: 'playlist', id: 'p1' }, '歌单 · 晴天合集')
    expect(spec.kind).toBe('playlist')
    if (spec.kind !== 'playlist') throw new Error('kind')
    expect(spec.id).toBe('playlist:p1')
    expect(spec.title).toBe('歌单 · 晴天合集')
    expect(await spec.load()).toEqual([data('a'), data('b')])
  })

  it('「我喜欢的音乐」= 随机队列（id 固定，切走再切回来还是它）', () => {
    const spec = queueSpecOfSource(fakeCore(), { kind: 'liked' }, '我喜欢的音乐')
    expect(spec).toMatchObject({ kind: 'liked', id: 'liked', title: '我喜欢的音乐' })
  })

  it('本地歌单 / 本地喜欢各是一份（本地库取数，不出网）', async () => {
    const core = fakeCore()
    const playlist = queueSpecOfSource(core, { kind: 'local-playlist', id: 'lp' }, '本地歌单 · 我的')
    expect(playlist).toMatchObject({ kind: 'playlist', id: 'local-playlist:lp', title: '本地歌单 · 我的' })
    if (playlist.kind !== 'playlist') throw new Error('kind')
    expect(await playlist.load()).toEqual([data('lp1')])

    const liked = queueSpecOfSource(core, { kind: 'local-likes' }, '本地喜欢')
    expect(liked).toMatchObject({ kind: 'liked', id: 'local-likes', title: '本地喜欢' })
  })

  it.each([
    ['搜索', { kind: 'search', type: 'track', query: '周杰伦' } as const, '搜索 · 周杰伦'],
    ['榜单', { kind: 'chart', id: 'c1' } as const, '榜单 · 热歌'],
    ['专辑', { kind: 'album', id: 'al1' } as const, '专辑 · 叶惠美'],
    ['艺人', { kind: 'artist', id: 'a1', tab: 'hot' } as const, '艺人 · 周杰伦'],
    ['最近播放', { kind: 'recent' } as const, '最近播放'],
    ['首页块', { kind: 'mix', blockType: 'x' } as const, '推荐块'],
  ])('%s 是浏览型结果 → 临时队列', (_name, source, title) => {
    const spec = queueSpecOfSource(fakeCore(), source as never, title)
    expect(spec.kind).toBe('temporary')
    expect(spec.title).toBe(`临时 · ${title}`)
  })
})

describe('标签', () => {
  it('队列种类说中文；推荐队列的标题按模式名（认不出就写 id）', () => {
    expect(['recommend', 'playlist', 'liked', 'temporary'].map((kind) => queueKindLabel(kind as never))).toEqual([
      '推荐',
      '歌单',
      '喜欢',
      '临时',
    ])
    expect(recommendTitle({ kind: 'preference', mode: 'fresh' })).toBe('推荐 · 新鲜')
    expect(recommendTitle({ kind: 'scene', sceneModeId: 7 })).toBe('推荐 · 场景 7')
    expect(recommendTitle({ kind: 'scene', sceneModeId: 7 }, '通勤')).toBe('推荐 · 通勤')
  })
})
