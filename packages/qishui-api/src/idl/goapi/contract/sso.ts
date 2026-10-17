// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'
import * as general from './general.js'

export interface SsoTokenRequest {
  'code'?: string;
  'state'?: string;
  'device_id'?: string;
}
export function SsoTokenRequestToRequestData(data: SsoTokenRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['code', 'state', 'device_id', ]),
    body: fieldsAssign(data, []),
  }
}
export interface SsoTokenResponse {
  'status_code'?: number;
  'status_msg'?: string;
  'auth_token'?: string;
}
export function SsoTokenResponseToRequestData(data: SsoTokenResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_msg', 'auth_token', ]),
  }
}
