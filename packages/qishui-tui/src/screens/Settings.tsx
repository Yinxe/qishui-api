/**
 * 设置与缓存维护：数据目录 / 缓存统计与清理 / 配置项 / 缓存分档。
 *
 * 原则与 CLI 的 `qishui cache` 一致：**默认只读**，清缓存一律过确认框；
 * 媒体（几 MB 一首的音频）要显式点「清空媒体缓存」才动 —— 别顺手把用户的歌删了。
 * 缓存分档表直接用 core 的 `CACHE_TIERS`/`KIND_SCOPE`，不另抄一份。
 */
import { Box } from 'ink'
import {
  CACHE_TIERS,
  CONFIG_DEFAULTS,
  formatBytes,
  KIND_SCOPE,
  MEDIA_EVICT_POLICIES,
  mediaCapacityLabel,
  mediaEvictPolicyLabel,
  nextMediaCapacityTier,
  parseFeedMode,
} from 'qishui-core'
import { useState } from 'react'
import { useCore } from '../core/context.js'
import { useUi } from '../ui/context.js'
import { type Section, SectionView, useEntries } from '../ui/entries.js'
import { listHeight } from '../ui/layout.js'
import { useAsync } from '../ui/useAsync.js'
import { Loading, PageTitle } from '../ui/widgets.js'
import { feedModeLabel } from './Listen.js'

interface CacheOverview {
  entities: { entries: number; bytes: number; hits: number; misses: number }
  media: {
    tracks: number
    audioBytes: number
    coverBytes: number
    withLyrics: number
    oldestAccessedAt?: number
    totalPlays: number
    /** `cache/tracks` 的真实磁盘占用 */
    diskBytes: number
  }
  capacity: {
    usedBytes: number
    limitBytes: number
    percent?: number
    overLimit: boolean
    policy: 'lru' | 'leastPlayed'
    autoEvict: boolean
    reclaimableTracks: number
    reclaimableBytes: number
  }
}

const REPEAT_ORDER = ['off', 'all', 'one'] as const

/** 枚举型配置项的循环顺序（值直接取自 core，档位/策略都不在这抄一份） */
const ENUM_ORDERS: Record<string, readonly string[]> = {
  defaultRepeat: REPEAT_ORDER,
  mediaEvictPolicy: MEDIA_EVICT_POLICIES,
}

/** 配置项名字 → 给人看的中文 */
const CONFIG_LABELS: Record<string, string> = {
  timeoutMs: '请求超时（ms）',
  entityTtlMs: '默认实体 TTL（ms）',
  coverWidth: '封面宽度（px）',
  autoCacheMedia: '播放时自动落盘媒体',
  maxMediaBytes: '媒体缓存上限（Enter 换档位）',
  mediaEvictPolicy: '满溢淘汰策略（Enter 换）',
  mediaAutoEvict: '超上限自动淘汰（默认关）',
  reportPlayback: '播放行为上报',
  defaultRepeat: '默认循环模式',
  defaultShuffle: '默认随机',
  tuiMouse: 'TUI 鼠标（滚轮 + 点击，实时生效）',
  feedMode: '听歌模式（在「听歌」页改）',
}

const CONFIG_KEYS = Object.keys(CONFIG_DEFAULTS).filter((key) => key !== 'dataDir')

export function SettingsScreen({ active }: { active: boolean }) {
  const { core } = useCore()
  const ui = useUi()
  const [issues, setIssues] = useState<{ trackId: string; issue: string }[] | undefined>()
  const [configRevision, setConfigRevision] = useState(0)

  const stats = useAsync<CacheOverview>(
    core ? () => core.cacheStats() : undefined,
    `cache-stats:${core?.session.activeUid ?? 'anon'}:${configRevision}`,
  )

  const paths = core?.paths

  const writeConfig = async (key: string, value: unknown): Promise<void> => {
    if (!core) return
    ;(core.config as unknown as Record<string, unknown>)[key] = value
    try {
      await core.saveConfig()
      setConfigRevision((n) => n + 1)
      // MouseSetup 订阅 revision：改了 tuiMouse 当场开/关追踪，不用重启
      ui.bump()
      ui.toast(`已写入 ${key} = ${JSON.stringify(value)}`, 'success')
    } catch (err) {
      ui.toast(err instanceof Error ? err.message : String(err), 'error')
    }
  }

  const cycleConfig = (key: string): void => {
    if (!core) return
    const current = (core.config as unknown as Record<string, unknown>)[key]
    const sample = (CONFIG_DEFAULTS as unknown as Record<string, unknown>)[key]
    if (typeof sample === 'boolean') {
      void writeConfig(key, !current)
      return
    }
    // 容量按档位循环（2G→3G→4G→5G→10G→不限制→2G）；手改的非档位值先跳进最近的档位
    if (key === 'maxMediaBytes') {
      const next = nextMediaCapacityTier(typeof current === 'number' ? current : 0)
      void writeConfig(key, next)
      ui.toast(next === 0 ? '上限不限制' : `上限 ${mediaCapacityLabel(next)}（${formatBytes(next)}）`, 'success')
      return
    }
    const order = ENUM_ORDERS[key]
    if (order) {
      const at = order.indexOf(current as string)
      void writeConfig(key, order[(at + 1 + order.length) % order.length])
      return
    }
    ui.toast(`这个项在终端里只读，改：qishui config set ${key} <value>`, 'info')
  }

  const confirm = (message: string, hint: string, run: () => Promise<void> | void): void => {
    ui.openOverlay({
      kind: 'confirm',
      message,
      hint,
      onConfirm: () => {
        void (async () => {
          try {
            await run()
            stats.reload()
          } catch (err) {
            ui.toast(err instanceof Error ? err.message : String(err), 'error')
          }
        })()
      },
    })
  }

  const sections: Section[] = []
  sections.push({
    title: '存储位置',
    entries: [
      { key: 'root', label: '数据目录', note: paths?.root, disabled: true },
      { key: 'config', label: '配置', note: paths?.configFile, disabled: true },
      { key: 'accounts', label: '账号会话', note: paths?.accountsDir, disabled: true },
      { key: 'media', label: '媒体缓存', note: paths?.mediaDir, disabled: true },
      { key: 'history', label: '播放历史', note: core?.history.scopeFile, disabled: true },
    ],
  })

  const overview = stats.data
  sections.push({
    title: '缓存',
    entries: [
      {
        key: 'entities',
        label: '实体元数据',
        note: overview
          ? `${overview.entities.entries} 项 · ${formatBytes(overview.entities.bytes)} · 命中 ${overview.entities.hits} / 未中 ${overview.entities.misses}`
          : stats.status === 'loading'
            ? '读取中…'
            : stats.error,
        disabled: true,
      },
      {
        key: 'media',
        label: '媒体（音频/封面/歌词）',
        note: overview
          ? `${overview.media.tracks} 首 · ${formatBytes(overview.media.audioBytes)} 音频 + ${formatBytes(overview.media.coverBytes)} 封面 · ${overview.media.withLyrics} 首有歌词`
          : undefined,
        disabled: true,
      },
      {
        key: 'capacity',
        label: '容量',
        note: overview ? capacityText(overview) : undefined,
        disabled: true,
      },
      {
        key: 'evict-media',
        label: '按上限清理媒体',
        note: overview
          ? `剔到上限为止 · 可释放 ${formatBytes(overview.capacity.reclaimableBytes)}（${overview.capacity.reclaimableTracks} 首）`
          : undefined,
        onEnter: () =>
          confirm(
            '按上限清理媒体缓存？',
            `按「${overview ? mediaEvictPolicyLabel(overview.capacity.policy) : '最久未用'}」剔到上限为止，正在播的那首不动；音频删了可再下载`,
            async () => {
              const keep = core?.player.current?.id ? [core.player.current.id] : []
              const result = await core?.media.prune({ keep })
              const removed = result?.removed ?? 0
              ui.toast(
                removed
                  ? `已清理 ${removed} 首，释放 ${formatBytes(result?.freedBytes ?? 0)}`
                  : '没东西要清（已在上限内）',
                'success',
              )
            },
          ),
      },
      {
        key: 'refresh-stats',
        label: '刷新统计',
        note: 'R',
        onEnter: () => stats.reload(),
      },
      {
        key: 'prune-entities',
        label: '清理过期元数据',
        onEnter: () =>
          confirm('清理过期的实体元数据缓存？', '只清已过 TTL 的项，媒体不动', async () => {
            await core?.clearCache()
            ui.toast('已清理过期元数据', 'success')
          }),
      },
      {
        key: 'verify-media',
        label: '校验媒体文件',
        onEnter: () => {
          void (async () => {
            try {
              const found = (await core?.media.verify()) ?? []
              setIssues(found)
              ui.toast(
                found.length ? `发现 ${found.length} 个问题` : '媒体文件完好',
                found.length ? 'error' : 'success',
              )
            } catch (err) {
              ui.toast(err instanceof Error ? err.message : String(err), 'error')
            }
          })()
        },
      },
      {
        key: 'clear-entities',
        label: '清空元数据缓存',
        onEnter: () =>
          confirm('清空全部实体元数据缓存？', '下次访问会重新联网取，媒体不动', async () => {
            await core?.clearCache({ all: true })
            ui.toast('已清空元数据缓存', 'success')
          }),
      },
      {
        key: 'clear-media',
        label: '清空媒体缓存',
        note: '会删音频文件',
        onEnter: () =>
          confirm(
            '清空媒体缓存？',
            '本地音频/封面/歌词会被删除（可再下载），正在播的那首不动，歌单不受影响',
            async () => {
              await core?.clearCache({ all: true, media: true })
              setIssues(undefined)
              ui.toast('已清空媒体缓存', 'success')
            },
          ),
      },
    ],
  })

  if (issues && issues.length > 0) {
    sections.push({
      title: `校验问题（${issues.length}）`,
      entries: issues.slice(0, 20).map((issue, index) => ({
        key: `issue:${index}:${issue.trackId}`,
        label: issue.issue,
        note: issue.trackId,
        disabled: true,
      })),
    })
  }

  sections.push({
    title: '配置（Enter 切换布尔/枚举）',
    entries: CONFIG_KEYS.map((key) => {
      const value = core ? (core.config as unknown as Record<string, unknown>)[key] : undefined
      const sample = (CONFIG_DEFAULTS as unknown as Record<string, unknown>)[key]
      const editable = typeof sample === 'boolean' || key === 'maxMediaBytes' || ENUM_ORDERS[key] !== undefined
      return {
        key: `cfg:${key}`,
        label: `${CONFIG_LABELS[key] ?? key}`,
        note: `${formatConfigValue(key, value)}${editable ? '  Enter 改' : '  只读'}`,
        onEnter: () => cycleConfig(key),
      }
    }),
  })

  sections.push({
    title: '缓存分档（只读，唯一真相在 core/src/cache/policy.ts）',
    entries: [
      ...CACHE_TIERS.map((tier) => ({
        key: `tier:${tier.key}`,
        label: `${tier.key} · ${tier.label}`,
        note: tier.ttlMs === 0 ? '不落盘' : `${Math.round(tier.ttlMs / 60_000)} 分钟`,
        disabled: true,
      })),
      {
        key: 'scope-note',
        label: '账号隔离',
        note: `account/viewer 落 _acct/<uid>/（${Object.keys(KIND_SCOPE).length} 个 kind 已登记），public 跨号共享；媒体始终共享`,
        disabled: true,
      },
    ],
  })

  const height = listHeight(ui.rows, 5, 5)
  const { cursor, setCursor } = useEntries(sections, active, (input) => {
    if (input === 'R') {
      stats.reload()
      return true
    }
    return false
  })

  return (
    <Box flexDirection="column" flexGrow={1}>
      <PageTitle title="设置与缓存" subtitle="数据目录 / 缓存统计与清理 / 配置" />
      {stats.status === 'loading' ? <Loading label="读取缓存统计" /> : null}
      <SectionView sections={sections} cursor={cursor} height={height} onCursor={setCursor} />
    </Box>
  )
}

function formatConfigValue(key: string, value: unknown): string {
  if (value === undefined) return '—'
  if (typeof value === 'boolean') return value ? '开' : '关'
  // 循环模式存的是 'off' / 'all' / 'one'，给人看中文词（推荐队列固定「关」，见 core 的 QueueBook）
  if (key === 'defaultRepeat') return value === 'all' ? '全部' : value === 'one' ? '单曲' : '关'
  // 听歌模式存的是 `preference:familiar` 这种文法串，给人看名字别看文法
  if (key === 'feedMode') return feedModeLabel(undefined, parseFeedMode(value as string | undefined))
  if (key === 'maxMediaBytes' && typeof value === 'number') {
    const label = mediaCapacityLabel(value)
    return label === '自定义' ? `自定义 ${formatBytes(value)}` : label
  }
  if (key === 'mediaEvictPolicy') return mediaEvictPolicyLabel(value as 'lru' | 'leastPlayed')
  if (typeof value === 'number' && /Bytes$/.test(key)) return formatBytes(value)
  if (typeof value === 'number' && /Ms$/.test(key)) return `${value} ms`
  return JSON.stringify(value)
}

/** 缓存的「已用 / 上限」一句话：不限制就直说，超了把超出量也写出来 */
function capacityText(overview: CacheOverview): string {
  const { usedBytes, limitBytes, percent, overLimit } = overview.capacity
  const limit =
    limitBytes === 0
      ? '不限制'
      : `${mediaCapacityLabel(limitBytes) === '自定义' ? formatBytes(limitBytes) : mediaCapacityLabel(limitBytes)}（${percent ?? 0}%）`
  const base = `已用 ${formatBytes(usedBytes)} / ${limit}`
  return overLimit ? `${base} · 超 ${formatBytes(usedBytes - limitBytes)}` : base
}
