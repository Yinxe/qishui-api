// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'
import * as general from './general.js'

export interface EvaluateDetail {
  'order'?: number;
  'song_name'?: string;
  'evaluate_options'?: EvaluateOption[];
  'questions'?: Question[];
  'text_box'?: TextBox;
}
export function EvaluateDetailToRequestData(data: EvaluateDetail): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['order', 'song_name', 'evaluate_options', 'questions', 'text_box', ]),
  }
}
export interface EvaluateOption {
  'option'?: string;
  'enable_volume_balance'?: boolean;
  'peak_db'?: number;
  'src_loudness'?: number;
  'target_loudness'?: number;
  'song_url'?: string;
  'song_md5'?: string;
  'song_tag'?: string;
}
export function EvaluateOptionToRequestData(data: EvaluateOption): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['option', 'enable_volume_balance', 'peak_db', 'src_loudness', 'target_loudness', 'song_url', 'song_md5', 'song_tag', ]),
  }
}
export interface EvaluateResult {
  'order'?: number;
  'selections'?: string[];
  'user_comment'?: string;
  'user_behavior'?: string;
}
export function EvaluateResultToRequestData(data: EvaluateResult): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['order', 'selections', 'user_comment', 'user_behavior', ]),
  }
}
export interface GetEvaluationRequest {
  'evaluation_id': string;
}
export function GetEvaluationRequestToRequestData(data: GetEvaluationRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['evaluation_id', ]),
    body: fieldsAssign(data, []),
  }
}
export interface GetEvaluationResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'task_info'?: TaskInfo;
  'songs'?: EvaluateDetail[];
}
export function GetEvaluationResponseToRequestData(data: GetEvaluationResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'task_info', 'songs', ]),
  }
}
export interface Question {
  'stem'?: string;
  'question_options'?: string[];
}
export function QuestionToRequestData(data: Question): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['stem', 'question_options', ]),
  }
}
export interface SubmitEvaluateResultsRequest {
  'evaluation_id'?: number;
  'user_name'?: string;
  'evaluate_results'?: EvaluateResult[];
}
export function SubmitEvaluateResultsRequestToRequestData(data: SubmitEvaluateResultsRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['evaluation_id', 'user_name', 'evaluate_results', ]),
  }
}
export interface SubmitEvaluateResultsResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
}
export function SubmitEvaluateResultsResponseToRequestData(data: SubmitEvaluateResultsResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', ]),
  }
}
export interface TaskInfo {
  'task_name'?: string;
  'task_id'?: number;
  'task_desc': string;
}
export function TaskInfoToRequestData(data: TaskInfo): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['task_name', 'task_id', 'task_desc', ]),
  }
}
export interface TextBox {
  'show_text_box': boolean;
  'title': string;
}
export function TextBoxToRequestData(data: TextBox): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['show_text_box', 'title', ]),
  }
}
