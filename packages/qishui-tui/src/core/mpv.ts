/**
 * 出声：把 core 解析出来的播放源喂给 **mpv 子进程**（core 的 Player 只管状态，不出声）。
 *
 * 只保留 TUI 需要的几个动作：起播 / 暂停 / seek / 音量 / 收尾。走 mpv 的 JSON IPC，
 * 这样暂停/拖动作用在真播放器上，而不是只停我们自己的时钟。
 * 换播放器：`QISHUI_PLAYER=ffplay`、`QISHUI_MPV_ARGS=--ao=null`（无音频设备的环境）。
 */
import { type ChildProcess, spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'

export interface AudioSource {
  /** cache = 媒体缓存里的文件；remote = 签名地址；local = 用户磁盘上的文件（本地库） */
  kind: 'cache' | 'remote' | 'local'
  path?: string
  url?: string
}

let seq = 0

/**
 * 进程退出兜底：TUI 正常退出（q / Ctrl+C）时把还在跑的 mpv 收掉。
 * `process.on('exit')` 里只能同步调用，所以直接 SIGKILL；
 * 被 SIGKILL 掉自己（或进程组）时救不了，那属于外部强杀。
 */
const liveChildren = new Set<ChildProcess>()
let exitHooked = false

function trackChild(child: ChildProcess): void {
  liveChildren.add(child)
  child.on('exit', () => liveChildren.delete(child))
  if (exitHooked) return
  exitHooked = true
  process.on('exit', () => {
    for (const c of liveChildren) {
      try {
        c.kill('SIGKILL')
      } catch {
        /* 已经没了 */
      }
    }
    liveChildren.clear()
  })
}

/** mpv 的 JSON IPC（换行分隔的一问一答） */
class Ipc {
  private buffer = ''
  private id = 0
  private readonly pending = new Map<number, (data: unknown, error?: string) => void>()

  private constructor(private readonly socket: net.Socket) {
    socket.setEncoding('utf8')
    socket.on('data', (chunk: string) => this.feed(chunk))
    socket.on('error', () => this.fail())
    socket.on('close', () => this.fail())
  }

  static async connect(file: string, timeoutMs = 3000): Promise<Ipc> {
    const socket = await new Promise<net.Socket>((resolve, reject) => {
      const attempt = (n: number): void => {
        const client = net.connect(file)
        client.once('connect', () => resolve(client))
        client.once('error', (err) => {
          client.destroy()
          if (n * 40 >= timeoutMs) reject(err)
          else setTimeout(() => attempt(n + 1), 40)
        })
      }
      attempt(1)
    })
    return new Ipc(socket)
  }

  private feed(chunk: string): void {
    this.buffer += chunk
    let index = this.buffer.indexOf('\n')
    while (index >= 0) {
      const line = this.buffer.slice(0, index).trim()
      this.buffer = this.buffer.slice(index + 1)
      index = this.buffer.indexOf('\n')
      if (!line) continue
      try {
        const msg = JSON.parse(line) as { request_id?: number; error?: string; data?: unknown }
        if (msg.request_id !== undefined) {
          const cb = this.pending.get(msg.request_id)
          this.pending.delete(msg.request_id)
          cb?.(msg.data, msg.error === 'success' ? undefined : (msg.error ?? 'error'))
        }
      } catch {
        /* 非 JSON 行忽略 */
      }
    }
  }

  private fail(): void {
    for (const cb of this.pending.values()) cb(undefined, 'ipc closed')
    this.pending.clear()
  }

  command(command: unknown[]): Promise<unknown> {
    const rid = ++this.id
    return new Promise((resolve) => {
      this.pending.set(rid, (data) => resolve(data))
      this.socket.write(`${JSON.stringify({ command, request_id: rid })}\n`)
    })
  }

  close(): void {
    this.fail()
    this.socket.destroy()
  }
}

export class AudioSink {
  readonly command: string
  private readonly extraArgs: string[]
  private child?: ChildProcess
  private ipc?: Ipc
  private socketPath?: string
  private available?: boolean
  private generation = 0
  private ipcFailed = false
  /** 起播失败（找不到播放器 / 没地址）时的一次性提示 */
  onError?: (message: string) => void
  /** 非预期退出（EOF / 解码失败）时回调；正常收尾（stop/换曲）的退出用 generation 过滤掉 */
  onExit?: (info: { code: number | null; generation: number }) => void

  constructor() {
    this.command = process.env.QISHUI_PLAYER ?? 'mpv'
    this.extraArgs = process.env.QISHUI_MPV_ARGS ? process.env.QISHUI_MPV_ARGS.split(/\s+/).filter(Boolean) : []
  }

  isAvailable(): boolean {
    this.available ??= spawnSync(this.command, ['--version'], { stdio: 'ignore' }).status === 0
    return this.available
  }

  get running(): boolean {
    return !!this.child && this.child.exitCode === null && !this.child.killed
  }

  /** IPC 是否可用：不可用时暂停/拖动/真实进度都没有，退回 core 的时钟 */
  get ipcEnabled(): boolean {
    return !!this.ipc && !this.ipcFailed
  }

  get generationId(): number {
    return this.generation
  }

  /** 起一首，返回本次的 generation（配合 `onExit` 判断「这一首」的退出） */
  async start(source: AudioSource, opts: { startAtMs?: number; volume?: number } = {}): Promise<number> {
    // 同步收掉上一首再起新的：频繁切歌时多次 start 会并发进来，
    // 如果这里用 `await stop()`，两个 start 会交错、同时留下两个 mpv 进程。
    this.terminate()
    const generation = ++this.generation
    this.ipcFailed = false
    if (!this.isAvailable()) {
      this.onError?.(`找不到播放器：${this.command}（装 mpv，或用 QISHUI_PLAYER 指定）`)
      return generation
    }
    // 只有 remote 走签名地址，cache / local 都是磁盘上的文件
    const target = source.kind === 'remote' ? source.url : source.path
    if (!target) {
      this.onError?.('这个播放源既没有本地文件也没有远程地址')
      return generation
    }
    const socketPath = path.join(os.tmpdir(), `qishui-tui-mpv-${process.pid}-${++seq}.sock`)
    this.socketPath = socketPath
    const args = [
      '--no-video',
      '--no-terminal',
      '--really-quiet',
      '--no-config',
      '--msg-level=all=error',
      '--idle=no',
      ...this.extraArgs,
      `--input-ipc-server=${socketPath}`,
    ]
    if (opts.startAtMs && opts.startAtMs > 0) args.push(`--start=${(opts.startAtMs / 1000).toFixed(3)}`)
    if (opts.volume !== undefined) args.push(`--volume=${Math.round(Math.max(0, Math.min(1, opts.volume)) * 100)}`)
    args.push(target)

    const child = spawn(this.command, args, { stdio: ['ignore', 'ignore', 'pipe'] })
    this.child = child
    trackChild(child)
    child.on('error', (err) => this.onError?.(String(err)))
    child.on('exit', (code) => {
      if (generation !== this.generation) return
      this.child = undefined
      this.ipc?.close()
      this.ipc = undefined
      this.unlinkSocket(socketPath)
      this.onExit?.({ code, generation })
    })
    try {
      const ipc = await Ipc.connect(socketPath)
      // 连 IPC 期间可能已经被下一次 start 顶掉了：别把旧 socket 挂到新进程上
      if (generation !== this.generation) {
        ipc.close()
        return generation
      }
      this.ipc = ipc
    } catch {
      // IPC 不可用：只播不管，进度仍由 core 的时钟提供
      if (generation === this.generation) this.ipcFailed = true
    }
    return generation
  }

  async pause(paused: boolean): Promise<void> {
    await this.ipc?.command(['set_property', 'pause', paused])
  }

  async seek(ms: number): Promise<void> {
    await this.ipc?.command(['seek', Math.max(0, ms / 1000), 'absolute'])
  }

  async setVolume(volume: number): Promise<void> {
    await this.ipc?.command(['set_property', 'volume', Math.round(Math.max(0, Math.min(1, volume)) * 100)])
  }

  async setRate(rate: number): Promise<void> {
    await this.ipc?.command(['set_property', 'speed', rate])
  }

  /** 真实播放位置（ms）；IPC 不可用时返回 undefined，退回 core 的时钟 */
  async timePosMs(): Promise<number | undefined> {
    const value = await this.ipc?.command(['get_property', 'time-pos'])
    return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value * 1000) : undefined
  }

  /** 真实音频时长（ms）；试听片段就是片段长度 */
  async durationMs(): Promise<number | undefined> {
    const value = await this.ipc?.command(['get_property', 'duration'])
    return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value * 1000 : undefined
  }

  async stop(): Promise<void> {
    const child = this.child
    const ipc = this.ipc
    const socketPath = this.socketPath
    this.generation++
    this.child = undefined
    this.ipc = undefined
    this.socketPath = undefined
    if (child) await Promise.race([ipc?.command(['quit']).catch(() => undefined), delay(120)])
    ipc?.close()
    this.unlinkSocket(socketPath)
    if (!child) return
    if (child.exitCode === null) {
      child.kill('SIGTERM')
      await delay(120)
      if (child.exitCode === null) child.kill('SIGKILL')
    }
  }

  /**
   * 同步、无条件地干掉当前进程（不等待退出）。
   * 换曲路径用它：`start()` 的第一件事就是 terminate，保证任何时刻最多只有一个 mpv 在响。
   */
  private terminate(): void {
    const child = this.child
    const ipc = this.ipc
    const socketPath = this.socketPath
    this.generation++
    this.child = undefined
    this.ipc = undefined
    this.socketPath = undefined
    ipc?.close()
    this.unlinkSocket(socketPath)
    if (child && child.exitCode === null) {
      try {
        child.kill('SIGKILL')
      } catch {
        /* 已经没了 */
      }
    }
  }

  private unlinkSocket(socketPath?: string): void {
    if (!socketPath) return
    try {
      fs.unlinkSync(socketPath)
    } catch {
      /* 已经不在了 */
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
