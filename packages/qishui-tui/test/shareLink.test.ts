/** 分享链接/裸 ID → 路由的纯函数（不发请求，所以单测不打上游） */
import { describe, expect, it } from 'vitest'
import { looksLikeShareInput, shareTarget } from '../src/ui/shareLink.js'

describe('looksLikeShareInput', () => {
  it('完整分享链接与裸 ID 算分享物', () => {
    expect(looksLikeShareInput('https://music.douyin.com/qishui/share/track?track_id=7485660908549720080')).toBe(true)
    expect(looksLikeShareInput('  https://qishui.douyin.com/s/abcdEF12/  ')).toBe(true)
    expect(looksLikeShareInput('7485660908549720080')).toBe(true)
  })

  it('普通关键词不算（否则每次搜索都先当链接解析一遍）', () => {
    expect(looksLikeShareInput('晴天')).toBe(false)
    expect(looksLikeShareInput('Taylor Swift')).toBe(false)
    expect(looksLikeShareInput('2002')).toBe(false) // 短数字：歌名里很常见
    expect(looksLikeShareInput('')).toBe(false)
  })
})

describe('shareTarget', () => {
  it('曲目/歌单/专辑/艺人/用户各有对应页面', () => {
    expect(shareTarget({ kind: 'track', id: '1' })).toEqual({ route: { kind: 'track', id: '1' } })
    expect(shareTarget({ kind: 'playlist', id: '2' })).toEqual({
      route: { kind: 'list', source: { kind: 'playlist', id: '2' } },
    })
    expect(shareTarget({ kind: 'album', id: '3' })).toEqual({
      route: { kind: 'list', source: { kind: 'album', id: '3' } },
    })
    expect(shareTarget({ kind: 'artist', id: '4' })).toEqual({
      route: { kind: 'list', source: { kind: 'artist', id: '4', tab: 'hot' } },
    })
    expect(shareTarget({ kind: 'user', id: '5' })).toEqual({ route: { kind: 'user', id: '5' } })
  })

  it('TUI 里没有页面的类型给一句人话，不静默吞掉', () => {
    for (const kind of ['ugc_video', 'video', 'radio', 'podcast', 'unknown']) {
      const target = shareTarget({ kind, id: '9' })
      expect('note' in target).toBe(true)
      if ('note' in target) expect(target.note).toContain(kind)
    }
  })
})
