/**
 * 播放会话：core 的 Player 当「播什么/该谁了」的状态机，mpv 子进程当嘴。
 *
 * 数据流（一边一个真相源，不互相猜）：
 *
 * ```
 * core.player.play(tracks) ─► source 事件 ─► MpvSink.start(本地文件|签名地址)
 *        ▲                                        │
 *        │ 曲终/出错（三选一先到者）                │ 真播放位置
 *        └──────── player.next() ◄──── mpv time-pos ┘
 * ```
 *
 *  - 曲终由**两边任一先到**触发推进：core 的时钟到 `durationMs`，或 mpv 到 EOF 自己退出（常更准）；
 *  - 用 mpv 的 `time-pos` 定期校正 core 的时钟（偏差 > 500ms 才纠，避免来回跳）；
 *  - 快捷键（仅 TTY）：空格暂停/继续、n 下一首、p 上一首、←/→ 前后 5 秒、s 随机、r 循环、l 歌词、+/- 音量、q 退出。
 */
import type { Lyrics, PlaySource, QishuiCore, RepeatMode, Track, TrackData } from 'qishui-core'
import { CliError, describeError } from './context.js'
import { duration, trackArtists, trackTitle } from './format.js'
import {
  clearStatusLine,
  dim,
  emit,
  green,
  info,
  isJsonMode,
  isTty,
  print,
  printJson,
  progressBar,
  statusLine,
  truncate,
  warn,
  yellow,
} from './output.js'
import { MpvSink } from './playout.js'

export interface PlaySessionOptions {
  /** false = 只用远程签名地址，不落盘 */
  download: boolean
  /** 只解析并打印本地文件/地址，不起播放进程 */
  printPath: boolean
  shuffle: boolean
  repeat: RepeatMode
  volume: number
  lyrics: boolean
}

export interface PlaySessionResult {
  reason: 'finished' | 'quit' | 'printed'
  played: number
  total: number
  /** 本次会话实际播过的曲目（App 形状） */
  tracks: TrackData[]
}

interface ResolvedSource {
  track: TrackData
  /** cache = 媒体缓存；remote = 签名地址；local = 用户磁盘上的文件（本地库） */
  kind?: 'cache' | 'remote' | 'local'
  path?: string
  url?: string
  mime?: string
  bytes?: number
  durationMs?: number
  expiresAt?: number
  fromCache?: boolean
  error?: string
}

export async function runPlaySession(
  instance: QishuiCore,
  tracks: Track[],
  opts: PlaySessionOptions,
): Promise<PlaySessionResult> {
  const list = tracks.map((track) => track.toJSON()).filter((track): track is TrackData => !!track.id)
  if (!list.length) throw new CliError('没有可播的曲目')

  if (opts.printPath) return await printSources(instance, list, opts)
  return await play(instance, list, opts)
}

/* ------------------------------------------------------------ 只解析不播 */

async function printSources(
  instance: QishuiCore,
  list: TrackData[],
  opts: PlaySessionOptions,
): Promise<PlaySessionResult> {
  const resolved: ResolvedSource[] = []
  for (const track of list) {
    try {
      const source = await instance.media.resolve(track, { download: opts.download })
      resolved.push({
        track: source.track,
        kind: source.kind,
        path: source.path,
        url: source.url,
        mime: source.mime,
        bytes: source.bytes,
        durationMs: source.durationMs,
        expiresAt: source.expiresAt,
        fromCache: source.fromCache,
      })
    } catch (err) {
      resolved.push({ track, error: describeError(err).message })
    }
  }
  emit(
    () => {
      for (const item of resolved) {
        print(`${green('♪')} ${trackTitle(item.track)} ${dim('—')} ${dim(trackArtists(item.track))}`)
        if (item.error) print(`    ${yellow('拿不到播放地址')} ${dim(item.error)}`)
        else if (item.path) print(`    ${item.path} ${item.fromCache ? dim('（命中缓存）') : ''}`)
        else if (item.url) print(`    ${item.url}`)
      }
      const cached = resolved.filter((item) => item.kind === 'cache').length
      print(dim(`${resolved.length} 首，其中本地已就绪 ${cached} 首`))
    },
    { tracks: resolved },
  )
  return { reason: 'printed', played: 0, total: list.length, tracks: list }
}

/* ------------------------------------------------------------ 播放会话 */

async function play(instance: QishuiCore, list: TrackData[], opts: PlaySessionOptions): Promise<PlaySessionResult> {
  const player = instance.player
  const sink = new MpvSink({ logger: instance.logger })
  sink.assertAvailable()

  player.setRepeat(opts.repeat)
  player.setShuffle(opts.shuffle)
  player.setVolume(opts.volume)

  let quitting = false
  let activeGen = -1
  let mpvPosition: number | undefined
  let mpvDuration: number | undefined
  let lyrics: Lyrics | undefined
  let lyricIndex = -1
  let showLyrics = opts.lyrics
  const played: TrackData[] = []
  let finish: (reason: 'finished' | 'quit') => void = () => {}
  const finished = new Promise<'finished' | 'quit'>((resolve) => {
    finish = resolve
  })

  const say = (line: string): void => {
    if (isJsonMode()) return
    clearStatusLine()
    print(line)
  }

  const redraw = (): void => {
    const state = player.state
    if (!state.track || state.status === 'idle') return
    const position = mpvPosition ?? state.positionMs
    // 元数据时长和真实音频可能不一致（试听片段、CDN 转码），以 mpv 报的为准来画进度条
    const total = mpvDuration ?? state.durationMs ?? 0
    const icon = state.status === 'paused' ? yellow('⏸') : state.status === 'loading' ? dim('…') : green('▶')
    const flags = `vol ${Math.round(state.volume * 100)}%  r:${state.repeat}${state.shuffle ? '  s:on' : ''}`
    statusLine(
      `${icon} ${truncate(trackTitle(state.track), 30)}  ` +
        `${dim(duration(position))} ${progressBar(total ? position / total : 0, 18)} ${dim(duration(total))}  ` +
        dim(downloading ? `${downloading}  ${flags}` : flags),
    )
  }

  /**
   * 冷下载（开着 `download`、这一首还没落盘）时把字节数挂到状态行：不给这一下进度，
   * 「按了播放但十几秒没声音、光标也停着」和卡死分不清。拿到源就清掉。
   */
  let downloading: string | undefined
  const playOpts = {
    download: opts.download,
    onProgress: (progress: { phase: string; received: number; total?: number }): void => {
      if (isJsonMode() || progress.phase !== 'audio') return
      const mb = (n: number): string => `${(n / 1024 / 1024).toFixed(1)}MB`
      downloading = progress.total
        ? `下载 ${mb(progress.received)}/${mb(progress.total)}`
        : `下载 ${mb(progress.received)}`
      redraw()
    },
  }

  const startSink = async (source: PlaySource): Promise<void> => {
    let generation: number | undefined
    try {
      generation = await sink.start(source, { volume: player.volume, rate: player.rate })
      activeGen = generation
    } catch (err) {
      say(`${yellow('!')} 起播放进程失败：${describeError(err).message}`)
      return
    }
    // 起来就死了（URL 坏了 / 编解码不支持）：这时上面那个 exit 事件已经发过、被忽略了，这里补一次推进
    if (!quitting && activeGen === generation && !sink.running) {
      activeGen = -1
      warn(`播放进程立刻退出：${sink.lastStderr() || '无输出'}`)
      void player.next(playOpts)
    }
  }

  const release = (): void => {
    if (!isTty() || !process.stdin.isTTY) return
    try {
      process.stdin.setRawMode(false)
    } catch {
      /* 已经不是 raw 了 */
    }
    process.stdin.pause()
  }

  const quit = async (reason: 'finished' | 'quit'): Promise<void> => {
    if (quitting) return
    quitting = true
    detachKeys()
    release()
    clearInterval(timer)
    await sink.stop()
    if (reason === 'quit') player.stop()
    clearStatusLine()
    finish(reason)
  }

  let detachKeys: () => void = () => {}

  /* 事件订阅 */
  player.on('track', ({ track }) => {
    if (!track) return
    played.push(track)
    lyrics = undefined
    lyricIndex = -1
    mpvPosition = undefined
    mpvDuration = undefined
    say(
      `${green('▶')} ${trackTitle(track)} ${dim('—')} ${dim(trackArtists(track))}  ${dim(duration(track.durationMs))}`,
    )
    void (async () => {
      try {
        lyrics = await player.lyricsFor(track)
      } catch (err) {
        instance.logger(`[cli] 歌词加载失败：${String(err)}`)
      }
    })()
  })

  player.on('source', ({ source }) => {
    downloading = undefined
    void startSink(source)
  })

  player.on('status', ({ status }) => {
    // 开始解下一首就把上一首的下载数清掉（`loading` 是 `startCurrent` 的第一步）
    if (status === 'loading') downloading = undefined
    if (status === 'paused') void sink.pause(true)
    else if (status === 'playing') void sink.pause(false)
    if ((status === 'stopped' || status === 'idle') && !quitting) void quit('finished')
  })

  player.on('error', ({ error, track }) => {
    say(`${yellow('!')} ${track ? trackTitle(track) : '当前曲目'} 播不了：${describeError(error).message}`)
  })

  sink.onExit = ({ generation, code }) => {
    if (generation !== activeGen) return
    activeGen = -1
    if (quitting) return
    const status = player.status
    if (status !== 'playing' && status !== 'paused') return
    // mpv 自己结束了（EOF 或出错）：比 core 的时钟更早知道，直接推进。
    // 元数据时长常常比真实音频长（试听片段/转码），只靠 core 的时钟会在歌播完后空转，所以这里必须兜住。
    const state = player.state
    const position = mpvPosition ?? state.positionMs
    const early = state.durationMs > 0 && position < state.durationMs - 3000
    if (code !== 0) warn(`播放进程以 code=${code} 退出：${sink.lastStderr() || '无输出'}`)
    else if (early) info('播放进程提前结束（按 EOF 处理）')
    void (async () => {
      const advanced = await player.next(playOpts)
      if (!advanced && !quitting) {
        // 队列到头（单曲/最后一张）：core 的时钟不一定会走完，会话就到这里
        say(dim('队列播放完毕'))
        await quit('finished')
      }
    })()
  }

  /* 进度循环：每 400ms 取一次 mpv 的真位置，必要时校正 core 的时钟 */
  const timer = setInterval(() => {
    void (async () => {
      if (sink.ipcEnabled) {
        const pos = await sink.timePosMs()
        if (pos !== undefined) {
          mpvPosition = pos
          const drift = Math.abs(pos - player.positionMs)
          if (player.status === 'playing' && drift > 500) player.seek(pos)
        }
        mpvDuration ??= await sink.durationMs()
      }
      if (showLyrics && lyrics) {
        // 歌词时间轴是整曲的；试听片段要加上片段起点（core 已把起点放在 PlaySource 上）
        const raw = mpvPosition ?? player.positionMs
        const view = lyrics.view(raw + player.clipStartMs)
        if (view.index !== lyricIndex) {
          lyricIndex = view.index
          const line = view.line?.text
          if (line) {
            clearStatusLine()
            print(`${dim('♪')} ${line}`)
          }
        }
      }
      redraw()
    })()
  }, 400)

  /* 键盘 */
  if (isTty() && process.stdin.isTTY) {
    process.stdin.setRawMode(true)
    process.stdin.resume()
    const seek = (deltaMs: number): void => {
      const state = player.state
      const target = Math.max(0, Math.min(state.positionMs + deltaMs, state.durationMs || Number.MAX_SAFE_INTEGER))
      player.seek(target)
      mpvPosition = target
      lyricIndex = -1
      void sink.seek(target)
    }
    const cycleRepeat = (): void => {
      const order: RepeatMode[] = ['off', 'all', 'one']
      const nextMode = order[(order.indexOf(player.state.repeat) + 1) % order.length]
      player.setRepeat(nextMode)
      say(dim(`循环：${nextMode}`))
    }
    const setVolume = (delta: number): void => {
      const volume = Math.max(0, Math.min(1, player.volume + delta))
      player.setVolume(volume)
      void sink.setVolume(volume)
      say(dim(`音量：${Math.round(volume * 100)}%`))
    }
    // 按键触发的续播/换曲都是异步的：断网时按 `n` 就是「拿不到播放源」。
    // 不接住就成 unhandled rejection——Node 甩一坨堆栈直接退出，终端还卡在 raw mode。
    const runQuietly = (task: Promise<unknown>): void => {
      task.catch((err: unknown) => warn(err instanceof Error ? err.message : String(err)))
    }
    const onKey = (chunk: Buffer): void => {
      const key = chunk.toString()
      switch (key) {
        case 'q':
        case '\u0003': // Ctrl+C
          say(dim('退出播放'))
          void quit('quit')
          return
        case ' ':
          runQuietly(player.toggle(playOpts))
          return
        case 'n':
        case '.':
          runQuietly(player.next(playOpts))
          return
        case 'p':
        case ',':
          runQuietly(player.previous(playOpts))
          return
        case 's': {
          const on = !player.state.shuffle
          player.setShuffle(on)
          say(dim(`随机播放：${on ? '开' : '关'}`))
          return
        }
        case 'r':
          cycleRepeat()
          return
        case 'l':
          showLyrics = !showLyrics
          lyricIndex = -1
          say(dim(`歌词：${showLyrics ? '开' : '关'}`))
          return
        case '+':
        case '=':
          setVolume(0.05)
          return
        case '-':
        case '_':
          setVolume(-0.05)
          return
        case '\u001b[C': // →
          seek(5000)
          return
        case '\u001b[D': // ←
          seek(-5000)
          return
        default:
          return
      }
    }
    process.stdin.on('data', onKey)
    detachKeys = () => process.stdin.off('data', onKey)
  } else if (!isJsonMode()) {
    print(dim('（非交互终端：不出快捷键，进度也不会覆盖输出）'))
  }

  if (!isJsonMode()) {
    print(
      dim(
        `${list.length} 首入队${opts.shuffle ? '（已随机）' : ''}${opts.repeat === 'off' ? '' : `，循环 ${opts.repeat}`}`,
      ),
    )
    if (isTty() && process.stdin.isTTY)
      print(
        dim('快捷键：空格 暂停/继续 · n 下一首 · p 上一首 · ←/→ ±5s · s 随机 · r 循环 · l 歌词 · +/- 音量 · q 退出'),
      )
  }

  const sigint = (): void => {
    void quit('quit')
  }
  process.on('SIGINT', sigint)

  let reason: 'finished' | 'quit'
  try {
    await player.play(list, playOpts)
    reason = await finished
  } finally {
    // `play()` 抛错（第一首就解析不到地址是最常见的一种）也必须把现场收干净：
    // 不然 stdin 留在 raw mode（终端看起来坏了，得 `reset` 才恢复）、mpv 还在后台出声。
    process.off('SIGINT', sigint)
    detachKeys()
    clearInterval(timer)
    release()
    await sink.stop()
    clearStatusLine()
  }

  const result: PlaySessionResult = { reason, played: played.length, total: list.length, tracks: played }
  if (isJsonMode()) printJson(result)
  else {
    const stats = instance.playStats()
    info(`本次播了 ${played.length}/${list.length} 首（本地累计 ${stats.tracks} 首 / ${stats.records} 次播放）`)
  }
  return result
}
