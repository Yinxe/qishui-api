// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'
import * as acquisition from '../entity/acquisition.js'
import * as general from './general.js'

export const AcquisitionIncludeActivityTask: string = 'activity_task'
export const AcquisitionIncludeDeeplink: string = 'deeplink'
export const AcquisitionIncludeInsertItem: string = 'insert_item'
export const AcquisitionIncludePopup: string = 'popup'
export interface GetAcquisitionRequest {
  'includes'?: string[];
}
export function GetAcquisitionRequestToRequestData(data: GetAcquisitionRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, []),
  }
}
export interface GetAcquisitionResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'entity'?: acquisition.AcquisitionEntity;
  'acquisition_entity_type'?: string;
  'acquisition_param'?: acquisition.AcquuisitionParam;
}
export function GetAcquisitionResponseToRequestData(data: GetAcquisitionResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'entity', 'acquisition_entity_type', 'acquisition_param', ]),
  }
}
