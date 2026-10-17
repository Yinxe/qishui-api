/**
 * 维护类命令：缓存（统计/分档/清点/校验/淘汰/清理）、配置（看/改/路径）、存储位置。
 *
 * 刻意设计成「默认只读」：`clear` 要 `--yes`，`prune` 不给上限就只清过期的元数据，
 * 媒体（几 MB 一个的音频）要显式 `--media` 才动 —— 别顺手把用户的歌删了。
 */
import type { Command } from 'commander'
import { CACHE_TIERS, CONFIG_DEFAULTS, formatBytes, KIND_SCOPE } from 'qishui-core'
import { CliError, core } from '../context.js'
import { ago } from '../format.js'
import {
  askYesNo,
  dim,
  displayWidth,
  emit,
  green,
  heading,
  print,
  printKeyValues,
  printTable,
  termWidth,
  truncate,
  withIdColumn,
} from '../output.js'

const CACHE_ACTIONS = ['stats', 'list', 'verify', 'prune', 'clear', 'path', 'policy'] as const
type CacheAction = (typeof CACHE_ACTIONS)[number]

/** TTL 的"给人看"形态：`6 小时` / `30 分钟` / `24 小时` */
function formatTtl(ms: number): string {
  if (ms % 3_600_000 === 0) return `${ms / 3_600_000} 小时`
  return `${Math.round(ms / 60_000)} 分钟`
}

/** `--max-size 512` / `--max-size 512MB` / `--max-size 2GB` 都收 */
function parseBytes(value: string): number {
  const match = /^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb|tb)?$/i.exec(value.trim())
  if (!match) throw new CliError(`认不出体积 ${value}`, '例：--max-size 512MB / --max-size 2GB')
  const scale: Record<string, number> = { b: 1, kb: 1024, mb: 1024 ** 2, gb: 1024 ** 3, tb: 1024 ** 4 }
  return Math.round(Number(match[1]) * scale[(match[2] ?? 'b').toLowerCase()])
}

export function registerMaintCommands(program: Command): void {
  program
    .command('cache <action>')
    .description(`缓存维护：${CACHE_ACTIONS.join('|')}`)
    .option('--fix', 'verify 时顺手把坏掉的元数据文件清掉')
    .option('--media', 'clear/prune 时把音频文件也算上（默认只动元数据）')
    .option('--max-size <size>', 'prune 的体积上限（如 2GB）')
    .option('--max-age <days>', 'prune 的年龄上限（天）')
    .option('--yes', 'clear 不询问')
    .action(
      async (
        action: string,
        opts: { fix?: boolean; media?: boolean; maxSize?: string; maxAge?: string; yes?: boolean },
      ) => {
        if (!CACHE_ACTIONS.includes(action as CacheAction)) {
          throw new CliError(`不认识的动作 ${action}`, `可用：${CACHE_ACTIONS.join(' / ')}`)
        }
        const instance = await core()
        const stats = await instance.cacheStats()

        if (action === 'stats') {
          emit(() => {
            heading('元数据缓存')
            printKeyValues([
              ['条目', stats.entities.entries],
              ['体积', formatBytes(stats.entities.bytes)],
              ['命中/未命中', `${stats.entities.hits} / ${stats.entities.misses}`],
            ])
            heading('媒体缓存')
            printKeyValues([
              ['曲目', `${stats.media.tracks} 首`],
              ['音频', formatBytes(stats.media.audioBytes)],
              ['封面', formatBytes(stats.media.coverBytes)],
              ['带歌词', `${stats.media.withLyrics} 首`],
              ['累计播放', `${stats.media.totalPlays} 次`],
              ['最久没动', ago(Math.floor((stats.media.oldestAccessedAt ?? 0) / 1000))],
            ])
          }, stats)
          return
        }

        if (action === 'list') {
          const items = await instance.media.list()
          emit(() => {
            heading('已缓存的曲目', `${items.length} 首`)
            const table = withIdColumn(
              ['曲目', '歌手', '体积', '播放', '最近'],
              items.map((item) => [
                item.track.name || item.trackId,
                (item.track.artists ?? [])
                  .map((artist) => artist.name)
                  .filter(Boolean)
                  .join(' / '),
                formatBytes(item.audio.bytes),
                String(item.plays),
                ago(Math.floor(item.accessedAt / 1000)) ?? '',
              ]),
              items.map((item) => item.trackId),
            )
            printTable(table.headers, table.rows, { right: [2, 3] })
          }, items)
          return
        }

        if (action === 'policy') {
          const noteWidth = Math.max(30, termWidth() - 34)
          const rows = CACHE_TIERS.map((tier) => [
            tier.key,
            tier.ttlMs === 0 ? '不缓存' : formatTtl(tier.ttlMs),
            truncate(tier.note, noteWidth),
          ])
          const kindWidth = Math.max(40, termWidth() - 14)
          const scopeRows: string[][] = []
          for (const scopeName of ['account', 'viewer', 'public'] as const) {
            const names = Object.entries(KIND_SCOPE)
              .filter(([, s]) => s === scopeName)
              .map(([kind]) => kind)
            let label: string = scopeName
            let line = ''
            for (const name of names) {
              const piece = line ? `, ${name}` : name
              if (displayWidth(line + piece) > kindWidth) {
                scopeRows.push([label, line])
                label = ''
                line = name
              } else line += piece
            }
            scopeRows.push([label, line])
          }
          emit(
            () => {
              heading('缓存分档', '哪些数据缓存、缓存多久')
              printTable(['档位', 'TTL', '装什么'], rows)
              print(dim('定义在 `packages/qishui-core/src/cache/policy.ts`；各服务只引用档位，不写死秒数'))
              print(dim('完整说明：packages/qishui-core/README.md「缓存策略」'))
              heading('账号隔离', '第二维度：这份数据属不属于某个账号')
              printTable(['scope', 'kind'], scopeRows)
              print(dim('account/viewer 落 cache/entities/_acct/<uid>/，未登录落共享位；public 跨账号共享'))
            },
            { tiers: CACHE_TIERS, kindScope: KIND_SCOPE },
          )
          return
        }

        if (action === 'verify') {
          const issues = await instance.media.verify({ fix: opts.fix === true })
          emit(
            () => {
              if (!issues.length) {
                print(`${green('✓')} 没发现问题（逐条核对 meta.json / 音频长度 / sha1）`)
                return
              }
              heading('发现的问题', `${issues.length} 条`)
              printTable(
                ['trackId', '问题'],
                issues.map((issue) => [issue.trackId, issue.issue]),
              )
              if (!opts.fix) print(dim('加 --fix 顺手清掉坏条目'))
            },
            { issues, fixed: opts.fix === true },
          )
          if (issues.length) process.exitCode = 1
          return
        }

        if (action === 'prune') {
          const maxBytes = opts.maxSize ? parseBytes(opts.maxSize) : undefined
          const maxAgeMs = opts.maxAge ? Number(opts.maxAge) * 86_400_000 : undefined
          const entities = await instance.cache.prune({ maxBytes, maxAgeMs })
          const media = opts.media ? await instance.media.prune({ maxBytes, maxAgeMs }) : undefined
          emit(
            () => {
              heading('已淘汰')
              printKeyValues([
                ['元数据', `${entities.removed} 条 / ${formatBytes(entities.freedBytes)}`],
                ['媒体', media ? `${media.removed} 首 / ${formatBytes(media.freedBytes)}` : dim('没动（加 --media）')],
                ['生效上限', maxBytes !== undefined ? formatBytes(maxBytes) : '后台默认（2GiB）'],
                ['年龄上限', maxAgeMs ? `${opts.maxAge} 天` : '不过滤'],
              ])
            },
            { entities, media },
          )
          return
        }

        if (action === 'clear') {
          if (!opts.yes) {
            const ok = await askYesNo(
              opts.media ? '清空元数据 + 媒体缓存（音频文件会被删掉）？' : '清空元数据缓存（不动音频文件）？',
              { default: false },
            )
            if (!ok) {
              print(dim('已取消'))
              return
            }
          }
          await instance.clearCache({ all: true, media: opts.media === true })
          const after = await instance.cacheStats()
          emit(
            () => {
              print(`${green('已清理')} ${opts.media ? '（含媒体）' : '（只清元数据）'}`)
              printKeyValues([
                ['剩余元数据', after.entities.entries],
                ['剩余媒体', `${after.media.tracks} 首 / ${formatBytes(after.media.audioBytes)}`],
              ])
            },
            { cleared: true, media: opts.media === true, after },
          )
          return
        }

        // action === 'path'
        emit(
          () => {
            heading('存储位置')
            printKeyValues([
              ['数据目录', instance.paths.root],
              ['配置', instance.paths.configFile],
              ['账号索引', instance.paths.accountsIndexFile],
              ['账号会话', instance.paths.accountsDir],
              ['设备身份', instance.paths.deviceFile],
              ['元数据', instance.paths.entityDir],
              ['媒体', instance.paths.mediaDir],
              ['播放历史', instance.history.scopeFile],
              ['日志目录', instance.paths.logsDir],
            ])
          },
          { paths: { ...instance.paths } },
        )
      },
    )

  program
    .command('config [action] [key] [value]')
    .description('配置：show（默认）| path | get <key> | set <key> <value>')
    .action(async (action: string | undefined, key: string | undefined, value: string | undefined) => {
      const instance = await core()
      const resolved = action ?? 'show'

      if (resolved === 'path') {
        emit(() => print(instance.paths.configFile), { path: instance.paths.configFile })
        return
      }

      if (resolved === 'get') {
        if (!key) throw new CliError('要哪个键？', `可用：${Object.keys(CONFIG_DEFAULTS).join(' / ')}（另加 dataDir）`)
        const current = (instance.config as unknown as Record<string, unknown>)[key]
        emit(() => print(JSON.stringify(current)), { key, value: current })
        return
      }

      if (resolved === 'set') {
        if (!key || value === undefined) throw new CliError('用法：qishui config set <key> <value>')
        const defaults = CONFIG_DEFAULTS as unknown as Record<string, unknown>
        if (!(key in defaults)) {
          throw new CliError(`没有这个配置项：${key}`, `可用：${Object.keys(defaults).join(' / ')}`)
        }
        const sample = defaults[key]
        let parsed: unknown = value
        if (typeof sample === 'number') {
          parsed = Number(value)
          if (!Number.isFinite(parsed as number)) throw new CliError(`${key} 要给数字`)
        } else if (typeof sample === 'boolean') {
          if (!['true', 'false', '1', '0', 'yes', 'no'].includes(value.toLowerCase())) {
            throw new CliError(`${key} 要给 true/false`)
          }
          parsed = ['true', '1', 'yes'].includes(value.toLowerCase())
        }
        ;(instance.config as unknown as Record<string, unknown>)[key] = parsed
        await instance.saveConfig()
        emit(() => print(`${green('已写入')} ${key} = ${JSON.stringify(parsed)}  ${dim(instance.paths.configFile)}`), {
          key,
          value: parsed,
          path: instance.paths.configFile,
        })
        return
      }

      if (resolved !== 'show') throw new CliError(`不认识的动作 ${resolved}`, '可用：show / path / get / set')

      const config = instance.config as unknown as Record<string, unknown>
      emit(() => {
        heading('配置', instance.paths.configFile)
        printTable(
          ['键', '值', '默认'],
          Object.entries(config).map(([name, current]) => [
            name,
            typeof current === 'string' ? current : JSON.stringify(current),
            (CONFIG_DEFAULTS as unknown as Record<string, unknown>)[name] !== undefined
              ? JSON.stringify((CONFIG_DEFAULTS as unknown as Record<string, unknown>)[name])
              : '—',
          ]),
        )
        print(dim('改：qishui config set <key> <value>（写进 config.json；QISHUI_HOME / --data-dir 优先于 dataDir）'))
      }, config)
    })

  program
    .command('where')
    .description('数据目录在哪（等价 `qishui cache path`）')
    .action(async () => {
      const instance = await core()
      emit(
        () => {
          printKeyValues([
            ['数据目录', instance.paths.root],
            ['配置', instance.paths.configFile],
            ['账号会话', instance.paths.accountsDir],
            ['媒体缓存', instance.paths.mediaDir],
            ['播放历史', instance.history.scopeFile],
          ])
        },
        { paths: { ...instance.paths } },
      )
    })

  program
    .command('report <trackId>')
    .description('举报曲目（写接口，需登录；理由 code 用 `qishui reasons` 查）')
    .requiredOption('--reason <code>', '理由 code（如 4001）')
    .action(async (trackId: string, opts: { reason: string }) => {
      const instance = await core()
      if (!instance.loggedIn) throw new CliError('举报需要登录', '先跑 `qishui login`')
      const result = await instance.feedback.report({ contentId: trackId, type: 'track', reasonCode: opts.reason })
      emit(() => print(`${green('已提交举报')} ${trackId}  ${dim(`reason=${opts.reason}`)}`), {
        trackId,
        reasonCode: opts.reason,
        result,
      })
    })

  program
    .command('reasons')
    .description('举报理由清单（report_type 是字符串枚举，实测是 "track"）')
    .option('--type <type>', 'track|comment|user…', 'track')
    .action(async (opts: { type: string }) => {
      const instance = await core()
      const reasons = await instance.feedback.reportReasons(opts.type)
      emit(
        () =>
          printTable(
            ['code', '理由'],
            reasons.map((reason) => [reason.code, reason.reason]),
          ),
        { type: opts.type, reasons },
      )
    })
}
