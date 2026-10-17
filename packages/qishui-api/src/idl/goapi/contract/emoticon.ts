// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'
import * as emoticon from '../entity/emoticon.js'
import * as general from './general.js'

export interface GetRecommendEmoticonsRequest {
}
export function GetRecommendEmoticonsRequestToRequestData(data: GetRecommendEmoticonsRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, []),
  }
}
export interface GetRecommendEmoticonsResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'emoji_list'?: emoticon.Emoticon[];
}
export function GetRecommendEmoticonsResponseToRequestData(data: GetRecommendEmoticonsResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'emoji_list', ]),
  }
}
