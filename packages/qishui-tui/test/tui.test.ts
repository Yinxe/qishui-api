import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect, it } from 'vitest'
import { displayWidth } from '../dist/ui/format.js'

const CLI = fileURLToPath(new URL('../dist/cli.js', import.meta.url))
const NODE = process.execPath
const ESC = String.fromCharCode(27)

const which = (bin: string) => spawnSync('sh', ['-c', `command -v ${bin}`], { encoding: 'utf8' }).status === 0

const run = (sh: string, timeout = 30_000) => spawnSync('sh', ['-c', sh], { encoding: 'utf8', timeout })

const stripAnsi = (s: string) => s.replace(/\p{Control}\[[0-9;?]*[a-zA-Z]/gu, '')

/** ink 全屏重绘以 ESC[2J 起头，取最后一段就是最后一帧 */
const lastFrame = (raw: string): string[] =>
  stripAnsi(raw.split(`${ESC}[2J`).pop() ?? '')
    .split('\n')
    .map((l) => l.replace('\r', '').trimEnd())

/**
 * 骨架模式：`QISHUI_TUI_STUB=1` 时 TUI 不创建 core（也就不会连网注册设备身份 / 读账号），
 * 只画外壳——单测因此完全不碰上游。
 */
const ptyRun = (keys: string, env = '', size = 'stty rows 24 cols 100') =>
  run(`(sleep 1.2; ${keys}; sleep 0.8) | QISHUI_TUI_STUB=1 ${env} script -qec "${size}; ${NODE} ${CLI}" /dev/null`)

/** 点击 = 按下 + 抬起落在同一格（xterm-mouse 默认 `clickDistanceThreshold: 1`，差两格就发不出 click） */
const click = (y: number, x: number) => `printf '\\033[<0;${x};${y}M\\033[<0;${x};${y}m'`
/** 触摸板/真实终端常见形态：抬起坐标比按下漂了几格——click 事件根本不会发，所以应用按 press 生效 */
const driftClick = (y: number, x: number) => `printf '\\033[<0;${x};${y}M\\033[<0;${x + 3};${y + 1}m'`
/** 一次滚轮 = 一条报文；同一个 write 里的重复报文会被上游按「同一条」去重，所以每格单独 printf */
const wheel = (y: number, x: number, times = 1, up = false) =>
  Array.from({ length: times }, () => `printf '\\033[<${up ? 64 : 65};${x};${y}M'; sleep 0.3`).join('; ')
/** 帧里某段文字所在行的 SGR y（帧第 1 行 = SGR y 1） */
const rowOf = (frame: string[], needle: string): number => {
  const index = frame.findIndex((line) => line.includes(needle))
  expect(index, `帧里找不到「${needle}」`).toBeGreaterThanOrEqual(0)
  return index + 1
}
/** 某行里某段文字的起始 SGR x（CJK 按 2 列折算，跟终端画的一致），再往右挪一格落在字中间 */
const colOf = (frame: string[], lineNeedle: string, needle: string): number => {
  const line = frame[rowOf(frame, lineNeedle) - 1]
  return displayWidth(line.slice(0, line.indexOf(needle))) + 2
}

it('非 TTY（stdin 关闭 + 管道）不打 raw mode、不切备用屏，打印一句后退出 0', () => {
  const piped = run(`${NODE} ${CLI} < /dev/null`)
  expect(piped.stderr).not.toContain('Raw mode')
  expect(piped.stdout).not.toContain('[?1049') // 非 TTY 不切备用屏
  expect(piped.status).toBe(0)
  expect(stripAnsi(piped.stdout)).toContain('非交互终端')
  expect(stripAnsi(piped.stdout)).toContain('pnpm run tui')
})

it('TTY 里画出侧边栏 + 播放条 + 提示行，按 q 退出', { skip: !which('script') }, () => {
  expect(existsSync(CLI), `先 pnpm run tui:build，缺 ${CLI}`).toBe(true)

  const pty = ptyRun("printf 'q'")
  expect(pty.status).toBe(0)
  expect(pty.stdout).toContain(`${ESC}[?1049h`) // 进备用屏
  expect(pty.stdout).toContain(`${ESC}[?1049l`) // 退出还原

  const frame = stripAnsi(pty.stdout)
  for (const label of ['搜索', '发现', '听歌', '我的', '设置']) expect(frame).toContain(label)
  // 榜单不再是侧边栏一级项（首页榜单块在「发现」里已经摊平）
  expect(frame).not.toContain('榜单')
  expect(frame).toContain('没有在播的曲目')
  expect(frame).toContain('骨架模式')
  expect(frame).toContain('q 退出') // 侧边栏焦点下的提示行
})

it('数字键直接切一级页，面包屑跟着走；Esc 把焦点交回侧边栏', { skip: !which('script') }, () => {
  // 3 = 听歌（切页），Tab 到内容，Esc 回侧边栏（提示行变回侧边栏那套），q 退出
  const pty = ptyRun("printf '3'; sleep 0.4; printf '\\t'; sleep 0.4; printf '\\033'; sleep 0.4; printf 'q'")
  expect(pty.status).toBe(0)
  const frame = lastFrame(pty.stdout).join('\n')
  expect(frame).toContain('听歌') // 面包屑 + 侧边栏
  expect(frame).toContain('Tab 到内容') // 焦点已回到侧边栏
})

it('搜索页：数字 1 进入后可直接打字，Esc 收起输入再按 q 退出', { skip: !which('script') }, () => {
  const pty = ptyRun(`printf '1'; sleep 0.4; printf 'abc'; sleep 0.5; printf '\\033'; sleep 0.4; printf 'q'`)
  expect(pty.status).toBe(0)
  const frame = lastFrame(pty.stdout).join('\n')
  expect(frame).toContain('关键词 abc') // 三个字符一个不少（一次 read 可能带回多个）
  expect(frame).toContain('[综合]')
})

it('S 打开设置与缓存页（骨架模式下渲染分区与缓存分档）', { skip: !which('script') }, () => {
  // G 跳到底：设置页分区很长，最后一段「配置 / 缓存分档」要滚下去才看得见
  const pty = ptyRun("printf 'S'; sleep 0.5; printf 'G'; sleep 0.5; printf 'q'")
  expect(pty.status).toBe(0)
  const frame = lastFrame(pty.stdout).join('\n')
  expect(frame).toContain('设置与缓存')
  expect(frame).toContain('配置')
  expect(frame).toContain('缓存分档')
  expect(frame).toContain('账号隔离')
})

it('帮助弹层：行操作收进菜单后仍能查到「不感兴趣 / 举报 / 删歌单」', { skip: !which('script') }, () => {
  // 帮助正文按 ↑↓ / gG 滚动，一次只画得下一屏：用高一点的终端（40 行）把「导航/播放/列表/歌单」四段一次看全，
  // 免得断言依赖「滚到第几行」。q 在帮助里是「关弹层」，要再按一次才退出。
  const pty = ptyRun("printf '?'; sleep 0.6; printf 'q'; sleep 0.4; printf 'q'", '', 'stty rows 40 cols 100')
  expect(pty.status).toBe(0)
  // 弹层是逐行局部重绘（ink 只在必要时才整屏 ESC[2J），按「最后一帧」取会什么都取不到 —— 这里查整段输出
  const out = stripAnsi(pty.stdout)
  for (const need of ['帮助', '设置与缓存', 'Enter 打开这一行的操作菜单', '不感兴趣', '举报', '删歌单'])
    expect(out, `帮助里查不到「${need}」`).toContain(need)
})

it('弹层不重刷背景页：开合帮助后，「我的」页游标停在原处（底层页面没被卸载）', { skip: !which('script') }, () => {
  // 回归：曾经 Content() 在有弹层时只画弹层、把 <Screen> 卸载 → 关弹层后页面重新挂载，
  // useCursor 游标归 0（现象=整页重刷、选中行跳回第一个）。现在底层常驻、只是隐藏。
  // '4' 进「我的」（go 会把焦点设到 content）→ 'jj' 把游标挪到「最近播放」（第一项是账号行）
  // → '?' 开帮助 → Esc 关 → 断言游标仍在原位。
  // 'jj' 故意**一次 write** 灌进去：一次 read 带回多个字符时 ink 给的 input 是整串 `jj`，
  // 拆键那层（`ui/keys.ts`）就是为这个存在的——不拆的话「快按两下、游标不动」。
  const pty = ptyRun(
    "printf '4'; sleep 0.5; printf 'jj'; sleep 0.5; printf '?'; sleep 0.5; printf '\\033'; sleep 0.5; printf 'q'",
  )
  expect(pty.status).toBe(0)
  const frame = lastFrame(pty.stdout).join('\n')
  expect(frame, '关弹层后游标应仍停在「最近播放」（没被重置回第一个）').toContain('>最近播放')
})

it('骨架模式：听歌页的模式条目按 Enter 不起播（只给一句提示），不崩', { skip: !which('script') }, () => {
  // 常用三档来自 core 的常量，骨架模式也画得出来；Enter 走 `selectFeedMode`，
  // 那里在 core 缺失时只 toast。旧版本这一页的 Enter 是直接开列表/动手，误触代价大
  const pty = ptyRun(
    "printf '3'; sleep 0.5; printf '\\t'; sleep 0.4; printf '\\r'; sleep 0.4; printf '\\r'; sleep 0.5; printf 'q'",
  )
  expect(pty.status).toBe(0)
  const frame = lastFrame(pty.stdout).join('\n')
  expect(frame).toContain('听歌')
  expect(frame, '骨架模式按 Enter 应当只提示，不碰播放').toContain('播不了')
  // 已删的键位不该再在任何提示里出现
  for (const gone of ['红心', 'a 队尾', 'P 加歌单', 'e 改名', 'x 移出'])
    expect(frame, `提示里还留着 ${gone}`).not.toContain(gone)
})

it('我的页（骨架）= 账号 + 收藏 + 歌单一页收齐；设置/歌单广场不混入', { skip: !which('script') }, () => {
  const pty = ptyRun("printf '4'; sleep 0.5; printf 'q'")
  expect(pty.status).toBe(0)
  const frame = lastFrame(pty.stdout).join('\n')
  expect(frame).toContain('N 新建歌单')
  // 账号页已并进「我的」：登录入口与账号分区都在这
  expect(frame).toContain('当前账号')
  expect(frame).toContain('扫码登录')
  // 设置走主菜单第 5 项/`S`，歌单广场归「发现」——这里不放无关入口
  expect(frame).not.toContain('设置与缓存')
  expect(frame).not.toContain('歌单广场')
  // 散键收进菜单：`l`/`x`/`e`/`D` 不再出现在提示里（登录/退出在账号行，改名/删除在歌单行）
  for (const gone of ['l 登录', 'x 登出', 'e 改名', 'D 删歌单']) expect(frame, gone).not.toContain(gone)
  expect(frame).toContain('Enter 打开 / 操作菜单')
})

it('我的页：账号行 Enter 打开「账号操作」菜单（登录 / 换号 / 退出都在这里，骨架下也能开）', {
  skip: !which('script'),
}, () => {
  // '4' 进「我的」（go 把焦点交给内容）→ 游标停在第一项「当前账号」→ Enter 开菜单
  // → Ctrl+C 退出（菜单开着时 `q` 被弹层吞掉，这是刻意的：防误触退出）
  const pty = ptyRun("printf '4'; sleep 0.5; printf '\\r'; sleep 0.6; printf '\\003'")
  expect(pty.status).toBe(0)
  const frame = lastFrame(pty.stdout).join('\n')
  expect(frame).toContain('操作 · 账号')
  expect(frame).toContain('扫码登录（全屏二维码）')
  expect(frame).toContain('刷新资料 / 会员 / 歌单')
})

it('鼠标：启动开全部上报（含移动/拖动），退出全部还原', { skip: !which('script') }, () => {
  const raw = ptyRun("printf 'q'").stdout
  // 四个模式全开：?1000（按下/抬起+滚轮）?1006（SGR 坐标）?1002（拖动）?1003（移动）
  // 移动/拖动刻意不再关掉——VTE 系终端只开 ?1000 时会把界面当拖选文本区，光标停在 I 型、点击不报进来
  expect(raw).toContain(`${ESC}[?1000h`)
  expect(raw).toContain(`${ESC}[?1006h`)
  expect(raw).toContain(`${ESC}[?1003h`)
  // 只在运行期不关；?1002l/?1003l 允许出现（退出时 MOUSE_OFF 会统一还原）
  expect(raw.indexOf(`${ESC}[?1003l`)).toBeGreaterThan(raw.indexOf(`${ESC}[?1003h`))
  expect(raw).toContain(`${ESC}[?1000l`) // 退出后不留在鼠标模式
})

it('鼠标：QISHUI_TUI_MOUSE=0 时完全不接管鼠标', { skip: !which('script') }, () => {
  const raw = ptyRun("printf 'q'", 'QISHUI_TUI_MOUSE=0').stdout
  expect(raw).not.toContain(`${ESC}[?1000h`)
  expect(raw).not.toContain(`${ESC}[?1006h`)
})

it('鼠标：点侧边栏导航行切页；内容区第一列（接缝列）不算侧边栏', { skip: !which('script'), timeout: 40_000 }, () => {
  const ref = lastFrame(ptyRun("printf 'q'").stdout)
  const y = rowOf(ref, '我的') // 侧边栏第 4 项所在行
  expect(ref[0].startsWith(' 发现')).toBe(true)

  const hit = ptyRun(`${click(y, 5)}; sleep 0.5; printf 'q'`)
  expect(lastFrame(hit.stdout)[0].startsWith(' 我的')).toBe(true)

  // 侧边栏宽 16：库的闭区间判定会把第 17 列也算进去，而第 17 列正是内容区第一列——归属只能给内容
  const seam = ptyRun(`${click(y, 17)}; sleep 0.5; printf 'q'`)
  expect(lastFrame(seam.stdout)[0].startsWith(' 发现')).toBe(true)
})

it('鼠标：分区条目页也是单击直达——点「我的」的「我喜欢的音乐」直接进列表页', {
  skip: !which('script'),
  timeout: 40_000,
}, () => {
  // `SectionView` 挂载后 350ms 内的点击只挪游标（防「点开弹层又穿透执行」），所以这里等满 1 秒再点
  const ref = lastFrame(ptyRun("printf '4'; sleep 0.5; printf 'q'").stdout)
  const y = rowOf(ref, '我喜欢的音乐')
  const x = colOf(ref, '我喜欢的音乐', '喜欢')
  const pty = ptyRun(`printf '4'; sleep 1.2; ${click(y, x)}; sleep 0.6; printf 'q'`)
  expect(pty.status).toBe(0)
  const frame = lastFrame(pty.stdout).join('\n')
  // 进了列表页：面包屑出现「我喜欢的音乐」，「我的」页自己的分区头消失
  expect(frame).toContain('我喜欢的音乐')
  expect(frame, '应已从「我的」页进列表页（还停在原页说明没触发）').not.toContain('快捷入口')
})

it('鼠标：抬起坐标漂移（发不出 click）也照样触发——按下即生效', { skip: !which('script'), timeout: 40_000 }, () => {
  const ref = lastFrame(ptyRun("printf 'q'").stdout)
  const y = rowOf(ref, '听歌')
  // 按下在「听歌」行，抬起漂到 +3 列 +1 行：超出 clickDistanceThreshold:1，click 永远不会发
  const pty = ptyRun(`${driftClick(y, 5)}; sleep 0.5; printf 'q'`)
  expect(lastFrame(pty.stdout)[0].startsWith(' 听歌')).toBe(true)
})

it('鼠标：侧边栏滚轮挪游标，Enter 落到对应导航项', { skip: !which('script'), timeout: 40_000 }, () => {
  const ref = lastFrame(ptyRun("printf 'q'").stdout)
  const y = rowOf(ref, '听歌')
  // 游标默认停在「发现」（第 2 项），向下滚 1 格到「听歌」（第 3 项），Enter 即切页
  const pty = ptyRun(`${wheel(y, 5, 1)}; printf '\\r'; sleep 0.5; printf 'q'`)
  expect(lastFrame(pty.stdout)[0].startsWith(' 听歌')).toBe(true)
})

it('鼠标：点面包屑第一段直接退回该层', { skip: !which('script'), timeout: 40_000 }, () => {
  const ref = lastFrame(ptyRun("printf 'q'").stdout)
  const pty = ptyRun(`printf 'S'; sleep 0.5; ${click(1, colOf(ref, '发现', '发现'))}; sleep 0.5; printf 'q'`)
  const frame = lastFrame(pty.stdout)
  expect(frame[0].startsWith(' 发现')).toBe(true)
  expect(frame.join('\n')).not.toContain('设置与缓存')
})

it('鼠标：搜索页点分类 tab 切分类，点输入行后能直接打字', { skip: !which('script'), timeout: 40_000 }, () => {
  const keys = `printf '1'; sleep 0.5; printf '\\033'; sleep 0.4`
  const ref = lastFrame(ptyRun(`${keys}; printf 'q'`).stdout)
  const tabY = rowOf(ref, '[综合]')
  const tabX = colOf(ref, '[综合]', '歌手')
  // 输入行的唯一标识是收起输入后的占位（侧边栏/面包屑里也有「搜索」二字，不能拿它当行锚点）
  const inputY = rowOf(ref, '（按 / 继续输入）')
  const inputX = colOf(ref, '（按 / 继续输入）', '（按')

  const pty = ptyRun(
    `${keys}; ${click(tabY, tabX)}; sleep 0.4; ${click(inputY, inputX)}; sleep 0.3; printf 'abc'; sleep 0.5; printf '\\033'; sleep 0.3; printf 'q'`,
  )
  expect(pty.status).toBe(0)
  const frame = lastFrame(pty.stdout).join('\n')
  expect(frame).toContain('[歌手]') // 点 tab 生效
  expect(frame).toContain('关键词 abc') // 点输入行进了编辑态
})

it('resize 后按新行数重排（备用屏；画面不超过新行数）', { skip: !which('script') }, () => {
  const pty = run(
    `(sleep 2.4; printf 'q'; sleep 0.8) | QISHUI_TUI_STUB=1 script -qec "stty rows 24 cols 100; (sleep 1.2; stty rows 12 cols 60) < /dev/tty & ${NODE} ${CLI}" /dev/null`,
    40_000,
  )
  expect(pty.status).toBe(0)
  expect(pty.stdout).toContain(`${ESC}[?1049h`)
  expect(pty.stdout).toContain(`${ESC}[?1049l`)

  const lines = (fragment: string) =>
    stripAnsi(fragment)
      .split('\n')
      .map((l) => l.replace('\r', '').trimEnd())
      .filter((l) => l.length > 0)

  // 找最后一个含侧边栏的帧（= resize 之后、退出之前），行数必须收敛到新的 12 行
  const frames = pty.stdout.split(`${ESC}[2J`).slice(1)
  const lastSidebarFrame = [...frames].reverse().find((f) => stripAnsi(f).includes('搜索'))
  expect(lastSidebarFrame, '找不到含侧边栏的帧').toBeTruthy()
  expect(lines(lastSidebarFrame as string).length).toBeLessThanOrEqual(12)
})
