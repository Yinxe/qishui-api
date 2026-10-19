import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { getShareMedia, getTrackMedia, type ShareLyrics, type ShareMedia } from 'qishui-api'
import { type CoreConfig, type MediaEvictPolicy, mediaEvictPolicyLabel } from '../config.js'
import { CacheError, CoreError, MediaUnavailableError } from '../errors.js'
import { coerceTrack } from '../parse.js'
import type { CorePaths } from '../paths.js'
import { Lyrics } from '../player/lyrics.js'
import type { TrackData } from '../types.js'
import { ensureDir, fileSize, hashFile, pathExists, readJson, removeQuiet, writeJsonAtomic } from '../util.js'

/** 已落盘的音频文件描述（`file` 是相对曲目目录的名字） */
export interface CachedAudio {
  file: string
  mime?: string
  bytes: number
  /** 完整性指纹（下载完算一次；校验/去重都用它） */
  sha1?: string
  fetchedAt: number
  /** 来源签名地址的过期时刻（unix 秒）——只是溯源信息，文件本身不过期 */
  sourceExpiresAt?: number
}

export interface CachedMediaMeta {
  v: 1 | 2 | 3
  trackId: string
  track: TrackData
  audio: CachedAudio
  lyrics?: { file: string; lines: number; lyricType?: string; fetchedAt: number }
  cover?: { file: string; bytes: number; fetchedAt: number }
  /**
   * 落盘的音频**只是试听片段**（匿名/无权益时拿到的那 30 秒）。
   * 媒体缓存是跨账号共享的，不记这个就会「匿名时下了试听，登录后一直播 30 秒」——
   * 文件尺寸对得上，`peek` 永远算完整命中。
   */
  clip?: boolean
  fetchedAt: number
  /** LRU 依据（prune 按它剔） */
  accessedAt: number
  /** 命中次数（本文件被拿去播放的次数） */
  plays: number
}

/**
 * 播放源：三种
 *  - `cache`：媒体缓存里已就绪的文件（我们自己下的）；
 *  - `remote`：上游签名地址（约 24h 过期）；
 *  - `local`：**用户自己磁盘上的文件**（本地库扫出来的曲目，core 不下载也不缓存，直接交给播放器）。
 */
export interface PlaySource {
  track: TrackData
  kind: 'cache' | 'remote' | 'local'
  /** kind=cache / kind=local 时的本地音频路径 */
  path?: string
  /** kind=remote 时的签名地址（约 24h 过期） */
  url?: string
  mime?: string
  /** 实际可播时长：试听片段时是**片段长度**，不是整曲元数据时长 */
  durationMs?: number
  /** 试听片段在整首歌里的起点（ms）；歌词按整曲时间轴对齐，查询时要加这个偏移 */
  clipStartMs?: number
  /** 远程地址过期时刻（unix 秒） */
  expiresAt?: number
  bytes?: number
  lyrics?: Lyrics
  /** 本次是否命中磁盘缓存（false = 刚拉过分享页） */
  fromCache: boolean
}

export interface DownloadProgress {
  phase: 'audio' | 'cover' | 'lyrics' | 'meta'
  received: number
  total?: number
}

export interface EnsureOptions {
  /** 已经缓存也重新解析一次（文件还在就直接用，不重下） */
  refresh?: boolean
  signal?: AbortSignal
  onProgress?: (progress: DownloadProgress) => void
}

export interface ResolveOptions extends EnsureOptions {
  /** false = 不落盘，只解析签名地址（配合上层自己的播放器/流式播放） */
  download?: boolean
}

/**
 * 媒体缓存统计。
 *
 * **口径**：`diskBytes` 与下面几项拆分的都是 `cache/tracks` 下**文件的真实字节**（`stat` 出来的），
 * 不是 meta 自报的 `audio.bytes`。所以 `diskBytes === audioBytes + coverBytes + lyricsBytes + metaBytes + residueBytes`
 * 恒成立——界面上「总共 1.9GB」与「音频 1.6GB + 封面 …」不会互相打架。
 */
export interface MediaStats {
  /** 有有效 meta 的曲目数 */
  tracks: number
  /** 其中**只是试听片段**的（文件短是正常的，别按整曲体积去比） */
  clips: number
  /** 音频文件真实字节 */
  audioBytes: number
  /** 封面文件真实字节 */
  coverBytes: number
  /** 歌词文件真实字节 */
  lyricsBytes: number
  /** `meta.json` 本身占的字节 */
  metaBytes: number
  /** 有歌词**且文件还在**的曲目数 */
  withLyrics: number
  /** 最久没被访问的一条的时间 */
  oldestAccessedAt?: number
  totalPlays: number
  /** `cache/tracks` 的**真实磁盘占用**（含歌词/封面/meta/`.part`/孤儿目录） */
  diskBytes: number
  /**
   * 归不到上面任何一项的字节：没下完的 `.part`、meta 丢失的孤儿目录、认不出的杂文件。
   * `diskBytes - (audioBytes + coverBytes + lyricsBytes + metaBytes)`，恒等于它。
   */
  residueBytes: number
  /** 残留 `.part` 文件个数（下次 `ensure` 会续传，不是坏文件） */
  pendingParts: number
  /** 没有（或读不出）meta 的孤儿目录个数 */
  orphanDirs: number
  /** 音频缺失/为空/大小与记录不符的曲目数（试听片段除外）——下次播放会重新下载 */
  incomplete: number
}

/** 容量账：`prune` 剔谁、`capacity` 显示什么，都出自同一份数字 */
export interface MediaCapacity {
  /** 真实占用（= `MediaStats.diskBytes`） */
  usedBytes: number
  /** 生效上限；`0` = 不限制 */
  limitBytes: number
  /** 占上限的百分比（四舍五入）；不限制时 undefined */
  percent?: number
  overLimit: boolean
  /** 满溢时按哪个顺序剔（`config.mediaEvictPolicy`） */
  policy: MediaEvictPolicy
  /** 落盘后是否自动剔到上限（默认关：删文件要人显式触发） */
  autoEvict: boolean
  /** 按 `policy` 清到上限要剔几首 */
  reclaimableTracks: number
  /** 这几首能释放多少字节（**只算不删**） */
  reclaimableBytes: number
}

/** 单次扫描里一首曲目目录的账（`scan()` 用；统计/容量/剔除共用一份，避免两套口径） */
interface ScannedTrack {
  id: string
  meta: CachedMediaMeta
  /** 只是试听片段（`clip` 或老 meta 的 `playableRange`） */
  clip: boolean
  /** 歌词文件确实在盘上 */
  hasLyrics: boolean
  /** 音频文件真实字节（缺失时 undefined） */
  audioSize?: number
  coverSize: number
  lyricsSize: number
  metaSize: number
  /** 整个目录的真实字节（含 `.part` 等残留） */
  dirBytes: number
  /** 音频在、非空、大小与记录一致（= `peek()` 会命中） */
  complete: boolean
}

interface MediaScan {
  items: ScannedTrack[]
  metas: CachedMediaMeta[]
  /** 曲目 id → 目录真实字节 */
  bytesOf: Map<string, number>
  diskBytes: number
  audioBytes: number
  coverBytes: number
  lyricsBytes: number
  metaBytes: number
  residueBytes: number
  pendingParts: number
  orphanDirs: number
  incomplete: number
  clips: number
}

/** 校验发现的单条问题。`kind` 决定「能不能直接播」与「`fix` 会怎么处理」。 */
export type VerifyIssueKind =
  /** 音频没了/空的：这份缓存不能播，`fix` 删目录，下次播放重下 */
  | 'broken'
  /** 音频还在但与记录对不上（换过版本/片段窗口变了/被截断）：多数能修 */
  | 'drift'
  /** 歌词或封面文件缺失：不影响播放，`fix` 去掉失效引用 */
  | 'missing'
  /** 孤儿目录、残留 `.part` 这类打扫项 */
  | 'residue'

export type VerifySeverity = 'error' | 'warn' | 'info'

export interface VerifyIssue {
  trackId: string
  /** 一句给人看的中文 */
  issue: string
  kind: VerifyIssueKind
  /** error = 播不了；warn = 能播但记录不对；info = 只是打扫提示 */
  severity: VerifySeverity
  /** 这首只是试听片段（短是正常的，不是整曲残缺） */
  clip: boolean
  /** 曲名（有 meta 就带上，界面直接显示） */
  name?: string
  /** `fix: true` 会不会处理它 */
  fixable: boolean
}

/** `verify()` 的完整报告：问题列表 + 概览数字（界面要显示「检查了多少、几首试听」） */
export interface VerifyReport {
  /** 扫过的曲目目录数（含孤儿目录） */
  checked: number
  /** 其中试听片段数 */
  clips: number
  /** meta 还是老版本（下次播放会自动重取）的条数 */
  staleMeta: number
  /** 这次是否算了 sha1 */
  deep: boolean
  elapsedMs: number
  issues: VerifyIssue[]
  /** `fix: true` 时改写了几条 meta（补字节数/sha1/去掉失效引用） */
  repaired: number
  /** `fix: true` 时删掉几个目录（音频没了/被截断/孤儿） */
  removedDirs: number
  summary: { errors: number; warnings: number; infos: number; fixable: number }
}

const MIME_EXT: Record<string, string> = {
  audio_mp4: '.m4a',
  video_mp4: '.mp4',
}

/**
 * media.json 版本：v1 没记试听片段（`playableRange`），读到 v1 命中时重拉一次分享页
 * 补片段信息（音频文件继续用，不重下）；v3 起把「这份音频只是试听」记成 `clip` 字段，
 * 这样匿名时下的 30 秒片段在登录后会被重取、换成整首（v2 没这字段，一律重判一次）。
 */
const META_VERSION = 3

/**
 * 本地媒体缓存：一首曲目一个目录，装音频 + 歌词 + 封面 + meta.json。
 *
 * 设计要点（都对着实测结论来的）：
 *  - 可播地址来自分享页 SSR，带签名、约 24h 过期；**文件不随签名过期**，所以缓存命中时一次网络请求都不发；
 *  - 缓存不完整（缺音频/歌词/封面）或显式 `refresh` 时才重新拉分享页，缺什么补什么；
 *  - 音频支持 Range 断点续传（分享页地址实测支持 `206 + content-range`），下载写进 `.part`，完整校验后 rename；
 *  - 不做批量下载接口：只有「播这一首」或显式 `ensure()` 才会落盘，边下边用；
 *  - 完整性用 `content-range` 的总长度核对，再记一个 sha1 供 `verify()` 复查。
 */
export class MediaCache {
  private touched = new Map<string, number>()
  private metaChains = new Map<string, Promise<unknown>>()

  constructor(
    private paths: CorePaths,
    private config: CoreConfig,
    private logger: (line: string) => void = () => {},
    private fetchImpl: typeof fetch = fetch,
  ) {}

  /** 曲目目录（不存在也返回路径） */
  dirOf(trackId: string): string {
    return this.paths.trackDir(trackId)
  }

  /** 只读磁盘：完整（meta + 音频都在且大小对得上）才算命中，绝不发请求 */
  async peek(trackId: string): Promise<CachedMediaMeta | undefined> {
    const meta = await this.readMeta(trackId)
    if (!meta) return undefined
    return (await this.audioReady(meta)) ? meta : undefined
  }

  async has(trackId: string): Promise<boolean> {
    return (await this.peek(trackId)) !== undefined
  }

  /**
   * 只读磁盘上的封面字节（没缓存就 undefined，绝不发请求）。
   *
   * 不走 `readMeta`：那条路要求 `meta.audio.file` 存在，而这里只关心封面在不在——音频被 prune 掉了、
   * 封面还在的目录照样该出图。
   */
  async cachedCover(trackId: string): Promise<Buffer | undefined> {
    const meta = await readJson<CachedMediaMeta>(this.metaFile(trackId))
    if (!meta?.cover?.file) return undefined
    try {
      return await fsp.readFile(path.join(this.dirOf(trackId), meta.cover.file))
    } catch {
      return undefined
    }
  }

  /**
   * 落盘缓存的总量与拆分。
   *
   * 每一项都按**文件真实字节**统计（不是 meta 自报）：这样「总占用」与「音频/封面/歌词/记录」
   * 能对得上，`residueBytes` 就是差值——`.part`、孤儿目录、认不出的杂文件全落在这里。
   */
  async stats(): Promise<MediaStats> {
    const scan = await this.scan()
    let withLyrics = 0
    let oldest: number | undefined
    let totalPlays = 0
    for (const item of scan.items) {
      if (item.hasLyrics) withLyrics++
      totalPlays += item.meta.plays ?? 0
      if (oldest === undefined || item.meta.accessedAt < oldest) oldest = item.meta.accessedAt
    }
    return {
      tracks: scan.metas.length,
      clips: scan.clips,
      audioBytes: scan.audioBytes,
      coverBytes: scan.coverBytes,
      lyricsBytes: scan.lyricsBytes,
      metaBytes: scan.metaBytes,
      withLyrics,
      oldestAccessedAt: oldest,
      totalPlays,
      diskBytes: scan.diskBytes,
      residueBytes: scan.residueBytes,
      pendingParts: scan.pendingParts,
      orphanDirs: scan.orphanDirs,
      incomplete: scan.incomplete,
    }
  }

  /**
   * 容量账：真实占用 vs 上限，再加「按当前策略清到上限能腾出多少」——**这一条只算不删**。
   * 上限 `0`（不限制）时 `overLimit` 恒 false、`percent` 不给。
   */
  async capacity(): Promise<MediaCapacity> {
    const scan = await this.scan()
    const limitBytes = this.config.maxMediaBytes
    const policy = this.config.mediaEvictPolicy
    const over = limitBytes > 0 ? scan.diskBytes - limitBytes : 0
    let reclaimableTracks = 0
    let reclaimableBytes = 0
    if (over > 0) {
      for (const meta of this.order(scan.metas, policy)) {
        if (reclaimableBytes >= over) break
        reclaimableBytes += scan.bytesOf.get(meta.trackId) ?? 0
        reclaimableTracks++
      }
    }
    return {
      usedBytes: scan.diskBytes,
      limitBytes,
      percent: limitBytes > 0 ? Math.round((scan.diskBytes / limitBytes) * 100) : undefined,
      overLimit: over > 0,
      policy,
      autoEvict: this.config.mediaAutoEvict,
      reclaimableTracks,
      reclaimableBytes,
    }
  }

  /**
   * 一次遍历出「每首曲目目录里到底有哪些文件」：统计、容量、剔除全用这一份，免得两套账。
   * 只读磁盘，不发请求。
   */
  private async scan(): Promise<MediaScan> {
    const scan: MediaScan = {
      items: [],
      metas: [],
      bytesOf: new Map(),
      diskBytes: 0,
      audioBytes: 0,
      coverBytes: 0,
      lyricsBytes: 0,
      metaBytes: 0,
      residueBytes: 0,
      pendingParts: 0,
      orphanDirs: 0,
      incomplete: 0,
      clips: 0,
    }
    let entries: fs.Dirent[]
    try {
      entries = await fsp.readdir(this.paths.mediaDir, { withFileTypes: true })
    } catch {
      return scan
    }
    for (const entry of entries) {
      const full = path.join(this.paths.mediaDir, entry.name)
      if (!entry.isDirectory()) {
        // 媒体根下直接躺着的文件（误放的 `.part` 之类）：只算残留
        const size = (await fileSize(full)) ?? 0
        scan.diskBytes += size
        scan.residueBytes += size
        if (entry.name.endsWith('.part')) scan.pendingParts++
        continue
      }
      const files = await walkFiles(full)
      let dirBytes = 0
      for (const size of files.values()) dirBytes += size
      scan.diskBytes += dirBytes
      scan.bytesOf.set(entry.name, dirBytes)
      for (const name of files.keys()) if (name.endsWith('.part')) scan.pendingParts++

      const meta = await this.readMeta(entry.name)
      if (!meta) {
        scan.orphanDirs++
        scan.residueBytes += dirBytes
        continue
      }
      const audioSize = files.get(meta.audio.file)
      const coverSize = meta.cover ? (files.get(meta.cover.file) ?? 0) : 0
      const lyricsSize = meta.lyrics ? (files.get(meta.lyrics.file) ?? 0) : 0
      const metaSize = files.get('meta.json') ?? 0
      const clip = isClip(meta)
      // 音频缺失/为空/与记录不符：peek 不算命中，下次播放会重下。试听片段本来就不算「完整」，
      // 它每次播放都要向上游复核（见 `ensure`），不并进「待重下」这个数里
      const complete = audioSize !== undefined && audioSize > 0 && (audioSize === (meta.audio.bytes ?? -1) || clip)
      scan.items.push({
        id: entry.name,
        meta,
        clip,
        hasLyrics: Boolean(meta.lyrics && files.has(meta.lyrics.file)),
        audioSize,
        coverSize,
        lyricsSize,
        metaSize,
        dirBytes,
        complete,
      })
      scan.metas.push(meta)
      scan.audioBytes += audioSize ?? 0
      scan.coverBytes += coverSize
      scan.lyricsBytes += lyricsSize
      scan.metaBytes += metaSize
      if (clip) scan.clips++
      if (!complete) scan.incomplete++
      // 扣掉认得出来的文件，剩下的才是残留（`.part`、陌生文件）
      scan.residueBytes += Math.max(0, dirBytes - (audioSize ?? 0) - coverSize - lyricsSize - metaSize)
    }
    return scan
  }

  /**
   * 「最该走的排前面」：`leastPlayed` 先比播放次数、**同次数再比时间**（否则并列时剔谁看运气）；
   * `lru` 只比时间。
   */
  private order(metas: CachedMediaMeta[], policy: MediaEvictPolicy): CachedMediaMeta[] {
    const byAge = (a: CachedMediaMeta, b: CachedMediaMeta): number => a.accessedAt - b.accessedAt
    const sorted = [...metas]
    sorted.sort(policy === 'leastPlayed' ? (a, b) => a.plays - b.plays || byAge(a, b) : byAge)
    return sorted
  }

  /** 列出所有已缓存曲目（扫目录，不发请求） */
  async list(): Promise<CachedMediaMeta[]> {
    let ids: string[] = []
    try {
      ids = await fsp.readdir(this.paths.mediaDir)
    } catch {
      return []
    }
    const out: CachedMediaMeta[] = []
    for (const id of ids) {
      const meta = await this.readMeta(id)
      if (meta) out.push(meta)
    }
    return out
  }

  /**
   * 确保这首曲目的音频/歌词/封面都在本地。
   * 完整命中 → 纯本地返回（零网络）；否则拉一次分享页，缺什么补什么。
   */
  async ensure(input: TrackData | string, opts: EnsureOptions = {}): Promise<CachedMediaMeta> {
    const track = coerceTrack(input, { coverWidth: this.config.coverWidth })
    if (!track?.id) throw new CoreError('ensure() 需要一个曲目 id 或曲目实体')
    const id = track.id
    const dir = this.dirOf(id)

    if (!opts.refresh) {
      const hit = await this.peek(id)
      // 存的是试听片段就不算命中：媒体缓存跨账号共享，匿名那会儿下的 30 秒会在登录后继续被当成整首
      if (hit && hit.v >= META_VERSION && !hit.clip) {
        this.logger(`[media] 命中缓存 ${id}（${formatBytes(hit.audio.bytes)}）`)
        return await this.touch(hit)
      }
      // 命中 v1/v2 老缓存：音频还在，只重取一次媒体补试听片段信息（不重下音频）
    }

    const previous = await this.readMeta(id)
    const share = await this.mediaOf(id, opts.signal)
    await ensureDir(dir)

    const mime = share.mime_type
    const audioName = resolveAudioName(previous, mime)
    const nowClip = clipOf(share) !== undefined
    // 上次是片段、这次给整首：文件尺寸是「整首」对不上「片段」的，但 `audioReady` 只比对自己记的
    // 字节数，会误判成可用——必须强制重下，否则 meta 记着非片段、放的还是那 30 秒。
    const upgradingFromClip = previous?.clip === true && !nowClip
    const needAudio =
      upgradingFromClip || (previous ? !(await this.audioReady(previous)) || previous.audio.file !== audioName : true)

    let audio: CachedAudio = previous?.audio ?? { file: audioName, bytes: 0, fetchedAt: Date.now() }
    if (needAudio) {
      const target = path.join(dir, audioName)
      // 试听片段留下的半截 `.part` 不能拿来续传整首：偏移量对不上，续上去就是坏文件
      if (upgradingFromClip) await removeQuiet(`${target}.part`)
      const result = await this.downloadAudio(share.play_url, target, opts)
      audio = {
        file: path.basename(target),
        mime,
        bytes: result.bytes,
        sha1: await hashFile(target),
        fetchedAt: Date.now(),
        sourceExpiresAt: share.expires_at,
      }
      this.logger(
        `[media] 音频落盘 ${id} ${formatBytes(result.bytes)}${result.resumed ? '（断点续传）' : ''} → ${audio.file}`,
      )
    } else {
      audio = { ...audio, mime: audio.mime ?? mime, fetchedAt: Date.now() }
    }

    let lyrics = previous?.lyrics
    if (!lyrics && share.lyrics) {
      opts.onProgress?.({ phase: 'lyrics', received: 0 })
      const file = path.join(dir, 'lyrics.json')
      await writeJsonAtomic(file, share.lyrics)
      lyrics = {
        file: 'lyrics.json',
        lines: share.lyrics.sentences.length,
        lyricType: share.lyrics.lyric_type,
        fetchedAt: Date.now(),
      }
      this.logger(`[media] 歌词落盘 ${id}（${lyrics.lines} 行）`)
    }

    let cover = previous?.cover
    if (share.cover_url && !(cover && (await pathExists(path.join(dir, cover.file))))) {
      const file = path.join(dir, 'cover.jpg')
      const bytes = await this.downloadCover(share.cover_url, file, opts)
      cover = bytes ? { file: 'cover.jpg', bytes, fetchedAt: Date.now() } : undefined
    }

    const merged = mergeTrack(track, share)
    const meta: CachedMediaMeta = {
      v: META_VERSION,
      trackId: id,
      // 这次上游没给片段就是整首，别把调用方传进来的旧 `playableRange`（上次试听留下的）带下去
      track: nowClip ? merged : { ...merged, playableRange: undefined },
      audio,
      lyrics,
      cover,
      clip: nowClip || undefined,
      fetchedAt: Date.now(),
      accessedAt: Date.now(),
      plays: previous?.plays ?? 0,
    }
    await writeJsonAtomic(path.join(dir, 'meta.json'), meta)
    // 默认不自动剔（`mediaAutoEvict` 关着）：删音频得人显式触发。开了也只认「刚下的这一首」要保住，
    // 且整段失败只打一行——播放源已经解析好了，不能被清理动作带崩。
    if (this.config.mediaAutoEvict && this.config.maxMediaBytes > 0) {
      try {
        await this.prune({ maxBytes: this.config.maxMediaBytes, keep: [id] })
      } catch (err) {
        this.logger(`[media] 自动淘汰失败（不影响本次播放）：${(err as Error)?.message ?? err}`)
      }
    }
    return meta
  }

  /**
   * 播放源解析。默认走缓存（命中就零网络）；`download:false` 或
   * `config.autoCacheMedia=false` 时只解析签名地址，不碰磁盘。
   */
  async resolve(input: TrackData | string, opts: ResolveOptions = {}): Promise<PlaySource> {
    const track = coerceTrack(input, { coverWidth: this.config.coverWidth })
    if (!track?.id) throw new CoreError('resolve() 需要一个曲目 id 或曲目实体')
    const useCache = opts.download !== false && this.config.autoCacheMedia

    if (!useCache) {
      const share = await this.mediaOf(track.id, opts.signal)
      const clip = clipOf(share)
      return {
        track: mergeTrack(track, share),
        kind: 'remote',
        url: share.play_url,
        mime: share.mime_type,
        durationMs: clip?.durationMs ?? share.duration_ms ?? track.durationMs,
        clipStartMs: clip?.startMs,
        expiresAt: share.expires_at,
        lyrics: share.lyrics ? new Lyrics(share.lyrics) : undefined,
        fromCache: false,
      }
    }

    const meta = await this.ensure(track, opts)
    const range = meta.track.playableRange
    return {
      track: meta.track,
      kind: 'cache',
      path: path.join(this.dirOf(meta.trackId), meta.audio.file),
      mime: meta.audio.mime,
      durationMs: range?.durationMs ?? meta.track.durationMs,
      clipStartMs: range?.startMs,
      bytes: meta.audio.bytes,
      lyrics: await this.readLyrics(meta),
      fromCache: true,
    }
  }

  /** 歌词：先看缓存，没有再走一次 resolve（默认会顺带把媒体落盘） */
  async lyrics(input: TrackData | string, opts: ResolveOptions = {}): Promise<Lyrics | undefined> {
    const track = coerceTrack(input, { coverWidth: this.config.coverWidth })
    if (!track?.id) return undefined
    const meta = await this.readMeta(track.id)
    if (meta) {
      const cached = await this.readLyrics(meta)
      if (cached) return cached
    }
    try {
      const source = await this.resolve(track, opts)
      return source.lyrics
    } catch {
      return undefined
    }
  }

  /** 播放器用：记一次播放（纯本地计数 + 访问时间），顺带带回 meta */
  async recordPlay(trackId: string): Promise<CachedMediaMeta | undefined> {
    return this.withMetaLock(trackId, async () => {
      const meta = await this.readMeta(trackId)
      if (!meta) return undefined
      meta.plays += 1
      meta.accessedAt = Date.now()
      this.touched.set(trackId, meta.accessedAt)
      await writeJsonAtomic(this.metaFile(trackId), meta)
      return meta
    })
  }

  async evict(trackId: string): Promise<boolean> {
    const dir = this.dirOf(trackId)
    if (!(await pathExists(dir))) return false
    this.touched.delete(trackId)
    await removeQuiet(dir)
    return true
  }

  /** 清空媒体缓存目录（用户下决心要腾地方时才用；比 prune 更彻底） */
  async clear(): Promise<{ removed: number; freedBytes: number }> {
    // 释放量按真实磁盘字节算（与 `capacity()` 同一个口径），别只数音频+封面把歌词/残留漏掉
    const scan = await this.scan()
    const removed = scan.metas.length
    const freedBytes = scan.diskBytes
    this.touched.clear()
    await removeQuiet(this.paths.mediaDir)
    if (removed) this.logger(`[media] 清空缓存 ${removed} 首，释放 ${formatBytes(freedBytes)}`)
    return { removed, freedBytes }
  }

  /**
   * 清理：超上限就按 `policy`（缺省读 `config.mediaEvictPolicy`）从「最该走」的开始剔整首曲目目录。
   *
   * - `maxAgeMs` 先无脑剔长期没听的（不受策略影响，过期就是过期）；
   * - `keep` 里的曲目**无论如何不动**——刚 `ensure()` 完的那首 `plays` 还是 0，`leastPlayed` 下它排第一，
   *   不保护就会「下完立刻把自己删了」；正在播的那首同理；
   * - 体积走扫描出来的真实字节，与 `capacity()` 显示的占用同一个口径。
   */
  async prune(
    opts: { maxBytes?: number; maxAgeMs?: number; policy?: MediaEvictPolicy; keep?: Iterable<string> } = {},
  ): Promise<{ removed: number; freedBytes: number; policy: MediaEvictPolicy }> {
    const policy = opts.policy ?? this.config.mediaEvictPolicy
    const scan = await this.scan()
    const all = scan.metas
    const maxBytes = opts.maxBytes ?? this.config.maxMediaBytes
    const keep = new Set(opts.keep ?? [])
    const sizes = scan.bytesOf
    const now = Date.now()
    let removed = 0
    let freedBytes = 0

    const candidates = all.filter((meta) => !keep.has(meta.trackId))
    const stale = candidates.filter((meta) => opts.maxAgeMs != null && now - meta.accessedAt > opts.maxAgeMs)
    const rest = this.order(
      candidates.filter((meta) => !stale.includes(meta)),
      policy,
    )

    // `evict` 返回 false 只代表目录本来就不在（扫描后被删）——那部分字节确实已从 `diskBytes` 里消失，
    // 所以下面照扣；但不计入 `removed`/`freedBytes`，那两项报的是「真的删掉了多少」。
    const drop = async (meta: CachedMediaMeta): Promise<void> => {
      if (await this.evict(meta.trackId)) {
        removed++
        freedBytes += sizes.get(meta.trackId) ?? 0
      }
    }
    for (const meta of stale) await drop(meta)

    if (maxBytes > 0) {
      // `stale` 那批已经从盘上没了，从真实占用里扣掉再比上限
      let total = scan.diskBytes - freedBytes
      for (const meta of rest) {
        if (total <= maxBytes) break
        await drop(meta)
        total -= sizes.get(meta.trackId) ?? 0
      }
    }
    if (removed) {
      this.logger(`[media] 清理 ${removed} 首（${mediaEvictPolicyLabel(policy)}），释放 ${formatBytes(freedBytes)}`)
    }
    return { removed, freedBytes, policy }
  }

  /**
   * 完整性复查。**默认只读**：`fix: true` 才动文件，而且只动「确实救不了」的。
   *
   * 分类口径（对着试听片段这个老坑来的）：
   *  - **试听片段**（`meta.clip`，或老 meta 的 `playableRange`）本来就比整曲短，不能按整曲体积判坏；
   *    它与记录对不上多半是上游换了片段窗口，报 info，`fix` 只把记录改成磁盘上的实际字节；
   *  - 非片段但文件比记录**长**：像是换成了整首/换了版本，能播，报 warn，`fix` 更新记录；
   *  - 非片段且文件比记录**短**：可能是没下完，也可能是换了编码——分不清就不动，报 warn；
   *    `peek()` 已判不中，下次播放会重下，`fix` 也不碰它（免得把半截文件写成「完整」）；
   *  - 音频缺失/为空：error，`fix` 删目录（这是唯一会删东西的一类；文件在就一个字节不动）；
   *  - 歌词/封面缺失：不影响播放，warn，`fix` 去掉失效引用（界面不再谎称它有）；
   *  - `deep` 才算 sha1（只算 v3 记录；老记录的指纹不可信，且下次播放会整条重取）：大小对得上但指纹不同
   *    = 并发下载/换过版本，warn，`fix` 重记指纹；
   *  - 孤儿目录、`.part`：info；`.part` 不删，下次 `ensure` 还要续传。
   */
  async verify(
    opts: { fix?: boolean; deep?: boolean; onProgress?: (done: number, total: number) => void } = {},
  ): Promise<VerifyReport> {
    const started = Date.now()
    const deep = opts.deep === true
    const report: VerifyReport = {
      checked: 0,
      clips: 0,
      staleMeta: 0,
      deep,
      elapsedMs: 0,
      issues: [],
      repaired: 0,
      removedDirs: 0,
      summary: { errors: 0, warnings: 0, infos: 0, fixable: 0 },
    }
    let ids: string[] = []
    try {
      ids = await fsp.readdir(this.paths.mediaDir)
    } catch {
      return report
    }
    // fix 之后返回的报告只留「还没解决」的：删掉的目录整条抹掉，改过记录的只抹掉可修项
    const removedIds = new Set<string>()
    const repairedIds = new Set<string>()
    for (const [index, id] of ids.entries()) {
      const dir = this.paths.trackDir(id)
      const meta = await this.readMeta(id)
      report.checked++
      opts.onProgress?.(index + 1, ids.length)
      if (!meta) {
        report.issues.push({
          trackId: id,
          kind: 'residue',
          severity: 'info',
          clip: false,
          fixable: true,
          issue: 'meta.json 缺失或损坏（目录残留）',
        })
        if (opts.fix) {
          await removeQuiet(dir)
          report.removedDirs++
          removedIds.add(id)
        }
        continue
      }
      const clip = isClip(meta)
      const name = meta.track?.name || undefined
      if (clip) report.clips++
      if (meta.v < META_VERSION) report.staleMeta++
      const audioPath = path.join(dir, meta.audio.file)
      const size = await fileSize(audioPath)
      // 老/手改的 meta 可能没写 `bytes`：那是「记录缺失」，不是「文件比记录长」
      const recorded =
        typeof meta.audio.bytes === 'number' && Number.isFinite(meta.audio.bytes) && meta.audio.bytes > 0
          ? meta.audio.bytes
          : undefined
      let removeDir = false
      let repair = false
      const add = (kind: VerifyIssueKind, severity: VerifySeverity, fixable: boolean, issue: string): void => {
        report.issues.push({ trackId: id, issue, kind, severity, clip, name, fixable })
      }

      if (size === undefined) {
        add('broken', 'error', true, `音频文件缺失：${meta.audio.file}`)
        removeDir = true
      } else if (size === 0) {
        add('broken', 'error', true, '音频文件是空的（0 字节）')
        removeDir = true
      } else if (recorded === undefined) {
        add('drift', 'info', true, `meta 没记音频长度（磁盘上 ${formatBytes(size)}，可补记）`)
        repair = true
      } else if (size < recorded && !clip) {
        // 短了可能是没下完/被截断，也可能是上游换了编码——分不清就不动它：
        // `peek()` 已经判不中，下次播放自然会重下；改记录反而会把半截文件当成完整。
        add(
          'drift',
          'warn',
          false,
          `音频比记录短：${formatBytes(size)} < ${formatBytes(recorded)}（可能没下完，下次播放会重下）`,
        )
      } else if (size !== recorded) {
        add(
          'drift',
          clip ? 'info' : 'warn',
          true,
          clip
            ? `试听片段与记录不一致（${formatBytes(size)} / ${formatBytes(recorded)}，片段窗口可能变了，文件可用）`
            : `音频比记录长：${formatBytes(size)} > ${formatBytes(recorded)}（可能已换成整首，文件可用）`,
        )
        repair = true
      }

      let sha1: string | undefined
      // 只对当前版本（v3）的指纹做内容比对：老 meta 的 sha1 是旧下载逻辑记的（断点续传只算过后半段），
      // 本来就不代表整个文件；它们下次播放会整条重取，拿旧指纹判「内容坏了」只会制造假警报。
      if (deep && size !== undefined && size > 0 && !removeDir && meta.v >= META_VERSION) {
        sha1 = await hashFile(audioPath)
        // 大小都对不上时 sha1 必然对不上（那是另一份文件），别把「换了版本」误报成「内容损坏」
        if (size === recorded) {
          if (!meta.audio.sha1) {
            add('drift', 'info', true, 'meta 没记 sha1（可补记）')
            repair = true
          } else if (sha1 !== meta.audio.sha1) {
            // 大小一致而指纹不同：可能是两个进程并发下同一首（后写的盖了文件、meta 记的是半截时的指纹），
            // 也可能是换了编码。文件本身能播，就不按「损坏」删——`fix` 把指纹改成磁盘上这一份。
            add('drift', 'warn', true, '内容指纹与记录不符（可能并发下载/换过版本；大小一致，文件可播）')
            repair = true
          }
        }
      }

      const lyricsPath = meta.lyrics ? path.join(dir, meta.lyrics.file) : undefined
      if (meta.lyrics && lyricsPath && !(await pathExists(lyricsPath))) {
        add('missing', 'warn', true, `歌词文件缺失：${meta.lyrics.file}`)
        repair = true
      }
      const coverPath = meta.cover ? path.join(dir, meta.cover.file) : undefined
      if (meta.cover && coverPath && !(await pathExists(coverPath))) {
        add('missing', 'warn', true, `封面文件缺失：${meta.cover.file}`)
        repair = true
      }
      if (await pathExists(`${audioPath}.part`)) {
        add('residue', 'info', false, '残留未完成的 .part（下次 ensure 会续传）')
      }

      if (!opts.fix) continue
      if (removeDir) {
        await removeQuiet(dir)
        report.removedDirs++
        removedIds.add(id)
        this.logger(`[media] 清除损坏缓存 ${id}`)
        continue
      }
      if (!repair) continue
      // 只改记录：把磁盘上真实有的东西写回去，音频本身一个字节都不动
      let changed = false
      if (size !== undefined && meta.audio.bytes !== size) {
        meta.audio.bytes = size
        // 没算 sha1 就别留着对不上新文件的旧指纹：下次 deep 校验会把它当成「内容被换过」而删掉
        if (!deep) meta.audio.sha1 = undefined
        changed = true
      }
      if (deep && sha1 && meta.audio.sha1 !== sha1) {
        meta.audio.sha1 = sha1
        changed = true
      }
      if (meta.lyrics && lyricsPath && !(await pathExists(lyricsPath))) {
        meta.lyrics = undefined
        changed = true
      }
      if (meta.cover && coverPath && !(await pathExists(coverPath))) {
        meta.cover = undefined
        changed = true
      }
      if (changed) {
        await writeJsonAtomic(this.metaFile(id), meta)
        report.repaired++
        repairedIds.add(id)
      }
    }

    if (removedIds.size || repairedIds.size) {
      report.issues = report.issues.filter(
        (issue) => !removedIds.has(issue.trackId) && !(issue.fixable && repairedIds.has(issue.trackId)),
      )
    }
    report.elapsedMs = Date.now() - started
    for (const issue of report.issues) {
      if (issue.severity === 'error') report.summary.errors++
      else if (issue.severity === 'warn') report.summary.warnings++
      else report.summary.infos++
      if (issue.fixable) report.summary.fixable++
    }
    return report
  }

  /* ------------------------------------------------------------ 内部 */

  private metaFile(trackId: string): string {
    return path.join(this.dirOf(trackId), 'meta.json')
  }

  /**
   * 同一曲目的 meta.json「读-改-写」按 trackId 排队。
   * `writeJsonAtomic` 里已经排过写入，但计数要在**读之前**就锁上：两次并发 `recordPlay`
   * 各自读到 plays=5，就只会 +1。所以计数类更新必须整段进这个锁。
   */
  private withMetaLock<T>(trackId: string, fn: () => Promise<T>): Promise<T> {
    const prev = this.metaChains.get(trackId) ?? Promise.resolve()
    const run = prev.then(fn, fn)
    this.metaChains.set(trackId, run)
    return run.finally(() => {
      if (this.metaChains.get(trackId) === run) this.metaChains.delete(trackId)
    }) as Promise<T>
  }

  private async readMeta(trackId: string): Promise<CachedMediaMeta | undefined> {
    const meta = await readJson<CachedMediaMeta>(this.metaFile(trackId))
    if (!meta?.audio?.file) return undefined
    return meta
  }

  private async audioReady(meta: CachedMediaMeta | undefined): Promise<boolean> {
    if (!meta?.audio?.file) return false
    return (await fileSize(path.join(this.dirOf(meta.trackId), meta.audio.file))) === meta.audio.bytes
  }

  private async readLyrics(meta: CachedMediaMeta): Promise<Lyrics | undefined> {
    if (!meta.lyrics) return undefined
    const raw = await readJson<ShareLyrics>(path.join(this.dirOf(meta.trackId), meta.lyrics.file))
    return raw ? new Lyrics(raw) : undefined
  }

  /** 命中时更新 accessedAt（60s 内不重复写盘，避免边听边写） */
  private async touch(meta: CachedMediaMeta): Promise<CachedMediaMeta> {
    const last = this.touched.get(meta.trackId) ?? 0
    if (Date.now() - last < 60_000) return meta
    return this.withMetaLock(meta.trackId, async () => {
      this.touched.set(meta.trackId, Date.now())
      // 重新读一次：手上的 meta 可能比盘上旧（并发 recordPlay 已经加过 plays），照写会把计数冲掉
      const fresh = (await this.readMeta(meta.trackId)) ?? meta
      fresh.accessedAt = Date.now()
      await writeJsonAtomic(this.metaFile(meta.trackId), fresh)
      return fresh
    })
  }

  /**
   * 曲目可播媒体：h5 接口优先，分享页 SSR 兜底。
   * 两条路实测拿到的是同一份音频；h5 拿不到（改版/拒答/没给地址）才回落，行为不退化。
   */
  private async mediaOf(trackId: string, signal?: AbortSignal): Promise<ShareMedia> {
    let h5Error: unknown
    try {
      return await getTrackMedia(trackId, {
        fetchImpl: this.fetchImpl,
        cover_width: this.config.coverWidth,
        signal,
      })
    } catch (err) {
      h5Error = err
    }
    try {
      return await getShareMedia(trackId, {
        fetchImpl: this.fetchImpl,
        cover_width: this.config.coverWidth,
        signal,
      })
    } catch (ssrError) {
      const why = (e: unknown) => (e instanceof Error ? e.message : String(e))
      throw new MediaUnavailableError(
        `拿不到可播地址（${trackId}）：h5 ${why(h5Error)}；分享页 ${why(ssrError)}`,
        ssrError,
      )
    }
  }

  /**
   * 断点续传下载：先看 `.part` 已有多少 → `Range: bytes=N-`。
   * 服务端回 200（不支持 Range）就从头来；回 206 就接着写。
   * 结束后用总长度核对，再 rename 成正式文件 —— 半截文件永远不会被当成缓存命中。
   */
  private async downloadAudio(
    url: string,
    target: string,
    opts: EnsureOptions,
  ): Promise<{ bytes: number; total?: number; resumed: boolean }> {
    const part = `${target}.part`
    await ensureDir(path.dirname(target))
    let have = (await fileSize(part)) ?? 0

    const headers: Record<string, string> = {}
    if (have > 0) headers.range = `bytes=${have}-`
    const res = await this.fetchImpl(url, { headers, signal: opts.signal })
    if (!res.ok && res.status !== 206) {
      // 出错也要把 body 收掉，否则这条连接的 socket 会一直挂在池里
      await res.body?.cancel().catch(() => {})
      throw new MediaUnavailableError(`下载音频失败 HTTP ${res.status}（${url.slice(0, 120)}…）`)
    }
    if (res.status === 200 && have > 0) {
      // 服务端不认 Range：作废已有分片，重新下
      await removeQuiet(part)
      have = 0
    }
    const resumed = have > 0 && res.status === 206
    if (!res.body) throw new MediaUnavailableError('下载音频失败：响应没有 body')

    const total = parseTotal(res.headers, have)
    const out = fs.createWriteStream(part, { flags: have > 0 ? 'a' : 'w' })
    let received = have
    const source = Readable.fromWeb(res.body as any)
    source.on('data', (chunk: Buffer) => {
      received += chunk.length
      opts.onProgress?.({ phase: 'audio', received, total })
    })
    await pipeline(source, out)

    if (total != null && received !== total) {
      throw new CacheError(`音频下载不完整：收到 ${received} 字节，声明 ${total} 字节`)
    }
    await fsp.rename(part, target)
    return { bytes: received, total, resumed }
  }

  private async downloadCover(url: string, target: string, opts: EnsureOptions): Promise<number> {
    try {
      const res = await this.fetchImpl(url, { signal: opts.signal })
      if (!res.ok) {
        await res.body?.cancel().catch(() => {})
        return 0
      }
      const buf = Buffer.from(await res.arrayBuffer())
      await ensureDir(path.dirname(target))
      await fsp.writeFile(target, buf)
      opts.onProgress?.({ phase: 'cover', received: buf.length, total: buf.length })
      return buf.length
    } catch {
      return 0 // 封面只是锦上添花，拿不到不影响播放
    }
  }
}

function resolveAudioName(previous: CachedMediaMeta | undefined, mime: string | undefined): string {
  const ext = (mime && MIME_EXT[mime]) ?? (mime?.startsWith('video') ? '.mp4' : '.m4a')
  const keep = previous?.audio.file
  if (keep?.endsWith(ext)) return keep
  return `audio${ext}`
}

/** `content-range: bytes 0-1023/929852` → 929852；200 就用 content-length */
function parseTotal(headers: Headers, have: number): number | undefined {
  const range = headers.get('content-range')
  if (range) {
    const total = Number(range.split('/')[1])
    if (Number.isFinite(total)) return total
  }
  const length = Number(headers.get('content-length'))
  if (Number.isFinite(length) && length > 0) return have + length
  return undefined
}

function mergeTrack(track: TrackData, share: ShareMedia): TrackData {
  const artists = track.artists.length
    ? track.artists
    : (share.artist ?? '')
        .split(/[,，/]/)
        .map((name) => name.trim())
        .filter(Boolean)
        .map((name) => ({ id: '', name }))
  // 分享页给的试听片段优先：它就是这次真正拿到的音频区间
  const clip = clipOf(share)
  return {
    ...track,
    name: track.name || share.title || '',
    durationMs: track.durationMs ?? share.duration_ms,
    coverUrl: track.coverUrl ?? share.cover_url,
    vid: track.vid ?? share.vid,
    artists,
    playableRange: clip ? { startMs: clip.startMs, durationMs: clip.durationMs } : track.playableRange,
  }
}

/**
 * 分享页的试听片段 → 可播区间。`offsetDuration` 与整曲几乎等长时不算片段
 * （有些整曲也会带上这两个字段），避免把完播曲目误标成「试听」。
 */
function clipOf(share: ShareMedia): { startMs: number; durationMs: number } | undefined {
  const durationMs = share.offset_duration_ms
  if (typeof durationMs !== 'number' || durationMs <= 0) return undefined
  if (share.duration_ms != null && durationMs >= share.duration_ms - 1000) return undefined
  return { startMs: share.offset_start_ms ?? 0, durationMs }
}

/** 这份缓存是不是**只是试听片段**：v3 看 `clip`，v1/v2 只能看老 meta 里的 `playableRange` */
function isClip(meta: CachedMediaMeta): boolean {
  return meta.clip === true || meta.track?.playableRange != null
}

/** 递归列出目录下的文件（相对路径 → 字节）；读不了就返回空表，不抛 */
async function walkFiles(dir: string, prefix = ''): Promise<Map<string, number>> {
  const out = new Map<string, number>()
  let entries: fs.Dirent[]
  try {
    entries = await fsp.readdir(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const entry of entries) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      for (const [key, size] of await walkFiles(full, rel)) out.set(key, size)
    } else if (entry.isFile()) {
      out.set(rel, (await fileSize(full)) ?? 0)
    }
  }
  return out
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)}GB`
}
