/**
 * qishui-core 端到端冒烟（真打上游，谨慎跑）。
 *
 * 覆盖：会话迁移/复用 → 账号 → 曲库（批量 hydration + 缓存命中零请求）→ 搜索 → 发现/榜单
 *      → 评论读 → 播放器状态机 → 媒体落盘/断点/校验 → 本地历史 → 缓存统计/清理。
 *
 * 用独立的测试数据目录（默认 /tmp/opencode/qishui-test-home），不碰 ~/.qishui；
 * 会话从 packages/qishui-api 那份 device/session 迁移过来（只读源文件）。
 *
 *   node --experimental-strip-types packages/qishui-core/test/smoke.ts
 *   QISHUI_TEST_HOME=/tmp/x node --experimental-strip-types packages/qishui-core/test/smoke.ts
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createQishui, RiskControlError, type QishuiCore } from '../dist/index.js'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const API_DIR = path.resolve(HERE, '../../qishui-api')
const HOME = process.env.QISHUI_TEST_HOME?.trim() || '/tmp/opencode/qishui-test-home'

/** 实测上下文（id 取自 qishui-api/test/catalog.ts 与已落样张） */
const CTX = {
  trackId: '7068138081588611073',
  /** 另一首真实曲目（专辑 7068138079545985025 的第 1 首） */
  trackId2: '7168965360136226827',
  albumId: '7068138079545985025',
  artistId: '6810215791951087618',
  playlistId: '7031081053599238175',
  userId: '4075251663115050',
}

let failures = 0
let step = 0
let fetchCount = 0

function ok(label: string): void {
  console.log(`  ✓ ${label}`)
}
function fail(label: string, detail: unknown): void {
  failures++
  console.error(`  ✗ ${label}\n      ${detail instanceof Error ? detail.message : String(detail)}`)
}
async function check<T>(label: string, run: () => Promise<T>, assert?: (value: T) => void): Promise<T | undefined> {
  step++
  try {
    const value = await run()
    assert?.(value)
    ok(label)
    return value
  } catch (err) {
    fail(label, err)
    return undefined
  }
}

/**
 * 允许「上游风控」这种非 bug 的结果：`RiskControlError`（社交接口连打即 captcha）不算失败，
 * 打一行 warn 记下来就好。其余错误照常算失败。
 */
async function checkSoft<T>(label: string, run: () => Promise<T>, assert?: (value: T) => void): Promise<T | undefined> {
  step++
  try {
    const value = await run()
    assert?.(value)
    ok(label)
    return value
  } catch (err) {
    if (err instanceof RiskControlError) {
      console.log(`  ⚠ ${label}\n      上游风控拦下（${err.message.slice(0, 60)}）—— 这是预期行为，不算失败`)
      return undefined
    }
    fail(label, err)
    return undefined
  }
}
function expect(condition: unknown, message: string): void {
  if (!condition) throw new Error(message)
}
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** 计数 fetch：用来证明「命中缓存时零请求」 */
const countingFetch: typeof fetch = (input, init) => {
  fetchCount++
  return fetch(input, init)
}

async function main(): Promise<void> {
  console.log(`qishui-core smoke —— 数据目录 ${HOME}`)
  fs.rmSync(HOME, { recursive: true, force: true })

  let core: QishuiCore | undefined
  try {
    core = await check('createQishui()（首次注册设备 + 落盘）', () =>
      createQishui({
        dataDir: HOME,
        fetchImpl: countingFetch,
        logger: process.env.QISHUI_TEST_VERBOSE ? (line) => console.error(`      · ${line}`) : undefined,
      }),
    )
    if (!core) return

    await check('session.importFrom() 迁移 device/session', async () => {
      const result = await core!.session.importFrom({
        deviceFile: path.join(API_DIR, 'qishui-device.json'),
        sessionFile: path.join(API_DIR, 'qishui-session.json'),
      })
      expect(result.imported, '没迁移到任何东西（源文件在吗？）')
    })
    await check('snapshot() 已登录', async () => {
      const snapshot = core!.snapshot()
      expect(snapshot.loggedIn, `未登录：${snapshot.sessionFile}`)
      console.log(`      uid=${snapshot.uid ?? '?'} nickname=${snapshot.nickname ?? '?'}`)
    })

    // ------------------------------------------------------------ 账号
    const me = await check('account.me()', () => core!.account.me(), (value) => {
      expect(value.user.id, 'my_info 里没有 id')
      expect(core!.uid === value.user.id, `uid 没被记住：${core!.uid} vs ${value.user.id}`)
    })
    await check('account.stats()', async () => {
      const stats = await core!.account.stats()
      expect(stats.liked !== undefined || stats.following !== undefined, '统计字段全空')
    })
    await check('account.membership()', () => core!.account.membership(), (value) => {
      expect(typeof value.isVip === 'boolean', 'is_vip 不是布尔')
    })
    await check('account.privacy()', () => core!.account.privacy(), (value) => {
      expect(value.followInfoVisibility !== undefined, 'privacy_setting 空')
    })
    await check('account.blockList()', async () => {
      await core!.account.blockList({ count: 5 })
    })

    // ------------------------------------------------------------ 曲库
    const track = await check('catalog.track() 单首（MGetMedia）', () => core!.catalog.track(CTX.trackId), (value) => {
      expect(value.data.name, '曲目没有 name')
      expect(value.data.artists.length > 0, '曲目没有 artists')
    })
    if (track) console.log(`      ${track.toString()}  ${track.durationMs}ms`)

    await check('catalog.tracks() 批量 + 去重 + 顺序', async () => {
      const list = await core!.catalog.tracks([CTX.trackId, CTX.trackId2, CTX.trackId])
      expect(list.length === 2, `去重后应有 2 首，实际 ${list.length}`)
      expect(list[0].id === CTX.trackId, '顺序没有保持入参顺序')
    })
    step++
    const before = fetchCount
    await core!.catalog.tracks([CTX.trackId, CTX.trackId2])
    if (fetchCount === before) ok(`磁盘缓存命中零请求（fetch 调用数不变：${before}）`)
    else fail('磁盘缓存命中零请求', `多打了 ${fetchCount - before} 次 fetch`)

    await check('catalog.albumTracks()', async () => {
      const tracks = await core!.catalog.albumTracks(CTX.albumId)
      expect(tracks.length > 0, '专辑曲目为空')
      console.log(`      ${tracks.length} 首，专辑=${tracks[0].data.album?.name}`)
    })
    await check('catalog.artist() + artistTracks() + artistAlbums()', async () => {
      const artist = await core!.catalog.artist(CTX.artistId)
      expect(artist.data.name, '艺人没有 name')
      const tracks = await core!.catalog.artistTracks(CTX.artistId, { count: 5 })
      expect(tracks.items.length > 0, '艺人曲目为空')
      const albums = await core!.catalog.artistAlbums(CTX.artistId, { count: 5 })
      console.log(`      ${artist.data.name}：${tracks.items.length} 首 / ${albums.items.length} 张专辑`)
    })
    await check('catalog.playlist() + playlistTracks()', async () => {
      const playlist = await core!.catalog.playlist(CTX.playlistId)
      expect(playlist.data.title, '歌单没有 title')
      const page = await core!.catalog.playlistTracks(CTX.playlistId, { count: 10 })
      expect(page.items.length > 0, '歌单曲目为空')
      console.log(`      ${playlist.toString()} → 本页 ${page.items.length} 首，hasMore=${page.hasMore}`)
    })
    await check('catalog.related()', async () => {
      const related = await core!.catalog.related(CTX.trackId, 5)
      expect(related.length > 0, '相关推荐为空')
    })
    await check('catalog.stats() 收藏/评论数', async () => {
      const stats = await core!.catalog.stats(CTX.trackId)
      console.log(`      收藏 ${stats.collected} / 评论 ${stats.comment} / 分享 ${stats.shared}`)
    })
    await check('catalog.check() + checkTracks() 可播性', async () => {
      const media = await core!.catalog.check([{ id: CTX.trackId, type: 'track' }])
      const status = await core!.catalog.checkTracks([CTX.trackId])
      expect(media.length + status.length > 0, '两个检查接口都没回内容')
    })

    // ------------------------------------------------------------ 发现 / 搜索 / 榜单
    const home = await check('discover.home() 推荐页大盘', () => core!.discover.home(), (value) => {
      expect(value.blocks.length > 0, '首页没有 blocks')
      expect(value.tracks.length > 0, '首页没有曲目')
    })
    await check('discover.home({layout:"feed"}) 听歌模式版面', async () => {
      const feed = await core!.discover.home({ layout: 'feed' })
      expect(feed.blocks.length > 0, 'feed 版面没有 blocks')
      const radios = feed.blocks.flatMap((b) => b.inner).filter((inner) => inner.type === 'discover_radio')
      console.log(`      feed 版面 ${feed.blocks.length} 块 / ${radios.length} 个场景电台`)
      if (radios[0]?.id) {
        const tracks = await core!.discover.radioTracks(radios[0].id)
        expect(tracks.length > 0, '电台没有曲目')
        console.log(`      电台 ${radios[0].id} → ${tracks.length} 首`)
      }
    })
    if (home) {
      console.log(`      ${home.blocks.length} 块 / ${home.tracks.length} 首 / ${home.playlists.length} 歌单`)
      const chartBlock = home.blocks.flatMap((b) => b.inner).find((inner) => inner.id && /top_list|chart/.test(inner.type))
      if (chartBlock?.id) {
        await check(`catalog.chart(${chartBlock.id}) 榜单`, async () => {
          const chart = await core!.catalog.chart(chartBlock!.id!)
          expect(chart.data.ranks.length > 0, '榜单没有 track_ranks')
          console.log(`      ${chart.toString()}，第一名：${chart.data.ranks[0].track.name}`)
        })
      }
      const radio = home.blocks.flatMap((b) => b.inner).find((inner) => inner.type === 'discover_radio' && inner.id)
      if (radio?.id) {
        await check('discover.radioTracks() 场景电台', async () => {
          const tracks = await core!.discover.radioTracks(radio!.id!)
          expect(tracks.length > 0, '电台没有曲目')
        })
      }
    }
    await check('discover.launch() + feedSongTab()', async () => {
      const launch = await core!.discover.launch()
      const feed = await core!.discover.feedSongTab()
      console.log(`      boost 曲风 ${launch.boost?.genres.length ?? 0} 个 / 单曲 tab ${feed.length} 首`)
    })
    await check('search.tracks()', async () => {
      const tracks = await core!.search.tracks('晴天')
      expect(tracks.length > 0, '搜索没有结果')
      console.log(`      「晴天」→ ${tracks.length} 首，第一首：${tracks[0].toString()}`)
    })
    await check('search.suggest() + recommendWords() + categories()', async () => {
      const suggest = await core!.search.suggest('晴天')
      const words = await core!.search.recommendWords()
      const tabs = await core!.search.categories()
      console.log(`      联想 ${suggest.length} 条 / 推荐词 ${words.length} 条 / 分类 ${tabs.length} 个`)
      expect(tabs.length > 0, '搜索分类为空')
    })

    // ------------------------------------------------------------ 评论（只读）
    await check('comments.list() 读评论', async () => {
      const page = await core!.comments.list(CTX.trackId, { count: 5 })
      console.log(`      一级评论 ${page.items.length} 条 / 总数 ${page.total ?? '?'}`)
      if (page.items[0]) {
        const replies = await core!.comments.replies(page.items[0].id, { count: 3, groupId: CTX.trackId })
        console.log(`      第一条的回复 ${replies.items.length} 条`)
      }
    })

    // ------------------------------------------------------------ 社交 / 链接
    await checkSoft('social.user()（风控敏感，只打一次）', async () => {
      const user = await core!.social.user(CTX.userId)
      console.log(`      ${user.toString()}`)
    })
    await check('library.playlists() + likedTracks()', async () => {
      const playlists = await core!.library.playlists()
      const liked = await core!.library.likedTracks()
      console.log(`      我的歌单 ${playlists.length} 张 / 我喜欢 ${liked.length} 首`)
    })
    await check('link.meta() 分享页元数据', async () => {
      const meta = await core!.link.meta(CTX.trackId, { relatedCount: 3 })
      expect(meta.title, '分享元数据没有标题')
      console.log(`      ${meta.title}  ${meta.artist_text ?? ''}`)
    })

    // ------------------------------------------------------------ 播放器 + 媒体缓存
    if (track) {
      await check('player.play() 首播（解析 → 落盘 → 起时钟）', async () => {
        const statuses: string[] = []
        const offStatus = core!.player.on('status', (e) => statuses.push(e.status))
        const offError = core!.player.on('error', (e) => fail('player 内部报错', e.error.message ?? e.error))
        await core!.player.play(track)
        offStatus()
        offError()
        expect(statuses.includes('loading') && statuses.includes('playing'), `状态流异常：${statuses.join('→')}`)
        const source = core!.player.source
        expect(source, '没有播放源')
        expect(source!.kind === 'cache', `期望落盘缓存，实际 ${source!.kind}`)
        expect(fs.existsSync(source!.path!), `音频文件不存在：${source!.path}`)
        console.log(`      ${path.basename(source!.path!)} ${(source!.bytes! / 1024).toFixed(0)}KB，歌词 ${source!.lyrics?.lines.length ?? 0} 行`)
      })

      await sleep(700)
      await check('player 进度时钟推进', async () => {
        expect(core!.player.positionMs > 400, `位置没推进：${core!.player.positionMs}`)
        const view = core!.player.lyricState()
        console.log(`      position=${core!.player.positionMs}ms，当前歌词行 ${view?.line?.text ?? '（无）'}`)
      })
      await check('player.pause()/resume()', async () => {
        const paused = core!.player.positionMs
        core!.player.pause()
        expect(core!.player.status === 'paused', `状态应为 paused，实际 ${core!.player.status}`)
        await sleep(200)
        expect(core!.player.positionMs === paused, '暂停后位置还在走')
        await core!.player.resume()
        expect(core!.player.status === 'playing', 'resume 没回到 playing')
      })

      step++
      await core!.player.stop()
      const beforeReplay = fetchCount
      await core!.player.play()
      if (fetchCount === beforeReplay) ok(`重播命中媒体缓存零请求（fetch=${beforeReplay}）`)
      else fail('重播命中媒体缓存零请求', `多打了 ${fetchCount - beforeReplay} 次 fetch`)
      expect(core!.player.source?.fromCache === true, 'source.fromCache 不是 true')

      await check('player.seek()/setRepeat()/next()', async () => {
        core!.player.seek(1000)
        expect(core!.player.positionMs === 1000, 'seek 没生效')
        await core!.player.enqueue(await core!.catalog.track(CTX.trackId2))
        core!.player.setRepeat('all')
        const moved = await core!.player.next()
        expect(moved, 'next() 没走成')
        expect(core!.player.current?.id === CTX.trackId2, 'next 之后当前曲目不对')
      })

      await check('history 本地播放历史', async () => {
        const plays = core!.plays(10)
        expect(plays.length >= 2, `应该有 ≥2 条播放记录，实际 ${plays.length}`)
        const stats = core!.playStats()
        console.log(`      记录 ${stats.records} 条 / 曲目 ${stats.tracks} 首 / 榜首 ${stats.top[0]?.name ?? '?'}×${stats.top[0]?.plays ?? 0}`)
      })
      await check('media.verify() + stats()', async () => {
        const issues = await core!.media.verify()
        const stats = await core!.media.stats()
        console.log(`      缓存 ${stats.tracks} 首 / ${(stats.audioBytes / 1024).toFixed(0)}KB / 播放计数 ${stats.totalPlays} / 问题 ${issues.length}`)
        for (const issue of issues) console.log(`      · ${issue.trackId} ${issue.issue}`)
      })
    }

    // ------------------------------------------------------------ 维护
    await check('cacheStats() + prune() + clearCache()', async () => {
      const stats = await core!.cacheStats()
      console.log(`      元数据 ${stats.entities.entries} 条（命中 ${stats.entities.hits}/未命中 ${stats.entities.misses}）`)
      await core!.cache.prune()
      await core!.media.prune({ maxBytes: 0 })
      expect((await core!.cacheStats()).media.tracks >= 0, 'stats 异常')
    })
    await check('player.dispose() / core.dispose()', async () => {
      core!.player.dispose()
      core!.dispose()
    })
  } finally {
    core?.dispose()
    console.log(`\n上游 fetch 调用合计 ${fetchCount} 次`)
    console.log(failures === 0 ? `✅ 冒烟通过（${step} 步）` : `❌ ${failures} 步失败（共 ${step} 步）`)
    process.exit(failures === 0 ? 0 : 1)
  }
}

void main()
