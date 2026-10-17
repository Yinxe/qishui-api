/**
 * 终端二维码。
 *
 * 登录二维码的内容是 `https://bff-pc.qishui.com/…` 深链，**必须用汽水音乐 App 扫**
 * （抖音扫不出来，见 qishui-api 的实测记录）。core 只把 `scanUrl` 交出来，渲染是这一层的事。
 */
import qrcode from 'qrcode-terminal'
import { dim } from './output.js'

export function renderQr(text: string): void {
  qrcode.generate(text, { small: true }, (art: string) => {
    const indented = art
      .split('\n')
      .filter((line) => line.length > 0)
      .map((line) => '  ' + line)
      .join('\n')
    process.stdout.write(indented + '\n')
  })
}

/** 数据中心 + 过期时间的一行提示 */
export function qrHint(scanUrl: string, expiresAt: number): string {
  const seconds = Math.max(0, Math.round((expiresAt - Date.now()) / 1000))
  return dim(`用「汽水音乐」App 扫码（${seconds}s 内有效）  ${scanUrl}`)
}
