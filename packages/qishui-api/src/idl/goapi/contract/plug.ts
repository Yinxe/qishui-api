// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'
import * as card from '../entity/card.js'
import * as general from './general.js'
import * as item from '../entity/item.js'
import * as plug from '../entity/plug.js'
import * as user from '../entity/user.js'

export const ClickShareBtn: string = 'click_share_btn'
export const ConnPopup: string = 'conn_popup'
export const CoverAnchor: string = 'cover_anchor'
export interface ConnPlugsRequest {
  'item'?: item.Item;
}
export function ConnPlugsRequestToRequestData(data: ConnPlugsRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['item', ]),
  }
}
export interface ConnPlugsResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'plug_status'?: boolean;
  'total'?: number;
  'user_list'?: user.RelativeUserStruct[];
}
export function ConnPlugsResponseToRequestData(data: ConnPlugsResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'plug_status', 'total', 'user_list', ]),
  }
}
export interface GetPlugVisibilityRequest {
}
export function GetPlugVisibilityRequestToRequestData(data: GetPlugVisibilityRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, []),
  }
}
export interface GetPlugVisibilityResponse {
  'status_code': number;
  'status_info'?: general.StatusInfo;
  'visibility': plug.PlugVisibility;
}
export function GetPlugVisibilityResponseToRequestData(data: GetPlugVisibilityResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'visibility', ]),
  }
}
export interface PlugActionRequest {
  'action': plug.PlugActionType;
  'item'?: item.Item;
  'enter_from'?: string;
}
export function PlugActionRequestToRequestData(data: PlugActionRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['action', 'item', 'enter_from', ]),
  }
}
export interface PlugActionResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'plug_anchor'?: card.Anchor;
  'is_fib'?: boolean;
}
export function PlugActionResponseToRequestData(data: PlugActionResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'plug_anchor', 'is_fib', ]),
  }
}
export interface SetPlugVisibilityRequest {
  'visibility'?: plug.PlugVisibility;
}
export function SetPlugVisibilityRequestToRequestData(data: SetPlugVisibilityRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['visibility', ]),
  }
}
export interface SetPlugVisibilityResponse {
  'status_code': number;
  'status_info'?: general.StatusInfo;
}
export function SetPlugVisibilityResponseToRequestData(data: SetPlugVisibilityResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', ]),
  }
}
