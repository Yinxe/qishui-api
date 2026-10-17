import type { Client, CookieJar, CookieMap, DeviceIdentity, EndpointName, ResponseOf } from 'qishui-api'
import { getShareMedia } from 'qishui-api'
import type { PlaySource } from './cache/media.js'
import { MediaCache } from './cache/media.js'
import { EntityCache } from './cache/store.js'
import { loadConfig, saveConfig, type CoreConfig } from './config.js'
import { Album, Artist, Chart, Comment, Playlist, Track, User } from './entities.js'
import { Emitter, type EventMap } from './events.js'
import { PlayHistory, type PlayRecord, type PlayStats } from './history.js'
import type { CorePaths } from './paths.js'
import { asAlbum, asArtist, asChart, asComment, asPlaylist, asTrack, asUser, coerceTrack } from './parse.js'
import { Player } from './player/player.js'
import { AccountService } from './services/account.js'
import { CatalogService } from './services/catalog.js'
import { CommentsService } from './services/comments.js'
import { DiscoverService } from './services/discover.js'
import { FeedbackService } from './services/feedback.js'
import { LibraryService } from './services/library.js'
import { LinkService } from './services/link.js'
import { SearchService } from './services/search.js'
import { SocialService } from './services/social.js'
import { SessionManager, type LoginOptions, type QishuiLogin, type SessionSnapshot } from './session.js'
import type { TrackData } from './types.js'

export interface CoreEvents extends EventMap {
  /** 每个请求/关键步骤的日志行（跟 options.logger 同时收到） */
  log: { line: string }
}

export interface QishuiOptions {
  /** 数据目录，默认 `~/.qishui`（`QISHUI_HOME` 环境变量优先） */
  dataDir?: string
  /** 覆盖 config.json 里的任意配置 */
  config?: Partial<CoreConfig>
  /** 日志行（默认不输出；同时会 emit `core.events.on('log')`） */
  logger?: (line: string) => void
  /** 显式注入设备身份（默认读 session.json，没有就注册一台） */
  device?: DeviceIdentity
  /** 显式注入 cookie（默认读 session.json） */
  cookies?: CookieMap | CookieJar
  /** 自定义 fetch（代理/测试用） */
  fetchImpl?: typeof fetch
  /** 播放器时钟参数 */
  player?: { tickMs?: number; skipOnError?: boolean }
}

interface CoreDeps {
  loaded: { paths: CorePaths; config: CoreConfig }
  options: QishuiOptions
  session: SessionManager
  client: Client
}

/**
 * core 的门面（Facade）：一个对象上挂齐「应用后端」要用的全部能力。
 *
 * ```ts
 * const qishui = await createQishui()                  // 首次会注册设备身份并落 ~/.qishui/
 * qishui.snapshot()                                    // 登录态（不联网）
 * const login = await qishui.login()                    // 汽水音乐 App 扫码
 * render(login.scanUrl); await login.wait()
 *
 * const home = await qishui.discover.home()
 * const track = home.tracks[0]
 * await track.play()                                   // 解析播放源 + 落盘缓存 + 起进度时钟
 * qishui.player.on('progress', e => …)
 * ```
 *
 * 子服务：`session` / `account` / `catalog` / `discover` / `search` / `library` /
 * `comments` / `social` / `feedback` / `link` / `media` / `cache` / `player`。
 */
export class QishuiCore {
  readonly config: CoreConfig
  readonly paths: CorePaths
  readonly session: SessionManager
  readonly api: Client
  readonly cache: EntityCache
  readonly media: MediaCache
  readonly history: PlayHistory
  readonly player: Player

  readonly account: AccountService
  readonly catalog: CatalogService
  readonly discover: DiscoverService
  readonly search: SearchService
  readonly library: LibraryService
  readonly comments: CommentsService
  readonly social: SocialService
  readonly feedback: FeedbackService
  readonly link: LinkService

  readonly events = new Emitter<CoreEvents>()
  readonly fetchImpl: typeof fetch
  readonly logger: (line: string) => void

  private constructor(deps: CoreDeps) {
    const { loaded, options } = deps
    this.paths = loaded.paths
    this.config = loaded.config
    this.fetchImpl = options.fetchImpl ?? fetch
    this.logger = (line: string) => {
      options.logger?.(line)
      this.events.emit('log', { line })
    }
    this.session = deps.session
    this.api = deps.client
    this.cache = new EntityCache(this.paths, { ttlMs: this.config.entityTtlMs, logger: this.logger })
    this.media = new MediaCache(this.paths, this.config, this.logger, this.fetchImpl)
    this.history = new PlayHistory(this.paths)
    this.player = new Player(this, options.player)
    this.account = new AccountService(this)
    this.catalog = new CatalogService(this)
    this.discover = new DiscoverService(this)
    this.search = new SearchService(this)
    this.library = new LibraryService(this)
    this.comments = new CommentsService(this)
    this.social = new SocialService(this)
    this.feedback = new FeedbackService(this)
    this.link = new LinkService(this)
  }

  static async create(options: QishuiOptions = {}): Promise<QishuiCore> {
    const loaded = loadConfig({ dataDir: options.dataDir, config: options.config })
    const session = new SessionManager(loaded.paths, {
      timeoutMs: loaded.config.timeoutMs,
      fetchImpl: options.fetchImpl,
      device: options.device,
      cookies: options.cookies,
      logger: options.logger,
    })
    const client = await session.ready()
    return new QishuiCore({ loaded, options, session, client })
  }

  /* ------------------------------------------------------------ 会话 */

  get loggedIn(): boolean {
    return this.session.isLoggedIn()
  }

  get uid(): string | undefined {
    return this.session.uid
  }

  snapshot(): SessionSnapshot {
    return this.session.snapshot()
  }

  /** 扫码登录（二维码内容交给上层渲染；core 不引二维码依赖） */
  login(options: LoginOptions = {}): Promise<QishuiLogin> {
    return this.session.login(options)
  }

  async logout(): Promise<void> {
    this.player.clear()
    await this.session.logout()
    await this.cache.invalidate('me', 'self')
  }

  /**
   * 按 IDL 端点 key 直调（逃生舱，320 个端点都能走）。
   *
   * 参数**按实测口径写**：上游 IDL 把 `cursor` 声明成 string、`scene` 声明成枚举，
   * 但实测传 `0` / `''` 也能用（本项目所有实测参数都是这么发的），
   * 所以这里不收窄参数类型、不做值转换，只把响应按 IDL 类型返回。
   */
  async request<K extends EndpointName>(key: K, params: Record<string, unknown> = {}): Promise<ResponseOf<K>> {
    return await (this.api.request as unknown as (k: EndpointName, p: Record<string, unknown>) => Promise<ResponseOf<K>>)(key, params)
  }

  /* ------------------------------------------------------------ 实体构造 */

  /** 曲目：id / TrackData / 含 track 的原始响应 都能转 */
  track(input: TrackData | string | unknown): Track {
    const data = typeof input === 'string' ? { id: input, name: '', artists: [] } : coerceTrack(input, { coverWidth: this.config.coverWidth })
    if (!data?.id) throw new Error('core.track(): 认不出这个入参（需要 id / TrackData / 含 track 的响应）')
    return new Track(this, data)
  }

  /** 从任意数组响应里捞出曲目（每项都会做一次形状识别） */
  tracks(input: unknown[]): Track[] {
    return input
      .map((item) => asTrack(item, { coverWidth: this.config.coverWidth }))
      .filter((data): data is TrackData => !!data)
      .map((data) => new Track(this, data))
  }

  album(input: unknown): Album {
    const data = asAlbum(input, { coverWidth: this.config.coverWidth })
    if (!data) throw new Error('core.album(): 认不出这个入参')
    return new Album(this, data)
  }

  artist(input: unknown): Artist {
    const data = asArtist(input, { coverWidth: this.config.coverWidth })
    if (!data) throw new Error('core.artist(): 认不出这个入参')
    return new Artist(this, data)
  }

  playlist(input: unknown): Playlist {
    const data = asPlaylist(input, { coverWidth: this.config.coverWidth })
    if (!data) throw new Error('core.playlist(): 认不出这个入参')
    return new Playlist(this, data)
  }

  user(input: unknown): User {
    const data = asUser(input, { coverWidth: this.config.coverWidth })
    if (!data) throw new Error('core.user(): 认不出这个入参')
    return new User(this, data)
  }

  comment(input: unknown): Comment {
    const data = asComment(input, { coverWidth: this.config.coverWidth })
    if (!data) throw new Error('core.comment(): 认不出这个入参')
    return new Comment(this, data)
  }

  chart(input: unknown): Chart {
    const data = asChart(input, { coverWidth: this.config.coverWidth })
    if (!data) throw new Error('core.chart(): 认不出这个入参')
    return new Chart(this, data)
  }

  /* ------------------------------------------------------------ 便捷入口 */

  /** 分享链接/裸 ID → 可播地址（不落盘，直接用） */
  async source(input: string, opts: { download?: boolean } = {}): Promise<PlaySource> {
    const item = await this.link.resolve(input)
    if (item.kind !== 'track') {
      const media = await getShareMedia(item, { fetchImpl: this.fetchImpl, cover_width: this.config.coverWidth })
      return {
        track: { id: item.id, name: media.title ?? '', artists: [], durationMs: media.duration_ms, coverUrl: media.cover_url, vid: media.vid },
        kind: 'remote',
        url: media.play_url,
        mime: media.mime_type,
        durationMs: media.duration_ms,
        expiresAt: media.expires_at,
        fromCache: false,
      }
    }
    return await this.media.resolve(item.id, opts)
  }

  /** 本地播放历史（新的在前） */
  plays(limit = 50): PlayRecord[] {
    return this.history.recent(limit)
  }

  playStats(): PlayStats {
    return this.history.stats()
  }

  /** 把当前配置（含默认值）写回 config.json */
  saveConfig(): Promise<void> {
    return saveConfig(this.paths, this.config)
  }

  /** 缓存总览（元数据 + 媒体） */
  async cacheStats(): Promise<{
    entities: Awaited<ReturnType<EntityCache['stats']>>
    media: Awaited<ReturnType<MediaCache['stats']>>
  }> {
    return { entities: await this.cache.stats(), media: await this.media.stats() }
  }

  /**
   * 清缓存。默认只清**过期**的元数据（`prune`）；显式传 `all: true` 才全清。
   * 媒体（音频文件）几个 MB 一个，要显式 `media: true` 才动 —— 别顺手删人家的歌。
   */
  async clearCache(opts: { media?: boolean; all?: boolean } = {}): Promise<void> {
    if (opts.all) await this.cache.clear()
    else await this.cache.prune()
    if (opts.media) await this.media.prune(opts.all ? { maxBytes: 0, maxAgeMs: 1 } : {})
  }

  /** 停时钟、释放订阅（进程退出前调一下更干净） */
  dispose(): void {
    this.player.dispose()
    this.events.removeAll()
  }
}

/**
 * 建一个 core 实例。第一次跑会在数据目录注册设备身份（一次网络请求），之后复用。
 * 没有会话也能用（匿名接口照常），写接口会由上游回 1000016。
 */
export async function createQishui(options: QishuiOptions = {}): Promise<QishuiCore> {
  return await QishuiCore.create(options)
}

export type { PlaySource }
