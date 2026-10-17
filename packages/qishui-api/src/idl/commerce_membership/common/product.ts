// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'
import * as apix_common from '../../commerce_apix/apix_common.js'
import * as common from './common.js'

export const CancelPurchase: string = 'cancel_purchase'
export const ConfirmAndDialog: string = 'dialog_and_confirm'
export const ContinuePurchase: string = 'continue_purchase'
export const FAQEntryDisplayStyleCard: string = 'card'
export const FAQEntryDisplayStyleTextLink: string = 'text_link'
export const HelpAndFeedback: string = 'help_and_feedback'
export const LynxView: string = 'lynxview'
export const MarketingActivity: string = 'marketing_activity'
export const MemberRedemption: string = 'member_redemption'
export const MembershipTypeFree: string = 'free'
export const MembershipTypeFreeVIP: string = 'free_vip'
export const MembershipTypeSVIP: string = 'svip'
export const MembershipTypeVIP: string = 'vip'
export const ProductCategoryNoneVIP: string = 'none_vip'
export const ProductCategoryOneDay: string = 'one_day'
export const ProductCategoryOneMonth: string = 'one_month'
export const ProductCategoryOneWeek: string = 'one_week'
export const ProductCategorySixMonth: string = 'six_month'
export const ProductCategoryThreeMonth: string = 'three_month'
export const ProductCategoryTwoWeek: string = 'two_week'
export const ProductCategoryYear: string = 'year'
export const PurchaseTypeAutoRenew: string = 'auto_renew'
export const PurchaseTypeCoupon: string = 'coupon'
export const PurchaseTypeOneOff: string = 'one_off'
export const PurchaseTypeSystem: string = 'system'
export const Receive2G: string = 'receive_2g'
export const RenewCancel: string = 'renew_cancel'
export const ResourceEffectFallbackAndFlashing: string = 'auto_renew_cancel_fallback_promotion_label_flashing'
export const ResourceEffectRedPacket: string = 'redpacket'
export const SendCancelSubs: string = 'send_cancel_subs_and_purchase'
export const SendVipGift: string = 'send_vip_gift'
export const VIPUnfund: string = 'vip_unfund'
export const WebView: string = 'webview'
export enum ActivityType {
  None = 0,
  NewUser = 1,
  FirstRenew = 2,
  YoukuMonthlyVIP = 3,
  BuyRedeemFreeVIP = 4,
  DouyinCreditPromotion = 5,
  UpgradeToSVIPPromotion = 6,
  UpgradeToSVIPNormal = 7,
  FollowUpRenew = 8,
  AutoRenewMonthWeekTrial = 9,
}
export enum CouponType {
  CouponTypeBindingAlipay = 1,
  CouponTypeBindingDouyin = 2,
  CouponTypeBytepay = 3,
}
export enum PayChannel {
  System = 1,
  DouyinCreditPay = 10,
  RedeemCode = 11,
  MerchantBalance = 12,
  Apple = 2,
  Alipay = 3,
  Wxpay = 4,
  BytePay = 5,
  BalancePay = 6,
  BindPay = 7,
  LunaBalance = 8,
  DouyinStore = 9,
}
export enum PrivilegePatternCompareItemType {
  Default = 0,
  Text = 1,
}
export enum PrivilegePatternType {
  Row = 1,
  Compare = 2,
}
export enum ProductType {
  Membership = 1,
  Album = 2,
  Balance = 3,
}
export interface ActionButton {
  'button_text': string;
  'button_action'?: ButtonAction;
}
export function ActionButtonToRequestData(data: ActionButton): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['button_text', 'button_action', ]),
  }
}
export interface AlbumInfo {
  'id': number;
  'name': string;
  'artists'?: ArtistInfo[];
  'company': string;
  'release_date': number;
  'amount': number;
  'track_counts'?: TrackCounts;
  'covers'?: CoverInfo[];
  'sale_data'?: SaleData;
  'default_cover_id': number;
  'sale_start_time': number;
  'sale_end_time': number;
  'sale_period': common.SalePeriod;
}
export function AlbumInfoToRequestData(data: AlbumInfo): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['id', 'name', 'artists', 'company', 'release_date', 'amount', 'track_counts', 'covers', 'sale_data', 'default_cover_id', 'sale_start_time', 'sale_end_time', 'sale_period', ]),
  }
}
export interface ArtistInfo {
  'id': number;
  'name': string;
  'url_avatar'?: common.URLInfo;
}
export function ArtistInfoToRequestData(data: ArtistInfo): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['id', 'name', 'url_avatar', ]),
  }
}
export interface BasicInfo {
  'tag_list'?: string[];
}
export function BasicInfoToRequestData(data: BasicInfo): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['tag_list', ]),
  }
}
export interface Benefit {
  'material'?: MaterialInfo;
  'purchase_number': number;
  'benefit_name': string;
  'thumbnail_image'?: common.URLInfo;
  'is_obtained': boolean;
}
export function BenefitToRequestData(data: Benefit): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['material', 'purchase_number', 'benefit_name', 'thumbnail_image', 'is_obtained', ]),
  }
}
export interface ClientTrace {
  'dypay_sku_send_free_vip_days': number;
  'dypay_sku_send_free_vip_days_next_month': number;
}
export function ClientTraceToRequestData(data: ClientTrace): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['dypay_sku_send_free_vip_days', 'dypay_sku_send_free_vip_days_next_month', ]),
  }
}
export interface Colour {
  'rgb': string;
  'alpha': string;
}
export function ColourToRequestData(data: Colour): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['rgb', 'alpha', ]),
  }
}
export interface CommonInfo {
  'name': string;
  'module_type': common.PurchasePageModule;
}
export function CommonInfoToRequestData(data: CommonInfo): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['name', 'module_type', ]),
  }
}
export interface CouponBar {
  'promotion_bar'?: PromotionBar;
  'coupon_type': CouponType;
  'received': boolean;
  'alipay_received_text': string;
  'btn_click_text': string;
  'btn_link': string;
  'retention_popup_text': string;
  'promotion_price': number;
  'pay_channel_discount'?: Record<string, number>;
}
export function CouponBarToRequestData(data: CouponBar): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['promotion_bar', 'coupon_type', 'received', 'alipay_received_text', 'btn_click_text', 'btn_link', 'retention_popup_text', 'promotion_price', 'pay_channel_discount', ]),
  }
}
export interface CoverBenefit {
  'cover_info'?: CoverInfo;
  'purchase_benefit_list'?: Benefit[];
}
export function CoverBenefitToRequestData(data: CoverBenefit): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['cover_info', 'purchase_benefit_list', ]),
  }
}
export interface CoverColour {
  'dominant_color'?: Colour;
  'base_colors'?: Colour[];
}
export function CoverColourToRequestData(data: CoverColour): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['dominant_color', 'base_colors', ]),
  }
}
export interface CoverInfo {
  'cover_id': number;
  'cover_name': string;
  'image_info'?: common.URLInfo;
  'cover_color'?: CoverColour;
  'has_purchased': boolean;
}
export function CoverInfoToRequestData(data: CoverInfo): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['cover_id', 'cover_name', 'image_info', 'cover_color', 'has_purchased', ]),
  }
}
export interface DisplayPurchasePrice {
  'price': number;
  'prefix'?: string;
  'suffix'?: string;
}
export function DisplayPurchasePriceToRequestData(data: DisplayPurchasePrice): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['price', 'prefix', 'suffix', ]),
  }
}
export interface Effect {
  'type': string;
  'config'?: string;
}
export function EffectToRequestData(data: Effect): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['type', 'config', ]),
  }
}
export interface FAQEntry {
  'title': string;
  'type': FAQEntryType;
  'link': string;
  'exteral_et_params': string;
  'exteral_redirect_options': string;
  'link_type': LinkType;
  'icon'?: common.URLInfo;
  'button_text'?: string;
  'bg_color'?: Colour;
  'display_style'?: FAQEntryDisplayStyle;
}
export function FAQEntryToRequestData(data: FAQEntry): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['title', 'type', 'link', 'exteral_et_params', 'exteral_redirect_options', 'link_type', 'icon', 'button_text', 'bg_color', 'display_style', ]),
  }
}
export interface HeaderContainer {
  'title': string;
  'subtitle': string;
}
export function HeaderContainerToRequestData(data: HeaderContainer): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['title', 'subtitle', ]),
  }
}
export interface MaterialInfo {
  'type': common.MaterialType;
  'material_name': string;
  'image_info'?: common.URLInfo;
  'video_info'?: common.VideoInfo;
  'text'?: string;
}
export function MaterialInfoToRequestData(data: MaterialInfo): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['type', 'material_name', 'image_info', 'video_info', 'text', ]),
  }
}
export interface MultiCoverBenefitInfo {
  'rule_explain': string;
  'cover_benefits'?: CoverBenefit[];
}
export function MultiCoverBenefitInfoToRequestData(data: MultiCoverBenefitInfo): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['rule_explain', 'cover_benefits', ]),
  }
}
export interface NameplateActivity {
  'enabled': boolean;
  'start_time': number;
  'end_time': number;
  'current_num': number;
  'special_numbers'?: SpecialNumber[];
  'next_unobtained_special_number'?: SpecialNumber;
  'gap_number'?: number;
}
export function NameplateActivityToRequestData(data: NameplateActivity): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['enabled', 'start_time', 'end_time', 'current_num', 'special_numbers', 'next_unobtained_special_number', 'gap_number', ]),
  }
}
export interface NameplateInfo {
  'rule_explain'?: string;
  'right_explain'?: string;
  'nameplate_activity'?: NameplateActivity;
  'acquired_nameplate_list'?: number[];
}
export function NameplateInfoToRequestData(data: NameplateInfo): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['rule_explain', 'right_explain', 'nameplate_activity', 'acquired_nameplate_list', ]),
  }
}
export interface OfferV2 {
  'offer_snapshot_id': string;
  'external_offer_id'?: string;
  'purchase_price': number;
  'purchase_origin_price': number;
  'renew_price': number;
  'currency_code': string;
  'purchase_type': PurchaseType;
  'product_category': ProductCategory;
  'offer_trace_key': string;
  'membership_type': MembershipType;
  'activity_type': ActivityType;
  'resource_map'?: Record<string, Resource>;
  'supported_pay_channels'?: PayChannelInfo[];
  'iap_subs_group'?: string;
  'activity_promotion_type': number;
  'client_trace'?: ClientTrace;
  'inconsistent_billing_periods'?: boolean;
  'has_discount'?: boolean;
  'treasure_deduct_amount'?: TreasureDeductAmount;
  'old_encoded_offer_id'?: string;
  'old_offer_sub_type'?: string;
  'old_offer_params_type'?: string;
}
export function OfferV2ToRequestData(data: OfferV2): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['offer_snapshot_id', 'external_offer_id', 'purchase_price', 'purchase_origin_price', 'renew_price', 'currency_code', 'purchase_type', 'product_category', 'offer_trace_key', 'membership_type', 'activity_type', 'resource_map', 'supported_pay_channels', 'iap_subs_group', 'activity_promotion_type', 'client_trace', 'inconsistent_billing_periods', 'has_discount', 'treasure_deduct_amount', 'old_encoded_offer_id', 'old_offer_sub_type', 'old_offer_params_type', ]),
  }
}
export interface PageBlock {
  'common_info'?: CommonInfo;
  'basic_info'?: BasicInfo;
  'right_explain_info'?: RightExplainInfo;
  'multimedia_material'?: MaterialInfo;
  'text_material'?: MaterialInfo;
  'nameplate_info'?: NameplateInfo;
  'purchase_benefit'?: PurchaseBenefitInfo;
  'multi_cover_benefit'?: MultiCoverBenefitInfo;
}
export function PageBlockToRequestData(data: PageBlock): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['common_info', 'basic_info', 'right_explain_info', 'multimedia_material', 'text_material', 'nameplate_info', 'purchase_benefit', 'multi_cover_benefit', ]),
  }
}
export interface PayChannelInfo {
  'pay_channel': PayChannel;
  'name'?: string;
  'icon_url'?: common.URLInfo;
  'pay_guidance'?: string;
}
export function PayChannelInfoToRequestData(data: PayChannelInfo): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['pay_channel', 'name', 'icon_url', 'pay_guidance', ]),
  }
}
export interface PrePurchaseAction {
  'action_type': PrePurchaseActionType;
  'content': string;
  'button'?: ActionButton;
  'sub_button'?: ActionButton;
}
export function PrePurchaseActionToRequestData(data: PrePurchaseAction): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['action_type', 'content', 'button', 'sub_button', ]),
  }
}
export interface PrivilegeBlock {
  'name': string;
  'desc': string;
  'icon'?: Record<string, common.URLInfo>;
  'tip'?: PrivilegeBlockTip;
}
export function PrivilegeBlockToRequestData(data: PrivilegeBlock): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['name', 'desc', 'icon', 'tip', ]),
  }
}
export interface PrivilegeBlockTip {
  'type': string;
  'title': string;
  'content': string;
  'link': string;
  'confirm_text': string;
}
export function PrivilegeBlockTipToRequestData(data: PrivilegeBlockTip): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['type', 'title', 'content', 'link', 'confirm_text', ]),
  }
}
export interface PrivilegePattern {
  'type': PrivilegePatternType;
  'privilege_pattern_row'?: PrivilegePatternRow;
  'privilege_pattern_compare'?: PrivilegePatternCompare;
}
export function PrivilegePatternToRequestData(data: PrivilegePattern): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['type', 'privilege_pattern_row', 'privilege_pattern_compare', ]),
  }
}
export interface PrivilegePatternCompare {
  'privilege_list'?: string[];
  'privilege_map'?: Record<string, Record<string, PrivilegePatternCompareItem>>;
  'title': string;
}
export function PrivilegePatternCompareToRequestData(data: PrivilegePatternCompare): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['privilege_list', 'privilege_map', 'title', ]),
  }
}
export interface PrivilegePatternCompareItem {
  'type': PrivilegePatternCompareItemType;
  'text'?: string;
}
export function PrivilegePatternCompareItemToRequestData(data: PrivilegePatternCompareItem): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['type', 'text', ]),
  }
}
export interface PrivilegePatternRow {
  'text_in_column': boolean;
  'privilege_map'?: Record<string, PrivilegePatternRowBlock>;
}
export function PrivilegePatternRowToRequestData(data: PrivilegePatternRow): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['text_in_column', 'privilege_map', ]),
  }
}
export interface PrivilegePatternRowBlock {
  'title': string;
  'privilege_list'?: string[][];
}
export function PrivilegePatternRowBlockToRequestData(data: PrivilegePatternRowBlock): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['title', 'privilege_list', ]),
  }
}
export interface ProductBasicInfo {
  'product_type': ProductType;
  'membership_type': MembershipType;
  'purchase_type': PurchaseType;
  'product_category': ProductCategory;
}
export function ProductBasicInfoToRequestData(data: ProductBasicInfo): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['product_type', 'membership_type', 'purchase_type', 'product_category', ]),
  }
}
export interface ProductInfo {
  'membership_type': MembershipType;
  'product_category': ProductCategory;
}
export function ProductInfoToRequestData(data: ProductInfo): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['membership_type', 'product_category', ]),
  }
}
export interface PromotionBar {
  'title': string;
  'text': string;
  'icon': string;
  'main_text': string;
  'sub_text': string;
  'dynamic_text'?: apix_common.Text;
}
export function PromotionBarToRequestData(data: PromotionBar): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['title', 'text', 'icon', 'main_text', 'sub_text', 'dynamic_text', ]),
  }
}
export interface PurchaseBenefitInfo {
  'rule_explain': string;
  'purchase_benefit_list'?: Benefit[];
}
export function PurchaseBenefitInfoToRequestData(data: PurchaseBenefitInfo): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['rule_explain', 'purchase_benefit_list', ]),
  }
}
export interface Resource {
  'name'?: string;
  'user_agreement'?: RichText[];
  'rich_desc'?: RichText[];
  'promotion_label'?: string;
  'show_countdown'?: boolean;
  'bottom_label'?: string;
  'countdown_duration'?: number;
  'origin_price'?: number;
  'delayed_show'?: boolean;
  'tag'?: string;
  'popup_sub_title'?: string;
  'effects'?: Effect[];
  'purchase_action_text'?: string;
  'bubble_text'?: string;
  'display_name'?: string;
  'promotion_bar'?: PromotionBar;
  'pre_purchase_action'?: PrePurchaseAction;
  'coupon_bar'?: CouponBar;
  'popup_title'?: string;
  'price_display_prefix'?: string;
  'price_display_suffix'?: string;
  'promotion_label_highlight'?: boolean;
  'header_container'?: HeaderContainer;
  'privilege_list'?: string[];
  'treasure_deducted_purchase_action_text'?: string;
  'coupon_bar_list'?: CouponBar[];
  'display_purchase_price'?: DisplayPurchasePrice;
}
export function ResourceToRequestData(data: Resource): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['name', 'user_agreement', 'rich_desc', 'promotion_label', 'show_countdown', 'bottom_label', 'countdown_duration', 'origin_price', 'delayed_show', 'tag', 'popup_sub_title', 'effects', 'purchase_action_text', 'bubble_text', 'display_name', 'promotion_bar', 'pre_purchase_action', 'coupon_bar', 'popup_title', 'price_display_prefix', 'price_display_suffix', 'promotion_label_highlight', 'header_container', 'privilege_list', 'treasure_deducted_purchase_action_text', 'coupon_bar_list', 'display_purchase_price', ]),
  }
}
export interface RichText {
  'link'?: string;
  'text'?: string;
  'type'?: string;
  'color'?: string;
}
export function RichTextToRequestData(data: RichText): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['link', 'text', 'type', 'color', ]),
  }
}
export interface RightExplain {
  'tag': string;
  'explain': string;
}
export function RightExplainToRequestData(data: RightExplain): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['tag', 'explain', ]),
  }
}
export interface RightExplainInfo {
  'right_explain_list'?: RightExplain[];
}
export function RightExplainInfoToRequestData(data: RightExplainInfo): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['right_explain_list', ]),
  }
}
export interface SaleData {
  'total_count_purch': number;
  'sale_image'?: common.URLInfo;
  'hide_sale_data': boolean;
}
export function SaleDataToRequestData(data: SaleData): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['total_count_purch', 'sale_image', 'hide_sale_data', ]),
  }
}
export interface SpecialNumber {
  'nameplate_number': number;
  'benefit_name': string;
  'account_id': number;
  'avatar'?: common.URLInfo;
  'nickname'?: string;
  'is_obtained': boolean;
}
export function SpecialNumberToRequestData(data: SpecialNumber): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['nameplate_number', 'benefit_name', 'account_id', 'avatar', 'nickname', 'is_obtained', ]),
  }
}
export interface TermsText {
  'id': string;
  'title': string;
  'content': string;
}
export function TermsTextToRequestData(data: TermsText): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['id', 'title', 'content', ]),
  }
}
export interface TrackCounts {
  'total_count': number;
  'visible_cont': number;
}
export function TrackCountsToRequestData(data: TrackCounts): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['total_count', 'visible_cont', ]),
  }
}
export interface TreasureDeductAmount {
  'total': number;
  'cash': number;
  'coin': number;
  'pre_deduct_processing': boolean;
}
export function TreasureDeductAmountToRequestData(data: TreasureDeductAmount): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['total', 'cash', 'coin', 'pre_deduct_processing', ]),
  }
}
export interface VipEntrance {
  'title': string;
  'entrance_style': common.EntranceStyle;
}
export function VipEntranceToRequestData(data: VipEntrance): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['title', 'entrance_style', ]),
  }
}
export type ButtonAction = string
export type FAQEntryDisplayStyle = string
export type FAQEntryType = string
export type LinkType = string
export type MembershipType = string
export type PrePurchaseActionType = string
export type ProductCategory = string
export type PurchaseType = string
export type ResourceEffect = string
