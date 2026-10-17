// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'
import * as chart from '../entity/chart.js'
import * as general from './general.js'

export interface GetChartDetailRequest {
  'chart_id': string;
}
export function GetChartDetailRequestToRequestData(data: GetChartDetailRequest): IRequestData {
  return {
    params: fieldsAssign(data, ['chart_id', ]),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, []),
  }
}
export interface GetChartDetailResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'chart'?: chart.BriefChart;
}
export function GetChartDetailResponseToRequestData(data: GetChartDetailResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'chart', ]),
  }
}
