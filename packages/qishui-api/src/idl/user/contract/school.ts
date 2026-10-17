// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'
import * as general from './general.js'
import * as school from '../entity/school.js'

export interface GetSchoolCollegeListRequest {
  'school_name': string;
}
export function GetSchoolCollegeListRequestToRequestData(data: GetSchoolCollegeListRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['school_name', ]),
    body: fieldsAssign(data, []),
  }
}
export interface GetSchoolCollegeListResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'college_names'?: string[];
}
export function GetSchoolCollegeListResponseToRequestData(data: GetSchoolCollegeListResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'college_names', ]),
  }
}
export interface GetSchoolListRequest {
  'cursor': string;
  'count': string;
}
export function GetSchoolListRequestToRequestData(data: GetSchoolListRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['cursor', 'count', ]),
    body: fieldsAssign(data, []),
  }
}
export interface GetSchoolListResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'schools'?: school.School[];
  'has_more'?: boolean;
  'cursor'?: number;
  'total'?: number;
}
export function GetSchoolListResponseToRequestData(data: GetSchoolListResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'schools', 'has_more', 'cursor', 'total', ]),
  }
}
export interface GetSchoolNearestRequest {
  'latitude': number;
  'longitude': number;
  'size': number;
  'location_permission'?: boolean;
  'lat'?: string;
  'lon'?: string;
}
export function GetSchoolNearestRequestToRequestData(data: GetSchoolNearestRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['latitude', 'longitude', 'size', 'location_permission', 'lat', 'lon', ]),
    body: fieldsAssign(data, []),
  }
}
export interface GetSchoolNearestResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'schools'?: school.School[];
}
export function GetSchoolNearestResponseToRequestData(data: GetSchoolNearestResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'schools', ]),
  }
}
export interface SearchRequest {
  'keyword': string;
}
export function SearchRequestToRequestData(data: SearchRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['keyword', ]),
    body: fieldsAssign(data, []),
  }
}
export interface SearchResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'schools'?: school.School[];
}
export function SearchResponseToRequestData(data: SearchResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'schools', ]),
  }
}
