import type { QishuiCore } from '../core.js'
import { str } from '../util.js'

export interface ReportReason {
  code: string
  reason: string
  raw?: unknown
}

export interface ReportInput {
  contentId: string
  /** 实测是**字符串枚举**（`'track'`）；给数字回 1000004 */
  type?: string
  /** 取 `reportReasons()` 里的 `code`（如 `'4001'`） */
  reasonCode: string
}

/**
 * 行为上报与举报。
 *
 * 这一组接口容易被误判成「不可用」，实测坑点：
 *  - `Report` 的 `report_type` 是**字符串**（`'track'`），`report_reason_code` 取 `GetReportReason` 的 `code`；
 *    给数字/占位参数上游直接 HTTP 500 —— 那才是之前判死的原因；
 *  - pc 变体的 `Report` 会回 `101 你已举报过该内容`，非 pc 的 `/luna/report` 才是干净的；
 *  - 举报是写接口，**只在用户真的点了举报时调**，别在批量脚本里跑。
 */
export class FeedbackService {
  constructor(private core: QishuiCore) {}

  /** 举报原因枚举（举报弹窗的选项列表），默认 `report_type: 'track'` */
  async reportReasons(type = 'track', opts: { refresh?: boolean } = {}): Promise<ReportReason[]> {
    const { value } = await this.core.cache.fetch<any>('report-reasons', type, () => this.core.request('GetReportReason', { report_type: type }), {
      force: opts.refresh,
      ttlMs: 24 * 60 * 60 * 1000,
    })
    const list = Array.isArray(value.report_reasons) ? value.report_reasons : []
    return list.map((item: any) => ({ code: str(item?.code) ?? '', reason: str(item?.reason) ?? '', raw: item }))
  }

  /** 提交举报（写接口，显式调用） */
  async report(input: ReportInput): Promise<any> {
    return await this.core.request('Report', {
      content_id: input.contentId,
      report_type: input.type ?? 'track',
      report_reason_code: input.reasonCode,
    })
  }

  /** 「不感兴趣」 */
  async dislike(itemId: string, opts: { itemType?: number; actionType?: number } = {}): Promise<void> {
    await this.core.request('Dislike', {
      item_id: itemId,
      dislike_item_type: opts.itemType ?? 1,
      action_type: opts.actionType ?? 1,
    })
  }

  /** 分享计数（用户点了分享才调） */
  async shareCount(itemId: string, type = 'track'): Promise<void> {
    await this.core.request('ShareCount', { item_id: itemId, item_type: type })
  }

  /** 行为埋点（播放/曝光上报）。参数形状随场景变，原样透传 */
  async reportAction(payload: Record<string, unknown> = {}): Promise<any> {
    return await this.core.request('ReportAction', payload)
  }
}
