/**
 * 设置与缓存维护：数据目录 / 缓存统计与清理 / 配置项 / 缓存分档。
 *
 * 原则与 CLI 的 `qishui cache` 一致：**默认只读**，清缓存一律过确认框；
 * 媒体（几 MB 一首的音频）要显式点「清空媒体缓存」才动 —— 别顺手把用户的歌删了。
 * 缓存分档表直接用 core 的 `CACHE_TIERS`/`KIND_SCOPE`，不另抄一份。
 */
import { Box } from 'ink'
import { CACHE_TIERS, CONFIG_DEFAULTS, formatBytes, KIND_SCOPE, parseFeedMode } from 'qishui-core'
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
  }
}

const REPEAT_ORDER = ['off', 'all', 'one'] as const

/** 配置项名字 → 给人看的中文 */
const CONFIG_LABELS: Record<string, string> = {
  timeoutMs: '请求超时（ms）',
  entityTtlMs: '默认实体 TTL（ms）',
  coverWidth: '封面宽度（px）',
  autoCacheMedia: '播放时自动落盘媒体',
  maxMediaBytes: '媒体缓存上限（字节）',
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
    if (key === 'defaultRepeat') {
      const index = REPEAT_ORDER.indexOf(current as (typeof REPEAT_ORDER)[number])
      void writeConfig(key, REPEAT_ORDER[(index + 1) % REPEAT_ORDER.length])
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
          confirm('清空媒体缓存？', '本地音频/封面/歌词会被删除（可再下载），歌单不受影响', async () => {
            await core?.clearCache({ all: true, media: true })
            setIssues(undefined)
            ui.toast('已清空媒体缓存', 'success')
          }),
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
      const editable = typeof sample === 'boolean' || key === 'defaultRepeat'
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
  if (key === 'defaultShuffle' || key === 'reportPlayback' || key === 'autoCacheMedia' || key === 'tuiMouse') {
    return value ? '开' : '关'
  }
  // 循环模式存的是 'off' / 'all' / 'one'，给人看中文词（推荐队列固定「关」，见 core 的 QueueBook）
  if (key === 'defaultRepeat') return value === 'all' ? '全部' : value === 'one' ? '单曲' : '关'
  // 听歌模式存的是 `preference:familiar` 这种文法串，给人看名字别看文法
  if (key === 'feedMode') return feedModeLabel(undefined, parseFeedMode(value as string | undefined))
  if (typeof value === 'number' && /Bytes$/.test(key)) return formatBytes(value)
  if (typeof value === 'number' && /Ms$/.test(key)) return `${value} ms`
  return JSON.stringify(value)
}
