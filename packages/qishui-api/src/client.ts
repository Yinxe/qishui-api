import { registerDevice } from './auth/device.js'
import { type LoginContext, type QrLogin, startQrLogin } from './auth/qr.js'
import { CookieJar, type CookieMap } from './cookies.js'
import { type EndpointName, endpointFn, type RequestOf, type ResponseOf } from './endpoints.js'
import type { IRequestCaller } from './idl/_common.js'
import type { DeviceIdentity } from './params.js'
import { createCaller, type TransportOptions } from './transport.js'

/**
 * thrift 声明的 required 字段，官方客户端自己也会省略（服务端说了算），
 * 所以入参用 DeepPartial，避免调用方为了类型补齐一堆无意义的空值。
 */
export type DeepPartial<T> =
  T extends Array<infer U> ? Array<DeepPartial<U>> : T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T

export type RequestInput<K extends EndpointName> = DeepPartial<RequestOf<K>>

export interface ClientOptions {
  /** 省略则自动调用 /service/2/desktop/device_register/ 申请一台新设备 */
  device?: DeviceIdentity
  cookies?: CookieJar | CookieMap
  baseUrl?: string
  timeout?: number
  fetchImpl?: typeof fetch
  logger?: (line: string) => void
  /** 扫码确认页上显示的电脑名（深链 `computer_name`）；省略则自动派生 */
  computerName?: string
}

export interface Client extends LoginContext {
  /** 按 IDL 端点 key 调用，请求/响应类型由 idl 层推导 */
  request<K extends EndpointName>(
    key: K,
    req: RequestInput<K>,
    options?: { timeout?: number },
  ): Promise<ResponseOf<K> & { headers: Record<string, string> }>
  /** 起一次扫码登录（用汽水音乐 App 扫）；拿到 scanUrl 自行渲染二维码，wait() 成功后 cookie 已写回 */
  qrLogin(): Promise<QrLogin>
  isLoggedIn(): boolean
  exportCookies(): CookieMap
}

export async function createClient(options: ClientOptions = {}): Promise<Client> {
  const device = options.device ?? (await registerDevice({ baseUrl: options.baseUrl, fetchImpl: options.fetchImpl }))
  const cookies = options.cookies instanceof CookieJar ? options.cookies : new CookieJar(options.cookies ?? {})

  const caller = createCaller({
    device,
    cookies,
    baseUrl: options.baseUrl,
    timeout: options.timeout,
    fetchImpl: options.fetchImpl,
    logger: options.logger,
  } satisfies TransportOptions)

  const client: Client = {
    device,
    cookies,
    baseUrl: options.baseUrl,
    fetchImpl: options.fetchImpl,
    computerName: options.computerName,

    async request(key, req, opts) {
      const fn = endpointFn(key) as unknown as (c: IRequestCaller, r: unknown, ctx: unknown) => Promise<any>
      // context.__key 让 transport 能区分跨模块重名端点
      const context: Record<string, unknown> = { __key: key }
      if (opts?.timeout) context.timeout = opts.timeout
      return await fn(caller, req, context)
    },

    async qrLogin() {
      return await startQrLogin(client)
    },

    isLoggedIn() {
      return cookies.isLoggedIn()
    },

    exportCookies() {
      return cookies.toObject()
    },
  }
  return client
}
