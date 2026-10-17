// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'
import * as general from './general.js'

export interface RegisterMiniLunaUserRequest {
}
export function RegisterMiniLunaUserRequestToRequestData(data: RegisterMiniLunaUserRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, []),
  }
}
export interface RegisterMiniLunaUserResponse {
  'status_code': number;
  'status_info'?: general.StatusInfo;
}
export function RegisterMiniLunaUserResponseToRequestData(data: RegisterMiniLunaUserResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', ]),
  }
}
