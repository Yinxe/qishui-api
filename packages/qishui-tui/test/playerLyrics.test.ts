/**
 * 歌词窗口的**取景**：`LyricsView` 只负责「把固定行数的窗口画出来」，
 * 居中那半（`start = 居中句 - 行数/2`、上下留白）在 `Player.tsx` 里算。
 * 这里用 ink 真渲染一帧，验三件事：
 *  1. 正在唱的那句落在窗口**正中**（第 (height-1)/2 行）；
 *  2. 歌刚开头（居中句 0）时，上面几行是留白、不是从第 0 句顶到最上面；
 *  3. 没歌词时也占满 height 行（提示句在正中），高度不缩、下面的布局不跳。
 */
import { PassThrough } from 'node:stream'
import { render } from 'ink'
import type { Lyrics } from 'qishui-core'
import { createElement } from 'react'
import { expect, it } from 'vitest'
import { LyricsView } from '../dist/screens/Player.js'

const lyricsOf = (count: number): Lyrics =>
  ({
    lines: Array.from({ length: count }, (_, i) => ({ text: `第${i}句`, startMs: i * 1000, credit: false })),
  }) as Lyrics

/** 真渲染一帧，拿回「按行切开、去掉 ANSI」的文本 */
async function draw(node: ReturnType<typeof createElement>): Promise<string[]> {
  const out = new PassThrough() as unknown as NodeJS.WriteStream
  let buffer = ''
  out.on('data', (chunk: Buffer | string) => {
    buffer += chunk.toString()
  })
  const app = render(node, { stdout: out, patchConsole: false })
  await new Promise((resolve) => setTimeout(resolve, 80))
  app.unmount()
  return buffer
    .replace(/\p{Control}\[[0-9;?]*[a-zA-Z]/gu, '')
    .split('\n')
    .map((line) => line.replace(/\r/g, '').trimEnd())
}

it('歌词窗口：正在唱的那句在正中，上下各有上下文', async () => {
  const height = 7
  const activeIndex = 12
  const start = activeIndex - Math.floor(height / 2) // 与 Player.tsx 同一口径
  const rows = await draw(
    createElement(LyricsView, { lyrics: lyricsOf(30), activeIndex, songMs: 12_500, start, height }),
  )
  const window = rows.slice(0, height)
  expect(window).toHaveLength(height)
  // 正中那行是当前句，且带 `>` 前缀（与列表页同一套「当前」标记）
  expect(window[Math.floor(height / 2)]).toBe('> 第12句')
  // 上下各三句
  expect(window[0]).toContain('第9句')
  expect(window[height - 1]).toContain('第15句')
})

it('歌词窗口：歌刚开头时上面留白，当前句仍在正中（不是顶到第一行）', async () => {
  const height = 7
  const start = 0 - Math.floor(height / 2) // 居中句 0 → 起点 -3
  const rows = await draw(
    createElement(LyricsView, { lyrics: lyricsOf(30), activeIndex: 0, songMs: 200, start, height }),
  )
  const window = rows.slice(0, height)
  expect(window).toHaveLength(height)
  expect(window[0].trim()).toBe('')
  expect(window[1].trim()).toBe('')
  expect(window[2].trim()).toBe('')
  expect(window[3]).toBe('> 第0句')
})

it('歌词窗口：没歌词也占满整块高度，提示句落在正中', async () => {
  const height = 7
  const rows = await draw(
    createElement(LyricsView, { lyrics: undefined, activeIndex: -1, songMs: 0, start: 0, height }),
  )
  const window = rows.slice(0, height)
  expect(window).toHaveLength(height)
  expect(window[Math.floor(height / 2)]).toContain('没有歌词')
  expect(window[0].trim()).toBe('')
})
