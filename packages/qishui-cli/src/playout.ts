/**
 * 出声：把 core 解析出来的播放源喂给 **mpv 子进程**（core 的 Player 只管状态，不管出声）。
 *
 * 为什么选 mpv 子进程 + JSON IPC（本机实测 mpv v0.40 可用）：
 *  - 本地缓存文件（`cache/tracks/<id>/audio.m4a`）和远程签名地址 mpv 都能直接播；
 *  - `--input-ipc-server` 给的 unix socket 上能查 `time-pos`/`duration`、能 `pause`/`seek`/`quit`，
 *    这样暂停/拖动/进度条都是真播放器的真状态，不是估的；
 *  - 拿不到 IPC（比如换了个不支持的老 mpv）就退化成纯播放，进度仍由 core 的时钟提供。
 *
 * 想换播放器：`QISHUI_PLAYER=ffplay`、`QISHUI_MPV_ARGS=--ao=null`（无音频设备的环境用这个）。
 */
import { type ChildProcess, spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import type { PlaySource } from 'qishui-core'
import { CliError } from './context.js'

export interface SinkStartOptions {
  /** 从指定位置开始（ms） */
  startAtMs?: number
  /** 0..1 */
  volume?: number
  rate?: number
}

export interface MpvSinkOptions {
  /** 播放器命令，默认 `$QISHUI_PLAYER` 或 `mpv` */
  command?: string
  /** 追加参数，默认取 `$QISHUI_MPV_ARGS`（空白分隔） */
  extraArgs?: string[]
  logger?: (line: string) => void
  /** 关掉 IPC（只播不管） */
  ipc?: boolean
}

interface IpcMessage {
  request_id?: number
  error?: string
  data?: unknown
  event?: string
}

let socketSeq = 0

/** mpv 的 JSON IPC 客户端（换行分隔的一问一答） */
class MpvIpc {
  private buffer = ''
  private requestId = 0
  private readonly pending = new Map<number, (msg: IpcMessage) => void>()

  private constructor(private readonly socket: net.Socket) {
    socket.setEncoding('utf8')
    socket.on('data', (chunk: Buffer | string) => this.feed(chunk.toString()))
    socket.on('error', () => this.rejectAll(new Error('mpv IPC 连接断开')))
    socket.on('close', () => this.rejectAll(new Error('mpv IPC 已关闭')))
  }

  static async connect(socketPath: string, timeoutMs = 3000): Promise<MpvIpc> {
    const socket = await new Promise<net.Socket>((resolve, reject) => {
      const tryConnect = (attempt: number): void => {
        const client = net.connect(socketPath)
        client.once('connect', () => resolve(client))
        client.once('error', (err) => {
          client.destroy()
          if (attempt * 40 >= timeoutMs) reject(err)
          else setTimeout(() => tryConnect(attempt + 1), 40)
        })
      }
      tryConnect(1)
    })
    return new MpvIpc(socket)
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
        const msg = JSON.parse(line) as IpcMessage
        if (msg.request_id !== undefined) {
          const resolve = this.pending.get(msg.request_id)
          this.pending.delete(msg.request_id)
          resolve?.(msg)
        }
        // 没有 request_id 的（property-change 等）主动事件：这里不订阅，直接忽略
      } catch {
        /* 不是 JSON 的行忽略 */
      }
    }
  }

  private rejectAll(err: Error): void {
    for (const resolve of this.pending.values()) resolve({ error: err.message })
    this.pending.clear()
  }

  command(command: unknown[]): Promise<IpcMessage> {
    const requestId = ++this.requestId
    return new Promise<IpcMessage>((resolve) => {
      this.pending.set(requestId, resolve)
      this.socket.write(JSON.stringify({ command, request_id: requestId }) + '\n')
    })
  }

  async getProperty<T = unknown>(name: string): Promise<T | undefined> {
    const reply = await this.command(['get_property', name])
    return reply.error === 'success' ? (reply.data as T) : undefined
  }

  async setProperty(name: string, value: unknown): Promise<boolean> {
    const reply = await this.command(['set_property', name, value])
    return reply.error === 'success'
  }

  close(): void {
    this.rejectAll(new Error('mpv IPC 已关闭'))
    this.socket.destroy()
  }
}

/**
 * mpv 播放进程。**同一时刻只管一首**：`start()` 会先把上一首收掉再起新的。
 */
export class MpvSink {
  readonly command: string
  readonly extraArgs: string[]

  /** 非预期退出（网络断、解码失败…）时回调；正常曲终退出也会回调，由上层决定怎么处理 */
  onExit?: (info: { code: number | null; signal: NodeJS.Signals | null; expected: boolean; generation: number }) => void

  private child?: ChildProcess
  private ipc?: MpvIpc
  private socketPath?: string
  private generation = 0
  private expectedExit = false
  private stderrTail: string[] = []
  private ipcFailed = false
  /** 本机有没有这个播放器（跑一次 `--version`，结果缓存在对象上） */
  private available?: boolean

  constructor(private readonly options: MpvSinkOptions = {}) {
    this.command = options.command ?? process.env.QISHUI_PLAYER ?? 'mpv'
    this.extraArgs =
      options.extraArgs ?? (process.env.QISHUI_MPV_ARGS ? process.env.QISHUI_MPV_ARGS.split(/\s+/).filter(Boolean) : [])
    // 兜底：上层那套收尾（`finally` 里的 `stop()`）只在「正常/异常但事件循环还活着」时跑得到。
    // 管道被 `qishui play --json | head -3` 这种掐断时，stdout 的 EPIPE 是条未捕获异常——进程当场就没了，
    // `finally` 与 SIGINT 都来不及，而 mpv 是**子进程**、不会跟着没（于是「命令早退了、歌还在放」）。
    // `exit` 是唯一的最后时机：那里只能同步杀。
    // 顺带管 socket：实测「正常播完一首」也常常是进程先结束、`child.on('exit')` 那笔 unlink 排在后面，
    // 于是每听一首就在 `/tmp` 留一个 `qishui-mpv-*.sock`。
    process.on('exit', this.exitHook)
  }

  private readonly exitHook = (): void => {
    // socket 在这里删一次（不只靠 `stop()`/子进程退出回调）：被 `SIGKILL` 掉的 mpv 不会自己摘，
    // 而正常收尾那条路也来不及（见上）
    this.cleanupSocket()
    const child = this.child
    if (!child || child.exitCode !== null) return
    try {
      child.kill('SIGKILL')
    } catch {
      /* 进程已经不在了 */
    }
  }

  private log(line: string): void {
    this.options.logger?.(line)
  }

  isAvailable(): boolean {
    this.available ??= spawnSync(this.command, ['--version'], { stdio: 'ignore' }).status === 0
    return this.available
  }

  assertAvailable(): void {
    if (this.isAvailable()) return
    throw new CliError(
      `找不到可用的播放器：${this.command}`,
      '装 mpv（`sudo apt install mpv`），或用 `QISHUI_PLAYER=<命令>` 指定，或加 `--print-path` 只输出本地文件/地址',
    )
  }

  get running(): boolean {
    return !!this.child && this.child.exitCode === null && !this.child.killed
  }

  get generationId(): number {
    return this.generation
  }

  /** 起一首，返回本次的 generation（配合 `onExit` 判断"这一首"的退出）。同一时刻只管一首 */
  async start(source: PlaySource, opts: SinkStartOptions = {}): Promise<number> {
    this.assertAvailable()
    await this.stop()

    const generation = ++this.generation
    const target = source.kind === 'cache' ? source.path : source.url
    if (!target) throw new CliError('这个播放源既没有本地文件也没有远程地址')

    const args = ['--no-video', '--no-terminal', '--really-quiet', '--no-config', '--msg-level=all=error', '--idle=no']
    args.push(...this.extraArgs)
    if (this.options.ipc !== false) {
      this.socketPath = path.join(os.tmpdir(), `qishui-mpv-${process.pid}-${++socketSeq}.sock`)
      args.push(`--input-ipc-server=${this.socketPath}`)
    }
    if (opts.startAtMs && opts.startAtMs > 0) args.push(`--start=${(opts.startAtMs / 1000).toFixed(3)}`)
    if (opts.volume !== undefined) args.push(`--volume=${Math.round(Math.max(0, Math.min(1, opts.volume)) * 100)}`)
    if (opts.rate !== undefined && opts.rate !== 1) args.push(`--speed=${opts.rate}`)
    args.push(target)

    this.expectedExit = false
    this.ipcFailed = false
    this.stderrTail = []
    this.log(`mpv ${args.join(' ')}`)

    const child = spawn(this.command, args, { stdio: ['ignore', 'ignore', 'pipe'] })
    this.child = child
    child.stderr?.setEncoding('utf8')
    child.stderr?.on('data', (chunk: Buffer | string) => {
      const line = chunk.toString().trim()
      if (!line) return
      this.stderrTail.push(line)
      if (this.stderrTail.length > 8) this.stderrTail.shift()
    })
    child.on('error', (err) => {
      this.log(`mpv 启动失败：${String(err)}`)
    })
    child.on('exit', (code, signal) => {
      if (generation !== this.generation) return
      this.child = undefined
      this.ipc?.close()
      this.ipc = undefined
      this.cleanupSocket()
      this.onExit?.({ code, signal, expected: this.expectedExit, generation })
    })

    // 等 socket 起来再交还控制权：这样上层立刻就能 pause/seek，不用自己等
    if (this.socketPath) {
      try {
        this.ipc = await MpvIpc.connect(this.socketPath)
      } catch (err) {
        this.ipcFailed = true
        this.log(`mpv IPC 不可用（${String(err)}），退化成只播不管进度`)
      }
    }
    return generation
  }

  /** IPC 是否可用：不可用时暂停/拖动/精确进度都没有，上层退回 core 的时钟 */
  get ipcEnabled(): boolean {
    return !!this.ipc && !this.ipcFailed
  }

  async pause(paused: boolean): Promise<void> {
    await this.ipc?.setProperty('pause', paused)
  }

  async seek(ms: number): Promise<void> {
    await this.ipc?.command(['seek', Math.max(0, ms / 1000), 'absolute'])
  }

  async setVolume(volume: number): Promise<void> {
    await this.ipc?.setProperty('volume', Math.round(Math.max(0, Math.min(1, volume)) * 100))
  }

  async setRate(rate: number): Promise<void> {
    await this.ipc?.setProperty('speed', rate)
  }

  /** 真实播放位置（ms）；IPC 不可用时返回 undefined，由上层退回 core 的时钟 */
  async timePosMs(): Promise<number | undefined> {
    const value = await this.ipc?.getProperty<number>('time-pos')
    return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value * 1000) : undefined
  }

  async durationMs(): Promise<number | undefined> {
    const value = await this.ipc?.getProperty<number>('duration')
    return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value * 1000 : undefined
  }

  /** 收掉当前这首（先礼后兵：quit → SIGTERM → SIGKILL） */
  async stop(): Promise<void> {
    const child = this.child
    this.expectedExit = true
    if (!child) {
      this.cleanupSocket()
      return
    }
    this.child = undefined
    this.generation++

    const exited = new Promise<void>((resolve) => {
      if (child.exitCode !== null) return resolve()
      child.once('exit', () => resolve())
      setTimeout(resolve, 500)
    })

    await this.ipc?.command(['quit'])
    this.ipc?.close()
    this.ipc = undefined
    await exited
    if (child.exitCode === null) {
      child.kill('SIGTERM')
      await new Promise((resolve) => setTimeout(resolve, 200))
      if (child.exitCode === null) child.kill('SIGKILL')
    }
    this.cleanupSocket()
  }

  /** mpv 挂掉前的最后几行 stderr（报错时贴给用户看） */
  lastStderr(): string {
    return this.stderrTail.join('\n')
  }

  private cleanupSocket(): void {
    if (!this.socketPath) return
    try {
      fs.unlinkSync(this.socketPath)
    } catch {
      /* 已经不在了 */
    }
    this.socketPath = undefined
  }
}
