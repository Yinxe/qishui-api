// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'
import * as general from './general.js'

export const DislikeItemTypeMV: number = 3
export const DislikeItemTypePlaylist: number = 5
export const DislikeItemTypeTrack: number = 1
export const DislikeItemTypeUgcClip: number = 4
export const DislikeItemTypeUgcVideo: number = 2
export interface DislikeRequest {
  'item_id': string;
  'author_ids'?: number[];
  'dislike_item_type': number;
  'action_type': number;
}
export function DislikeRequestToRequestData(data: DislikeRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['item_id', 'author_ids', 'dislike_item_type', 'action_type', ]),
  }
}
export interface DislikeResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
}
export function DislikeResponseToRequestData(data: DislikeResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', ]),
  }
}
