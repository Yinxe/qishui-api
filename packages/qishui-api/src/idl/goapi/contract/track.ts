// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'
import * as artist from '../entity/artist.js'
import * as card from '../entity/card.js'
import * as comment from '../entity/comment.js'
import * as commerce from '../entity/commerce.js'
import * as common from '../entity/common.js'
import * as feed from '../entity/feed.js'
import * as general from './general.js'
import * as media from '../entity/media.js'
import * as misc from '../entity/misc.js'
import * as track from '../entity/track.js'
import * as user from '../entity/user.js'

export const TrackIncludeIsCollected: string = 'is_collected'
export const TrackIncludeLyrics: string = 'lyric'
export const TrackIncludeRecommendContent: string = 'recommend_content'
export const TrackIncludeRisk: string = 'risk'
export const TrackIncludeTrackInfo: string = 'track'
export const TrackIncludeTrackPlayer: string = 'track_player'
export const TrackIncludeTrackStats: string = 'track_stats'
export interface CheckTrackRequest {
  'track_id': string;
}
export function CheckTrackRequestToRequestData(data: CheckTrackRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['track_id', ]),
    body: fieldsAssign(data, []),
  }
}
export interface CheckTrackResponse {
  'status_code': number;
  'status_info'?: general.StatusInfo;
  'is_playable': boolean;
}
export function CheckTrackResponseToRequestData(data: CheckTrackResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'is_playable', ]),
  }
}
export interface GetTrackForBellRequest {
  'track_id': string;
  'media_type': string;
}
export function GetTrackForBellRequestToRequestData(data: GetTrackForBellRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['track_id', 'media_type', ]),
    body: fieldsAssign(data, ['track_id', 'media_type', ]),
  }
}
export interface GetTrackRequest {
  'track_id': string;
  'includes'?: string[];
  'recommend_req_info'?: RecommendReqInfo;
  'media_type': string;
}
export function GetTrackRequestToRequestData(data: GetTrackRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['track_id', 'includes', 'recommend_req_info', 'media_type', ]),
    body: fieldsAssign(data, ['track_id', 'includes', 'recommend_req_info', 'media_type', ]),
  }
}
export interface GetTrackResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'is_collected'?: boolean;
  'lyric'?: track.TrackLyrics;
  'track'?: track.Track;
  'track_player'?: media.PlayerInfo;
  'track_stats'?: track.TrackStats;
  'recommend_contents'?: track.TrackRecommendContent[];
  'risk_result': number;
}
export function GetTrackResponseToRequestData(data: GetTrackResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'is_collected', 'lyric', 'track', 'track_player', 'track_stats', 'recommend_contents', 'risk_result', ]),
  }
}
export interface GetTrackV2Request {
  'track_id': string;
  'media_type': string;
  'queue_type': string;
  'limited_free_param'?: common.LimitedFreeParam;
  'need_show_diversion_anchor'?: string;
  'extra_params'?: string;
  'scene'?: track.TrackV2Scene;
  'enable_refresh_api'?: boolean;
  'scene_name'?: string;
  /** 端标识；`web` 是 h5 那批接口（`/luna/h5/*`）的放行开关，缺省走 pc 的原生签名口径 */
  'device_platform'?: string;
}
export function GetTrackV2RequestToRequestData(data: GetTrackV2Request): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['track_id', 'media_type', 'queue_type', 'need_show_diversion_anchor', 'scene', 'enable_refresh_api', 'device_platform', ]),
    body: fieldsAssign(data, ['track_id', 'media_type', 'queue_type', 'limited_free_param', 'need_show_diversion_anchor', 'extra_params', 'scene', 'enable_refresh_api', 'scene_name', 'device_platform', ]),
  }
}
export interface GetTrackV2Response {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'lyric'?: track.TrackLyrics;
  'track'?: track.Track;
  'track_player'?: media.PlayerInfo;
  'risk_result': number;
  'expire_at': number;
  'track_wrapper'?: track.TrackWrapper;
  'my_artist_stats'?: Record<string, artist.MyArtistStats>;
}
export function GetTrackV2ResponseToRequestData(data: GetTrackV2Response): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'lyric', 'track', 'track_player', 'risk_result', 'expire_at', 'track_wrapper', 'my_artist_stats', ]),
  }
}
export interface MCheckTrackRequest {
  'track_ids'?: string[];
  'scene'?: number;
}
export function MCheckTrackRequestToRequestData(data: MCheckTrackRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['track_ids', 'scene', ]),
  }
}
export interface MCheckTrackResponse {
  'status_code': number;
  'status_info'?: general.StatusInfo;
  'track_status'?: TrackStatus[];
}
export function MCheckTrackResponseToRequestData(data: MCheckTrackResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'track_status', ]),
  }
}
export interface RecommendReqInfo {
  'recommend_content_source'?: string;
  'featured_comment_id'?: string;
  'community_card_show_type'?: card.CommunityCardShowType;
}
export function RecommendReqInfoToRequestData(data: RecommendReqInfo): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['recommend_content_source', 'featured_comment_id', 'community_card_show_type', ]),
    body: fieldsAssign(data, ['recommend_content_source', 'featured_comment_id', 'community_card_show_type', ]),
  }
}
export interface TrackStatus {
  'track_id': string;
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
export function TrackStatusToRequestData(data: TrackStatus): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['track_id', 'status', 'label_info', 'risk_result', 'turn_off_play_after_preview', 'digital_track_info', 'limited_free_info', 'download_status', 'share_status', 'sharable_platforms', ]),
  }
}
export type TrackInclude = string
