/**
 * CLI 离线命令面：帮助/参数校验/JSON 形状/配置读写/缓存分档表/多账号命令。
 * 数据目录预置 device.json，全程零网络（上游契约由 qishui-api 实测台负责）。
 */
import fs from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { makeCliHome, rmDir, runCli } from './support/cli.js'

let home: string

beforeAll(() => {
  home = makeCliHome()
})

afterAll(() => rmDir(home))

describe('帮助与参数校验', () => {
  it('--help 退出码 0 且列出主要子命令', () => {
    const help = runCli(home, ['--help'])
    expect(help.status).toBe(0)
    for (const cmd of ['play', 'search', 'cache']) expect(help.stdout).toContain(cmd)
  })

  it('子命令 --help 有选项说明', () => {
    const sub = runCli(home, ['play', '--help'])
    expect(sub.stdout).toContain('--print-path')
    expect(sub.stdout).toContain('--repeat')
  })

  it('未知子命令/未知选项都非 0 退出', () => {
    expect(runCli(home, ['definitely-not-a-command']).status).not.toBe(0)
    expect(runCli(home, ['home', '--nope']).status).not.toBe(0)
  })

  it('play 不给目标 → 报错「要播什么」', () => {
    const noTarget = runCli(home, ['play'])
    expect(noTarget.status).not.toBe(0)
    expect(noTarget.stderr).toContain('要播什么')
  })

  it('NO_COLOR 下输出无 ANSI 转义', () => {
    // 用字符串而不是正则：正则里出现 ESC 控制符本身会被 lint 拦
    expect(runCli(home, ['home', '--help']).stdout).not.toContain('\u001b[')
  })
})

describe('where / JSON 出路', () => {
  it('where --json 是纯 JSON 且指向本数据目录', () => {
    const out = runCli(home, ['where', '--json'])
    expect(out.status).toBe(0)
    expect(out.json().paths.root).toBe(home)
    expect(out.stdout.trim().startsWith('{')).toBe(true)
    expect(out.stdout.trim().endsWith('}')).toBe(true)
  })
})

describe('配置读写（config.json）', () => {
  it('config show --json 含全部键', () => {
    const show = runCli(home, ['config', 'show', '--json'])
    expect(show.status).toBe(0)
    expect('timeoutMs' in show.json()).toBe(true)
    expect('autoCacheMedia' in show.json()).toBe(true)
  })

  it('config set/get 往返，落盘可见；未知键报错', () => {
    expect(runCli(home, ['config', 'set', 'coverWidth', '500']).status).toBe(0)
    expect(runCli(home, ['config', 'get', 'coverWidth', '--json']).json().value).toBe(500)
    expect(fs.readFileSync(path.join(home, 'config.json'), 'utf8')).toContain('500')
    expect(runCli(home, ['config', 'set', 'nope', '1']).status).not.toBe(0)
    runCli(home, ['config', 'set', 'coverWidth', '400'])
  })
})

describe('缓存分档表（cache policy）', () => {
  it('TTL 档齐全、none 档为 0，且带账号隔离表', () => {
    const policy = runCli(home, ['cache', 'policy', '--json'])
    expect(policy.status).toBe(0)
    const tiers = policy.json().tiers ?? []
    expect(tiers.length).toBeGreaterThanOrEqual(5)
    expect(tiers.some((tier: any) => tier.key === 'none' && tier.ttlMs === 0)).toBe(true)
    const scopes = Object.values(policy.json().kindScope ?? {}) as string[]
    expect(scopes).toContain('account')
    expect(scopes).toContain('viewer')
    expect(scopes).toContain('public')
  })
})

describe('多账号命令（离线机制）', () => {
  it('accounts --json：空目录回空数组', () => {
    const accounts = runCli(home, ['accounts', '--json'])
    expect(accounts.status).toBe(0)
    expect(accounts.json().accounts).toEqual([])
  })

  it('use 未知账号报错并指路 accounts', () => {
    const bad = runCli(home, ['use', '没这个号'])
    expect(bad.status).not.toBe(0)
    expect(bad.stderr).toContain('accounts')
  })

  it('--as 未知账号报错且不回落（临时指定不写 config）', () => {
    const bad = runCli(home, ['--as', '没这个号', 'accounts', '--json'])
    expect(bad.status).not.toBe(0)
    expect(bad.stderr).toContain('没有账号')
  })
})

describe('子命令参数校验', () => {
  it('feed --exclude 非法值报错', () => {
    const bad = runCli(home, ['feed', '--exclude', 'nonsense'])
    expect(bad.status).not.toBe(0)
    expect(bad.stderr).toContain('认不出排除项')
  })

  it('discover feed --mode 非法值报错；discover --help 列出子命令', () => {
    const bad = runCli(home, ['discover', 'feed', '--mode', 'nonsense'])
    expect(bad.status).not.toBe(0)
    expect(bad.stderr).toContain('认不出模式')
    const help = runCli(home, ['discover', '--help'])
    for (const name of ['home', 'chart', 'radio', 'feed', 'square', 'modes', 'mix']) {
      expect(help.stdout).toContain(name)
    }
  })
})
