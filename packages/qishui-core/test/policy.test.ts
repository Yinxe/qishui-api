import { describe, expect, it } from 'vitest'
import { CACHE_TIERS, CacheTtl, isScoped, KIND_SCOPE, scopeFor } from '../dist/index.js'

describe('cache policy：TTL 档', () => {
  it('none 档 = 0（set 见 0 跳过写盘的开关）', () => {
    expect(CacheTtl.none).toBe(0)
  })

  it('CacheTtl 与 CACHE_TIERS 同源（改档只动 policy.ts 一处）', () => {
    for (const tier of CACHE_TIERS) expect(CacheTtl[tier.key]).toBe(tier.ttlMs)
    expect(Object.keys(CacheTtl).sort()).toEqual(CACHE_TIERS.map((t) => t.key).sort())
  })
})

describe('cache policy：账号隔离档', () => {
  it('三个代表 kind 各归一档', () => {
    expect(scopeFor('me')).toBe('account')
    expect(scopeFor('track')).toBe('viewer')
    expect(scopeFor('search')).toBe('public')
  })

  it('未列出的 kind 按 viewer 兜底（宁可多隔离，不串号）', () => {
    expect(scopeFor('some-new-kind')).toBe('viewer')
    expect(isScoped('some-new-kind')).toBe(true)
  })

  it('isScoped 与 scopeFor 口径一致', () => {
    for (const kind of Object.keys(KIND_SCOPE)) {
      expect(isScoped(kind)).toBe(scopeFor(kind) !== 'public')
    }
  })
})
