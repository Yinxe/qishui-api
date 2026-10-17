// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'

export const EntranceStyleNewWithSVIP: string = 'new_style_with_svip_label'
export const EntranceStyleNewWithVip: string = 'new_style_with_vip_label'
export const EntranceStyleNewWithoutSuffix: string = 'new_style_without_suffix'
export const EntranceStyleOldStyle: string = 'old_style'
export enum MaterialType {
  Image = 1,
  Video = 2,
  Text = 3,
}
export enum PurchasePageModule {
  BasicAlbumInfo = 1,
  RightExplain = 2,
  MultimediaMaterial = 3,
  TextMaterial = 4,
  NameplateInfo = 5,
  PurchaseBenefit = 6,
  MultiCoverBenefit = 7,
  AlbumTrackList = 8,
  AcquiredNameplateInfo = 9,
}
export enum SalePeriod {
  SalePeriodEnumPreSale = 1,
  SalePeriodEnumInSale = 2,
  SalePeriodEnumOffShelf = 3,
}
export enum TokenStatus {
  Init = 0,
  OrderCreated = 1,
  TokenStatusFinished = 100,
  TokenStatusExpired = 101,
}
export interface BaseResponse {
  'status_code': number;
  'status_info'?: StatusInfo;
}
export function BaseResponseToRequestData(data: BaseResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', ]),
  }
}
export interface StatusInfo {
  'now': number;
  'status_msg': string;
  'log_id': string;
}
export function StatusInfoToRequestData(data: StatusInfo): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['now', 'status_msg', 'log_id', ]),
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
export interface UserBrief {
  'id': number;
  'nickname': string;
  'medium_avatar_url': string;
  'thumb_avatar_url': string;
}
export function UserBriefToRequestData(data: UserBrief): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['id', 'nickname', 'medium_avatar_url', 'thumb_avatar_url', ]),
  }
}
export interface VideoInfo {
  'media_type': string;
  'poster_url': string;
  'main_url': string;
  'backup_url': string;
  'url_expire': number;
  'height': number;
  'width': number;
}
export function VideoInfoToRequestData(data: VideoInfo): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['media_type', 'poster_url', 'main_url', 'backup_url', 'url_expire', 'height', 'width', ]),
  }
}
export type EntranceStyle = string
