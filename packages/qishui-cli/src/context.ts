/**
 * 命令上下文：全局选项 + **惰性**创建 core 实例（进程内单例）。
 *
 * 为什么要惰性：`qishui --help`、`qishui config path` 这类命令不该为了打印帮助去连网注册设备身份。
 */
import {
  ApiError,
  AuthRequiredError,
  CacheError,
  CoreError,
  createQishui,
  MediaUnavailableError,
  NotLoggedInError,
  type QishuiCore,
  RiskControlError,
  TransportError,
} from 'qishui-core'
import { dim, setColor, setOutputMode } from './output.js'

export interface Globals {
  /** 数据目录（默认 ~/.qishui，环境变量 QISHUI_HOME 优先） */
  dataDir?: string
  /** stdout 只输出 JSON（日志仍然走 stderr） */
  json: boolean
  /** JSON 里保留每个实体的 `raw`（上游原始响应，很大） */
  raw: boolean
  verbose: boolean
  color: boolean
  /** 人读输出带不带 id（`--no-id` / `--id false` 关掉） */
  id: boolean
  /** 本命令临时激活的账号（uid 或昵称），不改 config.activeUid */
  as?: string
}

const state: Globals = { json: false, raw: false, verbose: false, color: true, id: true }

/** CLI 自己的错误：`message` 是给人看的一句话，`hint` 是"下一步该干嘛" */
export class CliError extends Error {
  constructor(
    message: string,
    readonly hint?: string,
  ) {
    super(message)
    this.name = 'CliError'
  }
}

export function setGlobals(next: Partial<Globals>): void {
  Object.assign(state, next)
  setColor(state.color)
  setOutputMode({ json: state.json, raw: state.raw, id: state.id })
}

/**
 * `--no-id` / `--id false` 都收（`--id` 要求带值：true/false/yes/no/1/0）。
 * commander 的 `--no-id` 把值设成 `false`，`--id <show>` 设成字符串。
 */
export function resolveIdVisibility(id: unknown): boolean {
  if (id === undefined) return true
  if (id === false || id === true) return id
  return !['false', 'no', '0', 'off', 'none'].includes(String(id).toLowerCase())
}

export function globals(): Globals {
  return state
}

let corePromise: Promise<QishuiCore> | undefined

/** 拿到 core（首次调用会读配置 + 需要时注册设备身份） */
export function core(): Promise<QishuiCore> {
  corePromise ??= createQishui({
    dataDir: state.dataDir,
    account: state.as,
    logger: state.verbose ? (line: string) => process.stderr.write(dim(`· ${line}`) + '\n') : undefined,
  }).catch((err: unknown) => {
    // --as 指错号：原样转述「没有该号 / 没有留存会话 / 昵称撞号」，别被通用映射吞成「需要登录」
    if (state.as && err instanceof NotLoggedInError) {
      throw new CliError(err.message, '单命令临时换号只认已入库账号：先看 `qishui accounts`')
    }
    throw err
  })
  return corePromise
}

export async function shutdown(): Promise<void> {
  if (!corePromise) return
  try {
    const instance = await corePromise
    instance.dispose()
  } catch {
    /* 退出路径上不再抛 */
  }
}

export function assertLoggedIn(instance: QishuiCore): void {
  if (!instance.loggedIn) {
    throw new CliError('这个命令需要登录', '先跑 `qishui login`（用汽水音乐 App 扫码）')
  }
}

/** 常见错误 → 一句中文 + 下一步提示（别把 Node 栈糊到用户脸上） */
export function describeError(err: unknown): { message: string; hint?: string } {
  if (err instanceof CliError) return { message: err.message, hint: err.hint }
  if (err instanceof AuthRequiredError || err instanceof NotLoggedInError) {
    return { message: '需要登录（上游回 1000016）', hint: '先跑 `qishui login`' }
  }
  if (err instanceof RiskControlError) {
    return {
      message: `触发风控（${err.kind}）`,
      hint: '上游对用户态接口连打会出验证码；等几分钟再试，别遍历粉丝/关注列表',
    }
  }
  if (err instanceof ApiError) {
    const code = err.statusCode
    const hints: Record<number, string> = {
      1000016: '先跑 `qishui login`',
      1000004: '参数被上游拒了：确认 id 与 scene/type 是否配套（见 docs/APP_ENDPOINTS.md）',
      1000062:
        '版本门：上游按 query `device_platform` 拒答（库发的是 windows）。曲目地址走 h5 口不受影响，其余见文档「别耗时间」清单',
      101: '重复操作（例如重复举报）',
      3056: '该曲目评论区未开放',
    }
    return { message: `上游业务错误 status_code=${code}（${err.endpoint}）`, hint: hints[code] }
  }
  if (err instanceof MediaUnavailableError) {
    return {
      message: err.message,
      hint: '分享页只对 track / ugc_video 给地址；也可能是该曲目没有公开可播源',
    }
  }
  if (err instanceof TransportError) {
    return { message: `网络/传输失败：${err.message}`, hint: '用 --verbose 看请求日志' }
  }
  if (err instanceof CacheError) return { message: `缓存读写失败：${err.message}` }
  if (err instanceof CoreError) return { message: err.message }
  if (err instanceof Error) return { message: err.message }
  return { message: String(err) }
}
