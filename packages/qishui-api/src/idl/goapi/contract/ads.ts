// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'
import * as ads from '../entity/ads.js'
import * as general from './general.js'

export interface GetMediaAdsRequest {
  'slot_id'?: string;
  'client_extra_params'?: string;
}
export function GetMediaAdsRequestToRequestData(data: GetMediaAdsRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['slot_id', 'client_extra_params', ]),
  }
}
export interface GetMediaAdsResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'ads_media'?: ads.AdsMedia;
}
export function GetMediaAdsResponseToRequestData(data: GetMediaAdsResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'ads_media', ]),
  }
}
