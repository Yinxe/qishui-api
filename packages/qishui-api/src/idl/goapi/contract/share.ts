// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'
import * as common from '../entity/common.js'
import * as general from './general.js'
import * as share from '../entity/share.js'
import * as user_artist from '../entity/user_artist.js'

export interface GetShareInfoRequest {
  'item_type': string;
  'item_id': string;
  'open_anchor_info'?: share.OpenAnchorInfo;
  'extra': string;
  'scene': share.ShareScene;
}
export function GetShareInfoRequestToRequestData(data: GetShareInfoRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['item_type', 'item_id', 'open_anchor_info', 'extra', 'scene', ]),
    body: fieldsAssign(data, []),
  }
}
export interface GetShareInfoResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'share_info'?: share.ShareInfo;
}
export function GetShareInfoResponseToRequestData(data: GetShareInfoResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'share_info', ]),
  }
}
export interface GetSharePostAwemeStatusRequest {
  'task_id': string;
}
export function GetSharePostAwemeStatusRequestToRequestData(data: GetSharePostAwemeStatusRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['task_id', ]),
    body: fieldsAssign(data, []),
  }
}
export interface GetSharePostAwemeStatusResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'share_post_aweme_status': share.SharePostAwemeStatus;
  'item_id'?: string;
}
export function GetSharePostAwemeStatusResponseToRequestData(data: GetSharePostAwemeStatusResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'share_post_aweme_status', 'item_id', ]),
  }
}
export interface GetShareUserListRequest {
  'count': number;
  'scene': share.ShareScene;
}
export function GetShareUserListRequestToRequestData(data: GetShareUserListRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['count', 'scene', ]),
  }
}
export interface GetShareUserListResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'user_list'?: user_artist.UserArtistBrief[];
}
export function GetShareUserListResponseToRequestData(data: GetShareUserListResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'user_list', ]),
  }
}
export interface QueryZlinkRequest {
  'token': string;
}
export function QueryZlinkRequestToRequestData(data: QueryZlinkRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['token', ]),
    body: fieldsAssign(data, []),
  }
}
export interface QueryZlinkResponse {
  'status_code': number;
  'status_info'?: general.StatusInfo;
  'info': string;
}
export function QueryZlinkResponseToRequestData(data: QueryZlinkResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'info', ]),
  }
}
export interface ShareCodeParseRequest {
  'token': string;
}
export function ShareCodeParseRequestToRequestData(data: ShareCodeParseRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['token', ]),
    body: fieldsAssign(data, []),
  }
}
export interface ShareCodeParseResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'header'?: share.ShareUndertakePanelHeader;
  'content_img'?: common.URLInfo;
  'content_text'?: string;
  'btn_text'?: string;
  'schema'?: string;
}
export function ShareCodeParseResponseToRequestData(data: ShareCodeParseResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'header', 'content_img', 'content_text', 'btn_text', 'schema', ]),
  }
}
export interface ShareCountRequest {
  'items'?: share.ShareItem[];
  'share_platform'?: string;
}
export function ShareCountRequestToRequestData(data: ShareCountRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['items', 'share_platform', ]),
  }
}
export interface SharePostAwemeRequest {
  'item_type': string;
  'item_id': string;
  'share_id': string;
}
export function SharePostAwemeRequestToRequestData(data: SharePostAwemeRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['item_type', 'item_id', 'share_id', ]),
  }
}
export interface SharePostAwemeResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'task_id': string;
}
export function SharePostAwemeResponseToRequestData(data: SharePostAwemeResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'task_id', ]),
  }
}
export interface ShortenZlinkUrlRequest {
  'zlink_id': string;
  'scheme_string': string;
}
export function ShortenZlinkUrlRequestToRequestData(data: ShortenZlinkUrlRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['zlink_id', 'scheme_string', ]),
    body: fieldsAssign(data, []),
  }
}
export interface ShortenZlinkUrlResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'shortened_url'?: string;
}
export function ShortenZlinkUrlResponseToRequestData(data: ShortenZlinkUrlResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'shortened_url', ]),
  }
}
