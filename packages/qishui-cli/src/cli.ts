#!/usr/bin/env node
/**
 * qishui —— 汽水音乐命令行播放器（qishui-core 的应用层）。
 *
 * 分工：
 *   qishui-api   协议层（320 个端点的 IDL + 请求层）
 *   qishui-core  应用后端（账号/曲库/歌单/发现/搜索/评论 + 播放器状态机 + 本地缓存）
 *   qishui-cli   就是这里：把 core 的能力摆成命令，出声交给 mpv 子进程
 *
 * 全局口径：
 *   - **默认给人看**（颜色/表格/进度条），加 `--json` 出结构化数据（stdout 只有 JSON，能直接管进 jq）；
 *   - 写接口只有你明确敲了才发；删除类命令要 `--yes`；
 *   - 日志/警告一律走 stderr，不污染管道。
 */
import { Command } from 'commander'
import { registerAuthCommands } from './commands/auth.js'
import { registerBrowseCommands } from './commands/browse.js'
import { registerDetailCommands } from './commands/detail.js'
import { registerLibraryCommands } from './commands/library.js'
import { registerMaintCommands } from './commands/maint.js'
import { registerPlayCommands } from './commands/play.js'
import { registerSearchCommands } from './commands/search.js'
import { describeError, globals, resolveIdVisibility, setGlobals, shutdown } from './context.js'
import { dim, red } from './output.js'

const VERSION = '0.1.0'

function build(): Command {
  const program = new Command()
  program
    .name('qishui')
    .description(
      '汽水音乐命令行播放器：发现 / 搜索 / 歌单 / 评论 + mpv 出声 + 本地缓存（数据在 ~/.qishui）。' +
        '\n发现类命令有平铺版（home/chart/radio/feed/square…）和 `qishui discover <子命令>` 两套写法，等价。',
    )
    .version(VERSION, '-v, --version', '版本')
    .option('--data-dir <dir>', '数据目录（默认 ~/.qishui，环境变量 QISHUI_HOME 优先）')
    .option('--as <account>', '本条命令临时用哪个已登录账号（uid 或昵称），不改激活号')
    .option('--json', '输出结构化 JSON（stdout 只有 JSON；实体默认不带 raw）')
    .option('--raw', 'JSON 里保留上游原始响应（raw 字段，体积很大）')
    .option('--no-color', '禁用颜色（等价 NO_COLOR=1）')
    .option('--id <show>', '人读输出带 id（默认带；`--id false` 关掉）')
    .option('--no-id', '人读输出不带 id（等价 `--id false`）')
    .option('--verbose', '打印 core 的请求日志到 stderr')
    .showHelpAfterError()
    .configureHelp({ sortSubcommands: true })

  program.hook('preAction', (_thisCommand, actionCommand) => {
    const opts = actionCommand.optsWithGlobals() as {
      dataDir?: string
      as?: string
      json?: boolean
      raw?: boolean
      color?: boolean
      verbose?: boolean
      id?: unknown
    }
    setGlobals({
      dataDir: opts.dataDir,
      as: opts.as,
      json: opts.json === true,
      raw: opts.raw === true,
      verbose: opts.verbose === true,
      color: opts.color !== false,
      id: resolveIdVisibility(opts.id),
    })
  })

  registerAuthCommands(program)
  registerBrowseCommands(program)
  registerSearchCommands(program)
  registerDetailCommands(program)
  registerPlayCommands(program)
  registerLibraryCommands(program)
  registerMaintCommands(program)

  program.action(() => {
    program.help()
  })

  return program
}

async function main(argv: string[]): Promise<void> {
  const program = build()
  await program.parseAsync(argv)
  await shutdown()
}

main(process.argv).catch(async (err: unknown) => {
  const described = describeError(err)
  process.stderr.write(`${red('✗')} ${described.message}\n`)
  if (described.hint) process.stderr.write(`  ${dim(described.hint)}\n`)
  if (globals().verbose && err instanceof Error && err.stack) process.stderr.write(dim(err.stack) + '\n')
  await shutdown()
  process.exit(1)
})
