#!/usr/bin/env node
import { render } from 'ink'
import { App } from './App.js'

// ink 的满屏帧走 clearTerminal（带 3J 清回滚），主屏上这么干会把用户自己的滚动历史抹掉。
// 切到备用屏，清屏只影响我们这块画布；退出时还原。非 TTY 不切。
const isTTY = process.stdout.isTTY === true
if (isTTY) {
  process.stdout.write('\u001B[?1049h')
}

const { waitUntilExit } = render(<App />)

try {
  await waitUntilExit()
} finally {
  if (isTTY) {
    process.stdout.write('\u001B[?1049l')
  }
}
