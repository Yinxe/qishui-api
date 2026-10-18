/**
 * 用户主页的条目构造：全离线单测（假 core + 假 ui），不打上游、不起 PTY。
 *
 * 守三条口径：
 *  - 读类项（公开歌单 / 关注 / 粉丝）匿名也能点，写类项未登录置灰并补「去登录」；
 *  - **关注态不写结论**：`UserData` 没有「我关注了没有」的水印，所以既不写「已关注」也不写「未关注」；
 *  - 拉黑必须过一次确认框（不可逆），确认后才发请求。
 */
import type { QishuiCore } from 'qishui-core'
import { expect, it, vi } from 'vitest'
import { buildUserSections } from '../dist/screens/User.js'
import type { UiValue } from '../dist/ui/context.js'
import type { Entry } from '../dist/ui/entries.js'

const UID = 'u-2002'

const fakeUser = { id: UID, nickname: '用户乙', data: { id: UID, nickname: '用户乙' } }

interface Harness {
  entries: Entry[]
  calls: string[]
  overlays: { kind?: string; onConfirm?: () => void }[]
  push: ReturnType<typeof vi.fn>
  toast: ReturnType<typeof vi.fn>
  afterWrites: () => number
}

function build(opts: { loggedIn?: boolean } = {}): Harness {
  const calls: string[] = []
  const overlays: { kind?: string; onConfirm?: () => void }[] = []
  const push = vi.fn()
  const toast = vi.fn()
  let afterWrites = 0
  const write = (label: string) => () => {
    calls.push(label)
    return Promise.resolve()
  }
  const core = {
    loggedIn: opts.loggedIn ?? true,
    social: {
      follow: write('follow'),
      unfollow: write('unfollow'),
      block: write('block'),
    },
  } as unknown as QishuiCore
  const ui = {
    push,
    toast,
    bump: vi.fn(),
    openOverlay: (overlay: { kind?: string; onConfirm?: () => void }) => overlays.push(overlay),
    closeOverlay: vi.fn(),
  } as unknown as UiValue
  const sections = buildUserSections({
    ui,
    core,
    user: fakeUser as never,
    afterWrite: () => {
      afterWrites++
    },
  })
  return {
    entries: sections.flatMap((section) => section.entries),
    calls,
    overlays,
    push,
    toast,
    afterWrites: () => afterWrites,
  }
}

const pick = (entries: Entry[], key: string): Entry => {
  const entry = entries.find((e) => e.key === key)
  expect(entry, `条目里没有：${key}`).toBeTruthy()
  return entry as Entry
}
const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

it('登录态：条目顺序固定，读类项走路由、写类项走 core.social', async () => {
  const h = build()
  expect(h.entries.map((e) => e.label)).toEqual([
    'TA 的公开歌单',
    'TA 关注的人',
    'TA 的粉丝',
    '关注 TA',
    '取消关注 TA',
    '拉黑 TA',
  ])
  // 关注态上游没回 → 任何一条都不写「已关注 / 未关注」
  for (const entry of h.entries) expect(entry.note ?? '').not.toMatch(/已关注|未关注/)

  await pick(h.entries, 'playlists').onEnter?.()
  await pick(h.entries, 'following').onEnter?.()
  await pick(h.entries, 'followers').onEnter?.()
  expect(h.push.mock.calls.map((call) => call[0].source.kind)).toEqual([
    'user-playlists',
    'user-following',
    'user-followers',
  ])

  await pick(h.entries, 'follow').onEnter?.()
  await flush()
  expect(h.calls).toEqual(['follow'])
  expect(h.afterWrites()).toBe(1)

  await pick(h.entries, 'unfollow').onEnter?.()
  await flush()
  expect(h.calls).toEqual(['follow', 'unfollow'])
})

it('拉黑要先过确认框：确认前一个请求都不发', async () => {
  const h = build()
  await pick(h.entries, 'block').onEnter?.()
  expect(h.overlays.map((o) => o.kind)).toEqual(['confirm'])
  expect(h.calls).toEqual([])
  h.overlays[0]?.onConfirm?.()
  await flush()
  expect(h.calls).toEqual(['block'])
  expect(h.afterWrites()).toBe(1)
})

it('未登录：写类项置灰并说明要登录，末尾补一个能走的「去登录」；读类项照常可选', () => {
  const h = build({ loggedIn: false })
  expect(h.entries.filter((e) => e.disabled).map((e) => e.key)).toEqual(['follow', 'unfollow', 'block'])
  for (const entry of h.entries.filter((e) => e.disabled)) expect(entry.label).toMatch(/（需登录）$/)
  for (const key of ['playlists', 'following', 'followers']) expect(pick(h.entries, key).disabled).toBeFalsy()
  const last = h.entries[h.entries.length - 1] as Entry
  expect(last.label).toBe('去登录（汽水音乐 App 扫码）')
  void last.onEnter?.()
  expect(h.overlays.map((o) => o.kind)).toEqual(['login'])
})
