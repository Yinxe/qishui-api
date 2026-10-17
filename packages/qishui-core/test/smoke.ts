/**
 * qishui-core 端到端冒烟（真打上游，谨慎跑）。
 *
 * 覆盖：会话迁移/复用 → 账号 → 曲库（批量 hydration + 缓存命中零请求）→ 搜索 → 发现/榜单
 *      → 评论读 → 播放器状态机 → 媒体落盘/断点/校验 → 本地历史 → 缓存统计/清理
 *      → **多账号机制**（迁移分文件、_acct 隔离、切号编排、--as 临时态、logout --purge —— 全程零网络）。
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
import { CacheTtl, createQishui, type QishuiCore, RiskControlError } from '../dist/index.js'

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

/**
 * 多账号机制（全程零网络：注入假设备 + 假 cookie，只断言本地行为）。
 *
 * 走一遍：旧 session.json 迁移 → 造出 B 号 → `_acct/<uid>` 缓存隔离 → `useAccount` 编排
 * （内存作废/cookie 先清后灌/历史上换目录/config.activeUid 写回）→ `--as` 式临时实例 → `logout --purge`。
 */
async function multiAccountChecks(): Promise<void> {
  const HOME2 = path.join(HOME, 'multi')
  const fakeDevice = { deviceId: '9000000000000000001', installId: '9000000000000000002', cdid: 'smoke-cdid' }
  const fetchBefore = fetchCount
  fs.mkdirSync(HOME2, { recursive: true })
  fs.writeFileSync(
    path.join(HOME2, 'session.json'),
    JSON.stringify({
      v: 1,
      device: fakeDevice,
      cookies: { sessionid: 'COOKIE_A' },
      uid: '111',
      nickname: '小号A',
      savedAt: Date.now() - 86_400_000,
    }),
  )

  const core2 = await check('旧 session.json → 迁移出 accounts/<uid>.json + device.json（原件 .bak）', async () => {
    const instance = await createQishui({ dataDir: HOME2, device: fakeDevice, fetchImpl: countingFetch })
    expect(fs.existsSync(path.join(HOME2, 'device.json')), '没有 device.json')
    expect(fs.existsSync(path.join(HOME2, 'session.json.bak')), 'session.json 没改名 .bak')
    expect(fs.existsSync(path.join(HOME2, 'accounts', '111.json')), '没有 accounts/111.json')
    const snapshot = instance.snapshot()
    expect(snapshot.loggedIn && snapshot.uid === '111', `迁移后登录态不对：${snapshot.uid}`)
    expect(fetchCount === fetchBefore, `迁移阶段竟打了网络（+${fetchCount - fetchBefore}）`)
    return instance
  })
  if (!core2) return

  await check('造出 B 号：rememberIdentity + save → 两号并存', async () => {
    await core2.session.ready()
    core2.api.cookies.absorb(['sessionid=COOKIE_B', 'extra_b=1'])
    await core2.session.rememberIdentity('222', '小号B')
    await core2.session.save()
    const list = core2.accounts()
    expect(list.length === 2, `应入库 2 个账号，实际 ${list.length}`)
    expect(fs.existsSync(path.join(HOME2, 'accounts', '222.json')), '没有 accounts/222.json')
    expect(
      list.some((a) => a.uid === '222' && a.active),
      'B 应是激活号',
    )
  })

  await check('带态/私有缓存落 _acct/<uid>，公共 kind 落共享位', async () => {
    await core2.cache.set('me', 'k', { who: 'B' })
    await core2.cache.set('search', 'q', { who: 'B' })
    expect(fs.existsSync(core2.paths.entityFile('me', 'k', '222')), 'me 没落 _acct/222/')
    expect(fs.existsSync(core2.paths.entityFile('search', 'q')), 'search 没落共享位')
    expect(!fs.existsSync(path.join(HOME2, 'cache', 'entities', '_acct', '222', 'search')), 'search 不该进 _acct')
  })

  await check('useAccount(A)：内存态作废 + 私有缓存跨号不可见 + 共享位照常可见', async () => {
    await core2.useAccount('111')
    expect(core2.cache.get('me', 'k') === undefined, 'A 号不该在内存看到 B 的 me')
    expect((await core2.cache.load('me', 'k')) === undefined, 'A 号读盘读到了 B 的 me')
    expect((await core2.cache.load<{ who: string }>('search', 'q'))?.who === 'B', 'search 是共享的，A 该看得见')
  })

  await check('切号编排：cookie 先清后灌无残留 + 历史上换目录 + config.activeUid 写回', async () => {
    const jar = core2.api.cookies.toObject()
    expect(jar.sessionid === 'COOKIE_A', `jar 里 sessionid 不是 A：${jar.sessionid}`)
    expect(!('extra_b' in jar), 'B 的独有 cookie 残留到了 A')
    expect(
      core2.history.scopeFile === path.join(HOME2, 'journal', '111', 'plays.jsonl'),
      `历史文件没上账号：${core2.history.scopeFile}`,
    )
    const config = JSON.parse(fs.readFileSync(path.join(HOME2, 'config.json'), 'utf8'))
    expect(config.activeUid === '111', `config.activeUid 没写回：${config.activeUid}`)
    expect(fetchCount === fetchBefore, `机制断言期间打了网络（+${fetchCount - fetchBefore}）`)
  })

  await check('--as 式临时实例：本进程用 B，默认激活号不动', async () => {
    const core3 = await createQishui({ dataDir: HOME2, device: fakeDevice, account: '222', fetchImpl: countingFetch })
    expect(core3.session.activeUid === '222', `临时实例没激活 B：${core3.session.activeUid}`)
    core3.dispose()
    const config = JSON.parse(fs.readFileSync(path.join(HOME2, 'config.json'), 'utf8'))
    expect(config.activeUid === '111', `临时实例把默认激活号都改了：${config.activeUid}`)
  })

  await check('logout --purge：只删当前号（A），B 的会话与 _acct 缓存原样', async () => {
    await core2.logout({ purge: true })
    expect(!fs.existsSync(path.join(HOME2, 'accounts', '111.json')), 'A 的账号文件没删')
    expect(fs.existsSync(path.join(HOME2, 'accounts', '222.json')), '不该动 B 的账号文件')
    expect(fs.existsSync(core2.paths.entityFile('me', 'k', '222')), '不该动 B 的私有缓存')
    expect(core2.accounts().length === 1, `索引应剩 1 个号，实际 ${core2.accounts().length}`)
    expect(core2.snapshot().loggedIn === false, '登出后不该还是登录态')
    core2.dispose()
    expect(fetchCount === fetchBefore, `多账号小节全程应零网络（共 +${fetchCount - fetchBefore}）`)
  })
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
    await check(
      'account.me()',
      () => core!.account.me(),
      (value) => {
        expect(value.user.id, 'my_info 里没有 id')
        expect(core!.uid === value.user.id, `uid 没被记住：${core!.uid} vs ${value.user.id}`)
      },
    )
    await check('account.stats()', async () => {
      const stats = await core!.account.stats()
      expect(stats.liked !== undefined || stats.following !== undefined, '统计字段全空')
    })
    await check(
      'account.membership()',
      () => core!.account.membership(),
      (value) => {
        expect(typeof value.isVip === 'boolean', 'is_vip 不是布尔')
      },
    )
    await check(
      'account.privacy()',
      () => core!.account.privacy(),
      (value) => {
        expect(value.followInfoVisibility !== undefined, 'privacy_setting 空')
      },
    )
    await check('account.blockList()', async () => {
      await core!.account.blockList({ count: 5 })
    })

    // ------------------------------------------------------------ 曲库
    const track = await check(
      'catalog.track() 单首（MGetMedia）',
      () => core!.catalog.track(CTX.trackId),
      (value) => {
        expect(value.data.name, '曲目没有 name')
        expect(value.data.artists.length > 0, '曲目没有 artists')
      },
    )
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
    const home = await check(
      'discover.home() 推荐页大盘',
      () => core!.discover.home(),
      (value) => {
        expect(value.blocks.length > 0, '首页没有 blocks')
        expect(value.tracks.length > 0, '首页没有曲目')
      },
    )
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
      const chartBlock = home.blocks
        .flatMap((b) => b.inner)
        .find((inner) => inner.id && /top_list|chart/.test(inner.type))
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
    await check('search.artists() / albums() / playlists() 各类实体都解析得出', async () => {
      const artists = await core!.search.artists('周杰伦')
      const albums = await core!.search.albums('周杰伦')
      const playlists = await core!.search.playlists('周杰伦')
      expect(
        artists.length > 0 && albums.length > 0 && playlists.length > 0,
        `有一类为空：歌手=${artists.length} 专辑=${albums.length} 歌单=${playlists.length}`,
      )
      console.log(`      歌手 ${artists.length} / 专辑 ${albums.length} / 歌单 ${playlists.length}`)
    })
    await check('search.suggest() + recommendWords() + categories()', async () => {
      const suggest = await core!.search.suggest('晴天')
      const words = await core!.search.recommendWords()
      const tabs = await core!.search.categories()
      console.log(`      联想 ${suggest.length} 条 / 推荐词 ${words.length} 条 / 分类 ${tabs.length} 个`)
      expect(tabs.length > 0, '搜索分类为空')
    })

    // ------------------------------------------------------------ 缓存分档（哪些缓存、哪些不缓存）
    await check('cache policy：实时数据不落盘（同一搜索连打两次都发请求）', async () => {
      expect(CacheTtl.none === 0, `CacheTtl.none 应为 0，实际 ${CacheTtl.none}`)
      const before = fetchCount
      await core!.search.tracks('晴天')
      const one = fetchCount - before
      await core!.search.tracks('晴天')
      const two = fetchCount - before - one
      expect(two === one, `第二次没重发：one=${one} two=${two}（命中缓存了就是 0）`)
      console.log(`      search 两次 → fetch +${one} / +${two}（none 档不落盘；一条 search 本来就有两条 path）`)
    })
    await check('cache policy：元数据落盘（同一曲目第二次零请求）', async () => {
      const before = fetchCount
      await core!.catalog.track(CTX.trackId2)
      await core!.catalog.track(CTX.trackId2)
      expect(fetchCount - before <= 1, `曲目元数据没走缓存：多了 ${fetchCount - before} 次 fetch`)
      console.log(`      曲目 ×2 → fetch +${fetchCount - before}（entity 档 6h）`)
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
        console.log(
          `      ${path.basename(source!.path!)} ${(source!.bytes! / 1024).toFixed(0)}KB，歌词 ${source!.lyrics?.lines.length ?? 0} 行`,
        )
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
        console.log(
          `      记录 ${stats.records} 条 / 曲目 ${stats.tracks} 首 / 榜首 ${stats.top[0]?.name ?? '?'}×${stats.top[0]?.plays ?? 0}`,
        )
      })
      await check('media.verify() + stats()', async () => {
        const issues = await core!.media.verify()
        const stats = await core!.media.stats()
        console.log(
          `      缓存 ${stats.tracks} 首 / ${(stats.audioBytes / 1024).toFixed(0)}KB / 播放计数 ${stats.totalPlays} / 问题 ${issues.length}`,
        )
        for (const issue of issues) console.log(`      · ${issue.trackId} ${issue.issue}`)
      })
    }

    // ------------------------------------------------------------ 维护
    await check('cacheStats() + prune() + clearCache()', async () => {
      const stats = await core!.cacheStats()
      console.log(
        `      元数据 ${stats.entities.entries} 条（命中 ${stats.entities.hits}/未命中 ${stats.entities.misses}）`,
      )
      await core!.cache.prune()
      await core!.media.prune({ maxBytes: 0 })
      expect((await core!.cacheStats()).media.tracks >= 0, 'stats 异常')
    })
    // ------------------------------------------------------------ 多账号机制（全程零网络：假设备号 + 假 cookie）
    await multiAccountChecks()

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
