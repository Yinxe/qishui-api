/**
 * 终端二维码（**带静区**）：把 API 交出来的扫码深链画成终端二维码，轮询状态直到确认。
 *
 * 二维码内容必须是 `https://bff-pc.qishui.com/…` 深链，**只能用「汽水音乐」App 扫**
 * （抖音扫不出来，见 qishui-api 的实测记录）。`qrcode-terminal` 是贴着边画的，一格留白都没有，
 * App 要对焦很久才认得出——官方 PNG 带 4 模块白边，这里同样补一圈留白；终端画不下时
 * 退化成不带留白的紧凑图，再不行就只给深链文本，不装作画得下（改窗口大小后按 r 重画）。
 * core 还把上游那张官方 PNG 落到了临时文件（`qrImage`），一并把路径显示出来。
 */
import { Box, Text } from 'ink'
import type { QishuiLogin } from 'qishui-core'
import qrcode from 'qrcode-terminal'
import { useEffect, useRef, useState } from 'react'
import { useCore } from '../core/context.js'
import { type UiValue, useUi } from '../ui/context.js'
import { displayWidth, truncate } from '../ui/format.js'
import { useKeys } from '../ui/keys.js'
import { isMouseInput, Pressable } from '../ui/mouse.js'
import { COLOR, GUTTER } from '../ui/theme.js'
import { ErrorState, Modal } from '../ui/widgets.js'

type Phase = 'loading' | 'waiting' | 'scanned' | 'confirmed' | 'expired' | 'failed'

const PHASE_TEXT: Record<Phase, string> = {
  loading: '正在获取二维码…',
  waiting: '等待扫码：用「汽水音乐」App 扫下面这个码',
  scanned: '已扫码，请在手机上确认登录',
  confirmed: '登录成功',
  expired: '二维码已过期（按 r 重新获取）',
  failed: '获取二维码失败',
}

const POLL_MS = 2000

/** 静区宽度（模块）。small 模式里 1 模块 = 2 个空格宽 / 1 行高 */
const QUIET_MODULES = 4

/**
 * 画二维码。`full` 带 4 模块静区（好识别），`compact` 不带（终端太矮时的退路）；
 * `width` 是码本身的宽度（静区是空格，不能拿它判断放不放得下）。
 */
function renderQr(url: string): { full: string[]; compact: string[]; width: number } {
  let art = ''
  qrcode.generate(url, { small: true }, (data: string) => {
    art = data
  })
  const body = art.split('\n').filter((line) => line.length > 0)
  const width = Math.max(...body.map((line) => displayWidth(line)))
  const frame = (modules: number): string[] => {
    if (modules <= 0) return body
    const padX = ' '.repeat(modules * 2)
    // 上下留白必须是**真空格**：ink 把零长 `<Text>` 压成 0 高（实测 `['','AB','']` 只出 1 行），空串等于没画
    const padY = ' '.repeat(width + modules * 2)
    return [
      ...Array.from({ length: modules }, () => padY),
      ...body.map((line) => `${padX}${line}${padX}`),
      ...Array.from({ length: modules }, () => padY),
    ]
  }
  return { full: frame(QUIET_MODULES), compact: frame(0), width }
}

export function LoginOverlay() {
  const { core } = useCore()
  const ui = useUi()
  const [phase, setPhase] = useState<Phase>('loading')
  const [url, setUrl] = useState<string>()
  const [qrImage, setQrImage] = useState<string>()
  const [error, setError] = useState<string>()
  const [nonce, setNonce] = useState(0)
  // ui 每次 toast/换页都是新对象，不能进 effect 依赖（否则登录一成功就重新发起一次）
  const uiRef = useRef<UiValue>(ui)
  uiRef.current = ui

  useKeys((input) => {
    if (isMouseInput(input)) return
    if (input === 'r') setNonce((n) => n + 1)
  })

  useEffect(() => {
    void nonce // 只当「重新发起」的触发器，值本身不参与
    const { toast, closeOverlay, bump } = uiRef.current
    if (!core) return
    let alive = true
    let timer: NodeJS.Timeout | undefined
    setPhase('loading')
    setUrl(undefined)
    setQrImage(undefined)
    setError(undefined)

    const poll = async (qr: QishuiLogin): Promise<void> => {
      if (!alive) return
      try {
        const status = await qr.status()
        if (!alive) return
        if (status === 'confirmed') {
          // status() 观测到 confirmed 时 core 已经把会话入库并激活了，这里只需要让界面重读
          setPhase('confirmed')
          if (!alive) return
          const snapshot = core.snapshot()
          toast(`登录成功：${snapshot.nickname ?? snapshot.uid ?? '身份未知'}`, 'success')
          bump()
          closeOverlay()
          return
        }
        if (status === 'expired' || status === 'timeout') {
          setPhase('expired')
          return
        }
        setPhase(status === 'scanned' ? 'scanned' : 'waiting')
      } catch (err) {
        if (!alive) return
        // 网络抖一下不值得中断整个登录：记下来继续轮询。
        // 「已扫码但入库失败」也走这里 —— core 会重试，所以必须把原因显示出来，别只当没看见
        setError(`登录流程出错（仍在重试）：${err instanceof Error ? err.message : String(err)}`)
      }
      timer = setTimeout(() => void poll(qr), POLL_MS)
    }

    void (async () => {
      try {
        const qr = await core.login({
          onQr: ({ scanUrl, qrImage: image }) => {
            if (!alive) return
            setUrl(scanUrl)
            setQrImage(image)
            setPhase('waiting')
          },
        })
        await poll(qr)
      } catch (err) {
        if (!alive) return
        setPhase('failed')
        setError(err instanceof Error ? err.message : String(err))
      }
    })()

    return () => {
      alive = false
      if (timer) clearTimeout(timer)
    }
  }, [core, nonce])

  if (!core) {
    return (
      <Modal title="扫码登录" footer="Esc 取消" width={56}>
        <Text dimColor>骨架模式 / core 尚未就绪，无法发起登录。</Text>
      </Modal>
    )
  }

  const qr = url ? renderQr(url) : undefined
  // 预算 = 标题 1 行 + 深链 1 行 + 官方图片路径 1 行 + 底部键位 1 行；
  // 放得下带静区的整图就用整图（识别快），否则退成不带静区的紧凑版
  const fits = (count: number): boolean => count > 0 && count + 4 <= ui.rows
  const qrLines = qr ? (fits(qr.full.length) ? qr.full : fits(qr.compact.length) ? qr.compact : []) : []
  // 二维码里同一行可能重复，key 用「行内容 + 第几次出现」，不用数组下标
  const seenLines = new Map<string, number>()
  const qrRows = qrLines.map((line) => {
    const count = (seenLines.get(line) ?? 0) + 1
    seenLines.set(line, count)
    return { key: `${line}|${count}`, line }
  })
  // 静区是空格，宽度要用码本身判断（否则永远「放得下」）
  const fitsCols = !qr || qrLines.length === 0 || qr.width + 2 <= ui.columns
  const showQr = qrLines.length > 0 && fitsCols

  return (
    <Box flexDirection="column" alignItems="center" justifyContent="center" width="100%" height="100%">
      <Text bold color={COLOR.accent} wrap="truncate-end">
        {phase === 'confirmed' ? '扫码登录 · 汽水音乐 App' : `扫码登录 · 汽水音乐 App | ${PHASE_TEXT[phase]}`}
      </Text>
      {phase === 'confirmed' ? <Text color={COLOR.success}>{PHASE_TEXT[phase]}</Text> : null}
      <Box flexDirection="column" alignItems="center">
        {showQr ? (
          <>
            {qrRows.map((row) => (
              <Text key={row.key}>{row.line}</Text>
            ))}
            <Text dimColor wrap="truncate-end">
              {truncate(url ?? '', Math.max(20, ui.columns - 6))}
            </Text>
          </>
        ) : url ? (
          <Box flexDirection="column" paddingX={GUTTER}>
            <Text dimColor>
              {fitsCols ? '终端太矮，二维码画不下（调高后按 r 重画）' : '终端太窄，二维码画不下（调宽后按 r 重画）'}
            </Text>
            <Text wrap="truncate-end">{truncate(url, Math.max(20, ui.columns - 6))}</Text>
          </Box>
        ) : (
          <Text dimColor>…</Text>
        )}
      </Box>
      {qrImage ? (
        <Box paddingX={GUTTER}>
          <Text dimColor wrap="truncate-end">
            {`识别慢就扫官方二维码图片：${truncate(qrImage, Math.max(20, ui.columns - 22))}`}
          </Text>
        </Box>
      ) : null}
      {error ? <ErrorState error={truncate(error, Math.max(20, ui.columns - 6))} /> : null}
      <Box gap={1}>
        <Pressable onPress={() => setNonce((n) => n + 1)}>
          <Text dimColor>r 重新获取</Text>
        </Pressable>
        <Pressable onPress={() => ui.closeOverlay()}>
          <Text dimColor>Esc 取消</Text>
        </Pressable>
      </Box>
    </Box>
  )
}
