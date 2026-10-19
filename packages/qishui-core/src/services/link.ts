import {
  getShareMedia,
  getTrackMedia,
  parseShareLink,
  resolveShareLink,
  type ShareItem,
  type ShareKind,
  type ShareMedia,
  type ShareMeta,
  shareLinkToMeta,
} from 'qishui-api'
import type { QishuiCore } from '../core.js'
import { Track } from '../entities.js'
import type { TrackData } from '../types.js'

/**
 * 分享链接/裸 ID 入口。
 *
 * 用户从 App/微信/浏览器粘过来的东西形态很杂（短链、分享页链接、裸 ID），
 * 这一层把它们统一成 `{kind, id}`，再按需求元数据或可播地址。
 */
export class LinkService {
  constructor(private core: QishuiCore) {}

  /** 纯解析（短链才发一次重定向请求） */
  async resolve(input: string | ShareItem): Promise<ShareItem> {
    return await resolveShareLink(input, { fetchImpl: this.core.fetchImpl })
  }

  /** 不发请求的纯字符串解析（解析不出来返回 undefined） */
  parse(input: string): ShareItem | undefined {
    return parseShareLink(input)
  }

  /** 元数据：标题/歌手文案/封面 + 可播性权益 + 相关曲目 */
  async meta(input: string | ShareItem, opts: { relatedCount?: number } = {}): Promise<ShareMeta> {
    return await shareLinkToMeta(input, this.core.api, {
      fetchImpl: this.core.fetchImpl,
      cover_width: this.core.config.coverWidth,
      related_count: opts.relatedCount ?? 8,
    })
  }

  /** 可播地址（track / ugc_video 才有），不落盘 */
  async media(input: string | ShareItem, opts: { coverWidth?: number } = {}): Promise<ShareMedia> {
    return await this.shareOrH5(input, { coverWidth: opts.coverWidth ?? this.core.config.coverWidth })
  }

  /**
   * track 走 h5 曲目接口、`ugc_video` 走分享页 SSR（视频没有 h5 对应接口，`/luna/h5/video*` 全 404）。
   * h5 失败不回落 —— 这里要能看见它为什么拿不到；要回落兜底的取址在 `core.media` 那条链路里。
   */
  private async shareOrH5(input: string | ShareItem, opts: { coverWidth?: number }): Promise<ShareMedia> {
    const item = typeof input === 'string' ? await this.resolve(input) : input
    if (item.kind === 'track') {
      return await getTrackMedia(item.id, {
        fetchImpl: this.core.fetchImpl,
        cover_width: opts.coverWidth,
      })
    }
    return await getShareMedia(item, { fetchImpl: this.core.fetchImpl, cover_width: opts.coverWidth })
  }

  /**
   * 链接 → Track 实体（拿得到时长/封面/vid）。
   * 想拿完整实体（album/artists/label_info）用 `core.catalog.track()`；
   * 这个用在「只有一条分享链接」的场景。
   */
  async track(input: string | ShareItem): Promise<Track> {
    const item = await this.resolve(input)
    const meta = await this.shareOrH5(item, { coverWidth: this.core.config.coverWidth })
    const data: TrackData = {
      id: item.id,
      name: meta.title ?? '',
      durationMs: meta.duration_ms,
      coverUrl: meta.cover_url,
      vid: meta.vid,
      artists: (meta.artist ?? '')
        .split(/[,，/]/)
        .map((name) => name.trim())
        .filter(Boolean)
        .map((name) => ({ id: '', name })),
      raw: meta,
    }
    return new Track(this.core, data)
  }

  /** 链接给的是哪种条目 */
  async kind(input: string | ShareItem): Promise<ShareKind> {
    return (await this.resolve(input)).kind
  }
}
