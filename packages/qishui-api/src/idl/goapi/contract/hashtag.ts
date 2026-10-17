// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'
import * as comment from '../entity/comment.js'
import * as common from '../entity/common.js'
import * as general from './general.js'
import * as hashtag from '../entity/hashtag.js'

export interface GetHashtagDetailRequest {
  'hashtag_id': string;
  'cursor': string;
  'count': number;
  'pinned_comment_ids': string;
  'image_strategy'?: comment.CommentImageDisplayStrategy;
}
export function GetHashtagDetailRequestToRequestData(data: GetHashtagDetailRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['hashtag_id', 'cursor', 'count', 'pinned_comment_ids', 'image_strategy', ]),
    body: fieldsAssign(data, []),
  }
}
export interface GetHashtagDetailResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'hashtag_info'?: hashtag.HashtagInfo;
  'hashtag_comments'?: hashtag.HashtagCommentInfo[];
  'next_cursor'?: string;
  'has_more'?: boolean;
  'deeplink'?: string;
  'background_color'?: string;
  'url_cover'?: common.URLInfo;
}
export function GetHashtagDetailResponseToRequestData(data: GetHashtagDetailResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'hashtag_info', 'hashtag_comments', 'next_cursor', 'has_more', 'deeplink', 'background_color', 'url_cover', ]),
  }
}
export interface GetRecommendHashtagsRequest {
  'group_id'?: string;
  'group_type'?: number;
}
export function GetRecommendHashtagsRequestToRequestData(data: GetRecommendHashtagsRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['group_id', 'group_type', ]),
    body: fieldsAssign(data, []),
  }
}
export interface GetRecommendHashtagsResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'recommend_hashtags'?: hashtag.HashtagInfo[];
}
export function GetRecommendHashtagsResponseToRequestData(data: GetRecommendHashtagsResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'recommend_hashtags', ]),
  }
}
export interface GetUserHashtagCommentsRequest {
  'user_id': string;
  'cursor': string;
  'count': number;
  'image_strategy'?: comment.CommentImageDisplayStrategy;
}
export function GetUserHashtagCommentsRequestToRequestData(data: GetUserHashtagCommentsRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['user_id', 'cursor', 'count', 'image_strategy', ]),
    body: fieldsAssign(data, []),
  }
}
export interface GetUserHashtagCommentsResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'hashtag_comments'?: hashtag.HashtagCommentInfo[];
  'next_cursor'?: string;
  'has_more': boolean;
  'total': number;
}
export function GetUserHashtagCommentsResponseToRequestData(data: GetUserHashtagCommentsResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'hashtag_comments', 'next_cursor', 'has_more', 'total', ]),
  }
}
