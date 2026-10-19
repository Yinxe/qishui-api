import fs from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { type CorePaths, PlayHistory, resolvePaths, type TrackData } from '../dist/index.js'
import { makeTempDir, rmDir, sleep } from './support/tmp.js'

let home: string
let paths: CorePaths

const track = (id: string, name: string): TrackData => ({
  id,
  name,
  artists: [{ id: 'a1', name: '测试歌手' }],
  album: { id: 'al', name: '测试专辑' },
  durationMs: 30_000,
})

beforeAll(() => {
  home = makeTempDir()
  paths = resolvePaths(home)
})

afterAll(() => rmDir(home))

describe('PlayHistory：按账号分文件', () => {
  it('未设 scope 写 legacy 原位 journal/plays.jsonl', async () => {
    const h = new PlayHistory(paths)
    expect(h.scopeFile).toBe(paths.journalFileFor())
    await h.append(track('t1', '第一首'), { source: 'cache' })
    expect(fs.existsSync(paths.playsFile)).toBe(true)
    const record = h.read()[0]
    expect(record).toMatchObject({ trackId: 't1', name: '第一首', artist: '测试歌手', source: 'cache' })
  })

  it('setScope(uid) 换到 journal/<uid>/，两号记录互不可见', async () => {
    const h = new PlayHistory(paths)
    h.setScope('111')
    expect(h.scopeFile).toBe(path.join(home, 'journal', '111', 'plays.jsonl'))
    await h.append(track('t2', 'A 号听的'))
    h.setScope('222')
    expect(h.read()).toHaveLength(0)
    await h.append(track('t3', 'B 号听的'))
    h.setScope('111')
    expect(h.read().map((r) => r.trackId)).toEqual(['t2'])
    h.setScope(undefined)
    expect(h.read().map((r) => r.trackId)).toEqual(['t1'])
  })

  it('recent 新的在前且受 limit；clear 只动当前 scope', async () => {
    const h = new PlayHistory(paths)
    h.setScope('555')
    await h.append(track('x1', '一'))
    await h.append(track('x2', '二'))
    await h.append(track('x3', '三'))
    expect(h.recent(2).map((r) => r.trackId)).toEqual(['x3', 'x2'])
    await h.clear()
    expect(h.read()).toHaveLength(0)
  })

  it('stats 按播放次数降序汇总', async () => {
    const h = new PlayHistory(paths)
    h.setScope('666')
    await h.append(track('hot', '榜首'))
    await h.append(track('hot', '榜首'))
    await h.append(track('cold', '陪跑'))
    const stats = h.stats()
    expect(stats).toMatchObject({ records: 3, tracks: 2 })
    expect(stats.top[0]).toMatchObject({ trackId: 'hot', plays: 2 })
  })

  it('坏行跳过不炸（append-only 中途断电留半行的形态）', async () => {
    const h = new PlayHistory(paths)
    h.setScope('777')
    await h.append(track('ok', '好行'))
    fs.appendFileSync(h.scopeFile, '\n{半截的行\n')
    expect(h.read().map((r) => r.trackId)).toEqual(['ok'])
  })

  it('compactIfNeeded：超过两倍上限裁到最近 2000 行', async () => {
    const h = new PlayHistory(paths)
    h.setScope('888')
    fs.mkdirSync(path.dirname(h.scopeFile), { recursive: true })
    fs.writeFileSync(
      h.scopeFile,
      `${Array.from({ length: 4001 }, (_, i) => JSON.stringify({ at: i, trackId: `t${i}` })).join('\n')}\n`,
    )
    expect(await h.compactIfNeeded()).toBe(true)
    expect(h.read()).toHaveLength(2000)
    expect(h.read()[0]?.trackId).toBe('t2001')
    expect(await h.compactIfNeeded()).toBe(false)
  })
})

describe('PlayHistory：收听时长收尾（append-only 的补丁行）', () => {
  it('settle 把时长并回那一次播放，别的行不动；stats 不把它当又一次播放', async () => {
    const h = new PlayHistory(paths)
    h.setScope('911')
    const first = await h.append(track('a1', '听完的'), { durationMs: 30_000 })
    const second = await h.append(track('a2', '中途切的'))
    await h.settle(first, { playedMs: 30_000, completed: true })
    await h.settle(second, { playedMs: 8_000, completed: false })
    expect(h.read().map((r) => [r.trackId, r.playedMs, r.completed])).toEqual([
      ['a1', 30_000, true],
      ['a2', 8_000, false],
    ])
    expect(h.stats()).toMatchObject({ records: 2, tracks: 2 })
  })

  it('同一首听几次各记各的：补丁按 `at`+曲目认，不会串到另一次收听上', async () => {
    const h = new PlayHistory(paths)
    h.setScope('912')
    const earlier = await h.append(track('same', '同一首'))
    await sleep(2)
    const later = await h.append(track('same', '同一首'))
    await h.settle(later, { playedMs: 45_000, completed: true })
    const [first, second] = h.read()
    expect(first?.playedMs).toBeUndefined()
    expect(first?.completed).toBeUndefined()
    expect(second).toMatchObject({ playedMs: 45_000, completed: true })
    expect(earlier.at).not.toBe(later.at)
  })

  it('settleSync：退出路径上写完立刻可读', async () => {
    const h = new PlayHistory(paths)
    h.setScope('913')
    const record = await h.append(track('b1', '退出的那首'))
    h.settleSync(record, { playedMs: 1_000, completed: false })
    expect(h.read()[0]).toMatchObject({ playedMs: 1_000, completed: false })
  })

  it('没有归属的补丁行丢掉（原行被 compact 裁掉了），不凭空造一条没名字的播放', async () => {
    const h = new PlayHistory(paths)
    h.setScope('914')
    await h.settle({ at: 1, trackId: 'ghost' }, { playedMs: 500, completed: false })
    await h.append(track('c1', '还在的'))
    expect(h.read().map((r) => r.trackId)).toEqual(['c1'])
  })
})
