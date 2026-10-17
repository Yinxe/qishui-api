// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'
import * as boost from '../entity/boost.js'
import * as common from '../entity/common.js'
import * as diversion from '../entity/diversion.js'
import * as feed from '../entity/feed.js'
import * as general from './general.js'
import * as media from '../entity/media.js'
import * as playlist from '../entity/playlist.js'
import * as tag from '../entity/tag.js'
import * as track from '../entity/track.js'

export const FeedModeGuidanceColdStart: string = 'cold_start'
export const FeedModeGuidanceDislike: string = 'dislike'
export const FeedModeGuidanceSkip: string = 'skip'
export const FeedModeMix: string = 'mix'
export const FeedModeTrack: string = 'track'
export const FeedPlaylistTypeLiked: string = 'liked'
export const IncludeCategory: string = 'playlist_square_include_category'
export const PlayModeForcedShuffle: string = 'forced_shuffle'
export const PlayModePlayOnDemand: string = 'play_on_demand'
export const PreferenceModeFamiliar: string = 'familiar'
export const PreferenceModeFresh: string = 'fresh'
export interface BoostArtistsRequest {
  'req_no'?: number;
  'new_showed_artists'?: number[];
  'all_selected_artists'?: number[];
  'source_artists'?: number[];
  'selected_genres'?: number[];
  'selected_langs'?: string[];
}
export function BoostArtistsRequestToRequestData(data: BoostArtistsRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['req_no', 'new_showed_artists', 'all_selected_artists', 'source_artists', 'selected_genres', 'selected_langs', ]),
  }
}
export interface BoostArtistsResponse {
  'status_code': number;
  'status_info'?: general.StatusInfo;
  'artists'?: boost.BoostArtist[];
}
export function BoostArtistsResponseToRequestData(data: BoostArtistsResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'artists', ]),
  }
}
export interface FeedListenVideoRequest {
  'category_id'?: number;
  'played_tracks'?: track.TrackPlayed[];
  'played_media'?: media.MediaPlayed[];
  'selected_boost'?: boost.SelectedBoost;
  'feed_extra'?: feed.RecExtraFeedListenVideo;
}
export function FeedListenVideoRequestToRequestData(data: FeedListenVideoRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['category_id', 'played_tracks', 'played_media', 'selected_boost', 'feed_extra', ]),
  }
}
export interface FeedListenVideoResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'has_more'?: boolean;
  'items'?: feed.FeedItem[];
}
export function FeedListenVideoResponseToRequestData(data: FeedListenVideoResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'has_more', 'items', ]),
  }
}
export interface FeedListenVideoTabRequest {
  'selected_boost'?: boost.SelectedBoost;
  'played_media'?: media.MediaPlayed[];
  'count'?: number;
  'feed_extra'?: feed.FeedExtra;
  'category_id'?: number;
}
export function FeedListenVideoTabRequestToRequestData(data: FeedListenVideoTabRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['selected_boost', 'played_media', 'count', 'feed_extra', 'category_id', ]),
  }
}
export interface FeedListenVideoTabResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'has_more': boolean;
  'items'?: feed.FeedItem[];
  'style'?: TabStyle;
  'predict_info'?: feed.PredictInfo;
}
export function FeedListenVideoTabResponseToRequestData(data: FeedListenVideoTabResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'has_more', 'items', 'style', 'predict_info', ]),
  }
}
export interface FeedLiveTabRequest {
  'enter_from_merge'?: string;
  'enter_method'?: string;
  'req_from'?: string;
  'client_ab_param'?: string;
}
export function FeedLiveTabRequestToRequestData(data: FeedLiveTabRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['enter_from_merge', 'enter_method', 'req_from', 'client_ab_param', ]),
  }
}
export interface FeedLiveTabResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'has_more'?: boolean;
  'items'?: feed.FeedItem[];
}
export function FeedLiveTabResponseToRequestData(data: FeedLiveTabResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'has_more', 'items', ]),
  }
}
export interface FeedModeGuidanceRequest {
  'scene'?: string;
  'disliked_media'?: media.Media[];
  'device_profile'?: feed.DeviceProfile;
  'feed_extra'?: feed.RecExtraFeedModeGuidance;
}
export function FeedModeGuidanceRequestToRequestData(data: FeedModeGuidanceRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['scene', 'disliked_media', 'device_profile', 'feed_extra', ]),
  }
}
export interface FeedModeGuidanceResponse {
  'status_code': number;
  'status_info'?: general.StatusInfo;
  'feed_mode_guidance'?: feed.FeedModeGuidance;
}
export function FeedModeGuidanceResponseToRequestData(data: FeedModeGuidanceResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'feed_mode_guidance', ]),
  }
}
export interface FeedModeRequest {
  'ab_param'?: string;
  'device_profile'?: feed.DeviceProfile;
  'feed_extra'?: feed.RecExtraFeedMode;
}
export function FeedModeRequestToRequestData(data: FeedModeRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['ab_param', 'device_profile', 'feed_extra', ]),
  }
}
export interface FeedModeResponse {
  'status_code': number;
  'status_info'?: general.StatusInfo;
  'feed_mode_block'?: feed.FeedModeBlock[];
  'feed_mode_bar'?: feed.FeedModeBar;
}
export function FeedModeResponseToRequestData(data: FeedModeResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'feed_mode_block', 'feed_mode_bar', ]),
  }
}
export interface FeedPlaylistMediaRequest {
  'type': FeedPlaylistType;
  'count': number;
  'server_session_id': string;
  'feed_session_id': number;
  'played_media'?: media.MediaPlayed[];
  'click_media'?: media.Media;
  'feed_extra'?: feed.RecExtraFeedPlaylistMedia;
  'player_info_param'?: feed.FeedPlayerInfoParam;
  'full_media'?: boolean;
}
export function FeedPlaylistMediaRequestToRequestData(data: FeedPlaylistMediaRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['type', 'count', 'server_session_id', 'feed_session_id', 'played_media', 'click_media', 'feed_extra', 'player_info_param', 'full_media', ]),
  }
}
export interface FeedPlaylistMediaResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'has_more'?: boolean;
  'items'?: feed.FeedItem[];
  'predict_info'?: feed.PredictInfo;
  'server_session_id': string;
  'feed_session_id': number;
}
export function FeedPlaylistMediaResponseToRequestData(data: FeedPlaylistMediaResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'has_more', 'items', 'predict_info', 'server_session_id', 'feed_session_id', ]),
  }
}
export interface FeedPlaylistSquareRequest {
  'includes'?: string[];
  'category_id': number;
  'feed_playlist_extra'?: feed.RecExtraFeedPlaylistSquare;
}
export function FeedPlaylistSquareRequestToRequestData(data: FeedPlaylistSquareRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['includes', 'category_id', 'feed_playlist_extra', ]),
  }
}
export interface FeedPlaylistSquareResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'has_more'?: boolean;
  'items'?: feed.FeedItem[];
  'categories'?: tag.Tag[];
}
export function FeedPlaylistSquareResponseToRequestData(data: FeedPlaylistSquareResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'has_more', 'items', 'categories', ]),
  }
}
export interface FeedRadioTracksRequest {
  'radio_id': string;
  'played_tracks'?: track.TrackPlayed[];
  'played_media'?: media.MediaPlayed[];
  'flow_type'?: number;
  'cursor'?: string;
  'trigger_info'?: string;
  'feed_radio_media_extra'?: feed.FeedRadioMediaExtra;
  'passthrough'?: string;
  'limited_free_scene'?: media.LimitedFreeScene;
  'player_info_param'?: feed.FeedPlayerInfoParam;
  'full_media'?: boolean;
}
export function FeedRadioTracksRequestToRequestData(data: FeedRadioTracksRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['radio_id', 'played_tracks', 'played_media', 'flow_type', 'cursor', 'trigger_info', 'feed_radio_media_extra', 'passthrough', 'limited_free_scene', 'player_info_param', 'full_media', ]),
  }
}
export interface FeedRadioTracksResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'has_more'?: boolean;
  'next_cursor'?: string;
  'items'?: feed.FeedItem[];
  'passthrough'?: string;
}
export function FeedRadioTracksResponseToRequestData(data: FeedRadioTracksResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'has_more', 'next_cursor', 'items', 'passthrough', ]),
  }
}
export interface FeedResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'has_more'?: boolean;
  'items'?: feed.FeedItem[];
  'predict_info'?: feed.PredictInfo;
  'extra'?: feed.FeedResponseExtra;
}
export function FeedResponseToRequestData(data: FeedResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'has_more', 'items', 'predict_info', 'extra', ]),
  }
}
export interface FeedSongTabRequest {
  'played_tracks'?: track.TrackPlayed[];
  'selected_boost'?: boost.SelectedBoost;
  'is_first_request'?: boolean;
  'feed_mode'?: string;
  'played_media'?: media.MediaPlayed[];
  'with_client_cache'?: boolean;
  'preference_mode'?: string;
  'total_request_count'?: number;
  'preference_mode_request_count'?: number;
  'is_did_first_request'?: boolean;
  'feed_preference'?: feed.FeedPreference;
  'interesting_search'?: InterestingSearch;
  'feed_type'?: number;
  'feed_counts'?: feed.FeedCounts;
  'did_first_use_time'?: number;
  'feed_extra'?: feed.FeedExtra;
  'count'?: number;
  'diversion_extra'?: diversion.DiversionExtra;
  'device_profile'?: feed.DeviceProfile;
  'limited_free_scene'?: media.LimitedFreeScene;
  'player_info_param'?: feed.FeedPlayerInfoParam;
  'full_media'?: boolean;
}
export function FeedSongTabRequestToRequestData(data: FeedSongTabRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['played_tracks', 'selected_boost', 'is_first_request', 'feed_mode', 'played_media', 'with_client_cache', 'preference_mode', 'total_request_count', 'preference_mode_request_count', 'is_did_first_request', 'feed_preference', 'interesting_search', 'feed_type', 'feed_counts', 'did_first_use_time', 'feed_extra', 'count', 'diversion_extra', 'device_profile', 'limited_free_scene', 'player_info_param', 'full_media', ]),
  }
}
export interface FeedVideoPlaylistRequest {
  'count'?: number;
  'feed_extra'?: feed.FeedVideoPlaylistExtra;
}
export function FeedVideoPlaylistRequestToRequestData(data: FeedVideoPlaylistRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['count', 'feed_extra', ]),
  }
}
export interface FeedVideoPlaylistResponse {
  'status_code': number;
  'status_info'?: general.StatusInfo;
  'videos'?: feed.FeedItem[];
}
export function FeedVideoPlaylistResponseToRequestData(data: FeedVideoPlaylistResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'videos', ]),
  }
}
export interface FeedVideoRequest {
  'selected_boost'?: boost.SelectedBoost;
  'played_media'?: media.MediaPlayed[];
  'feed_extra'?: feed.FeedVideoExtra;
  'count': number;
  'diversion_extra'?: diversion.DiversionExtra;
}
export function FeedVideoRequestToRequestData(data: FeedVideoRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['selected_boost', 'played_media', 'feed_extra', 'count', 'diversion_extra', ]),
  }
}
export interface FeedVideoTabRequest {
  'selected_boost'?: boost.SelectedBoost;
  'played_media'?: media.MediaPlayed[];
  'feed_extra'?: feed.FeedExtra;
  'count'?: number;
  'diversion_extra'?: diversion.DiversionExtra;
  'device_profile'?: feed.DeviceProfile;
  'feed_video_type'?: number;
}
export function FeedVideoTabRequestToRequestData(data: FeedVideoTabRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['selected_boost', 'played_media', 'feed_extra', 'count', 'diversion_extra', 'device_profile', 'feed_video_type', ]),
  }
}
export interface GetRelatedMediaRequest {
  'media_list'?: media.Media[];
  'artist_ids'?: string[];
  'scene_name'?: string;
  'played_media'?: media.MediaPlayed[];
  'req_count'?: number;
  'first_req_time'?: number;
  'feed_related_media_extra'?: feed.FeedRelatedMediaExtra;
  'search_query'?: string;
  'search_related_info'?: string;
  'category_id'?: number;
  'limited_free_scene'?: media.LimitedFreeScene;
  'media_type'?: feed.FeedMediaType;
  'player_info_param'?: feed.FeedPlayerInfoParam;
  'full_media'?: boolean;
}
export function GetRelatedMediaRequestToRequestData(data: GetRelatedMediaRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['media_list', 'artist_ids', 'scene_name', ]),
    body: fieldsAssign(data, ['media_list', 'artist_ids', 'scene_name', 'played_media', 'req_count', 'first_req_time', 'feed_related_media_extra', 'search_query', 'search_related_info', 'category_id', 'limited_free_scene', 'media_type', 'player_info_param', 'full_media', ]),
  }
}
export interface GetRelatedTracksRequest {
  'track_ids'?: string[];
  'artist_ids'?: string[];
  'scene_name'?: string;
  'played_tracks'?: track.TrackPlayed[];
  'played_media'?: media.MediaPlayed[];
  'feed_related_media_extra'?: feed.FeedRelatedMediaExtra;
}
export function GetRelatedTracksRequestToRequestData(data: GetRelatedTracksRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['track_ids', 'artist_ids', 'scene_name', 'played_tracks', ]),
    body: fieldsAssign(data, ['track_ids', 'artist_ids', 'scene_name', 'played_tracks', 'played_media', 'feed_related_media_extra', ]),
  }
}
export interface InterestingSearch {
  'media'?: media.Media;
  'artist_ids'?: number[];
}
export function InterestingSearchToRequestData(data: InterestingSearch): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['media', 'artist_ids', ]),
  }
}
export interface ReportFeedInfoRequest {
  'info_type': string;
  'content': string;
}
export function ReportFeedInfoRequestToRequestData(data: ReportFeedInfoRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['info_type', 'content', ]),
  }
}
export interface ReportFeedInfoResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
}
export function ReportFeedInfoResponseToRequestData(data: ReportFeedInfoResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', ]),
  }
}
export interface TLBContent {
  'dim': string;
  'static_content': string;
  'encode_type': string;
}
export function TLBContentToRequestData(data: TLBContent): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['dim', 'static_content', 'encode_type', ]),
  }
}
export interface TLBFeedFallbackData {
  'total_count': number;
  'dim_count': number;
  'psm': string;
  'content_list'?: TLBContent[];
}
export function TLBFeedFallbackDataToRequestData(data: TLBFeedFallbackData): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['total_count', 'dim_count', 'psm', 'content_list', ]),
  }
}
export interface TLBFeedFallbackRequest {
}
export function TLBFeedFallbackRequestToRequestData(data: TLBFeedFallbackRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, []),
  }
}
export interface TLBFeedFallbackResponse {
  'msg': string;
  'code': number;
  'data'?: TLBFeedFallbackData;
}
export function TLBFeedFallbackResponseToRequestData(data: TLBFeedFallbackResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['msg', 'code', 'data', ]),
  }
}
export interface TabStyle {
  'background_color'?: common.Colour;
}
export function TabStyleToRequestData(data: TabStyle): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['background_color', ]),
  }
}
export type FeedMode = string
export type FeedPlaylistSquareInclude = string
export type FeedPlaylistType = string
