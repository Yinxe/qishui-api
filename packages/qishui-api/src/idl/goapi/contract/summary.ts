// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'
import * as general from './general.js'
import * as summary from '../entity/summary.js'
import * as user from '../entity/user.js'
import * as user_artist from '../entity/user_artist.js'

export interface GetMySummaryRequest {
}
export function GetMySummaryRequestToRequestData(data: GetMySummaryRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, []),
  }
}
export interface GetMySummaryResponse {
  'status_code': number;
  'status_info'?: general.StatusInfo;
  'user'?: user.UserBrief;
  'comment_stat'?: summary.SummaryCommentStat;
  'track_stat'?: summary.SummaryTrackStat;
  'type'?: string;
  'page_entries'?: summary.SummaryPageEntry[];
  'decoration_obtained'?: boolean;
  'user_artist_info'?: user_artist.UserArtistBrief;
}
export function GetMySummaryResponseToRequestData(data: GetMySummaryResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'user', 'comment_stat', 'track_stat', 'type', 'page_entries', 'decoration_obtained', 'user_artist_info', ]),
  }
}
export interface ModifyMyAvatarDecorationRequest {
  'config_id'?: string;
  'decoration_id'?: string;
  'not_bind'?: string;
}
export function ModifyMyAvatarDecorationRequestToRequestData(data: ModifyMyAvatarDecorationRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['config_id', 'decoration_id', 'not_bind', ]),
  }
}
export interface ModifyMyAvatarDecorationResponse {
  'status_code': number;
  'status_info'?: general.StatusInfo;
}
export function ModifyMyAvatarDecorationResponseToRequestData(data: ModifyMyAvatarDecorationResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', ]),
  }
}
