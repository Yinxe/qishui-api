/**
 * 会话命令：`login` / `logout` / `whoami` / `accounts` / `use`。
 *
 * 登录只走**汽水音乐 App 扫码**（二维码内容是 bff-pc.qishui.com 深链；抖音扫不出来，见 qishui-api 实测）。
 * 多账号：每个号存 `accounts/<uid>.json`，登录即激活、不覆盖其他号；切号 `qishui use <uid|昵称>`，
 * 单命令临时换号用全局 `--as`。
 */
import type { Command } from 'commander'
import { CliError, core, describeError, globals } from '../context.js'
import { ago, count, membershipLine, until, userLine } from '../format.js'
import { qrHint, qrImageHint, renderQr } from '../loginQr.js'
import { dim, emit, green, heading, isJsonMode, print, printKeyValues, printTable, warn, yellow } from '../output.js'

export function registerAuthCommands(program: Command): void {
  program
    .command('login')
    .description('扫码登录（终端出二维码，用「汽水音乐」App 扫）；新号入库并激活，不动其他账号')
    .option('--timeout <seconds>', '等待扫码的超时（秒）', '180')
    .option('--interval <seconds>', '轮询间隔（秒）', '2')
    .option('--no-profile', '登录成功后不再拉一次用户资料')
    .option('--force', '保留兼容：登录本来就不因「已登录」拦路')
    .option('--keep-active', '入库新号但继续用当前激活号')
    .action(
      async (opts: { timeout: string; interval: string; profile: boolean; force?: boolean; keepActive?: boolean }) => {
        const instance = await core()

        const intervalMs = Math.max(500, Number(opts.interval) * 1000)
        const timeoutMs = Math.max(intervalMs, Number(opts.timeout) * 1000)
        const login = await instance.login({
          intervalMs,
          timeoutMs,
          fetchProfile: opts.profile !== false,
          keepActive: opts.keepActive,
        })

        if (!isJsonMode()) {
          print(dim('用「汽水音乐」App 扫描下面的二维码（不要用抖音）：'))
          renderQr(login.scanUrl)
          print(qrHint(login.scanUrl, login.expiresAt))
          const imageHint = qrImageHint(login.qrImage)
          if (imageHint) print(imageHint)
        }

        const status = await login.wait(intervalMs, timeoutMs)
        const snapshot = instance.snapshot()
        const ok = status === 'confirmed'
        emit(
          () => {
            if (!ok) {
              print(`${yellow('!')} 登录未完成：${status}`)
              return
            }
            heading('登录成功')
            printKeyValues([
              ['昵称', snapshot.nickname],
              ['uid', snapshot.uid],
              ['设备号', snapshot.deviceId],
              ['账号文件', snapshot.uid ? `${snapshot.dataDir}/accounts/${snapshot.uid}.json` : undefined],
              ['账号数', snapshot.accountCount ? `${snapshot.accountCount} 个已入库` : undefined],
            ])
          },
          { status, loggedIn: ok, session: snapshot, scanUrl: login.scanUrl, qrImage: login.qrImage },
        )
        if (!ok) process.exitCode = 1
      },
    )

  program
    .command('logout')
    .description('退出当前账号（保留账号壳与私有缓存，重新登录可归位）')
    .option('--purge', '连账号文件与该账号的私有/带态缓存一起删')
    .action(async (opts: { purge?: boolean }) => {
      const instance = await core()
      const before = instance.snapshot()
      await instance.logout({ purge: opts.purge })
      emit(
        () =>
          print(
            dim(
              before.loggedIn
                ? `已退出（原账号 ${before.nickname ?? before.uid}）${opts.purge ? '，含账号文件与私有缓存' : ''}`
                : '本来就没登录',
            ),
          ),
        {
          loggedIn: false,
          purge: opts.purge === true,
          previous: before,
        },
      )
    })

  program
    .command('accounts')
    .description('已登录账号一览（激活号打星；数据在 ~/.qishui/accounts/）')
    .action(async () => {
      const instance = await core()
      const accounts = instance.accounts()
      emit(
        () => {
          heading('账号', `${accounts.length} 个已入库`)
          if (!accounts.length) {
            print(dim('还没有已登录账号：qishui login（扫码即入库并激活）'))
            return
          }
          printTable(
            ['', 'uid', '昵称', '上次使用', '入库'],
            accounts.map((item) => [
              item.active ? green('★') : '',
              item.uid,
              item.nickname ?? '',
              item.lastUsedAt ? (ago(item.lastUsedAt / 1000) ?? '—') : '—',
              item.savedAt ? (ago(item.savedAt / 1000) ?? '—') : '—',
            ]),
          )
          print(dim('切号：qishui use <uid|昵称>；单命令临时换号：qishui --as <uid|昵称> …'))
        },
        { activeUid: instance.activeUid, accounts },
      )
    })

  program
    .command('use <account>')
    .description('切到已登录账号（uid 或昵称）并写为默认激活；播放器状态清空重来')
    .action(async (input: string) => {
      const instance = await core()
      try {
        await instance.useAccount(input)
      } catch (err) {
        // 原样转述「没有该号 / 没有留存会话 / 昵称撞号」，别被通用映射吞成「需要登录」
        throw new CliError(
          err instanceof Error ? err.message : String(err),
          '先看 `qishui accounts`；没有该号就 `qishui login` 扫码',
        )
      }
      const snapshot = instance.snapshot()
      emit(() => {
        heading('已切号')
        printKeyValues([
          ['昵称', snapshot.nickname],
          ['uid', snapshot.uid],
          ['账号数', snapshot.accountCount],
        ])
        print(dim('config.activeUid 已更新；单命令临时换号用 `--as`，不动默认'))
      }, snapshot)
    })

  program
    .command('whoami')
    .description('当前登录态：用户资料 + 会员态 + 本地数据位置')
    .option('--refresh', '绕过 5 分钟缓存重新拉')
    .action(async (opts: { refresh?: boolean }) => {
      const instance = await core()
      const snapshot = instance.snapshot()
      let profile: Awaited<ReturnType<typeof instance.account.me>> | undefined
      let membership: Awaited<ReturnType<typeof instance.account.membership>> | undefined
      let error: string | undefined
      if (instance.loggedIn) {
        try {
          profile = await instance.account.me(opts)
          membership = await instance.account.membership(opts)
        } catch (err) {
          error = describeError(err).message
        }
      }

      emit(
        () => {
          heading('登录态')
          if (!snapshot.loggedIn) {
            print(`${yellow('未登录')} ${dim('（匿名接口照常能用：搜索/首页/榜单/分享链接；写接口会回 1000016）')}`)
            print(dim('登录：qishui login'))
          } else {
            print(`${green('已登录')} ${snapshot.nickname ?? ''}`)
          }
          printKeyValues([
            ['uid', snapshot.uid],
            ['账号数', snapshot.accountCount ? `${snapshot.accountCount} 个已入库` : undefined],
            ['设备号', snapshot.deviceId],
            ['数据目录', snapshot.dataDir],
          ])
          if (globals().as) warn(`本条命令临时用账号 ${globals().as}（--as），默认激活号未变`)
          if (profile) {
            heading('资料')
            print(userLine(profile.user))
            const stats = profile.stats
            printKeyValues([
              ['喜欢', count(stats.liked)],
              ['关注', count(stats.following)],
              ['粉丝', count(stats.followers)],
              ['资产', count(stats.asset)],
            ])
          }
          if (membership) {
            heading('会员')
            print(membershipLine(membership))
            const download = membership.downloadEntitlement as { remaining_download_quota?: number } | undefined
            printKeyValues([
              ['到期', membership.vipExpireAt ? until(membership.vipExpireAt) : undefined],
              ['无损权益', membership.hasLosslessEntitlement ? '有' : undefined],
              ['剩余下载', download?.remaining_download_quota],
            ])
          }
          if (error) warn(`拉账号信息失败：${error}`)
        },
        { session: snapshot, user: profile?.user, stats: profile?.stats, membership, error },
      )
    })

  program
    .command('stats')
    .description('本地播放统计 + 收藏规模（不联网的那部分来自 ~/.qishui）')
    .action(async () => {
      const instance = await core()
      const local = instance.playStats()
      const cache = await instance.cacheStats()
      emit(
        () => {
          heading('本地播放')
          printKeyValues([
            ['播放记录', `${local.records} 条`],
            ['曲目', `${local.tracks} 首`],
          ])
          if (local.top.length) {
            heading('听得最多')
            printTable(
              ['次数', '曲目'],
              local.top.slice(0, 10).map((item) => [String(item.plays), item.name ?? item.trackId]),
              { right: [0] },
            )
          }
          heading('缓存')
          printKeyValues([
            ['元数据条目', cache.entities.entries],
            ['媒体曲目', `${cache.media.tracks} 首`],
            ['音频体积', `${(cache.media.audioBytes / 1024 / 1024).toFixed(1)} MB`],
            ['有歌词', `${cache.media.withLyrics} 首`],
          ])
        },
        { plays: local, cache },
      )
    })
}
