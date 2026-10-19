/**
 * 播放条那一句「出声失败」的离线单测：宽度取舍（`noteWidthOf`）+ mpv 报错该归给哪一首。
 *
 * 都不起 core、不出网：`AudioSink` 只喂一个不存在的播放器路径，看它报几次错。
 */
import { afterEach, describe, expect, it } from 'vitest'
import { noteWidthOf } from '../dist/components/PlayerBar.js'
import { AudioSink } from '../dist/core/mpv.js'

describe('noteWidthOf：报错那一格占几列', () => {
  const long = '找不到播放器：mpv（装 mpv，或用 QISHUI_PLAYER 指定）'

  it('没有报错就没有这一格', () => {
    expect(noteWidthOf(undefined, 200)).toBe(0)
    expect(noteWidthOf('', 200)).toBe(0)
  })

  it('宽终端里最多让 24 列，剩下的还给曲名与进度条', () => {
    expect(noteWidthOf(long, 80)).toBe(24)
  })

  it('窄到凑不出「报错 8 + 曲名 4 + 进度 2」就这一帧不说：定高布局里折行会把提示行顶出屏外', () => {
    // room 13 = 8 + 4 + 2 的下限再加一格间距都不够
    expect(noteWidthOf(long, 13)).toBe(0)
    expect(noteWidthOf(long, 0)).toBe(0)
  })

  it('短句按自己的宽度占位（不照 24 列硬留白）', () => {
    expect(noteWidthOf('这个源没地址', 80)).toBe(12)
  })
})

describe('AudioSink：起播报错归给哪一首', () => {
  const prevPlayer = process.env.QISHUI_PLAYER

  afterEach(() => {
    if (prevPlayer === undefined) delete process.env.QISHUI_PLAYER
    else process.env.QISHUI_PLAYER = prevPlayer
  })

  it('被下一次 `start` 顶掉的那个进程，它的故障不算在新一首头上（只报一次）', async () => {
    process.env.QISHUI_PLAYER = '/nonexistent-mpv-for-qishui-test'
    const sink = new AudioSink()
    const notes: string[] = []
    sink.onError = (message) => notes.push(message)
    // 两次 `start` 同一拍发出：第一次那个子进程的 ENOENT 回报落在第二次之后 —— 老代码把它
    // 也报成「这一首的问题」，于是切歌快时上一首的报错会贴到新一首脸上。
    void sink.start({ kind: 'remote', url: 'http://127.0.0.1:1/a' })
    void sink.start({ kind: 'remote', url: 'http://127.0.0.1:1/b' })
    await new Promise((resolve) => setTimeout(resolve, 300))
    expect(notes).toHaveLength(1)
    expect(notes[0]).toContain('找不到播放器')
    await sink.stop()
  })
})
