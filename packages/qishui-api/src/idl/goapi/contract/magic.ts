// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'
import * as general from './general.js'
import * as magic from '../entity/magic.js'

export interface FinishMagicTaskRequest {
  'activity_id': string;
  'task_id': string;
}
export function FinishMagicTaskRequestToRequestData(data: FinishMagicTaskRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['activity_id', 'task_id', ]),
  }
}
export interface FinishMagicTaskResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'magic_status_code'?: number;
}
export function FinishMagicTaskResponseToRequestData(data: FinishMagicTaskResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'magic_status_code', ]),
  }
}
export interface GetMagicTasksRequest {
  'activity_id': string;
  'task_ids'?: string[];
}
export function GetMagicTasksRequestToRequestData(data: GetMagicTasksRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['activity_id', 'task_ids', ]),
  }
}
export interface GetMagicTasksResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'task_map'?: Record<string, magic.MagicTask>;
}
export function GetMagicTasksResponseToRequestData(data: GetMagicTasksResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'task_map', ]),
  }
}
