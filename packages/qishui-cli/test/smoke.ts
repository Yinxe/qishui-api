/**
 * qishui-cli 冒烟台：直接跑构建产物（`dist/cli.js`），一条命令一条断言。
 *
 * ```bash
 * pnpm run build          # 先构建（core 也要）
 * pnpm --filter qishui-cli run test
 * ```
 *
 * 覆盖三层：
 *  1. **离线**（帮助/参数校验/JSON 形状/配置读写）—— 不需要网络；
 *  2. **匿名接口**（搜索/首页/榜单/曲目/评论/分享链接/落盘/导出）—— 只打匿名可用的接口，防风控；
 *  3. **mpv 播放**（起真进程 → EOF → 自动切下一首 → 收尾）—— 造两个 3 秒 WAV 塞进媒体缓存，
 *     `--ao=null` 不出声，跑完核对 JSON 结果与"无残留 mpv 进程"。
 *
 * 测试数据目录：`$QISHUI_CLI_TEST_HOME`（默认 /tmp/opencode/qishui-cli-test-home），跑一次清一次，不碰 ~/.qishui。
 */
import { type SpawnSyncReturns, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const HOME = process.env.QISHUI_CLI_TEST_HOME ?? '/tmp/opencode/qishui-cli-test-home'
const CLI = path.join(import.meta.dirname, '..', 'dist', 'cli.js')

let failures = 0
let checks = 0

function ok(): void {
  checks++
}
function check(label: string, condition: boolean, detail = ''): void {
  ok()
  if (condition) {
    console.log(`  ✓ ${label}`)
  } else {
    failures++
    console.log(`  ✗ ${label}${detail ? `  ${detail}` : ''}`)
  }
}
function soft(label: string, condition: boolean, detail = ''): void {
  ok()
  if (condition) console.log(`  ✓ ${label}`)
  else console.log(`  ~ ${label}（环境相关，跳过）${detail ? `  ${detail}` : ''}`)
}
function section(title: string): void {
  console.log(`\n▍${title}`)
}

interface RunOptions {
  env?: Record<string, string>
  timeoutMs?: number
}

interface Result extends SpawnSyncReturns<string> {
  json: <T = any>() => T
}

function run(args: string[], opts: RunOptions = {}): Result {
  const result = spawnSync(process.execPath, [CLI, '--data-dir', HOME, ...args], {
    encoding: 'utf8',
    timeout: opts.timeoutMs ?? 90_000,
    env: { ...process.env, ...opts.env, NO_COLOR: '1' },
  }) as Result
  result.json = <T>() => JSON.parse(result.stdout) as T
  return result
}

/** 3 秒单声道 WAV（不依赖 ffmpeg），mpv 直接能播 */
function writeWav(file: string, seconds: number, freq: number): number {
  const rate = 8000
  const samples = Math.floor(rate * seconds)
  const data = Buffer.alloc(samples * 2)
  for (let i = 0; i < samples; i++) {
    data.writeInt16LE(Math.round(Math.sin((2 * Math.PI * freq * i) / rate) * 6000), i * 2)
  }
  const header = Buffer.alloc(44)
  header.write('RIFF', 0)
  header.writeUInt32LE(36 + data.length, 4)
  header.write('WAVE', 8)
  header.write('fmt ', 12)
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20)
  header.writeUInt16LE(1, 22)
  header.writeUInt32LE(rate, 24)
  header.writeUInt32LE(rate * 2, 28)
  header.writeUInt16LE(2, 32)
  header.writeUInt16LE(16, 34)
  header.write('data', 36)
  header.writeUInt32LE(data.length, 40)
  const audio = Buffer.concat([header, data])
  fs.writeFileSync(file, audio)
  return audio.length
}

/** 直接把媒体缓存"当成已经下好"：meta.json + 音频文件，peek 命中就零请求 */
function seedMedia(trackId: string, name: string, seconds: number): void {
  const dir = path.join(HOME, 'cache', 'tracks', trackId)
  fs.mkdirSync(dir, { recursive: true })
  const bytes = writeWav(path.join(dir, 'audio.wav'), seconds, 440 + (trackId.charCodeAt(0) % 100))
  const meta = {
    v: 1,
    trackId,
    track: { id: trackId, name, artists: [{ id: '0', name: '测试歌手' }], durationMs: seconds * 1000 },
    audio: { file: 'audio.wav', mime: 'audio_wav', bytes, fetchedAt: Date.now() },
    fetchedAt: Date.now(),
    accessedAt: Date.now(),
    plays: 0,
  }
  fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(meta, null, 2))
}

function which(bin: string): boolean {
  return spawnSync('sh', ['-c', `command -v ${bin}`], { stdio: 'ignore' }).status === 0
}

async function main(): Promise<void> {
  if (!fs.existsSync(CLI)) {
    console.error(`找不到 ${CLI}，先跑 \`pnpm run build\``)
    process.exit(1)
  }
  fs.rmSync(HOME, { recursive: true, force: true })
  fs.mkdirSync(HOME, { recursive: true })
  console.log(`qishui-cli 冒烟：${CLI}\n数据目录：${HOME}`)

  /* ---------------------------------------------------------- 1. 离线 */
  section('帮助与参数（离线）')
  const help = run(['--help'])
  check('--help 退出码 0', help.status === 0)
  check(
    '--help 列出 play/search/cache',
    ['play', 'search', 'cache'].every((cmd) => help.stdout.includes(cmd)),
  )
  const sub = run(['play', '--help'])
  check('子命令 --help 有选项说明', sub.stdout.includes('--print-path') && sub.stdout.includes('--repeat'))

  const unknown = run(['definitely-not-a-command'])
  check('未知子命令退出码非 0', unknown.status !== 0, `status=${unknown.status}`)
  const badOption = run(['home', '--nope'])
  check('未知选项退出码非 0', badOption.status !== 0, `status=${badOption.status}`)

  const noTarget = run(['play'])
  check('play 不给目标 → 报错且退出码非 0', noTarget.status !== 0 && noTarget.stderr.includes('要播什么'))

  const whereOut = run(['where', '--json'])
  check(
    'where --json 是合法 JSON',
    whereOut.status === 0 && whereOut.json().paths.root === HOME,
    whereOut.stderr.slice(0, 120),
  )
  check('where --json stdout 只有 JSON', whereOut.stdout.trim().startsWith('{') && whereOut.stdout.trim().endsWith('}'))

  const noColor = run(['home', '--help'])
  check('NO_COLOR 下无 ANSI 转义', !noColor.stdout.includes('\u001b['))

  section('配置（读写 config.json）')
  const configShow = run(['config', 'show', '--json'])
  check(
    'config show --json 含全部键',
    configShow.status === 0 && 'timeoutMs' in configShow.json() && 'autoCacheMedia' in configShow.json(),
  )
  const configSet = run(['config', 'set', 'coverWidth', '500'])
  check('config set 写入成功', configSet.status === 0)
  const configGet = run(['config', 'get', 'coverWidth', '--json'])
  check('config get 读回 500', configGet.json().value === 500, JSON.stringify(configGet.json()))
  check('config.json 已落盘', fs.readFileSync(path.join(HOME, 'config.json'), 'utf8').includes('500'))
  const configBadKey = run(['config', 'set', 'nope', '1'])
  check('config set 未知键报错', configBadKey.status !== 0)
  run(['config', 'set', 'coverWidth', '400'])

  /* ---------------------------------------------------------- 2. 匿名接口 */
  section('搜索 / 首页 / 榜单（匿名可用）')
  const searchJson = run(['search', '晴天', '--limit', '3', '--json'])
  const search = searchJson.status === 0 ? searchJson.json() : { groups: [] }
  const tracks = (search.groups ?? []).flatMap((group: any) => group.tracks ?? [])
  check('search --json 解析成功', searchJson.status === 0, searchJson.stderr.slice(0, 200))
  check('搜索回曲目且带 id/name', tracks.length > 0 && !!tracks[0].id && !!tracks[0].name)
  check('--json 里没有 raw 字段（默认剥掉）', !searchJson.stdout.includes('"raw"'))
  const searchRaw = run(['search', '晴天', '--limit', '1', '--json', '--raw'])
  check('--raw 时保留 raw 字段', searchRaw.stdout.includes('"raw"'))

  const searchHuman = run(['search', '晴天', '--limit', '3'])
  check(
    '人类可读输出是三线表（表头 + 顶/中/底三条横线 + 曲名）',
    searchHuman.stdout.includes('曲目') &&
      searchHuman.stdout.includes('晴天') &&
      (searchHuman.stdout.match(/─{10,}/g) ?? []).length >= 3,
  )
  soft('列表不再出现「试听」标记', !searchHuman.stdout.includes('试听'))
  check(
    '人类可读输出默认带曲目 id（能直接接着 play）',
    tracks[0]?.id ? searchHuman.stdout.includes(String(tracks[0].id)) : true,
  )
  const searchNoId = run(['search', '晴天', '--limit', '3', '--no-id'])
  check('--no-id 去掉 id（同一屏不再出现）', tracks[0]?.id ? !searchNoId.stdout.includes(String(tracks[0].id)) : true)
  const searchIdFalse = run(['search', '晴天', '--limit', '1', '--id', 'false'])
  check('--id false 等价 --no-id', searchIdFalse.status === 0 && !searchIdFalse.stdout.includes(String(tracks[0]?.id)))

  // 各类型搜索结果都要能解析实体（曾经只有 track 能出，artist/album/playlist 因为 entity.<kind> 壳没剥而全空）
  const searchArtist = run(['search', '周杰伦', '--type', 'artist', '--json'])
  const artists = searchArtist.status === 0 ? searchArtist.json().groups.flatMap((g: any) => g.artists ?? []) : []
  check('search --type artist 出歌手实体', artists.length > 0 && !!artists[0].id, searchArtist.stderr.slice(0, 160))
  const searchAlbum = run(['search', '周杰伦', '--type', 'album', '--json'])
  const albums = searchAlbum.status === 0 ? searchAlbum.json().groups.flatMap((g: any) => g.albums ?? []) : []
  check('search --type album 出专辑实体', albums.length > 0 && !!albums[0].id)
  const searchPlaylist = run(['search', '周杰伦', '--type', 'playlist', '--json'])
  const playlists =
    searchPlaylist.status === 0 ? searchPlaylist.json().groups.flatMap((g: any) => g.playlists ?? []) : []
  check('search --type playlist 出歌单实体', playlists.length > 0 && !!playlists[0].id)
  const searchAll = run(['search', '周杰伦', '--type', 'all', '--json'])
  const all = searchAll.status === 0 ? searchAll.json() : { groups: [] }
  const allKinds = (all.groups ?? []).reduce(
    (acc: any, g: any) => ({
      tracks: acc.tracks + (g.tracks?.length ?? 0),
      albums: acc.albums + (g.albums?.length ?? 0),
      artists: acc.artists + (g.artists?.length ?? 0),
      playlists: acc.playlists + (g.playlists?.length ?? 0),
    }),
    { tracks: 0, albums: 0, artists: 0, playlists: 0 },
  )
  check(
    'search --type all 四类实体都有（不只歌曲）',
    allKinds.tracks > 0 && allKinds.albums > 0 && allKinds.artists > 0 && allKinds.playlists > 0,
    JSON.stringify(allKinds),
  )
  const searchUser = run(['search', '周杰伦', '--type', 'user', '--json'])
  soft(
    'search --type user 上游不返回（空属正常）',
    searchUser.status === 0 && (searchUser.json().groups ?? []).length === 0,
  )

  section('发现（discover / modes / mix）')
  const modesJson = run(['modes', '--json'])
  const modes = modesJson.status === 0 ? modesJson.json() : { scenes: [] }
  check('modes --json 有偏好模式与场景', Array.isArray(modes.preferences) && modes.scenes.length > 0)
  check(
    '偏好模式含 default/familiar/fresh',
    ['default', 'familiar', 'fresh'].every((mode) => (modes.preferences ?? []).some((item: any) => item.mode === mode)),
    JSON.stringify((modes.preferences ?? []).map((item: any) => item.mode)),
  )
  const modesHuman = run(['modes'])
  check(
    'modes 可读输出列出场景与 radio_id',
    modesHuman.stdout.includes('radio_id') && modesHuman.stdout.includes('场景'),
  )

  const discoverHome = run(['discover', 'home', '--json'])
  check('discover 子命令等价平铺命令', discoverHome.status === 0 && Array.isArray(discoverHome.json().entries))
  const discoverHelp = run(['discover', '--help'])
  check(
    'discover --help 列出子命令',
    ['home', 'chart', 'radio', 'feed', 'square', 'modes', 'mix'].every((name) => discoverHelp.stdout.includes(name)),
  )
  const discoverBad = run(['discover', 'feed', '--mode', 'nonsense'])
  check('feed --mode 非法值报错', discoverBad.status !== 0 && discoverBad.stderr.includes('认不出模式'))

  const policy = run(['cache', 'policy', '--json'])
  check(
    'cache policy 列出缓存分档',
    policy.status === 0 && Array.isArray(policy.json().tiers) && policy.json().tiers.length >= 5,
    policy.stderr.slice(0, 160),
  )
  check(
    '分档表里 search 所属的 none 档 = 0（不缓存）',
    (policy.json().tiers ?? []).some((tier: any) => tier.key === 'none' && tier.ttlMs === 0),
  )
  check(
    'cache policy 带账号隔离表（kindScope 有 account 档）',
    (Object.values(policy.json().kindScope ?? {}) as string[]).includes('account'),
  )

  section('多账号命令（离线机制）')
  const accountsJson = run(['accounts', '--json'])
  check(
    'accounts --json：空目录回空数组不联网',
    accountsJson.status === 0 && Array.isArray(accountsJson.json().accounts),
  )
  const useUnknown = run(['use', '没这个号'])
  check('use 未知账号报错并指路 accounts', useUnknown.status !== 0 && useUnknown.stderr.includes('accounts'))
  const excludeBad = run(['feed', '--exclude', 'nonsense'])
  check('feed --exclude 非法值报错', excludeBad.status !== 0 && excludeBad.stderr.includes('认不出排除项'))

  const homeJson = run(['home', '--json'])
  check('home --json 有 blocks', homeJson.status === 0 && Array.isArray(homeJson.json().blocks))
  const homeHuman = run(['home'])
  check('home 可读输出含播放目标', homeHuman.stdout.includes('playlist:') || homeHuman.stdout.includes('chart:'))

  const chartJson = run(['chart', '--json'])
  check('chart --json 列出榜单', chartJson.status === 0 && Array.isArray(chartJson.json().charts))

  section('曲目 / 评论 / 分享链接')
  const trackId = tracks[0]?.id as string
  const trackJson = run(['track', trackId, '--lyrics', '--json'])
  const track = trackJson.status === 0 ? trackJson.json() : {}
  check('track --json 回曲目本体', track.track?.id === trackId, trackJson.stderr.slice(0, 200))
  soft('track --lyrics 回了歌词行', Array.isArray(track.lyrics) && track.lyrics.length > 0)
  const trackHuman = run(['track', trackId, '--lyrics'])
  check('track 可读输出含歌手/时长', trackHuman.stdout.includes('歌手') && trackHuman.stdout.includes('时长'))

  const comments = run(['comments', trackId, '--count', '3', '--json'])
  check(
    'comments --json 解析成功',
    comments.status === 0 && Array.isArray(comments.json().items),
    comments.stderr.slice(0, 160),
  )

  const link = run(['link', trackId, '--json'])
  check(
    'link --json 回元数据与可播地址',
    link.status === 0 && link.json().item?.id === trackId,
    link.stderr.slice(0, 160),
  )

  section('播放队列 / 落盘 / 导出（缓存链路）')
  const list = run(['play', trackId, '--list'])
  check('play --list 打印队列', list.status === 0 && list.stdout.includes('播放队列'))

  const printPath = run(['play', trackId, '--print-path', '--json'])
  const source = printPath.status === 0 ? printPath.json().tracks?.[0] : undefined
  check('play --print-path 解析出播放源', !!source && (source.kind === 'cache' || source.kind === 'remote'))
  check('落盘模式下 kind=cache 且文件存在', source?.kind !== 'cache' || (source.path && fs.existsSync(source.path)))

  const listAgain = run(['play', trackId, '--list'])
  check('二次 --list 标成已缓存（● 打头）', listAgain.stdout.includes('●'), listAgain.stdout.slice(0, 200))

  const outDir = path.join(HOME, 'exported')
  const download = run(['download', trackId, '--out', outDir])
  const exported = fs.existsSync(outDir) ? fs.readdirSync(outDir) : []
  check(
    'download --out 导出音频文件',
    download.status === 0 && exported.some((file) => file.endsWith('.m4a') || file.endsWith('.wav')),
    `${download.stdout.slice(0, 200)}`,
  )
  check(
    '导出文件名是「歌手 - 曲名」',
    exported.some((file) => file.includes(' - ')),
    exported.join(','),
  )

  const cacheStats = run(['cache', 'stats', '--json'])
  check(
    'cache stats --json 有 entities/media',
    cacheStats.status === 0 && !!cacheStats.json().entities && !!cacheStats.json().media,
  )
  const cacheList = run(['cache', 'list', '--json'])
  check('cache list 至少 1 首', cacheList.status === 0 && cacheList.json().length >= 1)

  /* ---------------------------------------------------------- 3. mpv 播放 */
  section('mpv 播放会话（真进程 + IPC）')
  if (!which('mpv')) {
    soft('跳过：本机没有 mpv', false)
  } else {
    const ids = tracks.slice(0, 2).map((item: any) => item.id as string)
    seedMedia(ids[0], '测试曲目 A', 3)
    if (ids[1]) seedMedia(ids[1], '测试曲目 B', 3)

    const args = ['play', ...ids.map((id: string) => `track:${id}`), '--limit', '1', '--json']
    const played = run(args, { env: { QISHUI_MPV_ARGS: '--ao=null' }, timeoutMs: 120_000 })
    const result =
      played.status === 0 ? (JSON.parse(played.stdout) as { played: number; total: number; reason: string }) : undefined
    check('播放会话退出码 0', played.status === 0, played.stderr.slice(0, 300))
    check('播放会话结果可 JSON 解析（stdout 无杂音）', !!result, played.stdout.slice(0, 200))
    check(`播完 ${ids.length} 首（played=${result?.played}）`, result?.played === ids.length)
    check('reason=finished（不是超时/异常退出）', result?.reason === 'finished')

    const probe = spawnSync('sh', ['-c', 'pgrep -c mpv || true'], { encoding: 'utf8' })
    check('播完没有残留 mpv 进程', (probe.stdout ?? '').trim() === '0', `残留=${probe.stdout?.trim()}`)

    const history = run(['history', '--json'])
    check('本地历史记下了这次播放', history.status === 0 && history.json().records.length >= ids.length)

    const stats = run(['stats', '--json'])
    check('stats 汇总了本地播放', stats.status === 0 && stats.json().plays.tracks >= ids.length)

    if (which('script')) {
      // 有 PTY 就跑一次交互：3 秒后按 q，验证快捷键与收尾
      const pty = spawnSync(
        'sh',
        [
          '-c',
          `(sleep 3; printf 'q') | script -qec "QISHUI_MPV_ARGS=--ao=null ${process.execPath} ${CLI} --data-dir ${HOME} play track:${ids[0]} --limit 1" /dev/null`,
        ],
        { encoding: 'utf8', timeout: 60_000, env: { ...process.env, NO_COLOR: '1' } },
      )
      check(
        'PTY 里按 q 能退出播放会话',
        pty.status === 0 && pty.stdout.includes('退出播放'),
        (pty.stdout ?? '').slice(-200),
      )
    } else {
      soft('跳过：本机没有 script(1)，没法造 PTY', false)
    }
  }

  /* ---------------------------------------------------------- 汇总 */
  console.log(`\n${failures === 0 ? '全部通过' : `${failures} 项失败`}（共 ${checks} 项断言）`)
  if (failures) {
    console.log(`数据目录：${HOME}（留着排查用）`)
    process.exit(1)
  }
  fs.rmSync(HOME, { recursive: true, force: true })
}

await main()
