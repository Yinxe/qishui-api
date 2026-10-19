/**
 * 播放与下载。
 *
 * 两个命令共用一套「目标解析」（`src/targets.ts`）：
 *   `qishui play 晴天`（搜索词）· `qishui play liked` · `qishui play playlist:<id>` ·
 *   `qishui play https://…share/track?track_id=…` · `qishui play <trackId>`
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import type { Command } from 'commander'
import { type QishuiCore, type RepeatMode, safeSegment, type Track } from 'qishui-core'
import { CliError, core, describeError, parseCount, parseVolume } from '../context.js'
import { durationLong, trackArtists, trackTitle } from '../format.js'
import { clearStatusLine, dim, emit, green, heading, info, print, statusLine, warn } from '../output.js'
import { runPlaySession } from '../playSession.js'
import { resolveTargets } from '../targets.js'

const REPEATS: RepeatMode[] = ['off', 'all', 'one']

function parseRepeat(value: string): RepeatMode {
  if (!REPEATS.includes(value as RepeatMode)) throw new CliError(`--repeat 只能是 ${REPEATS.join(' / ')}`)
  return value as RepeatMode
}

/** `--list`：列出队列并标出哪些已经在本地缓存里 */
async function listQueue(instance: QishuiCore, tracks: Track[], targets: string[]): Promise<void> {
  const cachedIds = new Set<string>()
  await Promise.all(
    tracks.map(async (track) => {
      if (await instance.media.has(track.id)) cachedIds.add(track.id)
    }),
  )
  let totalMs = 0
  for (const track of tracks) totalMs += track.durationMs ?? 0
  emit(
    () => {
      heading(`播放队列 ${tracks.length} 首`, totalMs ? durationLong(totalMs) : undefined)
      tracks.forEach((track, index) => {
        const cached = cachedIds.has(track.id)
        const prefix = cached ? green('●') : '○'
        print(`${prefix} ${printableTrack(track, index + 1)}`)
      })
      print(dim('● 已缓存（命中缓存时不出网）  ○ 需要时再解析'))
    },
    { targets, tracks, cachedIds: [...cachedIds], totalDurationMs: totalMs },
  )
}

function printableTrack(track: Track, index: number): string {
  return `${dim(String(index).padStart(2) + '.')} ${trackTitle(track.toJSON())} ${dim('—')} ${dim(trackArtists(track.toJSON()))}  ${dim(
    durationLong(track.durationMs ?? 0),
  )}`
}

export function registerPlayCommands(program: Command): void {
  program
    .command('play [targets...]')
    .description('播放（id / 分享链接 / 搜索词 / liked / playlist:<id> / chart:<id> / radio:<id>）')
    .option('--limit <n>', '每个目标最多取几首', '30')
    .option('--shuffle', '随机播放')
    .option('--repeat <mode>', `循环模式：${REPEATS.join('|')}`, 'off')
    .option('--volume <percent>', '音量 0-100', '100')
    .option('--no-cache', '只用远程签名地址，不落盘（下次还得重新解析）')
    .option('--no-lyrics', '不显示歌词')
    .option('--print-path', '只解析并打印本地文件/地址，不出声（给上层播放器用）')
    .option('--list', '只列队列（● 已缓存），不播')
    .action(
      async (
        targets: string[],
        opts: {
          limit: string
          shuffle?: boolean
          repeat: string
          volume: string
          cache: boolean
          lyrics: boolean
          printPath?: boolean
          list?: boolean
        },
      ) => {
        if (!targets?.length) {
          throw new CliError(
            '要播什么？',
            '例：qishui play 晴天 · qishui play liked · qishui play playlist:<id> · qishui play https://…',
          )
        }
        const instance = await core()
        const tracks = await resolveTargets(instance, targets, {
          limit: parseCount(opts.limit, '--limit', { fallback: 30, max: 1000 }),
        })
        if (!tracks.length) throw new CliError('没解析出可播曲目')

        if (opts.list) {
          await listQueue(instance, tracks, targets)
          return
        }

        await runPlaySession(instance, tracks, {
          download: opts.cache !== false,
          printPath: opts.printPath === true,
          shuffle: opts.shuffle === true,
          repeat: parseRepeat(opts.repeat),
          volume: parseVolume(opts.volume),
          lyrics: opts.lyrics !== false,
        })
      },
    )

  program
    .command('download [targets...]')
    .description('把音频落盘到本地缓存（--out 再导出一份成文件）')
    .option('--limit <n>', '每个目标最多取几首', '30')
    .option('--out <dir>', '导出目录（文件名 `<歌手> - <曲名>.m4a`）')
    .option('--all', '连歌词（.lrc 文本）和封面（.jpg）一起导出')
    .action(async (targets: string[], opts: { limit: string; out?: string; all?: boolean }) => {
      if (!targets?.length) throw new CliError('要下什么？', '例：qishui download playlist:<id> --out ~/Music')
      const instance = await core()
      const tracks = await resolveTargets(instance, targets, {
        limit: parseCount(opts.limit, '--limit', { fallback: 30, max: 1000 }),
      })
      if (!tracks.length) throw new CliError('没解析出可下载的曲目')

      if (opts.out) await fs.mkdir(opts.out, { recursive: true })
      const done: { track: unknown; path?: string; bytes?: number; cached: boolean; error?: string }[] = []

      for (const [index, track] of tracks.entries()) {
        const name = trackTitle(track.toJSON())
        const label = `${index + 1}/${tracks.length}`
        try {
          const meta = await instance.media.ensure(track.toJSON(), {
            onProgress: (progress) => {
              const total = progress.total ? `${(progress.total / 1024 / 1024).toFixed(1)}MB` : '?'
              statusLine(
                `${dim(label)} ${name}  ${progress.phase}  ${(progress.received / 1024 / 1024).toFixed(1)}MB / ${total}`,
              )
            },
          })
          clearStatusLine()
          const audioPath = path.join(instance.media.dirOf(track.id), meta.audio.file)
          let exported: string | undefined
          if (opts.out) {
            const base = `${safeSegment(trackArtists(track.toJSON()))} - ${safeSegment(name)}`
            exported = path.join(opts.out, base + path.extname(meta.audio.file))
            await fs.copyFile(audioPath, exported)
            if (opts.all) {
              if (meta.lyrics) {
                const lyrics = await instance.media.lyrics(track.toJSON())
                await fs.writeFile(path.join(opts.out, base + '.lrc'), lyrics?.text ?? '', 'utf8')
              }
              if (meta.cover) {
                await fs.copyFile(
                  path.join(instance.media.dirOf(track.id), meta.cover.file),
                  path.join(opts.out, base + '.jpg'),
                )
              }
            }
          }
          done.push({ track, path: exported ?? audioPath, bytes: meta.audio.bytes, cached: true })
          if (!opts.out) info(`${name}  ${(meta.audio.bytes / 1024 / 1024).toFixed(1)}MB  ${audioPath}`)
        } catch (err) {
          clearStatusLine()
          const message = describeError(err).message
          done.push({ track, cached: false, error: message })
          warn(`${name} 下载失败：${message}`)
        }
      }

      const failed = done.filter((item) => item.error).length
      emit(
        () => {
          heading('下载结果', opts.out ? `导出到 ${opts.out}` : '已落进 core 缓存')
          for (const item of done) {
            const track = item.track as Track
            if (item.error) print(`${dim('✗')} ${trackTitle(track.toJSON())}  ${dim(item.error)}`)
            else
              print(
                `${green('✓')} ${trackTitle(track.toJSON())}  ${dim(`${((item.bytes ?? 0) / 1024 / 1024).toFixed(1)}MB`)}  ${dim(item.path ?? '')}`,
              )
          }
          if (failed) print(dim(`${failed} 首没拿到地址（分享页只对 track 给地址，VIP 专享也可能拒绝）`))
        },
        { out: opts.out ?? null, items: done },
      )
      if (failed) process.exitCode = 1
    })
}
