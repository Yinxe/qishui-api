// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'
import * as device from '../entity/device.js'
import * as general from './general.js'

export interface GetVolumeStrategyRequest {
}
export function GetVolumeStrategyRequestToRequestData(data: GetVolumeStrategyRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, []),
  }
}
export interface GetVolumeStrategyResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'historical_listen_exp'?: device.HistoricalListenExp;
}
export function GetVolumeStrategyResponseToRequestData(data: GetVolumeStrategyResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'historical_listen_exp', ]),
  }
}
export interface ReportDeviceProfileRequest {
  'device_profile'?: device.DeviceProf;
  'app_list'?: string[];
}
export function ReportDeviceProfileRequestToRequestData(data: ReportDeviceProfileRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['device_profile', 'app_list', ]),
  }
}
export interface ReportDeviceProfileResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
}
export function ReportDeviceProfileResponseToRequestData(data: ReportDeviceProfileResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', ]),
  }
}
