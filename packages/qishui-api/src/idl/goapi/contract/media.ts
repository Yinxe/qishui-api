// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'
import * as artist from '../entity/artist.js'
import * as commerce from '../entity/commerce.js'
import * as common from '../entity/common.js'
import * as general from './general.js'
import * as media from '../entity/media.js'
import * as track from '../entity/track.js'

export const MediaSceneMusicMateQueue: string = 'music_mate_queue'
export const MediaSceneMusicMateShare: string = 'music_mate_share'
export const MediaScenePlaylist: string = 'playlist'
export enum UploadSDKVersion {
  Default = 0,
  V1 = 1,
  V2 = 2,
}
export enum UploadScene {
  Default = 0,
  Comment = 1,
  RecognizeSong = 2,
}
export enum UploadType {
  Image = 0,
  Video = 1,
  Audio = 2,
}
export interface CheckUpdateRequest {
  'scene'?: number;
  'scene_name'?: string;
  'queue_type'?: string;
  'media_list'?: media.ReqMedia[];
}
export function CheckUpdateRequestToRequestData(data: CheckUpdateRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['media_list', ]),
    body: fieldsAssign(data, ['scene', 'scene_name', 'queue_type', 'media_list', ]),
  }
}
export interface CheckUpdateResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'media_result'?: media.CheckMediaResult[];
}
export function CheckUpdateResponseToRequestData(data: CheckUpdateResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'media_result', ]),
  }
}
export interface GetMediaMappingRequest {
  'src_media'?: media.Media[];
  'scene': string;
}
export function GetMediaMappingRequestToRequestData(data: GetMediaMappingRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['src_media', 'scene', ]),
  }
}
export interface GetMediaMappingResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'mapping_media'?: Record<string, media.Media>;
}
export function GetMediaMappingResponseToRequestData(data: GetMediaMappingResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'mapping_media', ]),
  }
}
export interface GetMediaPlayerInfoRequest {
  'media_id': string;
  'type': string;
}
export function GetMediaPlayerInfoRequestToRequestData(data: GetMediaPlayerInfoRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['media_id', 'type', ]),
    body: fieldsAssign(data, []),
  }
}
export interface GetMediaPlayerRequest {
  'vid': string;
  'media_type': string;
  'media_id': string;
  'queue_type': string;
  'limited_free_param'?: common.LimitedFreeParam;
  'enable_refresh_api'?: boolean;
  'enable_dash'?: boolean;
  'scene_name'?: string;
}
export function GetMediaPlayerRequestToRequestData(data: GetMediaPlayerRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['vid', 'media_type', 'media_id', 'queue_type', 'enable_refresh_api', 'enable_dash', ]),
    body: fieldsAssign(data, ['vid', 'media_type', 'media_id', 'queue_type', 'limited_free_param', 'enable_refresh_api', 'enable_dash', 'scene_name', ]),
  }
}
export interface GetMediaStatsRequest {
  'media_id': string;
  'media_type': string;
  'artist_ids'?: string[];
}
export function GetMediaStatsRequestToRequestData(data: GetMediaStatsRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['media_id', 'media_type', ]),
    body: fieldsAssign(data, ['media_id', 'media_type', 'artist_ids', ]),
  }
}
export interface GetMediaStatsResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'stats'?: media.MediaStats;
  'is_post_comment_in_less_comments': boolean;
  'my_artist_stats'?: Record<string, artist.MyArtistStats>;
}
export function GetMediaStatsResponseToRequestData(data: GetMediaStatsResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'stats', 'is_post_comment_in_less_comments', 'my_artist_stats', ]),
  }
}
export interface GetPlayerInfoRequest {
  'media_id': string;
  'type': string;
  'id': string;
}
export function GetPlayerInfoRequestToRequestData(data: GetPlayerInfoRequest): IRequestData {
  return {
    params: fieldsAssign(data, ['id', ]),
    query: fieldsAssign(data, ['media_id', 'type', ]),
    body: fieldsAssign(data, []),
  }
}
export interface GetPlayerInfoResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'player_info'?: media.PlayerInfo;
  'player_infos'?: media.PlayerInfo[];
}
export function GetPlayerInfoResponseToRequestData(data: GetPlayerInfoResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'player_info', 'player_infos', ]),
  }
}
export interface GetTrackPlayerInfoRequest {
  'track_id': string;
  'type': string;
  'enable_refresh_api'?: boolean;
}
export function GetTrackPlayerInfoRequestToRequestData(data: GetTrackPlayerInfoRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['track_id', 'type', 'enable_refresh_api', ]),
    body: fieldsAssign(data, ['enable_refresh_api', ]),
  }
}
export interface GetTrackPlayerInfoResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'player_info'?: media.PlayerInfo;
}
export function GetTrackPlayerInfoResponseToRequestData(data: GetTrackPlayerInfoResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'player_info', ]),
  }
}
export interface GetUploaderInfoResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'uploader_info'?: media.UploaderInfo;
}
export function GetUploaderInfoResponseToRequestData(data: GetUploaderInfoResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'uploader_info', ]),
  }
}
export interface GetUploderInfoRequest {
  'upload_type': UploadType;
  'scene': UploadScene;
  'sdk_version': UploadSDKVersion;
}
export function GetUploderInfoRequestToRequestData(data: GetUploderInfoRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['upload_type', 'scene', 'sdk_version', ]),
    body: fieldsAssign(data, []),
  }
}
export interface MCheckMediaRequest {
  'media_list'?: media.Media[];
  'scene'?: number;
  'limited_free_param_map'?: Record<string, common.LimitedFreeParam>;
  'scene_name'?: string;
  'queue_type'?: string;
}
export function MCheckMediaRequestToRequestData(data: MCheckMediaRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['media_list', 'scene', 'limited_free_param_map', 'scene_name', 'queue_type', ]),
  }
}
export interface MCheckMediaResponse {
  'status_code': number;
  'status_info'?: general.StatusInfo;
  'media_status'?: MediaStatus[];
}
export function MCheckMediaResponseToRequestData(data: MCheckMediaResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'media_status', ]),
  }
}
export interface MGetMediaRequest {
  'media'?: media.Media[];
  'scene': MediaScene;
}
export function MGetMediaRequestToRequestData(data: MGetMediaRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['media', 'scene', ]),
    body: fieldsAssign(data, ['media', 'scene', ]),
  }
}
export interface MGetMediaResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'media'?: media.MediaInfoEntity[];
}
export function MGetMediaResponseToRequestData(data: MGetMediaResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'media', ]),
  }
}
export interface MGetMediaV2Request {
  'scene': MediaScene;
  'scene_name'?: string;
  'queue_type'?: string;
  'limited_free_scene'?: media.LimitedFreeScene;
  'media'?: media.ReqMedia[];
}
export function MGetMediaV2RequestToRequestData(data: MGetMediaV2Request): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['scene', 'media', ]),
    body: fieldsAssign(data, ['scene', 'scene_name', 'queue_type', 'limited_free_scene', 'media', ]),
  }
}
export interface MGetMediaV2Response {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'media'?: media.MediaResult[];
}
export function MGetMediaV2ResponseToRequestData(data: MGetMediaV2Response): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'media', ]),
  }
}
export interface MediaStatus {
  'id': string;
  'type': string;
  'status': number;
  'label_info'?: track.LabelInfo;
  'risk_result': number;
  'turn_off_play_after_preview': boolean;
  'digital_track_info'?: commerce.DigitalAssetInfo;
  'limited_free_info'?: media.LimitedFreeInfo;
  'download_status': media.DownloadStatus;
  'share_status': media.ShareStatus;
  'sharable_platforms'?: media.Platform[];
}
export function MediaStatusToRequestData(data: MediaStatus): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['id', 'type', 'status', 'label_info', 'risk_result', 'turn_off_play_after_preview', 'digital_track_info', 'limited_free_info', 'download_status', 'share_status', 'sharable_platforms', ]),
  }
}
export interface SharkRequest {
  'media_list'?: media.Media[];
  'scene_name'?: string;
  'queue_type'?: string;
}
export function SharkRequestToRequestData(data: SharkRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['media_list', 'scene_name', 'queue_type', ]),
  }
}
export interface SharkResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'media_shark'?: media.MediaSharkResult[];
}
export function SharkResponseToRequestData(data: SharkResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'media_shark', ]),
  }
}
export interface TrackDisLikeRequest {
  'track_id': string;
  'artist_ids'?: number[];
}
export function TrackDisLikeRequestToRequestData(data: TrackDisLikeRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['track_id', 'artist_ids', ]),
  }
}
export interface TrackDisLikeResponse {
  'status_code': number;
  'status_info'?: general.StatusInfo;
}
export function TrackDisLikeResponseToRequestData(data: TrackDisLikeResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', ]),
  }
}
export type MediaScene = string
