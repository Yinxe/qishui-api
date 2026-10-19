/**
 * 封面组件：包一层 `ui/cover.ts` 的取图 + 解码，把结果画成 ink 能画的形状。
 *  - kitty 图形协议：正文画占位符（前景色 = 图片 id），原图在 effect 里单独发一次给终端；
 *    占位符是普通文字，ink 每帧重画时图会跟着占位符走，不会被擦掉。整块拼成**一个** Text
 *    （占位符共用同一个前景色），免得每行一个节点。
 *  - ANSI 半块：把每格的 fg/bg 还原成 `<Text color backgroundColor>`；同色的连续格并成一个 span，
 *    再把各行用换行拼进同一个 Text —— 一张小封面几十个节点，配 `memo` 挡住进度事件带来的无谓重画。
 *
 * 取字节先问本地（`load`：core 媒体缓存里已经落盘的封面），没有才拿 `url` 上网拉；`cacheKey` 给曲目/用户
 * id，这样换页不重解、只有尺寸变了才重解。
 *
 * 拿不到图（没缓存 / 无 chafa / 离线）：给了 `onEmpty` 就什么都不画（调用方同步把这块位置收掉，
 * 不留空白）；没给才画一块等高的 `[封面]` 占位，布局不跳。
 */
import { Box, Text, useStdout } from 'ink'
import { memo, type ReactNode, useEffect, useRef, useState } from 'react'
import { termCaps } from '../ui/caps.js'
import {
  acquireCoverImage,
  type CoverArt,
  type CoverCell,
  coverMode,
  idColor,
  releaseCoverImage,
  renderCover,
} from '../ui/cover.js'

interface Span {
  text: string
  fg?: string
  bg?: string
}

/** 同 fg/bg 的连续格并成一个 Text，免得一张封面几百个节点 */
function spans(cells: CoverCell[]): Span[] {
  const out: Span[] = []
  let current: Span | undefined
  for (const cell of cells) {
    if (current && current.fg === cell.fg && current.bg === cell.bg) {
      current.text += cell.ch
      continue
    }
    current = { text: cell.ch, fg: cell.fg, bg: cell.bg }
    out.push(current)
  }
  return out
}

/** ANSI 半块：逐行摊平成一串 span（行间塞换行），这样只有一个 `<Text>` 顶层节点 */
function ansiNodes(rows: CoverCell[][]): ReactNode[] {
  const nodes: ReactNode[] = []
  rows.forEach((cells, rowIndex) => {
    if (rowIndex > 0) nodes.push('\n')
    spans(cells).forEach((span, spanIndex) => {
      nodes.push(
        // biome-ignore lint/suspicious/noArrayIndexKey: 定长静态格子，行/列号就是稳定标识（永不失序）
        <Text key={`${rowIndex}:${spanIndex}`} color={span.fg} backgroundColor={span.bg}>
          {span.text}
        </Text>,
      )
    })
  })
  return nodes
}

export const Cover = memo(function Cover({
  url,
  cols,
  rows,
  onEmpty,
  cacheKey,
  load,
}: {
  url?: string
  cols: number
  rows: number
  /** 确认拿不到图（没 url / 没 chafa / 拉取失败）时回调一次——调用方据此把这块位置整个收掉 */
  onEmpty?: () => void
  /** 缓存键（曲目/用户 id）：同一张图换页不重解，只有尺寸变了才重解 */
  cacheKey?: string
  /** 本地字节优先（core 媒体缓存里已落盘的封面），拿不到再走 `url` */
  load?: () => Promise<Buffer | undefined>
}) {
  const { stdout } = useStdout()
  const [art, setArt] = useState<CoverArt | undefined>()
  const mode = coverMode(process.env, termCaps())
  // 回调放 ref：调用方每帧新建闭包也不影响 effect 的依赖（否则会来回重取）
  const emptyRef = useRef(onEmpty)
  emptyRef.current = onEmpty
  // 取字节的 loader 同理：它闭包的东西已经由 `cacheKey` 代表，身份变了才该重取
  const loadRef = useRef(load)
  loadRef.current = load

  useEffect(() => {
    let alive = true
    setArt(undefined)
    if (mode === 'off' || (!url && !loadRef.current)) {
      emptyRef.current?.()
      return
    }
    void renderCover(url ?? '', cols, rows, mode, { key: cacheKey, loadBytes: loadRef.current }).then((next) => {
      if (!alive) return
      setArt(next)
      if (!next) emptyRef.current?.()
    })
    return () => {
      alive = false
    }
  }, [url, cols, rows, mode, cacheKey])

  // kitty：原图只发一次；终端把它挂在图片 id 上，正文占位符按 id 找到它。
  // 引用计数归零才发删除——几处共用同一 id 时，少一次就把还在显示的那张擦掉了。
  useEffect(() => {
    if (art?.kind !== 'kitty') return
    acquireCoverImage(art.id)
    stdout.write(art.transmit)
    return () => {
      releaseCoverImage(art.id, (chunk) => {
        stdout.write(chunk)
      })
    }
  }, [art, stdout])

  if (art?.kind === 'kitty') {
    // 占位符共用图片 id 当前景色（kitty 从前景色里读 id），整块一个 Text
    return (
      <Box flexShrink={0}>
        <Text color={idColor(art.id)} wrap="truncate-end">
          {art.grid.join('\n')}
        </Text>
      </Box>
    )
  }

  if (art?.kind === 'ansi') {
    return (
      <Box flexShrink={0}>
        <Text wrap="truncate-end">{ansiNodes(art.rows)}</Text>
      </Box>
    )
  }

  // 没图：调用方收得掉这块就什么都不画（不留空白），收不掉才画等高占位、布局不跳
  if (onEmpty) return null

  const mid = Math.floor(rows / 2)
  const blank = ' '.repeat(Math.max(0, cols))
  const label = '[封面]'.padStart(Math.floor((Math.max(2, cols) + 4) / 2), ' ').padEnd(Math.max(0, cols))
  const lines = Array.from({ length: rows }, (_, index) => (index === mid ? label : blank))
  return (
    <Box flexShrink={0}>
      <Text dimColor wrap="truncate-end">
        {lines.join('\n')}
      </Text>
    </Box>
  )
})
