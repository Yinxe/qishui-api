// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'
import * as comment from '../entity/comment.js'
import * as general from './general.js'
import * as hashtag from '../entity/hashtag.js'

export enum GroupType {
  Track = 0,
  UgcVideo = 1,
  MV = 2,
  UgcClip = 3,
  Playlist = 4,
  Fandom = 5,
}
export interface CommentActionRequest {
  'comment_id': string;
  'reply_id': string;
  'group_id': string;
  'type': number;
  'scene_name': string;
}
export function CommentActionRequestToRequestData(data: CommentActionRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['comment_id', 'reply_id', 'group_id', 'type', 'scene_name', ]),
  }
}
export interface CommentActionResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'liked_comment'?: string;
}
export function CommentActionResponseToRequestData(data: CommentActionResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'liked_comment', ]),
  }
}
export interface CommentAudioAsrRequest {
  'comment_id': string;
}
export function CommentAudioAsrRequestToRequestData(data: CommentAudioAsrRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['comment_id', ]),
    body: fieldsAssign(data, []),
  }
}
export interface CommentAudioAsrResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'audio'?: comment.Audio;
}
export function CommentAudioAsrResponseToRequestData(data: CommentAudioAsrResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'audio', ]),
  }
}
export interface CreateCommentRequest {
  'group_id'?: string;
  'text'?: string;
  'reply_id'?: string;
  'reply_to_reply_id'?: string;
  'reply_to_user_id'?: string;
  'comment_type'?: comment.SpecialCommentType;
  'group_type'?: GroupType;
  'hashtags'?: hashtag.HashtagBrief[];
  'text_extra'?: comment.TextExtra[];
  'image_list'?: comment.Image[];
  'audio'?: comment.AudioInput;
}
export function CreateCommentRequestToRequestData(data: CreateCommentRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['group_id', 'text', 'reply_id', 'reply_to_reply_id', 'reply_to_user_id', 'comment_type', 'group_type', 'hashtags', 'text_extra', 'image_list', 'audio', ]),
  }
}
export interface CreateCommentResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'created_comment'?: string;
  'comment_type'?: comment.SpecialCommentType;
  'featured_tags'?: string[];
  'hashtags'?: hashtag.HashtagBrief[];
  'comment_label'?: string;
  'comment_signature'?: string;
  'view_detail'?: comment.ViewDetail;
  'punish_result'?: string;
  'image_list'?: comment.ImageData[];
  'audio'?: comment.AudioInput;
}
export function CreateCommentResponseToRequestData(data: CreateCommentResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'created_comment', 'comment_type', 'featured_tags', 'hashtags', 'comment_label', 'comment_signature', 'view_detail', 'punish_result', 'image_list', 'audio', ]),
  }
}
export interface DeleteCommentRequest {
  'comment_id'?: string;
  'reply_id'?: string;
}
export function DeleteCommentRequestToRequestData(data: DeleteCommentRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['comment_id', 'reply_id', ]),
  }
}
export interface DeleteCommentResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'deleted_comment'?: string;
}
export function DeleteCommentResponseToRequestData(data: DeleteCommentResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'deleted_comment', ]),
  }
}
export interface GetCommentRequest {
  'parent_id'?: string;
  'reply_id'?: string;
  'image_strategy'?: comment.CommentImageDisplayStrategy;
}
export function GetCommentRequestToRequestData(data: GetCommentRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['parent_id', 'reply_id', 'image_strategy', ]),
    body: fieldsAssign(data, []),
  }
}
export interface GetCommentResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'comment'?: comment.Comment;
}
export function GetCommentResponseToRequestData(data: GetCommentResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'comment', ]),
  }
}
export interface ListCommentsRequest {
  'group_id': string;
  'cursor': string;
  'count': number;
  'group_type': GroupType;
  'image_strategy'?: comment.CommentImageDisplayStrategy;
  'sort_type'?: string;
}
export function ListCommentsRequestToRequestData(data: ListCommentsRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['group_id', 'cursor', 'count', 'group_type', 'image_strategy', 'sort_type', ]),
    body: fieldsAssign(data, []),
  }
}
export interface ListCommentsResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'comments'?: comment.Comment[];
  'count'?: string;
  'cursor'?: string;
  'has_more'?: boolean;
  'prompts'?: string[];
  'douyin_comment_cnt'?: number;
}
export function ListCommentsResponseToRequestData(data: ListCommentsResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'comments', 'count', 'cursor', 'has_more', 'prompts', 'douyin_comment_cnt', ]),
  }
}
export interface ListRepliesRequest {
  'comment_id': string;
  'cursor': string;
  'count': number;
  'image_strategy'?: comment.CommentImageDisplayStrategy;
  'ab_param'?: string;
  'group_id': string;
  'group_type': GroupType;
}
export function ListRepliesRequestToRequestData(data: ListRepliesRequest): IRequestData {
  return {
    params: fieldsAssign(data, ['comment_id', ]),
    query: fieldsAssign(data, ['cursor', 'count', 'image_strategy', 'ab_param', 'group_id', 'group_type', ]),
    body: fieldsAssign(data, []),
  }
}
export interface ListRepliesResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'reply_infos'?: comment.Comment[];
  'count'?: string;
  'cursor'?: string;
  'has_more'?: boolean;
}
export function ListRepliesResponseToRequestData(data: ListRepliesResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'reply_infos', 'count', 'cursor', 'has_more', ]),
  }
}
