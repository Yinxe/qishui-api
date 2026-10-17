// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'
import * as general from './general.js'
import * as im from '../entity/im.js'
import * as share from '../entity/share.js'

export interface IMSendRequest {
  'user_ids'?: string[];
  'msg_type'?: number;
  'awe_type'?: number;
  'content'?: string;
  'conv_short_ids'?: string[];
  'scene': share.ShareScene;
}
export function IMSendRequestToRequestData(data: IMSendRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['user_ids', 'msg_type', 'awe_type', 'content', 'conv_short_ids', 'scene', ]),
  }
}
export interface IMSendResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'success_uids'?: string[];
  'success_conv_short_ids'?: string[];
}
export function IMSendResponseToRequestData(data: IMSendResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'success_uids', 'success_conv_short_ids', ]),
  }
}
