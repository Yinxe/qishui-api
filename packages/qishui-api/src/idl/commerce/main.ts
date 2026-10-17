// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../_common.js'
import * as common from '../api_common_thrift/common.js'

export const AbroadType_Abroad: number = 2
export const AbroadType_Normal: number = 0
export const Album: string = 'album'
export const AssetStatusExpired: number = 4
export const AssetStatusFailed: number = 3
export const AssetStatusRedeemed: number = 2
export const AssetStatusToRedeem: number = 1
export const AssetStatusUnknown: number = 0
export const AssetTypeYoukuVIP: string = 'YoukuVIP'
export const CancelStatusProcessing: number = 1
export const CancelStatusSuccess: number = 0
export const EcommerceExistOrder: string = 'exist_order'
export const EcommerceExistWaitOrder: string = 'exist_wait_order'
export const EcommerceOrderListUrl: string = 'order_list_url'
export const EcommerceWaitAll: string = 'wait_all'
export const EcommerceWaitDeliver: string = 'wait_deliver'
export const EcommerceWaitNone: string = 'wait_none'
export const EcommerceWaitPay: string = 'wait_pay'
export const EntitlementSceneDownload: string = 'Download'
export const EntitlementScenePlay: string = 'Play'
export const OneOff: string = 'one_off'
export const PageLogIn: string = 'log_in'
export const PageVipCenter: string = 'vip_center'
export const PaidTracks: string = 'paid_tracks'
export const Pay: string = 'pay'
export const PaymentDataTypeH5: string = 'h5'
export const PaymentDataTypeNative: string = 'native'
export const PaymentMethodAlipay: number = 3
export const PaymentMethodApple: number = 2
export const PaymentMethodBalancePay: number = 6
export const PaymentMethodBindPay: number = 7
export const PaymentMethodBytePay: number = 5
export const PaymentMethodDouyinStore: number = 9
export const PaymentMethodLunaBalance: number = 8
export const PaymentMethodSystem: number = 1
export const PaymentMethodUnknown: number = 0
export const PaymentMethodWxpay: number = 4
export const QualityHiRes: string = 'hi_res'
export const QualityHigher: string = 'higher'
export const QualityHighest: string = 'highest'
export const QualityImmersive: string = 'immersive'
export const QualityLossless: string = 'lossless'
export const QualityMedium: string = 'medium'
export const QualitySpatial: string = 'spatial'
export const RedeemFreeVIPStatusCanOnlyInviteNewUser: number = 12
export const RedeemFreeVIPStatusCannotInviteYourself: number = 10
export const RedeemFreeVIPStatusCycleRedeemedAlready: number = 2
export const RedeemFreeVIPStatusDeviceDupAccount: number = 1
export const RedeemFreeVIPStatusDeviceInviteeReachLimit: number = 11
export const RedeemFreeVIPStatusHasBeenInvited: number = 6
export const RedeemFreeVIPStatusInvitationCodeInvalid: number = 7
export const RedeemFreeVIPStatusInvitationCodeOutdated: number = 9
export const RedeemFreeVIPStatusInvitationCodeUsed: number = 8
export const RedeemFreeVIPStatusOutOfActivity: number = 13
export const RedeemFreeVIPStatusOverwriteByConfirmToast: number = 14
export const RedeemFreeVIPStatusSucc: number = 0
export const RedeemFreeVIPStatusTokenExpired: number = 5
export const RedeemFreeVIPStatusTokenRedeemedAlready: number = 3
export const RedeemFreeVIPStatusTokenUserMismatch: number = 4
export const Sign: string = 'sign'
export const SignPay: string = 'sign_pay'
export const TokenStatusExpired: number = 101
export const TokenStatusFinished: number = 100
export const TokenStatusInit: number = 0
export const TokenStatusOrderCreated: number = 1
export const UpsellLogExtraKeyStyleType: string = 'style_type'
export const UpsellStyleRewardAdsDefault: string = 'UpsellStyleRewardAdsDefault'
export const UpsellStyleRewardAdsExposureReward: string = 'UpsellStyleRewardAdsExposureReward'
export const UserPrivileges: string = 'user_privileges'
export const ValidateResponseOrderStatusCancelled: number = 3
export const ValidateResponseOrderStatusFail: number = 4
export const ValidateResponseOrderStatusPending: number = 2
export const ValidateResponseOrderStatusRefunded: number = 6
export const ValidateResponseOrderStatusSettled: number = 5
export const ValidateResponseOrderStatusUnknown: number = 0
export enum AutoRenewType {
  Month = 1,
  Year = 2,
  Quarter = 3,
}
export enum DisplayTypes {
  ACTION_SHEET = 1,
  BANNER = 2,
  SNACK_BAR = 3,
}
export enum FreeVIPActivityStage {
  Unlocking = 0,
  Consuming = 1,
  CountDown = 2,
  Expired = 3,
}
export enum OrderCreateStatus {
  Success = 1,
  NoMatchedOffer = 2,
  ExceedPurchaseLimit = 3,
}
export enum PaymentItemType {
  Album = 1,
}
export enum PopupType {
  Normal = 1,
  RedeemActivity = 2,
  SummerConcert = 3,
  VIPInvitationShare = 4,
  Promotion = 5,
  RewardAdsTaskVIPSongs = 6,
  RewardAdsTaskColdStart = 7,
}
export enum RedeemDateStatus {
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
export enum Style {
  Default = 0,
  FreeVipToVip = 1,
  FreeVipToSVip = 2,
  VipAutoNewToSvip = 3,
  VipAboutToExpire = 4,
  SvipAboutToExpire = 5,
  VipExpiredWithInDays = 6,
  SvipExpiredWithInDays = 7,
}
export enum UpsellTypes {
  VIP = 1,
  ADS = 2,
  TREASURE = 3,
}
// Ginex
export async function CancelSubscription(caller: IRequestCaller, req: CancelSubscriptionRequest, context: any): Promise<CancelSubscriptionResponse> {
  const requestData = mergeRequestData([
    CancelSubscriptionRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'CancelSubscription',
    paths: [{ method: 'POST', path: `/luna/commerce/offers/cancel` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function CheckRedeemCodeFromPhysicalCard(caller: IRequestCaller, req: CheckRedeemCodeRequest, context: any): Promise<CheckRedeemCodeResponse> {
  const requestData = mergeRequestData([
    CheckRedeemCodeRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'CheckRedeemCodeFromPhysicalCard',
    paths: [{ method: 'POST', path: `/luna/commerce/code/check` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetEcommerceOrderList(caller: IRequestCaller, req: GetEcommerceOrderListRequest, context: any): Promise<GetEcommerceOrderListResponse> {
  const requestData = mergeRequestData([
    GetEcommerceOrderListRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetEcommerceOrderList',
    paths: [{ method: 'GET', path: `/luna/commerce/ecommerce/order_list` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetEligibleOffers(caller: IRequestCaller, req: GetEligibleOffersRequest, context: any): Promise<GetEligibleOffersResponse> {
  const requestData = mergeRequestData([
    GetEligibleOffersRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetEligibleOffers',
    paths: [{ method: 'GET', path: `/luna/commerce/eligible_offers` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetInvitationCampaignInfo(caller: IRequestCaller, req: GetInvitationCampaignInfoRequest, context: any): Promise<GetInvitationCampaignInfoResponse> {
  const requestData = mergeRequestData([
    GetInvitationCampaignInfoRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetInvitationCampaignInfo',
    paths: [{ method: 'GET', path: `/luna/commerce/vip/invitation` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetMyAssets(caller: IRequestCaller, req: GetMyAssetsRequest, context: any): Promise<GetMyAssetsResponse> {
  const requestData = mergeRequestData([
    GetMyAssetsRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetMyAssets',
    paths: [{ method: 'GET', path: `/luna/commerce/me/assets` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetMyDownloadEntitlements(caller: IRequestCaller, req: GetMyDownloadEntitlementsRequest, context: any): Promise<GetMyDownloadEntitlementsResponse> {
  const requestData = mergeRequestData([
    GetMyDownloadEntitlementsRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetMyDownloadEntitlements',
    paths: [{ method: 'POST', path: `/luna/commerce/me/entitlements/download` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetMySubscription(caller: IRequestCaller, req: GetMySubscriptionRequest, context: any): Promise<GetMySubscriptionsResponse> {
  const requestData = mergeRequestData([
    GetMySubscriptionRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetMySubscription',
    paths: [{ method: 'GET', path: `/luna/commerce/me/subscription` }, { method: 'GET', path: `/luna/pc/commerce/me/subscription` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetPurchaseOfferToken(caller: IRequestCaller, req: GetPurchaseOfferTokenRequest, context: any): Promise<GetPurchaseOfferTokenResponse> {
  const requestData = mergeRequestData([
    GetPurchaseOfferTokenRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetPurchaseOfferToken',
    paths: [{ method: 'POST', path: `/luna/pc/commerce/offers/tokens` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetUpsells(caller: IRequestCaller, req: GetUpsellsRequest, context: any): Promise<GetUpsellsResponse> {
  const requestData = mergeRequestData([
    GetUpsellsRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetUpsells',
    paths: [{ method: 'GET', path: `/luna/commerce/upsells` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetUpsellsConfig(caller: IRequestCaller, req: GetUpsellsConfigRequest, context: any): Promise<GetUpsellsConfigResponse> {
  const requestData = mergeRequestData([
    GetUpsellsConfigRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetUpsellsConfig',
    paths: [{ method: 'GET', path: `/luna/commerce/upsells_config` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function ListLibraExperiments(caller: IRequestCaller, req: ListLibraExperimentsRequest, context: any): Promise<ListLibraExperimentsResponse> {
  const requestData = mergeRequestData([
    ListLibraExperimentsRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'ListLibraExperiments',
    paths: [{ method: 'GET', path: `/luna/commerce/experiments` }, ],
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
    paths: [{ method: 'POST', path: `/luna/commerce/offers/prepay_query` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function PurchaseOffer(caller: IRequestCaller, req: PurchaseOfferRequest, context: any): Promise<PurchaseOfferResponse> {
  const requestData = mergeRequestData([
    PurchaseOfferRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'PurchaseOffer',
    paths: [{ method: 'POST', path: `/luna/commerce/offers/purchase` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function PurchaseOfferByToken(caller: IRequestCaller, req: PurchaseOfferByTokenRequest, context: any): Promise<DummyResponse> {
  const requestData = mergeRequestData([
    PurchaseOfferByTokenRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'PurchaseOfferByToken',
    paths: [{ method: 'POST', path: `/luna/pc/commerce/offers/tokens/purchase` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function QueryTokenStatus(caller: IRequestCaller, req: QueryTokenStatusRequest, context: any): Promise<QueryTokenStatusResponse> {
  const requestData = mergeRequestData([
    QueryTokenStatusRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'QueryTokenStatus',
    paths: [{ method: 'GET', path: `/luna/pc/commerce/offers/tokens/status` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function RedeemAsset(caller: IRequestCaller, req: RedeemAssetRequest, context: any): Promise<RedeemAssetResponse> {
  const requestData = mergeRequestData([
    RedeemAssetRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'RedeemAsset',
    paths: [{ method: 'POST', path: `/luna/commerce/asset/redeem` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function RedeemCode(caller: IRequestCaller, req: RedeemVipCodeRequest, context: any): Promise<RedeemVipCodeResponse> {
  const requestData = mergeRequestData([
    RedeemVipCodeRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'RedeemCode',
    paths: [{ method: 'POST', path: `/luna/commerce/code/redeem` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function RedeemFreeVIP(caller: IRequestCaller, req: RedeemFreeVIPRequest, context: any): Promise<RedeemFreeVIPResponse> {
  const requestData = mergeRequestData([
    RedeemFreeVIPRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'RedeemFreeVIP',
    paths: [{ method: 'POST', path: `/luna/commerce/vip/redeem` }, ],
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
    paths: [{ method: 'POST', path: `/luna/commerce/action` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function ValidatePurchase(caller: IRequestCaller, req: ValidateRequest, context: any): Promise<ValidateResponse> {
  const requestData = mergeRequestData([
    ValidateRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'ValidatePurchase',
    paths: [{ method: 'POST', path: `/luna/commerce/offers/validate` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function ValidateReward(caller: IRequestCaller, req: ValidateRewardRequest, context: any): Promise<ValidateRewardResponse> {
  const requestData = mergeRequestData([
    ValidateRewardRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'ValidateReward',
    paths: [{ method: 'POST', path: `/luna/commerce/validate_reward` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export interface ActionItem {
  'item_id'?: string;
  'quality'?: Quality;
}
export function ActionItemToRequestData(data: ActionItem): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['item_id', 'quality', ]),
  }
}
export interface ActivityStage {
  'title'?: string;
  'stage': number;
}
export function ActivityStageToRequestData(data: ActivityStage): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['title', 'stage', ]),
  }
}
export interface AssetInfo {
  'asset_order_id': string;
  'asset_type': string;
  'asset_name'?: string;
  'asset_status'?: number;
  'redeem_expire_time'?: string;
  'redeem_time'?: string;
  'redeem_external_account'?: string;
  'asset_image'?: URLInfo;
}
export function AssetInfoToRequestData(data: AssetInfo): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['asset_order_id', 'asset_type', 'asset_name', 'asset_status', 'redeem_expire_time', 'redeem_time', 'redeem_external_account', 'asset_image', ]),
  }
}
export interface AutoRenewInfo {
  'type': AutoRenewType;
  'auto_renew_pay_due_date'?: string;
  'offer_vip_stage'?: string;
}
export function AutoRenewInfoToRequestData(data: AutoRenewInfo): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['type', 'auto_renew_pay_due_date', 'offer_vip_stage', ]),
  }
}
export interface Banner {
  'content'?: string;
  'title'?: string;
  'limited_free_content'?: string;
  'free_song_content'?: string;
  'priority'?: number;
  'icon_url'?: URLInfo;
}
export function BannerToRequestData(data: Banner): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['content', 'title', 'limited_free_content', 'free_song_content', 'priority', 'icon_url', ]),
  }
}
export interface BannerV2 {
  'title'?: string;
  'desc'?: RichText[];
}
export function BannerV2ToRequestData(data: BannerV2): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['title', 'desc', ]),
  }
}
export interface Benefit {
  'icon_url'?: URLInfo;
  'title'?: string;
  'sub_title'?: string;
}
export function BenefitToRequestData(data: Benefit): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['icon_url', 'title', 'sub_title', ]),
  }
}
export interface Button {
  'bg_pic'?: URLInfo;
  'jump_uri'?: string;
  'btn_type_name'?: string;
  'page_name'?: string;
}
export function ButtonToRequestData(data: Button): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['bg_pic', 'jump_uri', 'btn_type_name', 'page_name', ]),
  }
}
export interface CancelSubscriptionRequest {
}
export function CancelSubscriptionRequestToRequestData(data: CancelSubscriptionRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, []),
  }
}
export interface CancelSubscriptionResponse {
  'cancel_status'?: number;
  'status_code'?: number;
  'status_info'?: StatusInfo;
}
export function CancelSubscriptionResponseToRequestData(data: CancelSubscriptionResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['cancel_status', 'status_code', 'status_info', ]),
  }
}
export interface CheckRedeemCodeRequest {
  'code': string;
  'sign': string;
}
export function CheckRedeemCodeRequestToRequestData(data: CheckRedeemCodeRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['code', 'sign', ]),
  }
}
export interface CheckRedeemCodeResponse {
  'status_code': number;
  'status_info'?: StatusInfo;
}
export function CheckRedeemCodeResponseToRequestData(data: CheckRedeemCodeResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', ]),
  }
}
export interface Colour {
  'rgb'?: string;
  'alpha'?: string;
}
export function ColourToRequestData(data: Colour): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['rgb', 'alpha', ]),
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
export interface DownloadEntitlement {
  'remaining_download_quota': number;
  'total_download_quota': number;
}
export function DownloadEntitlementToRequestData(data: DownloadEntitlement): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['remaining_download_quota', 'total_download_quota', ]),
  }
}
export interface DownloadQuotaResource {
  'vip_center_content'?: string;
  'no_quota_toast_content'?: string;
}
export function DownloadQuotaResourceToRequestData(data: DownloadQuotaResource): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['vip_center_content', 'no_quota_toast_content', ]),
  }
}
export interface DummyResponse {
}
export function DummyResponseToRequestData(data: DummyResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, []),
  }
}
export interface EcommerceOrderList {
  'exist_order'?: boolean;
  'exist_wait_order'?: string;
  'order_list_url'?: string;
}
export function EcommerceOrderListToRequestData(data: EcommerceOrderList): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['exist_order', 'exist_wait_order', 'order_list_url', ]),
  }
}
export interface FixedEntrance {
  'title'?: string;
  'jump_uri'?: string;
  'style'?: Style;
}
export function FixedEntranceToRequestData(data: FixedEntrance): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['title', 'jump_uri', 'style', ]),
  }
}
export interface FreeVIPActivityDetail {
  'activity_stage': FreeVIPActivityStage;
  'total_cnt_redeem_days': number;
  'latest_redeem_time': number;
  'redeem_calendar_dates'?: RedeemCalendarDate[];
  'show_promotion_info': boolean;
  'tomorrow_redeemable': boolean;
  'redeem_end_time'?: number;
}
export function FreeVIPActivityDetailToRequestData(data: FreeVIPActivityDetail): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['activity_stage', 'total_cnt_redeem_days', 'latest_redeem_time', 'redeem_calendar_dates', 'show_promotion_info', 'tomorrow_redeemable', 'redeem_end_time', ]),
  }
}
export interface FreeVIPBanner {
  'title': string;
  'content': string;
  'jump_link'?: string;
  'banner_image'?: URLInfo;
}
export function FreeVIPBannerToRequestData(data: FreeVIPBanner): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['title', 'content', 'jump_link', 'banner_image', ]),
  }
}
export interface GetEcommerceOrderListRequest {
  'scenes'?: string[];
}
export function GetEcommerceOrderListRequestToRequestData(data: GetEcommerceOrderListRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['scenes', ]),
    body: fieldsAssign(data, []),
  }
}
export interface GetEcommerceOrderListResponse {
  'status_code': number;
  'status_info'?: StatusInfo;
  'ecommerce_order_list'?: EcommerceOrderList;
}
export function GetEcommerceOrderListResponseToRequestData(data: GetEcommerceOrderListResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'ecommerce_order_list', ]),
  }
}
export interface GetEligibleOffersRequest {
  'scene': string;
  'scenes'?: string[];
}
export function GetEligibleOffersRequestToRequestData(data: GetEligibleOffersRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['scene', 'scenes', ]),
    body: fieldsAssign(data, []),
  }
}
export interface GetEligibleOffersResponse {
  'to_purchase_offers'?: Offer[];
}
export function GetEligibleOffersResponseToRequestData(data: GetEligibleOffersResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['to_purchase_offers', ]),
  }
}
export interface GetInvitationCampaignInfoRequest {
  'user_id'?: string;
  'sec_uid'?: string;
}
export function GetInvitationCampaignInfoRequestToRequestData(data: GetInvitationCampaignInfoRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['user_id', 'sec_uid', ]),
    body: fieldsAssign(data, []),
  }
}
export interface GetInvitationCampaignInfoResponse {
  'inv_code': string;
  'inv_code_copy_script': string;
  'allow_redeem': boolean;
  'inv_records'?: InvitationRecord[];
  'time_remain': number;
  'invc_time_remain': number;
}
export function GetInvitationCampaignInfoResponseToRequestData(data: GetInvitationCampaignInfoResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['inv_code', 'inv_code_copy_script', 'allow_redeem', 'inv_records', 'time_remain', 'invc_time_remain', ]),
  }
}
export interface GetMyAssetsRequest {
}
export function GetMyAssetsRequestToRequestData(data: GetMyAssetsRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, []),
  }
}
export interface GetMyAssetsResponse {
  'status_code'?: number;
  'status_info'?: StatusInfo;
  'asset_infos'?: AssetInfo[];
}
export function GetMyAssetsResponseToRequestData(data: GetMyAssetsResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'asset_infos', ]),
  }
}
export interface GetMyDownloadEntitlementsRequest {
  'tracks'?: TrackBrief[];
}
export function GetMyDownloadEntitlementsRequestToRequestData(data: GetMyDownloadEntitlementsRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['tracks', ]),
  }
}
export interface GetMyDownloadEntitlementsResponse {
  'status_code'?: number;
  'status_info'?: StatusInfo;
  'track_download_entitlements'?: TrackDownloadEntitlement[];
  'remaining_download_quota': number;
  'total_download_quota': number;
  'resources'?: DownloadQuotaResource;
}
export function GetMyDownloadEntitlementsResponseToRequestData(data: GetMyDownloadEntitlementsResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'track_download_entitlements', 'remaining_download_quota', 'total_download_quota', 'resources', ]),
  }
}
export interface GetMySubscriptionRequest {
  'redeem_token'?: string;
  'first_req'?: boolean;
}
export function GetMySubscriptionRequestToRequestData(data: GetMySubscriptionRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['redeem_token', 'first_req', ]),
    body: fieldsAssign(data, []),
  }
}
export interface GetMySubscriptionsResponse {
  'status_code'?: number;
  'status_info'?: StatusInfo;
  'subs_info'?: SubsInfo;
  'to_purchase_offers'?: Offer[];
  'allow_did_purchase'?: boolean;
  'songtab_preview_banner'?: Banner;
  'songtab_preview_popup'?: Popup;
  'song_detail_popup'?: Popup;
  'vip_center_banner'?: Banner;
  'jump_to_page'?: Page;
  'page_resource'?: PageResource;
  'back_stage_return_popup'?: Popup;
  'regular_user_popup'?: Popup;
  'login_page'?: LoginPageResource;
  'me_tab_activity_button'?: Button;
  'redeem_calendar'?: RedeemCalendar;
  'first_login_popup'?: Popup;
  'free_vip_activity_detail'?: FreeVIPActivityDetail;
  'sign_agreement_by_default'?: SignAgreementByDefault;
  'hide_recovery_entrance'?: boolean;
  'default_purchase_price'?: number;
  'vip_center_retention_popup'?: VipCenterQuitRetentionPopup;
  'auto_renew_cancel_guidance': boolean;
  'to_purchase_svip_offers'?: Offer[];
  'to_pre_fetch_product_ids'?: string[];
  'to_purchase_offers_by_scene'?: Record<string, PopupOffer[]>;
  'vip_center_default_tab'?: string;
}
export function GetMySubscriptionsResponseToRequestData(data: GetMySubscriptionsResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'subs_info', 'to_purchase_offers', 'allow_did_purchase', 'songtab_preview_banner', 'songtab_preview_popup', 'song_detail_popup', 'vip_center_banner', 'jump_to_page', 'page_resource', 'back_stage_return_popup', 'regular_user_popup', 'login_page', 'me_tab_activity_button', 'redeem_calendar', 'first_login_popup', 'free_vip_activity_detail', 'sign_agreement_by_default', 'hide_recovery_entrance', 'default_purchase_price', 'vip_center_retention_popup', 'auto_renew_cancel_guidance', 'to_purchase_svip_offers', 'to_pre_fetch_product_ids', 'to_purchase_offers_by_scene', 'vip_center_default_tab', ]),
  }
}
export interface GetPurchaseOfferTokenRequest {
  'offer_id': string;
  'report_param': string;
}
export function GetPurchaseOfferTokenRequestToRequestData(data: GetPurchaseOfferTokenRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['offer_id', 'report_param', ]),
  }
}
export interface GetPurchaseOfferTokenResponse {
  'status_code'?: number;
  'status_info'?: StatusInfo;
  'token'?: string;
}
export function GetPurchaseOfferTokenResponseToRequestData(data: GetPurchaseOfferTokenResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'token', ]),
  }
}
export interface GetUpsellsConfigRequest {
  'scene'?: common.RequestScene;
  'free_vip_token'?: string;
  'first_req'?: boolean;
}
export function GetUpsellsConfigRequestToRequestData(data: GetUpsellsConfigRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['scene', 'free_vip_token', 'first_req', ]),
    body: fieldsAssign(data, []),
  }
}
export interface GetUpsellsConfigResponse {
  'status_code'?: number;
  'status_info'?: StatusInfo;
  'upsell_configs'?: Record<string, UpsellConfig>;
  'more_upsell_configs'?: Record<string, Record<string, UpsellConfig>>;
}
export function GetUpsellsConfigResponseToRequestData(data: GetUpsellsConfigResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'upsell_configs', 'more_upsell_configs', ]),
  }
}
export interface GetUpsellsRequest {
  'scene'?: common.RequestScene;
  'free_vip_token'?: string;
  'first_req'?: boolean;
  'need_payment_compensation'?: boolean;
}
export function GetUpsellsRequestToRequestData(data: GetUpsellsRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['scene', 'free_vip_token', 'first_req', 'need_payment_compensation', ]),
    body: fieldsAssign(data, []),
  }
}
export interface GetUpsellsResponse {
  'status_code'?: number;
  'status_info'?: StatusInfo;
  'upsell_infos'?: Record<string, UpsellInfo>;
  'intercept_type'?: string;
  'sell_vip_type'?: string;
  'libra_params_map'?: Record<string, string>;
}
export function GetUpsellsResponseToRequestData(data: GetUpsellsResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'upsell_infos', 'intercept_type', 'sell_vip_type', 'libra_params_map', ]),
  }
}
export interface IapPurchaseInfo {
  'app_id'?: string;
  'merchant_id'?: string;
  'product_id'?: string;
}
export function IapPurchaseInfoToRequestData(data: IapPurchaseInfo): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['app_id', 'merchant_id', 'product_id', ]),
  }
}
export interface InvitationRecord {
  'user_info'?: UserBrief;
}
export function InvitationRecordToRequestData(data: InvitationRecord): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['user_info', ]),
  }
}
export interface LibraExperiment {
  'id'?: number;
  'title'?: string;
  'libra_id'?: number;
  'link'?: string;
}
export function LibraExperimentToRequestData(data: LibraExperiment): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['id', 'title', 'libra_id', 'link', ]),
  }
}
export interface ListLibraExperimentsRequest {
  'page_num': string;
  'page_size': string;
}
export function ListLibraExperimentsRequestToRequestData(data: ListLibraExperimentsRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['page_num', 'page_size', ]),
    body: fieldsAssign(data, []),
  }
}
export interface ListLibraExperimentsResponse {
  'status_code'?: number;
  'status_info'?: StatusInfo;
  'experiments'?: LibraExperiment[];
  'activity_stages'?: ActivityStage[];
}
export function ListLibraExperimentsResponseToRequestData(data: ListLibraExperimentsResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'experiments', 'activity_stages', ]),
  }
}
export interface LoginPageResource {
  'content_text'?: string;
}
export function LoginPageResourceToRequestData(data: LoginPageResource): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['content_text', ]),
  }
}
export interface MaskInfo {
  'mask_text'?: string;
  'jump_uri'?: string;
}
export function MaskInfoToRequestData(data: MaskInfo): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['mask_text', 'jump_uri', ]),
  }
}
export interface MembershipDetail {
  'expire_time': number;
}
export function MembershipDetailToRequestData(data: MembershipDetail): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['expire_time', ]),
  }
}
export interface Offer {
  'currency_code'?: string;
  'external_offer_id'?: string;
  'offer_id'?: string;
  'resource'?: Resource;
  'amount': number;
  'offer_type'?: string;
  'offer_sub_type'?: string;
  'original_amount': number;
  'vip_stage'?: string;
  'encrypted_offer_identifier'?: string;
  'offer_promotion_type'?: number;
  'buy_redeem_days'?: number;
}
export function OfferToRequestData(data: Offer): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['currency_code', 'external_offer_id', 'offer_id', 'resource', 'amount', 'offer_type', 'offer_sub_type', 'original_amount', 'vip_stage', 'encrypted_offer_identifier', 'offer_promotion_type', 'buy_redeem_days', ]),
  }
}
export interface OfferParams {
  'type'?: string;
}
export function OfferParamsToRequestData(data: OfferParams): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['type', ]),
  }
}
export interface OfferPreview {
  'background_img'?: URLInfo;
  'name'?: string;
  'desc'?: string;
  'price'?: string;
  'selected'?: boolean;
  'promotion_info'?: OfferPromotionInfo;
  'rich_desc'?: RichText[];
  'delayed_show'?: boolean;
}
export function OfferPreviewToRequestData(data: OfferPreview): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['background_img', 'name', 'desc', 'price', 'selected', 'promotion_info', 'rich_desc', 'delayed_show', ]),
  }
}
export interface OfferPromotionInfo {
  'origin_price'?: string;
  'promotion_label'?: string;
  'show_countdown'?: boolean;
  'bottom_label'?: string;
  'countdown_duration'?: number;
  'origin_price_amount'?: number;
  'promotion_type'?: number;
  'with_effect'?: boolean;
  'with_effect_one_off'?: boolean;
  'top_span_groups'?: string[];
}
export function OfferPromotionInfoToRequestData(data: OfferPromotionInfo): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['origin_price', 'promotion_label', 'show_countdown', 'bottom_label', 'countdown_duration', 'origin_price_amount', 'promotion_type', 'with_effect', 'with_effect_one_off', 'top_span_groups', ]),
  }
}
export interface OrderInfo {
  'paid_amount'?: number;
  'payment_method'?: string;
}
export function OrderInfoToRequestData(data: OrderInfo): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['paid_amount', 'payment_method', ]),
  }
}
export interface PageResource {
  'bg_color'?: string;
  'bg_pic'?: URLInfo;
  'banner'?: Banner;
  'current_plan'?: string;
  'banner_v2'?: BannerV2;
}
export function PageResourceToRequestData(data: PageResource): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['bg_color', 'bg_pic', 'banner', 'current_plan', 'banner_v2', ]),
  }
}
export interface PaymentItemInfo {
  'item_id': string;
  'item_type'?: PaymentItemType;
  'quantity'?: number;
}
export function PaymentItemInfoToRequestData(data: PaymentItemInfo): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['item_id', 'item_type', 'quantity', ]),
  }
}
export interface PaymentMethodInfo {
  'payment_method'?: string;
  'name'?: string;
  'icon_url'?: URLInfo;
}
export function PaymentMethodInfoToRequestData(data: PaymentMethodInfo): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['payment_method', 'name', 'icon_url', ]),
  }
}
export interface PlayEntitlements {
  'expire_at': number;
  'reward_tasks_finished': number;
  'reward_tasks_time_ms'?: number[];
  'video_complete_acquired_time_ms'?: number[];
}
export function PlayEntitlementsToRequestData(data: PlayEntitlements): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['expire_at', 'reward_tasks_finished', 'reward_tasks_time_ms', 'video_complete_acquired_time_ms', ]),
  }
}
export interface Popup {
  'title'?: string;
  'subtitle'?: string;
  'btn_text'?: string;
  'bg_pic'?: URLInfo;
  'popup_type'?: PopupType;
  'bg_color'?: string;
  'second_title'?: string;
}
export function PopupToRequestData(data: Popup): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['title', 'subtitle', 'btn_text', 'bg_pic', 'popup_type', 'bg_color', 'second_title', ]),
  }
}
export interface PopupContent {
  'content_type'?: PopupContentType;
  'paid_tracks'?: PopupPaidTrack[];
}
export function PopupContentToRequestData(data: PopupContent): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['content_type', 'paid_tracks', ]),
  }
}
export interface PopupOffer {
  'id': string;
  'name'?: string;
  'sub_title'?: string;
  'sku_tag'?: string;
  'show_countdown'?: boolean;
  'promotion_label'?: string;
  'bubble_text'?: string;
  'bottom_label'?: string;
  'with_effect'?: boolean;
}
export function PopupOfferToRequestData(data: PopupOffer): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['id', 'name', 'sub_title', 'sku_tag', 'show_countdown', 'promotion_label', 'bubble_text', 'bottom_label', 'with_effect', ]),
  }
}
export interface PopupPaidTrack {
  'name'?: string;
  'artist_name'?: string;
  'url_cover'?: URLInfo;
  'tags'?: string[];
}
export function PopupPaidTrackToRequestData(data: PopupPaidTrack): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['name', 'artist_name', 'url_cover', 'tags', ]),
  }
}
export interface PrepayQueryOffer {
  'offer_id': string;
  'pre_component_params'?: string;
}
export function PrepayQueryOfferToRequestData(data: PrepayQueryOffer): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['offer_id', 'pre_component_params', ]),
  }
}
export interface PrepayQueryRequest {
  'prepay_query_offers': string;
}
export function PrepayQueryRequestToRequestData(data: PrepayQueryRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['prepay_query_offers', ]),
    body: fieldsAssign(data, []),
  }
}
export interface PrepayQueryResponse {
  'status_code': number;
  'status_info'?: StatusInfo;
  'prepay_info_map'?: Record<string, string>;
}
export function PrepayQueryResponseToRequestData(data: PrepayQueryResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'prepay_info_map', ]),
  }
}
export interface PurchaseBtn {
  'purchase_action_text'?: string;
  'colours'?: Colour[];
  'bubble_text': string;
  'dynamic_purchase_action_text'?: string;
}
export function PurchaseBtnToRequestData(data: PurchaseBtn): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['purchase_action_text', 'colours', 'bubble_text', 'dynamic_purchase_action_text', ]),
  }
}
export interface PurchaseOfferByTokenRequest {
  'token': string;
}
export function PurchaseOfferByTokenRequestToRequestData(data: PurchaseOfferByTokenRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['token', ]),
    body: fieldsAssign(data, []),
  }
}
export interface PurchaseOfferRequest {
  'offer_id'?: string;
  'payment_method'?: string;
  'item_id'?: string;
  'item_type'?: PaymentItemType;
  'quantity'?: number;
  'encrypted_offer_identifier'?: string;
  'one_step_order'?: boolean;
  'pay_params'?: string;
}
export function PurchaseOfferRequestToRequestData(data: PurchaseOfferRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['offer_id', 'payment_method', 'item_id', 'item_type', 'quantity', 'encrypted_offer_identifier', 'one_step_order', 'pay_params', ]),
  }
}
export interface PurchaseOfferResponse {
  'order_id'?: string;
  'pcs_order_id'?: string;
  'amount'?: number;
  'payment_data'?: string;
  'iap_purchase_info'?: string;
  'status_code'?: number;
  'status_info'?: StatusInfo;
  'payment_data_type'?: string;
  'order_status'?: number;
  'order_create_status'?: OrderCreateStatus;
  'to_purchase_offers'?: Offer[];
  'current_balance'?: number;
  'pay_type'?: string;
  'iap_purchase_info_v2'?: string;
}
export function PurchaseOfferResponseToRequestData(data: PurchaseOfferResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['order_id', 'pcs_order_id', 'amount', 'payment_data', 'iap_purchase_info', 'status_code', 'status_info', 'payment_data_type', 'order_status', 'order_create_status', 'to_purchase_offers', 'current_balance', 'pay_type', 'iap_purchase_info_v2', ]),
  }
}
export interface QueryTokenStatusRequest {
  'token': string;
}
export function QueryTokenStatusRequestToRequestData(data: QueryTokenStatusRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['token', ]),
    body: fieldsAssign(data, []),
  }
}
export interface QueryTokenStatusResponse {
  'token_status': number;
  'order_id'?: string;
  'order_status'?: number;
  'order_info'?: OrderInfo;
  'vip_info'?: VipInfo;
  'status_code'?: number;
  'status_info'?: StatusInfo;
}
export function QueryTokenStatusResponseToRequestData(data: QueryTokenStatusResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['token_status', 'order_id', 'order_status', 'order_info', 'vip_info', 'status_code', 'status_info', ]),
  }
}
export interface RedeemAssetRequest {
  'asset_order_id': string;
  'external_account'?: string;
  'asset_name': string;
}
export function RedeemAssetRequestToRequestData(data: RedeemAssetRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['asset_order_id', 'external_account', 'asset_name', ]),
  }
}
export interface RedeemAssetResponse {
  'status_code': number;
  'status_info'?: StatusInfo;
  'asset_info'?: AssetInfo;
}
export function RedeemAssetResponseToRequestData(data: RedeemAssetResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'asset_info', ]),
  }
}
export interface RedeemCalendar {
  'redeem_calendar_dates'?: RedeemCalendarDate[];
  'latest_redeem_time': number;
  'total_cnt_redeem_days': number;
  'title': string;
  'subtitle': string;
  'btn_text'?: string;
}
export function RedeemCalendarToRequestData(data: RedeemCalendar): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['redeem_calendar_dates', 'latest_redeem_time', 'total_cnt_redeem_days', 'title', 'subtitle', 'btn_text', ]),
  }
}
export interface RedeemCalendarDate {
  'date'?: string;
  'status': RedeemDateStatus;
  'content'?: string;
}
export function RedeemCalendarDateToRequestData(data: RedeemCalendarDate): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['date', 'status', 'content', ]),
  }
}
export interface RedeemFreeVIPInfo {
  'redeem_succ_text': string;
  'redeem_fail_text': string;
  'redeem_status': RedeemFreeVIPStatus;
}
export function RedeemFreeVIPInfoToRequestData(data: RedeemFreeVIPInfo): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['redeem_succ_text', 'redeem_fail_text', 'redeem_status', ]),
  }
}
export interface RedeemFreeVIPRequest {
  'redeem_token'?: string;
  'first_req'?: boolean;
  'invitation_code'?: string;
  'activity_name'?: string;
}
export function RedeemFreeVIPRequestToRequestData(data: RedeemFreeVIPRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['redeem_token', 'first_req', 'invitation_code', 'activity_name', ]),
  }
}
export interface RedeemFreeVIPResource {
  'redeem_succ_popup'?: Popup;
}
export function RedeemFreeVIPResourceToRequestData(data: RedeemFreeVIPResource): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['redeem_succ_popup', ]),
  }
}
export interface RedeemFreeVIPResponse {
  'status_code': number;
  'status_info'?: StatusInfo;
  'redeem_free_vip_info'?: RedeemFreeVIPInfo;
  'redeem_free_vip_resource'?: RedeemFreeVIPResource;
  'subs_info'?: SubsInfo;
  'redeem_calendar'?: RedeemCalendar;
  'free_vip_banner'?: FreeVIPBanner;
  'free_vip_activity_detail'?: FreeVIPActivityDetail;
  'redeem_upsell_infos'?: Record<string, UpsellInfo>;
  'entitlement_confirm_toast'?: ConfirmToast;
}
export function RedeemFreeVIPResponseToRequestData(data: RedeemFreeVIPResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'redeem_free_vip_info', 'redeem_free_vip_resource', 'subs_info', 'redeem_calendar', 'free_vip_banner', 'free_vip_activity_detail', 'redeem_upsell_infos', 'entitlement_confirm_toast', ]),
  }
}
export interface RedeemVipCodeRequest {
  'code': string;
  'sign': string;
}
export function RedeemVipCodeRequestToRequestData(data: RedeemVipCodeRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['code', 'sign', ]),
  }
}
export interface RedeemVipCodeResponse {
  'status_code'?: number;
  'status_info'?: StatusInfo;
}
export function RedeemVipCodeResponseToRequestData(data: RedeemVipCodeResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', ]),
  }
}
export interface ReportActionRequest {
  'action_type'?: string;
  'item_type'?: string;
  'action_items'?: ActionItem[];
}
export function ReportActionRequestToRequestData(data: ReportActionRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['action_type', 'item_type', 'action_items', ]),
  }
}
export interface ReportActionResponse {
  'report_results'?: ReportResult[];
  'status_code'?: number;
  'status_info'?: StatusInfo;
}
export function ReportActionResponseToRequestData(data: ReportActionResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['report_results', 'status_code', 'status_info', ]),
  }
}
export interface ReportResult {
  'action_item'?: ActionItem;
}
export function ReportResultToRequestData(data: ReportResult): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['action_item', ]),
  }
}
export interface Resource {
  'resource_id'?: string;
  'benefits'?: Benefit[];
  'offer_preview'?: OfferPreview;
  'purchase_btn'?: PurchaseBtn;
  'policy_tip'?: RichText[];
  'user_agreement'?: RichText[];
  'offer_params'?: OfferParams;
  'supported_payment_methods'?: PaymentMethodInfo[];
  'pc_payment_guidance_copy'?: string;
  'renew_price'?: number;
}
export function ResourceToRequestData(data: Resource): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['resource_id', 'benefits', 'offer_preview', 'purchase_btn', 'policy_tip', 'user_agreement', 'offer_params', 'supported_payment_methods', 'pc_payment_guidance_copy', 'renew_price', ]),
  }
}
export interface RichText {
  'link'?: string;
  'text'?: string;
  'text_color'?: string;
  'is_line_break'?: boolean;
  'is_auto_renew_tip'?: boolean;
  'is_download_quota_tip'?: boolean;
  'is_dy_pay_promotion_tip'?: boolean;
  'is_benefit_tip'?: boolean;
}
export function RichTextToRequestData(data: RichText): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['link', 'text', 'text_color', 'is_line_break', 'is_auto_renew_tip', 'is_download_quota_tip', 'is_dy_pay_promotion_tip', 'is_benefit_tip', ]),
  }
}
export interface SignAgreementByDefault {
  'vip_center'?: number;
  'popup'?: number;
  'svip_center'?: number;
}
export function SignAgreementByDefaultToRequestData(data: SignAgreementByDefault): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['vip_center', 'popup', 'svip_center', ]),
  }
}
export interface StatusInfo {
  'error_detail'?: string;
  'log_id'?: string;
  'now'?: number;
  'status_msg'?: string;
  'ab_param'?: string;
}
export function StatusInfoToRequestData(data: StatusInfo): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['error_detail', 'log_id', 'now', 'status_msg', 'ab_param', ]),
  }
}
export interface SubsInfo {
  'subs_id'?: string;
  'expire_date'?: string;
  'in_grace_period'?: boolean;
  'offer'?: Offer;
  'payment_method_id'?: string;
  'is_vip': boolean;
  'vip_stage': string;
  'auto_renew_status'?: boolean;
  'auto_renew_payment_method'?: number;
  'play_entitlements'?: common.PlayEntitlements;
  'download_entitlement'?: DownloadEntitlement;
  'auto_renew_info'?: AutoRenewInfo;
  'is_paying_user'?: boolean;
  'renew_amount'?: number;
  'three_days_about_to_expire'?: boolean;
  'has_charged_subscription_order'?: boolean;
  'vip_label_suffix'?: string;
  'membership_detail_map'?: Record<string, MembershipDetail>;
  'has_lossless_entitlement'?: boolean;
  'modifier_vip_label_suffix'?: string;
  'tea_statistics'?: TeaStatistics;
}
export function SubsInfoToRequestData(data: SubsInfo): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['subs_id', 'expire_date', 'in_grace_period', 'offer', 'payment_method_id', 'is_vip', 'vip_stage', 'auto_renew_status', 'auto_renew_payment_method', 'play_entitlements', 'download_entitlement', 'auto_renew_info', 'is_paying_user', 'renew_amount', 'three_days_about_to_expire', 'has_charged_subscription_order', 'vip_label_suffix', 'membership_detail_map', 'has_lossless_entitlement', 'modifier_vip_label_suffix', 'tea_statistics', ]),
  }
}
export interface TeaStatistics {
  'vip_unused_days'?: number;
  'vip_expired_days'?: number;
  'vip_expired_type'?: string;
}
export function TeaStatisticsToRequestData(data: TeaStatistics): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['vip_unused_days', 'vip_expired_days', 'vip_expired_type', ]),
  }
}
export interface TrackBrief {
  'track_id'?: string;
  'quality'?: Quality;
}
export function TrackBriefToRequestData(data: TrackBrief): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['track_id', 'quality', ]),
  }
}
export interface TrackDownloadEntitlement {
  'track_id'?: string;
  'quality'?: Quality;
  'need_download_quota': boolean;
}
export function TrackDownloadEntitlementToRequestData(data: TrackDownloadEntitlement): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['track_id', 'quality', 'need_download_quota', ]),
  }
}
export interface URLInfo {
  'uri'?: string;
  'urls'?: string[];
  'template'?: string;
  'template_prefix'?: string;
  'need_complete_url'?: boolean;
}
export function URLInfoToRequestData(data: URLInfo): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['uri', 'urls', 'template', 'template_prefix', 'need_complete_url', ]),
  }
}
export interface UpsellConfig {
  'is_valid': boolean;
  'max_count': number;
  'min_interval_time': number;
  'remain_time_trigger': number;
  'downgrade_scene': string;
  'global_max_count': number;
  'frequency_control_key'?: string;
  'min_interval_time_unit'?: string;
  'exit_show_7_days_cnt'?: number;
  'exit_days_cnt'?: number;
}
export function UpsellConfigToRequestData(data: UpsellConfig): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['is_valid', 'max_count', 'min_interval_time', 'remain_time_trigger', 'downgrade_scene', 'global_max_count', 'frequency_control_key', 'min_interval_time_unit', 'exit_show_7_days_cnt', 'exit_days_cnt', ]),
  }
}
export interface UpsellInfo {
  'title'?: string;
  'subtitle'?: string;
  'content'?: string;
  'bg_color'?: string;
  'bg_image'?: URLInfo;
  'btn_text'?: string;
  'jump_uri'?: string;
  'reward_btn_text'?: string;
  'bottom_image'?: URLInfo;
  'banner_v2'?: BannerV2;
  'sub_btn_text'?: string;
  'btn_link'?: string;
  'sub_btn_link'?: string;
  'display_type'?: DisplayTypes;
  'upsell_type'?: UpsellTypes;
  'to_purchase_offer'?: Offer;
  'upsell_url'?: string;
  'popup_content'?: PopupContent;
  'id'?: string;
  'more_upsells'?: Record<string, UpsellInfo>;
  'need_backup_check'?: boolean;
  'backup_url'?: string;
  'button_bubble_text'?: string;
  'sub_button_bubble_text'?: string;
  'mask_info'?: MaskInfo;
  'reward_ads_cold_start_style'?: string;
  'btn_second_line_text'?: string;
  'template'?: string;
  'vip_stage'?: string;
  'voice_prompt_info'?: VoicePromptInfo;
  'variables'?: Record<string, string>;
  'fixed_entrance'?: FixedEntrance;
  'disabled'?: boolean;
  'top_asset'?: string;
  'popup_style'?: string;
  'btn_type_name'?: string;
  'page_name'?: string;
  'popup_type'?: PopupType;
  'image_banner_id'?: string;
  'sell_vip_type'?: string;
  'log_extra'?: Record<string, string>;
}
export function UpsellInfoToRequestData(data: UpsellInfo): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['title', 'subtitle', 'content', 'bg_color', 'bg_image', 'btn_text', 'jump_uri', 'reward_btn_text', 'bottom_image', 'banner_v2', 'sub_btn_text', 'btn_link', 'sub_btn_link', 'display_type', 'upsell_type', 'to_purchase_offer', 'upsell_url', 'popup_content', 'id', 'more_upsells', 'need_backup_check', 'backup_url', 'button_bubble_text', 'sub_button_bubble_text', 'mask_info', 'reward_ads_cold_start_style', 'btn_second_line_text', 'template', 'vip_stage', 'voice_prompt_info', 'variables', 'fixed_entrance', 'disabled', 'top_asset', 'popup_style', 'btn_type_name', 'page_name', 'popup_type', 'image_banner_id', 'sell_vip_type', 'log_extra', ]),
  }
}
export interface UserBrief {
  'id'?: string;
  'nickname'?: string;
  'medium_avatar_url'?: URLInfo;
  'thumb_avatar_url'?: URLInfo;
  'sec_uid'?: string;
}
export function UserBriefToRequestData(data: UserBrief): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['id', 'nickname', 'medium_avatar_url', 'thumb_avatar_url', 'sec_uid', ]),
  }
}
export interface ValidateRequest {
  'order_id'?: string;
  'payment_method'?: string;
  'is_external_success'?: boolean;
  'external_error_info'?: string;
  'external_order_id'?: string;
}
export function ValidateRequestToRequestData(data: ValidateRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['order_id', 'payment_method', 'is_external_success', 'external_error_info', 'external_order_id', ]),
  }
}
export interface ValidateResponse {
  'order_id'?: string;
  'order_status'?: number;
  'order_info'?: OrderInfo;
  'vip_info'?: VipInfo;
  'status_code'?: number;
  'status_info'?: StatusInfo;
  'payment_item_info'?: PaymentItemInfo;
  'asset_infos'?: AssetInfo[];
}
export function ValidateResponseToRequestData(data: ValidateResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['order_id', 'order_status', 'order_info', 'vip_info', 'status_code', 'status_info', 'payment_item_info', 'asset_infos', ]),
  }
}
export interface ValidateRewardRequest {
  'transaction_id': string;
}
export function ValidateRewardRequestToRequestData(data: ValidateRewardRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['transaction_id', ]),
  }
}
export interface ValidateRewardResponse {
  'status_code'?: number;
  'status_info'?: StatusInfo;
  'transaction_success': boolean;
  'subs_info'?: SubsInfo;
}
export function ValidateRewardResponseToRequestData(data: ValidateRewardResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'transaction_success', 'subs_info', ]),
  }
}
export interface VipCenterQuitRetentionPopup {
  'image'?: URLInfo;
  'btn_text': string;
  'offer_id': string;
  'freq_ctrl_cnt': number;
  'freq_ctrl_interval_seconds': number;
}
export function VipCenterQuitRetentionPopupToRequestData(data: VipCenterQuitRetentionPopup): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['image', 'btn_text', 'offer_id', 'freq_ctrl_cnt', 'freq_ctrl_interval_seconds', ]),
  }
}
export interface VipInfo {
  'expire_date'?: string;
  'is_vip': boolean;
}
export function VipInfoToRequestData(data: VipInfo): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['expire_date', 'is_vip', ]),
  }
}
export interface VoicePromptInfo {
  'voice_prompt_position'?: string;
  'voice_prompt_threshold'?: number;
  'voice_prompt_resource'?: string;
  'voice_prompt_scene_resource'?: Record<string, string>;
  'voice_interrupt_max_count': number;
  'bind_play_entitlement_expired_popup'?: boolean;
  'distinguish_interrupt_type'?: boolean;
}
export function VoicePromptInfoToRequestData(data: VoicePromptInfo): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['voice_prompt_position', 'voice_prompt_threshold', 'voice_prompt_resource', 'voice_prompt_scene_resource', 'voice_interrupt_max_count', 'bind_play_entitlement_expired_popup', 'distinguish_interrupt_type', ]),
  }
}
export type AbroadType = number
export type EcommerceOrderListScene = string
export type EcommerceWaitOrderStatus = string
export type EntitlementType = string
export type Page = string
export type PayType = string
export type PopupContentType = string
export type Quality = string
export type RedeemFreeVIPStatus = number
