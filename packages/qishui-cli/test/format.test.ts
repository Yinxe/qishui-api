/**
 * 人类可读格式化（format.ts）纯函数单测：时长/数量/时间/一行式描述。
 * 颜色由 support/noColor 关掉，断言拿到的是裸文本。
 */
import './support/noColor.js'
import type { CommentData, TrackData, UserData } from 'qishui-core'
import { describe, expect, it } from 'vitest'
import {
  ago,
  commentLine,
  count,
  day,
  duration,
  durationLong,
  tailParts,
  toData,
  totalDuration,
  trackArtists,
  trackTitle,
  userLine,
} from '../dist/format.js'

const track = (d: Partial<TrackData>): TrackData => ({ id: '7001', name: '', artists: [], ...d }) as TrackData
const user = (d: Partial<UserData>): UserData => ({ id: 'u1', nickname: '', ...d }) as UserData

describe('时间与数量', () => {
  it('duration：无效给占位，有效走 durationLong', () => {
    expect(duration(undefined)).toBe('--:--')
    expect(duration(0)).toBe('--:--')
    expect(duration(-5)).toBe('--:--')
    expect(duration(65_000)).toBe('1:05')
  })

  it('durationLong：分秒补零，过一小时进位', () => {
    expect(durationLong(12_345)).toBe('0:12')
    expect(durationLong(605_000)).toBe('10:05')
    expect(durationLong(3_723_000)).toBe('1:02:03')
  })

  it('totalDuration：不足一小时按分钟，超了按小时', () => {
    expect(totalDuration(540_000)).toBe('9 分钟')
    expect(totalDuration(7_500_000)).toBe('2 小时 5 分')
  })

  it('day 是 ISO 日期；ago 从「刚刚」到日期逐步变粗', () => {
    expect(day(1_700_000_000)).toBe('2023-11-14')
    const nowSec = Math.floor(Date.now() / 1000)
    expect(ago(nowSec)).toBe('刚刚')
    expect(ago(nowSec - 120)).toBe('2 分钟前')
    expect(ago(nowSec - 2 * 3600)).toBe('2 小时前')
    expect(ago(nowSec - 5 * 86_400)).toBe('5 天前')
    expect(ago(nowSec - 40 * 86_400)).toBe(day(nowSec - 40 * 86_400))
    expect(ago(undefined)).toBeUndefined()
  })

  it('count：万/亿进位，边界小数位跟着量级走', () => {
    expect(count(undefined)).toBe('-')
    expect(count(999)).toBe('999')
    expect(count(12_345)).toBe('1.2 万')
    expect(count(9_990_000)).toBe('999 万')
    expect(count(123_000_000)).toBe('1.2 亿')
  })
})

describe('一行式描述', () => {
  it('tailParts：空值剔除，非空前面垫两个空格', () => {
    expect(tailParts('a', undefined, 'b')).toBe('  a  b')
    expect(tailParts(undefined, '')).toBe('')
  })

  it('trackTitle/trackArtists：缺名缺歌手有兜底', () => {
    expect(trackTitle(track({ name: '晴天' }))).toBe('晴天')
    expect(trackTitle(track({ id: '7001', name: '' }))).toBe('(无标题 7001)')
    expect(
      trackArtists(
        track({
          artists: [
            { id: 'a', name: '周杰伦' },
            { id: 'b', name: '费玉清' },
          ],
        }),
      ),
    ).toBe('周杰伦 / 费玉清')
    expect(
      trackArtists(
        track({
          artists: [
            { id: 'a', name: '' },
            { id: 'b', name: '费玉清' },
          ],
        }),
      ),
    ).toBe('费玉清')
    expect(trackArtists(track({}))).toBe('未知歌手')
  })

  it('userLine：昵称优先、统计并进尾部、id 在最后', () => {
    const line = userLine(user({ id: '4075251663115050', nickname: '小曲', stats: { liked: 12_345, followers: 30 } }))
    expect(line).toContain('小曲')
    expect(line).toContain('1.2 万 喜欢')
    expect(line.trimEnd().endsWith('4075251663115050')).toBe(true)
    expect(userLine(user({ id: '4075251663115050' }))).toContain('4075251663115050')
  })

  it('commentLine：正文缩进单独一行，标记只有非零才出现', () => {
    const c = {
      id: 'c1',
      content: '好听',
      user: { id: 'u9', nickname: '路人' },
      countDigged: 12,
      countReply: 0,
      liked: true,
    } as CommentData
    const line = commentLine(c, { time: '3 天前' })
    expect(line).toContain('路人')
    expect(line).toContain('3 天前')
    expect(line).toContain('已赞')
    expect(line).toContain('♥ 12')
    expect(line).not.toContain('↩')
    expect(line.split('\n')[1]).toBe('     好听')
  })

  it('toData：有 toJSON 走 toJSON，裸数据原样', () => {
    expect(toData({ toJSON: () => ({ a: 1 }) })).toEqual({ a: 1 })
    expect(toData({ a: 2 })).toEqual({ a: 2 })
  })
})
