// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'
import * as block from '../entity/block.js'
import * as feed from '../entity/feed.js'
import * as general from './general.js'
import * as media from '../entity/media.js'

export interface MorePanelRequest {
  'media'?: media.Media;
  'related_track_param'?: RelatedTrackParam;
  'related_video_param'?: RelatedVideoParam;
}
export function MorePanelRequestToRequestData(data: MorePanelRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['media', 'related_track_param', 'related_video_param', ]),
  }
}
export interface MorePanelResourceRequest {
  'media'?: media.Media;
  'block_type'?: string;
  'related_track_param'?: RelatedTrackParam;
  'related_video_param'?: RelatedVideoParam;
  'player_info_param'?: feed.FeedPlayerInfoParam;
  'full_media'?: boolean;
}
export function MorePanelResourceRequestToRequestData(data: MorePanelResourceRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['media', 'block_type', 'related_track_param', 'related_video_param', 'player_info_param', 'full_media', ]),
  }
}
export interface MorePanelResourceResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'has_more'?: boolean;
  'next_cursor'?: string;
  'items'?: block.MorePanelItem[];
}
export function MorePanelResourceResponseToRequestData(data: MorePanelResourceResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'has_more', 'next_cursor', 'items', ]),
  }
}
export interface MorePanelResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'blocks'?: block.MorePanelBlock[];
}
export function MorePanelResponseToRequestData(data: MorePanelResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'blocks', ]),
  }
}
export interface RelatedTrackParam {
  'req_count'?: number;
  'first_req_time'?: number;
  'played_media'?: media.MediaPlayed[];
  'feed_related_track_extra'?: feed.RecExtraRelatedTrackParam;
}
export function RelatedTrackParamToRequestData(data: RelatedTrackParam): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['req_count', 'first_req_time', 'played_media', 'feed_related_track_extra', ]),
  }
}
export interface RelatedVideoParam {
  'search_id'?: string;
  'cursor'?: string;
}
export function RelatedVideoParamToRequestData(data: RelatedVideoParam): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['search_id', 'cursor', ]),
  }
}
