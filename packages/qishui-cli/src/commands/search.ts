/**
 * 搜索：官方搜索（匿名可用）、联想词、推荐词、分类 tab。
 *
 * 上游口径（`qishui-api/docs/APP_ENDPOINTS.md`）：
 *  - 走 `/luna/search/<type>`（**匿名可用**，track 一次 ~114KB 完整实体）；
 *  - `search_type` 取 7 个值：all / track / video / artist / album / playlist / user
 *    （其中 `user` 上游不返回结果，见 README「已知边界」）；
 *  - h5 版 `Search2023` **已弃用**，不再调用。
 */
import type { Command } from 'commander'
import type { SearchGroup, SearchType } from 'qishui-core'
import { CliError, core } from '../context.js'
import { userLine } from '../format.js'
import { bold, dim, emit, heading, print, printTable } from '../output.js'
import { printAlbumList, printArtistList, printPlaylistList, printTrackList } from '../render.js'

const TYPES: SearchType[] = ['all', 'track', 'video', 'artist', 'album', 'playlist', 'user']

function groupTotal(group: SearchGroup): number {
  return group.tracks.length + group.albums.length + group.artists.length + group.playlists.length + group.users.length
}

/** 没被解析成实体的条目（video 这类）只报个数，原始结构用 --json 看 */
function rawItemCount(group: SearchGroup): number {
  const raw = group.raw as { items?: unknown[] } | undefined
  return Array.isArray(raw?.items) ? raw.items.length : 0
}

export function registerSearchCommands(program: Command): void {
  program
    .command('search <query>')
    .description('搜索（默认全类型；匿名走 /luna/search）')
    .option('--type <type>', `结果类型：${TYPES.join('|')}（user/video 上游不返回）`, 'all')
    .option('--limit <n>', '每类最多几条', '20')
    .option('--refresh', '该命令不缓存（参数无效，保留兼容）')
    .action(async (query: string, opts: { type: string; limit: string; refresh?: boolean }) => {
      const type = opts.type as SearchType
      if (!TYPES.includes(type)) throw new CliError(`--type 只能是 ${TYPES.join(' / ')}`)
      const instance = await core()
      const result = await instance.search.search(query, { type, refresh: opts.refresh })
      const limit = Math.max(1, Number(opts.limit) || 20)
      emit(() => {
        heading(`搜索「${query}」`, type === 'all' ? undefined : `类型 ${type}`)
        let printed = 0
        for (const group of result.groups) {
          if (!groupTotal(group) && !rawItemCount(group)) continue
          print(`${bold(group.title ?? group.id ?? '结果')} ${dim(`${groupTotal(group) || rawItemCount(group)} 条`)}`)
          printTrackList(group.tracks.slice(0, limit))
          printAlbumList(group.albums.slice(0, limit))
          printArtistList(group.artists.slice(0, limit))
          printPlaylistList(group.playlists.slice(0, limit))
          group.users.slice(0, limit).forEach((user, index) => {
            print(userLine(user, { index: index + 1 }))
          })
          if (!groupTotal(group)) print(dim(`  ${rawItemCount(group)} 条未结构化结果（--json 看原始结构）`))
          printed++
        }
        if (!printed) {
          if (type === 'user' || type === 'video') {
            print(dim(`上游 /luna/search/${type} 不返回结果（这两类匿名搜索未落地），不是关键词没命中`))
            print(dim('能搜的类型：track / artist / album / playlist（`qishui categories` 那份 tab 是客户端口径）'))
          } else {
            print(dim('没搜到东西'))
          }
        } else if (type === 'all') {
          print(
            dim(
              'all 是每类预览（歌曲/歌手/专辑/歌单各 3~5 条）；要全量用 --type <track|artist|album|playlist>，分页靠游标',
            ),
          )
        }
      }, result)
    })

  program
    .command('suggest <query>')
    .description('搜索联想词')
    .option('--refresh', '该命令不缓存（参数无效，保留兼容）')
    .action(async (query: string, opts: { refresh?: boolean }) => {
      const instance = await core()
      const items = await instance.search.suggest(query, opts)
      emit(
        () => {
          heading(`联想词「${query}」`)
          if (!items.length) print(dim('上游没回联想词'))
          for (const item of items) print(`${item.keyword}${item.type ? dim(`  ${item.type}`) : ''}`)
        },
        { query, items },
      )
    })

  program
    .command('words')
    .description('推荐搜索词（搜索页默认铺的那批）')
    .option('--refresh', '绕过 6 小时缓存')
    .action(async (opts: { refresh?: boolean }) => {
      const instance = await core()
      const items = await instance.search.recommendWords(opts)
      emit(
        () => {
          heading('推荐搜索词')
          for (const item of items) print(item.keyword)
        },
        { items },
      )
    })

  program
    .command('categories')
    .description('搜索分类 tab（7 个 search_type）')
    .option('--refresh', '绕过 24 小时缓存')
    .action(async (opts: { refresh?: boolean }) => {
      const instance = await core()
      const categories = await instance.search.categories(opts)
      emit(
        () =>
          printTable(
            ['search_type', '名称'],
            categories.map((item) => [item.type, item.name]),
          ),
        { categories },
      )
    })
}
