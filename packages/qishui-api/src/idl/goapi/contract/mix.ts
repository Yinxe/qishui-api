// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'
import * as general from './general.js'
import * as media from '../entity/media.js'
import * as mix from '../entity/mix.js'

export interface GetMixInfoRequest {
  'mix_param'?: mix.MixParam[];
}
export function GetMixInfoRequestToRequestData(data: GetMixInfoRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['mix_param', ]),
    body: fieldsAssign(data, ['mix_param', ]),
  }
}
export interface GetMixInfoResponse {
  'status_code': number;
  'status_info'?: general.StatusInfo;
  'mix_info'?: mix.MixInfo[];
}
export function GetMixInfoResponseToRequestData(data: GetMixInfoResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'mix_info', ]),
  }
}
