import { describe, expect, it } from 'vitest'
import { parseKrc } from '../dist/index.js'

const KRC =
  '[0,12705]作曲：张三\n' +
  '[17340,1740]<0,210,0>夜<210,390,0>总<600,300,0>是<900,390,0>太<1290,420,0>长\n' +
  '[19950,2520]<0,240,0>拼<240,270,0>尽<510,300,0>了<810,180,0>一<990,420,0>丝<1410,330,0>力<1740,420,0>气\n' +
  '[41250,5310]<0,180,0>那<180,570,0>时<750,180,0>的<930,510,0>你 <1440,270,0>注<1710,300,0>视<2010,480,0>我\n'

describe('parseKrc', () => {
  it('词文取自己时间戳之后的那段（不是前一段）', () => {
    const parsed = parseKrc(KRC)!
    const line = parsed.sentences[1]
    expect(line.text).toBe('夜总是太长')
    expect(line.words?.map((w) => w.text)).toEqual(['夜', '总', '是', '太', '长'])
    expect(line.words?.map((w) => w.start_ms)).toEqual([17340, 17550, 17940, 18240, 18630])
  })

  it('词之间的空格归到前一个词里，整句文本能拼回来', () => {
    const line = parseKrc(KRC)!.sentences[3]
    expect(line.text).toBe('那时的你 注视我')
    expect(line.words!.map((w) => w.text).join('')).toBe(line.text)
  })

  it('`[起,长]文本` 这种没有逐字标记的行标成 lrc', () => {
    const first = parseKrc(KRC)!.sentences[0]
    expect(first).toMatchObject({ text: '作曲：张三', start_ms: 0, end_ms: 12705, type: 'lrc' })
    expect(first.words).toEqual([{ text: '作曲：张三', start_ms: 0, end_ms: 12705 }])
  })

  it('只有一个词的正文行与绝对时间的署名行无法区分，但时间/文本必须都对', () => {
    // `<0,900,0>爱`（词相对句首 0 起、占满整行）和 `[20000,900]爱` 归一化后是同一个形状，
    // 没有任何信息能分开它们；这里只锁住「不因此丢字或错时间」
    const parsed = parseKrc('[20000,900]<0,900,0>爱\n[30000,900]作词：李四\n')!
    expect(parsed.sentences[0].text).toBe('爱')
    expect(parsed.sentences[0].words![0]).toMatchObject({ text: '爱', start_ms: 20000, end_ms: 20900 })
    expect(parsed.sentences[1].type).toBe('lrc')
  })

  it('多词正文行不标 lrc，逐字时间与整句文本都对', () => {
    const parsed = parseKrc('[20000,900]<0,600,0>你<600,300,0>好\n[30000,1200]<570,330,0>夜<900,300,0>色\n')!
    expect(parsed.sentences[0].type).toBeUndefined()
    expect(parsed.sentences[0].text).toBe('你好')
    expect(parsed.sentences[0].words?.map((w) => w.start_ms)).toEqual([20000, 20600])
    expect(parsed.sentences[1].text).toBe('夜色')
    expect(parsed.sentences[1].words?.map((w) => w.start_ms)).toEqual([30570, 30900])
  })

  it('非 KRC / 空内容给 undefined', () => {
    for (const bad of [undefined, null, '', '   \n  \n', '没有行头的纯文本', 42]) expect(parseKrc(bad)).toBeUndefined()
  })

  it('行时间是绝对毫秒，lyric_type 固定 krc', () => {
    const parsed = parseKrc(KRC)!
    expect(parsed.lyric_type).toBe('krc')
    expect(parsed.sentences.map((s) => s.start_ms)).toEqual([0, 17340, 19950, 41250])
  })
})
