/**
 * 配置收口与容量档位：手改 config.json 写错容量/枚举时的兜底，`loadConfig` 必须接住。
 * 重点在 `maxMediaBytes` —— 0 是「不限制」这个意思，最容易被当成「无效值」给覆盖掉。
 */
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  CONFIG_DEFAULTS,
  loadConfig,
  MEDIA_CAPACITY_TIERS,
  type MediaEvictPolicy,
  mediaCapacityLabel,
  mediaEvictPolicyLabel,
  nextMediaCapacityTier,
} from '../dist/index.js'
import { makeTempDir, rmDir } from './support/tmp.js'

const GIB = 1024 ** 3

function loadWith(config: unknown): ReturnType<typeof loadConfig>['config'] {
  const home = makeTempDir('qishui-config-')
  try {
    fs.writeFileSync(path.join(home, 'config.json'), JSON.stringify(config))
    return loadConfig({ dataDir: home }).config
  } finally {
    rmDir(home)
  }
}

describe('loadConfig 的容量收口', () => {
  it('负数 / 非数字 / 小数：坏的回默认档，小数只截断', () => {
    expect(loadWith({ maxMediaBytes: -1 }).maxMediaBytes).toBe(CONFIG_DEFAULTS.maxMediaBytes)
    expect(loadWith({ maxMediaBytes: 'abc' }).maxMediaBytes).toBe(CONFIG_DEFAULTS.maxMediaBytes)
    expect(loadWith({ maxMediaBytes: 1536.7 }).maxMediaBytes).toBe(1536)
  })

  it('0 是不限制，不是「无效值」——必须原样留下', () => {
    expect(loadWith({ maxMediaBytes: 0 }).maxMediaBytes).toBe(0)
  })

  it('淘汰策略认枚举，别的回 lru；自动淘汰只认布尔', () => {
    expect(loadWith({ mediaEvictPolicy: 'leastPlayed' }).mediaEvictPolicy).toBe('leastPlayed')
    expect(loadWith({ mediaEvictPolicy: 'nope' }).mediaEvictPolicy).toBe('lru')
    expect(loadWith({ mediaAutoEvict: true }).mediaAutoEvict).toBe(true)
    expect(loadWith({ mediaAutoEvict: 'yes' }).mediaAutoEvict).toBe(false)
  })

  it('默认值：2G 档 + lru + 不自动剔', () => {
    const config = loadWith({})
    expect(config.maxMediaBytes).toBe(2 * GIB)
    expect(config.mediaEvictPolicy).toBe('lru')
    expect(config.mediaAutoEvict).toBe(false)
  })
})

describe('容量档位', () => {
  it('档位表是 2/3/4/5/10G 再加「不限制」', () => {
    expect(MEDIA_CAPACITY_TIERS).toEqual([2 * GIB, 3 * GIB, 4 * GIB, 5 * GIB, 10 * GIB, 0])
  })

  it('循环：2G→3G→…→10G→不限制→2G；非档位值跳进最近的档位', () => {
    const next = (bytes: number): number => nextMediaCapacityTier(bytes)
    expect(next(2 * GIB)).toBe(3 * GIB)
    expect(next(10 * GIB)).toBe(0)
    expect(next(0)).toBe(2 * GIB)
    // 手改的 512MB 先跳到「比它大的最小档」；比最大档还大就归到不限制
    expect(next(512 * 1024 * 1024)).toBe(2 * GIB)
    expect(next(11 * GIB)).toBe(0)
    expect(next(-5)).toBe(2 * GIB)
  })

  it('档位名：整 GiB 才是档位，0 是不限制，其余自定义', () => {
    expect(mediaCapacityLabel(3 * GIB)).toBe('3G')
    expect(mediaCapacityLabel(0)).toBe('不限制')
    expect(mediaCapacityLabel(1536 * 1024 * 1024)).toBe('自定义')
  })

  it('策略中文名两个都有（TUI 词表口径：只用汉字）', () => {
    expect(mediaEvictPolicyLabel('lru' satisfies MediaEvictPolicy)).toBe('最久未用')
    expect(mediaEvictPolicyLabel('leastPlayed')).toBe('最少播放')
  })
})
