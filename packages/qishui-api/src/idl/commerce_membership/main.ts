// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../_common.js'
import * as action from './common/action.js'
import * as apix_common from '../commerce_apix/apix_common.js'
import * as apix_error from '../commerce_apix/apix_error.js'
import * as benefit from './common/benefit.js'
import * as common from './common/common.js'
import * as constants from '../thrift/commerce/constants/constants.js'
import * as ecom from './common/ecom.js'
import * as entitlement from '../thrift/ads/entity/entitlement.js'
import * as incentive from './common/incentive.js'
import * as my_order from './common/my_order.js'
import * as product from './common/product.js'
import * as reward from './common/reward.js'
import * as tab from './common/tab.js'
import * as trade from './common/trade.js'
import * as treasure from './common/treasure.js'
import * as upsell from './common/upsell.js'
import * as voucher from './common/voucher.js'

export const BubbleTriggerReasonBackgroundVoicePrompt: string = 'background_voice_prompt'
export const BubbleTriggerReasonCommerceVipCenter: string = 'commerce_vip'
export const BubbleTriggerReasonDefault: string = 'default'
export const IncludeActivityFreeVip: string = 'activity_free_vip'
export const IncludeAssets: string = 'assets'
export const IncludeBenefitBase: string = 'benefit_base'
export const IncludeEcom: string = 'ecom'
export const IncludeExtra: string = 'extra'
export const IncludeIncentive: string = 'incentive'
export const IncludeMembership: string = 'membership'
export const IncludeOffers: string = 'offers'
export const IncludePlayEntitlements: string = 'play_entitlements'
export const IncludeTrade: string = 'trade'
export const IncludeTreasure: string = 'treasure'
export const IncludeVouchers: string = 'vouchers'
export const PageLogIn: string = 'log_in'
export const PageVipCenter: string = 'vip_center'
export const PopupSceneTypeVIPOnly: string = 'popup_vip_only'
export const PurchaseSceneSVIPCenter: string = 'svip_center'
export const PurchaseSceneVIPCenter: string = 'vip_center'
export enum CommerceTabType {
  Vip = 0,
  Reward = 1,
  Coin = 2,
}
export enum FreeVipApplyStatus {
  Empty = 0,
  NoActivity = 1,
  TomorrowToUnlock = 2,
  OvermorrowToUnlock = 3,
  ToUnlock = 4,
  ToRedeem = 5,
  TodayToRedeem = 6,
  Redeemed = 7,
  TodayRedeemed = 8,
}
export enum PromotionTitleType {
  VipPromotion = 1,
  RenewPromotion = 2,
  UpgradePromotion = 3,
}
// CommerceMembershipService
export async function ApplyFreeVip(caller: IRequestCaller, req: ApplyFreeVipRequest, context: any): Promise<ApplyFreeVipResponse> {
  const requestData = mergeRequestData([
    ApplyFreeVipRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'ApplyFreeVip',
    paths: [{ method: 'POST', path: `/luna/commerce/v2/apply_free_vip` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function BookAlbum(caller: IRequestCaller, req: BookAlbumRequest, context: any): Promise<BookAlbumResponse> {
  const requestData = mergeRequestData([
    BookAlbumRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'BookAlbum',
    paths: [{ method: 'POST', path: `/luna/commerce/v2/album/book` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function CancelChannelSubs(caller: IRequestCaller, req: CancelChannelSubsRequest, context: any): Promise<CancelChannelSubsResponse> {
  const requestData = mergeRequestData([
    CancelChannelSubsRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'CancelChannelSubs',
    paths: [{ method: 'POST', path: `/luna/commerce/v2/cancel_channel_subs` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function CheckCode(caller: IRequestCaller, req: CheckCodeRequest, context: any): Promise<CheckCodeResponse> {
  const requestData = mergeRequestData([
    CheckCodeRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'CheckCode',
    paths: [{ method: 'POST', path: `/luna/commerce/v2/code/check` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function CheckDownload(caller: IRequestCaller, req: CheckDownloadRequest, context: any): Promise<CheckDownloadResponse> {
  const requestData = mergeRequestData([
    CheckDownloadRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'CheckDownload',
    paths: [{ method: 'POST', path: `/luna/commerce/v2/check_download` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function ConsumeBenefit(caller: IRequestCaller, req: ConsumeBenefitRequest, context: any): Promise<ConsumeBenefitResponse> {
  const requestData = mergeRequestData([
    ConsumeBenefitRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'ConsumeBenefit',
    paths: [{ method: 'POST', path: `/luna/commerce/v2/consume_benefit` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetAlbumPurchasedPage(caller: IRequestCaller, req: GetAlbumPageRequest, context: any): Promise<GetAlbumPageResponse> {
  const requestData = mergeRequestData([
    GetAlbumPageRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetAlbumPurchasedPage',
    paths: [{ method: 'GET', path: `/luna/commerce/v2/album/purchased_page` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetAlbumToPurchasePage(caller: IRequestCaller, req: GetAlbumPageRequest, context: any): Promise<GetAlbumPageResponse> {
  const requestData = mergeRequestData([
    GetAlbumPageRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetAlbumToPurchasePage',
    paths: [{ method: 'GET', path: `/luna/commerce/v2/album/purchase_page` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetBytepayPreSignPage(caller: IRequestCaller, req: GetBytepayPreSignPageRequest, context: any): Promise<GetBytepayPreSignPageResponse> {
  const requestData = mergeRequestData([
    GetBytepayPreSignPageRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetBytepayPreSignPage',
    paths: [{ method: 'POST', path: `/luna/commerce/v2/bytepay/pre_sign` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetCommerceConfig(caller: IRequestCaller, req: GetCommerceConfigRequest, context: any): Promise<GetCommerceConfigResponse> {
  const requestData = mergeRequestData([
    GetCommerceConfigRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetCommerceConfig',
    paths: [{ method: 'POST', path: `/luna/commerce/v2/commerce_config` }, { method: 'POST', path: `/luna/pc/commerce/v2/commerce_config` }, { method: 'POST', path: `/luna/h5/commerce/v2/commerce_config` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetCommerceInfo(caller: IRequestCaller, req: GetCommerceInfoRequest, context: any): Promise<GetCommerceInfoResponse> {
  const requestData = mergeRequestData([
    GetCommerceInfoRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetCommerceInfo',
    paths: [{ method: 'POST', path: `/luna/commerce/v2/commerce_info` }, { method: 'POST', path: `/luna/pc/commerce/v2/commerce_info` }, { method: 'POST', path: `/luna/h5/commerce/v2/commerce_info` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetDeviceActiveMembership(caller: IRequestCaller, req: GetDeviceActiveMembershipRequest, context: any): Promise<GetDeviceActiveMembershipResponse> {
  const requestData = mergeRequestData([
    GetDeviceActiveMembershipRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetDeviceActiveMembership',
    paths: [{ method: 'GET', path: `/luna/commerce/v2/device_active_membership` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetMyOrders(caller: IRequestCaller, req: GetMyOrdersRequest, context: any): Promise<GetMyOrdersResponse> {
  const requestData = mergeRequestData([
    GetMyOrdersRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetMyOrders',
    paths: [{ method: 'GET', path: `/luna/commerce/v2/my_orders` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetOffersTokensForPC(caller: IRequestCaller, req: GetOffersTokensForPCRequest, context: any): Promise<GetOffersTokensForPCResponse> {
  const requestData = mergeRequestData([
    GetOffersTokensForPCRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetOffersTokensForPC',
    paths: [{ method: 'POST', path: `/luna/pc/commerce/v2/offers/tokens` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetOffersTokensStatusForPC(caller: IRequestCaller, req: GetOffersTokensStatusForPCRequest, context: any): Promise<GetOffersTokensStatusForPCResponse> {
  const requestData = mergeRequestData([
    GetOffersTokensStatusForPCRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetOffersTokensStatusForPC',
    paths: [{ method: 'POST', path: `/luna/pc/commerce/v2/offers/tokens/status` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetRoomCommerceInfo(caller: IRequestCaller, req: GetRoomCommerceInfoRequest, context: any): Promise<GetRoomCommerceInfoResponse> {
  const requestData = mergeRequestData([
    GetRoomCommerceInfoRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetRoomCommerceInfo',
    paths: [{ method: 'POST', path: `/luna/commerce/v2/get_room_commerce_info` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetUpsell(caller: IRequestCaller, req: GetUpsellRequest, context: any): Promise<GetUpsellResponse> {
  const requestData = mergeRequestData([
    GetUpsellRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetUpsell',
    paths: [{ method: 'GET', path: `/luna/commerce/v2/upsell` }, { method: 'GET', path: `/luna/pc/commerce/v2/upsell` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetUserBookingActivityInfo(caller: IRequestCaller, req: GetUserBookingActivityInfoRequest, context: any): Promise<GetUserBookingActivityInfoResponse> {
  const requestData = mergeRequestData([
    GetUserBookingActivityInfoRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetUserBookingActivityInfo',
    paths: [{ method: 'GET', path: `/luna/commerce/v2/album/booking/${requestData.params.activity_id}` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function JoinActivity(caller: IRequestCaller, req: JoinActivityRequest, context: any): Promise<JoinActivityResponse> {
  const requestData = mergeRequestData([
    JoinActivityRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'JoinActivity',
    paths: [{ method: 'POST', path: `/luna/commerce/v2/join_activity` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function PrepayQuery(caller: IRequestCaller, req: PrepayQueryRequest, context: any): Promise<PrepayQueryResponse> {
  const requestData = mergeRequestData([
    PrepayQueryRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'PrepayQuery',
    paths: [{ method: 'POST', path: `/luna/commerce/v2/prepay_query` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function Purchase(caller: IRequestCaller, req: PurchaseRequest, context: any): Promise<PurchaseResponse> {
  const requestData = mergeRequestData([
    PurchaseRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'Purchase',
    paths: [{ method: 'POST', path: `/luna/commerce/v2/purchase` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function PurchaseOffersByTokensForPC(caller: IRequestCaller, req: PurchaseOffersByTokensForPCRequest, context: any): Promise<DummyResponse> {
  const requestData = mergeRequestData([
    PurchaseOffersByTokensForPCRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'PurchaseOffersByTokensForPC',
    paths: [{ method: 'GET', path: `/luna/pc/commerce/v2/tokens/purchase` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function PurchaseOffersForH5(caller: IRequestCaller, req: PurchaseOffersForH5Request, context: any): Promise<DummyResponse> {
  const requestData = mergeRequestData([
    PurchaseOffersForH5RequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'PurchaseOffersForH5',
    paths: [{ method: 'GET', path: `/luna/h5/commerce/v2/purchase` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function PurchaseProduct(caller: IRequestCaller, req: PurchaseProductRequest, context: any): Promise<PurchaseProductResponse> {
  const requestData = mergeRequestData([
    PurchaseProductRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'PurchaseProduct',
    paths: [{ method: 'POST', path: `/luna/commerce/v2/purchase_product` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function QueryGiftOrderBrief(caller: IRequestCaller, req: QueryGiftOrderBriefRequest, context: any): Promise<QueryGiftOrderBriefResponse> {
  const requestData = mergeRequestData([
    QueryGiftOrderBriefRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'QueryGiftOrderBrief',
    paths: [{ method: 'POST', path: `/luna/commerce/v2/gift/order_brief` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function ReceiveGift(caller: IRequestCaller, req: ReceiveGiftRequest, context: any): Promise<ReceiveGiftResponse> {
  const requestData = mergeRequestData([
    ReceiveGiftRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'ReceiveGift',
    paths: [{ method: 'POST', path: `/luna/commerce/v2/gift/receive` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function ReceiveVoucher(caller: IRequestCaller, req: ReceiveVoucherRequest, context: any): Promise<ReceiveVoucherResponse> {
  const requestData = mergeRequestData([
    ReceiveVoucherRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'ReceiveVoucher',
    paths: [{ method: 'POST', path: `/luna/commerce/v2/voucher/receive` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function RedeemCode(caller: IRequestCaller, req: RedeemCodeRequest, context: any): Promise<RedeemCodeResponse> {
  const requestData = mergeRequestData([
    RedeemCodeRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'RedeemCode',
    paths: [{ method: 'POST', path: `/luna/commerce/v2/code/redeem` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function ReportAction(caller: IRequestCaller, req: ReportActionRequest, context: any): Promise<ReportActionResponse> {
  const requestData = mergeRequestData([
    ReportActionRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'ReportAction',
    paths: [{ method: 'POST', path: `/luna/commerce/v2/report_action` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function ReportIapAuxiliaryInfo(caller: IRequestCaller, req: ReportIapAuxiliaryInfoRequest, context: any): Promise<ReportIapAuxiliaryInfoResponse> {
  const requestData = mergeRequestData([
    ReportIapAuxiliaryInfoRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'ReportIapAuxiliaryInfo',
    paths: [{ method: 'POST', path: `/luna/commerce/v2/report_iap_info` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function ReportPurchaseAction(caller: IRequestCaller, req: ReportPurchaseActionRequest, context: any): Promise<ReportPurchaseActionResponse> {
  const requestData = mergeRequestData([
    ReportPurchaseActionRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'ReportPurchaseAction',
    paths: [{ method: 'POST', path: `/luna/commerce/v2/purchase/report_action` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function SendGift(caller: IRequestCaller, req: SendGiftRequest, context: any): Promise<SendGiftResponse> {
  const requestData = mergeRequestData([
    SendGiftRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'SendGift',
    paths: [{ method: 'POST', path: `/luna/commerce/v2/gift/send` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function SetAlbumDefaultCover(caller: IRequestCaller, req: SetAlbumDefaultCoverRequest, context: any): Promise<SetAlbumDefaultCoverResponse> {
  const requestData = mergeRequestData([
    SetAlbumDefaultCoverRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'SetAlbumDefaultCover',
    paths: [{ method: 'POST', path: `/luna/commerce/v2/album/set_default_cover` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function UnBookAlbum(caller: IRequestCaller, req: BookAlbumRequest, context: any): Promise<BookAlbumResponse> {
  const requestData = mergeRequestData([
    BookAlbumRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'UnBookAlbum',
    paths: [{ method: 'POST', path: `/luna/commerce/v2/album/unbook` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function Validate(caller: IRequestCaller, req: ValidateRequest, context: any): Promise<ValidateResponse> {
  const requestData = mergeRequestData([
    ValidateRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'Validate',
    paths: [{ method: 'POST', path: `/luna/commerce/v2/validate` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export interface ActivityFreeVip {
  'start_date': string;
  'end_date': string;
  'applied_cnt': number;
  'latest_apply_date': string;
  'calendar_dates'?: FreeVipCalendarDate[];
  'show_tomorrow_info': boolean;
  'start_time_sec': number;
  'end_time_sec': number;
  'latest_apply_time_sec'?: number;
  'show_calendar_mask': boolean;
  'activity_rules'?: ActivityRules;
}
export function ActivityFreeVipToRequestData(data: ActivityFreeVip): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['start_date', 'end_date', 'applied_cnt', 'latest_apply_date', 'calendar_dates', 'show_tomorrow_info', 'start_time_sec', 'end_time_sec', 'latest_apply_time_sec', 'show_calendar_mask', 'activity_rules', ]),
  }
}
export interface ActivityRules {
  'title': string;
  'content': string;
}
export function ActivityRulesToRequestData(data: ActivityRules): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['title', 'content', ]),
  }
}
export interface Album {
  'item_id': number;
}
export function AlbumToRequestData(data: Album): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['item_id', ]),
  }
}
export interface ApplyFreeVipRequest {
}
export function ApplyFreeVipRequestToRequestData(data: ApplyFreeVipRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, []),
  }
}
export interface ApplyFreeVipResponse {
  'status_code': number;
  'status_info'?: apix_common.StatusInfo;
  'apply_status'?: trade.ApplyFreeVipStatus;
  'toast'?: string;
}
export function ApplyFreeVipResponseToRequestData(data: ApplyFreeVipResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'apply_status', 'toast', ]),
  }
}
export interface BenefitBase {
  'play_track'?: benefit.BenefitPlayTrack;
  'download'?: benefit.BenefitDownload;
  'quality'?: benefit.BenefitQuality;
  'audio_effect'?: benefit.BenefitAudioEffect;
  'bell'?: benefit.BenefitBell;
  'activity_config'?: benefit.BenefitActivityConfig;
}
export function BenefitBaseToRequestData(data: BenefitBase): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['play_track', 'download', 'quality', 'audio_effect', 'bell', 'activity_config', ]),
  }
}
export interface BookAlbumRequest {
  'activity_id': string;
}
export function BookAlbumRequestToRequestData(data: BookAlbumRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['activity_id', ]),
  }
}
export interface BookAlbumResponse {
  'status_code': number;
  'status_info'?: apix_common.StatusInfo;
  'booking_result'?: BookingResult;
}
export function BookAlbumResponseToRequestData(data: BookAlbumResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'booking_result', ]),
  }
}
export interface BookingResult {
  'total_booking_num': number;
}
export function BookingResultToRequestData(data: BookingResult): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['total_booking_num', ]),
  }
}
export interface CancelChannelSubsRequest {
}
export function CancelChannelSubsRequestToRequestData(data: CancelChannelSubsRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, []),
  }
}
export interface CancelChannelSubsResponse {
  'status_code': number;
  'status_info'?: apix_common.StatusInfo;
  'status'?: trade.CancelChannelSubsStatus;
}
export function CancelChannelSubsResponseToRequestData(data: CancelChannelSubsResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'status', ]),
  }
}
export interface CheckCodeRequest {
  'code': string;
}
export function CheckCodeRequestToRequestData(data: CheckCodeRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['code', ]),
  }
}
export interface CheckCodeResponse {
  'status_code': number;
  'status_info'?: apix_common.StatusInfo;
}
export function CheckCodeResponseToRequestData(data: CheckCodeResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', ]),
  }
}
export interface CheckDownloadRequest {
  'tracks'?: benefit.DownloadItem[];
}
export function CheckDownloadRequestToRequestData(data: CheckDownloadRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['tracks', ]),
  }
}
export interface CheckDownloadResponse {
  'status_code': number;
  'status_info'?: apix_common.StatusInfo;
  'track_download_info_list'?: benefit.TrackDownloadInfo[];
  'remaining_download_quota': number;
  'no_quota_toast_content': string;
}
export function CheckDownloadResponseToRequestData(data: CheckDownloadResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'track_download_info_list', 'remaining_download_quota', 'no_quota_toast_content', ]),
  }
}
export interface CommerceTab {
  'type': CommerceTabType;
  'url': string;
  'tab_list'?: CommerceTabEntity[];
  'landing_tab_id'?: string;
  'label'?: tab.MainIconLabel;
  'bubble'?: tab.MainIconBubble;
  'extra'?: Record<string, string>;
  'labels'?: tab.MainIconLabel[];
  'login_config'?: tab.CommerceLoginConfig;
  'bubbles'?: Record<string, tab.MainIconBubble[]>;
}
export function CommerceTabToRequestData(data: CommerceTab): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['type', 'url', 'tab_list', 'landing_tab_id', 'label', 'bubble', 'extra', 'labels', 'login_config', 'bubbles', ]),
  }
}
export interface CommerceTabEntity {
  'id': string;
  'name': string;
  'url': string;
}
export function CommerceTabEntityToRequestData(data: CommerceTabEntity): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['id', 'name', 'url', ]),
  }
}
export interface ConfirmToast {
  'toast_text': string;
  'toast_name': string;
}
export function ConfirmToastToRequestData(data: ConfirmToast): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['toast_text', 'toast_name', ]),
  }
}
export interface ConsumeBenefitRequest {
  'downloads'?: benefit.DownloadItem[];
  'audio_effect'?: benefit.AudioEffectItem;
  'activity'?: benefit.ActivityItem;
}
export function ConsumeBenefitRequestToRequestData(data: ConsumeBenefitRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['downloads', 'audio_effect', 'activity', ]),
  }
}
export interface ConsumeBenefitResponse {
  'status_code': number;
  'status_info'?: apix_common.StatusInfo;
}
export function ConsumeBenefitResponseToRequestData(data: ConsumeBenefitResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', ]),
  }
}
export interface CoolDownInfo {
  'cool_down_at': number;
}
export function CoolDownInfoToRequestData(data: CoolDownInfo): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['cool_down_at', ]),
  }
}
export interface DailyRewardTask {
  'days_offset': number;
  'reward_tasks_time_ms'?: number[];
}
export function DailyRewardTaskToRequestData(data: DailyRewardTask): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['days_offset', 'reward_tasks_time_ms', ]),
  }
}
export interface DummyResponse {
  'status_code': number;
  'status_info'?: apix_common.StatusInfo;
}
export function DummyResponseToRequestData(data: DummyResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', ]),
  }
}
export interface Extra {
  'show_recovery_entrance': boolean;
  'sign_agreement_by_default'?: SignAgreementByDefault;
  'entitlement_confirm_toast'?: ConfirmToast;
  'vip_center_default_tab'?: string;
  'vip_center_quit_retention_popup'?: VipCenterQuitRetentionPopup;
  'commerce_tab'?: CommerceTab;
  'ios_purchase_abnormal_notice'?: string;
  'douyin_pay_deduct_contract_link'?: string;
}
export function ExtraToRequestData(data: Extra): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['show_recovery_entrance', 'sign_agreement_by_default', 'entitlement_confirm_toast', 'vip_center_default_tab', 'vip_center_quit_retention_popup', 'commerce_tab', 'ios_purchase_abnormal_notice', 'douyin_pay_deduct_contract_link', ]),
  }
}
export interface FreeVipCalendarDate {
  'date'?: string;
  'status': FreeVipApplyStatus;
  'content'?: string;
}
export function FreeVipCalendarDateToRequestData(data: FreeVipCalendarDate): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['date', 'status', 'content', ]),
  }
}
export interface GetAlbumPageRequest {
  'album_id': string;
  'is_preview'?: boolean;
}
export function GetAlbumPageRequestToRequestData(data: GetAlbumPageRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['album_id', 'is_preview', ]),
    body: fieldsAssign(data, []),
  }
}
export interface GetAlbumPageResponse {
  'status_code': number;
  'status_info'?: apix_common.StatusInfo;
  'album_info'?: product.AlbumInfo;
  'page_block_info'?: product.PageBlock[];
}
export function GetAlbumPageResponseToRequestData(data: GetAlbumPageResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'album_info', 'page_block_info', ]),
  }
}
export interface GetBytepayPreSignPageRequest {
  'offer_snapshot_id': string;
}
export function GetBytepayPreSignPageRequestToRequestData(data: GetBytepayPreSignPageRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['offer_snapshot_id', ]),
  }
}
export interface GetBytepayPreSignPageResponse {
  'status_code': number;
  'status_info'?: apix_common.StatusInfo;
  'schema_url': string;
}
export function GetBytepayPreSignPageResponseToRequestData(data: GetBytepayPreSignPageResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'schema_url', ]),
  }
}
export interface GetCommerceConfigRequest {
}
export function GetCommerceConfigRequestToRequestData(data: GetCommerceConfigRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, []),
  }
}
export interface GetCommerceConfigResponse {
  'status_code': number;
  'status_info'?: apix_common.StatusInfo;
  'privilege_map'?: Record<string, product.PrivilegeBlock>;
  'terms_map'?: Record<string, product.TermsText>;
  'privilege_pattern_map'?: Record<string, product.PrivilegePattern>;
  'libra_params_map'?: Record<string, Record<string, string>>;
}
export function GetCommerceConfigResponseToRequestData(data: GetCommerceConfigResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'privilege_map', 'terms_map', 'privilege_pattern_map', 'libra_params_map', ]),
  }
}
export interface GetCommerceInfoRequest {
  'includes'?: Include[];
}
export function GetCommerceInfoRequestToRequestData(data: GetCommerceInfoRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['includes', ]),
  }
}
export interface GetCommerceInfoResponse {
  'status_code': number;
  'status_info'?: apix_common.StatusInfo;
  'benefit_base'?: BenefitBase;
  'assets'?: benefit.Assets;
  'offers'?: SceneOffers;
  'activity_free_vip'?: ActivityFreeVip;
  'trade'?: Trade;
  'membership'?: Membership;
  'play_entitlements'?: PlayEntitlements;
  'extra'?: Extra;
  'incentive'?: incentive.Incentive;
  'treasure'?: treasure.Treasure;
  'vouchers'?: voucher.VoucherList;
  'ecom'?: ecom.Ecom;
  'libra_params_map'?: Record<string, Record<string, string>>;
}
export function GetCommerceInfoResponseToRequestData(data: GetCommerceInfoResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'benefit_base', 'assets', 'offers', 'activity_free_vip', 'trade', 'membership', 'play_entitlements', 'extra', 'incentive', 'treasure', 'vouchers', 'ecom', 'libra_params_map', ]),
  }
}
export interface GetDeviceActiveMembershipRequest {
}
export function GetDeviceActiveMembershipRequestToRequestData(data: GetDeviceActiveMembershipRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, []),
  }
}
export interface GetDeviceActiveMembershipResponse {
  'status_code': number;
  'status_info'?: apix_common.StatusInfo;
  'membership_info'?: MembershipInfo[];
}
export function GetDeviceActiveMembershipResponseToRequestData(data: GetDeviceActiveMembershipResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'membership_info', ]),
  }
}
export interface GetMyOrdersRequest {
}
export function GetMyOrdersRequestToRequestData(data: GetMyOrdersRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, []),
  }
}
export interface GetMyOrdersResponse {
  'status_code': number;
  'status_info'?: apix_common.StatusInfo;
  'cards'?: my_order.Card[];
}
export function GetMyOrdersResponseToRequestData(data: GetMyOrdersResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'cards', ]),
  }
}
export interface GetOffersTokensForPCRequest {
  'offer_snapshot_id': string;
  'report_param': string;
}
export function GetOffersTokensForPCRequestToRequestData(data: GetOffersTokensForPCRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['offer_snapshot_id', 'report_param', ]),
  }
}
export interface GetOffersTokensForPCResponse {
  'status_code': number;
  'status_info'?: apix_common.StatusInfo;
  'token': string;
}
export function GetOffersTokensForPCResponseToRequestData(data: GetOffersTokensForPCResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'token', ]),
  }
}
export interface GetOffersTokensStatusForPCRequest {
  'token': string;
}
export function GetOffersTokensStatusForPCRequestToRequestData(data: GetOffersTokensStatusForPCRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['token', ]),
  }
}
export interface GetOffersTokensStatusForPCResponse {
  'status_code': number;
  'status_info'?: apix_common.StatusInfo;
  'token_status': common.TokenStatus;
}
export function GetOffersTokensStatusForPCResponseToRequestData(data: GetOffersTokensStatusForPCResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'token_status', ]),
  }
}
export interface GetRoomCommerceInfoRequest {
  'room_id': number;
}
export function GetRoomCommerceInfoRequestToRequestData(data: GetRoomCommerceInfoRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['room_id', ]),
  }
}
export interface GetRoomCommerceInfoResponse {
  'status_code': number;
  'status_info'?: apix_common.StatusInfo;
  'play_entitlement_expire_ts'?: Record<string, number>;
  'album_list'?: string[];
}
export function GetRoomCommerceInfoResponseToRequestData(data: GetRoomCommerceInfoResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'play_entitlement_expire_ts', 'album_list', ]),
  }
}
export interface GetUpsellRequest {
}
export function GetUpsellRequestToRequestData(data: GetUpsellRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, []),
  }
}
export interface GetUpsellResponse {
  'status_code': number;
  'status_info'?: apix_common.StatusInfo;
  'variables'?: Record<string, string>;
  'freq_ctrl_cfg'?: upsell.FreqCtrlCfg;
  'user_extra'?: upsell.UserExtra;
  'cold_launch_timing'?: upsell.ColdLaunchTiming;
  'upsell_map'?: Record<string, upsell.UpsellItem>;
  'libra_params_map'?: Record<string, string>;
}
export function GetUpsellResponseToRequestData(data: GetUpsellResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'variables', 'freq_ctrl_cfg', 'user_extra', 'cold_launch_timing', 'upsell_map', 'libra_params_map', ]),
  }
}
export interface GetUserBookingActivityInfoRequest {
  'activity_id': string;
}
export function GetUserBookingActivityInfoRequestToRequestData(data: GetUserBookingActivityInfoRequest): IRequestData {
  return {
    params: fieldsAssign(data, ['activity_id', ]),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, []),
  }
}
export interface GetUserBookingActivityInfoResponse {
  'status_code': number;
  'status_info'?: apix_common.StatusInfo;
  'total_booking_cnt': number;
  'is_booked': boolean;
}
export function GetUserBookingActivityInfoResponseToRequestData(data: GetUserBookingActivityInfoResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'total_booking_cnt', 'is_booked', ]),
  }
}
export interface IapSubsAuxiliaryInfo {
  'iap_subs_group_id': string;
  'renewal_state': number;
  'is_eligible_for_intro_offer': boolean;
}
export function IapSubsAuxiliaryInfoToRequestData(data: IapSubsAuxiliaryInfo): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['iap_subs_group_id', 'renewal_state', 'is_eligible_for_intro_offer', ]),
  }
}
export interface JoinActivityRequest {
  'activity'?: benefit.ActivityItem;
}
export function JoinActivityRequestToRequestData(data: JoinActivityRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['activity', ]),
  }
}
export interface JoinActivityResponse {
  'status_code': number;
  'status_info'?: apix_common.StatusInfo;
}
export function JoinActivityResponseToRequestData(data: JoinActivityResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', ]),
  }
}
export interface MagicActivityConfig {
  'activity_id': string;
  'task_id': string;
  'task_token': string;
  'app_id': number;
}
export function MagicActivityConfigToRequestData(data: MagicActivityConfig): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['activity_id', 'task_id', 'task_token', 'app_id', ]),
  }
}
export interface Membership {
  'expire_time': number;
  'in_grace_period': boolean;
  'is_membership': boolean;
  'membership_type': product.MembershipType;
  'is_paying_user': boolean;
  'is_about_to_expire': boolean;
  'vip_label_suffix'?: string;
  'membership_detail_map'?: Record<string, MembershipDetail>;
  'last_membership_type': product.MembershipType;
  'modifier_vip_label_suffix'?: string;
  'expire_time_max': number;
  'membership_detail_map_v2'?: Record<string, MembershipDetail>;
  'me_tab_vip_entrance'?: product.VipEntrance;
  'side_bar_vip_entrance'?: product.VipEntrance;
  'default_svip_entrance'?: product.VipEntrance;
}
export function MembershipToRequestData(data: Membership): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['expire_time', 'in_grace_period', 'is_membership', 'membership_type', 'is_paying_user', 'is_about_to_expire', 'vip_label_suffix', 'membership_detail_map', 'last_membership_type', 'modifier_vip_label_suffix', 'expire_time_max', 'membership_detail_map_v2', 'me_tab_vip_entrance', 'side_bar_vip_entrance', 'default_svip_entrance', ]),
  }
}
export interface MembershipDetail {
  'expire_time': number;
  'start_time': number;
}
export function MembershipDetailToRequestData(data: MembershipDetail): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['expire_time', 'start_time', ]),
  }
}
export interface MembershipInfo {
  'name': string;
}
export function MembershipInfoToRequestData(data: MembershipInfo): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['name', ]),
  }
}
export interface OfferSnapshotIDList {
  'offer_snapshot_ids'?: string[];
}
export function OfferSnapshotIDListToRequestData(data: OfferSnapshotIDList): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['offer_snapshot_ids', ]),
  }
}
export interface PlayEntitlements {
  'expire_at': number;
  'reward_tasks_finished': number;
  'reward_tasks_time_ms'?: number[];
  'video_complete_acquired_time_ms'?: number[];
  'reward_finished_task_info'?: RewardFinishedTaskInfo;
  'need_refresh_reward_time'?: boolean;
  'daily_reward_tasks'?: DailyRewardTask[];
  'original_daily_reward_tasks'?: DailyRewardTask[];
  'pre_release_expire_at': number;
  'is_full_day_all': boolean;
  'reward_tab_info'?: reward.RewardAdsTaskMeta;
  'cool_down_info'?: CoolDownInfo;
  'reward_task_guides'?: entitlement.RewardTaskGuide[];
}
export function PlayEntitlementsToRequestData(data: PlayEntitlements): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['expire_at', 'reward_tasks_finished', 'reward_tasks_time_ms', 'video_complete_acquired_time_ms', 'reward_finished_task_info', 'need_refresh_reward_time', 'daily_reward_tasks', 'original_daily_reward_tasks', 'pre_release_expire_at', 'is_full_day_all', 'reward_tab_info', 'cool_down_info', 'reward_task_guides', ]),
  }
}
export interface PrepayQueryRequest {
  'prepay_query_offers'?: trade.PrepayQueryOffer[];
  'pay_channel_horizontal_layout'?: boolean;
  'biz_scene'?: string;
  'cj_sdk_version': string;
}
export function PrepayQueryRequestToRequestData(data: PrepayQueryRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['prepay_query_offers', 'pay_channel_horizontal_layout', 'biz_scene', 'cj_sdk_version', ]),
  }
}
export interface PrepayQueryResponse {
  'status_code': number;
  'status_info'?: apix_common.StatusInfo;
  'prepay_info_map'?: Record<string, string>;
}
export function PrepayQueryResponseToRequestData(data: PrepayQueryResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'prepay_info_map', ]),
  }
}
export interface PurchaseAlbumReq {
  'offer_snapshot_id'?: string;
  'pay_channel': product.PayChannel;
  'item_id': number;
  'item_count': number;
  'item_cover': number;
  'contains_purchase_for_self'?: boolean;
}
export function PurchaseAlbumReqToRequestData(data: PurchaseAlbumReq): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['offer_snapshot_id', 'pay_channel', 'item_id', 'item_count', 'item_cover', 'contains_purchase_for_self', ]),
  }
}
export interface PurchaseBizExtra {
  'treasure_deduct_amount'?: product.TreasureDeductAmount;
}
export function PurchaseBizExtraToRequestData(data: PurchaseBizExtra): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['treasure_deduct_amount', ]),
  }
}
export interface PurchaseOffersByTokensForPCRequest {
  'token': string;
  'scene': string;
}
export function PurchaseOffersByTokensForPCRequestToRequestData(data: PurchaseOffersByTokensForPCRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['token', 'scene', ]),
    body: fieldsAssign(data, []),
  }
}
export interface PurchaseOffersForH5Request {
  'offer_snapshot_id': string;
  'report_params': string;
}
export function PurchaseOffersForH5RequestToRequestData(data: PurchaseOffersForH5Request): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['offer_snapshot_id', 'report_params', ]),
    body: fieldsAssign(data, []),
  }
}
export interface PurchaseProductRequest {
  'scene': string;
  'product_type': product.ProductType;
  'purchase_album_req'?: PurchaseAlbumReq;
}
export function PurchaseProductRequestToRequestData(data: PurchaseProductRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['scene', 'product_type', 'purchase_album_req', ]),
  }
}
export interface PurchaseProductResponse {
  'status_code': number;
  'status_info'?: apix_common.StatusInfo;
  'order_id'?: number;
  'paid_use_balance'?: boolean;
  'android_pay'?: trade.AndroidPay;
  'iap_pay'?: trade.IapPay;
  'current_balance'?: trade.Balance;
  'iap_balance_offers'?: product.OfferV2[];
  'coin_redeem_offers'?: treasure.CoinRedeemOffers;
}
export function PurchaseProductResponseToRequestData(data: PurchaseProductResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'order_id', 'paid_use_balance', 'android_pay', 'iap_pay', 'current_balance', 'iap_balance_offers', 'coin_redeem_offers', ]),
  }
}
export interface PurchaseRequest {
  'scene': string;
  'offer_snapshot_id': string;
  'pay_params'?: string;
  'benefited_type'?: trade.BenefitedType;
  'benefited_party_list'?: string[];
  'magic_activity_config'?: MagicActivityConfig;
  'biz_extra'?: PurchaseBizExtra;
}
export function PurchaseRequestToRequestData(data: PurchaseRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['scene', 'offer_snapshot_id', 'pay_params', 'benefited_type', 'benefited_party_list', 'magic_activity_config', 'biz_extra', ]),
  }
}
export interface PurchaseResponse {
  'status_code': number;
  'status_info'?: apix_common.StatusInfo;
  'order_id'?: number;
  'android_pay'?: trade.AndroidPay;
  'iap_pay'?: trade.IapPay;
}
export function PurchaseResponseToRequestData(data: PurchaseResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'order_id', 'android_pay', 'iap_pay', ]),
  }
}
export interface QueryGiftOrderBriefRequest {
  'gift_token': string;
  'sender_sec_uid': string;
}
export function QueryGiftOrderBriefRequestToRequestData(data: QueryGiftOrderBriefRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['gift_token', 'sender_sec_uid', ]),
  }
}
export interface QueryGiftOrderBriefResponse {
  'status_code': number;
  'status_info'?: apix_common.StatusInfo;
  'gift_order_brief'?: trade.GiftCardBrief;
}
export function QueryGiftOrderBriefResponseToRequestData(data: QueryGiftOrderBriefResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'gift_order_brief', ]),
  }
}
export interface ReceiveGiftRequest {
  'gift_token'?: string;
  'sender_sec_uid'?: string;
}
export function ReceiveGiftRequestToRequestData(data: ReceiveGiftRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['gift_token', 'sender_sec_uid', ]),
  }
}
export interface ReceiveGiftResponse {
  'status_code': number;
  'status_info'?: apix_common.StatusInfo;
}
export function ReceiveGiftResponseToRequestData(data: ReceiveGiftResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', ]),
  }
}
export interface ReceiveVoucherRequest {
  'voucher_template_list'?: string[];
}
export function ReceiveVoucherRequestToRequestData(data: ReceiveVoucherRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['voucher_template_list', ]),
  }
}
export interface ReceiveVoucherResponse {
  'status_code': number;
  'status_info'?: apix_common.StatusInfo;
  'receive_voucher_result'?: Record<string, voucher.ReceiveVoucherResult>;
}
export function ReceiveVoucherResponseToRequestData(data: ReceiveVoucherResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'receive_voucher_result', ]),
  }
}
export interface RedeemCodeRequest {
  'code': string;
}
export function RedeemCodeRequestToRequestData(data: RedeemCodeRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['code', ]),
  }
}
export interface RedeemCodeResponse {
  'status_code': number;
  'status_info'?: apix_common.StatusInfo;
}
export function RedeemCodeResponseToRequestData(data: RedeemCodeResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', ]),
  }
}
export interface ReportActionRequest {
  'actions'?: action.Action[];
}
export function ReportActionRequestToRequestData(data: ReportActionRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['actions', ]),
  }
}
export interface ReportActionResponse {
  'status_code': number;
  'status_info'?: apix_common.StatusInfo;
}
export function ReportActionResponseToRequestData(data: ReportActionResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', ]),
  }
}
export interface ReportIapAuxiliaryInfoRequest {
  'iap_auxiliary_info_map'?: Record<string, IapSubsAuxiliaryInfo>;
}
export function ReportIapAuxiliaryInfoRequestToRequestData(data: ReportIapAuxiliaryInfoRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['iap_auxiliary_info_map', ]),
  }
}
export interface ReportIapAuxiliaryInfoResponse {
  'status_code': number;
  'status_info'?: apix_common.StatusInfo;
}
export function ReportIapAuxiliaryInfoResponseToRequestData(data: ReportIapAuxiliaryInfoResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', ]),
  }
}
export interface ReportPurchaseActionRequest {
  'action_type': constants.PurchaseActionType;
  'order_id'?: number;
}
export function ReportPurchaseActionRequestToRequestData(data: ReportPurchaseActionRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['action_type', 'order_id', ]),
  }
}
export interface ReportPurchaseActionResponse {
  'status_code': number;
  'status_info'?: apix_common.StatusInfo;
}
export function ReportPurchaseActionResponseToRequestData(data: ReportPurchaseActionResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', ]),
  }
}
export interface RewardFinishedTaskInfo {
  'days_finished': number;
  'tasks_finished': number;
  'full_day'?: boolean;
  'all_full'?: boolean;
  'days_obtained'?: number;
  'minutes_obtained'?: number;
  'tasks_to_full_day'?: number;
  'pre_reward_last_day'?: number;
  'effect_time'?: number;
}
export function RewardFinishedTaskInfoToRequestData(data: RewardFinishedTaskInfo): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['days_finished', 'tasks_finished', 'full_day', 'all_full', 'days_obtained', 'minutes_obtained', 'tasks_to_full_day', 'pre_reward_last_day', 'effect_time', ]),
  }
}
export interface SceneOffers {
  'offer_map'?: Record<string, product.OfferV2>;
  'scene_offer_list'?: Record<string, OfferSnapshotIDList>;
  'default_purchase_price': number;
  'vip_center_quit_retention_popup'?: VipCenterQuitRetentionPopup;
  'popup_scene_map'?: Record<string, string[]>;
  'to_pre_fetch_product_ids'?: string[];
  'default_svip_purchase_price': number;
  'faq_entry_list'?: product.FAQEntry[];
  'more_purchase_methods'?: product.FAQEntry[];
}
export function SceneOffersToRequestData(data: SceneOffers): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['offer_map', 'scene_offer_list', 'default_purchase_price', 'vip_center_quit_retention_popup', 'popup_scene_map', 'to_pre_fetch_product_ids', 'default_svip_purchase_price', 'faq_entry_list', 'more_purchase_methods', ]),
  }
}
export interface SendGiftRequest {
  'order_id': number;
  'receiver_id': number;
}
export function SendGiftRequestToRequestData(data: SendGiftRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['order_id', 'receiver_id', ]),
  }
}
export interface SendGiftResponse {
  'status_code': number;
  'status_info'?: apix_common.StatusInfo;
}
export function SendGiftResponseToRequestData(data: SendGiftResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', ]),
  }
}
export interface SetAlbumDefaultCoverRequest {
  'album_id': number;
  'cover_id': number;
}
export function SetAlbumDefaultCoverRequestToRequestData(data: SetAlbumDefaultCoverRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['album_id', 'cover_id', ]),
  }
}
export interface SetAlbumDefaultCoverResponse {
  'status_code': number;
  'status_info'?: apix_common.StatusInfo;
}
export function SetAlbumDefaultCoverResponseToRequestData(data: SetAlbumDefaultCoverResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', ]),
  }
}
export interface SignAgreementByDefault {
  'vip_center': boolean;
  'popup': boolean;
  'svip_center': boolean;
}
export function SignAgreementByDefaultToRequestData(data: SignAgreementByDefault): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['vip_center', 'popup', 'svip_center', ]),
  }
}
export interface Trade {
  'allow_did_purchase': boolean;
  'auto_renew_infos'?: trade.AutoRenewInfo[];
  'has_paid_order': boolean;
  'jump_to_page'?: Page;
  'gift_cards'?: trade.GiftCardBrief[];
}
export function TradeToRequestData(data: Trade): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['allow_did_purchase', 'auto_renew_infos', 'has_paid_order', 'jump_to_page', 'gift_cards', ]),
  }
}
export interface UnBookAlbumRequest {
  'activity_id': string;
}
export function UnBookAlbumRequestToRequestData(data: UnBookAlbumRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['activity_id', ]),
  }
}
export interface UnBookAlbumResponse {
  'status_code': number;
  'status_info'?: apix_common.StatusInfo;
  'booking_result'?: BookingResult;
}
export function UnBookAlbumResponseToRequestData(data: UnBookAlbumResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'booking_result', ]),
  }
}
export interface ValidateRequest {
  'order_id': number;
}
export function ValidateRequestToRequestData(data: ValidateRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['order_id', ]),
  }
}
export interface ValidateResponse {
  'status_code': number;
  'status_info'?: apix_common.StatusInfo;
  'order_id'?: number;
  'order_status'?: trade.OrderStatus;
  'product_type'?: product.ProductType;
  'album'?: Album;
  'assets'?: benefit.Assets;
}
export function ValidateResponseToRequestData(data: ValidateResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'order_id', 'order_status', 'product_type', 'album', 'assets', ]),
  }
}
export interface VipCenterQuitRetentionPopup {
  'image'?: common.URLInfo;
  'btn_text': string;
  'offer_snapshot_id': string;
  'freq_ctrl_cnt': number;
  'freq_ctrl_interval_seconds': number;
  'btn_pop_text'?: string;
  'title_sub_text': string;
  'promotion_title_type': PromotionTitleType;
  'activity_text': string;
  'retention_tip'?: string;
  'promotion_price'?: number;
}
export function VipCenterQuitRetentionPopupToRequestData(data: VipCenterQuitRetentionPopup): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['image', 'btn_text', 'offer_snapshot_id', 'freq_ctrl_cnt', 'freq_ctrl_interval_seconds', 'btn_pop_text', 'title_sub_text', 'promotion_title_type', 'activity_text', 'retention_tip', 'promotion_price', ]),
  }
}
export type BubbleTriggerReason = string
export type Include = string
export type Page = string
