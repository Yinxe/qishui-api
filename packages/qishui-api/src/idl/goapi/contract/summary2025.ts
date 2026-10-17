// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'
import * as general from './general.js'
import * as summary2025 from '../entity/summary2025.js'

export enum Anniversary2025Availability {
  Unknown = 0,
  Available = 1,
  FilterByTeenMode = 2,
  FilterByDevice = 3,
  FilterByRegion = 4,
  FilterByDate = 5,
  FilterByVersion = 6,
  FilterByOpenharmony = 7,
}
export interface CreateAnniversaryPlaylist2025Request {
  'mock_user_id'?: string;
}
export function CreateAnniversaryPlaylist2025RequestToRequestData(data: CreateAnniversaryPlaylist2025Request): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['mock_user_id', ]),
    body: fieldsAssign(data, []),
  }
}
export interface CreateAnniversaryPlaylist2025Response {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
}
export function CreateAnniversaryPlaylist2025ResponseToRequestData(data: CreateAnniversaryPlaylist2025Response): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', ]),
  }
}
export interface GetMySummary2025Request {
  'mock_user_id'?: string;
}
export function GetMySummary2025RequestToRequestData(data: GetMySummary2025Request): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['mock_user_id', ]),
    body: fieldsAssign(data, []),
  }
}
export interface GetMySummary2025Response {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'user_brief'?: summary2025.Summary2025UserBrief;
  'page1'?: summary2025.Summary2025DefaultPage;
  'page2'?: summary2025.Summary2025Page2;
  'page3'?: summary2025.Summary2025Page3;
  'page4'?: summary2025.Summary2025Page4;
  'page5'?: summary2025.Summary2025Page5;
  'page6'?: summary2025.Summary2025Page6;
  'page8'?: summary2025.Summary2025Page8;
  'page9'?: summary2025.Summary2025Page9;
  'page10'?: summary2025.Summary2025Page10;
  'page12'?: summary2025.Summary2025Page12;
  'page13'?: summary2025.Summary2025Page13;
  'page14'?: summary2025.Summary2025DefaultPage;
  'page15'?: summary2025.Summary2025Page15;
  'page16'?: summary2025.Summary2025Page16;
  'page17'?: summary2025.Summary2025Page17;
  'page18'?: summary2025.Summary2025Page18;
  'page19'?: summary2025.Summary2025DefaultPage;
  'page20'?: summary2025.Summary2025Page20;
  'page21'?: summary2025.Summary2025Page21;
  'page22'?: summary2025.Summary2025DefaultPage;
  'page23'?: summary2025.Summary2025Page23;
  'page24'?: summary2025.Summary2025DefaultPage;
  'page25'?: summary2025.Summary2025DefaultPage;
  'page26'?: summary2025.Summary2025Page26;
  'fallback_track'?: summary2025.Summary2025TrackBrief;
}
export function GetMySummary2025ResponseToRequestData(data: GetMySummary2025Response): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'user_brief', 'page1', 'page2', 'page3', 'page4', 'page5', 'page6', 'page8', 'page9', 'page10', 'page12', 'page13', 'page14', 'page15', 'page16', 'page17', 'page18', 'page19', 'page20', 'page21', 'page22', 'page23', 'page24', 'page25', 'page26', 'fallback_track', ]),
  }
}
export interface GetSummary2025AvailabilityRequest {
}
export function GetSummary2025AvailabilityRequestToRequestData(data: GetSummary2025AvailabilityRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, []),
  }
}
export interface GetSummary2025AvailabilityResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'availability': Anniversary2025Availability;
}
export function GetSummary2025AvailabilityResponseToRequestData(data: GetSummary2025AvailabilityResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'availability', ]),
  }
}
