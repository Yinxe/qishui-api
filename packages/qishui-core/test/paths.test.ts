import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { resolvePaths, safeSegment } from '../dist/index.js'

describe('resolvePaths：多账号磁盘布局', () => {
  const paths = resolvePaths('/tmp/qishui-x')

  it('根层三份：config / device / accounts 索引', () => {
    expect(paths.configFile).toBe(path.join('/tmp/qishui-x', 'config.json'))
    expect(paths.deviceFile).toBe(path.join('/tmp/qishui-x', 'device.json'))
    expect(paths.accountsIndexFile).toBe(path.join('/tmp/qishui-x', 'accounts.json'))
    expect(paths.accountFile('111')).toBe(path.join('/tmp/qishui-x', 'accounts', '111.json'))
  })

  it('entityFile：scope 有值走 _acct/<uid>，没有走共享位', () => {
    expect(paths.entityFile('search', 'q1')).toBe(path.join('/tmp/qishui-x', 'cache', 'entities', 'search', 'q1.json'))
    expect(paths.entityFile('me', 'k', '111')).toBe(
      path.join('/tmp/qishui-x', 'cache', 'entities', '_acct', '111', 'me', 'k.json'),
    )
  })

  it('journalFileFor：uid 上账号目录，缺省留 legacy 原位', () => {
    expect(paths.journalFileFor()).toBe(path.join('/tmp/qishui-x', 'journal', 'plays.jsonl'))
    expect(paths.journalFileFor('111')).toBe(path.join('/tmp/qishui-x', 'journal', '111', 'plays.jsonl'))
  })

  it('sessionFile 保留（仅迁移期读取）', () => {
    expect(paths.sessionFile).toBe(path.join('/tmp/qishui-x', 'session.json'))
  })

  it('safeSegment：id 原样，分隔符转义并截断', () => {
    expect(safeSegment('7627888436947339298')).toBe('7627888436947339298')
    expect(safeSegment('a/b c?d')).toBe('a_b_c_d')
    expect(safeSegment('x'.repeat(200))).toHaveLength(120)
  })
})
