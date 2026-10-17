// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'
import * as common from '../entity/common.js'
import * as featured_content from '../entity/featured_content.js'
import * as general from './general.js'

export interface GetFeaturedContentDetailRequest {
  'featured_content_id': string;
}
export function GetFeaturedContentDetailRequestToRequestData(data: GetFeaturedContentDetailRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['featured_content_id', ]),
    body: fieldsAssign(data, []),
  }
}
export interface GetFeaturedContentDetailResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'title'?: string;
  'subtitle'?: string;
  'desc'?: string;
  'title_url'?: common.URLInfo;
  'featured_content'?: featured_content.FeaturedContent;
  'has_more'?: boolean;
}
export function GetFeaturedContentDetailResponseToRequestData(data: GetFeaturedContentDetailResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'title', 'subtitle', 'desc', 'title_url', 'featured_content', 'has_more', ]),
  }
}
export interface GetFeaturedContentsRequest {
  'cursor': string;
  'count': number;
}
export function GetFeaturedContentsRequestToRequestData(data: GetFeaturedContentsRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['cursor', 'count', ]),
    body: fieldsAssign(data, []),
  }
}
export interface GetFeaturedContentsResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'featured_contents'?: featured_content.FeaturedContent[];
  'next_cursor'?: number;
  'has_more'?: boolean;
}
export function GetFeaturedContentsResponseToRequestData(data: GetFeaturedContentsResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'featured_contents', 'next_cursor', 'has_more', ]),
  }
}
