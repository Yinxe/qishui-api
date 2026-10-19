/**
 * 设置页缓存文案的离线单测：数字怎么落成人话，尤其是「试听片段」不能被当成坏缓存。
 * 这些函数不碰 core / ink，纯输入输出。
 */
import { describe, expect, it } from 'vitest'
import {
  breakdownNote,
  capacityNote,
  entityNote,
  fixNote,
  incompleteNote,
  issueLabel,
  issueNote,
  mediaNote,
  residueNote,
  verifyDetail,
  verifyHeadline,
} from '../dist/ui/cacheView.js'

const STATS = {
  tracks: 660,
  clips: 31,
  audioBytes: 1024 * 1024 * 1024,
  coverBytes: 20 * 1024 * 1024,
  lyricsBytes: 3 * 1024 * 1024,
  metaBytes: 1024 * 1024,
  withLyrics: 600,
  oldestAccessedAt: 1,
  totalPlays: 9,
  diskBytes: 1024 * 1024 * 1024 + 20 * 1024 * 1024 + 3 * 1024 * 1024 + 1024 * 1024,
  residueBytes: 0,
  pendingParts: 0,
  orphanDirs: 0,
  incomplete: 0,
}

const CAPACITY = {
  usedBytes: 1536 * 1024 * 1024,
  limitBytes: 2048 * 1024 * 1024,
  percent: 75,
  overLimit: false,
  policy: 'lru' as const,
  autoEvict: false,
  reclaimableTracks: 0,
  reclaimableBytes: 0,
}

const REPORT = {
  checked: 660,
  clips: 31,
  staleMeta: 605,
  deep: false,
  elapsedMs: 1234,
  issues: [],
  repaired: 0,
  removedDirs: 0,
  summary: { errors: 0, warnings: 0, infos: 0, fixable: 0 },
}

describe('缓存文案', () => {
  it('实体与媒体：真实占用是主角，试听单独标出来', () => {
    expect(entityNote({ entries: 14, bytes: 1_600_000, hits: 3, misses: 1 })).toBe('14 项 · 1.5MB · 命中 3 / 未中 1')
    expect(mediaNote(STATS)).toBe('660 首 · 真实占用 1.02GB · 试听 31 首')
    expect(mediaNote({ ...STATS, clips: 0 })).toBe('660 首 · 真实占用 1.02GB')
  })

  it('明细四类加起来 = 已用 - 残留（口径与 core 一致）', () => {
    const text = breakdownNote(STATS)
    expect(text).toContain('音频 1.00GB')
    expect(text).toContain('封面 20.0MB')
    expect(text).toContain('歌词 3.0MB')
    expect(text).toContain('记录 1.0MB')
  })

  it('残留/待重下：没有就直说，有就把 .part 与孤儿目录数出来', () => {
    expect(residueNote(STATS)).toBe('0B')
    expect(residueNote({ ...STATS, residueBytes: 2048, pendingParts: 2, orphanDirs: 1 })).toBe(
      '2.0KB（2 个未完成的 .part · 1 个没有记录的目录）',
    )
    expect(incompleteNote(STATS)).toBe('音频都在，没有要重下的')
    expect(incompleteNote({ ...STATS, incomplete: 3 })).toBe('3 首（大小对不上，下次播放会重下）')
  })

  it('容量：档位名 + 百分比；不限制/超限各有说法', () => {
    expect(capacityNote(CAPACITY)).toBe('已用 1.50GB / 2G（75%）')
    expect(capacityNote({ ...CAPACITY, limitBytes: 0, percent: undefined })).toBe('已用 1.50GB / 不限制')
    expect(capacityNote({ ...CAPACITY, usedBytes: 3072 * 1024 * 1024, overLimit: true })).toContain('超 1.00GB')
  })

  it('校验概览：没问题是「没发现问题」，不是「0 条」', () => {
    expect(verifyHeadline(REPORT)).toBe('检查 660 个目录 · 没发现问题')
    const issue = {
      trackId: '1',
      issue: 'x',
      kind: 'drift' as const,
      severity: 'warn' as const,
      clip: false,
      fixable: true,
    }
    expect(
      verifyHeadline({
        ...REPORT,
        issues: [issue, issue, issue],
        summary: { errors: 0, warnings: 2, infos: 1, fixable: 1 },
      }),
    ).toBe('检查 660 个目录：错误 0 · 提醒 2 · 提示 1 · 可修 1')
  })

  it('校验说明把「试听」与「旧版记录」解释清楚，免得被当成缓存坏了', () => {
    expect(verifyDetail(REPORT)).toBe(
      '试听片段 31 首（本来就比整曲短） · 旧版记录 605 首（下次播放会重取） · 未算 sha1（深度校验才查内容） · 用时 1.2s',
    )
    expect(verifyDetail({ ...REPORT, clips: 0, staleMeta: 0, deep: true, elapsedMs: 500 })).toBe(
      '已算 sha1 · 用时 0.5s',
    )
  })

  it('单条问题：级别 + 曲名，note 带 id 方便回查', () => {
    const issue = {
      trackId: '123',
      issue: '音频比记录短',
      kind: 'drift' as const,
      severity: 'warn' as const,
      clip: true,
      name: '一枕月华',
      fixable: false,
    }
    expect(issueLabel(issue)).toBe('提醒 一枕月华')
    expect(issueNote(issue)).toBe('音频比记录短 · 123')
    expect(issueLabel({ ...issue, name: undefined })).toBe('提醒 123')
    expect(issueNote({ ...issue, name: undefined })).toBe('音频比记录短')
  })

  it('修复行：没跑过校验 / 没可修项 / 有几项', () => {
    expect(fixNote(undefined)).toBe('先跑一次校验')
    expect(fixNote(REPORT)).toBe('没有可修项')
    expect(fixNote({ ...REPORT, summary: { ...REPORT.summary, fixable: 3 } })).toContain('3 项可修')
  })
})
