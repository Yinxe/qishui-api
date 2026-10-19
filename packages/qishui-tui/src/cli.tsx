#!/usr/bin/env node
import { render } from 'ink'
import { App } from './App.js'
import { setTermCaps } from './ui/caps.js'
import { armReportGuard } from './ui/reports.js'
import { probeGraphics, shouldProbe } from './ui/termProbe.js'

// ink 的满屏帧走 clearTerminal（带 3J 清回滚），主屏上这么干会把用户自己的滚动历史抹掉。
// 切到备用屏，清屏只影响我们这块画布；退出时还原。非 TTY 不切。
const isTTY = process.stdout.isTTY === true
if (isTTY) {
  process.stdout.write('\u001B[?1049h')
}

// 图形能力在 render() **之前**问完：那时 stdin 上还没有任何 listener，回音不会和 ink 的按键读处理
// 抢同一份字节（`ui/termProbe.ts`）。`QISHUI_TUI_COVER` 已经写死走哪条路时整个跳过，不付这次停顿。
if (shouldProbe(process.env)) {
  const caps = await probeGraphics(process.stdin, process.stdout)
  setTermCaps(caps)
  // DA1 是最后一条回音：没读到它 = 还有回音可能落在 ink 接手之后，开窗口挡住那些被剥碎的碎片
  if (!caps.da1) armReportGuard()
}

// ink 默认把 Ctrl+C 当「立刻退出」，太容易在按 `c`/`C` 时误触（这程序里 `s`/`r`/`n`/`p` 都是单键命令）。
// 关掉它，改成「连按两次才退」——由 App.tsx 自己接（见那里的 `key.ctrl && input === 'c'`）。
const { waitUntilExit } = render(<App />, { exitOnCtrlC: false })

try {
  await waitUntilExit()
} finally {
  if (isTTY) {
    process.stdout.write('\u001B[?1049l')
  }
}
