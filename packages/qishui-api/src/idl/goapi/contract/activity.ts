// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'
import * as activity from '../entity/activity.js'
import * as banner from '../entity/banner.js'
import * as general from './general.js'
import * as user from '../entity/user.js'

export enum ListenDurationActivityRankType {
  Total = 1,
  Daily = 2,
}
export interface ConfirmActivityTestRequest {
  'activity_id': number;
}
export function ConfirmActivityTestRequestToRequestData(data: ConfirmActivityTestRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['activity_id', ]),
  }
}
export interface ConfirmActivityTestResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
}
export function ConfirmActivityTestResponseToRequestData(data: ConfirmActivityTestResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', ]),
  }
}
export interface GetActivityInfoRequest {
  'includes'?: string[];
}
export function GetActivityInfoRequestToRequestData(data: GetActivityInfoRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['includes', ]),
    body: fieldsAssign(data, []),
  }
}
export interface GetActivityInfoResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'activity_map'?: Record<string, activity.Activity[]>;
}
export function GetActivityInfoResponseToRequestData(data: GetActivityInfoResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'activity_map', ]),
  }
}
export interface GetListenDurationActivityRankingsRequest {
  'activity_id'?: string;
  'rank_type'?: ListenDurationActivityRankType;
  'periods'?: string[];
  'cursor'?: string;
  'count'?: number;
}
export function GetListenDurationActivityRankingsRequestToRequestData(data: GetListenDurationActivityRankingsRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['activity_id', 'rank_type', 'periods', 'cursor', 'count', ]),
  }
}
export interface GetListenDurationActivityRankingsResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'period_rankings'?: Record<string, ListenDurationActivityRankingsPage>;
}
export function GetListenDurationActivityRankingsResponseToRequestData(data: GetListenDurationActivityRankingsResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'period_rankings', ]),
  }
}
export interface ListenDurationActivityRankItem {
  'user_id'?: string;
  'rank'?: number;
  'duration_seconds'?: number;
  'user_info'?: user.UserBrief;
}
export function ListenDurationActivityRankItemToRequestData(data: ListenDurationActivityRankItem): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['user_id', 'rank', 'duration_seconds', 'user_info', ]),
  }
}
export interface ListenDurationActivityRankingsPage {
  'period'?: string;
  'rankings'?: ListenDurationActivityRankItem[];
  'my_ranking'?: ListenDurationActivityRankItem;
  'next_cursor'?: string;
  'has_more'?: boolean;
  'updated_at'?: number;
}
export function ListenDurationActivityRankingsPageToRequestData(data: ListenDurationActivityRankingsPage): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['period', 'rankings', 'my_ranking', 'next_cursor', 'has_more', 'updated_at', ]),
  }
}
