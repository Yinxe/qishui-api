/**
 * CLI 播放链路（全离线）：seedTrack 预置「实体缓存 + 媒体缓存」后，
 * 队列/--print-path/download/cache 都应零网络；mpv 分节起真进程（--ao=null 不出声）。
 * mpv 或 script(1) 不在本机时对应分节跳过。
 */
import { spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { CLI, makeCliHome, rmDir, runCli, seedTrack, which } from './support/cli.js'

// 起真 mpv 的分节一条用例就要十几秒，默认 5 秒根本不够
vi.setConfig({ testTimeout: 60_000 })

const A = '7100000000000000001'
const B = '7100000000000000002'
/** 8 秒的一首：只给「管道掐断」那条用——要的是「远没播完就被掐死」这个前提 */
const C = '7100000000000000003'

let home: string

/**
 * 本机此刻还活着的「CLI 播放器」pid。
 * 只认 cmdline 里带 CLI 专属 socket 名（`qishui-mpv-*`）的 mpv——TUI 的是 `qishui-tui-mpv-*`，
 * 用户自己开着 TUI 听歌时不会误伤（早先直接 `pgrep -c mpv` 数全系统的 mpv，必然误报）。
 */
function livePlayers(): Set<string> {
  const probe = spawnSync('sh', ['-c', 'pgrep mpv || true'], { encoding: 'utf8' })
  const pids = (probe.stdout ?? '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
  const found = new Set<string>()
  for (const pid of pids) {
    const args = spawnSync('sh', ['-c', `ps -o args= -p ${pid} || true`], { encoding: 'utf8' })
    if ((args.stdout ?? '').includes('qishui-mpv-')) found.add(pid)
  }
  return found
}

/** 某个进程在 `/tmp` 留下的 mpv socket（名字里的 pid 就是它自己的 pid） */
function socketsOf(pid: number | undefined): string[] {
  if (!pid) return []
  return fs.readdirSync(os.tmpdir()).filter((f) => f.startsWith(`qishui-mpv-${pid}-`))
}

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
    const before = livePlayers()
    const played = runCli(home, ['play', `track:${A}`, `track:${B}`, '--json'], {
      env: { QISHUI_MPV_ARGS: '--ao=null' },
      timeoutMs: 120_000,
    })
    expect(played.status).toBe(0)
    const result = played.json()
    expect(result.played).toBe(2)
    expect(result.reason).toBe('finished')
    // 只验「这一跑没留下新的播放器」，系统里既有的 mpv（比如用户正开着的 TUI）不算
    const leaked = [...livePlayers()].filter((pid) => !before.has(pid))
    expect(leaked).toEqual([])
  }, 180_000)

  it('本地历史与统计记下这次会话', () => {
    const history = runCli(home, ['history', '--json'])
    expect(history.status).toBe(0)
    expect(history.json().records.length).toBeGreaterThanOrEqual(2)
    const stats = runCli(home, ['stats', '--json'])
    expect(stats.status).toBe(0)
    expect(stats.json().plays.tracks).toBeGreaterThanOrEqual(2)
  })

  it('stdout 管道被掐断（`play … | head`）时 CLI 立刻退场，不挂住也不留残渣', async () => {
    const before = livePlayers()
    // 8 秒的一首：既要长过「掐管道 → 进程死」这段，又要短到自然播完不可能冒充成断言通过
    seedTrack(home, C, '曲目C', 8)
    const startedAt = Date.now()
    const child = spawn(process.execPath, [CLI, '--data-dir', home, 'play', `track:${C}`], {
      env: { ...process.env, QISHUI_MPV_ARGS: '--ao=null', NO_COLOR: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    // 收到第一帧就关掉读端：CLI 下一笔往 stdout 写就拿 EPIPE——这正是 `| head -3` 的走法。
    // 实测：管道模式下进程死在 ~470ms，**播放器还没起来**（起播放前的那几行就是最后一笔写），
    // 所以这条只证「不挂住、不留 mpv/socket」；「播放器还在放时异常退场」由下一条专门测。
    child.stdout?.once('data', () => child.stdout?.destroy())
    const closed = await new Promise<number | null>((resolve) => child.once('close', (code) => resolve(code)))
    expect(Date.now() - startedAt).toBeLessThan(5_000)
    expect(closed).not.toBe(0)
    await new Promise((resolve) => setTimeout(resolve, 600))
    expect([...livePlayers()].filter((pid) => !before.has(pid))).toEqual([])
    expect(socketsOf(child.pid)).toEqual([])
  }, 60_000)

  it('播放器还在放、进程却异常退场时，既不留出声的 mpv 也不留它的 socket', async () => {
    const before = livePlayers()
    seedTrack(home, C, '曲目C', 8)
    const driver = path.join(home, 'abrupt-exit.mjs')
    // 直接拿 sink 起一首再 `process.exit()`：这是「事件循环还活着、却没人调 stop()」最干净的写法
    //（`finally`/SIGINT 那两条收尾路都跳过去了，`exit` 兜底是剩下的唯一时机）。
    fs.writeFileSync(
      driver,
      `import { MpvSink } from ${JSON.stringify(path.join(path.dirname(CLI), 'playout.js'))}
const sink = new MpvSink()
await sink.start({ kind: 'cache', path: process.argv[2], fromCache: true, track: { id: 'x', name: 'x', artists: [] } })
process.stdout.write('READY\\n')
process.stdin.once('data', () => process.exit(1))
process.stdin.resume()
`,
    )
    const child = spawn(process.execPath, [driver, path.join(home, 'cache', 'tracks', C, 'audio.wav')], {
      env: { ...process.env, QISHUI_MPV_ARGS: '--ao=null', NO_COLOR: '1' },
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    const ready = await new Promise<boolean>((resolve) => {
      const timer = setTimeout(() => resolve(false), 20_000)
      child.stdout?.on('data', (chunk: Buffer) => {
        if (chunk.toString().includes('READY')) {
          clearTimeout(timer)
          resolve(true)
        }
      })
    })
    expect(ready).toBe(true)
    // 先证明「确实还在放」，否则下面两条又是空过
    expect([...livePlayers()].filter((pid) => !before.has(pid)).length).toBeGreaterThan(0)
    child.stdin?.write('go\n')
    const closed = await new Promise<number | null>((resolve) => child.once('close', (code) => resolve(code)))
    expect(closed).toBe(1)
    await new Promise((resolve) => setTimeout(resolve, 600))
    expect([...livePlayers()].filter((pid) => !before.has(pid))).toEqual([])
    expect(socketsOf(child.pid)).toEqual([])
  }, 60_000)

  it('正常播完一首也会把自己在 `/tmp` 的 socket 摘掉', async () => {
    seedTrack(home, C, '曲目C', 2)
    const child = spawn(process.execPath, [CLI, '--data-dir', home, 'play', `track:${C}`], {
      env: { ...process.env, QISHUI_MPV_ARGS: '--ao=null', NO_COLOR: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    child.stdout?.resume()
    const closed = await new Promise<number | null>((resolve) => child.once('close', (code) => resolve(code)))
    expect(closed).toBe(0)
    // mpv 自己不留（它是被 `quit`/SIGTERM 收的、或是走到文件尾），会话那套收尾也常常来不及——
    // 实测过「没兜底时每播一首攒一个」，所以这一条盯的就是最普通的那次运行
    expect(socketsOf(child.pid)).toEqual([])
  }, 60_000)

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
