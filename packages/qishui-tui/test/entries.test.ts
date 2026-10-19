/**
 * 分区条目的摊平：**不可选中（disabled）的信息行也要把 note 带出去**。
 *
 * 设置页的缓存统计全挂在 disabled 行的 note 上；从前渲染时按「可选中项」的下标去查 note，
 * 这些行拿到的是 undefined —— 统计数字其实一直在，只是从来没画出来。
 */
import { describe, expect, it } from 'vitest'
import { flattenSections } from '../dist/ui/entries.js'

describe('flattenSections', () => {
  it('disabled 行保留 note，且不进可选中列表', () => {
    const { lines, entries } = flattenSections([
      {
        title: '缓存',
        entries: [
          { key: 'media', label: '媒体缓存', note: '660 首 · 1.9GB · 试听 31 首', disabled: true },
          { key: 'verify', label: '校验媒体文件', note: '不动文件', onEnter: () => {} },
        ],
      },
    ])
    const info = lines.find((line) => line.text === '媒体缓存')
    expect(info?.note).toBe('660 首 · 1.9GB · 试听 31 首')
    expect(info?.entryIndex).toBeUndefined()
    expect(entries).toHaveLength(1)

    const action = lines.find((line) => line.text === '校验媒体文件')
    expect(action?.note).toBe('不动文件')
    expect(action?.entryIndex).toBe(0)
    // 可选中项的下标必须指向它自己（不能因为前面有 disabled 行就整体错位）
    expect(entries[action?.entryIndex ?? -1]?.key).toBe('verify')
  })

  it('分区之间留一个空行，标题单独成行', () => {
    const { lines } = flattenSections([
      { title: '一', entries: [{ key: 'a', label: 'A' }] },
      { title: '二', entries: [{ key: 'b', label: 'B' }] },
    ])
    expect(lines.map((line) => line.type)).toEqual(['header', 'entry', 'gap', 'header', 'entry'])
  })
})
