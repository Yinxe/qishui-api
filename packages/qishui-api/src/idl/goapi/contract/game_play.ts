// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'
import * as game_play from '../entity/game_play.js'

export enum FinishType {
  Unknown = 0,
  Normal = 1,
  Passive = 2,
  Killed = 3,
}
export enum GamePlayQueryType {
  Unknown = 0,
  RecordID = 1,
  UserID = 2,
}
export enum SubmitStatus {
  Unknown = 0,
  Success = 1,
  InvalidReportData = 2,
  ServerInternal = 3,
}
export interface GetGamePlayConfigRequest {
  'includes'?: string[];
}
export function GetGamePlayConfigRequestToRequestData(data: GetGamePlayConfigRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['includes', ]),
  }
}
export interface GetGamePlayConfigResponse {
  'game_play_config'?: Record<string, string>;
}
export function GetGamePlayConfigResponseToRequestData(data: GetGamePlayConfigResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['game_play_config', ]),
  }
}
export interface QueryGamePlayRecordRequest {
  'query_type': GamePlayQueryType;
  'query_id': string;
}
export function QueryGamePlayRecordRequestToRequestData(data: QueryGamePlayRecordRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['query_type', 'query_id', ]),
  }
}
export interface QueryGamePlayRecordResponse {
  'records'?: game_play.GamePlayRecord[];
}
export function QueryGamePlayRecordResponseToRequestData(data: QueryGamePlayRecordResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['records', ]),
  }
}
export interface SubmitGamePlayRequest {
  'need_resp': boolean;
  'game_play_type': string;
  'feed_mode': string;
  'start_time_ms': number;
  'end_time_ms': number;
  'duration': number;
  'finish_type': FinishType;
  'track_play_count': number;
  'extra'?: game_play.GamePlayExtra;
}
export function SubmitGamePlayRequestToRequestData(data: SubmitGamePlayRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['need_resp', 'game_play_type', 'feed_mode', 'start_time_ms', 'end_time_ms', 'duration', 'finish_type', 'track_play_count', 'extra', ]),
  }
}
export interface SubmitGamePlayResponse {
  'submit_status': SubmitStatus;
  'record'?: game_play.GamePlayRecord;
}
export function SubmitGamePlayResponseToRequestData(data: SubmitGamePlayResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['submit_status', 'record', ]),
  }
}
