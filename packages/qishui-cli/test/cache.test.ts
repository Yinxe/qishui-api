/**
 * CLI 的容量面（全离线）：`cache stats` 的容量账、`cache prune` 的淘汰顺序、
 * `config set` 认体积写法。数据目录用 `seedTrack` 预置，不碰上游。
 */
import fs from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { makeCliHome, rmDir, runCli, seedTrack } from './support/cli.js'

// 每条用例都要起好几次真进程（一次 spawn 约 300ms），默认 5 秒在并行构建的机器上会翻车
vi.setConfig({ testTimeout: 30_000 })

const A = '7300000000000000001'
const B = '7300000000000000002'
const C = '7300000000000000003'
const GIB = 1024 ** 3

let home: string

beforeAll(() => {
  home = makeCliHome()
  // 三首不同体积、不同播放次数：两个策略该剔的不是同一首
  seedTrack(home, A, '曲目A', 5, { plays: 9, accessedAt: Date.now() - 3000 })
  seedTrack(home, B, '曲目B', 3, { plays: 5, accessedAt: Date.now() - 2000 })
  seedTrack(home, C, '曲目C', 3, { plays: 0, accessedAt: Date.now() - 1000 })
})

afterAll(() => rmDir(home))

const dirOf = (id: string): string => path.join(home, 'cache', 'tracks', id)
const dirBytes = (id: string): number =>
  fs.readdirSync(dirOf(id)).reduce((sum, name) => sum + fs.statSync(path.join(dirOf(id), name)).size, 0)
const cached = (id: string): boolean => fs.existsSync(dirOf(id))

describe('cache stats 的容量账', () => {
  it('--json 带 capacity：已用/上限/策略/自动淘汰，且不限制时不给百分比', () => {
    const out = runCli(home, ['cache', 'stats', '--json'])
    expect(out.status).toBe(0)
    const cap = out.json().capacity
    expect(cap.limitBytes).toBe(2 * GIB)
    expect(cap.usedBytes).toBeGreaterThan(0)
    expect(cap.overLimit).toBe(false)
    expect(cap.policy).toBe('lru')
    expect(cap.autoEvict).toBe(false)
    expect(cap.reclaimableTracks).toBe(0)
    // 显示的占用是真实磁盘数，比 meta 自报的音频字节大（还有 meta.json/歌词/封面）
    expect(cap.usedBytes).toBeGreaterThanOrEqual(out.json().media.audioBytes)

    runCli(home, ['config', 'set', 'maxMediaBytes', '不限制'])
    expect(runCli(home, ['cache', 'stats', '--json']).json().capacity.percent).toBeUndefined()
    runCli(home, ['config', 'set', 'maxMediaBytes', '2GB'])
  })

  it('人读输出把上限说清楚，超限时给一条能直接抄走的清理命令', () => {
    expect(runCli(home, ['cache', 'stats']).stdout).toContain('容量')
    // 上限压到 1 字节：必然超限
    runCli(home, ['config', 'set', 'maxMediaBytes', '1B'])
    const stats = runCli(home, ['cache', 'stats'])
    expect(stats.stdout).toContain('超上限')
    expect(stats.stdout).toContain('可释放')
    runCli(home, ['config', 'set', 'maxMediaBytes', '2GB'])
  })
})

describe('cache prune 的淘汰顺序', () => {
  it('--by leastPlayed 剔播得最少的；不带 --by 就用 config 里的策略', () => {
    const total = runCli(home, ['cache', 'stats', '--json']).json().capacity.usedBytes
    // 上限 = 总量 − C 的体积 + 1：只够剔一首，剔谁就看策略
    const maxBytes = `${total - dirBytes(C) + 1}B`

    const byPlays = runCli(home, ['cache', 'prune', '--media', '--by', 'leastPlayed', '--max-size', maxBytes, '--json'])
    expect(byPlays.status).toBe(0)
    expect(byPlays.json().media).toMatchObject({ removed: 1, policy: 'leastPlayed' })
    expect(cached(C)).toBe(false)
    expect(cached(A)).toBe(true)

    seedTrack(home, C, '曲目C', 3, { plays: 0, accessedAt: Date.now() - 1000 })
    runCli(home, ['config', 'set', 'mediaEvictPolicy', 'leastPlayed'])
    const fromConfig = runCli(home, ['cache', 'prune', '--media', '--max-size', maxBytes, '--json'])
    expect(fromConfig.json().media.policy).toBe('leastPlayed')
    expect(cached(C)).toBe(false)
    runCli(home, ['config', 'set', 'mediaEvictPolicy', 'lru'])
  })

  it('--by 只认枚举；没加 --media 时媒体一根手指都不碰，只提示', () => {
    expect(runCli(home, ['cache', 'prune', '--by', 'nope']).status).not.toBe(0)
    runCli(home, ['config', 'set', 'maxMediaBytes', '1B'])
    const hint = runCli(home, ['cache', 'prune'])
    expect(hint.stdout).toContain('加 --media')
    expect(cached(A)).toBe(true)
    expect(cached(B)).toBe(true)
    runCli(home, ['config', 'set', 'maxMediaBytes', '2GB'])
  })
})

describe('config set 认体积写法', () => {
  it('2G / 2GB / 1536MB / 0 / 不限制 都能落盘成字节', () => {
    const cases: [string, number][] = [
      ['2G', 2 * GIB],
      ['2GB', 2 * GIB],
      ['3G', 3 * GIB],
      ['1536MB', 1536 * 1024 * 1024],
      ['512B', 512],
      ['0', 0],
      ['不限制', 0],
    ]
    for (const [text, bytes] of cases) {
      expect(runCli(home, ['config', 'set', 'maxMediaBytes', text]).status).toBe(0)
      expect(runCli(home, ['config', 'get', 'maxMediaBytes', '--json']).json().value).toBe(bytes)
    }
    expect(runCli(home, ['config', 'set', 'maxMediaBytes', '两G']).status).not.toBe(0)
    runCli(home, ['config', 'set', 'maxMediaBytes', '2GB'])
  })

  it('光给数字要挡下来：`3` 会被读成 3 字节，等于把整仓缓存判成超限', () => {
    const bad = runCli(home, ['config', 'set', 'maxMediaBytes', '3'])
    expect(bad.status).not.toBe(0)
    expect(bad.stderr + bad.stdout).toContain('单位')
    // 报错不能把用户的上限改掉
    expect(runCli(home, ['config', 'get', 'maxMediaBytes', '--json']).json().value).toBe(2 * GIB)
    expect(runCli(home, ['cache', 'prune', '--max-size', '500']).status).not.toBe(0)
  })

  it('人读回显给档位名，不只给一串字节', () => {
    const set = runCli(home, ['config', 'set', 'maxMediaBytes', '3G'])
    expect(set.stdout).toContain('3G')
    const custom = runCli(home, ['config', 'set', 'maxMediaBytes', '1536MB'])
    expect(custom.stdout).toContain('自定义')
    runCli(home, ['config', 'set', 'maxMediaBytes', '2GB'])
  })
})
