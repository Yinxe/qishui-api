/**
 * 用户主页：昵称 / 签名 / 统计 + 入口（TA 的公开歌单、关注、粉丝、关注/取关、拉黑）。
 *
 * 与 CLI 的 `qishui user <id>` 同一份数据（`core.social.user`）。三条口径：
 *  - **关注态不猜**：`GetUserInfo` 回的 `UserData` 里没有「我关注了没有」这类水印，
 *    core 的 `User` 实体也就没有 `following`。所以这里不写「已关注 / 未关注」，
 *    「关注」与「取消关注」各自成一条，点了就是明确意图。
 *  - **写类未登录不给选**（`disabled`），条目照常列出：跟行操作菜单一个口径。
 *  - **风控**：`GetUserInfo` / `GetFollowingList` / `GetFollowerList` 实测连打两次就会被验证码拦，
 *    core 已按 5 分钟缓存兜住；这一页不做「进页就预取粉丝列表」，翻页只在人真的按下时发生。
 */
import { Box, Text } from 'ink'
import type { QishuiCore, User } from 'qishui-core'
import { useMemo } from 'react'
import { useCore } from '../core/context.js'
import { type UiValue, useUi } from '../ui/context.js'
import { type Entry, type Section, SectionView, useEntries } from '../ui/entries.js'
import { listHeight } from '../ui/layout.js'
import { GUTTER } from '../ui/theme.js'
import { useAsync } from '../ui/useAsync.js'
import { EmptyState, ErrorState, Hints, Loading, PageTitle } from '../ui/widgets.js'

export interface UserSectionOptions {
  ui: UiValue
  core?: QishuiCore
  user: User
  /** 写成功之后让本页重读（关注/拉黑会动上游缓存） */
  afterWrite?: () => void
}

/**
 * 一位用户的「能做什么」：纯函数，离线可测（与 `ui/rowActions.ts`、`buildListenSections` 同一路数）。
 * 读类项匿名也能用（公开歌单 / 关注 / 粉丝），写类项未登录置灰。
 */
export function buildUserSections(opts: UserSectionOptions): Section[] {
  const { ui, core, user, afterWrite } = opts
  const loggedIn = Boolean(core?.loggedIn)
  const who = user.nickname || user.id
  const push = (route: Parameters<UiValue['push']>[0]) => ui.push(route)

  /** 一次写动作：core 缺失就地拦下，错误一律以 toast 收尾，成功才提示 + 让本页重读 */
  const act =
    (run: (core: QishuiCore) => Promise<unknown>, done: string, kind: 'success' | 'info' = 'success') =>
    (): void => {
      if (!core) {
        ui.toast('core 还没就绪，稍后再试', 'error')
        return
      }
      void run(core)
        .then(() => {
          ui.toast(done, kind)
          afterWrite?.()
        })
        .catch((err: unknown) => ui.toast(err instanceof Error ? err.message : String(err), 'error'))
    }
  /** 写类条目：未登录照常列出但置灰（与行操作菜单同一口径） */
  const write = (
    key: string,
    label: string,
    run: (core: QishuiCore) => Promise<unknown>,
    done: string,
    kind: 'success' | 'info' = 'success',
  ): Entry =>
    loggedIn ? { key, label, onEnter: act(run, done, kind) } : { key, label: `${label}（需登录）`, disabled: true }

  const entries: Entry[] = [
    {
      key: 'playlists',
      label: 'TA 的公开歌单',
      onEnter: () => push({ kind: 'list', source: { kind: 'user-playlists', uid: user.id, nickname: who } }),
    },
    {
      key: 'following',
      label: 'TA 关注的人',
      onEnter: () => push({ kind: 'list', source: { kind: 'user-following', uid: user.id, nickname: who } }),
    },
    {
      key: 'followers',
      label: 'TA 的粉丝',
      onEnter: () => push({ kind: 'list', source: { kind: 'user-followers', uid: user.id, nickname: who } }),
    },
    // 关注态上游没回，就不写「已关注/未关注」：两条各自成立，点哪条就是哪个意图
    write('follow', '关注 TA', (q) => q.social.follow(user.id), `已关注：${who}`),
    write('unfollow', '取消关注 TA', (q) => q.social.unfollow(user.id), `已取消关注：${who}`, 'info'),
    {
      // 拉黑要另一条命令才解开，必须过一次确认框
      key: 'block',
      label: loggedIn ? '拉黑 TA' : '拉黑 TA（需登录）',
      disabled: !loggedIn,
      onEnter: () =>
        ui.openOverlay({
          kind: 'confirm',
          message: `拉黑 ${who}？`,
          hint: '拉黑后看不到 TA 的内容；解开要另走 CLI `qishui unblock`',
          onConfirm: act((q) => q.social.block(user.id), `已拉黑：${who}`, 'info'),
        }),
    },
  ]
  if (entries.some((entry) => entry.disabled))
    entries.push({
      key: 'login',
      label: '去登录（汽水音乐 App 扫码）',
      onEnter: () => ui.openOverlay({ kind: 'login' }),
    })
  return [{ title: '操作', entries }]
}

export function UserScreen({ id, nickname, active }: { id: string; nickname?: string; active: boolean }) {
  const { core } = useCore()
  const ui = useUi()

  const detail = useAsync<User>(core ? () => core.social.user(id) : undefined, `user:${id}`)
  const user = detail.data

  // biome-ignore lint/correctness/useExhaustiveDependencies: sections 只随用户实体重建（afterWrite 每次渲染都是新引用）
  const sections = useMemo<Section[]>(
    () =>
      user
        ? buildUserSections({
            ui,
            core,
            user,
            afterWrite: () => {
              detail.reload()
              ui.bump()
            },
          })
        : [],
    [user, core, ui],
  )

  const height = listHeight(ui.rows, 8, 5)
  const { cursor, setCursor } = useEntries(sections, active, (input) => {
    if (input === 'R') {
      detail.reload()
      return true
    }
    return false
  })
  const stats = user?.data.stats

  return (
    <Box flexDirection="column" flexGrow={1}>
      <PageTitle
        title={`用户 · ${user?.nickname || nickname || id}`}
        subtitle={[user?.isVip ? 'VIP' : undefined, user?.data.isMusician ? '音乐人' : undefined]
          .filter(Boolean)
          .join(' · ')}
      />
      {detail.status === 'loading' ? <Loading label="读取用户" /> : null}
      {detail.status === 'error' ? <ErrorState error={detail.error ?? '加载失败'} hint="R 重新加载" /> : null}
      {user ? (
        <Box flexDirection="column" paddingX={GUTTER} marginBottom={1}>
          <Text dimColor wrap="truncate-end">
            {[
              user.data.douyinId ? `抖音号 ${user.data.douyinId}` : undefined,
              user.data.signature ? user.data.signature : undefined,
              `id ${user.id}`,
            ]
              .filter(Boolean)
              .join('  ·  ')}
          </Text>
          <Text dimColor wrap="truncate-end">
            {stats
              ? `关注 ${stats.following ?? '-'}  粉丝 ${stats.followers ?? '-'}  获赞 ${stats.liked ?? '-'}  作品 ${stats.asset ?? '-'}`
              : '上游这条没给统计数字'}
          </Text>
        </Box>
      ) : null}
      {sections.length > 0 ? (
        <SectionView sections={sections} cursor={cursor} height={height} onCursor={setCursor} />
      ) : null}
      {detail.status === 'ready' && !user ? <EmptyState message="拿不到这位用户" /> : null}
      <Box paddingX={GUTTER}>
        <Hints
          items={[
            ['↑↓', '移动'],
            ['Enter', '进入 / 执行'],
            ['R', '刷新'],
            ['Esc', '返回'],
          ]}
        />
      </Box>
    </Box>
  )
}
