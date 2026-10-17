// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'
import * as common from '../entity/common.js'
import * as feed from '../entity/feed.js'
import * as general from './general.js'
import * as listen_video from '../entity/listen_video.js'
import * as video from './video.js'

export interface GetListenVideoTabModuleRequest {
  'scene'?: string;
}
export function GetListenVideoTabModuleRequestToRequestData(data: GetListenVideoTabModuleRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['scene', ]),
    body: fieldsAssign(data, []),
  }
}
export interface GetListenVideoTabModuleResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'modules'?: listen_video.ListenVideoModule[];
  'style'?: ModuleStyle;
  'categories'?: common.Category[];
}
export function GetListenVideoTabModuleResponseToRequestData(data: GetListenVideoTabModuleResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'modules', 'style', 'categories', ]),
  }
}
export interface ListenVideoReminderRequest {
  'listen_reco_session_info'?: feed.ListenRecoSessionInfo;
  'recent_lv_consume'?: Record<string, feed.MediaPlayInfo>;
}
export function ListenVideoReminderRequestToRequestData(data: ListenVideoReminderRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['listen_reco_session_info', 'recent_lv_consume', ]),
  }
}
export interface ListenVideoReminderResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'item'?: feed.FeedItem;
}
export function ListenVideoReminderResponseToRequestData(data: ListenVideoReminderResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'item', ]),
  }
}
export interface ModuleStyle {
  'column_size'?: number;
  'row_size'?: number;
}
export function ModuleStyleToRequestData(data: ModuleStyle): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['column_size', 'row_size', ]),
  }
}
