/**
 * 行操作菜单的条目构造：一行的「能做什么」在这里一次说清，各屏不再各自绑散键。
 *
 * 四条口径：
 *  - **菜单是同步构造的，不等任何请求**：曾经在建菜单前 `await isLiked()`，而它是「把整张
 *    『我喜欢的音乐』翻完」（首开好几轮请求），现象就是点一下没反应、再点一下菜单才冒出来 ——
 *    现在收藏/关注状态先看**这一行自己带的水印**（登录态下搜索/榜单/推流的实体就嵌着 `state.is_collected`，
 *    core 解析成 `Track.liked` / `Artist.following` / `Album.collected` / `Playlist.collected`），
 *    水印没带再退到内存里那份收藏清单，两头都没有就不写状态。
 *  - **菜单是打开那一刻的快照**：执行仍打在同一个 id 上；开着菜单时列表被刷新，最坏是一句报错的 toast。
 *  - **写类动作未登录不给选中**（`disabled`），但条目照常列出来，末尾补一个「去登录」的出口 ——
 *    比只弹一句「需要登录」更能让人知道这里本来能做什么。
 *  - **状态只说读到的**：没核对过就不写 note，执行前再真读一次 `isLiked`，不替上游断言已喜欢 / 未喜欢。
 *
 * 「曲目本体能做什么」抽成 `buildTrackActions`：列表页的行、播放页的当前曲目、播放页队列里的行
 * 用的是**同一份**条目（详情 / 喜欢 / 评论 / 加入歌单 / 相似歌曲 / 不感兴趣 / 举报），
 * 差别只在前后各插几项（列表页插「播放这首」，队列行插「立即播放 / 从队列移除」）。
 */
import type { QishuiCore, Track, TrackData } from 'qishui-core'
import type { UiValue } from './context.js'
import type { Entry } from './entries.js'
import { truncate } from './format.js'
import { confirmDeletePlaylist, confirmRemoveFromPlaylist, promptRenamePlaylist } from './playlistActions.js'
import type { QueueSpec } from './queues.js'
import type { ListRow } from './useList.js'

/**
 * 出声入口 = core context 的 `playTracks`。第三个参数是**这份曲目属于哪份播放队列**：
 * 歌单/专辑行自己带（「播放整张」不该落到当前页的临时队列里），曲目行不带 ——
 * 由所在页面给默认（歌单页 = 这张歌单的队列，搜索页 = 临时队列）。
 */
export type PlayFn = (tracks: TrackData[], startTrackId?: string, queue?: QueueSpec) => void | Promise<void>

/**
 * 曲目菜单只需要曲目实体的这四样：`id`、`data`（播放与写回水印）、`liked`（上游带的水印）。
 * `Track` 结构上就满足；播放器那边的 `TrackData` 也能就地拼一个（队列/正在播放里没有实体）。
 */
export interface TrackLike {
  id: string
  data: TrackData
  /** 上游带的「我是否喜欢」水印；没带 = `undefined`，不写状态 */
  liked?: boolean
}

export interface RowActionOptions {
  ui: UiValue
  core?: QishuiCore
  row: ListRow
  /** 本页的曲目：「播放这首」连同它们一起进队列，播完接着听这一页 */
  list?: Track[]
  /** 当前页就是一张歌单时带上：菜单里才有改名 / 删歌单 / 把这首移出去 */
  playlist?: { id: string; title: string }
  /** 当前页是一张**本地**歌单时带上：菜单里才有「从本歌单移出」（本地库自己管，不需要登录） */
  localPlaylist?: { id: string; title: string }
  /**
   * 调用方已经知道这一行是自己的（「我的歌单」列表就是这种）：
   * 不必等上游在歌单对象里回 `owner.id` —— 那条字段在 `GetMyPlaylists` 里不保证有，
   * 拿它当唯一判据会让「改名 / 删歌单」在自己的歌单上凭空消失。
   */
  owned?: boolean
  /** 写成功之后回调一次（本页要重读时才看得到条目真的进/出，比如取消关注） */
  afterWrite?: () => void
  play: PlayFn
}

export interface TrackActionOptions {
  ui: UiValue
  core?: QishuiCore
  track: TrackLike
  /** 插在「曲目本体操作」前面的条目（列表页的播放/下一首/队尾、队列行的立即播放） */
  lead?: Entry[]
  /** 追加在后面的条目（队列行的从队列移除、歌单页的移出/改名/删歌单） */
  tail?: Entry[]
  afterWrite?: () => void
  play: PlayFn
}

export interface RowActions {
  title: string
  entries: Entry[]
}

export interface QueueTrackActionOptions {
  ui: UiValue
  core?: QishuiCore
  track: TrackLike
  /** 这一行在队列里的**播放顺序**下标（0 基，与 `player.queue.index` 同一个空间） */
  position: number
  /** 跳到这一行（= core 的 `player.playIndex`） */
  jump(): void
  /** 把这一行从队列里摘掉（= core 的 `player.removeFromQueue`） */
  remove(): void
  play: PlayFn
}

/**
 * 播放页右栏（队列行）的菜单：**与当前曲目、与列表页的行同一份**曲目本体条目，
 * 只在两头各加一项 —— 前置「立即播放这首」（不是「播放这首」：队列里点它要跳到那一行，
 * 而不是把整队换成一首），后置「从队列移除」。
 */
export function buildQueueTrackActions(opts: QueueTrackActionOptions): Entry[] {
  const { ui, position, jump, remove } = opts
  /** 先关菜单再动手：菜单盖着时执行，toast 与列表刷新都会被挡住 */
  const act =
    (run: () => void): (() => void) =>
    () => {
      ui.closeOverlay()
      run()
    }
  return buildTrackActions({
    ui: opts.ui,
    core: opts.core,
    track: opts.track,
    play: opts.play,
    lead: [
      {
        key: 'jump',
        label: '立即播放这首',
        note: `队列第 ${position + 1} 首`,
        onEnter: act(jump),
      },
    ],
    tail: [{ key: 'remove-from-queue', label: '从队列移除', onEnter: act(remove) }],
  })
}

/** 归属只在 `ownerId` 真能对上激活账号时才认定；对不上或上游没给，就不给改名/删除 */
function isMine(core: QishuiCore | undefined, ownerId?: string): boolean {
  return Boolean(core?.loggedIn && ownerId && core.activeUid && ownerId === core.activeUid)
}

/**
 * 收藏状态的两个来源，都不发请求：
 *  1. **这一行自己带的水印** —— 登录态下 `Search`/榜单/推流/`MGetMedia` 的每个曲目实体都嵌了
 *     `state.is_collected`（实测 2026-10-18，见 `packages/qishui-api/test/probe-state.ts`），core 已解析成 `Track.liked`；
 *  2. 退一步只**白拿**内存里那份「我喜欢的音乐」清单（`liked-tracks` 缓存，`isLiked` 读的就是它）。
 * 两个都没有就返回 undefined —— 建菜单不等它，翻完整张收藏是好几轮请求。
 */
function likedFromPage(core: QishuiCore, trackId: string, liked?: boolean): boolean | undefined {
  if (liked !== undefined) return liked
  const cached = core.cache.peek<{ tracks?: { id: string }[] }>('liked-tracks', 'list')
  return cached?.tracks ? cached.tracks.some((t) => t.id === trackId) : undefined
}

/** 建条目要用的那一套小工具（列表页与播放页共用同一份口径） */
function makeKit(opts: { ui: UiValue; core?: QishuiCore; afterWrite?: () => void; play: RowActionOptions['play'] }) {
  const { ui, core, afterWrite, play } = opts
  const loggedIn = Boolean(core?.loggedIn)

  /** 先关菜单再执行：否则动作的 toast 会被菜单挡住，且关掉后列表页自己会重读 */
  const act =
    (run: () => void): (() => void) =>
    () => {
      ui.closeOverlay()
      run()
    }
  /** 未登录的写类条目：照常列出但不可选中（`useEntries` 会把 disabled 剔出可选项） */
  const locked = (key: string, label: string): Entry => ({ key, label: `${label}（需登录）`, disabled: true })
  /** 一项普通动作（读类、本地队列、跳转 —— 匿名也能用） */
  const item = (key: string, label: string, run: () => void, note?: string): Entry => ({
    key,
    label,
    note,
    onEnter: act(run),
  })
  /** 写类动作：登录了才可选，未登录走 `locked` */
  const write = (key: string, label: string, run: () => void, note?: string): Entry =>
    loggedIn ? item(key, label, run, note) : locked(key, label)
  /** 交给另一个弹层：`openOverlay` 自己会换掉当前这一层，所以不用先关 */
  const sheet = (key: string, label: string, open: () => void): Entry => ({ key, label, onEnter: open })
  /** 写类弹层（加入歌单/举报）：未登录不给进 */
  const popup = (key: string, label: string, open: () => void): Entry =>
    loggedIn ? sheet(key, label, open) : locked(key, label)
  /** 异步写：错误一律以 toast 收尾，不在这里替上游下结论 */
  const task =
    (run: () => Promise<unknown>): (() => void) =>
    () =>
      void run().catch((err: unknown) => ui.toast(err instanceof Error ? err.message : String(err), 'error'))
  /** 整列播放：把 Track 换成 TrackData 再交给出声入口（第三个参数 = 这批属于哪份队列） */
  const playAll = (tracks: (Track | TrackData)[], startTrackId?: string, queue?: QueueSpec): Promise<void> => {
    const data = tracks.map((t) => ('data' in t && t.data ? t.data : (t as TrackData)))
    // 没指定队列就不传第三参：调用方按「当前页那份队列」兜底（列表页的曲目行就是这个口径）
    return Promise.resolve(queue ? play(data, startTrackId, queue) : play(data, startTrackId))
  }

  /** 「我的喜欢」：note 报这一行自带的水印（没有再退到内存里那份收藏清单）；状态没读过就留空 */
  const likedItem = (track: TrackLike): Entry => {
    const { id: trackId } = track
    const name = track.data.name
    if (!loggedIn || !core) return locked('like', '加入「我的喜欢」')
    const known = likedFromPage(core, trackId, track.liked)
    return item(
      'like',
      '我的喜欢（切换）',
      task(async () => {
        // 行上带了水印就照它做（省掉「翻完整张我喜欢的音乐」）；没带才真读一次
        const nowLiked = !(known ?? (await core.library.isLiked(trackId)))
        if (nowLiked) await core.library.like(trackId)
        else await core.library.unlike(trackId)
        ui.toast(nowLiked ? `已加入「我的喜欢」：${name}` : `已取消喜欢：${name}`, nowLiked ? 'success' : 'info')
        // 就地翻这一行的水印：本页数据是打开那一刻的快照，不等重读也得跟着真相位
        track.data.state = { ...track.data.state, isCollected: nowLiked }
        afterWrite?.()
      }),
      known === undefined ? undefined : known ? '已喜欢' : '未喜欢',
    )
  }

  /** 未登录时末尾补的出口：写类条目都置灰了，总得有一条能走的路 */
  const loginItem = (): Entry => item('login', '去登录（汽水音乐 App 扫码）', () => ui.openOverlay({ kind: 'login' }))

  return { loggedIn, act, locked, item, write, sheet, popup, task, playAll, likedItem, loginItem }
}

/** 播放器手里的 `TrackData` 就地拼一个菜单/按钮共用的实体 */
export function trackLikeOf(data: TrackData): TrackLike {
  return { id: data.id, data, liked: data.state?.isCollected }
}

/**
 * 「现在算不算已喜欢」（按钮文案用，**不发请求**）：磁盘文件读本地库，云端曲目先看水印、
 * 退到内存里那份收藏清单；两头都没有就按水印缺省（false）。
 */
export function trackLiked(core: QishuiCore | undefined, track: TrackLike): boolean {
  if (track.data.localPath) return Boolean(core?.local.isTrackLiked(track))
  return core ? Boolean(likedFromPage(core, track.id, track.liked)) : Boolean(track.liked)
}

/**
 * [喜欢] 按钮（听歌页 / 底部播放条）的动作：与菜单里那条 `我的喜欢（切换）` **同一条路**——
 * 磁盘文件走本地库（不需要登录），云端先看水印/内存清单、两头都没有才真读一次 `isLiked`，
 * 成功后就地翻 `TrackData` 的水印再 `bump()` 重读（不等重读按钮文案也得跟着真相位）。
 * 与菜单版的差别只有：没有弹层要关、失败自己接住toast。
 */
export async function toggleTrackLike(opts: { ui: UiValue; core?: QishuiCore; track: TrackLike }): Promise<void> {
  const { ui, core, track } = opts
  if (!core) {
    ui.toast('core 还没就绪，稍后再试', 'error')
    return
  }
  const name = track.data.name
  try {
    if (track.data.localPath) {
      const now = await core.local.toggleLike(track)
      ui.toast(now ? `已加入本地喜欢：${name}` : `已移出本地喜欢：${name}`, now ? 'success' : 'info')
      track.data.state = { ...track.data.state, isCollected: now }
      ui.bump()
      return
    }
    if (!core.loggedIn) {
      ui.toast('登录之后才有「我的喜欢」（侧边栏底部扫码）', 'info')
      return
    }
    const known = likedFromPage(core, track.id, track.liked)
    const nowLiked = !(known ?? (await core.library.isLiked(track.id)))
    if (nowLiked) await core.library.like(track.id)
    else await core.library.unlike(track.id)
    ui.toast(nowLiked ? `已加入「我的喜欢」：${name}` : `已取消喜欢：${name}`, nowLiked ? 'success' : 'info')
    track.data.state = { ...track.data.state, isCollected: nowLiked }
    ui.bump()
  } catch (err) {
    ui.toast(err instanceof Error ? err.message : String(err), 'error')
  }
}

/**
 * 一首曲目的「本体操作」（详情 / 喜欢 / 评论 / 加入歌单 / 相似歌曲 / 不感兴趣 / 举报）。
 *
 * 列表页的行、播放页的当前曲目、播放页队列里的行共用这一份：`lead` 放各自的前置项
 * （列表页是播放/下一首/队尾，队列行是立即播放），`tail` 放后置项（从队列移除、歌单改名/删除）。
 */
export function buildTrackActions(opts: TrackActionOptions): Entry[] {
  const { ui, core, track, lead = [], tail = [] } = opts
  const kit = makeKit(opts)
  const { item, sheet, popup, write, task, playAll } = kit
  const trackId = track.id
  const name = track.data.name

  // 本地库里的曲目（`localPath` = 磁盘上的文件）：只给**纯本地**那一套。
  // 评论/详情/加入歌单/相似歌曲/不感兴趣/举报都是上游的动作，磁盘文件没有这些；
  // 反过来「本地喜欢」「加入本地歌单」是本地库自己管的，不需要登录，所以这里也不该出现「（需登录）」。
  if (track.data.localPath) {
    const liked = core ? core.local.isTrackLiked(track) : false
    const localOnly: Entry[] = [
      item(
        'local-like',
        '本地喜欢（切换）',
        task(async () => {
          if (!core) return
          const now = await core.local.toggleLike(track)
          ui.toast(now ? `已加入本地喜欢：${name}` : `已移出本地喜欢：${name}`, now ? 'success' : 'info')
          // 就地翻这一行的水印，本页重读之前也先对得上
          track.data.state = { ...track.data.state, isCollected: now }
          opts.afterWrite?.()
        }),
        liked ? '已喜欢' : '未喜欢',
      ),
      sheet('local-add', '加入本地歌单…', () => {
        if (!core) return ui.toast('core 还没就绪，稍后再试', 'error')
        const picks: Entry[] = core.local.playlists().map((playlist) => ({
          key: `lp:${playlist.id}`,
          label: playlist.title,
          note: `${playlist.keys.length} 首`,
          onEnter: kit.act(
            task(async () => {
              const added = await core.local.addToPlaylist(playlist.id, [track.data])
              ui.toast(
                added ? `已加入《${playlist.title}》` : `《${playlist.title}》里已经有这首了`,
                added ? 'success' : 'info',
              )
              opts.afterWrite?.()
            }),
          ),
        }))
        if (!picks.length) picks.push({ key: 'none', label: '还没有本地歌单（在「本地」页按 N 新建）', disabled: true })
        ui.openOverlay({ kind: 'actions', title: '加入本地歌单', entries: picks })
      }),
      {
        key: 'path',
        label: `文件：${truncate(track.data.localPath, 50)}`,
        note: '磁盘上的文件',
        disabled: true,
      },
    ]
    return [...lead, ...localOnly, ...tail]
  }

  const entries: Entry[] = [...lead]
  entries.push(
    kit.likedItem(track),
    sheet('comments', '评论', () => ui.openOverlay({ kind: 'comments', trackId, title: name })),
    item('detail', '详情', () => ui.push({ kind: 'track', id: trackId })),
    popup('add', '加入歌单', () => ui.openOverlay({ kind: 'add', trackIds: [trackId] })),
    item(
      'related',
      '相似歌曲（播放入队）',
      () =>
        void (async () => {
          const related = await core?.catalog.related(track, 30)
          if (related?.length) await playAll(related, related[0]?.id)
          else ui.toast('没拿到相似歌曲', 'info')
        })(),
    ),
    // 所属专辑 / 艺人不在这里列：菜单只留「详情」一条入口，专辑与艺人都在详情页里给（避免同一行两项跳转）
    write(
      'dislike',
      '不感兴趣',
      task(async () => {
        await core?.feedback.dislike(trackId)
        ui.toast(`已标记不感兴趣：${name}`, 'info')
      }),
    ),
    popup('report', '举报', () => ui.openOverlay({ kind: 'report', trackId, title: name })),
  )
  entries.push(...tail)
  if (entries.some((entry) => entry.disabled)) entries.push(kit.loginItem())
  return entries
}

export function buildRowActions(opts: RowActionOptions): RowActions {
  const { ui, core, row, playlist, localPlaylist, owned, afterWrite, play } = opts
  const list = opts.list ?? []
  const entries: Entry[] = []
  const kit = makeKit(opts)
  const { item, write, task, playAll, loginItem } = kit

  /** 收藏 / 取消收藏一个实体：note 只报上游带的水印，写完就地翻水印 + 让本页重读 */
  const collectToggle = (opts: {
    collected: boolean | undefined
    label: string
    on(): unknown | Promise<unknown>
    off(): unknown | Promise<unknown>
    done(now: boolean): void
    stamp(now: boolean): void
  }): Entry => {
    const { collected, label } = opts
    return write(
      collected ? 'uncollect' : 'collect',
      collected ? `取消收藏${label}` : `收藏${label}`,
      task(async () => {
        const now = !collected
        if (now) await opts.on()
        else await opts.off()
        opts.done(now)
        opts.stamp(now)
        afterWrite?.()
      }),
      collected === undefined ? undefined : collected ? '已收藏' : '未收藏',
    )
  }

  if (row.kind === 'track') {
    const { id: trackId, name } = row
    const data = row.track.data
    const withContext = list.length > 1
    // 前置项：列表页的第一项永远是「播放这首」，所以 `Enter Enter` 就能出声
    const lead: Entry[] = [
      item(
        'play',
        '播放这首',
        () => void (withContext ? playAll(list, trackId) : playAll([row.track])),
        withContext ? `本页 ${list.length} 首一起进队列` : undefined,
      ),
      item('next', '下一首播放', () => core?.player.playNext(data)),
      item('queue', '加入队尾', () => core?.player.enqueue(data)),
    ]
    // 页面级的歌单操作也挂在这一行的菜单里：一期先把 `e`/`D` 这两个散键收掉，不丢能力
    const tail: Entry[] = [
      ...(playlist
        ? [
            write('remove', `从《${truncate(playlist.title, 20)}》移出`, () =>
              confirmRemoveFromPlaylist({
                ui,
                core,
                playlistId: playlist.id,
                trackId,
                name,
                onDone: () => ui.bump(),
              }),
            ),
            write('rename-playlist', '本歌单：改名', () => promptRenamePlaylist({ ui, core, id: playlist.id })),
            write('delete-playlist', '本歌单：删歌单', () =>
              confirmDeletePlaylist({
                ui,
                core,
                id: playlist.id,
                title: playlist.title,
                onDone: () => ui.pop(),
              }),
            ),
          ]
        : []),
      // 本地歌单页：把这首从这张本地歌单移出（本地库自己管，不需要登录）
      ...(localPlaylist
        ? [
            item(
              'local-remove',
              `从《${truncate(localPlaylist.title, 20)}》移出`,
              task(async () => {
                if (!core) return
                await core.local.removeFromPlaylist(localPlaylist.id, core.local.keyOf(row.track))
                ui.toast(`已移出：${name}`, 'success')
                afterWrite?.()
              }),
            ),
          ]
        : []),
    ]
    entries.push(...buildTrackActions({ ui, core, track: row.track, lead, tail, afterWrite, play }))
  } else if (row.kind === 'playlist') {
    entries.push(
      item('open', '打开歌单', () => ui.push({ kind: 'list', source: { kind: 'playlist', id: row.id } })),
      item(
        'play',
        '播放整张',
        () =>
          void (async () => {
            const entity = await core?.catalog.playlist(row.id)
            const tracks = entity ? await entity.allTracks() : []
            if (tracks.length)
              // 从第一首起：正在听这张时再点「播放整张」也该从头放，不是「什么都没发生」
              await playAll(tracks, tracks[0]?.id, {
                kind: 'playlist',
                id: `playlist:${row.id}`,
                title: `歌单 · ${row.title}`,
                load: async () => tracks.map((t) => t.data),
              })
            else ui.toast('这张歌单没有曲目', 'info')
          })(),
      ),
      collectToggle({
        collected: row.playlist.collected,
        label: '这张歌单',
        on: () => core?.library.collectPlaylists([row.id]),
        off: () => core?.library.uncollectPlaylists([row.id]),
        done: (now) => ui.toast(`${now ? '已收藏歌单' : '已取消收藏歌单'}：${row.title}`, now ? 'success' : 'info'),
        stamp: (now) => {
          row.playlist.data.state = { ...row.playlist.data.state, isCollected: now }
        },
      }),
    )
    // 自己的歌单才给改名/删除：`owned` 是调用方给的确证（「我的歌单」列表），
    // 否则退回看上游回没回 owner.id；「我喜欢的音乐」是自动歌单，两个都不给
    if ((owned || isMine(core, row.playlist.data.ownerId)) && !row.playlist.isLikedList) {
      entries.push(
        write('rename', '改名', () =>
          promptRenamePlaylist({
            ui,
            core,
            id: row.id,
            onDone: () => {
              ui.bump()
              afterWrite?.()
            },
          }),
        ),
        write('delete', '删歌单', () =>
          confirmDeletePlaylist({
            ui,
            core,
            id: row.id,
            title: row.title,
            onDone: () => {
              ui.bump()
              afterWrite?.()
            },
          }),
        ),
      )
    }
  } else if (row.kind === 'album') {
    entries.push(
      item('open', '打开专辑', () => ui.push({ kind: 'list', source: { kind: 'album', id: row.id } })),
      item(
        'play',
        '播放整张',
        () =>
          void (async () => {
            const tracks = await core?.catalog.albumTracks(row.id)
            if (tracks?.length)
              await playAll(tracks, undefined, { kind: 'temporary', title: `临时 · 专辑 ${row.title}` })
            else ui.toast('这张专辑没有曲目', 'info')
          })(),
      ),
      collectToggle({
        collected: row.album.collected,
        label: '这张专辑',
        on: () => core?.library.collectAlbums([row.id]),
        off: () => core?.library.uncollectAlbums([row.id]),
        done: (now) => ui.toast(`${now ? '已收藏专辑' : '已取消收藏专辑'}：${row.title}`, now ? 'success' : 'info'),
        stamp: (now) => {
          row.album.data.state = { ...row.album.data.state, isCollected: now }
        },
      }),
    )
  } else if (row.kind === 'artist') {
    /**
     * 关注态只报上游给的：`关注艺人`列表、搜索的歌手项、`GetArtistDetail` 都带 `state.is_collected`
     * 或 `state.follow_status`（实测 2026-10-18）；**没关注时上游回的是 `state:{blocked_by_me:false}`**，
     * core 不把「缺 `is_collected`」当成结论（`Artist.following` = undefined），这一行就不写 note、按「还没关注」给入口。
     */
    const followed = row.artist.following
    entries.push(
      item('hot', '打开热门曲目', () => ui.push({ kind: 'list', source: { kind: 'artist', id: row.id, tab: 'hot' } })),
      item('tracks', '全部歌曲', () =>
        ui.push({ kind: 'list', source: { kind: 'artist', id: row.id, tab: 'tracks' } }),
      ),
      item('albums', '全部专辑', () =>
        ui.push({ kind: 'list', source: { kind: 'artist', id: row.id, tab: 'albums' } }),
      ),
      write(
        followed ? 'unfollow' : 'follow',
        followed ? '取消关注这位艺人' : '关注这位艺人',
        task(async () => {
          if (followed) await core?.library.uncollectArtists([row.id])
          else await core?.library.collectArtists([row.id])
          ui.toast(`${followed ? '已取消关注' : '已关注'}：${row.title}`, followed ? 'info' : 'success')
          // 写完让本页重读：不然「取消关注」点了条目却还挂在屏幕上
          afterWrite?.()
        }),
        followed === undefined ? undefined : followed ? '已关注' : '未关注',
      ),
    )
  } else {
    // 用户行：主页在前（资料 + 关注/粉丝 + 拉黑都在那一页），歌单直接下钻是第二入口
    entries.push(
      item('profile', '打开 TA 的主页', () =>
        ui.push({ kind: 'user', id: row.id, nickname: row.user.nickname || undefined }),
      ),
      item('open', '打开 TA 的歌单', () =>
        ui.push({ kind: 'list', source: { kind: 'user-playlists', uid: row.id, nickname: row.user.nickname } }),
      ),
    )
  }

  // 曲目行的条目是 `buildTrackActions` 出的，那里已经补过「去登录」，别补第二次
  if (row.kind !== 'track' && entries.some((entry) => entry.disabled)) entries.push(loginItem())
  return { title: `${row.kind === 'track' ? row.name : row.title} 的操作`, entries }
}
