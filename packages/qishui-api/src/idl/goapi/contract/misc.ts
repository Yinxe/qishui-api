// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'
import * as boost from '../entity/boost.js'
import * as device from '../entity/device.js'
import * as feed from '../entity/feed.js'
import * as general from './general.js'
import * as misc from '../entity/misc.js'
import * as user from '../entity/user.js'

export const AbroadType_Abroad: number = 2
export const AbroadType_GreenChannel: number = 1
export const AbroadType_Normal: number = 0
export const DeviceStatus_Invited: number = 1
export const DeviceStatus_InvitedIllegal: number = 2
export const DeviceStatus_NewDevice: number = 3
export const DeviceStatus_Normal: number = 0
export const ReportSIDAction_Login: number = 0
export const ReportSIDAction_SignOut: number = 1
export interface DeviceRecentUserRequest {
}
export function DeviceRecentUserRequestToRequestData(data: DeviceRecentUserRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, []),
  }
}
export interface DeviceRecentUserResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'user_basic'?: user.UserBasic;
}
export function DeviceRecentUserResponseToRequestData(data: DeviceRecentUserResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'user_basic', ]),
  }
}
export interface LaunchDeviceRequest {
}
export function LaunchDeviceRequestToRequestData(data: LaunchDeviceRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, []),
  }
}
export interface LaunchDeviceResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'diversion_channel'?: misc.DiversionChannel;
  'my_device_info'?: device.MyDeviceProf;
  'selected_taste_builder'?: boolean;
  'extra_gesture_guidance'?: boolean;
  'show_scene_mode_panel'?: boolean;
  'device_stats'?: device.DeviceStats;
  'guide_config'?: device.GuideConfig;
}
export function LaunchDeviceResponseToRequestData(data: LaunchDeviceResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'diversion_channel', 'my_device_info', 'selected_taste_builder', 'extra_gesture_guidance', 'show_scene_mode_panel', 'device_stats', 'guide_config', ]),
  }
}
export interface LaunchRequest {
}
export function LaunchRequestToRequestData(data: LaunchRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, []),
  }
}
export interface LaunchResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'device_status'?: DeviceStatus;
  'boost_setting'?: boost.BoostSetting;
  'location'?: misc.GeoInfo;
  'invite_code'?: string;
}
export function LaunchResponseToRequestData(data: LaunchResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'device_status', 'boost_setting', 'location', 'invite_code', ]),
  }
}
export interface RedeemInvitationCodeRequest {
  'invitation_code': string;
}
export function RedeemInvitationCodeRequestToRequestData(data: RedeemInvitationCodeRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['invitation_code', ]),
  }
}
export interface RedeemInvitationCodeResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'valid'?: boolean;
}
export function RedeemInvitationCodeResponseToRequestData(data: RedeemInvitationCodeResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'valid', ]),
  }
}
export interface RefreshInvitationCodeTimeRequest {
}
export function RefreshInvitationCodeTimeRequestToRequestData(data: RefreshInvitationCodeTimeRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, []),
  }
}
export interface RefreshInvitationCodeTimeResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'invc_time_remain': number;
}
export function RefreshInvitationCodeTimeResponseToRequestData(data: RefreshInvitationCodeTimeResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'invc_time_remain', ]),
  }
}
export interface ReportActionsRequest {
  'actions'?: misc.Action[];
  'report_action_extra'?: feed.FeedReportActionExtra;
}
export function ReportActionsRequestToRequestData(data: ReportActionsRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['actions', 'report_action_extra', ]),
  }
}
export interface ReportActionsResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'result'?: string;
  'msg'?: string;
}
export function ReportActionsResponseToRequestData(data: ReportActionsResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'result', 'msg', ]),
  }
}
export interface ReportItemActionRequest {
  'actions'?: misc.ItemActionInfo[];
}
export function ReportItemActionRequestToRequestData(data: ReportItemActionRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['actions', ]),
  }
}
export interface ReportItemActionResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
}
export function ReportItemActionResponseToRequestData(data: ReportItemActionResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', ]),
  }
}
export interface ReportSpecialIDRequest {
  'user_id'?: number;
  'special_id': string;
  'report_action': ReportAction;
  'platform'?: string;
  'appid'?: number;
}
export function ReportSpecialIDRequestToRequestData(data: ReportSpecialIDRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['user_id', 'special_id', 'report_action', 'platform', 'appid', ]),
  }
}
export interface ReportSpecialIDResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'result': boolean;
}
export function ReportSpecialIDResponseToRequestData(data: ReportSpecialIDResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'result', ]),
  }
}
export interface ShareInvitationCodeRequest {
}
export function ShareInvitationCodeRequestToRequestData(data: ShareInvitationCodeRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, []),
  }
}
export interface ShareInvitationCodeResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'invitation_code'?: string;
  'content_template'?: string;
}
export function ShareInvitationCodeResponseToRequestData(data: ShareInvitationCodeResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'invitation_code', 'content_template', ]),
  }
}
export type AbroadType = number
export type DeviceStatus = number
export type ReportAction = number
