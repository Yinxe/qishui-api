import { type CorePaths, resolvePaths } from './paths.js'
import { readJsonSync, writeJsonAtomic } from './util.js'

export type RepeatMode = 'off' | 'all' | 'one'

/**
 * 媒体缓存超过上限时的淘汰顺序：
 *  - `lru`：最久没碰的先走（`accessedAt`）；
 *  - `leastPlayed`：播过次数最少的先走（`plays`，同次数再比时间）——给「下了一堆没听过」的场面腾地方。
 */
export type MediaEvictPolicy = 'lru' | 'leastPlayed'

export const MEDIA_EVICT_POLICIES: readonly MediaEvictPolicy[] = ['lru', 'leastPlayed']

const GIB = 1024 ** 3

/**
 * `maxMediaBytes` 的档位（升序；最后一档 `0` = 不限制）。
 * TUI 的档位循环、CLI 的回显都从这一张表取，**别在页面里另抄一份数字**。
 * 手改的非档位值（如 1536MB）照样生效，只是显示成「自定义」。
 */
export const MEDIA_CAPACITY_TIERS: readonly number[] = [2 * GIB, 3 * GIB, 4 * GIB, 5 * GIB, 10 * GIB, 0]

/** 给人看的档位名：整 GiB 才是档位（`2G`…`10G`），`0` 是「不限制」，其余「自定义」 */
export function mediaCapacityLabel(bytes: number): string {
  if (bytes === 0) return '不限制'
  if (!Number.isFinite(bytes) || bytes < 0 || bytes % GIB !== 0) return '自定义'
  return `${bytes / GIB}G`
}

/**
 * 档位循环：当前值 → 下一档（`10G → 不限制 → 2G`）。
 * 非档位的当前值先跳到「比它大的最小档」，比最大档还大就直接给「不限制」。
 */
export function nextMediaCapacityTier(bytes: number): number {
  if (!Number.isFinite(bytes) || bytes <= 0) return MEDIA_CAPACITY_TIERS[0]
  return MEDIA_CAPACITY_TIERS.find((tier) => tier > bytes) ?? 0
}

/** 淘汰策略的中文词（TUI 词表口径：ASCII + 汉字，不掺符号） */
export function mediaEvictPolicyLabel(policy: MediaEvictPolicy): string {
  return policy === 'leastPlayed' ? '最少播放' : '最久未用'
}

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
  /**
   * 媒体缓存上限字节（`0` = 不限制）；档位见 `MEDIA_CAPACITY_TIERS`。
   * 超没超都由 `cache/tracks` 的**真实磁盘占用**判断，剔谁由 `mediaEvictPolicy` 决定。
   */
  maxMediaBytes: number
  /** 满溢时按哪个顺序剔：`lru` = 最久没碰的先走；`leastPlayed` = 播过次数最少的先走 */
  mediaEvictPolicy: MediaEvictPolicy
  /**
   * 音频落盘后要不要**自动**剔到上限。默认关：删文件这种事得人显式触发（`qishui cache prune --media`
   * 或 TUI 的「按上限清理媒体」）；关掉时上限只用于「算出超了多少、能释放多少」，不动手。
   */
  mediaAutoEvict: boolean
  /**
   * 把自己播放过的曲目上报给上游（`AppendRecentPlayedTracks`，实测写完回读得到）。
   * 默认关：这是写接口，一律要显式开；而且它会把这台机器的收听混进账号的云端历史。
   * 本地播放历史（journal/plays.jsonl）不受这个开关影响，永远记。
   */
  reportPlayback: boolean
  /** 播放器默认循环模式 */
  defaultRepeat: RepeatMode
  /** 播放器默认随机 */
  defaultShuffle: boolean
  /**
   * TUI 是否接管鼠标（`?1000`+`?1006` 上报）。关掉后终端原生拖选复制恢复；
   * 环境变量 `QISHUI_TUI_MOUSE=0` 是更硬的关（连追踪都不开）。
   */
  tuiMouse: boolean
  /**
   * 本机记住的**听歌模式**，一个值。文法：`preference:<mode>`（`default`/`familiar`/`fresh`）
   * 或 `scene:<scene_mode_id>`（`feedModes()` 场景的短数字 id，如 `30`=日语）。
   * 空串 = 没选过。**`scene:` 后面只认纯数字**：首页 `discover_radio` 的雪花 id 是电台队列、
   * 不是场景（写进 `scene:` 会被当成「没选过」，免得把电台当场景播）。
   * **只是本地记住的偏好**：上游没有「保存听歌模式」的写接口，`FeedMode` 的 `feed_mode_bar`
   * 也只回它自己当前的那一条，所以这个值不声称是上游状态。
   */
  feedMode: string
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
  maxMediaBytes: 2 * GIB,
  mediaEvictPolicy: 'lru',
  mediaAutoEvict: false,
  reportPlayback: false,
  defaultRepeat: 'off',
  defaultShuffle: false,
  tuiMouse: true,
  feedMode: '',
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
  const config: CoreConfig = normalizeConfig({
    ...CONFIG_DEFAULTS,
    ...(file ?? {}),
    ...(input.config ?? {}),
    dataDir: paths.root,
  })
  return { paths, config, persisted: file != null }
}

/**
 * 只收口「写错了会静默改变删除范围」的这三项，其余键照旧原样 spread（这个项目不做 schema 框架）。
 * 容量最关键：`prune` 用 `maxBytes > 0` 判「有没有上限」，负数或 `NaN` 会被当成**不限制**——
 * 手改 config.json 的人以为设了限制，实际一个文件都不会剔。
 */
function normalizeConfig(config: CoreConfig): CoreConfig {
  const bytes = config.maxMediaBytes
  const maxMediaBytes = Number.isFinite(bytes) && bytes >= 0 ? Math.floor(bytes) : CONFIG_DEFAULTS.maxMediaBytes
  const mediaEvictPolicy = MEDIA_EVICT_POLICIES.includes(config.mediaEvictPolicy)
    ? config.mediaEvictPolicy
    : CONFIG_DEFAULTS.mediaEvictPolicy
  const mediaAutoEvict = typeof config.mediaAutoEvict === 'boolean' ? config.mediaAutoEvict : false
  return { ...config, maxMediaBytes, mediaEvictPolicy, mediaAutoEvict }
}

/** 把当前配置（含默认值）写回 config.json —— 只有显式调用才写 */
export async function saveConfig(paths: CorePaths, config: CoreConfig): Promise<void> {
  await writeJsonAtomic(paths.configFile, config, 0o644)
}
