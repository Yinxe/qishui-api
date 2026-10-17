// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'
import * as artist from '../entity/artist.js'
import * as general from './general.js'
import * as media from '../entity/media.js'
import * as track from '../entity/track.js'
import * as video from '../entity/video.js'

export const VideoIncludeRisk: string = 'risk'
export const VideoIncludeVideoInfo: string = 'video'
export const VideoIncludeVideoPlayer: string = 'video_player'
export const VideoIncludeVideoStats: string = 'media_stats'
export interface GetVideoMixRequest {
  'mix_id': string;
  'count': number;
  'cursor': number;
  'reverse': boolean;
}
export function GetVideoMixRequestToRequestData(data: GetVideoMixRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['mix_id', 'count', 'cursor', 'reverse', ]),
    body: fieldsAssign(data, ['mix_id', 'count', 'cursor', 'reverse', ]),
  }
}
export interface GetVideoMixResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'has_more': boolean;
  'cursor': number;
  'videos'?: video.Video[];
}
export function GetVideoMixResponseToRequestData(data: GetVideoMixResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'has_more', 'cursor', 'videos', ]),
  }
}
export interface GetVideoPlaylistDetailRequest {
  'video_id'?: string;
  'count'?: number;
  'cursor'?: number;
}
export function GetVideoPlaylistDetailRequestToRequestData(data: GetVideoPlaylistDetailRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['video_id', 'count', 'cursor', ]),
    body: fieldsAssign(data, []),
  }
}
export interface GetVideoPlaylistDetailResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'video_playlist_tracks'?: track.TrackWrapper[];
  'total_count'?: number;
  'has_more'?: boolean;
  'next_cursor'?: number;
}
export function GetVideoPlaylistDetailResponseToRequestData(data: GetVideoPlaylistDetailResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'video_playlist_tracks', 'total_count', 'has_more', 'next_cursor', ]),
  }
}
export interface GetVideoRequest {
  'video_id': string;
  'type': string;
  'includes'?: string[];
}
export function GetVideoRequestToRequestData(data: GetVideoRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['video_id', 'type', 'includes', ]),
    body: fieldsAssign(data, ['video_id', 'type', 'includes', ]),
  }
}
export interface GetVideoResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'video'?: video.Video;
  'video_player'?: media.PlayerInfo;
  'media_stats'?: media.MediaStats;
  'risk_result': number;
}
export function GetVideoResponseToRequestData(data: GetVideoResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'video', 'video_player', 'media_stats', 'risk_result', ]),
  }
}
export interface GetVideoV2Request {
  'video_id': string;
  'type': string;
  'enable_refresh_api'?: boolean;
  'enable_dash'?: boolean;
  'scene_name'?: string;
  'queue_type'?: string;
}
export function GetVideoV2RequestToRequestData(data: GetVideoV2Request): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['video_id', 'type', 'enable_refresh_api', 'enable_dash', ]),
    body: fieldsAssign(data, ['video_id', 'type', 'enable_refresh_api', 'enable_dash', 'scene_name', 'queue_type', ]),
  }
}
export interface GetVideoV2Response {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'video'?: video.Video;
  'video_player'?: media.PlayerInfo;
  'media_stats'?: media.MediaStats;
  'risk_result': number;
  'expire_at': number;
  'player_infos'?: media.PlayerInfo[];
  'my_artist_stats'?: Record<string, artist.MyArtistStats>;
}
export function GetVideoV2ResponseToRequestData(data: GetVideoV2Response): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'video', 'video_player', 'media_stats', 'risk_result', 'expire_at', 'player_infos', 'my_artist_stats', ]),
  }
}
export type VideoInclude = string
