// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'
import * as comment from '../entity/comment.js'
import * as general from './general.js'
import * as message from '../entity/message.js'

export interface DeleteMsgRequest {
  'msg_id': string;
  'msg_type': number;
}
export function DeleteMsgRequestToRequestData(data: DeleteMsgRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['msg_id', 'msg_type', ]),
    body: fieldsAssign(data, ['msg_id', 'msg_type', ]),
  }
}
export interface GetMsgListRequest {
  'cursor': string;
  'group_id'?: message.MsgGroup;
  'image_strategy'?: comment.CommentImageDisplayStrategy;
}
export function GetMsgListRequestToRequestData(data: GetMsgListRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['cursor', 'group_id', 'image_strategy', ]),
    body: fieldsAssign(data, []),
  }
}
export interface GetMsgListResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'current_time'?: number;
  'has_more': boolean;
  'next_cursor': string;
  'msg_list'?: message.MessageItem[];
}
export function GetMsgListResponseToRequestData(data: GetMsgListResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'current_time', 'has_more', 'next_cursor', 'msg_list', ]),
  }
}
export interface MarkReadRequest {
  'mark_type': message.MarkReadType;
  'group_id'?: message.MsgGroup;
  'msg_id'?: string;
}
export function MarkReadRequestToRequestData(data: MarkReadRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['mark_type', 'group_id', 'msg_id', ]),
  }
}
export interface MarkReadResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
}
export function MarkReadResponseToRequestData(data: MarkReadResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', ]),
  }
}
export interface UnreadMsgRequest {
  'group_id': message.MsgGroup;
}
export function UnreadMsgRequestToRequestData(data: UnreadMsgRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['group_id', ]),
    body: fieldsAssign(data, []),
  }
}
export interface UnreadMsgResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'has_msg': boolean;
  'total_count': number;
  'last_read_time': number;
  'msg_unread_texts'?: message.MsgUnreadText[];
  'unread_counts'?: Record<string, number>;
}
export function UnreadMsgResponseToRequestData(data: UnreadMsgResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'has_msg', 'total_count', 'last_read_time', 'msg_unread_texts', 'unread_counts', ]),
  }
}
