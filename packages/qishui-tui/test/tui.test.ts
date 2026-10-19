import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect, it, vi } from 'vitest'
import { displayWidth } from '../dist/ui/format.js'
import { PROBE_ID } from '../dist/ui/termProbe.js'

// 每条用例都要起一个 PTY：等第一帧（2.4s）+ 几次按键 + 收尾，默认 5 秒不够用
vi.setConfig({ testTimeout: 40_000 })

const CLI = fileURLToPath(new URL('../dist/cli.js', import.meta.url))
const NODE = process.execPath
const ESC = String.fromCharCode(27)

const which = (bin: string) => spawnSync('sh', ['-c', `command -v ${bin}`], { encoding: 'utf8' }).status === 0

// 60 秒：机器被别的进程压满时，一条 PTY 用例（起进程 + 等第一帧 + 按键）能慢到 30 秒以上
const run = (sh: string, timeout = 60_000) => spawnSync('sh', ['-c', sh], { encoding: 'utf8', timeout })

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
/**
 * `wait` = 起进程到第一帧画完的等待。冷启动要先把 ink（+ react/yoga）加载进来，
 * 实测机器有负载时光这一项就要 1 秒以上；等不够就会出现「按键/点击比第一帧先到」的假失败
 * （点了没反应、Ctrl+C 落在渲染前）。所以这里给足 2.4 秒，别指望 1.2 秒够用。
 */
const ptyRun = (keys: string, env = '', size = 'stty rows 24 cols 100', wait = 2.4) =>
  run(`(sleep ${wait}; ${keys}; sleep 0.8) | QISHUI_TUI_STUB=1 ${env} script -qec "${size}; ${NODE} ${CLI}" /dev/null`)

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

it('TTY 里画出侧边栏 + 播放条 + 提示行，Ctrl+C 连按两次退出', { skip: !which('script') }, () => {
  expect(existsSync(CLI), `先 pnpm run tui:build，缺 ${CLI}`).toBe(true)

  const pty = ptyRun("printf '\\003'; sleep 0.3; printf '\\003'")
  expect(pty.status).toBe(0)
  expect(pty.stdout).toContain(`${ESC}[?1049h`) // 进备用屏
  expect(pty.stdout).toContain(`${ESC}[?1049l`) // 退出还原

  const frame = stripAnsi(pty.stdout)
  for (const label of ['搜索', '发现', '听歌', '我的', '本地', '设置']) expect(frame).toContain(label)
  // 榜单不再是侧边栏一级项（首页榜单块在「发现」里已经摊平）
  expect(frame).not.toContain('榜单')
  expect(frame).toContain('没有在播的曲目')
  expect(frame).toContain('骨架模式')
  expect(frame).toContain('Ctrl+C x2 退出') // 侧边栏焦点下的提示行（`q` 不再是退出键）
  expect(frame).not.toContain('q 退出')
})

it('数字键直接切一级页，面包屑跟着走；Tab/Esc 在侧边栏↔内容之间换焦点', { skip: !which('script') }, () => {
  // 3 = 听歌（焦点交给内容），Tab 到侧边栏（提示行换成侧边栏那套），Esc 再把焦点交回内容
  const pty = ptyRun(
    "printf '3'; sleep 0.4; printf '\\t'; sleep 0.4; printf '\\033'; sleep 0.4; printf '\\003'; sleep 0.3; printf '\\003'",
  )
  expect(pty.status).toBe(0)
  const frame = lastFrame(pty.stdout).join('\n')
  expect(frame).toContain('听歌') // 面包屑 + 侧边栏
  expect(frame, 'Esc 之后焦点已回到内容（听歌页自己的提示行）').toContain('←→ 选模式')
  expect(frame).not.toContain('Tab 到内容')
})

it('搜索页：数字 1 进入后可直接打字，Esc 收起输入，Ctrl+C 两次退出', { skip: !which('script') }, () => {
  const pty = ptyRun(
    `printf '1'; sleep 0.4; printf 'abc'; sleep 0.5; printf '\\033'; sleep 0.4; printf '\\003'; sleep 0.3; printf '\\003'`,
  )
  expect(pty.status).toBe(0)
  const frame = lastFrame(pty.stdout).join('\n')
  expect(frame).toContain('关键词 abc') // 三个字符一个不少（一次 read 可能带回多个）
  expect(frame).toContain('[综合]')
})

/**
 * 探测回音**迟到**（慢终端把回音落在 ink 接手之后）时，整串会当按键交给 handler：
 * 搜索框里凭空多出 `?62;1;0c` 就是这件事。ink 没有「消费」语义，所以要自己挡（`ui/reports.ts`）。
 */
it('搜索页：迟到的终端回音不会打进输入框', { skip: !which('script'), timeout: 40_000 }, () => {
  const pty = ptyRun(
    `printf '1'; sleep 0.4; printf 'abc'; sleep 0.3; ` +
      // DA1 + kitty 图形应答 + XTVERSION：真终端会自己发，这里替它发
      `printf '\\033[?62;4;18c\\033_Gi=${PROBE_ID};OK\\033\\\\\\033P>|kitty 0.41.1\\033\\\\'; sleep 0.5; ` +
      `printf '\\033'; sleep 0.3; printf '\\003'; sleep 0.3; printf '\\003'`,
  )
  expect(pty.status).toBe(0)
  const frame = lastFrame(pty.stdout).join('\n')
  expect(frame).toContain('关键词 abc') // 人敲的三个字还在
  // 残字：`?62;4;18c` / `OK` / `>|kitty` 任何一种漏进输入框都算这条闸失效
  for (const residue of ['62;4', 'Gi=', '>|kitty', '0.41.1']) expect(frame, residue).not.toContain(residue)
})

it('S 打开设置与缓存页（骨架模式下渲染分区与缓存分档）', { skip: !which('script') }, () => {
  // G 跳到底：设置页分区很长，最后一段「配置 / 缓存分档」要滚下去才看得见
  const pty = ptyRun("printf 'S'; sleep 0.5; printf 'G'; sleep 0.5; printf '\\003'; sleep 0.3; printf '\\003'")
  expect(pty.status).toBe(0)
  const frame = lastFrame(pty.stdout).join('\n')
  expect(frame).toContain('设置与缓存')
  expect(frame).toContain('配置')
  expect(frame).toContain('缓存分档')
  expect(frame).toContain('账号隔离')
})

it('帮助弹层：行操作收进菜单后仍能查到「不感兴趣 / 举报 / 删歌单」', { skip: !which('script') }, () => {
  // 帮助正文按 ↑↓ / gG 滚动，一次只画得下一屏：用高一点的终端（40 行）把「导航/播放/列表/歌单」四段一次看全，
  // 免得断言依赖「滚到第几行」。q 在帮助里是「关弹层」，退出仍要 Ctrl+C 连按两次。
  const pty = ptyRun(
    "printf '?'; sleep 0.6; printf 'q'; sleep 0.4; printf '\\003'; sleep 0.3; printf '\\003'",
    '',
    'stty rows 40 cols 100',
  )
  expect(pty.status).toBe(0)
  // 弹层是逐行局部重绘（ink 只在必要时才整屏 ESC[2J），按「最后一帧」取会什么都取不到 —— 这里查整段输出
  const out = stripAnsi(pty.stdout)
  for (const need of ['帮助', '设置与缓存', 'Enter 打开这一行的操作菜单', '不感兴趣', '举报', '删歌单'])
    expect(out, `帮助里查不到「${need}」`).toContain(need)
})

it('弹层不重刷背景页：开合帮助后，「我的」页游标停在原处（底层页面没被卸载）', { skip: !which('script') }, () => {
  // 回归：曾经 Content() 在有弹层时只画弹层、把 <Screen> 卸载 → 关弹层后页面重新挂载，
  // useCursor 游标归 0（现象=整页重刷、选中行跳回第一个）。现在底层常驻、只是隐藏。
  // '5' 进「我的」（go 会把焦点设到 content）→ 'jj' 把游标挪到「最近播放」（第一项是账号行）
  // → '?' 开帮助 → Esc 关 → 断言游标仍在原位。
  // 'jj' 故意**一次 write** 灌进去：一次 read 带回多个字符时 ink 给的 input 是整串 `jj`，
  // 拆键那层（`ui/keys.ts`）就是为这个存在的——不拆的话「快按两下、游标不动」。
  const pty = ptyRun(
    "printf '5'; sleep 0.5; printf 'jj'; sleep 0.5; printf '?'; sleep 0.5; printf '\\033'; sleep 0.5; printf '\\003'; sleep 0.3; printf '\\003'",
  )
  expect(pty.status).toBe(0)
  const frame = lastFrame(pty.stdout).join('\n')
  expect(frame, '关弹层后游标应仍停在「最近播放」（没被重置回第一个）').toContain('>最近播放')
})

it('骨架模式：听歌页的模式条目按 Enter 不起播（只给一句提示），不崩', { skip: !which('script') }, () => {
  // 常用三档来自 core 的常量，骨架模式也画得出来；Enter 走 `selectFeedMode`，
  // 那里在 core 缺失时只 toast。旧版本这一页的 Enter 是直接开列表/动手，误触代价大
  const pty = ptyRun(
    "printf '3'; sleep 0.5; printf '\\t'; sleep 0.4; printf '\\r'; sleep 0.4; printf '\\r'; sleep 0.5; printf '\\003'; sleep 0.3; printf '\\003'",
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
  const pty = ptyRun("printf '5'; sleep 0.5; printf '\\003'; sleep 0.3; printf '\\003'")
  expect(pty.status).toBe(0)
  const frame = lastFrame(pty.stdout).join('\n')
  expect(frame).toContain('N 新建歌单')
  // 账号页已并进「我的」：登录入口与账号分区都在这
  expect(frame).toContain('当前账号')
  expect(frame).toContain('扫码登录')
  // 设置走主菜单第 7 项/`S`，歌单广场归「发现」——这里不放无关入口
  expect(frame).not.toContain('设置与缓存')
  expect(frame).not.toContain('歌单广场')
  // 散键收进菜单：`l`/`x`/`e`/`D` 不再出现在提示里（登录/退出在账号行，改名/删除在歌单行）
  for (const gone of ['l 登录', 'x 登出', 'e 改名', 'D 删歌单']) expect(frame, gone).not.toContain(gone)
  expect(frame).toContain('Enter 打开 / 操作菜单')
})

it('本地页（骨架）= 本地喜欢 / 历史 / 歌单 / 文件夹 一页收齐；键位 6 直达、7 到设置', {
  skip: !which('script'),
  timeout: 40_000,
}, () => {
  // 6 = 本地（侧边栏第 6 项，「播放队列」占了第 4 项）。骨架模式下 core 是 undefined，所以只验分区与入口画得出来
  const pty = ptyRun("printf '6'; sleep 0.5; printf '\\003'; sleep 0.3; printf '\\003'")
  expect(pty.status).toBe(0)
  const frame = lastFrame(pty.stdout).join('\n')
  expect(frame).toContain('本地库（不出网，匿名可用）')
  for (const section of ['本地喜欢', '播放历史', '本地歌单', '音乐文件夹'])
    expect(frame, `本地页缺分区「${section}」`).toContain(section)
  expect(frame).toContain('新建本地歌单')
  expect(frame).toContain('添加文件夹')
  // 账号侧的东西不混进来（那边是「我的」）
  expect(frame).not.toContain('当前账号')
  expect(frame).not.toContain('设置与缓存')

  // 7 = 设置（侧边栏最后一项）
  const toSettings = ptyRun("printf '7'; sleep 0.5; printf '\\003'; sleep 0.3; printf '\\003'")
  expect(toSettings.status).toBe(0)
  expect(lastFrame(toSettings.stdout).join('\n')).toContain('设置与缓存')
})

it('我的页：账号行 Enter 打开「账号操作」菜单（登录 / 换号 / 退出都在这里，骨架下也能开）', {
  skip: !which('script'),
}, () => {
  // '5' 进「我的」（go 把焦点交给内容）→ 游标停在第一项「当前账号」→ Enter 开菜单
  // → Ctrl+C 连按两次退出（`q` 已经不是退出键了，弹层里按它也只是普通字符）
  const pty = ptyRun("printf '5'; sleep 0.5; printf '\\r'; sleep 0.6; printf '\\003'; sleep 0.3; printf '\\003'")
  expect(pty.status).toBe(0)
  const frame = lastFrame(pty.stdout).join('\n')
  expect(frame).toContain('操作 · 账号')
  expect(frame).toContain('扫码登录（全屏二维码）')
  expect(frame).toContain('刷新资料 / 会员 / 歌单')
})

it('鼠标：启动开全部上报（含移动/拖动），退出全部还原', { skip: !which('script') }, () => {
  const raw = ptyRun("printf '\\003'; sleep 0.3; printf '\\003'").stdout
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
  const raw = ptyRun("printf '\\003'; sleep 0.3; printf '\\003'", 'QISHUI_TUI_MOUSE=0').stdout
  expect(raw).not.toContain(`${ESC}[?1000h`)
  expect(raw).not.toContain(`${ESC}[?1006h`)
})

it('鼠标：点侧边栏导航行切页；内容区第一列（接缝列）不算侧边栏', { skip: !which('script'), timeout: 40_000 }, () => {
  const ref = lastFrame(ptyRun("printf '\\003'; sleep 0.3; printf '\\003'").stdout)
  const y = rowOf(ref, '我的') // 侧边栏第 4 项所在行
  expect(ref[0]).toContain('听歌') // 启动页是「听歌」（顶栏第一段面包屑；logo 占住了行首）

  const hit = ptyRun(`${click(y, 5)}; sleep 0.5; printf '\\003'; sleep 0.3; printf '\\003'`)
  expect(lastFrame(hit.stdout)[0]).toContain('我的')

  // 侧边栏宽 16：库的闭区间判定会把第 17 列也算进去，而第 17 列正是内容区第一列——归属只能给内容
  const seam = ptyRun(`${click(y, 17)}; sleep 0.5; printf '\\003'; sleep 0.3; printf '\\003'`)
  expect(lastFrame(seam.stdout)[0]).toContain('听歌')
})

it('鼠标：分区条目页也是单击直达——点「我的」的「我喜欢的音乐」直接进列表页', {
  skip: !which('script'),
  timeout: 40_000,
}, () => {
  // `SectionView` 挂载后 350ms 内的点击只挪游标（防「点开弹层又穿透执行」），所以这里等满 1 秒再点
  const ref = lastFrame(ptyRun("printf '5'; sleep 0.5; printf '\\003'; sleep 0.3; printf '\\003'").stdout)
  const y = rowOf(ref, '我喜欢的音乐')
  const x = colOf(ref, '我喜欢的音乐', '喜欢')
  const pty = ptyRun(`printf '5'; sleep 1.2; ${click(y, x)}; sleep 0.6; printf '\\003'; sleep 0.3; printf '\\003'`)
  expect(pty.status).toBe(0)
  const frame = lastFrame(pty.stdout).join('\n')
  // 进了列表页：面包屑出现「我喜欢的音乐」，「我的」页自己的分区头消失
  expect(frame).toContain('我喜欢的音乐')
  expect(frame, '应已从「我的」页进列表页（还停在原页说明没触发）').not.toContain('快捷入口')
})

it('鼠标：抬起坐标漂移（发不出 click）也照样触发——按下即生效', { skip: !which('script'), timeout: 40_000 }, () => {
  const ref = lastFrame(ptyRun("printf '\\003'; sleep 0.3; printf '\\003'").stdout)
  // 锚点用「本地」：启动页是「听歌」，而面包屑第一段也是「听歌」，拿它反查行号会落到表头
  const y = rowOf(ref, '本地')
  // 按下在「本地」行，抬起漂到 +3 列 +1 行：超出 clickDistanceThreshold:1，click 永远不会发
  const pty = ptyRun(`${driftClick(y, 5)}; sleep 0.5; printf '\\003'; sleep 0.3; printf '\\003'`)
  expect(lastFrame(pty.stdout)[0]).toContain('本地')
})

it('鼠标：侧边栏滚轮挪游标，Enter 落到对应导航项', { skip: !which('script'), timeout: 40_000 }, () => {
  const ref = lastFrame(ptyRun("printf '\\003'; sleep 0.3; printf '\\003'").stdout)
  const y = rowOf(ref, '本地')
  // 游标默认停在「听歌」（启动页 = 第 3 项），向下滚 1 格到「播放队列」（第 4 项），Enter 即切页
  const pty = ptyRun(`${wheel(y, 5, 1)}; printf '\\r'; sleep 0.5; printf '\\003'; sleep 0.3; printf '\\003'`)
  expect(lastFrame(pty.stdout)[0]).toContain('播放队列')
})

it('鼠标：点面包屑第一段直接退回该层', { skip: !which('script'), timeout: 40_000 }, () => {
  const ref = lastFrame(ptyRun("printf '\\003'; sleep 0.3; printf '\\003'").stdout)
  const pty = ptyRun(
    `printf 'S'; sleep 0.5; ${click(1, colOf(ref, '听歌', '听歌'))}; sleep 0.5; printf '\\003'; sleep 0.3; printf '\\003'`,
  )
  const frame = lastFrame(pty.stdout)
  expect(frame[0]).toContain('听歌')
  expect(frame.join('\n')).not.toContain('设置与缓存')
})

it('鼠标：搜索页点分类 tab 切分类，点输入行后能直接打字', { skip: !which('script'), timeout: 40_000 }, () => {
  const keys = `printf '1'; sleep 0.5; printf '\\033'; sleep 0.4`
  const ref = lastFrame(ptyRun(`${keys}; printf '\\003'; sleep 0.3; printf '\\003'`).stdout)
  const tabY = rowOf(ref, '[综合]')
  const tabX = colOf(ref, '[综合]', '歌手')
  // 输入行的唯一标识是收起输入后的占位（侧边栏/面包屑里也有「搜索」二字，不能拿它当行锚点）
  const inputY = rowOf(ref, '（按 / 继续输入）')
  const inputX = colOf(ref, '（按 / 继续输入）', '（按')

  const pty = ptyRun(
    `${keys}; ${click(tabY, tabX)}; sleep 0.4; ${click(inputY, inputX)}; sleep 0.3; printf 'abc'; sleep 0.5; printf '\\033'; sleep 0.3; printf '\\003'; sleep 0.3; printf '\\003'`,
  )
  expect(pty.status).toBe(0)
  const frame = lastFrame(pty.stdout).join('\n')
  expect(frame).toContain('[歌手]') // 点 tab 生效
  expect(frame).toContain('关键词 abc') // 点输入行进了编辑态
})

it('f 进「听歌」页（独立播放页已并入）：压栈一层，模式单行 + 正在播放都在；再按 f 退回', {
  skip: !which('script'),
  timeout: 40_000,
}, () => {
  // 先按 2 落在「发现」（启动页是「听歌」），再 f 进听歌页——验压栈，不依赖启动页
  const pty = ptyRun("printf '2'; sleep 0.5; printf 'f'; sleep 0.8; printf '\\003'; sleep 0.3; printf '\\003'")
  expect(pty.status).toBe(0)
  const frame = lastFrame(pty.stdout).join('\n')
  // 面包屑多一段「听歌」= 它是压栈的页面，不是弹层
  expect(frame).toContain('发现 / 听歌')
  expect(frame).toContain('听歌模式：未选')
  expect(frame).toContain('[推荐]') // 模式单行默认高亮第一档
  expect(frame).toContain('正在播放')
  expect(frame).toContain('没有在播的曲目')
  // 听歌页自己的提示行
  expect(frame).toContain('←→ 选模式')
  expect(frame).toContain('o 操作菜单')
  // 右栏就是当前队列：不必再按 Q 才知道下一首是什么；栏头给可点的 [切换队列] 入口
  expect(frame).toContain('队列为空')
  expect(frame).toContain('[切换队列]')

  // 再按一次 f 回到底下的页面（发现），听歌页整块消失
  const back = ptyRun(
    "printf '2'; sleep 0.4; printf 'f'; sleep 0.6; printf 'f'; sleep 0.6; printf '\\003'; sleep 0.3; printf '\\003'",
  )
  expect(back.status).toBe(0)
  const after = lastFrame(back.stdout).join('\n')
  expect(after).not.toContain('听歌模式：')
  expect(after).toContain('发现')
})

it('听歌页窄屏：歌词/队列退成 tab，t 换栏，队列不会被藏掉', {
  skip: !which('script'),
  timeout: 40_000,
}, () => {
  // 60 列（侧栏收成单字 4 列、内容 56 < 64）= 单栏 + 顶部 [歌词] [队列]
  const lyrics = ptyRun("printf '3'; sleep 0.6; printf '\\003'; sleep 0.3; printf '\\003'", '', 'stty rows 24 cols 60')
  expect(lyrics.status).toBe(0)
  const left = lastFrame(lyrics.stdout).join('\n')
  expect(left).toContain('[歌词]')
  expect(left).toContain('队列') // 另一栏的 tab 还在，只是没选中
  expect(left).not.toContain('[队列]')

  // t 换到队列栏：tab 高亮跟着走，队列内容画出来
  const queue = ptyRun(
    "printf '3'; sleep 0.6; printf 't'; sleep 0.6; printf '\\003'; sleep 0.3; printf '\\003'",
    '',
    'stty rows 24 cols 60',
  )
  expect(queue.status).toBe(0)
  const right = lastFrame(queue.stdout).join('\n')
  expect(right).toContain('[队列]')
  expect(right).toContain('队列为空')
  expect(right).toContain('[切换队列]')
})

it('Esc 退到根页再按 = 退出确认弹层（不是直接退出），y / Enter 才退', {
  skip: !which('script'),
  timeout: 40_000,
}, () => {
  // 3 = 听歌（焦点在内容）→ Esc 无路可退 → 确认弹层；n 取消后还留在页面上，再 Esc 又弹出来
  const pty = ptyRun(
    "printf '3'; sleep 0.5; printf '\\033'; sleep 0.6; printf 'n'; sleep 0.5; printf '\\033'; sleep 0.6; printf '\\003'; sleep 0.3; printf '\\003'",
  )
  expect(pty.status).toBe(0)
  const out = stripAnsi(pty.stdout)
  expect(out).toContain('退出 qishui-tui？') // 弹层出现过（Esc 没有直接把进程干掉）
  expect(out).toContain('[确认]')
  expect(out).toContain('[取消]')
})

it('播放队列页（Q）：压栈成整页（不再是弹层），骨架模式空态；Esc 返回', {
  skip: !which('script'),
  timeout: 40_000,
}, () => {
  // 页面不是弹层：Esc 直接退回底下的发现页；退回去之后才按 Ctrl+C 两次退出
  const pty = ptyRun(
    "printf '2'; sleep 0.5; printf 'Q'; sleep 1; printf '\\033'; sleep 0.4; printf '\\003'; sleep 0.3; printf '\\003'",
  )
  expect(pty.status).toBe(0)
  const all = stripAnsi(pty.stdout)
  expect(all).toContain('发现 / 播放队列') // 面包屑多一段 = 页面
  expect(all).toContain('书架是空的')
  expect(all).toContain('Enter 切过去')
  expect(all).toContain('0/10 份') // 标题里带书架上限
  // Esc 关掉后回到发现页
  const after = lastFrame(pty.stdout).join('\n')
  expect(after).not.toContain('书架是空的')
  expect(after).toContain('发现')
})

it('resize 后按新行数重排（备用屏；画面不超过新行数）', { skip: !which('script') }, () => {
  const pty = run(
    `(sleep 2.4; printf '\\003'; sleep 0.3; printf '\\003'; sleep 0.8) | QISHUI_TUI_STUB=1 script -qec "stty rows 24 cols 100; (sleep 1.2; stty rows 12 cols 60) < /dev/tty & ${NODE} ${CLI}" /dev/null`,
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

  // 最后一个 ESC[2J 之后的画面 = resize 之后、退出之前那一帧（宽度变小，ink 会整屏清一次），
  // 行数必须收敛到新的 12 行。**别拿「含『搜索』的最后一帧」当锚点**：60 列下侧栏收成单字
  // （`搜`），再按那个词找只会落回 resize 之前的老帧，断言就变成「老帧也不超过 12 行」。
  const frame = lastFrame(pty.stdout)
  expect(frame.join('\n')).toContain('搜')
  expect(lines(frame.join('\n')).length).toBeLessThanOrEqual(12)
})

it('resize 后听歌页跟着重排：宽屏有模式提示、缩窄后收起（尺寸进了 React，不只是 yoga 重算）', {
  skip: !which('script'),
  timeout: 40_000,
}, () => {
  // 回归：以前 `ui.columns`/`rows` 只在渲染期读一次 stdout，resize 只让 yoga 重排、不重渲染 React，
  // 于是「按列宽决定画什么」这些数全停在旧值。现在 UI 侧订阅 resize 把尺寸放进 state
  // （ui/context.tsx 的 useTerminalSize）。听歌页模式行右侧那句提示按内容宽度（≥60 才画）来，
  // 100 列（侧栏 16、内容 84）画得出，缩到 60 列（侧栏 4、内容 56）就该收起。
  const pty = run(
    `(sleep 10; printf '\\003'; sleep 0.3; printf '\\003'; sleep 0.8) | QISHUI_TUI_STUB=1 script -qec "stty rows 24 cols 100; (sleep 6; stty rows 24 cols 60) < /dev/tty & ${NODE} ${CLI}" /dev/null`,
    40_000,
  )
  expect(pty.status).toBe(0)
  // 整段输出里应能找到宽屏那一帧（缩窄前的提示）
  expect(stripAnsi(pty.stdout), '宽屏应重渲染出模式行右侧提示').toContain('选一个模式就开始随机播')
  const frame = lastFrame(pty.stdout).join('\n')
  expect(frame, '缩到 60 列后提示收起（说明按新列宽重排过）').not.toContain('选一个模式就开始随机播')
  expect(frame, '缩窄后侧栏收成单字').toContain('搜')
  expect(frame).toContain('听歌模式：')
})
