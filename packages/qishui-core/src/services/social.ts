import { CacheTtl } from '../cache/policy.js'
import type { QishuiCore } from '../core.js'
import { Playlist, User } from '../entities.js'
import { CoreError } from '../errors.js'
import { asPlaylist, asUser, collectUsers, parseUser } from '../parse.js'
import type { Paged, PlaylistData, UserData } from '../types.js'
import { num, str } from '../util.js'

/**
 * 社交：用户资料、粉丝/关注列表、关注与拉黑。
 *
 * 风控提醒（实测）：`GetUserInfo` / `GetFollowerList` / `GetFollowingList` 连打两次就会被
 * captcha 拦（带会话也一样）。所以 core 默认给这些读接口加 5 分钟缓存，
 * 上层也别做「遍历粉丝列表」这种高频打法。
 */
export class SocialService {
  constructor(private core: QishuiCore) {}

  private get parseOpts() {
    return { coverWidth: this.core.config.coverWidth }
  }

  /** 用户资料。风控敏感：默认 5 分钟缓存，`refresh` 才会真的再打一次 */
  async user(userId: string, opts: { refresh?: boolean } = {}): Promise<User> {
    const { value } = await this.core.cache.fetch<any>(
      'user',
      userId,
      () => this.core.request('GetUserInfo', { user_id: userId, sec_uid: '' }),
      {
        force: opts.refresh,
        ttlMs: CacheTtl.account,
      },
    )
    const data = asUser(value.user_info ?? value.user ?? value, this.parseOpts)
    if (!data?.id) throw new CoreError(`拿不到用户 ${userId}（响应里没有 user）`)
    return new User(this.core, data)
  }

  /**
   * 粉丝/关注列表。响应键是 `follow_items`（混排 `{user}` / `{user_artist}`），不是 `users`。
   */
  private async relations(
    kind: 'followers' | 'following',
    userId: string,
    cursor: number,
    count: number,
    refresh?: boolean,
  ): Promise<Paged<User>> {
    const endpoint = kind === 'followers' ? 'GetFollowerList' : 'GetFollowingList'
    const { value } = await this.core.cache.fetch<any>(
      kind,
      `${userId}-${cursor}-${count}`,
      () => this.core.request(endpoint, { user_id: userId, cursor, count, scene: '' }),
      { force: refresh, ttlMs: CacheTtl.account },
    )
    const raw = Array.isArray(value.follow_items) ? value.follow_items : []
    const list = raw.length
      ? raw.map((item: any) => item?.user ?? item?.user_artist ?? item)
      : collectUsers(value, count)
    return {
      items: list.map((u: unknown) => new User(this.core, parseUser(u, this.parseOpts))),
      hasMore: Boolean(value.has_more),
      cursor: str(value.next_cursor),
      total: num(value.total_count) ?? num(value.total_num),
      raw: value,
    }
  }

  /** 粉丝列表 */
  followers(userId: string, opts: { cursor?: number; count?: number; refresh?: boolean } = {}): Promise<Paged<User>> {
    return this.relations('followers', userId, opts.cursor ?? 0, opts.count ?? 20, opts.refresh)
  }

  /** 关注列表 */
  following(userId: string, opts: { cursor?: number; count?: number; refresh?: boolean } = {}): Promise<Paged<User>> {
    return this.relations('following', userId, opts.cursor ?? 0, opts.count ?? 20, opts.refresh)
  }

  /** 某人公开的歌单 */
  async userPlaylists(
    userId: string,
    opts: { cursor?: number; count?: number; refresh?: boolean } = {},
  ): Promise<Paged<Playlist>> {
    const cursor = opts.cursor ?? 0
    const count = opts.count ?? 20
    const { value } = await this.core.cache.fetch<any>(
      'user-playlists',
      `${userId}-${cursor}-${count}`,
      () => this.core.request('GetUserPlaylists', { user_id: userId, cursor, count, scene: '', ab_param: '' }),
      { force: opts.refresh, ttlMs: CacheTtl.account },
    )
    const raw: unknown[] = Array.isArray(value.playlists) ? value.playlists : []
    const list = raw.map((p) => asPlaylist(p, this.parseOpts)).filter((d): d is PlaylistData => !!d)
    return {
      items: list.map((d) => new Playlist(this.core, d)),
      hasMore: Boolean(value.has_more),
      cursor: str(value.next_cursor),
      total: num(value.total_num),
      raw: value,
    }
  }

  /** 某人收藏的歌单/专辑混排（不含曲目） */
  async userMixedCollections(
    userId: string,
    opts: { cursor?: number; count?: number; refresh?: boolean } = {},
  ): Promise<unknown> {
    const cursor = opts.cursor ?? 0
    const count = opts.count ?? 20
    return (
      await this.core.cache.fetch<any>(
        'user-mixed',
        `${userId}-${cursor}-${count}`,
        () => this.core.request('GetUserMixedCollections', { user_id: userId, cursor, count }),
        {
          force: opts.refresh,
          ttlMs: CacheTtl.account,
        },
      )
    ).value
  }

  async follow(userId: string): Promise<void> {
    await this.core.request('FollowUser', { user_id: userId })
    await this.core.cache.invalidate('user', userId)
    await this.core.cache.invalidate('me', 'self')
  }

  async unfollow(userId: string): Promise<void> {
    await this.core.request('UnfollowUser', { user_id: userId })
    await this.core.cache.invalidate('user', userId)
    await this.core.cache.invalidate('me', 'self')
  }

  /** 拉黑：`block_items: [{id, item_type:'user'}]`（实测字段名） */
  async block(userId: string): Promise<void> {
    await this.core.request('CommitBlockV2', { block_items: [{ id: userId, item_type: 'user' }] })
    await this.core.cache.invalidate('user', userId)
    await this.core.cache.invalidate('block-list')
  }

  async unblock(userId: string): Promise<void> {
    await this.core.request('CancelBlockV2', { block_items: [{ id: userId, item_type: 'user' }] })
    await this.core.cache.invalidate('user', userId)
    await this.core.cache.invalidate('block-list')
  }

  /** 黑名单（落成 core.account.blockList，这里给个便捷入口） */
  async blocks(
    opts: { cursor?: number; count?: number; refresh?: boolean } = {},
  ): Promise<{ users: UserData[]; nextCursor?: string }> {
    return await this.core.account.blockList(opts)
  }
}
