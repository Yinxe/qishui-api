/**
 * 终端图形能力探测：开机问一次，别靠环境变量猜。
 *
 * 为什么要探测（原来的 `coverMode()` 只看 `KITTY_WINDOW_ID`/`TERM`/`TERM_PROGRAM`）：
 *  - **认少了**：ghostty / contour / rio / st-graphics 这些同样实现了 kitty 图形协议 + unicode 占位符的
 *    终端，被当成「没有协议」去画半块。
 *  - **认错了**：`KITTY_WINDOW_ID` 会透传进 tmux/zellij 里头的会话，可图形报文被 mux 吃掉——占位符
 *    没人解，界面就是一堆 `U+10EEEE` 残字。探测在这种终端里收不到回音，于是自然退回半块。
 *
 * 问哪三条（一次写完，然后读回音）：
 *  1. `ESC_Gi=<固定 id>,s=1,v=1,a=q,t=d,f=24;AAAA ESC\` —— kitty 的**查询动作**（`a=q`：试着解这颗
 *     1×1 的 RGB24 像素，但不存图、不占已有 id）。回了带同一个 id 的 `;OK` 就是支持图形协议。
 *  2. `ESC[>q`（XTVERSION）—— 回 `DCS >|<名字> ESC\`，拿牌子名用（见下面「占位符能力」这条坑）。
 *  3. `ESC[0c`（DA1）—— 回音里带 `;4;` 是会解 Sixel；更关键的是规范把 DA1 当**最后一条回音**：
 *     「收到 DA1 但没收到查询回音 = 不支持图形协议」。所以它同时是「回音读完了，可以收工」的收尾信号，
 *     不用把超时时限拖满。
 *
 * **`a=q` 证明不了 unicode 占位符能力**（kitty 规范里没有任何报这项能力的字段，占位符是 0.28 才加的）。
 * Konsole / Warp 实现的是更早的草案（会接图、但没占位符），给它们发占位符就是画残字——那件事在
 * `ui/cover.ts` 的旧协议名单里挡，探测这里只负责把牌子名（`brand`）如实报上去。
 */
import { type TermCaps, termCaps } from './caps.js'

/** 正则里写控制字符会被 biome 的 `noControlCharactersInRegex` 拦下，一律用字符串拼（与 `ui/cover.ts`、`ui/mouse.tsx` 同一口径） */
const ESC = String.fromCharCode(0x1b)
const ST = `${ESC}\\`

/** 查询用的图片 id（1…4294967295；0 是「任意放置」的保留值），只认带这个 id 的回音，免得把别的报文当能力 */
export const PROBE_ID = 278941603

/** 三条查询一次发完（顺序要紧：图形查询在前，DA1 收尾） */
export function probeQueries(): string {
  return `${ESC}_Gi=${PROBE_ID},s=1,v=1,a=q,t=d,f=24;AAAA${ST}${ESC}[>q${ESC}[0c`
}

/** 已经强制了走哪条路（`QISHUI_TUI_COVER=off|ansi|kitty`）就别再探测：白等一次启动停顿 */
export function shouldProbe(env: NodeJS.ProcessEnv = process.env): boolean {
  const forced = env.QISHUI_TUI_COVER
  return forced !== 'off' && forced !== 'ansi' && forced !== 'kitty'
}

/**
 * 从「到目前为止收到的回音」里解出能力。纯函数，单测喂实录字节串就够（不需要真终端）。
 *
 * `done` = DA1 已回，可以收工；`consumed` = 已解完的那段长度，尾巴要退回 stdin，
 * 别让 ink 接手后把半截回音当按键读（与 `ui/mouse.tsx` 挡鼠标报文同一类问题）。
 */
export function parseCapsReply(buffer: string): { caps: TermCaps; done: boolean; consumed: number } {
  const caps: TermCaps = { kgp: false, sixel: false, da1: false, probed: false }
  let consumed = 0

  // kitty 图形回音：`ESC_G i=<id>[,…] ; OK|错误文字 ESC\`（回音正文里不会有 ESC，所以这段正则就是完整一条）
  const kgp = new RegExp(`${ESC}_G([^${ESC}]*)${ESC}[\\\\]`, 'g')
  for (const match of buffer.matchAll(kgp)) {
    consumed = Math.max(consumed, (match.index ?? 0) + match[0].length)
    const [meta = '', status = ''] = match[1].split(';')
    if (!meta.includes(`i=${PROBE_ID}`)) continue
    caps.probed = true
    // 回音正文只能是可打印 ASCII；`OK` 才是「解这颗像素成功了」，别的（`ENOENT:`…）都当不支持
    if (status.startsWith('OK')) caps.kgp = true
  }

  // XTVERSION：`DCS >|ghostty 1.2.3 ESC\`
  const xtversion = new RegExp(`${ESC}P>\\|([^${ESC}]*)${ESC}[\\\\]`).exec(buffer)
  if (xtversion) {
    caps.probed = true
    caps.brand = xtversion[1].trim().split(/\s+/)[0]?.toLowerCase()
    consumed = Math.max(consumed, xtversion.index + xtversion[0].length)
  }

  // DA1：`ESC [ ? 62 ; … ; 4 c`（`?` 有的终端不带；`;4` = Sixel）
  const da1 = new RegExp(`${ESC}\\[\\??([0-9;]*)c`).exec(buffer)
  if (da1) {
    caps.probed = true
    caps.da1 = true
    caps.sixel = da1[1].split(';').includes('4')
    consumed = Math.max(consumed, da1.index + da1[0].length)
  }

  return { caps, done: da1 !== null, consumed }
}

/**
 * 发查询、收回音。在 `render()` **之前** await 完：那时 stdin 上还一个 listener 都没有，
 * 不存在「我们的读处理和 ink 的抢同一份字节」这类竞态（raw mode 也是我们开、我们在 ink 接手前关）。
 *
 * 没人答（假 PTY、老终端、mux）就付满 `timeoutMs`；kitty 是即时答，实测几十毫秒内收工。
 */
export async function probeGraphics(
  stdin: NodeJS.ReadStream,
  stdout: NodeJS.WriteStream,
  timeoutMs = 300,
): Promise<TermCaps> {
  if (stdin.isTTY !== true || stdout.isTTY !== true) return termCaps()

  const wasRaw = stdin.isRaw === true
  if (!wasRaw) stdin.setRawMode(true)

  let buffer = ''
  let consumed = 0
  let closed = false
  let timer: ReturnType<typeof setTimeout>
  let finish: (caps: TermCaps) => void = () => {}
  const result = new Promise<TermCaps>((resolve) => {
    finish = resolve
  })

  function stop(caps: TermCaps): void {
    if (closed) return
    closed = true
    clearTimeout(timer)
    stdin.removeListener('data', onData)
    // 只在「是我们开的 raw mode」时关：ink 之后会自己开，别把它的状态一起关掉
    if (!wasRaw && stdin.isRaw === true) stdin.setRawMode(false)
    const tail = buffer.slice(consumed)
    if (tail) stdin.unshift(tail)
    finish(caps)
  }

  function onData(data: string | Buffer): void {
    buffer += typeof data === 'string' ? data : data.toString('utf8')
    const reply = parseCapsReply(buffer)
    consumed = Math.max(consumed, reply.consumed)
    // DA1 是最后一条回音，收到就收工（没收到就等超时）
    if (reply.done) stop(reply.caps)
  }

  timer = setTimeout(() => stop(parseCapsReply(buffer).caps), timeoutMs)
  // 先挂 listener 再写查询：终端可能在同一个 tick 就把回音送进来
  stdin.on('data', onData)
  stdout.write(probeQueries())
  return await result
}
