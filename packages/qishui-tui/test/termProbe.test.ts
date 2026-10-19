/**
 * `probeGraphics` 的离线单测：喂假 stdin/stdout，**不开真终端**。
 *
 * 这条闸守的是三件容易坏的事：
 *  1. 回音收到 DA1 就该收工（不等时限），并且**没解完的尾巴要退回 stdin**——不退或退晚了，
 *     ink 接手后就会把半截回音当按键派发（`ui/reports.ts` 挡的那档子事）；
 *  2. 没人答（假 PTY / 老终端 / mux 不透传）也**一定**要 resolve，别把启动卡死；
 *  3. raw mode 只在「是我们开的」时才关——ink 之后自己会开，顺手替它关会把它的输入一起弄坏。
 */
import { EventEmitter } from 'node:events'
import { describe, expect, it } from 'vitest'
import { resetTermCaps, setTermCaps, type TermCaps, termCaps } from '../dist/ui/caps.js'
import { coverMode } from '../dist/ui/cover.js'
import { PROBE_ID, parseCapsReply, probeGraphics, probeQueries } from '../dist/ui/termProbe.js'

const ESC = String.fromCharCode(0x1b)
const ST = `${ESC}\\`

type FakeStream = ReturnType<typeof fakeStream>

/** 假 stdin / stdout：只实现 probeGraphics 用到的那几个成员（默认是 TTY，用例里按需改） */
function fakeStream() {
  const stream = Object.assign(new EventEmitter(), {
    isTTY: true,
    isRaw: false,
    rawToggles: [] as boolean[],
    unshifted: [] as string[],
    written: [] as string[],
    setRawMode(next: boolean) {
      stream.isRaw = next
      stream.rawToggles.push(next)
      return stream
    },
    unshift(chunk: string) {
      stream.unshifted.push(chunk)
    },
    write(chunk: string) {
      stream.written.push(chunk)
      return true
    },
  })
  return stream
}

/** 终端把三条查询答全（kitty 应答 + XTVERSION + DA1），回音后面还跟着用户已经敲下的 `j` */
const FULL_REPLY = `${ESC}_Gi=${PROBE_ID},s=1,v=1,a=q,t=d,f=24;OK${ST}${ESC}P>|ghostty 1.2.3${ST}${ESC}[?62;4;18cj`

describe('probeGraphics', () => {
  it('答全了就以 DA1 收工：能力解出来、尾巴退回 stdin、raw mode 关回原样', async () => {
    const stdin: FakeStream = fakeStream()
    const stdout = fakeStream()
    const pending = probeGraphics(stdin as never, stdout as never, 5_000)
    // 查询是「先发出去」的，回音要在写完之后才进来
    await new Promise((resolve) => setImmediate(resolve))
    expect(stdout.written.join('')).toBe(probeQueries())
    stdin.emit('data', Buffer.from(FULL_REPLY, 'utf8'))
    const caps = await pending

    expect(caps).toEqual<TermCaps>({ kgp: true, brand: 'ghostty', sixel: true, da1: true, probed: true })
    // `j` 不是回音：原样退回，ink 才看得见这一下按键
    expect(stdin.unshifted).toEqual(['j'])
    expect(stdin.rawToggles).toEqual([true, false])
    expect(stdin.isRaw).toBe(false)
  })

  it('没人答（mux / 假 PTY）到时限就收工：probed 为 false，选路退回环境变量兜底', async () => {
    const stdin = fakeStream()
    const started = Date.now()
    const caps = await probeGraphics(stdin as never, fakeStream() as never, 30)
    expect(Date.now() - started).toBeLessThan(2_000)
    expect({ kgp: caps.kgp, da1: caps.da1, probed: caps.probed }).toEqual({ kgp: false, da1: false, probed: false })
    expect(stdin.unshifted).toEqual([])
    expect(stdin.rawToggles).toEqual([true, false])
  })

  it('ink 已经开了 raw mode 就别替它关（我们只是借用，收尾该归它）', async () => {
    const stdin = fakeStream()
    stdin.isRaw = true
    await probeGraphics(stdin as never, fakeStream() as never, 10)
    expect(stdin.rawToggles).toEqual([])
  })

  it('stdin / stdout 任一不是 TTY：一个字节都不发（管道里跑别把查询串喷进输出）', async () => {
    const stdin = fakeStream()
    stdin.isTTY = false
    const stdout = fakeStream()
    const caps = await probeGraphics(stdin as never, stdout as never, 10)
    expect(stdout.written).toEqual([])
    expect(caps).toEqual(parseCapsReply('').caps)

    const out = fakeStream()
    out.isTTY = false
    await probeGraphics(fakeStream() as never, out as never, 10)
    expect(out.written).toEqual([])
  })

  it('回音分好几次 read 进来也认（终端不会一次写完）', () => {
    const chunks = [`${ESC}_Gi=${PROBE_ID},s=1,v=1,a=q,t=d,f=24;O`, `K${ST}${ESC}[?62;4`, `;18c`]
    let buffer = ''
    let caps = parseCapsReply('').caps
    for (const chunk of chunks) {
      buffer += chunk
      caps = parseCapsReply(buffer).caps
    }
    expect({ kgp: caps.kgp, sixel: caps.sixel, da1: caps.da1, probed: caps.probed }).toEqual({
      kgp: true,
      sixel: true,
      da1: true,
      probed: true,
    })
  })
})

describe('termCaps 单例', () => {
  it('探测结果写进去，封面选路读的就是这一份（不经 React：`coverMode` 的默认参数取它）', () => {
    const caps: TermCaps = { kgp: true, brand: 'contour', sixel: false, da1: true, probed: true }
    setTermCaps(caps)
    expect(termCaps()).toEqual(caps)
    expect(coverMode({})).toBe('kitty')
    resetTermCaps()
    expect(coverMode({})).toBe('ansi')
  })
})
