// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'
import * as friend_link from '../entity/friend_link.js'
import * as general from './general.js'

export interface GetFriendLinkTemplateRequest {
  'template_id': string;
}
export function GetFriendLinkTemplateRequestToRequestData(data: GetFriendLinkTemplateRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['template_id', ]),
  }
}
export interface GetFriendLinkTemplateResponse {
  'status_code': number;
  'status_info'?: general.StatusInfo;
  'template_info'?: friend_link.TemplateInfo;
}
export function GetFriendLinkTemplateResponseToRequestData(data: GetFriendLinkTemplateResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'template_info', ]),
  }
}
