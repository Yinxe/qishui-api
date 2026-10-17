/**
 * CLI 播放链路（全离线）：seedTrack 预置「实体缓存 + 媒体缓存」后，
 * 队列/--print-path/download/cache 都应零网络；mpv 分节起真进程（--ao=null 不出声）。
 * mpv 或 script(1) 不在本机时对应分节跳过。
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { CLI, makeCliHome, rmDir, runCli, seedTrack, which } from './support/cli.js'

const A = '7100000000000000001'
const B = '7100000000000000002'

let home: string

beforeAll(() => {
  home = makeCliHome()
  seedTrack(home, A, '曲目A', 3)
  seedTrack(home, B, '曲目B', 3)
})

afterAll(() => rmDir(home))

describe('播放队列 / 落盘 / 导出（缓存命中即零网络）', () => {
  it('play --list 打印播放队列', () => {
    const list = runCli(home, ['play', `track:${A}`, '--list'])
    expect(list.status).toBe(0)
    expect(list.stdout).toContain('播放队列')
    expect(list.stdout).toContain('曲目A')
  })

  it('play --print-path --json 解析出缓存源（kind=cache，文件在盘上）', () => {
    const out = runCli(home, ['play', `track:${A}`, '--print-path', '--json'])
    expect(out.status).toBe(0)
    const source = out.json().tracks?.[0]
    expect(source?.kind).toBe('cache')
    expect(source?.path && fs.existsSync(source.path)).toBe(true)
  })

  it('二次 --list 把已缓存的标成 ●', () => {
    const list = runCli(home, ['play', `track:${A}`, '--list'])
    expect(list.stdout).toContain('●')
  })

  it('download --out 导出「歌手 - 曲名」音频（文件名会 ASCII 化）', () => {
    const outDir = path.join(home, 'exported')
    const dl = runCli(home, ['download', A, '--out', outDir])
    expect(dl.status).toBe(0)
    const files = fs.readdirSync(outDir)
    // 「测试歌手 - 曲目A」被 sanitize 成 `____ - __A.wav`：认骨架不认中文
    expect(files.some((f) => /^.+ - .+\.(wav|m4a)$/.test(f))).toBe(true)
  })

  it('cache stats / cache list 看得见预置的两首', () => {
    const stats = runCli(home, ['cache', 'stats', '--json'])
    expect(stats.status).toBe(0)
    expect(stats.json().media.tracks).toBeGreaterThanOrEqual(2)
    const list = runCli(home, ['cache', 'list', '--json'])
    expect(list.status).toBe(0)
    expect(list.json().length).toBeGreaterThanOrEqual(2)
  })
})

describe.skipIf(!which('mpv'))('mpv 播放会话（真进程）', () => {
  it('播完两首：played=2、reason=finished、无残留进程', () => {
    const played = runCli(home, ['play', `track:${A}`, `track:${B}`, '--json'], {
      env: { QISHUI_MPV_ARGS: '--ao=null' },
      timeoutMs: 120_000,
    })
    expect(played.status).toBe(0)
    const result = played.json()
    expect(result.played).toBe(2)
    expect(result.reason).toBe('finished')
    const probe = spawnSync('sh', ['-c', 'pgrep -c mpv || true'], { encoding: 'utf8' })
    expect((probe.stdout ?? '').trim()).toBe('0')
  }, 180_000)

  it('本地历史与统计记下这次会话', () => {
    const history = runCli(home, ['history', '--json'])
    expect(history.status).toBe(0)
    expect(history.json().records.length).toBeGreaterThanOrEqual(2)
    const stats = runCli(home, ['stats', '--json'])
    expect(stats.status).toBe(0)
    expect(stats.json().plays.tracks).toBeGreaterThanOrEqual(2)
  })

  it.skipIf(!which('script'))(
    'PTY 里按 q 能退出播放会话',
    () => {
      const pty = spawnSync(
        'sh',
        [
          '-c',
          `(sleep 1.5; printf 'q') | script -qec "QISHUI_MPV_ARGS=--ao=null NO_COLOR=1 ${process.execPath} ${CLI} --data-dir ${home} play track:${A}" /dev/null`,
        ],
        { encoding: 'utf8', timeout: 60_000, env: { ...process.env, NO_COLOR: '1' } },
      )
      expect(pty.status).toBe(0)
      expect(pty.stdout).toContain('退出播放')
    },
    90_000,
  )
})
