// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'
import * as general from './general.js'
import * as summary2024 from '../entity/summary2024.js'
import * as user from '../entity/user.js'

export enum Anniversary2024Availability {
  Unknown = 0,
  Available = 1,
  FilterByTeenMode = 2,
  FilterByDevice = 3,
  FilterByRegion = 4,
  FilterByDate = 5,
  FilterByVersion = 6,
}
export interface CreateAnniversaryPlaylist2024Request {
  'mock_user_id'?: string;
}
export function CreateAnniversaryPlaylist2024RequestToRequestData(data: CreateAnniversaryPlaylist2024Request): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['mock_user_id', ]),
    body: fieldsAssign(data, []),
  }
}
export interface CreateAnniversaryPlaylist2024Response {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
}
export function CreateAnniversaryPlaylist2024ResponseToRequestData(data: CreateAnniversaryPlaylist2024Response): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', ]),
  }
}
export interface GetMySummary2024Request {
  'mock_user_id'?: string;
}
export function GetMySummary2024RequestToRequestData(data: GetMySummary2024Request): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['mock_user_id', ]),
    body: fieldsAssign(data, []),
  }
}
export interface GetMySummary2024Response {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'user_brief'?: summary2024.Summary2024UserBrief;
  'page1'?: summary2024.Summary2024Page1;
  'page2'?: summary2024.Summary2024Page2;
  'page3'?: summary2024.Summary2024Page3;
  'page4'?: summary2024.Summary2024Page4;
  'page5'?: summary2024.Summary2024Page5;
  'page6'?: summary2024.Summary2024Page6;
  'page7'?: summary2024.Summary2024Page7;
  'page8_1'?: summary2024.Summary2024Page8;
  'page8_2'?: summary2024.Summary2024Page8;
  'page8_3'?: summary2024.Summary2024Page8;
  'page9_1'?: summary2024.Summary2024Page9Part1;
  'page9_2'?: summary2024.Summary2024Page9Part2;
  'page9_3'?: summary2024.Summary2024Page9Part3;
  'page9_4'?: summary2024.Summary2024Page9Part4;
  'page9_5'?: summary2024.Summary2024Page9Part5;
  'page10_1'?: summary2024.Summary2024Page10Part1;
  'page10_2'?: summary2024.Summary2024Page10Part2;
  'page12'?: summary2024.Summary2024Page12;
  'page13'?: summary2024.Summary2024Page13;
  'page14'?: summary2024.Summary2024Page14;
  'page15'?: summary2024.Summary2024Page15;
}
export function GetMySummary2024ResponseToRequestData(data: GetMySummary2024Response): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'user_brief', 'page1', 'page2', 'page3', 'page4', 'page5', 'page6', 'page7', 'page8_1', 'page8_2', 'page8_3', 'page9_1', 'page9_2', 'page9_3', 'page9_4', 'page9_5', 'page10_1', 'page10_2', 'page12', 'page13', 'page14', 'page15', ]),
  }
}
export interface GetSummary2024AvailabilityRequest {
}
export function GetSummary2024AvailabilityRequestToRequestData(data: GetSummary2024AvailabilityRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, []),
  }
}
export interface GetSummary2024AvailabilityResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'availability': Anniversary2024Availability;
}
export function GetSummary2024AvailabilityResponseToRequestData(data: GetSummary2024AvailabilityResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'availability', ]),
  }
}
