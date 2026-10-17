// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'
import * as general from './general.js'
import * as report from '../entity/report.js'

export const ReportTypePlaylist: string = 'playlist'
export const ReportTypeTrack: string = 'track'
export const ReportTypeUser: string = 'user'
export const ResportTypeLunaComment: string = 'luna_comment'
export const ResportTypeUgcClip: string = 'ugc_clip'
export interface GetReportReasonRequest {
  'report_type': string;
}
export function GetReportReasonRequestToRequestData(data: GetReportReasonRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['report_type', ]),
    body: fieldsAssign(data, []),
  }
}
export interface GetReportReasonResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'report_reasons'?: report.ReportReason[];
}
export function GetReportReasonResponseToRequestData(data: GetReportReasonResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'report_reasons', ]),
  }
}
export interface ReportRequest {
  'content_id': string;
  'report_type': string;
  'report_reason_code': string;
  'description'?: string;
  'image_uris'?: string[];
}
export function ReportRequestToRequestData(data: ReportRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['content_id', 'report_type', 'report_reason_code', 'description', 'image_uris', ]),
  }
}
export interface ReportResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
}
export function ReportResponseToRequestData(data: ReportResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', ]),
  }
}
