import { type CorePaths, resolvePaths } from './paths.js'
import { readJsonSync, writeJsonAtomic } from './util.js'

export type RepeatMode = 'off' | 'all' | 'one'

/**
 * `~/.qishui/config.json` 的形状：全部可手改，core 只读它 + 内存覆盖，不写回
 * （除非显式调用 `core.saveConfig()`）。
 */
export interface CoreConfig {
  /** 数据目录（默认 ~/.qishui，环境变量 QISHUI_HOME 优先） */
  dataDir: string
  /** 单次请求超时 ms */
  timeoutMs: number
  /** 元数据缓存 TTL ms；0 = 不落盘不缓存 */
  entityTtlMs: number
  /** 封面 CDN 拼串宽度 */
  coverWidth: number
  /** 播放/解析时把音频、歌词、封面落到 cache/tracks（关掉就只解析远程签名地址） */
  autoCacheMedia: boolean
  /** 媒体缓存上限字节，超了按最久未访问剔除；0 = 不限制 */
  maxMediaBytes: number
  /**
   * 把自己播放过的曲目上报给上游（AppendRecentlyPlayedMedia）。
   * 默认关：写接口一律要显式开，且实测「写通道通、回读不落地」（见 qishui-api 文档）。
   * 本地播放历史（journal/plays.jsonl）不受这个开关影响，永远记。
   */
  reportPlayback: boolean
  /** 播放器默认循环模式 */
  defaultRepeat: RepeatMode
  /** 播放器默认随机 */
  defaultShuffle: boolean
  /**
   * 激活账号的 uid（多账号开关的真相源）：空 = 匿名。
   * `SessionManager.useAccount()`/登录会写回它；也可手改 config.json 换默认号。
   */
  activeUid?: string
}

export const CONFIG_DEFAULTS: Omit<CoreConfig, 'dataDir'> = {
  timeoutMs: 20_000,
  entityTtlMs: 30 * 60 * 1000,
  coverWidth: 400,
  autoCacheMedia: true,
  maxMediaBytes: 2 * 1024 * 1024 * 1024,
  reportPlayback: false,
  defaultRepeat: 'off',
  defaultShuffle: false,
}

export interface LoadConfigInput {
  dataDir?: string
  /** 代码里的覆盖值（优先级最高） */
  config?: Partial<CoreConfig>
}

export interface LoadedConfig {
  paths: CorePaths
  config: CoreConfig
  /** 磁盘上是否已有 config.json */
  persisted: boolean
}

export function loadConfig(input: LoadConfigInput = {}): LoadedConfig {
  const paths = resolvePaths(input.config?.dataDir ?? input.dataDir)
  const file = readJsonSync<Partial<CoreConfig>>(paths.configFile)
  const config: CoreConfig = {
    ...CONFIG_DEFAULTS,
    ...(file ?? {}),
    ...(input.config ?? {}),
    dataDir: paths.root,
  }
  return { paths, config, persisted: file != null }
}

/** 把当前配置（含默认值）写回 config.json —— 只有显式调用才写 */
export async function saveConfig(paths: CorePaths, config: CoreConfig): Promise<void> {
  await writeJsonAtomic(paths.configFile, config, 0o644)
}
