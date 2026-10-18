/**
 * 本地库（`core.local`）离线单测：文件夹扫描 / 本地喜欢 / 本地歌单 / 本地文件播放 / 本地历史。
 * 全程零上游请求（mock fetch 只用来提供设备身份），文件都是临时目录里的空壳 `.mp3`。
 */
import fs from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createQishui, localKeyOf, parseFileName, type QishuiCore, scanFolder, trackFromFile } from '../dist/index.js'
import { createMockUpstream, MOCK_DEVICE } from './support/mockUpstream.js'
import { makeTempDir, rmDir } from './support/tmp.js'

let home: string
let music: string
let core: QishuiCore
let mock: ReturnType<typeof createMockUpstream>

/** 造一个空壳音频文件（扫描只看扩展名与路径，不读内容） */
function touch(file: string): string {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, '')
  return file
}

beforeEach(async () => {
  home = makeTempDir('qishui-local-')
  music = makeTempDir('qishui-local-music-')
  mock = createMockUpstream()
  core = await createQishui({ dataDir: home, device: MOCK_DEVICE, fetchImpl: mock.fetchImpl })
})

afterEach(() => {
  core.dispose()
  rmDir(home)
  rmDir(music)
})

describe('文件名与键', () => {
  it('parseFileName 去曲序、拆「艺人 - 歌名」', () => {
    expect(parseFileName('01 - 陈奕迅 - 浮夸.flac')).toEqual({ artist: '陈奕迅', name: '浮夸' })
    expect(parseFileName('07.晴天.mp3')).toEqual({ name: '晴天' })
    expect(parseFileName('A - B - C.mp3')).toEqual({ artist: 'A', name: 'B - C' })
    expect(parseFileName('无信息.m4a')).toEqual({ name: '无信息' })
  })

  it('trackFromFile：id 由路径算出（同文件恒定、不同文件不同），album 用目录名', () => {
    const file = touch(path.join(music, '专辑A', '02 - 歌手甲 - 第二首.mp3'))
    const track = trackFromFile(file)
    expect(track.id).toBe(localKeyOf(file))
    expect(track.id.startsWith('local:')).toBe(true)
    expect(track.localPath).toBe(file)
    expect(track.name).toBe('第二首')
    expect(track.artists.map((a) => a.name)).toEqual(['歌手甲'])
    expect(track.album?.name).toBe('专辑A')
    expect(trackFromFile(file).id).toBe(track.id)
    expect(trackFromFile(touch(path.join(music, '别的.mp3'))).id).not.toBe(track.id)
  })
})

describe('文件夹扫描', () => {
  it('递归收音频、跳过隐藏与不认识的扩展名、结果按路径稳定排序', async () => {
    touch(path.join(music, 'a.mp3'))
    touch(path.join(music, 'b.flac'))
    touch(path.join(music, 'cover.jpg'))
    touch(path.join(music, 'notes.txt'))
    touch(path.join(music, '.hidden.mp3'))
    touch(path.join(music, '.hidden-dir', 'c.mp3'))
    touch(path.join(music, 'sub', 'd.m4a'))
    touch(path.join(music, 'sub', 'deeper', 'e.opus'))

    const result = await scanFolder(music)
    expect(result.error).toBeUndefined()
    expect(result.truncated).toBe(false)
    expect(result.tracks.map((t) => path.basename(t.localPath ?? ''))).toEqual(['a.mp3', 'b.flac', 'd.m4a', 'e.opus'])
    expect(result.tracks.every((t) => t.mediaType === 'local')).toBe(true)
  })

  it('上限截断如实标记；目录不存在返回 error 而不是抛', async () => {
    for (let i = 0; i < 5; i++) touch(path.join(music, `t${i}.mp3`))
    const limited = await scanFolder(music, { limit: 2 })
    expect(limited.tracks.length).toBe(2)
    expect(limited.truncated).toBe(true)

    const missing = await scanFolder(path.join(music, '没有这个目录'))
    expect(missing.tracks).toEqual([])
    expect(missing.error).toBeTruthy()
  })

  it('core.local.scan 扫的就是登记的绝对路径；scanAll 汇总每个文件夹', async () => {
    touch(path.join(music, 'x.mp3'))
    await core.local.addFolder(music)
    const one = await core.local.scan(music)
    expect(one.tracks.length).toBe(1)
    const all = await core.local.scanAll()
    expect(all).toEqual([{ folder: path.resolve(music), count: 1, truncated: false, error: undefined }])
  })
})

describe('音乐文件夹', () => {
  it('addFolder 去重、落盘、给绝对路径；不存在的目录直接报错', async () => {
    await core.local.addFolder(music)
    await core.local.addFolder(music)
    expect(core.local.folders()).toEqual([{ path: path.resolve(music), name: path.basename(music), exists: true }])
    expect(core.local.stats().folders).toBe(1)

    await expect(core.local.addFolder(path.join(music, '不存在'))).rejects.toThrow(/找不到这个目录/)
    expect(core.local.folders().length).toBe(1)
  })

  it('文件夹删掉之后仍在册，但 exists=false（照实报「找不到」）', async () => {
    const gone = path.join(music, 'gone')
    fs.mkdirSync(gone)
    await core.local.addFolder(gone)
    fs.rmSync(gone, { recursive: true })
    expect(core.local.folders()[0].exists).toBe(false)
    expect(await core.local.removeFolder(gone)).toBe(true)
    expect(core.local.folders()).toEqual([])
  })
})

describe('本地喜欢', () => {
  it('toggleLike 收下本地文件与云端曲目的快照，likes() 新的在前且不联网', async () => {
    const file = touch(path.join(music, '一首.mp3'))
    const local = core.track(trackFromFile(file))
    const cloud = core.track({ id: '999', name: '云端那首', artists: [{ id: 'a', name: '歌手' }] })

    expect(await core.local.toggleLike(local)).toBe(true)
    expect(await core.local.toggleLike(cloud)).toBe(true)
    expect(core.local.isTrackLiked(local)).toBe(true)
    expect(core.local.likes().map((t) => t.name)).toEqual(['云端那首', '一首'])
    // 本地库全部同步读内存，一个上游请求都不该发
    expect(mock.count()).toBe(0)

    expect(await core.local.toggleLike(local)).toBe(false)
    expect(core.local.likes().map((t) => t.name)).toEqual(['云端那首'])
  })

  it('落盘到 local/library.json，重开 core 读得回来（跨账号共享同一份）', async () => {
    const file = touch(path.join(music, '持久.mp3'))
    await core.local.like(core.track(trackFromFile(file)))
    expect(fs.existsSync(path.join(home, 'local', 'library.json'))).toBe(true)

    core.dispose()
    core = await createQishui({ dataDir: home, device: MOCK_DEVICE, fetchImpl: mock.fetchImpl })
    const likes = core.local.likes()
    expect(likes.length).toBe(1)
    expect(likes[0].data.localPath).toBe(file)
    expect(likes[0].data.raw).toBeUndefined() // 快照不留上游原始响应
  })
})

describe('本地歌单', () => {
  it('新建 / 加曲目（去重）/ 移除 / 改名 / 删除', async () => {
    const a = core.track(trackFromFile(touch(path.join(music, 'a.mp3'))))
    const b = core.track(trackFromFile(touch(path.join(music, 'b.mp3'))))
    const playlist = await core.local.createPlaylist('  通勤  ')
    expect(playlist.title).toBe('通勤')

    expect(await core.local.addToPlaylist(playlist.id, [a, b, a])).toBe(2)
    expect(core.local.playlistTracks(playlist.id).map((t) => t.name)).toEqual(['a', 'b'])

    expect(await core.local.removeFromPlaylist(playlist.id, core.local.keyOf(b))).toBe(true)
    expect(core.local.playlistTracks(playlist.id).map((t) => t.name)).toEqual(['a'])

    expect((await core.local.renamePlaylist(playlist.id, '深夜')).title).toBe('深夜')
    expect(await core.local.deletePlaylist(playlist.id)).toBe(true)
    expect(core.local.playlists()).toEqual([])
    await expect(core.local.renamePlaylist(playlist.id, 'x')).rejects.toThrow(/没有这张本地歌单/)
  })

  it('空名字挡在本地（不去撞上游）', async () => {
    await expect(core.local.createPlaylist('   ')).rejects.toThrow(/歌单名不能为空/)
    expect(mock.count()).toBe(0)
  })
})

describe('本地文件播放', () => {
  it('localPath 的曲目直接把磁盘路径当播放源，不解析上游地址；历史记下 source=local + path', async () => {
    const file = touch(path.join(music, '播这首.mp3'))
    const track = core.track(trackFromFile(file))
    await core.player.play(track)
    try {
      expect(core.player.state.status).toBe('playing')
      expect(core.player.state.source).toMatchObject({ kind: 'local', path: file })
      const record = core.history.recent(1)[0]
      expect(record).toMatchObject({ source: 'local', path: file, trackId: track.id })
      expect(mock.count()).toBe(0)
    } finally {
      core.player.stop()
    }
  })

  it('文件被删了就报「本地文件不在了」，不去撞上游分享页', async () => {
    const file = touch(path.join(music, '待删.mp3'))
    const track = core.track(trackFromFile(file))
    fs.rmSync(file)
    await core.player.play(track)
    expect(core.player.state.status).toBe('error')
    expect(core.player.state.error).toContain('本地文件不在了')
    expect(mock.count()).toBe(0)
  })

  it('本地曲目没有上游歌词：lyricsFor 直接回 undefined', async () => {
    const track = core.track(trackFromFile(touch(path.join(music, 'lyric.mp3'))))
    expect(await core.player.lyricsFor(track)).toBeUndefined()
    expect(mock.count()).toBe(0)
  })
})

describe('本地历史（曲目视图）', () => {
  it('history() 从 journal 拼出曲目：本地文件带 localPath，云端曲目只有 id', async () => {
    const file = touch(path.join(music, '听过的.mp3'))
    await core.player.play(core.track(trackFromFile(file)))
    core.player.stop()
    await core.history.append(
      { id: '888', name: '云端听过的', artists: [{ id: 'a', name: '歌手' }] },
      { source: 'remote' },
    )

    const list = core.local.history(10)
    expect(list.map((t) => t.name)).toEqual(['云端听过的', '听过的'])
    expect(list[0].data.localPath).toBeUndefined()
    expect(list[1].data.localPath).toBe(file)
  })
})
