// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'
import * as block from './block.js'
import * as common from './common.js'
import * as track from './track.js'
import * as video from './video.js'

export const CLIP_BOARD_COPY_LINK: string = 'link'
export const DOUYIN_DAILY: string = 'aweme_publish'
export const DOUYIN_FRIENDS: string = 'aweme'
export const DownloadStatusOK: number = 0
export const DownloadStatusUnavailable: number = 1
export const FragmentTypeMuteHead: string = 'mute_head'
export const FragmentTypeMuteTail: string = 'mute_tail'
export const InterceptTypeAds: string = 'ads'
export const InterceptTypeVip: string = 'vip'
export const MediaTypeAdsLiveRoom: string = 'ads_live_room'
export const MediaTypeAdsVideo: string = 'ads_video'
export const MediaTypeAudio: string = 'audio'
export const MediaTypeJayMV: string = 'jay_mv'
export const MediaTypeLiveRoom: string = 'live_room'
export const MediaTypeLunaPostVideo: string = 'luna_post_video'
export const MediaTypeMV: string = 'mv'
export const MediaTypePlaylist: string = 'playlist'
export const MediaTypeSlot: string = 'slot'
export const MediaTypeTrack: string = 'track'
export const MediaTypeUgcClip: string = 'ugc_clip'
export const MediaTypeUgcVideo: string = 'ugc_video'
export const PLUG: string = 'plug'
export const QQ_FRIENDS: string = 'qq'
export const QQ_QZONE: string = 'qq_zone'
export const ShareStatusOK: number = 0
export const ShareStatusUnavailable: number = 1
export const VideoModelType_Clip: number = 3
export const VideoModelType_Full: number = 1
export const VideoModelType_Preview: number = 2
export const WECHAT_FRIEND: string = 'wechat'
export const WECHAT_MOMENT: string = 'wechat_zone'
export const WEIBO_POST: string = 'weibo'
export enum LimitedFreeScene {
  Disabled = 0,
  NewUserWithoutLogin = 1,
  DiversionColdStart = 2,
}
export enum NodeType {
  FIRST_VOCAL = 1,
  CHORUS = 2,
  HIGHLIGHT = 3,
}
export enum WarnType {
  AI = 1,
}
export interface CheckMediaResult {
  'id': string;
  'type': string;
  'risk_result': number;
  'shark_expired_at'?: number;
  'has_update': boolean;
  'entity'?: MediaEntityV2;
}
export function CheckMediaResultToRequestData(data: CheckMediaResult): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['id', 'type', 'risk_result', 'shark_expired_at', 'has_update', 'entity', ]),
  }
}
export interface Fragment {
  'type': FragmentType;
  'start_time': number;
  'end_time': number;
}
export function FragmentToRequestData(data: Fragment): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['type', 'start_time', 'end_time', ]),
  }
}
export interface LimitedFreeInfo {
  'queue_types'?: string[];
  'limited_free'?: boolean;
  'expire_time': number;
  'sign': string;
  'sign_version': string;
  'limited_free_type': string;
  'config'?: Record<string, LimitedFreeInfoConfig>;
  'rewind_prev_intercept_type': string;
  'intercept_type': InterceptType;
  'limited_free_scene'?: LimitedFreeScene;
}
export function LimitedFreeInfoToRequestData(data: LimitedFreeInfo): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['queue_types', 'limited_free', 'expire_time', 'sign', 'sign_version', 'limited_free_type', 'config', 'rewind_prev_intercept_type', 'intercept_type', 'limited_free_scene', ]),
  }
}
export interface LimitedFreeInfoConfig {
  'upsell_info_id'?: string;
  'frequency_control_key'?: string;
  'downgrade_scene_id'?: string;
  'intercept_type': InterceptType;
}
export function LimitedFreeInfoConfigToRequestData(data: LimitedFreeInfoConfig): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['upsell_info_id', 'frequency_control_key', 'downgrade_scene_id', 'intercept_type', ]),
  }
}
export interface Media {
  'id': string;
  'type': string;
  'attr'?: MediaAttr;
}
export function MediaToRequestData(data: Media): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['id', 'type', 'attr', ]),
  }
}
export interface MediaAttr {
  'duration'?: number;
}
export function MediaAttrToRequestData(data: MediaAttr): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['duration', ]),
  }
}
export interface MediaEntityV2 {
  'track_wrapper'?: track.TrackWrapper;
  'video'?: video.Video;
}
export function MediaEntityV2ToRequestData(data: MediaEntityV2): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['track_wrapper', 'video', ]),
  }
}
export interface MediaInfoEntity {
  'type'?: MediaType;
  'entity'?: block.DisplayEntity;
}
export function MediaInfoEntityToRequestData(data: MediaInfoEntity): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['type', 'entity', ]),
  }
}
export interface MediaNode {
  'type'?: NodeType;
  'start': number;
  'duration': number;
  'priority'?: number;
  'opacity'?: number;
}
export function MediaNodeToRequestData(data: MediaNode): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['type', 'start', 'duration', 'priority', 'opacity', ]),
  }
}
export interface MediaPlayed {
  'played_mills'?: number;
  'media_id'?: string;
  'type': string;
  'duration'?: number;
  'sim_id_v3'?: number;
  'play_timestamp'?: number;
}
export function MediaPlayedToRequestData(data: MediaPlayed): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['played_mills', 'media_id', 'type', 'duration', 'sim_id_v3', 'play_timestamp', ]),
  }
}
export interface MediaResult {
  'id': string;
  'type': string;
  'entity'?: MediaEntityV2;
}
export function MediaResultToRequestData(data: MediaResult): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['id', 'type', 'entity', ]),
  }
}
export interface MediaSharkResult {
  'id': string;
  'type': string;
  'risk_result': number;
  'shark_expired_at'?: number;
}
export function MediaSharkResultToRequestData(data: MediaSharkResult): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['id', 'type', 'risk_result', 'shark_expired_at', ]),
  }
}
export interface MediaStats {
  'count_collected'?: number;
  'count_comment'?: number;
  'count_played'?: number;
  'count_shared'?: number;
  'collect_mocked'?: boolean;
  'count_marked'?: number;
}
export function MediaStatsToRequestData(data: MediaStats): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['count_collected', 'count_comment', 'count_played', 'count_shared', 'collect_mocked', 'count_marked', ]),
  }
}
export interface MyMediaState {
  'is_collected'?: boolean;
  'is_marked'?: boolean;
}
export function MyMediaStateToRequestData(data: MyMediaState): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['is_collected', 'is_marked', ]),
  }
}
export interface PlayerColors {
  'cover_gradient_effect_color'?: common.Colour[];
  'normal_lyric_color'?: common.Colour;
  'playing_lyric_color'?: common.Colour;
  'recommend_reason_background_color'?: common.Colour;
  'featured_comment_tag_color'?: common.Colour;
  'background_color'?: common.Colour;
  'playing_wave_color'?: common.Colour;
  'paused_wave_color'?: common.Colour;
  'comment_share_additional_color'?: common.Colour;
  'base_colors'?: common.Colour[];
  'non_interactive_anchor_background'?: common.Colour;
}
export function PlayerColorsToRequestData(data: PlayerColors): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['cover_gradient_effect_color', 'normal_lyric_color', 'playing_lyric_color', 'recommend_reason_background_color', 'featured_comment_tag_color', 'background_color', 'playing_wave_color', 'paused_wave_color', 'comment_share_additional_color', 'base_colors', 'non_interactive_anchor_background', ]),
  }
}
export interface PlayerInfo {
  'expire_at'?: number;
  'media_id': string;
  'url_player_info'?: string;
  'video_model'?: string;
  'id'?: number;
  'video_model_type'?: number;
  'audio_effects'?: Record<string, string>;
}
export function PlayerInfoToRequestData(data: PlayerInfo): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['expire_at', 'media_id', 'url_player_info', 'video_model', 'id', 'video_model_type', 'audio_effects', ]),
  }
}
export interface ReqMedia {
  'id': string;
  'type': string;
  'check_context'?: string;
  'track_param'?: ReqTrackParam;
  'video_param'?: ReqVideoParam;
}
export function ReqMediaToRequestData(data: ReqMedia): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['id', 'type', 'check_context', 'track_param', 'video_param', ]),
  }
}
export interface ReqTrackParam {
  'limited_free_param'?: common.LimitedFreeParam;
  'need_show_diversion_anchor'?: string;
  'scene'?: track.TrackV2Scene;
}
export function ReqTrackParamToRequestData(data: ReqTrackParam): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['need_show_diversion_anchor', 'scene', ]),
    body: fieldsAssign(data, ['limited_free_param', 'need_show_diversion_anchor', 'scene', ]),
  }
}
export interface ReqVideoParam {
  'enable_dash'?: boolean;
}
export function ReqVideoParamToRequestData(data: ReqVideoParam): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['enable_dash', ]),
    body: fieldsAssign(data, ['enable_dash', ]),
  }
}
export interface SecurityToken {
  'access_key_id': string;
  'secret_access_key': string;
  'session_token': string;
  'expired_time': string;
  'current_time': string;
  'space_name': string;
}
export function SecurityTokenToRequestData(data: SecurityToken): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['access_key_id', 'secret_access_key', 'session_token', 'expired_time', 'current_time', 'space_name', ]),
  }
}
export interface UploaderInfo {
  'token'?: string;
  'image_host': string;
  'service_id'?: string;
  'security_token'?: SecurityToken;
}
export function UploaderInfoToRequestData(data: UploaderInfo): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['token', 'image_host', 'service_id', 'security_token', ]),
  }
}
export interface VolumeInfo {
  'loudness'?: number;
  'peak'?: number;
}
export function VolumeInfoToRequestData(data: VolumeInfo): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['loudness', 'peak', ]),
  }
}
export interface WarnInfo {
  'type': WarnType;
  'sub_type': number;
  'title': string;
  'content': string;
  'icon_url'?: common.URLInfo;
}
export function WarnInfoToRequestData(data: WarnInfo): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['type', 'sub_type', 'title', 'content', 'icon_url', ]),
  }
}
export type DownloadStatus = number
export type FragmentType = string
export type InterceptType = string
export type MediaType = string
export type Platform = string
export type ShareStatus = number
export type VideoModelType = number
