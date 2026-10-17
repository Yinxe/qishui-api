import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { getShareMedia, type ShareLyrics, type ShareMedia } from 'qishui-api'
import type { CoreConfig } from '../config.js'
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
  v: 1
  trackId: string
  track: TrackData
  audio: CachedAudio
  lyrics?: { file: string; lines: number; lyricType?: string; fetchedAt: number }
  cover?: { file: string; bytes: number; fetchedAt: number }
  fetchedAt: number
  /** LRU 依据（prune 按它剔） */
  accessedAt: number
  /** 命中次数（本文件被拿去播放的次数） */
  plays: number
}

/** 播放源：要么是本地已就绪的文件，要么是签名远程地址 */
export interface PlaySource {
  track: TrackData
  kind: 'cache' | 'remote'
  /** kind=cache 时的本地音频路径 */
  path?: string
  /** kind=remote 时的签名地址（约 24h 过期） */
  url?: string
  mime?: string
  durationMs?: number
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

export interface MediaStats {
  tracks: number
  audioBytes: number
  coverBytes: number
  withLyrics: number
  /** 最久没被访问的一条的时间 */
  oldestAccessedAt?: number
  totalPlays: number
}

export interface VerifyIssue {
  trackId: string
  issue: string
}

const MIME_EXT: Record<string, string> = {
  audio_mp4: '.m4a',
  video_mp4: '.mp4',
}

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

  /** 落盘缓存总量与命中信息 */
  async stats(): Promise<MediaStats> {
    const all = await this.list()
    let audioBytes = 0
    let coverBytes = 0
    let withLyrics = 0
    let oldest: number | undefined
    let totalPlays = 0
    for (const meta of all) {
      audioBytes += meta.audio.bytes
      coverBytes += meta.cover?.bytes ?? 0
      if (meta.lyrics) withLyrics++
      totalPlays += meta.plays
      if (oldest === undefined || meta.accessedAt < oldest) oldest = meta.accessedAt
    }
    return { tracks: all.length, audioBytes, coverBytes, withLyrics, oldestAccessedAt: oldest, totalPlays }
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
      if (hit) {
        this.logger(`[media] 命中缓存 ${id}（${formatBytes(hit.audio.bytes)}）`)
        return await this.touch(hit)
      }
    }

    const previous = await this.readMeta(id)
    const share = await this.sharePage(id, opts.signal)
    await ensureDir(dir)

    const mime = share.mime_type
    const audioName = resolveAudioName(previous, mime)
    const needAudio = previous ? !(await this.audioReady(previous)) || previous.audio.file !== audioName : true

    let audio: CachedAudio = previous?.audio ?? { file: audioName, bytes: 0, fetchedAt: Date.now() }
    if (needAudio) {
      const target = path.join(dir, audioName)
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

    const meta: CachedMediaMeta = {
      v: 1,
      trackId: id,
      track: mergeTrack(track, share),
      audio,
      lyrics,
      cover,
      fetchedAt: Date.now(),
      accessedAt: Date.now(),
      plays: previous?.plays ?? 0,
    }
    await writeJsonAtomic(path.join(dir, 'meta.json'), meta)
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
      const share = await this.sharePage(track.id, opts.signal)
      return {
        track: mergeTrack(track, share),
        kind: 'remote',
        url: share.play_url,
        mime: share.mime_type,
        durationMs: share.duration_ms ?? track.durationMs,
        expiresAt: share.expires_at,
        lyrics: share.lyrics ? new Lyrics(share.lyrics) : undefined,
        fromCache: false,
      }
    }

    const meta = await this.ensure(track, opts)
    return {
      track: meta.track,
      kind: 'cache',
      path: path.join(this.dirOf(meta.trackId), meta.audio.file),
      mime: meta.audio.mime,
      durationMs: meta.track.durationMs,
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
    const meta = await this.readMeta(trackId)
    if (!meta) return undefined
    meta.plays += 1
    meta.accessedAt = Date.now()
    await writeJsonAtomic(this.metaFile(trackId), meta)
    return meta
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
    const all = await this.list()
    const freedBytes = all.reduce((sum, meta) => sum + meta.audio.bytes + (meta.cover?.bytes ?? 0), 0)
    this.touched.clear()
    await removeQuiet(this.paths.mediaDir)
    if (all.length) this.logger(`[media] 清空缓存 ${all.length} 首，释放 ${formatBytes(freedBytes)}`)
    return { removed: all.length, freedBytes }
  }

  /** 超上限就按 accessedAt 从旧到新剔；maxAgeMs 用来剔长期没听的 */
  async prune(opts: { maxBytes?: number; maxAgeMs?: number } = {}): Promise<{ removed: number; freedBytes: number }> {
    const all = await this.list()
    const maxBytes = opts.maxBytes ?? this.config.maxMediaBytes
    const now = Date.now()
    let removed = 0
    let freedBytes = 0
    const sizeOf = (meta: CachedMediaMeta): number => meta.audio.bytes + (meta.cover?.bytes ?? 0)

    const stale = all.filter((meta) => opts.maxAgeMs != null && now - meta.accessedAt > opts.maxAgeMs)
    const rest = all.filter((meta) => !stale.includes(meta)).sort((a, b) => a.accessedAt - b.accessedAt)

    const drop = async (meta: CachedMediaMeta): Promise<void> => {
      if (await this.evict(meta.trackId)) {
        removed++
        freedBytes += sizeOf(meta)
      }
    }
    for (const meta of stale) await drop(meta)

    if (maxBytes > 0) {
      let total = rest.reduce((sum, meta) => sum + sizeOf(meta), 0)
      for (const meta of rest) {
        if (total <= maxBytes) break
        await drop(meta)
        total -= sizeOf(meta)
      }
    }
    if (removed) this.logger(`[media] 清理 ${removed} 首，释放 ${formatBytes(freedBytes)}`)
    return { removed, freedBytes }
  }

  /** 完整性复查：meta 与文件对不上、大小不符、残留 .part 都报出来；fix=true 顺手清掉坏条目 */
  async verify(opts: { fix?: boolean } = {}): Promise<VerifyIssue[]> {
    const issues: VerifyIssue[] = []
    let ids: string[] = []
    try {
      ids = await fsp.readdir(this.paths.mediaDir)
    } catch {
      return issues
    }
    for (const id of ids) {
      const dir = this.paths.trackDir(id)
      const meta = await this.readMeta(id)
      if (!meta) {
        issues.push({ trackId: id, issue: 'meta.json 缺失或损坏（目录残留）' })
        if (opts.fix) await removeQuiet(dir)
        continue
      }
      const audioPath = path.join(dir, meta.audio.file)
      const size = await fileSize(audioPath)
      if (size === undefined) issues.push({ trackId: id, issue: `音频文件缺失：${meta.audio.file}` })
      else if (size !== meta.audio.bytes)
        issues.push({ trackId: id, issue: `音频大小不符：${size} ≠ ${meta.audio.bytes}` })
      if (meta.lyrics && !(await pathExists(path.join(dir, meta.lyrics.file)))) {
        issues.push({ trackId: id, issue: `歌词文件缺失：${meta.lyrics.file}` })
      }
      if (meta.cover && !(await pathExists(path.join(dir, meta.cover.file)))) {
        issues.push({ trackId: id, issue: `封面文件缺失：${meta.cover.file}` })
      }
      if (await pathExists(`${audioPath}.part`)) {
        issues.push({ trackId: id, issue: '残留未完成的 .part（下次 ensure 会续传）' })
      }
      if (opts.fix) {
        const broken = issues.some((i) => i.trackId === id && /缺失|不符|损坏/.test(i.issue))
        if (broken) {
          await removeQuiet(dir)
          this.logger(`[media] 清除损坏缓存 ${id}`)
        }
      }
    }
    return issues
  }

  /* ------------------------------------------------------------ 内部 */

  private metaFile(trackId: string): string {
    return path.join(this.dirOf(trackId), 'meta.json')
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
    this.touched.set(meta.trackId, Date.now())
    meta.accessedAt = Date.now()
    await writeJsonAtomic(this.metaFile(meta.trackId), meta)
    return meta
  }

  private async sharePage(trackId: string, signal?: AbortSignal): Promise<ShareMedia> {
    try {
      return await getShareMedia(trackId, {
        fetchImpl: this.fetchImpl,
        cover_width: this.config.coverWidth,
        signal,
      })
    } catch (err) {
      throw new MediaUnavailableError(
        `拿不到可播地址（${trackId}）：${err instanceof Error ? err.message : String(err)}`,
        err,
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
      if (!res.ok) return 0
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
  return {
    ...track,
    name: track.name || share.title || '',
    durationMs: track.durationMs ?? share.duration_ms,
    coverUrl: track.coverUrl ?? share.cover_url,
    vid: track.vid ?? share.vid,
    artists,
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)}GB`
}
