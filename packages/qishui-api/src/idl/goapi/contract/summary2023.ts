// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'
import * as general from './general.js'
import * as summary2023 from '../entity/summary2023.js'
import * as user from '../entity/user.js'
import * as user_artist from '../entity/user_artist.js'

export interface CreateSummary2023VideoRequest {
  'track_id': number;
  'video_type': summary2023.Summary2023VideoType;
  'media_list'?: summary2023.Summary2023VideoMedia[];
  'audio_type': summary2023.AudioTypeEnum;
}
export function CreateSummary2023VideoRequestToRequestData(data: CreateSummary2023VideoRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['track_id', 'video_type', 'media_list', 'audio_type', ]),
  }
}
export interface CreateSummary2023VideoResponse {
  'status_code': number;
  'status_info'?: general.StatusInfo;
  'task_id': string;
  'video_id': string;
}
export function CreateSummary2023VideoResponseToRequestData(data: CreateSummary2023VideoResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'task_id', 'video_id', ]),
  }
}
export interface GetMySummary2023Request {
}
export function GetMySummary2023RequestToRequestData(data: GetMySummary2023Request): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, []),
  }
}
export interface GetMySummary2023Response {
  'status_code': number;
  'status_info'?: general.StatusInfo;
  'first_song'?: summary2023.FirstSong;
  'favorite_artist'?: summary2023.FavoriteArtist;
  'treasure'?: summary2023.Treasure;
  'mood'?: summary2023.Mood;
  'night'?: summary2023.Night;
  'festival'?: summary2023.Festival;
  'most_times'?: summary2023.MostTimes;
  'musician'?: summary2023.Musician;
  'final_tracks'?: summary2023.FinalTracks;
  'user_brief'?: user.UserBrief;
  'is_newer': boolean;
  'artist_videos'?: summary2023.ArtistVideo[];
}
export function GetMySummary2023ResponseToRequestData(data: GetMySummary2023Response): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'first_song', 'favorite_artist', 'treasure', 'mood', 'night', 'festival', 'most_times', 'musician', 'final_tracks', 'user_brief', 'is_newer', 'artist_videos', ]),
  }
}
export interface GetPreviewMsgRequest {
  'template_id': number;
  'media_list'?: summary2023.Summary2023VideoMedia[];
}
export function GetPreviewMsgRequestToRequestData(data: GetPreviewMsgRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['template_id', 'media_list', ]),
  }
}
export interface GetPreviewMsgResponse {
  'status_code': number;
  'status_info'?: general.StatusInfo;
  'result_json': string;
}
export function GetPreviewMsgResponseToRequestData(data: GetPreviewMsgResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'result_json', ]),
  }
}
export interface GetSummary2023VideoRequest {
  'task_id': string;
}
export function GetSummary2023VideoRequestToRequestData(data: GetSummary2023VideoRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['task_id', ]),
    body: fieldsAssign(data, ['task_id', ]),
  }
}
export interface GetSummary2023VideoResponse {
  'status_code': number;
  'status_info'?: general.StatusInfo;
  'video_id': string;
  'video_type': summary2023.Summary2023VideoType;
  'status': summary2023.Summary2023VideoStatus;
}
export function GetSummary2023VideoResponseToRequestData(data: GetSummary2023VideoResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'video_id', 'video_type', 'status', ]),
  }
}
