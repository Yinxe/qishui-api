/** 业务 status_code（响应体里的），不是 HTTP 状态码 */
export const StatusCode = {
  /** 会话无效 / 未登录 */
  InvalidSession: 1000016,
  /** 参数非法 */
  InvalidParams: 1000004,
  /** 资源不可用（下架、无版权、不可播） */
  Unplayable: 1000005,
  UserCancelled: 1000020,
  UserBanned: 1000021,
  UserHidden: 1000022,
} as const

export class QishuiError extends Error {
  constructor(message: string, readonly detail?: unknown) {
    super(message)
    this.name = new.target.name
  }
}

/** 网络层失败：连接、超时、非 2xx */
export class TransportError extends QishuiError {}

/** HTTP 2xx 但业务 status_code 非 0 */
export class ApiError extends QishuiError {
  constructor(
    readonly statusCode: number,
    readonly statusInfo: unknown,
    readonly endpoint: string,
    readonly httpStatus: number,
  ) {
    super(`${endpoint} 返回业务错误 status_code=${statusCode}`)
  }
}

/** 需要登录（1000016 或 passport 风控判定） */
export class AuthRequiredError extends QishuiError {}

/**
 * 触发风控：响应带 bdturing-verify / x-tt-verify-passport-decision。
 * 官方客户端在这里会弹出验证码窗口，纯 HTTP 客户端无法替用户完成，只能上抛。
 */
export class RiskControlError extends QishuiError {
  constructor(readonly kind: 'captcha' | 'passport-second-verify', readonly challenge: string) {
    super(`命中风控(${kind})，需人工完成验证后重试`)
  }
}

/*
 * 曾经有个 `UnsupportedError`：用于「本项目刻意不实现 goapi 播放地址接口」。
 * 已删除（2026-10-17）：上游才是裁判 —— 本库照常发请求，上游怎么答就怎么答。
 * 判断某个接口「实测不通」属于文档/元数据（`ENDPOINT_DATA[].gated`）的事，不该由本库的异常来代替。
 * 可播地址另有入口：web 分享页的 SSR，见 `src/web/sharePage.ts`。
 */
