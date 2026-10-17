// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'
import * as common from '../entity/common.js'
import * as general from './general.js'
import * as live from '../entity/live.js'

export const LiveGuideSceneLiveSnackbar: string = 'live_snackbar'
export const LiveGuideSceneLiveTooltips: string = 'live_tooltips'
export interface GetFollowingLiveRequest {
  'enter_from_merge'?: string;
  'enter_method'?: string;
  'req_from'?: string;
  'scene'?: string;
}
export function GetFollowingLiveRequestToRequestData(data: GetFollowingLiveRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['enter_from_merge', 'enter_method', 'req_from', 'scene', ]),
  }
}
export interface GetFollowingLiveResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'has_live'?: boolean;
  'live_rooms'?: live.LiveRoom[];
  'extra'?: string;
}
export function GetFollowingLiveResponseToRequestData(data: GetFollowingLiveResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'has_live', 'live_rooms', 'extra', ]),
  }
}
export interface GetLiveGuideStreamRequest {
  'scene'?: string;
  'enter_from_merge'?: string;
  'enter_method'?: string;
  'req_from'?: string;
}
export function GetLiveGuideStreamRequestToRequestData(data: GetLiveGuideStreamRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['scene', 'enter_from_merge', 'enter_method', 'req_from', ]),
  }
}
export interface GetLiveGuideStreamResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'live_rooms'?: live.LiveRoom[];
}
export function GetLiveGuideStreamResponseToRequestData(data: GetLiveGuideStreamResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'live_rooms', ]),
  }
}
export interface GetLiveRoomRequest {
  'room_id': string;
}
export function GetLiveRoomRequestToRequestData(data: GetLiveRoomRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['room_id', ]),
    body: fieldsAssign(data, []),
  }
}
export interface GetLiveRoomResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'live_room'?: live.LiveRoom;
  'expire_at': number;
}
export function GetLiveRoomResponseToRequestData(data: GetLiveRoomResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'live_room', 'expire_at', ]),
  }
}
export interface GetUserLiveRoomRequest {
  'user_id': string;
  'lite_pack': boolean;
}
export function GetUserLiveRoomRequestToRequestData(data: GetUserLiveRoomRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['user_id', 'lite_pack', ]),
    body: fieldsAssign(data, []),
  }
}
export interface GetUserLiveRoomResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'live_room'?: live.LiveRoom;
  'room_id'?: number;
  'expire_at': number;
}
export function GetUserLiveRoomResponseToRequestData(data: GetUserLiveRoomResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'live_room', 'room_id', 'expire_at', ]),
  }
}
