/**
 * 终端能力（本次进程启动时探一次，之后只读）。
 *
 * 单独一个模块而不是塞进 `ui/context.tsx`：`ui/cover.ts` 要在不依赖 React 的情况下读它（`test/cover.test.ts`
 * 喂假能力就能离线验选路），而探测本身发生在 `cli.tsx` 里 `render()` **之前**——那时还没有 provider。
 */
export interface TermCaps {
  /** 会答 kitty 图形协议的查询（`ESC_G…a=q…` 回了 `OK`）——**不等于**支持 unicode 占位符 */
  kgp: boolean
  /** `ESC[>q`（XTVERSION）报回来的牌子，小写（`kitty` / `ghostty` / `konsole`…）；没探到就 undefined */
  brand?: string
  /** DA1 回音里带 `;4;`（会解 Sixel）。本轮只作为「读到收尾了」的判据与设置页展示，不参与选路 */
  sixel: boolean
  /** 收到过 DA1 回音。kitty 规范把 DA1 当**最后一条**回音：它到了就没有还在路上的回音，`cli.tsx` 因此不用开回报窗口 */
  da1: boolean
  /** 真的发过查询并且至少收到一条回音（false = 没探/没人答，选路退回环境变量兜底） */
  probed: boolean
}

const empty: TermCaps = { kgp: false, sixel: false, da1: false, probed: false }

let caps: TermCaps = empty

/** 探测结果写进来（`cli.tsx` 在 `render()` 之前调用） */
export function setTermCaps(next: TermCaps): void {
  caps = next
}

export function termCaps(): TermCaps {
  return caps
}

/** 测试用：退回「没探过」 */
export function resetTermCaps(): void {
  caps = empty
}
