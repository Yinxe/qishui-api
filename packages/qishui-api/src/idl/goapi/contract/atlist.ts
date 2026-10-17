// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'
import * as atlist from '../entity/atlist.js'
import * as common from '../entity/common.js'
import * as general from './general.js'
import * as user_artist from '../entity/user_artist.js'

export const AtListSceneMusicMate: string = 'music_mate'
export const AtListSceneShare: string = 'share'
export interface GetAtListRequest {
  'cursor': string;
  'count': number;
  'type': atlist.AtListType;
  'group_id'?: string;
  'group_type'?: number;
  'query'?: string;
  'extra'?: Record<string, string>;
  'scene'?: string;
}
export function GetAtListRequestToRequestData(data: GetAtListRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['cursor', 'count', 'type', 'group_id', 'group_type', 'query', 'extra', 'scene', ]),
    body: fieldsAssign(data, ['cursor', 'count', 'type', 'group_id', 'group_type', 'query', 'extra', 'scene', ]),
  }
}
export interface GetAtListResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'user_list'?: user_artist.UserArtistBrief[];
  'has_more'?: boolean;
  'cursor'?: string;
}
export function GetAtListResponseToRequestData(data: GetAtListResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'user_list', 'has_more', 'cursor', ]),
  }
}
