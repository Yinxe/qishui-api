// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'
import * as common from './common.js'

export enum PaymentItemType {
  ALBUM = 1,
}
export enum SalePeriodEnum {
  PreSale = 1,
  InSale = 2,
  OffShelf = 3,
}
export interface DigitalAssetCoverInfo {
  'cover_id': string;
  'count_purchased': number;
  'purchase_cnt_limit'?: number;
  'url_cover'?: common.URLInfo;
  'is_set_to_show'?: boolean;
  'cover_name': string;
  'self_purchased'?: boolean;
}
export function DigitalAssetCoverInfoToRequestData(data: DigitalAssetCoverInfo): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['cover_id', 'count_purchased', 'purchase_cnt_limit', 'url_cover', 'is_set_to_show', 'cover_name', 'self_purchased', ]),
  }
}
export interface DigitalAssetInfo {
  'payment_item_type'?: PaymentItemType;
  'amount'?: number;
  'online_date'?: number;
  'payment_item_id'?: string;
  'count_purchased'?: number;
  'sale_period'?: SalePeriodEnum;
  'purchase_cnt_limit'?: number;
  'asset_covers'?: DigitalAssetCoverInfo[];
  'total_purchase_cnt_limit'?: number;
  'amount_cent'?: number;
  'gift_entrance_text'?: string;
  'gift_entrance_schema'?: string;
  'gift_entrance_jump_type'?: number;
  'self_purchased'?: boolean;
  'obtained_channel'?: number;
}
export function DigitalAssetInfoToRequestData(data: DigitalAssetInfo): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['payment_item_type', 'amount', 'online_date', 'payment_item_id', 'count_purchased', 'sale_period', 'purchase_cnt_limit', 'asset_covers', 'total_purchase_cnt_limit', 'amount_cent', 'gift_entrance_text', 'gift_entrance_schema', 'gift_entrance_jump_type', 'self_purchased', 'obtained_channel', ]),
  }
}
