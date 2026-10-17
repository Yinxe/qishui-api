// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'
import * as general from './general.js'

export const DisableCoverMVAutoPlayStatusClose: number = 0
export const DisableCoverMVAutoPlayStatusOpen: number = 1
export const PopupAutoStartStatusClose: number = 0
export const PopupAutoStartStatusOpen: number = 1
export interface GetLunaUserSettingsRequest {
}
export function GetLunaUserSettingsRequestToRequestData(data: GetLunaUserSettingsRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, []),
  }
}
export interface GetLunaUserSettingsResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'luna_user_settings'?: LunaUserSettings;
}
export function GetLunaUserSettingsResponseToRequestData(data: GetLunaUserSettingsResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'luna_user_settings', ]),
  }
}
export interface LunaUserSettings {
  'popup_auto_start_ad'?: string;
  'popup_auto_start_ad_close_days'?: string;
  'disable_cover_mv_auto_play'?: string;
}
export function LunaUserSettingsToRequestData(data: LunaUserSettings): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['popup_auto_start_ad', 'popup_auto_start_ad_close_days', 'disable_cover_mv_auto_play', ]),
  }
}
export interface UpdateLunaUserSettingsRequest {
  'avatar_frame_resource_id'?: string;
  'popup_auto_start_ad'?: string;
  'music_wall_visibility'?: number;
  'disable_cover_mv_auto_play'?: number;
}
export function UpdateLunaUserSettingsRequestToRequestData(data: UpdateLunaUserSettingsRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['avatar_frame_resource_id', 'popup_auto_start_ad', 'music_wall_visibility', 'disable_cover_mv_auto_play', ]),
  }
}
export interface UpdateLunaUserSettingsResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
}
export function UpdateLunaUserSettingsResponseToRequestData(data: UpdateLunaUserSettingsResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', ]),
  }
}
export interface UpdatePrivacySettingRequest {
  'follow_info_visibility'?: number;
  'sync_video_to_luna'?: number;
  'my_favorite_visibility'?: number;
  'music_wall_visibility'?: number;
}
export function UpdatePrivacySettingRequestToRequestData(data: UpdatePrivacySettingRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['follow_info_visibility', 'sync_video_to_luna', 'my_favorite_visibility', 'music_wall_visibility', ]),
  }
}
export interface UpdatePrivacySettingResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
}
export function UpdatePrivacySettingResponseToRequestData(data: UpdatePrivacySettingResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', ]),
  }
}
