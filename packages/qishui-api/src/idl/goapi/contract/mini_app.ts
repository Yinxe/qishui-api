// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'
import * as general from './general.js'

export interface GetMiniAppListRequest {
  'page': number;
  'page_size': number;
}
export function GetMiniAppListRequestToRequestData(data: GetMiniAppListRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['page', 'page_size', ]),
  }
}
export interface GetMiniAppListResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'mini_apps'?: MiniAppInfo[];
  'has_more': boolean;
}
export function GetMiniAppListResponseToRequestData(data: GetMiniAppListResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'mini_apps', 'has_more', ]),
  }
}
export interface MiniAppInfo {
  'app_id': string;
  'name': string;
  'icon': string;
  'description': string;
  'schema': string;
}
export function MiniAppInfoToRequestData(data: MiniAppInfo): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['app_id', 'name', 'icon', 'description', 'schema', ]),
  }
}
