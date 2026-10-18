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
 */
import type { QishuiCore, Track, TrackData } from 'qishui-core'
import type { UiValue } from './context.js'
import type { Entry } from './entries.js'
import { truncate } from './format.js'
import { confirmDeletePlaylist, confirmRemoveFromPlaylist, promptRenamePlaylist } from './playlistActions.js'
import type { ListRow } from './useList.js'

export interface RowActionOptions {
  ui: UiValue
  core?: QishuiCore
  row: ListRow
  /** 本页的曲目：「播放这首」连同它们一起进队列，播完接着听这一页 */
  list?: Track[]
  /** 当前页就是一张歌单时带上：菜单里才有改名 / 删歌单 / 把这首移出去 */
  playlist?: { id: string; title: string }
  /**
   * 调用方已经知道这一行是自己的（「我的歌单」列表就是这种）：
   * 不必等上游在歌单对象里回 `owner.id` —— 那条字段在 `GetMyPlaylists` 里不保证有，
   * 拿它当唯一判据会让「改名 / 删歌单」在自己的歌单上凭空消失。
   */
  owned?: boolean
  /** 写成功之后回调一次（本页要重读时才看得到条目真的进/出，比如取消关注） */
  afterWrite?: () => void
  /** 出声入口 = core context 的 `playTracks`（单首直接播，多首整列进队列） */
  play(tracks: TrackData[], startTrackId?: string): void | Promise<void>
}

export interface RowActions {
  title: string
  entries: Entry[]
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

export function buildRowActions(opts: RowActionOptions): RowActions {
  const { ui, core, row, playlist, owned, afterWrite, play } = opts
  const list = opts.list ?? []
  const loggedIn = Boolean(core?.loggedIn)
  const entries: Entry[] = []

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
  /** 整列播放：把 Track 换成 TrackData 再交给出声入口 */
  const playAll = (tracks: Track[], startTrackId?: string): Promise<void> =>
    Promise.resolve(
      play(
        tracks.map((t) => t.data),
        startTrackId,
      ),
    )

  /** 「我的喜欢」：note 报这一行自带的水印（没有再退到内存里那份收藏清单）；状态没读过就留空 */
  const likedItem = (track: Track): Entry => {
    const { id: trackId, name } = track
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
    entries.push(
      item(
        'play',
        '播放这首',
        () => void (withContext ? playAll(list, trackId) : playAll([row.track])),
        withContext ? `本页 ${list.length} 首一起进队列` : undefined,
      ),
      item('next', '下一首播放', () => core?.player.playNext(data)),
      item('queue', '加入队尾', () => core?.player.enqueue(data)),
      likedItem(row.track),
      sheet('comments', '评论', () => ui.openOverlay({ kind: 'comments', trackId, title: name })),
      item('detail', '详情', () => ui.push({ kind: 'track', id: trackId })),
      popup('add', '加入歌单', () => ui.openOverlay({ kind: 'add', trackIds: [trackId] })),
      item(
        'related',
        '相似歌曲（播放入队）',
        () =>
          void (async () => {
            const related = await core?.catalog.related(trackId, 30)
            if (related?.length) await playAll(related, related[0]?.id)
            else ui.toast('没拿到相似歌曲', 'info')
          })(),
      ),
    )
    // 所属专辑 / 艺人不在这里列：菜单只留「详情」一条入口，专辑与艺人都在详情页里给（避免同一行两项跳转）
    entries.push(
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
    if (playlist) {
      // 页面级的歌单操作也挂在这一行的菜单里：一期先把 `e`/`D` 这两个散键收掉，不丢能力
      entries.push(
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
      )
    }
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
            if (tracks.length) await playAll(tracks)
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
            if (tracks?.length) await playAll(tracks)
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

  if (entries.some((entry) => entry.disabled))
    entries.push(item('login', '去登录（汽水音乐 App 扫码）', () => ui.openOverlay({ kind: 'login' })))
  return { title: `${row.kind === 'track' ? row.name : row.title} 的操作`, entries }
}
