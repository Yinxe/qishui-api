import type { QishuiCore } from '../core.js'
import { Comment, User } from '../entities.js'
import { CoreError } from '../errors.js'
import { collectUsers, parseComment, parseUser, unwrap } from '../parse.js'
import type { Paged, TrackData } from '../types.js'
import { num, str } from '../util.js'

/**
 * 评论组类型。实测口径需注意（两边值不一样，别统一）：
 *  - **读** `ListComments` 用 `group_type: 1` 能拿到评论；
 *  - **发** `CreateComment` 必须 `group_type: 0`（Track），用 1 会回 `status_code=5`。
 */
export const GroupType = {
  Track: 0,
  /** 读评论列表时的实测可用值 */
  TrackRead: 1,
} as const

export interface CommentPageOptions {
  cursor?: number
  count?: number
  /** 读评论列表默认用 1（实测口径），要按 Track(0) 读就显式传 */
  groupType?: number
}

export interface CommentTarget {
  id: string
  /** 评论挂在什么类型上（目前实测只验过 track） */
  type?: string
}

/**
 * 评论：读、发、删、点赞、回复。
 * 发/删/点赞都是写接口，全部显式调用；`post()` 会回读一次拿到带 id 的评论实体。
 */
export class CommentsService {
  constructor(private core: QishuiCore) {}

  private get parseOpts() {
    return { coverWidth: this.core.config.coverWidth }
  }

  private normalize(target: CommentTarget | TrackData | string): CommentTarget {
    if (typeof target === 'string') return { id: target, type: 'track' }
    const node = unwrap(target)
    const id = str((target as CommentTarget).id ?? node?.id)
    if (!id) throw new CoreError('comments: 需要一个条目 id 或实体')
    return { id, type: (target as CommentTarget).type ?? 'track' }
  }

  /** 一级评论（分页） */
  async list(target: CommentTarget | TrackData | string, opts: CommentPageOptions = {}): Promise<Paged<Comment>> {
    const { id } = this.normalize(target)
    const cursor = opts.cursor ?? 0
    const count = opts.count ?? 20
    const groupType = opts.groupType ?? GroupType.TrackRead
    const res = await this.core.request('ListComments', { group_id: id, cursor, count, group_type: groupType })
    const list = Array.isArray(res.comments) ? res.comments : []
    return {
      items: list.map((c) => new Comment(this.core, parseComment(c, this.parseOpts))),
      hasMore: Boolean(res.has_more),
      cursor: str(res.cursor),
      total: num(res.count),
      raw: res,
    }
  }

  /** 某条评论的回复（响应键是 `reply_infos`，不是 `comments`） */
  async replies(commentId: string, opts: { cursor?: number; count?: number; groupId?: string; groupType?: number } = {}): Promise<Paged<Comment>> {
    const res = await this.core.request('ListReplies', {
      comment_id: commentId,
      cursor: opts.cursor ?? 0,
      count: opts.count ?? 20,
      group_id: opts.groupId ?? '',
      group_type: opts.groupType ?? GroupType.TrackRead,
    })
    const list = Array.isArray(res.reply_infos) ? res.reply_infos : []
    return {
      items: list.map((c) => new Comment(this.core, parseComment(c, this.parseOpts))),
      hasMore: Boolean(res.has_more),
      cursor: str(res.cursor),
      total: num(res.count),
      raw: res,
    }
  }

  /**
   * 发评论（`group_type` 固定 0）。
   * 成功只回 `created_comment`（**就是新评论的 id 字符串**），所以这里回读一页把实体捞回来。
   * 曲目评论区关着时上游回 `3056`，换一首就能发 —— 那是上游的答案，不是调用姿势错了。
   */
  async post(target: CommentTarget | TrackData | string, text: string): Promise<Comment> {
    const { id } = this.normalize(target)
    const res = await this.core.request('CreateComment', {
      group_id: id,
      group_type: GroupType.Track,
      text,
      comment_type: 0,
    })
    const commentId = str(res.created_comment)
    if (!commentId) return new Comment(this.core, { id: '', content: text })
    const page = await this.list(id, { count: 20 })
    return page.items.find((c) => c.id === commentId) ?? new Comment(this.core, { id: commentId, content: text })
  }

  /** 删自己的评论（别拿别人的 id） */
  async remove(commentId: string): Promise<void> {
    await this.core.request('DeleteComment', { comment_id: commentId })
  }

  /** 点赞/踩：`type` 1 = 赞，2 = 踩（按上游枚举） */
  async like(commentId: string, opts: { groupId?: string; replyId?: string; type?: number } = {}): Promise<void> {
    await this.core.request('CommentAction', {
      comment_id: commentId,
      reply_id: opts.replyId ?? '',
      group_id: opts.groupId ?? '',
      type: opts.type ?? 1,
      scene_name: '',
    })
  }

  /**
   * 回复某条评论（回复也是一条 comment；`reply_id` 指向被回复的那条，
   * 要指定「回复谁」用 `replyToUserId` —— IDL 里没有 `reply_user_id` 这个字段）。
   */
  async reply(commentId: string, text: string, opts: { groupId?: string; replyToUserId?: string } = {}): Promise<Comment> {
    const res = await this.core.request('CreateComment', {
      group_id: opts.groupId ?? '',
      group_type: GroupType.Track,
      text,
      comment_type: 0,
      reply_id: commentId,
      reply_to_user_id: opts.replyToUserId,
    })
    const createdId = str(res.created_comment) ?? ''
    return new Comment(this.core, { id: createdId, content: text })
  }

  /** 从响应里捞评论用户（做「评论里的人」列表时用） */
  users(raw: unknown): User[] {
    return collectUsers(raw).map((u) => new User(this.core, parseUser(u)))
  }
}
