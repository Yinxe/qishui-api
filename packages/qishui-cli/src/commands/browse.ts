/**
 * 发现 / 推荐：首页大盘、榜单、场景电台、建议流、歌单广场、听歌模式、块下钻、冷启动偏好。
 *
 * 数据来源全部匿名可用（`DiscoverView` / `FeedMode` / `FeedSongTab` / `FeedPlaylistSquare` /
 * `FeedRadioTracks` / `GetChartDetail` / `DiscoverMix` / `Launch`），细节见 `qishui-api/docs/APP_ENDPOINTS.md`。
 *
 * 两套写法：平铺命令（`qishui home`）和 `qishui discover home` —— 同一份实现挂两处，
 * 只是让人能按「发现」这个心智模型找命令。
 */
import type { Command } from 'commander'
import type { DiscoverInner, FeedModeView, HomeView } from 'qishui-core'
import { CliError, core } from '../context.js'
import { bold, cyan, dim, emit, heading, print, printTable, yellow } from '../output.js'
import { printPlaylistList, printTrackList } from '../render.js'

/** 首页内部条目：榜单块 `discover_track_top_list`、场景队列 `discover_radio`、歌单推荐 `discover_playlist`… */
interface HomeEntry {
  kind: string
  id: string
  title: string
  count: number
  /** 可直接当 `qishui play` 的目标 */
  target: string
}

/** 块的资源类型 → 中文种类（首页表格和下钻表格共用一套词） */
function innerKind(inner: DiscoverInner): string {
  const resourceKind = inner.resources[0]?.type
  if (inner.type.includes('top_list')) return '榜单'
  if (inner.type.includes('radio')) return '电台'
  if (resourceKind === 'playlist') return '歌单'
  if (resourceKind === 'track') return '曲目'
  if (resourceKind === 'album') return '专辑'
  if (resourceKind === 'artist') return '艺人'
  return '其它'
}

/** 播放目标：能直接喂 `qishui play` 的前缀写法（榜单/电台/歌单用 `<kind>:<id>`） */
function innerTarget(kind: string, id: string): string {
  if (kind === '榜单') return `chart:${id}`
  if (kind === '电台') return `radio:${id}`
  if (kind === '歌单') return `playlist:${id}`
  return id
}

function toEntries(inners: DiscoverInner[], fallbackTitle?: string): HomeEntry[] {
  return inners
    .filter((inner) => !!inner.id)
    .map((inner) => {
      const kind = innerKind(inner)
      const id = inner.id as string
      return {
        kind,
        id,
        title: inner.title ?? fallbackTitle ?? inner.type,
        count: inner.resources.length,
        target: innerTarget(kind, id),
      }
    })
}

function homeEntries(home: HomeView): HomeEntry[] {
  return toEntries(
    home.blocks.flatMap((block) => block.inner),
    undefined,
  )
}

/** 平铺首页/下钻表格：`类型 / 标题 / 条数 / 播放目标`（保持一个样式） */
function printEntryTable(entries: HomeEntry[]): void {
  printTable(
    ['类型', '标题', '条数', '播放目标（type:id）'],
    entries.map((entry) => [entry.kind, entry.title, String(entry.count), entry.target]),
  )
}

/** `播放目标` 列是 `qishui play` 的写法；直接查详情/取榜单时只要冒号后面的裸 id——这句每条列出目标的命令都打 */
function printTargetHint(): void {
  print(dim('播放目标列是 `qishui play` 的写法（type:id）；qishui chart / radio / playlist <id> 只要冒号后面的裸 id'))
}

/** 偏好模式的中文/英文都收（英文取值来自 IDL：`familiar` / `fresh`） */
const FEED_MODES: Record<string, 'default' | 'familiar' | 'fresh'> = {
  default: 'default',
  推荐: 'default',
  familiar: 'familiar',
  熟悉: 'familiar',
  fresh: 'fresh',
  新鲜: 'fresh',
}

/** 短数字 id 是场景模式的 `scene_mode_id`，要按数字发（实测数字/雪花串两种都吃，但串形未验） */
function radioArg(id: string): string | number {
  return /^\d{1,9}$/.test(id) ? Number(id) : id
}

/* ------------------------------------------------------------ 各条命令（平铺 / discover 各挂一份） */

function addHome(cmd: Command): void {
  cmd
    .command('home')
    .description('首页大盘（推荐页版 grid / 听歌模式版 feed）')
    .option('--layout <layout>', 'grid（推荐页：榜单+歌单+电台）| feed（听歌模式：只有场景电台）', 'grid')
    .option('--tracks', '把首页里抓到的曲目全列出来')
    .option('--playlists', '把首页里抓到的歌单列出来')
    .option('--refresh', '该命令不缓存（参数无效，保留兼容）')
    .action(async (opts: { layout: string; tracks?: boolean; playlists?: boolean; refresh?: boolean }) => {
      const instance = await core()
      const layout = opts.layout === 'feed' ? 'feed' : 'grid'
      const home = await instance.discover.home({ layout, refresh: opts.refresh })
      const entries = homeEntries(home)
      emit(
        () => {
          heading('首页', layout === 'feed' ? '听歌模式版（只有场景电台）' : '推荐页版')
          printEntryTable(entries)
          printTargetHint()
          print(dim(`曲目 ${home.tracks.length} 首 · 歌单 ${home.playlists.length} 个（--tracks / --playlists 展开）`))
          if (opts.tracks && home.tracks.length) {
            heading('首页曲目')
            printTrackList(home.tracks)
          }
          if (opts.playlists && home.playlists.length) {
            heading('首页歌单')
            printPlaylistList(home.playlists)
          }
        },
        { layout, blocks: home.blocks, entries, tracks: home.tracks, playlists: home.playlists },
      )
    })
}

function addChart(cmd: Command): void {
  cmd
    .command('chart [chartId]')
    .description('榜单：不带 id 列出首页里的榜单块；带 id 打出整榜名次')
    .option('--limit <n>', '最多打几条名次', '50')
    .option('--refresh', '绕过榜单 30 分钟缓存（不带 id 时走首页，那份不缓存）')
    .addHelpText(
      'after',
      '\n提示：<chartId> 只要「裸 id」（「播放目标」列 chart: 后面那串，如 7061475546400005410）；`qishui chart chart:xxx` 认不出。',
    )
    .action(async (chartId: string | undefined, opts: { limit: string; refresh?: boolean }) => {
      const instance = await core()
      if (!chartId) {
        const home = await instance.discover.home({ refresh: opts.refresh })
        const charts = homeEntries(home).filter((entry) => entry.kind === '榜单')
        emit(
          () => {
            heading('榜单')
            printEntryTable(charts)
            printTargetHint()
          },
          { charts },
        )
        return
      }
      const chart = await instance.catalog.chart(chartId, opts)
      const limit = Math.max(1, Number(opts.limit) || 50)
      const ranks = chart.ranked.slice(0, limit)
      const extra = chart.toJSON()
      emit(
        () => {
          heading(chart.title ?? chart.id)
          print(
            [
              extra.period ? dim(extra.period) : '',
              chart.countTracks !== undefined ? dim(`${chart.countTracks} 首`) : '',
              dim(chart.id),
            ]
              .filter(Boolean)
              .join('  '),
          )
          printTable(
            ['名次', '变化', '曲目', '歌手', 'id'],
            ranks.map((rank) => [
              String(rank.rank ?? ''),
              `${rank.trend ?? ''}${rank.delta ? ` ${rank.delta}` : ''}`.trim(),
              rank.track.name,
              rank.track.artists
                .map((artist) => artist.name)
                .filter(Boolean)
                .join(' / '),
              rank.track.id,
            ]),
            { right: [0] },
          )
        },
        { chart, ranks },
      )
    })
}

function addRadio(cmd: Command): void {
  cmd
    .command('radio [radioId]')
    .description('电台队列：不带 id 列出首页的电台队列（DiscoverView 的 discover_radio 块）；带 id 拉该队列的一批')
    .option('--limit <n>', '最多几首', '20')
    .option('--refresh', '该命令不缓存（参数无效，保留兼容）')
    .addHelpText(
      'after',
      '\n提示：<radioId> 是队列 id（雪花大数，`qishui radio` 表里那串）；播放整个队列用 `qishui play radio:<radioId>`。' +
        '\n想看「场景」（日语/粤语/古典…）用 `qishui scene` —— 场景是听歌模式的一档，不是电台队列。',
    )
    .action(async (radioId: string | undefined, opts: { limit: string; refresh?: boolean }) => {
      const instance = await core()
      if (!radioId) {
        const view = await instance.discover.home({ layout: 'feed', refresh: opts.refresh })
        const queues = view.blocks
          .filter((block) => block.type === 'discover_playlist_mix')
          .flatMap((block) => block.inner)
          .filter((inner) => inner.type === 'discover_radio')
          .map((inner) => ({
            id: inner.id ?? '',
            title: inner.title ?? '',
          }))
        emit(
          () => {
            heading('电台队列', `${queues.length} 个（discover_radio）`)
            printTable(
              ['队列', 'radio_id'],
              queues.map((queue) => [queue.title, queue.id]),
            )
            print(dim('播放：qishui play radio:<radio_id>（qishui radio <radio_id> 只要裸 id）'))
          },
          { queues },
        )
        return
      }
      const tracks = await instance.discover.radioTracks(radioArg(radioId), opts)
      const limit = Math.max(1, Number(opts.limit) || 20)
      emit(
        () => {
          heading(`电台 ${radioId}`)
          printTrackList(tracks.slice(0, limit))
        },
        { radioId, tracks },
      )
    })
}

/**
 * 场景（听歌模式的一档）：`scene_mode_id` 走 `FeedSongTab` 的 `feed_preference.scene_mode_id`。
 * 早先这里和 `radio` 合成一条命令，导致「选日语推中文歌」——电台队列与场景是两条不同的路。
 */
function addScene(cmd: Command): void {
  cmd
    .command('scene [sceneModeId]')
    .description('听歌模式的场景档（日语/粤语/古典/助眠…）：不带 id 列出 45 个场景；带 id 拉该场景的一批')
    .option('--limit <n>', '最多几首', '20')
    .option('--count <n>', '一次向上游要几首（默认 6）')
    .action(async (sceneModeId: string | undefined, opts: { limit: string; count?: string }) => {
      const instance = await core()
      if (!sceneModeId) {
        const modes: FeedModeView = await instance.discover.feedModes()
        emit(
          () => {
            heading('场景音乐', `${modes.scenes.length} 个场景（FeedMode）`)
            printTable(
              ['场景', 'scene_mode_id', '队列'],
              modes.scenes.map((scene) => [scene.text, String(scene.sceneModeId ?? ''), scene.subQueueType ?? '']),
            )
            print(dim('用：qishui scene <scene_mode_id>'))
          },
          { scenes: modes.scenes },
        )
        return
      }
      const id = Number(sceneModeId)
      if (!Number.isSafeInteger(id) || id <= 0) {
        throw new CliError(`认不出场景 ${sceneModeId}`, '场景 id 是 `qishui scene` 表里的短数字，如 30（日语）')
      }
      const tracks = await instance.discover.feedModeTracks(
        { kind: 'scene', sceneModeId: id },
        { count: opts.count ? Number(opts.count) : undefined },
      )
      const limit = Math.max(1, Number(opts.limit) || 20)
      emit(
        () => {
          heading(`场景 ${sceneModeId}`)
          printTrackList(tracks.slice(0, limit))
        },
        { sceneModeId: id, tracks },
      )
    })
}

function addFeed(cmd: Command): void {
  cmd
    .command('feed')
    .description('「随便听听」单曲推荐（一次 6 首，含完整专辑/歌手）')
    .option('--mode <mode>', '偏好模式：default（推荐）| familiar（熟悉）| fresh（新鲜）', 'default')
    .option('--count <n>', '一次几首（上游默认 6）')
    .option('--played', '带本地播放历史当 played_tracks（默认不带：只本地记历史、未向上游报播放时长）')
    .option('--exclude <what>', '客户端过滤：played（已播）| liked（已喜欢）| both；默认 none 直接透传上游', 'none')
    .option('--refresh', '该命令不缓存（参数无效，保留兼容）')
    .action(async (opts: { mode: string; count?: string; played?: boolean; exclude?: string; refresh?: boolean }) => {
      const instance = await core()
      const mode = FEED_MODES[opts.mode.toLowerCase()] ?? FEED_MODES[opts.mode]
      if (!mode) {
        throw new CliError(
          `认不出模式 ${opts.mode}`,
          `可用：default（推荐）/ familiar（熟悉）/ fresh（新鲜），见 qishui modes`,
        )
      }
      const what = (opts.exclude ?? 'none').toLowerCase()
      if (!['played', 'liked', 'both', 'none'].includes(what)) {
        throw new CliError(`认不出排除项 ${opts.exclude}`, '可用：played / liked / both / none')
      }
      const preferenceMode = mode === 'default' ? undefined : mode
      const tracks = await instance.discover.feedSongTab({
        preferenceMode,
        count: opts.count ? Number(opts.count) : undefined,
        withPlayedTracks: opts.played,
        excludePlayed: what === 'played' || what === 'both',
        excludeLiked: what === 'liked' || what === 'both',
        refresh: opts.refresh,
      })
      emit(
        () => {
          heading('随便听听', preferenceMode ? `偏好：${mode}（${opts.mode}）` : '偏好：default（推荐）')
          printTrackList(tracks)
        },
        {
          mode,
          preferenceMode: preferenceMode ?? 'default',
          playedTracks: opts.played ?? false,
          exclude: what,
          tracks,
        },
      )
    })
}

function addSquare(cmd: Command): void {
  cmd
    .command('square')
    .description('歌单广场（分类歌单）')
    .option('--category <id>', '分类 id（不带就是全部分类）')
    .option('--limit <n>', '最多几个歌单', '20')
    .option('--refresh', '该命令不缓存（参数无效，保留兼容）')
    .action(async (opts: { category?: string; limit: string; refresh?: boolean }) => {
      const instance = await core()
      const { playlists, categories } = await instance.discover.playlistSquare({
        categoryId: opts.category,
        refresh: opts.refresh,
      })
      const limit = Math.max(1, Number(opts.limit) || 20)
      emit(
        () => {
          heading('歌单广场')
          if (categories.length) {
            print(
              cyan('分类') +
                ' ' +
                categories
                  .map((category: { id?: unknown; name?: unknown }) =>
                    category.id === opts.category
                      ? bold(String(category.name ?? category.id))
                      : String(category.name ?? category.id),
                  )
                  .join(dim(' · ')),
            )
          }
          printPlaylistList(playlists.slice(0, limit))
        },
        { categoryId: opts.category ?? '', categories, playlists },
      )
    })
}

function addModes(cmd: Command): void {
  cmd
    .command('modes')
    .description('听歌模式：偏好栏（推荐/熟悉/新鲜）+ 45 个场景（给 feed --mode / radio 用）')
    .option('--refresh', '绕过 6 小时缓存')
    .action(async (opts: { refresh?: boolean }) => {
      const instance = await core()
      const modes = await instance.discover.feedModes(opts)
      emit(() => {
        heading('偏好模式', `${modes.preferences.length} 项`)
        print(
          modes.preferences
            .map(
              (option) =>
                `${option.current ? bold(option.label) : option.label} ${dim(option.mode)}${option.current ? dim('（当前）') : ''}`,
            )
            .join(dim(' · ')),
        )
        heading('场景音乐', `${modes.scenes.length} 个`)
        printTable(
          ['场景', 'scene_mode_id', '队列'],
          modes.scenes.map((scene) => [scene.text, String(scene.sceneModeId ?? ''), scene.subQueueType ?? '']),
        )
        print(dim('用：qishui feed --mode familiar · qishui scene <scene_mode_id>'))
      }, modes)
    })
}

function addMix(cmd: Command): void {
  cmd
    .command('mix <blockType> [subChannelId]')
    .description('内容块下钻（DiscoverMix）：给块类型（如 discover_playlist）拉一批同类块')
    .option('--limit <n>', '最多几个块', '20')
    .option('--refresh', '该命令不缓存（参数无效，保留兼容）')
    .action(async (blockType: string, subChannelId: string | undefined, opts: { limit: string; refresh?: boolean }) => {
      const instance = await core()
      const inners = await instance.discover.mix({ blockType, subChannelId, refresh: opts.refresh })
      const limit = Math.max(1, Number(opts.limit) || 20)
      const entries = toEntries(inners, blockType).slice(0, limit)
      emit(
        () => {
          heading(`下钻 ${blockType}`, `${entries.length} 个块`)
          printEntryTable(entries)
          printTargetHint()
          print(dim('接着用：qishui playlist <id> --tracks'))
        },
        { blockType, subChannelId: subChannelId ?? blockType, blocks: inners, entries },
      )
    })
}

function addLaunch(cmd: Command): void {
  cmd
    .command('launch')
    .description('冷启动信息（曲风/语种偏好、是否该弹首启引导）')
    .action(async () => {
      const instance = await core()
      const info = await instance.discover.launch()
      emit(() => {
        if (!info.boost) {
          print(dim('上游没回 boost（可能没有首启引导）'))
          return
        }
        heading('冷启动偏好')
        print(`是否需要设置：${info.boost.needSet ? yellow('是') : '否'}`)
        print(
          '曲风：' +
            info.boost.genres.map((genre) => `${genre.name ?? ''}${genre.id ? dim(`(${genre.id})`) : ''}`).join(' · '),
        )
        print(
          '语种：' +
            info.boost.langs.map((lang) => `${lang.name ?? ''}${lang.code ? dim(`(${lang.code})`) : ''}`).join(' · '),
        )
      }, info)
    })
}

function addCharts(cmd: Command): void {
  cmd
    .command('charts')
    .description('只看榜单块的别名（等价 `qishui chart`）')
    .action(async () => {
      const instance = await core()
      const home = await instance.discover.home()
      const charts = homeEntries(home).filter((entry) => entry.kind === '榜单')
      emit(
        () => {
          heading('榜单')
          printEntryTable(charts)
          printTargetHint()
        },
        { charts },
      )
    })
}

export function registerBrowseCommands(program: Command): void {
  // 平铺命令
  addHome(program)
  addChart(program)
  addRadio(program)
  addScene(program)
  addFeed(program)
  addSquare(program)
  addModes(program)
  addMix(program)
  addLaunch(program)
  addCharts(program)

  // `qishui discover <子命令>`：同一批实现再挂一份，按「发现」的心智模型找命令
  const discover = program
    .command('discover')
    .description('发现（子命令：home / chart / charts / radio / scene / feed / square / modes / mix / launch）')
  discover.action(() => discover.help())
  addHome(discover)
  addChart(discover)
  addCharts(discover)
  addRadio(discover)
  addScene(discover)
  addFeed(discover)
  addSquare(discover)
  addModes(discover)
  addMix(discover)
  addLaunch(discover)
}
