// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'
import * as general from './general.js'
import * as media from '../entity/media.js'
import * as music_mate from '../entity/music_mate.js'
import * as share from '../entity/share.js'
import * as user from '../entity/user.js'

export enum GuidanceScene {
  Launch = 1,
}
export enum MusicMateGuidanceType {
  Unknown = 0,
  Friend = 1,
  Wechat = 2,
}
export interface CreateRoomRequest {
  'room_type': number;
  'media'?: media.Media;
}
export function CreateRoomRequestToRequestData(data: CreateRoomRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['room_type', 'media', ]),
  }
}
export interface CreateRoomResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'room'?: music_mate.Room;
  'share_info'?: share.ShareInfo;
}
export function CreateRoomResponseToRequestData(data: CreateRoomResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'room', 'share_info', ]),
  }
}
export interface GetMusicMateGuidanceRequest {
  'scene': GuidanceScene;
}
export function GetMusicMateGuidanceRequestToRequestData(data: GetMusicMateGuidanceRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['scene', ]),
    body: fieldsAssign(data, ['scene', ]),
  }
}
export interface GetMusicMateGuidanceResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'user_info'?: user.UserBrief;
  'subtitle'?: string;
  'guidance_type'?: MusicMateGuidanceType;
}
export function GetMusicMateGuidanceResponseToRequestData(data: GetMusicMateGuidanceResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'user_info', 'subtitle', 'guidance_type', ]),
  }
}
export interface GetMusicMateHistoryRequest {
  'room_id': string;
}
export function GetMusicMateHistoryRequestToRequestData(data: GetMusicMateHistoryRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['room_id', ]),
  }
}
export interface GetMusicMateHistoryResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'room'?: music_mate.Room;
  'mutual_liked_cnt': number;
  'mutual_liked_media_list'?: media.MediaInfoEntity[];
  'recent_media_list'?: media.MediaInfoEntity[];
  'distance': number;
  'co_listen_ms': number;
  'area_hint'?: string;
}
export function GetMusicMateHistoryResponseToRequestData(data: GetMusicMateHistoryResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'room', 'mutual_liked_cnt', 'mutual_liked_media_list', 'recent_media_list', 'distance', 'co_listen_ms', 'area_hint', ]),
  }
}
export interface GetRoomInfoRequest {
  'room_id': string;
  'pack_members': boolean;
}
export function GetRoomInfoRequestToRequestData(data: GetRoomInfoRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['room_id', 'pack_members', ]),
  }
}
export interface GetRoomInfoResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'room'?: music_mate.Room;
}
export function GetRoomInfoResponseToRequestData(data: GetRoomInfoResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'room', ]),
  }
}
export interface GetUserRecentRoomsRequest {
  'user_id': string;
  'room_type': number;
  'only_active': boolean;
  'filter_cross_device': boolean;
}
export function GetUserRecentRoomsRequestToRequestData(data: GetUserRecentRoomsRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['user_id', 'room_type', 'only_active', 'filter_cross_device', ]),
  }
}
export interface GetUserRecentRoomsResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'room'?: music_mate.Room;
  'share_info'?: share.ShareInfo;
  'recent_closed_rooms'?: music_mate.Room[];
}
export function GetUserRecentRoomsResponseToRequestData(data: GetUserRecentRoomsResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'room', 'share_info', 'recent_closed_rooms', ]),
  }
}
export interface RejectJoinRequest {
  'room_id': string;
}
export function RejectJoinRequestToRequestData(data: RejectJoinRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['room_id', ]),
  }
}
export interface RejectJoinResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
}
export function RejectJoinResponseToRequestData(data: RejectJoinResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', ]),
  }
}
export interface SendInvitePushRequest {
  'room_id': string;
  'from_uid': string;
  'to_uid': string;
  'conv_sid': number;
  'conv_id': string;
}
export function SendInvitePushRequestToRequestData(data: SendInvitePushRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['room_id', 'from_uid', 'to_uid', 'conv_sid', 'conv_id', ]),
  }
}
export interface SendInvitePushResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
}
export function SendInvitePushResponseToRequestData(data: SendInvitePushResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', ]),
  }
}
