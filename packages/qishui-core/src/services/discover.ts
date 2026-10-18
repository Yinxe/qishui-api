import { CacheTtl } from '../cache/policy.js'
import type { QishuiCore } from '../core.js'
import { Album, Artist, Playlist, Track, User } from '../entities.js'
import { asAlbum, asArtist, asPlaylist, asTrack, asUser, collectPlaylists, collectTracks, imageUrl } from '../parse.js'
import type { TrackData } from '../types.js'
import { str } from '../util.js'

/** 内容块里的一条资源：原始响应 + 按形状识别出来的实体（识别不出来就只留 type/id） */
export interface DiscoverResource {
  type: string
  id: string
  raw: unknown
  track?: Track
  playlist?: Playlist
  album?: Album
  artist?: Artist
  user?: User
}

export interface DiscoverInner {
  type: string
  title?: string
  /** 场景队列（discover_radio）/ 榜单块（discover_track_top_list）的 id —— 就是 radio_id / chart_id */
  id?: string
  resources: DiscoverResource[]
}

export interface DiscoverBlock {
  type: string
  title?: string
  inner: DiscoverInner[]
}

export interface HomeView {
  blocks: DiscoverBlock[]
  /** 整个首页里捞出来的曲目（去重，按出现顺序） */
  tracks: Track[]
  /** 整个首页里捞出来的歌单 */
  playlists: Playlist[]
  raw: unknown
}

export interface LaunchInfo {
  /** 冷启动要弹的初始偏好选择（曲风/语种） */
  boost?: {
    genres: { id?: string; name?: string; coverUrl?: string }[]
    langs: { code?: string; name?: string; iconUrl?: string }[]
    needSet?: boolean
  }
  raw: unknown
}

export type HomeLayout = 'grid' | 'feed'

/**
 * 推荐流的偏好模式（App「听歌模式」底部那三个）。
 * 取值来自 IDL 常量 `PreferenceModeFamiliar` / `PreferenceModeFresh`（上游 thrift 生成），
 * 缺省是 `default`（推荐）。
 */
export type FeedPreferenceMode = 'default' | 'familiar' | 'fresh' | (string & {})

/** FeedMode 里一条可选项：偏好模式（推荐/熟悉/新鲜）或场景模式（图书馆/专注/摸鱼…） */
export interface FeedModeOption {
  /** `preference_mode` = 偏好；`scene_mode` = 场景 */
  type: 'preference_mode' | 'scene_mode' | (string & {})
  /** 上游给的中文文案（如「推荐」「专注模式」） */
  text: string
  /** 偏好模式的取值（`default` / `familiar` / `fresh`），场景模式为 undefined */
  preferenceMode?: FeedPreferenceMode
  /**
   * 场景模式的 id（`scene_mode_id`，短数字）。
   *
   * **只能喂 `FeedSongTab` 的 `feed_preference.scene_mode_id`**（= `feedSongTab({sceneModeId})`）。
   * 别拿它去当 `radioTracks()` 的 `radio_id`：那条路的 id 是**电台队列**（首页 `discover_radio` 块的
   * `inner_block_id`/`resource_id`，雪花大数），短数字喂进去不报错、但也不生效——回的是通用推荐池
   * （实测：`radio_id=30`「日语」与 `radio_id=8`「助眠」各回 6 首、全是同一类中文流行，
   * 连不存在的 `999999999999` 也照回 6 首）。
   */
  sceneModeId?: number
  /** 场景模式的内部队列名（`scene_mode_focus` 这类，只是标识） */
  subQueueType?: string
  raw: unknown
}

/**
 * 已知的偏好模式。上游的 `feed_mode_bar` **只回当前选中的那一个**（实测只回「推荐」），
 * 所以「熟悉/新鲜」这两个取值来自 IDL 常量（`PreferenceModeFamiliar` / `PreferenceModeFresh`），
 * 不是从响应里枚举出来的。
 */
export const FEED_PREFERENCE_MODES: { mode: FeedPreferenceMode; label: string }[] = [
  { mode: 'default', label: '推荐' },
  { mode: 'familiar', label: '熟悉' },
  { mode: 'fresh', label: '新鲜' },
]

export interface FeedPreferenceOption {
  mode: FeedPreferenceMode
  label: string
  /** 上游当前选中的那个（来自 `feed_mode_bar`） */
  current: boolean
}

export interface FeedModeView {
  /** 偏好栏（推荐/熟悉/新鲜），给 `feedSongTab({preferenceMode})` */
  preferences: FeedPreferenceOption[]
  /** 上游回来的偏好栏条目（通常只有当前那一条，原样留着备查） */
  bar: FeedModeOption[]
  /** 场景音乐（45 个），`sceneModeId` 给 `feedSongTab({sceneModeId})` */
  scenes: FeedModeOption[]
  raw: unknown
}

/**
 * `FeedSongTab` 的完整请求口径（IDL 见 `contract/feed.ts` 的 `FeedSongTabRequest`）。
 * 没列出来的 `is_did_first_request`/`did_first_use_time`/`feed_preference`/`feed_extra`
 * 要么需要设备侧首次使用时间这类我们没采集的量，要么结构是 opaque any，不硬编。
 */
export interface FeedSongTabOptions {
  preferenceMode?: FeedPreferenceMode
  /**
   * 场景模式（`feedModes()` 的 `scene_mode_id`）：进请求体的
   * `feed_preference: { scene_mode_id }`。
   *
   * 这是**场景唯一生效的入口**（实测 2026-10-18）：`scene_mode_id=30`（日语）回 12 首里 9 首
   * 是日文歌（中島美嘉/米津玄師/まふまふ…）、`10`（粤语）回粤语、`32`（古典）回 Mozart/巴赫、
   * `22`（K-pop）回 aespa/MOMOLAND；同一时刻不传它则回通用推荐。注意形状是**扁平**的
   * `{scene_mode_id}`，套一层 `{scene_mode:{scene_mode_id}}` 不生效（实测同样回通用推荐）。
   */
  sceneModeId?: number
  /** 信息流类型；IDL 常量只有 `track`/`mix`，单曲 tab 用 `track` */
  feedMode?: 'track' | 'mix' | (string & {})
  /** 一次要几首，上游默认 6 */
  count?: number
  /**
   * 带本地播放历史当 `played_tracks`。**默认关**：我们只本地记历史、没向上游报播放时长，
   * 主动上报反而暴露「只播不报」；等播放时长的上报口径补上再默认开。
   */
  withPlayedTracks?: boolean
  /** 排除本激活号听过的（journal 最近 500 条）——纯客户端过滤，不赌上游是否真吃 `preference_mode` */
  excludePlayed?: boolean
  /** 排除「我喜欢」里的（要登录；拉不到就跳过） */
  excludeLiked?: boolean
  /** 排除时最多翻几页补量（默认 3，防请求失控） */
  maxPages?: number
  refresh?: boolean
}

/**
 * 一个**听歌模式**的选择，只能是一个值：要么三档偏好之一，要么某个场景。
 *
 * 场景只认 `feedModes()` 的 `scene_mode_id`（短数字）：它进 `FeedSongTab` 的
 * `feed_preference.scene_mode_id`（见 `feedSongTab({sceneModeId})`）。**电台队列**（首页
 * `discover_radio` 的 `inner_block_id`，雪花大数）不是听歌模式的一档，要播走 `radioTracks()`。
 */
export type FeedModeRef = { kind: 'preference'; mode: FeedPreferenceMode } | { kind: 'scene'; sceneModeId: number }

/** `config.feedMode` 的写法：带前缀的扁平串，不用「纯数字就是场景」这种隐式判定 */
export function formatFeedMode(ref: FeedModeRef): string {
  return ref.kind === 'preference' ? `preference:${ref.mode}` : `scene:${ref.sceneModeId}`
}

/**
 * 解析 `config.feedMode`；空串或认不出就是「没选过」，不猜。
 *
 * `scene:` 后面必须是**纯数字**（`scene_mode_id`）。老版本可能把雪花 id 写进过 `scene:`，
 * 那串现在按「认不出」处理（它其实是电台队列，不是场景）——宁可当没选过，也不把电台当场景播。
 */
export function parseFeedMode(raw: string | undefined): FeedModeRef | undefined {
  const text = raw?.trim()
  if (!text) return undefined
  const sep = text.indexOf(':')
  if (sep < 0) return undefined
  const head = text.slice(0, sep)
  const tail = text.slice(sep + 1)
  if (!tail) return undefined
  if (head === 'preference') return { kind: 'preference', mode: tail }
  if (head === 'scene') {
    if (!/^\d+$/.test(tail)) return undefined
    const id = Number(tail)
    return Number.isSafeInteger(id) && id > 0 ? { kind: 'scene', sceneModeId: id } : undefined
  }
  return undefined
}

/**
 * 发现 / 推荐：
 *  - `home()` = `DiscoverView` 推荐页版（空 body）：榜单块 + 歌单推荐 + 场景队列，一次 159 条资源；
 *  - `home({layout:'feed'})` = 听歌模式版：30 个 `discover_radio` 场景队列，**没有榜单块**；
 *  - `mix()` = 单个内容块下钻（`DiscoverMix`）。
 *
 * 返回值已经把 `blocks[].inner_block[].resources[].entity` 剥成实体，
 * 榜单块的 `inner.id` 直接能喂 `core.catalog.chart()`，场景队列的 `inner.id` 能喂 `radioTracks()`。
 */
export class DiscoverService {
  constructor(private core: QishuiCore) {}

  /** 本次进程里 FeedSongTab 的请求计数（App 用它区分冷启动首刷与后续翻页） */
  private readonly feedTabSession = { total: 0, byMode: new Map<string, number>() }

  private get parseOpts() {
    return { coverWidth: this.core.config.coverWidth }
  }

  /** 首页大盘 */
  async home(opts: { layout?: HomeLayout; refresh?: boolean } = {}): Promise<HomeView> {
    const layout = opts.layout ?? 'grid'
    const { value } = await this.core.cache.fetch<any>(
      'discover-home',
      layout,
      () =>
        this.core.request(
          'DiscoverView',
          layout === 'feed' ? { first_request: true, pc_new_discover_request: true } : {},
        ),
      { force: opts.refresh, ttlMs: CacheTtl.none },
    )
    return this.toHomeView(value)
  }

  toHomeView(raw: any): HomeView {
    const blocks: DiscoverBlock[] = (Array.isArray(raw?.blocks) ? raw.blocks : []).map((block: any) => ({
      type: str(block?.type) ?? '',
      title: str(block?.title),
      inner: (Array.isArray(block?.inner_block) ? block.inner_block : []).map((inner: any) => ({
        type: str(inner?.type) ?? '',
        title: str(inner?.title),
        id: str(inner?.inner_block_id),
        resources: (Array.isArray(inner?.resources) ? inner.resources : []).map((res: unknown) => this.toResource(res)),
      })),
    }))
    const tracks = collectTracks(raw, this.parseOpts).map((d) => new Track(this.core, d))
    const playlists = collectPlaylists(raw, this.parseOpts).map((d) => new Playlist(this.core, d))
    return { blocks, tracks, playlists, raw }
  }

  /** 单个内容块下钻：给 `block_type`（如 `discover_playlist`）→ 一批同类型内容块 */
  async mix(opts: { blockType: string; subChannelId?: string; refresh?: boolean }): Promise<DiscoverInner[]> {
    const { value } = await this.core.cache.fetch<any>(
      'discover-mix',
      `${opts.blockType}-${opts.subChannelId ?? ''}`,
      () =>
        this.core.request('DiscoverMix', {
          block_type: opts.blockType,
          sub_channel_id: opts.subChannelId ?? opts.blockType,
        }),
      { force: opts.refresh, ttlMs: CacheTtl.none },
    )
    return (Array.isArray(value.inner_block) ? value.inner_block : []).map((inner: any) => ({
      type: str(inner?.type) ?? '',
      title: str(inner?.title),
      id: str(inner?.inner_block_id),
      resources: (Array.isArray(inner?.resources) ? inner.resources : []).map((res: unknown) => this.toResource(res)),
    }))
  }

  /**
   * 「随便听听」的单曲推荐 tab（一次默认 6 首，含完整 album/artists）。
   * 请求按 App 口径补齐：`feed_mode`/`preference_mode`/`count` + 会话计数
   * （`is_first_request`/`total_request_count`/`preference_mode_request_count`）；
   * 本地播放历史 `played_tracks` 机制在，默认不带（见 `FeedSongTabOptions.withPlayedTracks`）。
   */
  async feedSongTab(opts: FeedSongTabOptions = {}): Promise<Track[]> {
    const mode = opts.preferenceMode ?? 'default'
    const want = opts.count ?? 6
    // 缓存键必须带场景：不然「日语」与「粤语」会互相顶掉对方那一批（ttl 0 只是不落盘，内存里还在）
    const key = opts.sceneModeId === undefined ? mode : `${mode}@scene${opts.sceneModeId}`
    if (!opts.excludePlayed && !opts.excludeLiked) {
      const { value } = await this.core.cache.fetch<any>(
        'feed-song-tab',
        key,
        () => this.core.request('FeedSongTab', this.feedSongTabBody(mode, opts)),
        { force: opts.refresh, ttlMs: CacheTtl.none },
      )
      return this.feedSongTabTracks(value)
    }
    // 客户端排除档：连续翻页去重，补够 want 首或到 maxPages 为止（请求失控防线）
    const excluded = await this.feedExcludedIds(opts)
    const out: Track[] = []
    const seen = new Set<string>()
    const pages = Math.max(1, opts.maxPages ?? 3)
    for (let page = 0; page < pages && out.length < want; page++) {
      const value = await this.core.request('FeedSongTab', this.feedSongTabBody(mode, { ...opts, count: want }))
      for (const track of this.feedSongTabTracks(value)) {
        if (seen.has(track.id)) continue
        seen.add(track.id)
        if (!excluded.has(track.id)) out.push(track)
      }
    }
    return out.slice(0, want)
  }

  private feedSongTabTracks(value: any): Track[] {
    const list = Array.isArray(value?.items) ? value.items : []
    const parsed = list.map((item: unknown) => asTrack(item, this.parseOpts)).filter(Boolean) as TrackData[]
    return (parsed.length ? parsed : collectTracks(value, this.parseOpts, 20)).map((d) => new Track(this.core, d))
  }

  private async feedExcludedIds(opts: FeedSongTabOptions): Promise<Set<string>> {
    const ids = new Set<string>()
    if (opts.excludePlayed) for (const record of this.core.history.recent(500)) ids.add(record.trackId)
    if (opts.excludeLiked) {
      try {
        for (const track of await this.core.library.likedTracks()) ids.add(track.id)
      } catch {
        // 未登录/拉取失败：喜欢池缺席，只剩已播排除
      }
    }
    return ids
  }

  private feedSongTabBody(mode: FeedPreferenceMode, opts: FeedSongTabOptions): Record<string, unknown> {
    this.feedTabSession.total += 1
    const modeCount = (this.feedTabSession.byMode.get(mode) ?? 0) + 1
    this.feedTabSession.byMode.set(mode, modeCount)
    const body: Record<string, unknown> = {
      feed_mode: opts.feedMode ?? 'track',
      preference_mode: mode,
      count: opts.count ?? 6,
      is_first_request: this.feedTabSession.total === 1,
      total_request_count: this.feedTabSession.total,
      preference_mode_request_count: modeCount,
    }
    if (opts.sceneModeId !== undefined) {
      // 形状是扁平的 `{scene_mode_id}`（实测；套一层 `{scene_mode:{...}}` 不生效）
      body.feed_preference = { scene_mode_id: opts.sceneModeId }
    }
    if (opts.withPlayedTracks) {
      const played = this.core.history.recent(20).reverse()
      if (played.length) {
        // IDL 里 TrackPlayed 是 opaque any，字段名按同构的 MediaPlayed（entity/media.ts）推的，效果未对上游验证
        body.played_tracks = played.map((r) => ({
          track_id: r.trackId,
          played_mills: r.playedMs ?? r.durationMs ?? 0,
          duration: r.durationMs ?? 0,
          play_timestamp: Math.floor(r.at / 1000),
        }))
      }
    }
    return body
  }

  /** 歌单广场（分类歌单页的数据源） */
  async playlistSquare(
    opts: { categoryId?: string; refresh?: boolean } = {},
  ): Promise<{ playlists: Playlist[]; categories: any[] }> {
    const categoryId = opts.categoryId ?? ''
    const { value } = await this.core.cache.fetch<any>(
      'playlist-square',
      categoryId,
      () => this.core.request('FeedPlaylistSquare', { category_id: categoryId }),
      { force: opts.refresh, ttlMs: CacheTtl.none },
    )
    const list = Array.isArray(value.items) ? value.items : []
    const playlists = list
      .map((item: unknown) => asPlaylist(item, this.parseOpts))
      .filter(Boolean)
      .map((d: any) => new Playlist(this.core, d))
    return { playlists, categories: Array.isArray(value.categories) ? value.categories : [] }
  }

  /**
   * 电台队列的曲目批次：`radioId` 是首页 `discover_radio` 块的 `inner_block_id`（雪花大数，
   * 与 `resources[].resource_id` / link 里的 `queue_id` 同一个值）。
   *
   * **别拿场景的 `scene_mode_id` 喂这里**：短数字不报错、但也不生效，回的是通用推荐池
   * （实测 `radio_id=30`/`8`/`999999999999` 三档各回 6 首、内容同一类）。场景走
   * `feedSongTab({sceneModeId})`——那是唯一能让场景真正生效的路。
   * **一次只随机给一小批（实测 6 首）**，是「连着播的批次来源」，不是一屏可浏览的列表。
   */
  async radioTracks(radioId: string | number, opts: { refresh?: boolean } = {}): Promise<Track[]> {
    const key = String(radioId)
    const { value } = await this.core.cache.fetch<any>(
      'radio-tracks',
      key,
      () => this.core.request('FeedRadioTracks', { radio_id: radioId }),
      { force: opts.refresh, ttlMs: CacheTtl.none },
    )
    return collectTracks(value, this.parseOpts, 50).map((d) => new Track(this.core, d))
  }

  /**
   * 按一个听歌模式取一批曲目。**两档都走 `FeedSongTab`**：
   *  - 偏好档 → `preference_mode`（推荐/熟悉/新鲜）；
   *  - 场景档 → `feed_preference.scene_mode_id`。
   *
   * 场景档曾经走 `FeedRadioTracks {radio_id: scene_mode_id}`，那是错的（短数字被忽略、
   * 回通用推荐池：选「日语」推中文歌）。实测 `FeedSongTab` + `feed_preference.scene_mode_id`
   * 才真按场景出歌。一次约 6 首、每次随机，用来连着播而不是摊开看。
   */
  async feedModeTracks(ref: FeedModeRef, opts: FeedSongTabOptions & { refresh?: boolean } = {}): Promise<Track[]> {
    if (ref.kind === 'scene') return this.feedSongTab({ ...opts, sceneModeId: ref.sceneModeId })
    return this.feedSongTab({ ...opts, preferenceMode: ref.mode })
  }

  /** Feed 模式配置（推荐流的路由表：preference_mode / scene_mode 的枚举与文案） */
  async feedMode(opts: { refresh?: boolean } = {}): Promise<any> {
    return (
      await this.core.cache.fetch<any>('feed-mode', 'self', () => this.core.request('FeedMode', {}), {
        force: opts.refresh,
        ttlMs: CacheTtl.config,
      })
    ).value
  }

  /**
   * Feed 模式配置（推荐流的路由表），解析成「偏好栏 + 场景列表」。
   * 选出来的那一个喂 `feedModeTracks()`（= `FeedModeRef`，只有一个当前值）。
   */
  async feedModes(opts: { refresh?: boolean } = {}): Promise<FeedModeView> {
    const raw = await this.feedMode(opts)
    const toOption = (item: any): FeedModeOption => {
      const scene = item?.entity?.feed_scene_mode
      const preference = item?.entity?.feed_preference_mode
      return {
        type: str(item?.type) ?? '',
        text: str(item?.text) ?? '',
        preferenceMode: str(preference?.mode),
        sceneModeId: typeof scene?.scene_mode_id === 'number' ? scene.scene_mode_id : undefined,
        subQueueType: str(scene?.sub_queue_type),
        raw: item,
      }
    }
    const bar: FeedModeOption[] = (Array.isArray(raw?.feed_mode_bar?.feed_mode) ? raw.feed_mode_bar.feed_mode : []).map(
      toOption,
    )
    const scenes: FeedModeOption[] = []
    for (const block of Array.isArray(raw?.feed_mode_block) ? raw.feed_mode_block : []) {
      for (const item of Array.isArray(block?.feed_mode) ? block.feed_mode : []) scenes.push(toOption(item))
    }
    const currentModes = new Set(bar.map((option) => option.preferenceMode).filter(Boolean))
    return {
      preferences: FEED_PREFERENCE_MODES.map((item) => ({ ...item, current: currentModes.has(item.mode) })),
      bar,
      scenes,
      raw,
    }
  }

  /** 精选内容（实测回空 body —— 不可用的推荐位，保接口但别指望有数据） */
  async featuredContents(opts: { cursor?: number; count?: number; refresh?: boolean } = {}): Promise<any> {
    return (
      await this.core.cache.fetch<any>(
        'featured',
        `${opts.cursor ?? 0}-${opts.count ?? 20}`,
        () => this.core.request('GetFeaturedContents', { cursor: opts.cursor ?? 0, count: opts.count ?? 20 }),
        { force: opts.refresh, ttlMs: CacheTtl.none },
      )
    ).value
  }

  /** 冷启动第一个接口：灰度开关 + 初始偏好（曲风/语种） */
  async launch(opts: { refresh?: boolean } = {}): Promise<LaunchInfo> {
    const { value } = await this.core.cache.fetch<any>('launch', 'self', () => this.core.request('Launch', {}), {
      force: opts.refresh,
      ttlMs: CacheTtl.config,
    })
    const boost = value.boost_setting
    return {
      boost: boost
        ? {
            genres: (Array.isArray(boost.genres) ? boost.genres : []).map((g: any) => ({
              id: str(g?.genre_id),
              name: str(g?.name),
              coverUrl: imageUrl(g?.url_pic, this.parseOpts),
            })),
            langs: (Array.isArray(boost.langs) ? boost.langs : []).map((l: any) => ({
              code: str(l?.lang_code),
              name: str(l?.name),
              iconUrl: imageUrl(l?.url_icon, this.parseOpts),
            })),
            needSet: typeof boost.need_set === 'boolean' ? boost.need_set : undefined,
          }
        : undefined,
      raw: value,
    }
  }

  private toResource(node: any): DiscoverResource {
    const type = str(node?.type ?? node?.fallback_type) ?? ''
    const entity = node?.entity ?? node
    const track = asTrack(entity, this.parseOpts)
    const playlist = track ? undefined : asPlaylist(entity, this.parseOpts)
    const album = track || playlist ? undefined : asAlbum(entity, this.parseOpts)
    const artist = track || playlist || album ? undefined : asArtist(entity, this.parseOpts)
    const user = track || playlist || album || artist ? undefined : asUser(entity, this.parseOpts)
    const inner = track ?? playlist ?? album ?? artist ?? user
    return {
      type,
      id: inner?.id ?? str(node?.resource_id) ?? '',
      raw: node,
      track: track ? new Track(this.core, track) : undefined,
      playlist: playlist ? new Playlist(this.core, playlist) : undefined,
      album: album ? new Album(this.core, album) : undefined,
      artist: artist ? new Artist(this.core, artist) : undefined,
      user: user ? new User(this.core, user) : undefined,
    }
  }
}
