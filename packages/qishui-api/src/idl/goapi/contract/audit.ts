// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'
import * as audit from '../entity/audit.js'
import * as general from './general.js'

export interface CommitAuditRequest {
  'scene'?: audit.AuditScene;
  'content'?: audit.AuditContent;
}
export function CommitAuditRequestToRequestData(data: CommitAuditRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['scene', 'content', ]),
  }
}
export interface CommitAuditResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'audit_id'?: string;
}
export function CommitAuditResponseToRequestData(data: CommitAuditResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'audit_id', ]),
  }
}
export interface GetAuditRequest {
  'audit_id': string;
}
export function GetAuditRequestToRequestData(data: GetAuditRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['audit_id', ]),
    body: fieldsAssign(data, ['audit_id', ]),
  }
}
export interface GetAuditResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'detail'?: audit.AuditDetail;
}
export function GetAuditResponseToRequestData(data: GetAuditResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'detail', ]),
  }
}
