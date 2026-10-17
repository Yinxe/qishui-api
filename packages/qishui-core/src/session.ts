import {
  CookieJar,
  createClient,
  registerDevice,
  type Client,
  type CookieMap,
  type DeviceIdentity,
  type QrStatus,
} from 'qishui-api'
import { NotLoggedInError } from './errors.js'
import type { CorePaths } from './paths.js'
import { readJsonSync, removeQuiet, writeJsonAtomic } from './util.js'

export interface SessionFile {
  v: 1
  device?: DeviceIdentity
  cookies: CookieMap
  /** 登录后记下来的身份，省得每次都问 GetMyInfo */
  uid?: string
  nickname?: string
  savedAt?: number
}

export interface QishuiLogin {
  /** 二维码内容（bff-pc.qishui.com 深链）—— 用**汽水音乐 App** 扫，别用抖音 */
  scanUrl: string
  expiresAt: number
  status(): Promise<QrStatus>
  /** 轮询到 confirmed / expired / timeout；confirmed 时会话已写进 ~/.qishui/session.json */
  wait(intervalMs?: number, timeoutMs?: number): Promise<QrStatus>
}

export interface LoginOptions {
  /** 拿到二维码立刻回调（渲染它是上层的事，core 不引二维码依赖） */
  onQr?: (qr: { scanUrl: string; expiresAt: number }) => void
  intervalMs?: number
  timeoutMs?: number
  /** 登录成功后是否顺手拉一次 GetMyInfo 记下 uid/昵称（多一个请求，默认拉） */
  fetchProfile?: boolean
}

export interface SessionSnapshot {
  loggedIn: boolean
  uid?: string
  nickname?: string
  deviceId?: string
  dataDir: string
  sessionFile: string
}

export interface SessionOptions {
  timeoutMs: number
  fetchImpl?: typeof fetch
  /** 显式注入设备身份（做多个实例/测试用；默认用文件里的或新注册） */
  device?: DeviceIdentity
  cookies?: CookieMap | CookieJar
  logger?: (line: string) => void
}

/**
 * 会话与设备身份：`~/.qishui/session.json`（0600）。
 * core 里**只有这一处**碰登录态，api 的 Client 由它创建并持有。
 *
 * 与 `qishui-api` 包内自测脚本的区别：那边把 device/session 散在包目录里，
 * 这里是应用级数据目录，多实例、迁移、清理都有明确位置。
 */
export class SessionManager {
  private state: SessionFile
  private apiClient?: Client

  constructor(
    private paths: CorePaths,
    private options: SessionOptions,
  ) {
    const file = readJsonSync<SessionFile>(paths.sessionFile)
    this.state = file?.cookies ? { ...file, v: 1 } : { v: 1, cookies: {} }
    if (options.device) this.state.device = options.device
    if (options.cookies) {
      const cookies = options.cookies instanceof CookieJar ? options.cookies.toObject() : options.cookies
      this.state.cookies = { ...this.state.cookies, ...cookies }
    }
    if (options.device || options.cookies) this.state.savedAt = Date.now()
  }

  get device(): DeviceIdentity | undefined {
    return this.state.device
  }

  get uid(): string | undefined {
    return this.state.uid
  }

  get nickname(): string | undefined {
    return this.state.nickname
  }

  snapshot(): SessionSnapshot {
    return {
      loggedIn: this.isLoggedIn(),
      uid: this.state.uid,
      nickname: this.state.nickname,
      deviceId: this.state.device?.deviceId,
      dataDir: this.paths.root,
      sessionFile: this.paths.sessionFile,
    }
  }

  isLoggedIn(): boolean {
    return Boolean(this.state.cookies.sessionid || this.state.cookies.sid_tt || this.state.cookies.passport_assist_user)
  }

  exportCookies(): CookieMap {
    return { ...this.state.cookies }
  }

  assertLoggedIn(): void {
    if (!this.isLoggedIn()) {
      throw new NotLoggedInError(`未登录（${this.paths.sessionFile} 里没有会话），先 core.login() 扫码`)
    }
  }

  /** 建 api Client（首次会注册设备身份并落盘）；重复调用返回同一个实例 */
  async ready(): Promise<Client> {
    if (this.apiClient) return this.apiClient
    let device = this.state.device
    if (!device) {
      device = await registerDevice({ fetchImpl: this.options.fetchImpl })
      this.state.device = device
      this.options.logger?.(`[session] 注册新设备 ${device.deviceId.slice(0, 10)}…`)
      await this.save()
    }
    this.apiClient = await createClient({
      device,
      cookies: new CookieJar(this.state.cookies),
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

  /** 扫码登录（汽水音乐 App 扫）；confirmed 时自动落盘 */
  async login(options: LoginOptions = {}): Promise<QishuiLogin> {
    const client = await this.ready()
    const qr = await client.qrLogin()
    options.onQr?.({ scanUrl: qr.scanUrl, expiresAt: qr.expiresAt })

    const persist = async (): Promise<void> => {
      this.state.cookies = client.exportCookies()
      this.state.savedAt = Date.now()
      await this.save()
      if (options.fetchProfile !== false) {
        try {
          const res: any = await client.request('GetMyInfo', {})
          if (res?.my_info?.id) {
            this.state.uid = String(res.my_info.id)
            this.state.nickname = res.my_info.nickname
            await this.save()
          }
        } catch (err) {
          this.options.logger?.(`[session] 登录成功但 GetMyInfo 失败：${String(err)}`)
        }
      }
      this.options.logger?.(`[session] 登录成功${this.state.nickname ? `：${this.state.nickname}` : ''}（${this.state.uid ?? 'uid 未知'}）`)
    }

    return {
      scanUrl: qr.scanUrl,
      expiresAt: qr.expiresAt,
      status: () => qr.check(),
      wait: async (intervalMs = options.intervalMs ?? 2000, timeoutMs = options.timeoutMs ?? Math.max(0, qr.expiresAt - Date.now())) => {
        const status = await qr.wait(intervalMs, timeoutMs)
        if (status === 'confirmed') await persist()
        return status
      },
    }
  }

  /** 只丢会话，保留设备身份（下次登录不用换设备） */
  async logout(): Promise<void> {
    this.state.cookies = {}
    this.state.uid = undefined
    this.state.nickname = undefined
    this.state.savedAt = Date.now()
    if (this.apiClient) {
      const jar = this.apiClient.cookies
      for (const name of Object.keys(jar.toObject())) jar.absorb([`${name}=`])
    }
    await this.save()
  }

  /** 清掉整份会话文件（含设备身份） */
  async reset(): Promise<void> {
    await removeQuiet(this.paths.sessionFile)
    this.state = { v: 1, cookies: {} }
  }

  async save(): Promise<void> {
    if (this.apiClient) this.state.cookies = this.apiClient.exportCookies()
    this.state.savedAt = Date.now()
    await writeJsonAtomic(this.paths.sessionFile, this.state, 0o600)
  }

  /** 记下当前登录身份（core.account.me() 顺手调用） */
  async rememberIdentity(uid: string, nickname?: string): Promise<void> {
    if (this.state.uid === uid && this.state.nickname === nickname) return
    this.state.uid = uid
    this.state.nickname = nickname
    await this.save()
  }

  /**
   * 一次性迁移：把 `qishui-api` 包目录里那份 device/session 文件读进来。
   * 不删原文件（那是用户的记录），只是复制到 ~/.qishui/。
   * 已经建过 api Client 的话，迁移进来的 cookie 会就地注入它的 CookieJar —— 否则这一次运行仍然未登录。
   */
  async importFrom(files: { deviceFile?: string; sessionFile?: string }): Promise<{ imported: boolean; cookies: number }> {
    let imported = false
    if (files.deviceFile) {
      const device = readJsonSync<DeviceIdentity>(files.deviceFile)
      if (device?.deviceId) {
        this.state.device = device
        imported = true
      }
    }
    if (files.sessionFile) {
      const cookies = readJsonSync<CookieMap>(files.sessionFile)
      if (cookies && typeof cookies === 'object') {
        this.state.cookies = { ...this.state.cookies, ...cookies }
        imported = true
      }
    }
    if (imported) {
      // 顺序要紧：先喂给 CookieJar，再 save()（save 会以 jar 为准回写 state.cookies）
      if (this.apiClient) {
        const jar = this.apiClient.cookies
        jar.absorb(Object.entries(this.state.cookies).map(([name, value]) => `${name}=${value}`))
      }
      await this.save()
    }
    return { imported, cookies: Object.keys(this.state.cookies).length }
  }
}
