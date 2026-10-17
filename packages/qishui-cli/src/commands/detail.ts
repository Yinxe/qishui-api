/**
 * 详情类命令：曲目、专辑、艺人、歌单、评论、用户、分享链接、歌词。
 *
 * 这些读接口大部分**匿名可用**；`user`（GetUserInfo）实测连打会出验证码，
 * 所以 core 给它 5 分钟缓存，这里也只单次取用、不做遍历。
 */
import type { Command } from 'commander'
import type { Comment } from 'qishui-core'
import { assertLoggedIn, CliError, core, describeError } from '../context.js'
import { ago, commentLine, count, duration, userLine } from '../format.js'
import {
  dim,
  emit,
  heading,
  print,
  printKeyValues,
  printList,
  printTable,
  warn,
  withIdColumn,
  yellow,
} from '../output.js'
import { printAlbumList, printPlaylistList, printTrackList } from '../render.js'

function printComments(comments: Comment[]): void {
  comments.forEach((comment, index) => {
    print(commentLine(comment, { index: index + 1 }))
  })
}

export function registerDetailCommands(program: Command): void {
  program
    .command('track <id>')
    .description('曲目详情')
    .option('--related', '同时列出相关曲目')
    .option('--comments', '同时列出评论（前 10 条）')
    .option('--lyrics', '打印歌词')
    .option('--stats', '多拉一次收藏/评论/分享数')
    .option('--refresh', '绕过 6 小时缓存（专辑/艺人/歌单/曲目元数据）')
    .action(
      async (
        id: string,
        opts: { related?: boolean; comments?: boolean; lyrics?: boolean; stats?: boolean; refresh?: boolean },
      ) => {
        const instance = await core()
        const track = await instance.catalog.track(id, opts)
        const data = track.toJSON()
        const related = opts.related ? await track.related(10) : undefined
        const comments = opts.comments ? (await track.comments({ count: 10 })).items : undefined
        const lyrics = opts.lyrics ? await track.lyrics() : undefined
        const stats = opts.stats ? await instance.catalog.stats(id, opts) : undefined

        emit(
          () => {
            heading(data.name)
            printKeyValues([
              ['歌手', track.artistNames],
              ['专辑', track.album?.name],
              ['时长', duration(track.durationMs)],
              ['id', track.id],
              ['vid', data.vid],
              ['封面', track.coverUrl],
              ['收藏', count(data.stats?.collected ?? stats?.collected)],
              ['评论', count(data.stats?.comment ?? stats?.comment)],
              [
                '权益',
                data.vip?.onlyVipPlayable
                  ? yellow('VIP 专享播放')
                  : data.vip?.vipOnlyQualities?.length
                    ? `会员音质：${data.vip.vipOnlyQualities.join('/')}`
                    : undefined,
              ],
              [
                '试听',
                data.playableRange
                  ? `从 ${duration(data.playableRange.startMs ?? 0)} 起 ${
                      data.playableRange.durationMs ? `共 ${duration(data.playableRange.durationMs)}` : ''
                    }`.trim()
                  : undefined,
              ],
            ])
            if (related) {
              heading('相关曲目')
              printTrackList(related)
            }
            if (comments) {
              heading('评论')
              printComments(comments)
            }
            if (lyrics) {
              heading('歌词', lyrics.type)
              printList(lyrics.contentLines.map((line) => `${dim(duration(line.startMs))} ${line.text}`))
            }
          },
          { track, related, comments, lyrics: lyrics?.toJSON(), stats },
        )
      },
    )

  program
    .command('album <id>')
    .description('专辑详情（--tracks 连曲目一起）')
    .option('--tracks', '列出专辑曲目')
    .option('--refresh', '绕过 6 小时缓存')
    .action(async (id: string, opts: { tracks?: boolean; refresh?: boolean }) => {
      const instance = await core()
      const album = await instance.catalog.album(id, opts)
      const data = album.toJSON()
      const tracks = opts.tracks ? await instance.catalog.albumTracks(id) : undefined
      emit(
        () => {
          heading(data.name)
          printKeyValues([
            ['歌手', album.artistNames],
            ['曲目数', data.countTracks],
            ['发行', data.releaseDate ? ago(data.releaseDate) : undefined],
            ['id', album.id],
            ['封面', album.coverUrl],
            ['简介', data.description],
          ])
          if (tracks) {
            heading('曲目')
            printTrackList(tracks)
          }
        },
        { album, tracks },
      )
    })

  program
    .command('artist <id>')
    .description('艺人详情（--tracks 热门曲目 / --albums 专辑）')
    .option('--tracks', '列出热门曲目')
    .option('--albums', '列出专辑')
    .option('--limit <n>', '最多几条', '20')
    .option('--refresh', '绕过 6 小时缓存')
    .action(async (id: string, opts: { tracks?: boolean; albums?: boolean; limit: string; refresh?: boolean }) => {
      const instance = await core()
      const limit = Math.max(1, Number(opts.limit) || 20)
      const artist = await instance.catalog.artist(id, opts)
      const data = artist.toJSON()
      const tracks = opts.tracks ? await instance.catalog.artistHotTracks(id) : undefined
      const albums = opts.albums ? (await instance.catalog.artistAlbums(id, { count: limit })).items : undefined
      emit(
        () => {
          heading(data.name)
          printKeyValues([
            ['关注', artist.following === undefined ? undefined : artist.following ? '已关注' : '未关注'],
            ['曲目数', data.countTracks],
            ['专辑数', data.countAlbums],
            ['id', artist.id],
            ['头像', artist.avatarUrl],
            ['简介', data.description],
          ])
          if (tracks) {
            heading('热门曲目')
            printTrackList(tracks.slice(0, limit))
          }
          if (albums) {
            heading('专辑')
            printAlbumList(albums)
          }
        },
        { artist, tracks, albums },
      )
    })

  program
    .command('playlist <id>')
    .description('歌单详情（--tracks 列曲目）')
    .option('--tracks', '列出歌单曲目')
    .option('--count <n>', '取多少首', '50')
    .option('--refresh', '绕过 6 小时缓存')
    .action(async (id: string, opts: { tracks?: boolean; count: string; refresh?: boolean }) => {
      const instance = await core()
      const limitCount = Math.max(1, Number(opts.count) || 50)
      const playlist = await instance.catalog.playlist(id, opts)
      const data = playlist.toJSON()
      const page = await instance.catalog.playlistTracks(id, { count: limitCount })
      emit(
        () => {
          heading(data.title)
          printKeyValues([
            [
              '类型',
              data.type === 1
                ? '我喜欢的音乐'
                : data.type === 2
                  ? '私有歌单'
                  : data.type === 3
                    ? '公开歌单'
                    : data.type === 4
                      ? '抖音收藏'
                      : data.type,
            ],
            ['曲目数', data.countTracks],
            ['收藏', count(data.stats?.collected)],
            ['id', playlist.id],
            ['封面', playlist.coverUrl],
            ['简介', data.description],
          ])
          if (opts.tracks) {
            heading('曲目')
            printTrackList(page.items)
            if (page.hasMore) print(dim(`还有更多（next_cursor=${page.cursor ?? '-'}）`))
          }
        },
        { playlist, page },
      )
    })

  program
    .command('comments <trackId>')
    .description('曲目评论（--post 发一条，需登录）')
    .option('--count <n>', '取多少条', '20')
    .option('--post <text>', '发一条评论（写接口，需登录）')
    .action(async (trackId: string, opts: { count: string; post?: string }) => {
      const instance = await core()
      if (opts.post !== undefined) {
        assertLoggedIn(instance)
        const created = await instance.comments.post(trackId, opts.post)
        emit(
          () => {
            heading('已发送')
            print(commentLine(created))
          },
          { posted: created },
        )
        return
      }
      const page = await instance.comments.list(trackId, { count: Math.max(1, Number(opts.count) || 20) })
      emit(() => {
        heading(`评论 ${page.items.length} 条`)
        if (!page.items.length) print(dim('没有评论（有些曲目的评论区是关着的，上游回 3056）'))
        printComments(page.items)
        if (page.hasMore) print(dim(`还有更多（cursor=${page.cursor ?? '-'}）`))
      }, page)
    })

  program
    .command('user <userId>')
    .description('用户资料（实测连打会触发验证码，别遍历）')
    .option('--playlists', '列出 ta 的公开歌单')
    .action(async (userId: string, opts: { playlists?: boolean }) => {
      const instance = await core()
      try {
        const user = await instance.social.user(userId)
        const playlists = opts.playlists
          ? (await instance.social.userPlaylists(userId, { count: 20 })).items
          : undefined
        emit(
          () => {
            heading('用户')
            print(userLine(user))
            printKeyValues([
              ['抖音号', user.toJSON().douyinId],
              ['签名', user.toJSON().signature],
              ['id', user.id],
            ])
            if (playlists) {
              heading('公开歌单')
              printPlaylistList(playlists)
            }
          },
          { user, playlists },
        )
      } catch (err) {
        const described = describeError(err)
        warn(`${described.message}${described.hint ? `（${described.hint}）` : ''}`)
        process.exitCode = 1
      }
    })

  program
    .command('link <input>')
    .description('解析分享链接/裸 id → 元数据 + 可播地址（不播）')
    .option('--media', '只输出可播地址')
    .action(async (input: string, opts: { media?: boolean }) => {
      const instance = await core()
      const item = await instance.link.resolve(input)
      const meta = await instance.link.meta(item, { relatedCount: 10 })
      let media: Awaited<ReturnType<typeof instance.link.media>> | undefined
      let mediaError: string | undefined
      try {
        media = await instance.link.media(item)
      } catch (err) {
        mediaError = describeError(err).message
      }
      emit(
        () => {
          if (opts.media) {
            if (media?.play_url) print(media.play_url)
            else print(dim(`没有可播地址：${mediaError ?? '分享页没给'}（只有 track / ugc_video 有）`))
            return
          }
          heading(`${item.kind} ${item.id}`)
          printKeyValues([
            ['标题', meta.title],
            ['歌手文案', meta.artist_text],
            ['封面', meta.cover_url],
            ['可播', media?.play_url ? '有' : mediaError ? dim(`没有（${mediaError}）`) : undefined],
            ['时长', media?.duration_ms ? duration(media.duration_ms) : undefined],
            ['mime', media?.mime_type],
            ['vid', media?.vid],
            ['过期', media?.expires_at ? ago(media.expires_at) : undefined],
            ['链接', meta.links?.short_link ?? meta.links?.share_link],
          ])
          if (meta.related?.length) {
            heading('相关曲目')
            const table = withIdColumn(
              ['曲目', '歌手', '时长'],
              meta.related.map((track) => [
                track.name ?? '',
                (track.artists ?? [])
                  .map((artist) => artist.name)
                  .filter(Boolean)
                  .join(' / '),
                duration(track.duration_ms),
              ]),
              meta.related.map((track) => track.track_id),
            )
            printTable(table.headers, table.rows)
          }
        },
        { item, meta, media, mediaError },
      )
    })

  program
    .command('lyrics <trackId>')
    .description('歌词（KRC 结构化：行级 + 逐字时间轴）')
    .option('--json-lines', '输出行数组（等价 --json 里的 lines）')
    .action(async (trackId: string, opts: { jsonLines?: boolean }) => {
      const instance = await core()
      const track = await instance.catalog.track(trackId)
      const lyrics = await instance.media.lyrics(track)
      if (!lyrics) throw new CliError('这首没有歌词（或分享页没给）')
      emit(
        () => {
          if (opts.jsonLines) {
            print(JSON.stringify(lyrics.toJSON(), null, 2))
            return
          }
          heading(track.name, lyrics.type)
          for (const line of lyrics.contentLines) print(`${dim(duration(line.startMs).padStart(6))}  ${line.text}`)
        },
        { track, lyrics: lyrics.toJSON(), text: lyrics.text },
      )
    })
}
