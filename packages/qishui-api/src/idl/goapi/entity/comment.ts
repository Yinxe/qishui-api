// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'
import * as common from './common.js'
import * as hashtag from './hashtag.js'
import * as user from './user.js'
import * as user_artist from './user_artist.js'

export enum CommentImageDisplayStrategy {
  disable = 0,
  onlyText = 1,
  image = 2,
  MultiImage = 3,
}
export enum SpecialCommentType {
  normal = 0,
  FeaturedComment = 1,
}
export interface Audio {
  'vid'?: string;
  'wave'?: string;
  'duration'?: number;
  'content'?: string;
  'asr_text'?: string;
  'asr_status'?: number;
}
export function AudioToRequestData(data: Audio): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['vid', 'wave', 'duration', 'content', 'asr_text', 'asr_status', ]),
  }
}
export interface AudioInput {
  'vid'?: string;
  'wave'?: string;
  'duration'?: number;
}
export function AudioInputToRequestData(data: AudioInput): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['vid', 'wave', 'duration', ]),
  }
}
export interface Comment {
  'id'?: string;
  'content'?: string;
  'count_digged'?: number;
  'reply_comments'?: Comment[];
  'time_created'?: number;
  'user'?: user.UserBrief;
  'user_digged'?: boolean;
  'count_reply'?: number;
  'reply_to'?: Comment;
  'featured'?: boolean;
  'visibility'?: number;
  'featured_tags'?: string[];
  'hashtags'?: hashtag.HashtagBrief[];
  'comment_label'?: string;
  'comment_identity'?: string;
  'view_detail'?: ViewDetail;
  'user_artist_info'?: user_artist.UserArtistBrief;
  'text_extra'?: TextExtra[];
  'service_id'?: string;
  'image_list'?: ImageData[];
  'ip_label'?: string;
  'has_three_level_reply'?: boolean;
  'audio'?: Audio;
  'can_delete'?: boolean;
}
export function CommentToRequestData(data: Comment): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['id', 'content', 'count_digged', 'reply_comments', 'time_created', 'user', 'user_digged', 'count_reply', 'reply_to', 'featured', 'visibility', 'featured_tags', 'hashtags', 'comment_label', 'comment_identity', 'view_detail', 'user_artist_info', 'text_extra', 'service_id', 'image_list', 'ip_label', 'has_three_level_reply', 'audio', 'can_delete', ]),
  }
}
export interface Image {
  'uri'?: string;
  'height'?: number;
  'width'?: number;
  'format'?: string;
}
export function ImageToRequestData(data: Image): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['uri', 'height', 'width', 'format', ]),
  }
}
export interface ImageData {
  'origin_url'?: common.URLInfo;
  'medium_url'?: common.URLInfo;
  'download_url'?: common.URLInfo;
}
export function ImageDataToRequestData(data: ImageData): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['origin_url', 'medium_url', 'download_url', ]),
  }
}
export interface TextExtra {
  'start'?: number;
  'end'?: number;
  'user_id'?: string;
  'artist_id'?: string;
}
export function TextExtraToRequestData(data: TextExtra): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['start', 'end', 'user_id', 'artist_id', ]),
  }
}
export interface ViewDetail {
  'count': string;
  'is_show': boolean;
}
export function ViewDetailToRequestData(data: ViewDetail): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['count', 'is_show', ]),
  }
}
