/**
 * 我的音乐：我喜欢的、歌单增删改、收藏、最近播放。
 *
 * 写接口的约定（对齐 core / qishui-api 的实测口径）：
 *  - 只有用户明确敲的命令才发写请求（core 不会替上层偷偷写）；
 *  - 删除类（`drop`）要求 `--yes` 或交互确认，且都留了回滚/再操作的方式在提示里；
 *  - 上游回空只报「这页没回东西」，不替上游解释成「没数据」——空表和「写没落地」是两件事。
 */
import type { Command } from 'commander'
import { assertLoggedIn, CliError, core, parseCount, parseVolume } from '../context.js'
import { duration, tailParts } from '../format.js'
import { askYesNo, dim, emit, green, heading, idTag, print, warn } from '../output.js'
import { runPlaySession } from '../playSession.js'
import { printArtistList, printPlaylistList, printTrackList } from '../render.js'

export function registerLibraryCommands(program: Command): void {
  program
    .command('liked')
    .description('我喜欢的音乐')
    .option('--play', '直接播（等价 `qishui play liked`）')
    .option('--limit <n>', '最多几首', '50')
    .option('--volume <percent>', '出声音量 0-100（配 --play）', '100')
    .option('--refresh', '绕过 5 分钟缓存（写操作后会自动失效）')
    .action(async (opts: { play?: boolean; limit: string; volume: string; refresh?: boolean }) => {
      // 参数先验完再出门：写错 `--limit`/`--volume` 不该以「连上账号、取回一整张表」收场
      const limit = parseCount(opts.limit, '--limit', { fallback: 50, max: 1000 })
      const volume = parseVolume(opts.volume)
      const instance = await core()
      assertLoggedIn(instance)
      const tracks = await instance.library.likedTracks(opts)
      if (opts.play) {
        await runPlaySession(instance, tracks, {
          download: instance.config.autoCacheMedia,
          printPath: false,
          shuffle: instance.config.defaultShuffle,
          repeat: instance.config.defaultRepeat,
          volume,
          lyrics: true,
        })
        return
      }
      const playlist = await instance.library.likedPlaylist(opts)
      const shown = tracks.slice(0, limit)
      emit(
        () => {
          heading('我喜欢的音乐', playlist?.countTracks !== undefined ? `${playlist.countTracks} 首` : undefined)
          if (!tracks.length) print(dim('（空，或者上游没给）'))
          printTrackList(shown)
          print(dim('播放：qishui liked --play（--volume 60 控音量，--limit 少播几首）'))
        },
        { playlist, tracks: shown, total: tracks.length },
      )
    })

  program
    .command('playlists')
    .description('我的歌单（含「我喜欢的音乐」「抖音收藏」）')
    .option('--refresh', '绕过 5 分钟缓存（写操作后会自动失效）')
    .action(async (opts: { refresh?: boolean }) => {
      const instance = await core()
      assertLoggedIn(instance)
      const playlists = await instance.library.playlists(opts)
      emit(
        () => {
          heading('我的歌单')
          printPlaylistList(playlists, { owned: true })
          print(dim('看内容：qishui playlist <id> --tracks · 播：qishui play playlist:<id>'))
        },
        { playlists },
      )
    })

  program
    .command('new <title>')
    .description('新建歌单')
    .option('--private', '建成私有歌单')
    .action(async (title: string, opts: { private?: boolean }) => {
      const instance = await core()
      assertLoggedIn(instance)
      const playlist = await instance.library.createPlaylist(title, { isPrivate: opts.private === true })
      emit(
        () => {
          print(`${green('已创建')} ${playlist.title}  ${dim(playlist.id)}`)
          print(dim(`加歌：qishui add ${playlist.id} <trackId...>`))
        },
        { playlist },
      )
    })

  program
    .command('add <playlistId> <trackIds...>')
    .description('往歌单里加歌')
    .action(async (playlistId: string, trackIds: string[]) => {
      const instance = await core()
      assertLoggedIn(instance)
      await instance.library.addToPlaylist(playlistId, trackIds)
      emit(
        () => {
          print(`${green('已加入')} ${trackIds.length} 首 → ${playlistId}`)
          print(dim(`撤销：qishui remove ${playlistId} ${trackIds.join(' ')}`))
        },
        { playlistId, trackIds, added: trackIds.length },
      )
    })

  program
    .command('remove <playlistId> <trackIds...>')
    .description('从歌单里移除歌')
    .action(async (playlistId: string, trackIds: string[]) => {
      const instance = await core()
      assertLoggedIn(instance)
      await instance.library.removeFromPlaylist(playlistId, trackIds)
      emit(
        () => {
          print(`${green('已移除')} ${trackIds.length} 首 ← ${playlistId}`)
          print(dim(`撤销：qishui add ${playlistId} ${trackIds.join(' ')}`))
        },
        { playlistId, trackIds, removed: trackIds.length },
      )
    })

  program
    .command('rename <playlistId> <title>')
    .description('改歌单名（实测偶发 1000014，重试一次即通）')
    .option('--description <text>', '顺便改简介')
    .action(async (playlistId: string, title: string, opts: { description?: string }) => {
      const instance = await core()
      assertLoggedIn(instance)
      await instance.library.updatePlaylist(playlistId, { title, description: opts.description })
      emit(() => print(`${green('已改名')} ${playlistId} → ${title}`), {
        playlistId,
        title,
        description: opts.description ?? null,
      })
    })

  program
    .command('drop <playlistIds...>')
    .description('删歌单（要 --yes 或交互确认；删了就找不回来）')
    .option('--yes', '不问了，直接删')
    .action(async (playlistIds: string[], opts: { yes?: boolean }) => {
      const instance = await core()
      assertLoggedIn(instance)
      if (!opts.yes) {
        const ok = await askYesNo(`确认删除 ${playlistIds.length} 个歌单（${playlistIds.join(', ')}）？`)
        if (!ok) {
          emit(() => print(dim('已取消')), { cancelled: true, playlistIds })
          return
        }
      }
      await instance.library.deletePlaylists(playlistIds)
      emit(() => print(`${green('已删除')} ${playlistIds.join(' ')}`), { playlistIds, deleted: playlistIds.length })
    })

  program
    .command('like <trackIds...>')
    .description('红心（加入我喜欢的音乐）')
    .action(async (trackIds: string[]) => {
      const instance = await core()
      assertLoggedIn(instance)
      for (const id of trackIds) await instance.library.like(id)
      emit(
        () => {
          print(`${green('已喜欢')} ${trackIds.length} 首`)
          print(dim(`撤销：qishui unlike ${trackIds.join(' ')}`))
        },
        { trackIds, liked: trackIds.length },
      )
    })

  program
    .command('unlike <trackIds...>')
    .description('取消红心')
    .action(async (trackIds: string[]) => {
      const instance = await core()
      assertLoggedIn(instance)
      for (const id of trackIds) await instance.library.unlike(id)
      emit(
        () => {
          print(`${green('已取消喜欢')} ${trackIds.length} 首`)
          print(dim(`撤销：qishui like ${trackIds.join(' ')}`))
        },
        { trackIds, unliked: trackIds.length },
      )
    })

  program
    .command('collect <targets...>')
    .description('收藏（track:<id> / album:<id> / artist:<id> / playlist:<id>）')
    .action(async (targets: string[]) => {
      const instance = await core()
      assertLoggedIn(instance)
      const parsed = targets.map(parseCollectTarget)
      await instance.library.collectMedia(parsed)
      emit(
        () => {
          print(`${green('已收藏')} ${parsed.length} 个条目`)
          print(dim(`撤销：qishui uncollect ${targets.join(' ')}`))
        },
        { targets: parsed, collected: parsed.length },
      )
    })

  program
    .command('uncollect <targets...>')
    .description('取消收藏（同 collect 的写法）')
    .action(async (targets: string[]) => {
      const instance = await core()
      assertLoggedIn(instance)
      const parsed = targets.map(parseCollectTarget)
      await instance.library.uncollectMedia(parsed)
      emit(
        () => {
          print(`${green('已取消收藏')} ${parsed.length} 个条目`)
          print(dim(`撤销：qishui collect ${targets.join(' ')}`))
        },
        { targets: parsed, uncollected: parsed.length },
      )
    })

  program
    .command('artists')
    .description('我关注的艺人')
    .option('--count <n>', '取多少', '30')
    .option('--refresh', '绕过 5 分钟缓存（写操作后会自动失效）')
    .action(async (opts: { count: string; refresh?: boolean }) => {
      const instance = await core()
      assertLoggedIn(instance)
      const page = await instance.library.collectedArtists({
        count: parseCount(opts.count, '--count', { fallback: 30, max: 200 }),
        refresh: opts.refresh,
      })
      emit(() => {
        heading('关注的艺人', page.total !== undefined ? `${page.total} 位` : `${page.items.length} 个`)
        if (!page.items.length) print(dim('（这个账号没关注任何人；`qishui collect artist:<id>` 之后这里读得到）'))
        printArtistList(page.items)
      }, page)
    })

  program
    .command('recent')
    .description('上游的「最近播放」（账号级、跨设备；本机听过什么看 `qishui history`）')
    .option('--count <n>', '取多少', '20')
    .option('--refresh', '该命令不缓存（参数无效，保留兼容）')
    .action(async (opts: { count: string; refresh?: boolean }) => {
      const instance = await core()
      assertLoggedIn(instance)
      const page = await instance.library.recent({
        count: parseCount(opts.count, '--count', { fallback: 20, max: 200 }),
        refresh: opts.refresh,
      })
      emit(() => {
        heading(
          '上游最近播放',
          page.total !== undefined ? `${page.total} 条 · 本页 ${page.items.length} 首` : `${page.items.length} 首`,
        )
        if (!page.items.length) {
          warn('上游这页没回曲目')
          print(dim('本地历史：qishui history'))
          return
        }
        printTrackList(page.items)
      }, page)
    })

  program
    .command('history')
    .description('本地播放历史（~/.qishui/journal/plays.jsonl，永远记）')
    .option('--limit <n>', '最多几条', '20')
    .action(async (opts: { limit: string }) => {
      const instance = await core()
      const limit = parseCount(opts.limit, '--limit', { fallback: 20, max: 1000 })
      const records = instance.plays(limit)
      const stats = instance.playStats()
      emit(
        () => {
          heading('本地播放历史', `${stats.records} 条记录 / ${stats.tracks} 首`)
          if (!records.length) {
            print(dim('还没播过'))
            return
          }
          records.forEach((record, index) => {
            // 收听时长由播放器在切歌/停播/播完/退出时补；补不上的（老记录、被强杀的那次）照实说「没记下」
            const heard =
              record.playedMs === undefined
                ? '没记下听到哪'
                : record.completed
                  ? '听完'
                  : `听到 ${duration(record.playedMs)}`
            print(
              `${dim(String(index + 1).padStart(2) + '.')} ${record.name ?? record.trackId} ${dim('—')} ${dim(record.artist ?? '')}` +
                tailParts(record.source ? dim(record.source) : undefined, dim(heard), idTag(record.trackId)),
            )
          })
        },
        { records, stats },
      )
    })

  program
    .command('isliked <trackIds...>')
    .description('查这几首有没有在「我喜欢的音乐」里')
    .action(async (trackIds: string[]) => {
      const instance = await core()
      assertLoggedIn(instance)
      const results = await Promise.all(trackIds.map(async (id) => ({ id, liked: await instance.library.isLiked(id) })))
      emit(
        () => {
          for (const item of results) print(`${item.liked ? green('♥') : dim('♡')} ${item.id}`)
        },
        { results },
      )
    })
}

const COLLECT_KINDS = new Set(['track', 'album', 'artist', 'playlist'])

function parseCollectTarget(input: string): { id: string; type: string } {
  const [kind, ...rest] = input.split(':')
  const id = rest.join(':')
  if (!id) {
    if (/^\d{10,20}$/.test(input)) return { id: input, type: 'track' }
    throw new CliError(
      `认不出 ${input}`,
      '写法：track:<id> / album:<id> / artist:<id> / playlist:<id>（裸数字当 track）',
    )
  }
  if (!COLLECT_KINDS.has(kind)) throw new CliError(`不支持收藏 ${kind}`, `可用：${[...COLLECT_KINDS].join(' / ')}`)
  return { id, type: kind }
}
