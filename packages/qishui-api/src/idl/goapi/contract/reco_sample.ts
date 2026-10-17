// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'
import * as general from './general.js'
import * as reco_sample from '../entity/reco_sample.js'

export interface ReportSampleRequest {
  'samples'?: reco_sample.RecommendSample[];
}
export function ReportSampleRequestToRequestData(data: ReportSampleRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['samples', ]),
  }
}
export interface ReportSampleResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
}
export function ReportSampleResponseToRequestData(data: ReportSampleResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', ]),
  }
}
