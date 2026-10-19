/**
 * 行操作菜单的条目构造：全离线单测（假 core + 假 ui），不打上游、不起 PTY。
 *
 * 这是「散键收进菜单」的主验证面：五种行类型各给哪些项、未登录怎么置灰、
 * 「我的喜欢」的三态 note、以及「执行只走该走的那一条路」（播放不写库、删除先过确认框）。
 */
import type { QishuiCore, TrackData } from 'qishui-core'
import { beforeEach, expect, it, vi } from 'vitest'
import type { UiValue } from '../dist/ui/context.js'
import type { Entry } from '../dist/ui/entries.js'
import {
  buildQueueTrackActions,
  buildRowActions,
  buildTrackActions,
  toggleTrackLike,
  trackLiked,
  trackLikeOf,
} from '../dist/ui/rowActions.js'
import type { ListRow } from '../dist/ui/useList.js'

const T1 = '7068138081588611073'
const T2 = '7300000000000000002'
const UID = 'u-1001'

const trackData = (id: string, withAlbum = true): TrackData =>
  ({
    id,
    name: `曲目 ${id}`,
    artists: [{ id: 'a-1', name: '艺人甲' }],
    album: withAlbum ? { id: 'al-1', name: '专辑甲' } : undefined,
    durationMs: 200_000,
  }) as unknown as TrackData

/** 假的 Track 实体：菜单只用 `id` 与 `data`，不用它的方法 */
const fakeTrack = (id: string, withAlbum = true) => ({ id, data: trackData(id, withAlbum) })
const page = () => [fakeTrack(T1), fakeTrack(T2)]

const trackRow = (id = T1, withAlbum = true): ListRow =>
  ({
    kind: 'track',
    id,
    name: `曲目 ${id}`,
    artist: '艺人甲',
    durationMs: 200_000,
    track: fakeTrack(id, withAlbum),
  }) as unknown as ListRow

const playlistRow = (ownerId?: string, type = 3): ListRow =>
  ({
    kind: 'playlist',
    id: 'p-1',
    title: '歌单甲',
    playlist: { id: 'p-1', data: { id: 'p-1', ownerId }, isLikedList: type === 1 },
  }) as unknown as ListRow

const albumRow = (): ListRow =>
  ({ kind: 'album', id: 'al-1', title: '专辑甲', album: { id: 'al-1', data: {} } }) as unknown as ListRow

const artistRow = (following?: boolean): ListRow =>
  ({
    kind: 'artist',
    id: 'a-1',
    title: '艺人甲',
    artist: { id: 'a-1', following, data: {} },
  }) as unknown as ListRow

const userRow = (): ListRow =>
  ({ kind: 'user', id: 'u-2', title: '用户乙', user: { id: 'u-2', nickname: '用户乙' } }) as unknown as ListRow

interface Harness {
  calls: string[]
  entries: Entry[]
  overlays: { kind?: string; onConfirm?: () => void }[]
  play: ReturnType<typeof vi.fn>
  toast: ReturnType<typeof vi.fn>
  go: ReturnType<typeof vi.fn>
  push: ReturnType<typeof vi.fn>
  /** 建菜单期间读过几次收藏状态——菜单必须同步构造，一次都不该有 */
  likeReads: () => number
  /** 写动作成功后本页被要求重读了几次 */
  afterWrites: () => number
}

interface CoreOptions {
  loggedIn?: boolean
  /** 每次调用返回一个状态；给函数是为了能按次序伪造「读不到」 */
  isLiked?: () => Promise<boolean>
  /** 内存里那份「我喜欢的音乐」清单：不给 = 还没读过（`peek` 返回 undefined） */
  liked?: string[]
}

function makeCore(opts: CoreOptions) {
  const calls: string[] = []
  let likeReads = 0
  const write = (label: string) => () => {
    calls.push(label)
    return Promise.resolve()
  }
  return {
    calls,
    core: {
      loggedIn: opts.loggedIn ?? true,
      activeUid: UID,
      // 建菜单只白拿这个（同步），不去 `isLiked` 里翻整张收藏
      cache: {
        peek: (kind: string, id: string) =>
          kind === 'liked-tracks' && id === 'list' && opts.liked
            ? { tracks: opts.liked.map((trackId) => ({ id: trackId })) }
            : undefined,
      },
      library: {
        isLiked: () => {
          likeReads++
          return opts.isLiked ? opts.isLiked() : Promise.resolve(false)
        },
        like: write(`like:${T1}`),
        unlike: write(`unlike:${T1}`),
        collectPlaylists: write('collectPlaylist:p-1'),
        collectAlbums: write('collectAlbum:al-1'),
        collectArtists: write('collectArtist:a-1'),
        uncollectArtists: write('uncollectArtist:a-1'),
        deletePlaylists: write('deletePlaylist:p-1'),
      },
      feedback: { dislike: write(`dislike:${T1}`) },
      player: {
        playNext: (t: TrackData) => calls.push(`playNext:${t.id}`),
        enqueue: (t: TrackData) => calls.push(`enqueue:${t.id}`),
      },
      catalog: {
        related: () => Promise.resolve([]),
        playlist: () => Promise.resolve({ id: 'p-1', allTracks: () => Promise.resolve(page()) }),
        albumTracks: () => Promise.resolve([fakeTrack(T1)]),
      },
    },
    likeReads: () => likeReads,
  }
}

function build(row: ListRow, opts: CoreOptions = {}, extra: { owned?: boolean } = {}): Harness {
  const { core, calls, likeReads } = makeCore(opts)
  const overlays: { kind?: string; onConfirm?: () => void }[] = []
  const play = vi.fn()
  const toast = vi.fn()
  const go = vi.fn()
  const push = vi.fn()
  let afterWrites = 0
  const ui = {
    toast,
    bump: vi.fn(),
    pop: vi.fn(),
    go,
    push,
    openOverlay: (overlay: { kind?: string; onConfirm?: () => void }) => overlays.push(overlay),
    closeOverlay: vi.fn(),
  } as unknown as UiValue
  const { title, entries } = buildRowActions({
    ui,
    core: core as unknown as QishuiCore,
    row,
    list: page() as never,
    // 曲目行都当作「打开了一张歌单」来构造，才覆盖得到移出/改名/删除这三项
    playlist: row.kind === 'track' ? { id: 'p-1', title: '歌单甲' } : undefined,
    owned: extra.owned,
    afterWrite: () => {
      afterWrites++
    },
    play,
  })
  expect(title).toContain('的操作')
  return { calls, entries, overlays, play, toast, go, push, likeReads, afterWrites: () => afterWrites }
}

/** onEnter 里的异步链全靠已 settle 的 promise：排一次宏任务就干净 */
const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

const pick = (entries: Entry[], key: string): Entry => {
  const entry = entries.find((e) => e.key === key)
  expect(entry, `菜单里没有这一项：${key}`).toBeTruthy()
  return entry as Entry
}

const labels = (entries: Entry[]): string[] => entries.map((e) => e.label)

beforeEach(() => {
  vi.restoreAllMocks()
})

it('曲目行：菜单项顺序固定，第一项就是播放', () => {
  const { entries } = build(trackRow(), { liked: [T1] })
  expect(labels(entries)).toEqual([
    '播放这首',
    '下一首播放',
    '加入队尾',
    '我的喜欢（切换）',
    '评论',
    '详情',
    '加入歌单',
    '相似歌曲（播放入队）',
    '不感兴趣',
    '举报',
    '从《歌单甲》移出',
    '本歌单：改名',
    '本歌单：删歌单',
  ])
  expect(pick(entries, 'like').note).toBe('已喜欢')
  expect(entries.some((e) => e.disabled)).toBe(false)
})

it('曲目行：专辑 / 艺人只留「详情」一条入口；本页多首时「播放这首」连同整页进队列', async () => {
  const { entries, play } = build(trackRow(T1, false))
  for (const key of ['album', 'artist']) expect(entries.map((e) => e.key)).not.toContain(key)
  expect(pick(entries, 'play').note).toBe('本页 2 首一起进队列')
  await pick(entries, 'play').onEnter?.()
  expect(play).toHaveBeenCalledWith([trackData(T1), trackData(T2)], T1)
})

it('「我的喜欢」的 note：只白拿内存里的收藏清单，没核对过就不写状态；建菜单一次都不读', () => {
  const liked = build(trackRow(), { liked: [T1, T2] })
  const notLiked = build(trackRow(), { liked: [] })
  const unread = build(trackRow())
  expect(pick(liked.entries, 'like').note).toBe('已喜欢')
  expect(pick(notLiked.entries, 'like').note).toBe('未喜欢')
  expect(pick(unread.entries, 'like').note).toBeUndefined()
  // 「翻完整张我喜欢的音乐」是好几轮请求，拿它挡菜单＝点下去没画面
  expect(liked.likeReads()).toBe(0)
  expect(notLiked.likeReads()).toBe(0)
  expect(unread.likeReads()).toBe(0)
})

it('执行「我的喜欢」：状态留到执行那一刻读（一次），已喜欢走 unlike、未喜欢走 like', async () => {
  const liked = build(trackRow(), { isLiked: () => Promise.resolve(true) })
  expect(liked.likeReads()).toBe(0)
  await pick(liked.entries, 'like').onEnter?.()
  await flush()
  expect(liked.calls).toEqual([`unlike:${T1}`])
  expect(liked.likeReads()).toBe(1)

  const notLiked = build(trackRow(), { isLiked: () => Promise.resolve(false) })
  await pick(notLiked.entries, 'like').onEnter?.()
  await flush()
  expect(notLiked.calls).toEqual([`like:${T1}`])

  // 读不到就是读不到：报错收尾，两边都不调
  const flaky = build(trackRow(), { isLiked: () => Promise.reject(new Error('未验证')) })
  await pick(flaky.entries, 'like').onEnter?.()
  await flush()
  expect(flaky.calls).toEqual([])
  expect(flaky.toast).toHaveBeenCalled()
  expect(flaky.toast.mock.calls[0]?.[1]).toBe('error')
})

it('未登录：写类项置灰并说明要登录，末尾补一个能走的「去登录」', async () => {
  const { entries, overlays } = build(trackRow(), { loggedIn: false })
  expect(entries.filter((e) => e.disabled).map((e) => e.key)).toEqual([
    'like',
    'add',
    'dislike',
    'report',
    'remove',
    'rename-playlist',
    'delete-playlist',
  ])
  for (const entry of entries.filter((e) => e.disabled)) expect(entry.label).toMatch(/（需登录）$/)
  // 读类项不受影响：评论/详情/播放照旧可选
  expect(pick(entries, 'comments').disabled).toBeFalsy()
  expect(pick(entries, 'play').disabled).toBeFalsy()
  const last = entries[entries.length - 1] as Entry
  expect(last.label).toBe('去登录（汽水音乐 App 扫码）')
  expect(last.disabled).toBeFalsy()
  // 账号页已经并进「设置」，登录走的是全屏弹层，不再跳一级页
  overlays.length = 0
  await last.onEnter?.()
  expect(overlays.map((o) => o.kind)).toEqual(['login'])
})

it('播放只出声不写库；删歌单必须先过确认框', async () => {
  const { entries, play, calls, overlays } = build(trackRow())
  await pick(entries, 'play').onEnter?.()
  await flush()
  expect(play).toHaveBeenCalled()
  expect(calls).toEqual([])

  await pick(entries, 'delete-playlist').onEnter?.()
  await flush()
  expect(overlays[0]?.kind).toBe('confirm')
  expect(calls).toEqual([])
  overlays[0]?.onConfirm?.()
  await flush()
  expect(calls).toEqual(['deletePlaylist:p-1'])
})

it('歌单行：自己的歌单才有改名/删除，「我喜欢的音乐」不给删', async () => {
  expect(labels(build(playlistRow('other-uid')).entries)).toEqual(['打开歌单', '播放整张', '收藏这张歌单'])
  expect(labels(build(playlistRow(undefined)).entries)).toEqual(['打开歌单', '播放整张', '收藏这张歌单'])
  expect(labels(build(playlistRow(UID, 1)).entries)).toEqual(['打开歌单', '播放整张', '收藏这张歌单'])

  const mine = build(playlistRow(UID))
  expect(labels(mine.entries)).toEqual(['打开歌单', '播放整张', '收藏这张歌单', '改名', '删歌单'])
  await pick(mine.entries, 'play').onEnter?.()
  await flush()
  // 「播放整张」进的是**这张歌单自己的队列**（不是当前页的临时队列）
  // 第二参 = 从第一首起（正在听这张时再点「播放整张」也该从头放）
  expect(mine.play).toHaveBeenCalledWith([trackData(T1), trackData(T2)], T1, {
    kind: 'playlist',
    id: 'playlist:p-1',
    title: '歌单 · 歌单甲',
    load: expect.any(Function),
  })
})

it('「我的歌单」列表：调用方确证归属后，上游没回 owner 也给改名/删除；「我喜欢的音乐」照样不给', async () => {
  // `GetMyPlaylists` 不保证回 `owner.id`，靠它当唯一判据会让自己的歌单「不能改名、不能删」
  const mine = build(playlistRow(undefined), {}, { owned: true })
  expect(labels(mine.entries)).toEqual(['打开歌单', '播放整张', '收藏这张歌单', '改名', '删歌单'])
  // 自动歌单（type=1）不属于「可删」的范畴，归属确证也不给
  expect(labels(build(playlistRow(undefined, 1), {}, { owned: true }).entries)).toEqual([
    '打开歌单',
    '播放整张',
    '收藏这张歌单',
  ])

  // 删歌单：先确认框，确认后才发写请求，并让本页重读
  await pick(mine.entries, 'delete').onEnter?.()
  await flush()
  expect(mine.overlays[0]?.kind).toBe('confirm')
  expect(mine.calls).toEqual([])
  mine.overlays[0]?.onConfirm?.()
  await flush()
  expect(mine.calls).toEqual(['deletePlaylist:p-1'])
  expect(mine.afterWrites()).toBe(1)
})

it('搜索结果里的歌单行：不必先打开，菜单里就能整张播出去', async () => {
  const { entries, play, calls } = build(playlistRow('other-uid'))
  expect(labels(entries)).toContain('播放整张')
  await pick(entries, 'play').onEnter?.()
  await flush()
  expect(play).toHaveBeenCalledWith([trackData(T1), trackData(T2)], T1, expect.objectContaining({ kind: 'playlist' }))
  // 整张播只是读歌单 + 出声，不写库
  expect(calls).toEqual([])
})

it('榜单 / 艺人页里的专辑行：菜单里也能直接播整张', async () => {
  const { entries, play, calls } = build(albumRow())
  expect(labels(entries)).toContain('播放整张')
  await pick(entries, 'play').onEnter?.()
  await flush()
  // 专辑是浏览型结果 → 临时队列（和搜索/榜单同口径）
  expect(play).toHaveBeenCalledWith([trackData(T1)], undefined, {
    kind: 'temporary',
    title: '临时 · 专辑 专辑甲',
  })
  expect(calls).toEqual([])
})

it('专辑 / 艺人 / 用户行：各给各的项，收藏与关注都走 library', async () => {
  const album = build(albumRow())
  expect(labels(album.entries)).toEqual(['打开专辑', '播放整张', '收藏这张专辑'])
  const artist = build(artistRow())
  expect(labels(artist.entries)).toEqual(['打开热门曲目', '全部歌曲', '全部专辑', '关注这位艺人'])
  const user = build(userRow())
  expect(labels(user.entries)).toEqual(['打开 TA 的主页', '打开 TA 的歌单'])

  await pick(album.entries, 'collect').onEnter?.()
  await pick(artist.entries, 'follow').onEnter?.()
  await flush()
  expect(album.calls).toEqual(['collectAlbum:al-1'])
  expect(artist.calls).toEqual(['collectArtist:a-1'])
})

it('艺人行按上游给的关注态出关注/取消关注，写完让本页重读', async () => {
  // 「关注的艺人」页里每项都带 state.follow_status=1（实测），这一行就该给取关
  const followed = build(artistRow(true))
  expect(labels(followed.entries)).toContain('取消关注这位艺人')
  expect(pick(followed.entries, 'unfollow').note).toBe('已关注')
  await pick(followed.entries, 'unfollow').onEnter?.()
  await flush()
  expect(followed.calls).toEqual(['uncollectArtist:a-1'])
  // 不重读的话，取关成功条目却还挂在屏幕上，看着就像「取关没用」
  expect(followed.afterWrites()).toBe(1)

  // 上游没给关注态（搜索/详情的水印字段里没有）→ 不写 note，也不断言「未关注」
  const unknown = build(artistRow())
  expect(pick(unknown.entries, 'follow').note).toBeUndefined()
  await pick(unknown.entries, 'follow').onEnter?.()
  await flush()
  expect(unknown.calls).toEqual(['collectArtist:a-1'])
  expect(unknown.afterWrites()).toBe(1)

  // 明确读到「没关注」才写「未关注」
  expect(pick(build(artistRow(false)).entries, 'follow').note).toBe('未关注')
})

it('评论 / 加入歌单 / 举报 只是换弹层，不自己发请求', async () => {
  const { entries, overlays, push } = build(trackRow())
  await pick(entries, 'comments').onEnter?.()
  await pick(entries, 'add').onEnter?.()
  await pick(entries, 'report').onEnter?.()
  expect(overlays.map((o) => o.kind)).toEqual(['comments', 'add', 'report'])
  await pick(entries, 'detail').onEnter?.()
  expect(push).toHaveBeenCalledWith({ kind: 'track', id: T1 })
})

/**
 * 播放页的两种菜单（当前曲目 / 队列行）都不经过 `ListRow` —— 播放器手里只有 `TrackData`，
 * 所以它们走 `buildTrackActions` / `buildQueueTrackActions`。这里验的是「与列表页同一份条目」。
 */
function buildPlayerMenu(kind: 'current' | 'queue', opts: CoreOptions = {}) {
  const { core, calls } = makeCore(opts)
  const overlays: { kind?: string }[] = []
  const push = vi.fn()
  const play = vi.fn()
  const closeOverlay = vi.fn()
  const toast = vi.fn()
  const ui = {
    toast,
    bump: vi.fn(),
    pop: vi.fn(),
    go: vi.fn(),
    push,
    openOverlay: (overlay: { kind?: string }) => overlays.push(overlay),
    closeOverlay,
  } as unknown as UiValue
  // 播放器手里是 TrackData，水印在 `state.isCollected`（不是实体上的 `liked`）
  const track = { id: T1, data: { ...trackData(T1), state: { isCollected: true } }, liked: true }
  const jump = vi.fn()
  const remove = vi.fn()
  const entries =
    kind === 'queue'
      ? buildQueueTrackActions({
          ui,
          core: core as unknown as QishuiCore,
          track,
          position: 2,
          jump,
          remove,
          play,
        })
      : buildTrackActions({ ui, core: core as unknown as QishuiCore, track, play })
  return { entries, overlays, push, play, jump, remove, calls, closeOverlay, toast }
}

it('播放页的当前曲目：菜单就是「曲目本体」那一份（没有播放/队尾，那是列表页的事）', async () => {
  const { entries, overlays, push } = buildPlayerMenu('current')
  expect(labels(entries)).toEqual([
    '我的喜欢（切换）',
    '评论',
    '详情',
    '加入歌单',
    '相似歌曲（播放入队）',
    '不感兴趣',
    '举报',
  ])
  // 水印来自实体 `state.isCollected`，不用等 `isLiked` 翻整张收藏
  expect(pick(entries, 'like').note).toBe('已喜欢')
  await pick(entries, 'comments').onEnter?.()
  await pick(entries, 'add').onEnter?.()
  await pick(entries, 'report').onEnter?.()
  expect(overlays.map((o) => o.kind)).toEqual(['comments', 'add', 'report'])
  await pick(entries, 'detail').onEnter?.()
  expect(push).toHaveBeenCalledWith({ kind: 'track', id: T1 })
})

it('播放页的队列行：同一份条目 + 前置「立即播放」/ 后置「从队列移除」，执行只动队列', async () => {
  const { entries, jump, remove, calls, play, closeOverlay } = buildPlayerMenu('queue')
  expect(labels(entries)).toEqual([
    '立即播放这首',
    '我的喜欢（切换）',
    '评论',
    '详情',
    '加入歌单',
    '相似歌曲（播放入队）',
    '不感兴趣',
    '举报',
    '从队列移除',
  ])
  expect(pick(entries, 'jump').note).toBe('队列第 3 首')

  await pick(entries, 'jump').onEnter?.()
  await pick(entries, 'remove-from-queue').onEnter?.()
  // 先关菜单再动手（菜单盖着时 toast 与列表刷新都会被挡住）
  expect(closeOverlay).toHaveBeenCalledTimes(2)
  expect(jump).toHaveBeenCalledTimes(1)
  expect(remove).toHaveBeenCalledTimes(1)
  // 队列上的动作不写库、不换整队
  expect(calls).toEqual([])
  expect(play).not.toHaveBeenCalled()
})

it('播放页未登录：写类项照旧置灰并补「去登录」，队列的立即播放/移除不受影响', async () => {
  const { entries, overlays } = buildPlayerMenu('queue', { loggedIn: false })
  expect(entries.filter((e) => e.disabled).map((e) => e.key)).toEqual(['like', 'add', 'dislike', 'report'])
  expect(pick(entries, 'jump').disabled).toBeFalsy()
  expect(pick(entries, 'remove-from-queue').disabled).toBeFalsy()
  const last = entries[entries.length - 1] as Entry
  expect(last.label).toBe('去登录（汽水音乐 App 扫码）')
  await last.onEnter?.()
  expect(overlays.map((o) => o.kind)).toEqual(['login'])
})

/**
 * [喜欢] 按钮（听歌页两排操作按钮 + 底部播放条）：与菜单那条「我的喜欢（切换）」同一条路，
 * 只是没有弹层要关。这里验 `trackLikeOf` / `trackLiked` / `toggleTrackLike` 三个共用件。
 */
interface LikeCoreOptions {
  loggedIn?: boolean
  liked?: string[]
  isLiked?: () => Promise<boolean>
  localLiked?: boolean
}

function makeLikeCore(opts: LikeCoreOptions = {}) {
  const calls: string[] = []
  const write = (label: string) => () => {
    calls.push(label)
    return Promise.resolve()
  }
  let localReads = 0
  const core = {
    loggedIn: opts.loggedIn ?? true,
    cache: {
      peek: (kind: string, id: string) =>
        kind === 'liked-tracks' && id === 'list' && opts.liked
          ? { tracks: opts.liked.map((trackId) => ({ id: trackId })) }
          : undefined,
    },
    library: {
      isLiked: () => (opts.isLiked ? opts.isLiked() : Promise.resolve(false)),
      like: write(`like:${T1}`),
      unlike: write(`unlike:${T1}`),
    },
    local: {
      isTrackLiked: () => {
        localReads++
        return Boolean(opts.localLiked)
      },
      toggleLike: (t: { id: string }) => {
        calls.push(`localToggle:${t.id}`)
        return Promise.resolve(!opts.localLiked)
      },
    },
  }
  return { core: core as unknown as QishuiCore, calls, localReads: () => localReads }
}

function makeLikeUi() {
  const toast = vi.fn()
  const bump = vi.fn()
  return { toast, bump, ui: { toast, bump } as unknown as UiValue }
}

it('trackLikeOf：从 TrackData 的 state.isCollected 拼出水印', () => {
  const data = { ...trackData(T1), state: { isCollected: true } } as unknown as TrackData
  const like = trackLikeOf(data)
  expect(like.id).toBe(T1)
  expect(like.liked).toBe(true)
  expect(like.data).toBe(data)
})

it('trackLiked：先看水印、退到内存清单、都没有算 false；磁盘文件读本地库——全程不发请求', () => {
  const { core, localReads } = makeLikeCore({ liked: [] })
  const withMark = trackLikeOf({ ...trackData(T1), state: { isCollected: true } } as unknown as TrackData)
  expect(trackLiked(core, withMark)).toBe(true) // 水印优先
  const inList = trackLikeOf({ ...trackData(T2) } as unknown as TrackData)
  expect(trackLiked(makeLikeCore({ liked: [T2] }).core, inList)).toBe(true) // 退到内存清单
  const unknown = trackLikeOf(trackData(T1))
  expect(trackLiked(core, unknown)).toBe(false) // 两头都没有 → 缺省 false
  expect(localReads()).toBe(0) // 云端曲目不碰本地库

  const local = trackLikeOf({ ...trackData(T1), localPath: '/m/a.mp3' } as unknown as TrackData)
  const localCore = makeLikeCore({ localLiked: true })
  expect(trackLiked(localCore.core, local)).toBe(true)
  expect(localCore.localReads()).toBe(1)
})

it('toggleTrackLike（云端）：已喜欢走 unlike、未喜欢走 like，成功后翻水印 + bump', async () => {
  // 内存清单说这首已喜欢 → 按一下应当取消
  const liked = makeLikeCore({ liked: [T1] })
  const likedTrack = trackLikeOf(trackData(T1))
  const a = makeLikeUi()
  await toggleTrackLike({ ui: a.ui, core: liked.core, track: likedTrack })
  expect(liked.calls).toEqual([`unlike:${T1}`])
  expect(likedTrack.data.state?.isCollected).toBe(false)
  expect(a.bump).toHaveBeenCalledTimes(1)
  expect(a.toast.mock.calls[0]?.[1]).toBe('info')

  // 水印说已喜欢（来自实体）→ 取消；两头都没读过才真读一次 isLiked
  const marked = makeLikeCore()
  const markedTrack = trackLikeOf({ ...trackData(T1), state: { isCollected: true } } as unknown as TrackData)
  const b = makeLikeUi()
  await toggleTrackLike({ ui: b.ui, core: marked.core, track: markedTrack })
  expect(marked.calls).toEqual([`unlike:${T1}`])
  expect(markedTrack.data.state?.isCollected).toBe(false)
})

it('toggleTrackLike：未登录只提示不动写接口；本地文件走本地库、不需要登录', async () => {
  const anon = makeLikeCore({ loggedIn: false })
  const anonTrack = trackLikeOf(trackData(T1))
  const a = makeLikeUi()
  await toggleTrackLike({ ui: a.ui, core: anon.core, track: anonTrack })
  expect(anon.calls).toEqual([])
  expect(a.toast.mock.calls[0]?.[1]).toBe('info')

  const local = makeLikeCore({ loggedIn: false, localLiked: false })
  const localTrack = trackLikeOf({ ...trackData(T1), localPath: '/m/a.mp3' } as unknown as TrackData)
  const b = makeLikeUi()
  await toggleTrackLike({ ui: b.ui, core: local.core, track: localTrack })
  expect(local.calls).toEqual([`localToggle:${T1}`])
  expect(localTrack.data.state?.isCollected).toBe(true)
  expect(b.toast.mock.calls[0]?.[1]).toBe('success')
})
