/**
 * 终端二维码。
 *
 * 登录二维码的内容是 `https://bff-pc.qishui.com/…` 深链，**必须用汽水音乐 App 扫**
 * （抖音扫不出来，见 qishui-api 的实测记录）。core 只把 `scanUrl` 交出来，渲染是这一层的事。
 */
import qrcode from 'qrcode-terminal'
import { dim } from './output.js'

/**
 * 二维码四周的留白（静区，单位：模块）。`qrcode-terminal` 贴着边画、一格留白都不给，
 * App 要反复对焦才认得出码——官方那张 PNG 是带留白的，这里补上同样的余量。
 * small 模式一个模块 = 2 个空格宽 / 1 行高，所以横向要乘 2。
 */
const QUIET_MODULES = 4

export function renderQr(text: string): void {
  qrcode.generate(text, { small: true }, (art: string) => {
    const margin = ' '.repeat(QUIET_MODULES * 2)
    const body = art
      .split('\n')
      .filter((line) => line.length > 0)
      .map((line) => `${margin}${line}`)
    const pad = Array.from({ length: QUIET_MODULES }, () => '')
    const framed = [...pad, ...body, ...pad].map((line) => `  ${line}`).join('\n')
    process.stdout.write(`${framed}\n`)
  })
}

/** 数据中心 + 过期时间的一行提示 */
export function qrHint(scanUrl: string, expiresAt: number): string {
  const seconds = Math.max(0, Math.round((expiresAt - Date.now()) / 1000))
  return dim(`用「汽水音乐」App 扫码（${seconds}s 内有效）  ${scanUrl}`)
}

/** core 已把上游官方 PNG 存成临时文件；终端里识别慢时，点开这张扫 */
export function qrImageHint(qrImage?: string): string | undefined {
  return qrImage ? dim(`识别慢就扫官方二维码图片：${qrImage}`) : undefined
}
