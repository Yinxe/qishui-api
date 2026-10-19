/**
 * 终端**回报**（terminal reports）：查询的回音——APC `ESC _ G …`（kitty 图形协议的应答）、
 * DCS `ESC P …`（XTVERSION 报牌子）、`ESC [ ? …c` / `ESC [ > …c`（DA1/DA2）。
 *
 * 它们和鼠标报文是同一类麻烦（见 `ui/mouse.tsx`）：`cli.tsx` 在 `render()` 之前就把探测回音收掉了，
 * 可慢终端会把回音落在 ink 接手之后，而 ink 没有「消费」语义——整串会当按键交给每个活跃 handler，
 * 搜索框里就凭空多出 `?62;1;0c` 这种字。文本输入处（搜索框/评论/歌单名）用 `stripReports()` 剔干净，
 * 按键处（`ui/keys.ts` 的 `useKeys`）也先过同一个函数、剔空了就不派发。
 *
 * **坑（PTY 实测撞出来的）：一条回音会被 ink 切成好几个事件，而且开头的 ESC 全被剥掉。**
 * handler 实际依次收到的是：
 *   `[?62;4;18c` → `_` → `Gi=278941603;OK` → `\` → `P` → `>|kitty 0.41.1` → `\`
 * 所以「按完整报文匹配」在这一层根本不存在，只能分两档处理：
 *  1. **形状本身就没人敲得出来的**（DA1/DA2 整条、带 ESC 的完整 APC/DCS）——**永久**剔掉；
 *  2. 被剥得只剩 `_` / `P` / `\` 的碎片——**单独看就是正常的字**，剔掉等于吃掉用户输入。
 *     于是只在「回音还可能正在进来」的时候才吞：探测**没收到 DA1**（DA1 是最后一条回音，它到了
 *     后面就没东西了）时 `cli.tsx` 调 `armReportGuard()` 开一个 `GRACE_MS` 的窗口，窗口里见到
 *     开头碎片就等正文——正文还得**开头对得上回音的形状**（`Gi=<数字>` / `>|`），对不上就当场收场，
 *     把那个 `_` 还给用户（所以在搜索框里敲 `_` 再敲 `j`，`j` 照旧进得去）。
 *
 * 真终端都答 DA1 → 窗口根本不开，`_` 与 `P` 照旧是普通输入；开得了窗口的只有「完全不答」的
 * 假 PTY / 不透传报文的 mux，那种地方本来也不画图。
 */
const ESC = String.fromCharCode(0x1b)

/** 回音正文允许的字（只有可打印 ASCII）；出现集合外的字就不是回音，别一路吞下去 */
const BODY = '\\x20-\\x7e'
/**
 * 完整一条 APC/DCS：`ESC _ …` / `ESC P …`，ST 收尾。
 * 正文按定义不含 ESC，所以 `[^ESC]*` 就到头了；`|$` 让「一次 read 只送到半截」的也一起剔掉。
 */
const PACKET_RE = new RegExp(`${ESC}[_P][${BODY}]*(?:${ESC}\\\\|$)`, 'g')
/** DA1/DA2 整条（`[?62;4;18c` / `ESC[>0;4101;0c`）：带不带开头的 ESC 都算——人敲不出这个形状 */
const DA_RE = new RegExp(`^${ESC}?\\[[?>][0-9;]*c$`)
/** 夹在别的东西中间的 DA1/DA2：只认**带 ESC** 的，不带 ESC 的 `[?` 和搜索框里敲 `[?` 长得一样 */
const DA_SUB_RE = new RegExp(`${ESC}\\[[?>][0-9;]*c`, 'g')
/** APC / DCS 的开头碎片：`_`（`ESC _`）与 `P`（`ESC P`）——窗口里才吞 */
const OPEN_FRAG_RE = new RegExp(`^${ESC}?[_P]$`)
/** 回音正文的**开头形状**：kitty 应答 `Gi=<数字>…`、XTVERSION `>|<牌子> …`。对不上就说明刚才那个 `_`/`P` 是用户敲的 */
const BODY_START_RE = /^(?:Gi=\d|>)/
/** 带 ESC、没写完的 CSI（`\e[?62;4`）：整坨不是人敲的字，窗口里吞 */
const PARTIAL_CSI_RE = new RegExp(`^${ESC}\\[[?>][0-9;]*$`)
/** ST 碎片：写全的 `ESC \`，或被剥到只剩一根 `\`（窗口里才吞） */
const ST_FRAG_RE = new RegExp(`^(?:${ESC}[\\\\]|\\\\)$`)
const BODY_RE = new RegExp(`^[${BODY}]*$`)

/** 「回音还可能正在进来」的窗口：够慢终端（ssh）答完，又短到碰不到一次真实输入 */
export const GRACE_MS = 5_000
/** 开头碎片进来后，等多久还没等到 ST 就当你真敲了个 `_`：一条回音的碎片都在同一次 read 里 */
const PENDING_MS = 300

/** 窗口截止时刻（0 = 没开过） */
let guardUntil = 0
/** 吞一条回音吞到哪一步了：0 = 不在回音里；1 = 只见开头碎片（正文形状还没对上）；2 = 正文进行中（一路吞到 ST） */
let pending: 0 | 1 | 2 = 0
let pendingUntil = 0

function dropPending(): void {
  pending = 0
  pendingUntil = 0
}

/**
 * 探测**没读到 DA1**（回音没读全，随时可能迟到）时开窗口；`cli.tsx` 在 `render()` 前调用。
 * 读到 DA1 就不开：kitty 规范里 DA1 是最后一条回音，它到了后面就没有了。
 */
export function armReportGuard(ms: number = GRACE_MS): void {
  guardUntil = Date.now() + ms
}

/** 测试用：清掉全部状态 */
export function resetReportState(): void {
  guardUntil = 0
  dropPending()
}

/** 一次 stdin 事件进来：返回还该当字用（或当键用）的那部分，回报字节剔掉。会改状态。 */
function consume(input: string): string {
  const now = Date.now()

  if (pending !== 0) {
    if (now > pendingUntil) dropPending()
    else if (ST_FRAG_RE.test(input))
      dropPending() // 回音收尾
    else if (OPEN_FRAG_RE.test(input))
      return '' // 同一个事件的第二个 handler 又读了一遍开头
    else if (pending === 1 && !BODY_START_RE.test(input))
      dropPending() // 那不是回音，是用户敲的 `_`
    else if (BODY_RE.test(input)) {
      pending = 2
      return '' // 正文（可能还得分几段进来）
    } else dropPending()
  }

  if (DA_RE.test(input)) return ''
  const stripped = input.replace(PACKET_RE, '').replace(DA_SUB_RE, '')
  if (stripped !== input) return stripped

  if (now > guardUntil) return input
  // 开头/收尾碎片：窗口里才吞。收尾那根 `\\` **不看 pending** 也要吞——同一个事件会被每个
  // 活跃 handler 各读一次，第一个读到它时 pending 已经清了，第二个若改判「留下面」就会漏进输入框。
  if (ST_FRAG_RE.test(input)) return ''
  if (OPEN_FRAG_RE.test(input)) {
    pending = 1
    pendingUntil = now + PENDING_MS
    return ''
  }
  if (PARTIAL_CSI_RE.test(input)) return ''
  return input
}

/**
 * 把回报报文从一次输入里剔掉（文本输入与按键处都用；剔完可能还剩真按键）。
 * 状态机按**事件顺序**走，所以一次 stdin 事件的各个分片要按顺序过同一个函数（ink 就是这么给的）；
 * 同一个事件被多个活跃 handler 各读一次也安全——都在同一 tick，重复读只会得到同样的结论。
 */
export function stripReports(input: string): string {
  if (!input) return input
  return consume(input)
}
