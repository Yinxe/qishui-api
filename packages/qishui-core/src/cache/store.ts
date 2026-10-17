import fsp from 'node:fs/promises'
import path from 'node:path'
import type { CorePaths } from '../paths.js'
import { dirStats, ensureDir, fileSize, pathExists, readJson, removeQuiet, writeJsonAtomic } from '../util.js'

export interface CacheEntry<T> {
  v: 1
  kind: string
  id: string
  at: number
  expires: number
  data: T
}

export interface EntityCacheOptions {
  ttlMs: number
  logger?: (line: string) => void
}

export interface EntityCacheStats {
  entries: number
  bytes: number
  hits: number
  misses: number
}

/**
 * 元数据缓存：一个 kind 一个目录，一条一个 JSON 文件。
 * 磁盘形态不用数据库，是为了「坏了能直接 cat / 删掉重来」，也方便上层按目录统计。
 *
 * - TTL 过期即视为未命中（文件留着，等 prune 清）；
 * - 并发同 key 只发一次 loader（pending 去重）；
 * - `touch` 用文件 mtime 表达 LRU，跨进程也能被 prune 看到。
 */
export class EntityCache {
  private memory = new Map<string, CacheEntry<unknown>>()
  private pending = new Map<string, Promise<{ value: unknown; cached: boolean }>>()
  private hits = 0
  private misses = 0

  constructor(
    private paths: CorePaths,
    private options: EntityCacheOptions,
  ) {}

  private key(kind: string, id: string): string {
    return `${kind}/${id}`
  }

  get<T>(kind: string, id: string): { value: T; at: number } | undefined {
    const key = this.key(kind, id)
    const entry = this.memory.get(key) as CacheEntry<T> | undefined
    if (!entry) return undefined
    if (entry.expires <= Date.now()) return undefined
    return { value: entry.data, at: entry.at }
  }

  /** 同步内存命中（不读盘）：给「有就白拿」的场景用 */
  peek<T>(kind: string, id: string): T | undefined {
    return this.get<T>(kind, id)?.value
  }

  async set<T>(kind: string, id: string, data: T, ttlMs = this.options.ttlMs): Promise<void> {
    const entry: CacheEntry<T> = { v: 1, kind, id, at: Date.now(), expires: Date.now() + ttlMs, data }
    this.memory.set(this.key(kind, id), entry)
    if (ttlMs <= 0) return
    await writeJsonAtomic(this.paths.entityFile(kind, id), entry)
  }

  /** 读盘（内存没有时）：TTL 校验后塞回内存 */
  async load<T>(kind: string, id: string): Promise<T | undefined> {
    const file = this.paths.entityFile(kind, id)
    const entry = await readJson<CacheEntry<T>>(file)
    if (!entry?.data) return undefined
    if (typeof entry.expires === 'number' && entry.expires <= Date.now()) return undefined
    this.memory.set(this.key(kind, id), entry)
    return entry.data
  }

  async fetch<T>(
    kind: string,
    id: string,
    loader: () => Promise<T>,
    opts: { ttlMs?: number; force?: boolean } = {},
  ): Promise<{ value: T; cached: boolean }> {
    if (!opts.force) {
      const mem = this.get<T>(kind, id)
      if (mem) {
        this.hits++
        return { value: mem.value, cached: true }
      }
      const disk = await this.load<T>(kind, id)
      if (disk !== undefined) {
        this.hits++
        return { value: disk, cached: true }
      }
    }
    this.misses++

    const key = this.key(kind, id)
    if (!opts.force) {
      const inflight = this.pending.get(key)
      if (inflight) return (await inflight) as { value: T; cached: boolean }
    }

    const task = (async () => {
      const value = await loader()
      await this.set(kind, id, value, opts.ttlMs ?? this.options.ttlMs)
      return { value, cached: false }
    })()
    this.pending.set(key, task as Promise<{ value: unknown; cached: boolean }>)
    try {
      return (await task) as { value: T; cached: boolean }
    } finally {
      this.pending.delete(key)
    }
  }

  /** 写操作后清缓存：给了 id 清一条，否则清整个 kind */
  async invalidate(kind: string, id?: string): Promise<void> {
    const prefix = `${kind}/`
    for (const key of [...this.memory.keys()]) {
      if (key === `${kind}/${id}` || (id === undefined && key.startsWith(prefix))) this.memory.delete(key)
    }
    if (id === undefined) await removeQuiet(path.join(this.paths.entityDir, kind))
    else await removeQuiet(this.paths.entityFile(kind, id))
  }

  async stats(): Promise<EntityCacheStats> {
    let entries = 0
    let bytes = 0
    let kinds: string[] = []
    try {
      kinds = await fsp.readdir(this.paths.entityDir)
    } catch {
      kinds = []
    }
    for (const kind of kinds) {
      const dir = path.join(this.paths.entityDir, kind)
      const sub = await dirStats(dir)
      entries += sub.files
      bytes += sub.bytes
    }
    return { entries, bytes, hits: this.hits, misses: this.misses }
  }

  /** 清掉过期条目；再超 maxBytes 就按 mtime 从旧到新删 */
  async prune(opts: { maxBytes?: number; maxAgeMs?: number } = {}): Promise<{ removed: number; freedBytes: number }> {
    const now = Date.now()
    const files: { file: string; size: number; mtime: number }[] = []
    let kinds: string[] = []
    try {
      kinds = await fsp.readdir(this.paths.entityDir)
    } catch {
      return { removed: 0, freedBytes: 0 }
    }
    for (const kind of kinds) {
      const dir = path.join(this.paths.entityDir, kind)
      let names: string[] = []
      try {
        names = await fsp.readdir(dir)
      } catch {
        continue
      }
      for (const name of names) {
        const file = path.join(dir, name)
        try {
          const st = await fsp.stat(file)
          files.push({ file, size: st.size, mtime: st.mtimeMs })
        } catch {
          // 并发删掉了，忽略
        }
      }
    }

    let removed = 0
    let freedBytes = 0
    const drop = async (file: string, size: number): Promise<void> => {
      await removeQuiet(file)
      removed++
      freedBytes += size
    }

    let alive: typeof files = []
    for (const item of files) {
      const entry = await readJson<CacheEntry<unknown>>(item.file)
      const expired = entry?.expires != null ? entry.expires <= now : true
      const tooOld = opts.maxAgeMs ? now - item.mtime > opts.maxAgeMs : false
      if (expired || tooOld) await drop(item.file, item.size)
      else alive.push(item)
    }

    const maxBytes = opts.maxBytes ?? 0
    if (maxBytes > 0) {
      alive.sort((a, b) => a.mtime - b.mtime)
      let total = alive.reduce((sum, item) => sum + item.size, 0)
      for (const item of alive) {
        if (total <= maxBytes) break
        await drop(item.file, item.size)
        total -= item.size
      }
    }
    // 被删掉的条目可能还在内存里
    this.memory.clear()
    return { removed, freedBytes }
  }

  /** 只读看某个 kind 是否有落盘（不做网络） */
  async has(kind: string, id: string): Promise<boolean> {
    if (this.get(kind, id)) return true
    const file = this.paths.entityFile(kind, id)
    if (!(await pathExists(file))) return false
    return (await fileSize(file)) !== undefined
  }

  /** 全清元数据缓存（内存 + 磁盘）；返回删掉的文件数与字节数 */
  async clear(): Promise<{ removed: number; freedBytes: number }> {
    const before = await this.stats()
    this.memory.clear()
    this.pending.clear()
    await removeQuiet(this.paths.entityDir)
    return { removed: before.entries, freedBytes: before.bytes }
  }

  async ensureDirs(): Promise<void> {
    await ensureDir(this.paths.entityDir)
  }
}
