import {
  type Client,
  CookieJar,
  type CookieMap,
  createClient,
  type DeviceIdentity,
  type QrStatus,
  registerDevice,
} from 'qishui-api'
import { NotLoggedInError } from './errors.js'
import type { CorePaths } from './paths.js'
import { readJsonSync, removeQuiet, writeJsonAtomic } from './util.js'

const ANON_UID = '_anon'

/** 账号会话文件 `accounts/<uid>.json` 的形状（旧 session.json 去掉 device 的那份状态） */
export interface SessionFile {
  v: 1
  cookies: CookieMap
  /** 登录后记下来的身份，省得每次都问 GetMyInfo */
  uid?: string
  nickname?: string
  savedAt?: number
}

/** 账号索引条目（`accounts.json`） */
export interface AccountMeta {
  uid: string
  nickname?: string
  savedAt?: number
  lastUsedAt?: number
}

interface AccountsIndexFile {
  v: 1
  accounts: AccountMeta[]
}

interface DeviceFileShape {
  v: 1
  device: DeviceIdentity
}

export interface QishuiLogin {
  /** 二维码内容（bff-pc.qishui.com 深链）—— 用**汽水音乐 App** 扫，别用抖音 */
  scanUrl: string
  expiresAt: number
  status(): Promise<QrStatus>
  /** 轮询到 confirmed / expired / timeout；confirmed 时会话已写进 accounts/<uid>.json */
  wait(intervalMs?: number, timeoutMs?: number): Promise<QrStatus>
}

export interface LoginOptions {
  /** 拿到二维码立刻回调（渲染它是上层的事，core 不引二维码依赖） */
  onQr?: (qr: { scanUrl: string; expiresAt: number }) => void
  intervalMs?: number
  timeoutMs?: number
  /** 登录成功后是否顺手拉一次 GetMyInfo 记下 uid/昵称（默认拉） */
  fetchProfile?: boolean
  /** 新号入库但**不**切为激活（默认登录即激活） */
  keepActive?: boolean
  /** persist 完成回调（core 用它作废内存缓存、换播放历史 scope） */
  onPersisted?: (uid: string | undefined) => void
}

export interface SessionSnapshot {
  loggedIn: boolean
  uid?: string
  nickname?: string
  deviceId?: string
  dataDir: string
  sessionFile: string
  /** 当前激活账号（= uid，未登录为 undefined） */
  activeUid?: string
  /** 已入库账号数 */
  accountCount: number
}

export interface AccountInfo extends AccountMeta {
  active: boolean
}

export interface SessionOptions {
  timeoutMs: number
  fetchImpl?: typeof fetch
  /** 显式注入设备身份（做多个实例/测试用；默认用 device.json 里的或新注册） */
  device?: DeviceIdentity
  cookies?: CookieMap | CookieJar
  logger?: (line: string) => void
  /** 期望激活的账号（`createQishui({account})` / 全局 `--as` 传这里，优先于 index 的 lastUsedAt） */
  activeUid?: string
  /** 激活账号变化时回调（core 用它写回 config.activeUid） */
  onActivate?: (uid: string | undefined) => void | Promise<void>
}

/**
 * 会话与设备身份：`~/.qishui/` 下三份存储 ——
 * `device.json`（设备身份，与账号解耦、全体共用，换号不触发新设备注册）、
 * `accounts.json`（账号索引）+ `accounts/<uid>.json`（每号一份 cookie，0600）。
 *
 * 旧版单账号 `session.json` 由 `init()` 一次性迁移（迁完改名 `.bak`）。
 * core 里**只有这一处**碰登录态，api 的 Client 由它创建并持有；切号 = 换 cookie 注入，Client 不换。
 */
export class SessionManager {
  private deviceIdentity?: DeviceIdentity
  private index: AccountMeta[] = []
  private current: SessionFile = { v: 1, cookies: {} }
  private apiClient?: Client
  private initDone = false
  /** init 时迁移过旧版单账号 `session.json`（core 据此清共享位上的历史账号数据） */
  migrated = false

  constructor(
    private paths: CorePaths,
    private options: SessionOptions,
  ) {}

  /** 迁移旧会话 + 载入设备/索引/激活账号；幂等，`ready()` 会自动调 */
  async init(): Promise<void> {
    if (this.initDone) return
    this.initDone = true
    await this.migrateLegacySession()
    const deviceFile = readJsonSync<DeviceFileShape>(this.paths.deviceFile)
    this.deviceIdentity = this.options.device ?? deviceFile?.device
    const index = readJsonSync<AccountsIndexFile>(this.paths.accountsIndexFile)
    this.index = Array.isArray(index?.accounts) ? index.accounts : []
    const wanted = this.softResolve(this.options.activeUid) ?? this.pickDefaultUid()
    if (wanted) {
      const account = readJsonSync<SessionFile>(this.paths.accountFile(wanted))
      if (account?.cookies) {
        this.current = { ...account, v: 1, uid: wanted }
      }
    }
    if (!Object.keys(this.current.cookies).length) {
      // uid 未知的匿名会话壳（迁移/import 进来的）：原样回读，rememberIdentity 后归位到账号文件
      const anon = readJsonSync<SessionFile>(this.paths.accountFile(ANON_UID))
      if (anon?.cookies && Object.keys(anon.cookies).length) this.current = { ...anon, v: 1, uid: undefined }
    }
    if (this.options.cookies) {
      const injected =
        this.options.cookies instanceof CookieJar ? this.options.cookies.toObject() : this.options.cookies
      this.current = { ...this.current, cookies: { ...this.current.cookies, ...injected } }
    }
  }

  private pickDefaultUid(): string | undefined {
    const usable = this.index.filter((meta) => {
      const account = readJsonSync<SessionFile>(this.paths.accountFile(meta.uid))
      return Boolean(account?.cookies && Object.keys(account.cookies).length)
    })
    if (!usable.length) return undefined
    return usable.sort((a, b) => (b.lastUsedAt ?? 0) - (a.lastUsedAt ?? 0))[0].uid
  }

  private async migrateLegacySession(): Promise<void> {
    const legacy = readJsonSync<SessionFile & { device?: DeviceIdentity }>(this.paths.sessionFile)
    if (!legacy) return
    this.migrated = true
    if (legacy.device && !readJsonSync<DeviceFileShape>(this.paths.deviceFile)) {
      await writeJsonAtomic(this.paths.deviceFile, { v: 1, device: legacy.device }, 0o600)
    }
    if (legacy.cookies && Object.keys(legacy.cookies).length) {
      const uid = legacy.uid
      if (uid) {
        await this.writeAccount({
          v: 1,
          cookies: legacy.cookies,
          uid,
          nickname: legacy.nickname,
          savedAt: legacy.savedAt,
        })
        this.upsertIndex({ uid, nickname: legacy.nickname, savedAt: legacy.savedAt, lastUsedAt: legacy.savedAt })
        await this.saveIndex()
      } else {
        await writeJsonAtomic(this.paths.accountFile(ANON_UID), { v: 1, cookies: legacy.cookies }, 0o600)
      }
    }
    await this.renameLegacy()
    this.options.logger?.('[session] 旧 session.json 已迁移到 accounts/（原件改名 session.json.bak）')
  }

  private async renameLegacy(): Promise<void> {
    const fs = await import('node:fs')
    try {
      fs.renameSync(this.paths.sessionFile, `${this.paths.sessionFile}.bak`)
    } catch {
      // 已不存在或改名失败（只读盘），都不拦路
    }
  }

  get device(): DeviceIdentity | undefined {
    return this.deviceIdentity
  }

  get uid(): string | undefined {
    return this.current.uid
  }

  get nickname(): string | undefined {
    return this.current.nickname
  }

  snapshot(): SessionSnapshot {
    return {
      loggedIn: this.isLoggedIn(),
      uid: this.current.uid,
      nickname: this.current.nickname,
      deviceId: this.deviceIdentity?.deviceId,
      dataDir: this.paths.root,
      sessionFile: this.paths.sessionFile,
      activeUid: this.current.uid,
      accountCount: this.index.length,
    }
  }

  isLoggedIn(): boolean {
    const c = this.current.cookies
    return Boolean(c.sessionid || c.sid_tt || c.passport_assist_user)
  }

  exportCookies(): CookieMap {
    return { ...this.current.cookies }
  }

  assertLoggedIn(): void {
    if (!this.isLoggedIn()) {
      throw new NotLoggedInError(
        `未登录（激活账号 ${this.current.uid ?? '无'}），先 core.login() 扫码或用 useAccount() 切回`,
      )
    }
  }

  /** 已入库账号一览（含激活标记） */
  accounts(): AccountInfo[] {
    return this.index.map((meta) => ({ ...meta, active: meta.uid === this.current.uid }))
  }

  get activeUid(): string | undefined {
    return this.current.uid
  }

  /**
   * 切到已入库账号：换 cookie 注入（先清后灌，杜绝上一号残留）。
   * 只动会话层；缓存/历史/播放器的作废由 `QishuiCore.useAccount()` 编排。
   */
  async useAccount(uid: string): Promise<void> {
    await this.init()
    const target = this.resolveUid(uid)
    const account = readJsonSync<SessionFile>(this.paths.accountFile(target))
    if (!account?.cookies || !Object.keys(account.cookies).length) {
      throw new NotLoggedInError(`账号 ${target} 没有留存会话（登出过或没登录过），需要重新登录`)
    }
    this.current = { ...account, v: 1, uid: target }
    this.swapCookies(this.current.cookies)
    this.upsertIndex({ uid: target, nickname: this.current.nickname, lastUsedAt: Date.now() })
    await this.saveIndex()
    await this.options.onActivate?.(target)
    this.options.logger?.(`[session] 切号 → ${this.current.nickname ?? ''}（${target}）`)
  }

  /** uid 直接给；也给昵称精确匹配（撞号报歧义） */
  private resolveUid(input: string): string {
    if (this.index.some((meta) => meta.uid === input)) return input
    const byNick = this.index.filter((meta) => meta.nickname === input)
    if (byNick.length === 1) return byNick[0].uid
    if (byNick.length > 1) {
      throw new NotLoggedInError(`昵称「${input}」对应多个账号：${byNick.map((m) => m.uid).join(' / ')}`)
    }
    throw new NotLoggedInError(
      `没有账号 ${input}（已入库：${this.index.map((m) => `${m.nickname ?? ''}=${m.uid}`).join(' ') || '无'}）`,
    )
  }

  /** init 阶段用：解析不出就回退（不抛错，按 lastUsedAt 挑） */
  private softResolve(input: string | undefined): string | undefined {
    if (!input) return undefined
    if (this.index.some((meta) => meta.uid === input)) return input
    const byNick = this.index.filter((meta) => meta.nickname === input)
    return byNick.length === 1 ? byNick[0].uid : undefined
  }

  /** 建 api Client（首次会注册设备身份并落 device.json）；重复调用返回同一个实例 */
  async ready(): Promise<Client> {
    await this.init()
    if (this.apiClient) return this.apiClient
    if (!this.deviceIdentity) {
      this.deviceIdentity = await registerDevice({ fetchImpl: this.options.fetchImpl })
      await writeJsonAtomic(this.paths.deviceFile, { v: 1, device: this.deviceIdentity }, 0o600)
      this.options.logger?.(`[session] 注册新设备 ${this.deviceIdentity.deviceId.slice(0, 10)}…`)
    }
    this.apiClient = await createClient({
      device: this.deviceIdentity,
      cookies: new CookieJar(this.current.cookies),
      timeout: this.options.timeoutMs,
      fetchImpl: this.options.fetchImpl,
      logger: this.options.logger,
    })
    return this.apiClient
  }

  /** 已就绪的 api Client（没 ready() 过就抛错） */
  get api(): Client {
    if (!this.apiClient) throw new NotLoggedInError('api Client 还没初始化，先 await core.ready()')
    return this.apiClient
  }

  /** 扫码登录（汽水音乐 App 扫）；confirmed 时新号入库并默认激活，不覆盖其他账号 */
  async login(options: LoginOptions = {}): Promise<QishuiLogin> {
    await this.init()
    const client = await this.ready()
    const qr = await client.qrLogin()
    options.onQr?.({ scanUrl: qr.scanUrl, expiresAt: qr.expiresAt })

    const persist = async (): Promise<void> => {
      const previous = { ...this.current }
      const cookies = client.exportCookies()
      let uid: string | undefined
      let nickname: string | undefined
      if (options.fetchProfile !== false) {
        try {
          const res: any = await client.request('GetMyInfo', {})
          if (res?.my_info?.id) {
            uid = String(res.my_info.id)
            nickname = res.my_info.nickname
          }
        } catch (err) {
          this.options.logger?.(`[session] 登录成功但 GetMyInfo 失败：${String(err)}`)
        }
      }
      this.current = { v: 1, cookies, uid, nickname, savedAt: Date.now() }
      await this.saveCurrent()
      if (uid) {
        this.upsertIndex({ uid, nickname, savedAt: Date.now(), lastUsedAt: Date.now() })
        await this.saveIndex()
        if (options.keepActive && previous.uid && Object.keys(previous.cookies).length) {
          // 登录但不切号：把上一激活账号的 cookie 灌回 jar
          this.swapCookies(previous.cookies)
        } else {
          await this.options.onActivate?.(uid)
        }
      }
      this.options.logger?.(
        `[session] 登录成功${nickname ? `：${nickname}` : ''}（${uid ?? 'uid 未知'}）${options.keepActive ? '，保持原激活号' : ''}`,
      )
      options.onPersisted?.(this.current.uid)
    }

    return {
      scanUrl: qr.scanUrl,
      expiresAt: qr.expiresAt,
      status: () => qr.check(),
      wait: async (
        intervalMs = options.intervalMs ?? 2000,
        timeoutMs = options.timeoutMs ?? Math.max(0, qr.expiresAt - Date.now()),
      ) => {
        const status = await qr.wait(intervalMs, timeoutMs)
        if (status === 'confirmed') await persist()
        return status
      },
    }
  }

  /**
   * 退出当前账号：默认清 cookie、保留账号壳（昵称/私有缓存还在，可再登录归位）；
   * `purge: true` 连 `accounts/<uid>.json` 与索引一起删（私有缓存由 core 失效）。
   */
  async logout(opts: { purge?: boolean } = {}): Promise<void> {
    await this.init()
    const uid = this.current.uid
    const nickname = this.current.nickname
    const jar = this.apiClient?.cookies
    this.current = { v: 1, cookies: {}, uid: undefined, nickname: undefined }
    if (jar) {
      for (const name of Object.keys(jar.toObject())) jar.absorb([`${name}=`])
    }
    if (uid) {
      // 账号壳（uid/nickname 留在索引里）+ 空 cookie 的号文件；purge 则连文件与索引一起删
      await writeJsonAtomic(this.paths.accountFile(uid), { v: 1, cookies: {}, uid, nickname }, 0o600)
      if (opts.purge) {
        this.index = this.index.filter((meta) => meta.uid !== uid)
        await this.saveIndex()
        await removeQuiet(this.paths.accountFile(uid))
      }
    }
    await removeQuiet(this.paths.accountFile(ANON_UID))
    await this.options.onActivate?.(undefined)
    this.options.logger?.(`[session] 已退出${uid ? ` ${uid}` : ''}${opts.purge ? '（含账号文件）' : ''}`)
  }

  /** 清掉全部账号/设备（缓存里各号私有目录由 core 失效） */
  async reset(): Promise<void> {
    this.current = { v: 1, cookies: {} }
    this.index = []
    this.deviceIdentity = undefined
    const fs = await import('node:fs')
    try {
      fs.rmSync(this.paths.accountsDir, { recursive: true, force: true })
    } catch {}
    await removeQuiet(this.paths.accountsIndexFile)
    await removeQuiet(this.paths.deviceFile)
    await this.renameLegacy()
    await this.options.onActivate?.(undefined)
  }

  /** 把 current 写进它该在的位置：认得出 uid 进 `<uid>.json`，认不出进 `_anon.json` */
  private async saveCurrent(): Promise<void> {
    this.current.savedAt = Date.now()
    await this.writeAccount(this.current)
    await this.renameAnonIfNeeded()
  }

  private async writeAccount(state: SessionFile): Promise<void> {
    const file = this.paths.accountFile(state.uid ?? ANON_UID)
    await writeJsonAtomic(
      file,
      { v: 1, cookies: state.cookies, uid: state.uid, nickname: state.nickname, savedAt: state.savedAt },
      0o600,
    )
  }

  /** uid 从未知变成已知时（import 后补测出身份），把 `_anon.json` 里归入该号的 cookie 撤掉 */
  private async renameAnonIfNeeded(): Promise<void> {
    if (!this.current.uid) return
    const anon = readJsonSync<SessionFile>(this.paths.accountFile(ANON_UID))
    if (!anon) return
    const shared = Object.keys(anon.cookies).filter((name) => name in this.current.cookies)
    if (shared.length === Object.keys(anon.cookies).length) {
      await removeQuiet(this.paths.accountFile(ANON_UID))
    }
  }

  private upsertIndex(meta: Partial<AccountMeta> & { uid: string }): void {
    const hit = this.index.find((m) => m.uid === meta.uid)
    if (hit) Object.assign(hit, stripUndefined(meta))
    else this.index.push({ uid: meta.uid, ...stripUndefined(meta) } as AccountMeta)
  }

  private async saveIndex(): Promise<void> {
    await writeJsonAtomic(this.paths.accountsIndexFile, { v: 1, accounts: this.index }, 0o600)
  }

  /** 先清空 jar 里所有名字，再灌目标号 —— 杜绝跨号 cookie 残留 */
  private swapCookies(cookies: CookieMap): void {
    if (!this.apiClient) return
    const jar = this.apiClient.cookies
    for (const name of Object.keys(jar.toObject())) jar.absorb([`${name}=`])
    jar.absorb(Object.entries(cookies).map(([name, value]) => `${name}=${value}`))
  }

  async save(): Promise<void> {
    if (this.apiClient) this.current.cookies = this.apiClient.exportCookies()
    await this.saveCurrent()
  }

  /** 记下当前登录身份（core.account.me() 顺手调用）；uid 真的换人才按切号写回 config */
  async rememberIdentity(uid: string, nickname?: string): Promise<void> {
    await this.init()
    const previousUid = this.current.uid
    if (previousUid === uid && this.current.nickname === nickname) return
    this.current.uid = uid
    this.current.nickname = nickname
    await this.saveCurrent()
    this.upsertIndex({ uid, nickname, lastUsedAt: Date.now() })
    await this.saveIndex()
    // `--as` 临时实例里 current.uid 本来就是它：只记昵称，别把临时号写成默认激活
    if (previousUid !== uid) await this.options.onActivate?.(uid)
  }

  /**
   * 一次性迁移：把 `qishui-api` 包目录里那份 device/session 文件读进来（cookie 归入当前号或匿名壳）。
   * 不删原文件（那是用户的记录）。已建过 api Client 的话，迁移进来的 cookie 就地注入它的 jar。
   */
  async importFrom(files: {
    deviceFile?: string
    sessionFile?: string
  }): Promise<{ imported: boolean; cookies: number }> {
    await this.init()
    let imported = false
    if (files.deviceFile && !this.deviceIdentity) {
      const device = readJsonSync<DeviceIdentity>(files.deviceFile)
      if (device?.deviceId) {
        this.deviceIdentity = device
        await writeJsonAtomic(this.paths.deviceFile, { v: 1, device }, 0o600)
        imported = true
      }
    }
    if (files.sessionFile) {
      const cookies = readJsonSync<CookieMap>(files.sessionFile)
      if (cookies && typeof cookies === 'object' && Object.keys(cookies).length) {
        this.current.cookies = { ...this.current.cookies, ...cookies }
        imported = true
      }
    }
    if (imported) {
      // 顺序要紧：先喂给 CookieJar，再 save()（save 会以 jar 为准回写）
      if (this.apiClient) {
        const jar = this.apiClient.cookies
        jar.absorb(Object.entries(this.current.cookies).map(([name, value]) => `${name}=${value}`))
      }
      await this.save()
    }
    return { imported, cookies: Object.keys(this.current.cookies).length }
  }
}

function stripUndefined<T extends object>(obj: T): Partial<T> {
  const out: Partial<T> = {}
  for (const [k, v] of Object.entries(obj)) if (v !== undefined) (out as Record<string, unknown>)[k] = v
  return out
}
