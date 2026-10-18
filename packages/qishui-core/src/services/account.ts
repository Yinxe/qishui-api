import { CacheTtl } from '../cache/policy.js'
import type { QishuiCore } from '../core.js'
import { parseUser } from '../parse.js'
import type { Membership, MembershipOffer, MeProfile, MeStats, PrivacySetting, TrackData, UserData } from '../types.js'
import { bool, num, str } from '../util.js'

export interface CommerceSummary {
  /** GetCommerceConfig 的原样响应（开关/支付方式/协议版本） */
  config?: unknown
  /** GetCommerceInfo 的原样响应（商品价格与权益展示） */
  info?: unknown
}

/**
 * 账号：我是谁、我有什么权益、我的隐私开关。
 * 「我的音乐」（收藏/歌单/播放历史）在 `core.library`；这里只管身份与商业化。
 *
 * 读接口带 TTL 缓存（`me` 30min）；写接口只有 `updatePrivacy`，且用**读到的原值合并回写**，
 * 不会把没传的开关冲掉。
 */
export class AccountService {
  constructor(private core: QishuiCore) {}

  private get parseOpts() {
    return { coverWidth: this.core.config.coverWidth }
  }

  /** 「我的」页一次铺满：资料 + 统计 */
  async me(opts: { refresh?: boolean } = {}): Promise<MeProfile> {
    const { value } = await this.core.cache.fetch<any>('me', 'self', () => this.core.request('GetMyInfo', {}), {
      force: opts.refresh,
      ttlMs: CacheTtl.account,
    })
    const user: UserData = parseUser(value.my_info ?? {}, this.parseOpts)
    if (user.id) await this.core.session.rememberIdentity(user.id, user.nickname)
    return { user, stats: parseMeStats(value.my_stats), raw: value }
  }

  /** 只取统计（收藏/关注/粉丝/资产） */
  async stats(opts: { refresh?: boolean } = {}): Promise<MeStats> {
    return (await this.me(opts)).stats
  }

  /** 当前会话对应的用户 id（先看 session.json，没有才问接口） */
  async uid(): Promise<string | undefined> {
    if (this.core.session.uid) return this.core.session.uid
    try {
      return (await this.me()).user.id
    } catch {
      return undefined
    }
  }

  /** 隐私开关（「设置」页 6 个） */
  async privacy(opts: { refresh?: boolean } = {}): Promise<PrivacySetting> {
    const { value } = await this.core.cache.fetch<any>(
      'privacy',
      'self',
      () => this.core.request('GetMyPrivacySetting', {}),
      { force: opts.refresh, ttlMs: CacheTtl.account },
    )
    const raw = value.privacy_setting ?? {}
    return {
      followInfoVisibility: num(raw.follow_info_visibility),
      playlistAlbumVisibility: num(raw.playlist_album_visibility),
      syncVideoToLuna: num(raw.sync_video_to_luna),
      myFavoriteVisibility: num(raw.my_favorite_visibility),
      musicWallVisibility: num(raw.music_wall_visibility),
      gamePlayStatsVisibility: num(raw.game_play_stats_visibility),
      raw: value,
    }
  }

  /**
   * 改隐私开关。**只有这 4 个字段能写**（`follow_info_visibility` / `sync_video_to_luna` /
   * `my_favorite_visibility` / `music_wall_visibility`，实测口径），
   * 没传的取读到的当前值 —— 所以不会误改其它开关。
   */
  async updatePrivacy(patch: Partial<PrivacySetting>): Promise<PrivacySetting> {
    const current = await this.privacy()
    await this.core.request('UpdateMyPrivacySetting', {
      follow_info_visibility: patch.followInfoVisibility ?? current.followInfoVisibility ?? 0,
      sync_video_to_luna: patch.syncVideoToLuna ?? current.syncVideoToLuna ?? 0,
      my_favorite_visibility: patch.myFavoriteVisibility ?? current.myFavoriteVisibility ?? 0,
      music_wall_visibility: patch.musicWallVisibility ?? current.musicWallVisibility ?? 0,
    })
    await this.core.cache.invalidate('privacy')
    return this.privacy({ refresh: true })
  }

  /** 会员状态 + 可购套餐（非会员账号看到的是「未开通」和 upsell） */
  async membership(opts: { refresh?: boolean } = {}): Promise<Membership> {
    const { value } = await this.core.cache.fetch<any>(
      'subscription',
      'self',
      () => this.core.request('GetMySubscription', {}),
      { force: opts.refresh, ttlMs: CacheTtl.account },
    )
    const subs = value.subs_info ?? {}
    const entitlements = subs.play_entitlements
    return {
      isVip: bool(subs.is_vip) ?? false,
      vipStage: str(subs.vip_stage),
      isPayingUser: bool(subs.is_paying_user),
      autoRenew: bool(subs.auto_renew_status),
      renewAmount: num(subs.renew_amount),
      hasLosslessEntitlement: bool(subs.has_lossless_entitlement),
      playEntitlements: entitlements,
      downloadEntitlement: subs.download_entitlement,
      vipExpireAt: num(entitlements?.expire_at),
      offers: parseOffers(value.to_purchase_offers),
      raw: value,
    }
  }

  /** 会员售卖位文案（开通会员弹窗） */
  async upsell(): Promise<any> {
    return (
      await this.core.cache.fetch<any>('upsell', 'self', () => this.core.request('GetUpsell', {}), {
        ttlMs: CacheTtl.account,
      })
    ).value
  }

  /** 商业化配置 + 商品信息（两个接口一起给，做支付页会都用到） */
  async commerce(opts: { refresh?: boolean } = {}): Promise<CommerceSummary> {
    const [config, info] = await Promise.all([
      this.core.cache.fetch<any>('commerce-config', 'self', () => this.core.request('GetCommerceConfig', {}), {
        force: opts.refresh,
        ttlMs: CacheTtl.account,
      }),
      this.core.cache.fetch<any>('commerce-info', 'self', () => this.core.request('GetCommerceInfo', {}), {
        force: opts.refresh,
        ttlMs: CacheTtl.account,
      }),
    ])
    return { config: config.value, info: info.value }
  }

  /** 已购数字专辑（没买过就是空） */
  async digitalAlbums(opts: { refresh?: boolean } = {}): Promise<any[]> {
    const { value } = await this.core.cache.fetch<any>(
      'digital-albums',
      'self',
      () => this.core.request('GetDigitalAlbums', {}),
      { force: opts.refresh, ttlMs: CacheTtl.account },
    )
    return value.albums ?? value.digital_albums ?? []
  }

  /**
   * 上报「刚播过这几首」→ 进上游的最近播放（`library.recent()` 读的就是这张表）。
   * **默认不会自动调用**（`config.reportPlayback` 打开才会由 player 调）——写接口一律显式。
   * 实测落地：上报后 `total_num` +1、该首排在最前；删回用 `removePlayed`。
   */
  async reportPlayed(tracks: (TrackData | string)[]): Promise<void> {
    const ids = tracks.map((track) => (typeof track === 'string' ? track : track.id)).filter(Boolean)
    if (!ids.length) return
    await this.core.request('AppendRecentPlayedTracks', { track_ids: ids })
  }

  /** 从最近播放里删掉这几首（写接口，同样不自动调） */
  async removePlayed(tracks: (TrackData | string)[]): Promise<void> {
    const ids = tracks.map((track) => (typeof track === 'string' ? track : track.id)).filter(Boolean)
    if (!ids.length) return
    await this.core.request('DeleteRecentPlayedTracks', { track_ids: ids })
  }

  /**
   * 上传凭据（imagex 直传）。
   * ⚠️ `security_token` 是敏感凭据：别落盘、别打日志、别进前端。
   * 参数按实测口径（`upload_type: 1` = Video，`scene`/`sdk_version` 空串即可）。
   */
  async uploader(): Promise<any> {
    const res = await this.core.request('GetUploaderInfo', { upload_type: 1, scene: '', sdk_version: '' })
    return res.uploader_info ?? res
  }

  /** 黑名单（分页；响应用的键是 `users`） */
  async blockList(
    opts: { cursor?: number; count?: number; refresh?: boolean } = {},
  ): Promise<{ users: UserData[]; nextCursor?: string }> {
    const cursor = opts.cursor ?? 0
    const count = opts.count ?? 20
    const key = `block-${cursor}-${count}`
    const { value } = await this.core.cache.fetch<any>(
      'block-list',
      key,
      () => this.core.request('GetBlockUserList', { cursor, count }),
      { force: opts.refresh, ttlMs: CacheTtl.account },
    )
    const list = value.users ?? value.block_users ?? []
    return {
      users: (Array.isArray(list) ? list : []).map((u: unknown) => parseUser(u, this.parseOpts)),
      nextCursor: str(value.next_cursor),
    }
  }
}

function parseMeStats(raw: any): MeStats {
  if (!raw || typeof raw !== 'object') return {}
  return {
    liked: num(raw.count_all_liked),
    following: num(raw.count_following),
    followers: num(raw.count_follower),
    asset: num(raw.count_asset),
    raw,
  }
}

function parseOffers(raw: any): MembershipOffer[] {
  if (!Array.isArray(raw)) return []
  return raw.map((offer) => ({
    offerId: str(offer?.offer_id),
    externalOfferId: str(offer?.external_offer_id),
    name: str(offer?.resource?.offer_preview?.name),
    price: str(offer?.resource?.offer_preview?.price),
    originalPrice: str(offer?.resource?.offer_preview?.promotion_info?.origin_price),
    promotionLabel: str(offer?.resource?.offer_preview?.promotion_info?.promotion_label),
    currency: str(offer?.currency_code),
    selected: bool(offer?.resource?.offer_preview?.selected),
    raw: offer,
  }))
}
