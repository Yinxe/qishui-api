/**
 * 维护类命令：缓存（统计/分档/清点/校验/淘汰/清理）、配置（看/改/路径）、存储位置。
 *
 * 刻意设计成「默认只读」：`clear` 要 `--yes`，`prune` 不给上限就只清过期的元数据，
 * 媒体（几 MB 一个的音频）要显式 `--media` 才动 —— 别顺手把用户的歌删了。
 */
import type { Command } from 'commander'
import {
  CACHE_TIERS,
  CONFIG_DEFAULTS,
  formatBytes,
  KIND_SCOPE,
  MEDIA_EVICT_POLICIES,
  type MediaEvictPolicy,
  mediaCapacityLabel,
  mediaEvictPolicyLabel,
} from 'qishui-core'
import { CliError, core, parseCount } from '../context.js'
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

/**
 * `512MB` / `2GB` / `2G` / `1536m` 都收，`0`（= 不设上限 / 全清）也收，**但光给数字不收**。
 * 以前 `maxMediaBytes 3` 会静默读成 3 字节：上限立刻小于整个缓存，
 * 一旦开了 `mediaAutoEvict`，下一首播完就把整仓音频剔光。体积单位必须写在脸上。
 */
function parseBytes(value: string): number {
  const text = value.trim()
  if (/^0(?:\.0+)?$/.test(text)) return 0
  const match = /^(\d+(?:\.\d+)?)\s*(kb|mb|gb|tb|k|m|g|t|b)$/i.exec(text)
  if (!match) {
    throw new CliError(
      `认不出体积 ${value}`,
      '体积要带单位：512MB / 2GB / 2G（`0` = 不限制）；光写一个数字不行——`3` 到底是 3B 还是 3G？',
    )
  }
  const scale: Record<string, number> = {
    b: 1,
    k: 1024,
    kb: 1024,
    m: 1024 ** 2,
    mb: 1024 ** 2,
    g: 1024 ** 3,
    gb: 1024 ** 3,
    t: 1024 ** 4,
    tb: 1024 ** 4,
  }
  return Math.round(Number(match[1]) * scale[match[2].toLowerCase()])
}

/** 容量配置额外认「不设限」：`0` / `unlimited` / `不限制` */
function parseCapacityBytes(value: string): number {
  const text = value.trim().toLowerCase()
  if (text === '0' || text === 'unlimited' || text === 'none' || value.trim() === '不限制') return 0
  return parseBytes(value)
}

/** 体积类配置项的回显：档位给名字，非档位（如 1536MB）连字节一起说 */
function formatCapacity(bytes: number): string {
  const label = mediaCapacityLabel(bytes)
  return label === '自定义' ? `自定义 ${formatBytes(bytes)}` : label
}

/** `--by` / `config set mediaEvictPolicy` 都先过这一关 */
function parseEvictPolicy(value: string): MediaEvictPolicy {
  const text = value.trim() as MediaEvictPolicy
  if (!MEDIA_EVICT_POLICIES.includes(text)) {
    throw new CliError(`不认识的淘汰策略 ${value}`, `可用：${MEDIA_EVICT_POLICIES.join(' / ')}`)
  }
  return text
}

export function registerMaintCommands(program: Command): void {
  program
    .command('cache <action>')
    .description(`缓存维护：${CACHE_ACTIONS.join('|')}`)
    .option('--fix', 'verify 时修复记录（文件在就一个字节不动；只有缺音频的目录才删）')
    .option('--deep', 'verify 时算 sha1（只算 v3 记录；能发现大小没变、内容被换过的文件）')
    .option('--media', 'clear/prune 时把音频文件也算上（默认只动元数据）')
    .option('--max-size <size>', 'prune 的体积上限（如 2GB；0 = 全清到只剩 keep）')
    .option('--max-age <days>', 'prune 的年龄上限（天）')
    .option('--by <policy>', `满溢时按哪个顺序剔（${MEDIA_EVICT_POLICIES.join('|')}），默认读 config`)
    .option('--yes', 'clear 不询问')
    .action(
      async (
        action: string,
        opts: {
          fix?: boolean
          deep?: boolean
          media?: boolean
          maxSize?: string
          maxAge?: string
          by?: string
          yes?: boolean
        },
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
              ['曲目', `${stats.media.tracks} 首${stats.media.clips ? `（试听 ${stats.media.clips}）` : ''}`],
              ['音频', formatBytes(stats.media.audioBytes)],
              ['封面', formatBytes(stats.media.coverBytes)],
              ['歌词', `${stats.media.withLyrics} 首 · ${formatBytes(stats.media.lyricsBytes)}`],
              ['记录', formatBytes(stats.media.metaBytes)],
              [
                '残留',
                `${formatBytes(stats.media.residueBytes)}` +
                  (stats.media.pendingParts || stats.media.orphanDirs
                    ? `（${stats.media.pendingParts} 个 .part · ${stats.media.orphanDirs} 个无记录目录）`
                    : ''),
              ],
              [
                '待重下',
                stats.media.incomplete ? `${stats.media.incomplete} 首（大小对不上，下次播放会重下）` : dim('没有'),
              ],
              ['累计播放', `${stats.media.totalPlays} 次`],
              ['最久没动', ago(Math.floor((stats.media.oldestAccessedAt ?? 0) / 1000))],
            ])
            print(dim('音频/封面/歌词/记录 + 残留 = 已用；都是磁盘真实字节，试听片段算在音频里'))
            heading('容量', '按 cache/tracks 的真实磁盘占用算（含歌词/封面与残留 .part）')
            const cap = stats.capacity
            const rows: [string, string][] = [
              ['已用', formatBytes(cap.usedBytes)],
              [
                '上限',
                cap.limitBytes > 0
                  ? `${formatCapacity(cap.limitBytes)}${cap.percent !== undefined ? ` · 已用 ${cap.percent}%` : ''}`
                  : '不限制',
              ],
              ['满溢策略', `${mediaEvictPolicyLabel(cap.policy)}（${cap.policy}）`],
              ['自动淘汰', cap.autoEvict ? '开' : '关（超了也只提醒，删文件要人显式触发）'],
            ]
            if (cap.overLimit) {
              rows.push(['超上限', formatBytes(cap.usedBytes - cap.limitBytes)])
              rows.push(['按此策略可释放', `${formatBytes(cap.reclaimableBytes)}（${cap.reclaimableTracks} 首）`])
            }
            printKeyValues(rows)
            if (cap.overLimit) {
              print(dim('清掉它们：qishui cache prune --media（保住正在播的那首；换顺序加 --by leastPlayed）'))
            }
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
          const report = await instance.media.verify({ fix: opts.fix === true, deep: opts.deep === true })
          const label = { error: '错误', warn: '提醒', info: '提示' } as const
          emit(() => {
            const meta =
              `检查 ${report.checked} 个目录 · 试听 ${report.clips} 首（本来就比整曲短，不算问题）` +
              `${report.staleMeta ? ` · 旧版记录 ${report.staleMeta} 首（下次播放会重取）` : ''}` +
              ` · ${report.deep ? '已算 sha1' : '未算 sha1（--deep 才查内容）'} · 用时 ${(report.elapsedMs / 1000).toFixed(1)}s`
            if (!report.issues.length) {
              print(`${green('✓')} ${opts.fix ? '修完没剩下问题' : '没发现问题'}`)
              print(dim(meta))
              if (report.repaired || report.removedDirs) {
                print(dim(`已修 ${report.repaired} 条记录，清掉 ${report.removedDirs} 个目录`))
              }
              return
            }
            const { errors, warnings, infos } = report.summary
            heading('发现的问题', `${report.issues.length} 条 · 错误 ${errors} / 提醒 ${warnings} / 提示 ${infos}`)
            printTable(
              ['级别', '曲目', '问题'],
              report.issues.map((issue) => [
                label[issue.severity],
                issue.name || issue.trackId,
                issue.issue + (issue.name ? dim(` · ${issue.trackId}`) : ''),
              ]),
            )
            print(dim(meta))
            if (report.repaired || report.removedDirs) {
              print(dim(`已修 ${report.repaired} 条记录，清掉 ${report.removedDirs} 个目录`))
            }
            if (!opts.fix) {
              print(dim('加 --fix 修复记录（文件在就一个字节不动；只有缺音频的目录才删）'))
            }
          }, report)
          if (report.summary.errors) process.exitCode = 1
          return
        }

        if (action === 'prune') {
          const maxBytes = opts.maxSize ? parseBytes(opts.maxSize) : undefined
          // 天数也要显式收：`Number('abc') * 86400000` 是 NaN，比大小的表达式恒 false，
          // 「按天数清理」会一声不响地什么都不删。
          const maxAgeDays = parseCount(opts.maxAge, '--max-age', { min: 1, max: 3650 })
          const maxAgeMs = maxAgeDays === undefined ? undefined : maxAgeDays * 86_400_000
          const policy = opts.by ? parseEvictPolicy(opts.by) : instance.config.mediaEvictPolicy
          const entities = await instance.cache.prune({ maxBytes, maxAgeMs })
          // 正在播的那首不参与剔除（同进程里播的，或别的会话留着的那首）
          const keep = instance.player.current?.id ? [instance.player.current.id] : []
          const media = opts.media ? await instance.media.prune({ maxBytes, maxAgeMs, policy, keep }) : undefined
          emit(
            () => {
              heading('已淘汰')
              const limitBytes = maxBytes ?? instance.config.maxMediaBytes
              printKeyValues([
                ['元数据', `${entities.removed} 条 / ${formatBytes(entities.freedBytes)}`],
                ['媒体', media ? `${media.removed} 首 / ${formatBytes(media.freedBytes)}` : dim('没动（加 --media）')],
                ['生效上限', limitBytes > 0 ? formatCapacity(limitBytes) : '不限制'],
                ['年龄上限', maxAgeMs ? `${opts.maxAge} 天` : '不过滤'],
                ['淘汰顺序', media ? mediaEvictPolicyLabel(media.policy) : dim('这次没动媒体')],
              ])
              if (!opts.media && stats.capacity.overLimit) {
                print(
                  dim(
                    `媒体缓存已超上限（${formatBytes(stats.capacity.usedBytes)} / ${formatCapacity(
                      stats.capacity.limitBytes,
                    )}，可释放 ${formatBytes(stats.capacity.reclaimableBytes)}）——加 --media 才动音频文件`,
                  ),
                )
              }
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
              emit(() => print(dim('已取消')), { cancelled: true })
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
          // 体积类收 `2G` / `2GB` / `1536MB`，`maxMediaBytes` 再认 `0`/`不限制`；其余数字键按数字读
          parsed = /Bytes$/.test(key) ? parseCapacityBytes(value) : Number(value)
          if (!Number.isFinite(parsed as number)) throw new CliError(`${key} 要给数字`, '例：20000 / 2GB')
        } else if (key === 'mediaEvictPolicy') {
          parsed = parseEvictPolicy(value)
        } else if (typeof sample === 'boolean') {
          if (!['true', 'false', '1', '0', 'yes', 'no'].includes(value.toLowerCase())) {
            throw new CliError(`${key} 要给 true/false`)
          }
          parsed = ['true', '1', 'yes'].includes(value.toLowerCase())
        }
        ;(instance.config as unknown as Record<string, unknown>)[key] = parsed
        await instance.saveConfig()
        const shown =
          key === 'maxMediaBytes'
            ? `${formatCapacity(parsed as number)}（${parsed}）`
            : key === 'mediaEvictPolicy'
              ? `${mediaEvictPolicyLabel(parsed as MediaEvictPolicy)}（${parsed}）`
              : JSON.stringify(parsed)
        emit(() => print(`${green('已写入')} ${key} = ${shown}  ${dim(instance.paths.configFile)}`), {
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
