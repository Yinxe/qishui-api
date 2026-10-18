import fsp from 'node:fs/promises'
import path from 'node:path'
import type { CorePaths } from '../paths.js'
import { dirStats, ensureDir, fileSize, pathExists, readJson, removeQuiet, writeJsonAtomic } from '../util.js'
import { isScoped } from './policy.js'

/** `viewer`/`account` 档在共享位（未登录）之上的落盘子层名 */
const ACCT_DIR = '_acct'

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
  /** 激活账号的现取 getter（切号即时生效）；undefined/匿名时带态数据落共享位 */
  uid?: () => string | undefined
}

export interface EntityCacheStats {
  entries: number
  bytes: number
  hits: number
  misses: number
}

interface KindDir {
  dir: string
  /** 内存 key 的 scope 段：uid 或 '~'（共享位） */
  scope: string
}

/**
 * 元数据缓存：一个 kind 一个目录，一条一个 JSON 文件。
 * 磁盘形态不用数据库，是为了「坏了能直接 cat / 删掉重来」，也方便上层按目录统计。
 *
 * - 第二维度是账号 scope（`policy.ts` 的 `isScoped`）：带「我」态或账号私有的 kind
 *   落 `_acct/<uid>/<kind>/`，内存 key 也带 uid 前缀，两号互不可见；公共 kind 与匿名态落共享位；
 * - TTL 过期即视为未命中（文件留着，等 prune 清）；
 * - 并发同 key 只发一次 loader（pending 去重）；
 * - `touch` 用文件 mtime 表达 LRU，跨进程也能被 prune 看到。
 */
export class EntityCache {
  private memory = new Map<string, CacheEntry<unknown>>()
  private pending = new Map<string, Promise<{ value: unknown; cached: boolean }>>()
  private hits = 0
  private misses = 0
  /** 落盘失败只提示一次（盘满/只读/权限不对）；缓存是尽力而为，不能把上层调用带崩 */
  private warnedWrite = false

  constructor(
    private paths: CorePaths,
    private options: EntityCacheOptions,
  ) {}

  /** 该 kind 当前该落哪一层：带态且已登录 = uid，否则共享位 */
  private scopeOf(kind: string): string | undefined {
    return isScoped(kind) ? this.options.uid?.() : undefined
  }

  private key(kind: string, id: string): string {
    return `${this.scopeOf(kind) ?? '~'}/${kind}/${id}`
  }

  private pathFor(kind: string, id: string): string {
    return this.paths.entityFile(kind, id, this.scopeOf(kind))
  }

  private kindDirPath(kind: string, scope?: string): string {
    return scope ? path.join(this.paths.entityDir, ACCT_DIR, scope, kind) : path.join(this.paths.entityDir, kind)
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
    try {
      await writeJsonAtomic(this.pathFor(kind, id), entry)
    } catch (err) {
      // 内存里已经命中，落盘失败只影响「下次冷启动」；别让一次缓存写把搜索/详情整条打挂
      if (!this.warnedWrite) {
        this.warnedWrite = true
        this.options.logger?.(`缓存写盘失败（不影响本次结果）：${(err as Error)?.message ?? err}`)
      }
    }
  }

  /** 读盘（内存没有时）：TTL 校验后塞回内存 */
  async load<T>(kind: string, id: string): Promise<T | undefined> {
    const file = this.pathFor(kind, id)
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

  /** 写操作后清缓存：给了 id 清一条，否则清整个 kind（只清当前 scope 的，跨账号数据不动） */
  async invalidate(kind: string, id?: string): Promise<void> {
    const scope = this.scopeOf(kind)
    if (id === undefined) {
      const memPrefix = `${scope ?? '~'}/${kind}/`
      for (const key of [...this.memory.keys()]) if (key.startsWith(memPrefix)) this.memory.delete(key)
      await removeQuiet(this.kindDirPath(kind, scope))
      return
    }
    const memKey = this.key(kind, id)
    this.memory.delete(memKey)
    this.pending.delete(memKey)
    await removeQuiet(this.pathFor(kind, id))
  }

  /** 切号时作废内存/pending（磁盘按 scope 分层，本来就不互踩） */
  clearMemory(): void {
    this.memory.clear()
    this.pending.clear()
  }

  /** 删共享位上的整个 kind 目录（迁移收尾：旧版把账号私有/带态数据落过共享位） */
  async clearShared(kind: string): Promise<void> {
    for (const key of [...this.memory.keys()]) if (key.startsWith(`~/${kind}/`)) this.memory.delete(key)
    await removeQuiet(path.join(this.paths.entityDir, kind))
  }

  /** 删掉某个账号的全部私有/带态缓存（logout --purge / reset 用） */
  async invalidateAccount(uid: string): Promise<void> {
    for (const key of [...this.memory.keys()]) if (key.startsWith(`${uid}/`)) this.memory.delete(key)
    for (const key of [...this.pending.keys()]) if (key.startsWith(`${uid}/`)) this.pending.delete(key)
    await removeQuiet(path.join(this.paths.entityDir, ACCT_DIR, uid))
  }

  /** entityDir 与其下 `_acct/<uid>` 的全部 kind 目录 */
  private async allKindDirs(): Promise<KindDir[]> {
    const out: KindDir[] = []
    let names: string[] = []
    try {
      names = await fsp.readdir(this.paths.entityDir)
    } catch {
      return out
    }
    for (const name of names) {
      if (name === ACCT_DIR) {
        let uids: string[] = []
        const acctRoot = path.join(this.paths.entityDir, ACCT_DIR)
        try {
          uids = await fsp.readdir(acctRoot)
        } catch {
          uids = []
        }
        for (const uid of uids) {
          for (const kind of await this.readdirSafe(path.join(acctRoot, uid))) {
            out.push({ dir: path.join(acctRoot, uid, kind), scope: uid })
          }
        }
      } else {
        out.push({ dir: path.join(this.paths.entityDir, name), scope: '~' })
      }
    }
    return out
  }

  private async readdirSafe(dir: string): Promise<string[]> {
    try {
      return await fsp.readdir(dir)
    } catch {
      return []
    }
  }

  async stats(): Promise<EntityCacheStats> {
    let entries = 0
    let bytes = 0
    for (const kd of await this.allKindDirs()) {
      const sub = await dirStats(kd.dir)
      entries += sub.files
      bytes += sub.bytes
    }
    return { entries, bytes, hits: this.hits, misses: this.misses }
  }

  /** 清掉过期条目；再超 maxBytes 就按 mtime 从旧到新删（共享位与各账号目录一起算） */
  async prune(opts: { maxBytes?: number; maxAgeMs?: number } = {}): Promise<{ removed: number; freedBytes: number }> {
    const now = Date.now()
    const files: { file: string; size: number; mtime: number }[] = []
    for (const kd of await this.allKindDirs()) {
      for (const name of await this.readdirSafe(kd.dir)) {
        const file = path.join(kd.dir, name)
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

    const alive: typeof files = []
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
    const file = this.pathFor(kind, id)
    if (!(await pathExists(file))) return false
    return (await fileSize(file)) !== undefined
  }

  /** 全清元数据缓存（内存 + 磁盘，含全部账号目录）；返回删掉的文件数与字节数 */
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
