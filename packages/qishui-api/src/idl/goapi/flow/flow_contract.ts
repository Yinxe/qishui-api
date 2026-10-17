// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'
import * as album from '../entity/album.js'
import * as feed from '../entity/feed.js'
import * as general from '../contract/general.js'
import * as media from '../entity/media.js'
import * as media_common from '../entity/media_common.js'
import * as playlist from '../entity/playlist.js'
import * as search from '../entity/search.js'
import * as track from '../entity/track.js'

export interface CollectFlowTracksRequest {
  'track_ids'?: number[];
}
export function CollectFlowTracksRequestToRequestData(data: CollectFlowTracksRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['track_ids', ]),
  }
}
export interface CollectFlowTracksResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'track_ids'?: number[];
}
export function CollectFlowTracksResponseToRequestData(data: CollectFlowTracksResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'track_ids', ]),
  }
}
export interface DeleteCollectedFlowTracksRequest {
  'track_ids'?: number[];
}
export function DeleteCollectedFlowTracksRequestToRequestData(data: DeleteCollectedFlowTracksRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['track_ids', ]),
  }
}
export interface DeleteCollectedFlowTracksResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'deleted_tracks'?: number[];
}
export function DeleteCollectedFlowTracksResponseToRequestData(data: DeleteCollectedFlowTracksResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'deleted_tracks', ]),
  }
}
export interface FilterInfo {
  'track_ids'?: number[];
  'artist_ids'?: number[];
  'album_ids'?: number[];
  'languages'?: string[];
}
export function FilterInfoToRequestData(data: FilterInfo): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['track_ids', 'artist_ids', 'album_ids', 'languages', ]),
  }
}
export interface FlowGetAlbumDetailRequest {
  'album_id': string;
  'ignore_tracks': boolean;
}
export function FlowGetAlbumDetailRequestToRequestData(data: FlowGetAlbumDetailRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['album_id', 'ignore_tracks', ]),
    body: fieldsAssign(data, []),
  }
}
export interface FlowGetAlbumDetailResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'album_info'?: album.Album;
  'tracks'?: track.Track[];
}
export function FlowGetAlbumDetailResponseToRequestData(data: FlowGetAlbumDetailResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'album_info', 'tracks', ]),
  }
}
export interface FlowGetArtistMusicRequest {
  'artist_id': number;
  'sort_type': number;
}
export function FlowGetArtistMusicRequestToRequestData(data: FlowGetArtistMusicRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['artist_id', 'sort_type', ]),
  }
}
export interface FlowGetArtistMusicResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'albums'?: album.Album[];
  'tracks'?: track.Track[];
}
export function FlowGetArtistMusicResponseToRequestData(data: FlowGetArtistMusicResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'albums', 'tracks', ]),
  }
}
export interface FlowGetChartDetailRequest {
  'chart_id': number;
}
export function FlowGetChartDetailRequestToRequestData(data: FlowGetChartDetailRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['chart_id', ]),
  }
}
export interface FlowGetChartDetailResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'Period': string;
  'tracks'?: track.Track[];
  'release_time'?: number;
  'title'?: string;
}
export function FlowGetChartDetailResponseToRequestData(data: FlowGetChartDetailResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'tracks', 'release_time', 'title', ]),
  }
}
export interface FlowGetPlaylistDetailRequest {
  'playlist_id': string;
  'cursor': string;
  'count': number;
  'user_id'?: string;
  'type'?: number;
  'only_need_media'?: boolean;
  'only_need_media_id'?: boolean;
  'sec_uid'?: string;
  'feed_playlist_extra'?: feed.RecExtraGetPlaylistDetail;
}
export function FlowGetPlaylistDetailRequestToRequestData(data: FlowGetPlaylistDetailRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['playlist_id', 'cursor', 'count', 'user_id', 'type', 'only_need_media', 'only_need_media_id', 'sec_uid', 'feed_playlist_extra', ]),
    body: fieldsAssign(data, ['playlist_id', 'cursor', 'count', 'user_id', 'type', 'only_need_media', 'only_need_media_id', 'sec_uid', 'feed_playlist_extra', ]),
  }
}
export interface FlowGetPlaylistDetailResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'has_more'?: boolean;
  'next_cursor'?: string;
  'playlist'?: playlist.Playlist;
  'tracks'?: track.Track[];
  'media_resources'?: media_common.MediaResource[];
}
export function FlowGetPlaylistDetailResponseToRequestData(data: FlowGetPlaylistDetailResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'has_more', 'next_cursor', 'playlist', 'tracks', 'media_resources', ]),
  }
}
export interface FlowGetRelatedMediaRequest {
  'media_list'?: media.Media[];
  'artist_ids'?: string[];
  'scene_name'?: string;
  'played_media'?: media.MediaPlayed[];
  'req_count'?: number;
  'first_req_time'?: number;
}
export function FlowGetRelatedMediaRequestToRequestData(data: FlowGetRelatedMediaRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['media_list', 'artist_ids', 'scene_name', ]),
    body: fieldsAssign(data, ['media_list', 'artist_ids', 'scene_name', 'played_media', 'req_count', 'first_req_time', ]),
  }
}
export interface FlowGetTrackListDetailRequest {
  'track_ids'?: string[];
  'media_type': string;
  'scene'?: number;
}
export function FlowGetTrackListDetailRequestToRequestData(data: FlowGetTrackListDetailRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['track_ids', 'media_type', 'scene', ]),
    body: fieldsAssign(data, ['track_ids', 'media_type', 'scene', ]),
  }
}
export interface FlowGetTrackListDetailResponse {
  'items'?: TrackPack[];
}
export function FlowGetTrackListDetailResponseToRequestData(data: FlowGetTrackListDetailResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['items', ]),
  }
}
export interface FlowPreference {
  'user_query': string;
  'mcc_intention': string;
  'scene_id': number;
  'related_info'?: RelatedInfo;
  'search_result'?: SearchResult;
  'req_mode': string;
  'only_want'?: FilterInfo;
  'not_want'?: FilterInfo;
  'mcc_mode': number;
}
export function FlowPreferenceToRequestData(data: FlowPreference): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['user_query', 'mcc_intention', 'scene_id', 'related_info', 'search_result', 'req_mode', 'only_want', 'not_want', 'mcc_mode', ]),
  }
}
export interface FlowRecommendNotPackResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'has_more'?: boolean;
  'items'?: TrackItem[];
}
export function FlowRecommendNotPackResponseToRequestData(data: FlowRecommendNotPackResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'has_more', 'items', ]),
  }
}
export interface FlowRecommendRequest {
  'channel': number;
  'played_media'?: media.MediaPlayed[];
  'count': number;
  'flow_preference'?: FlowPreference;
}
export function FlowRecommendRequestToRequestData(data: FlowRecommendRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['channel', 'played_media', 'count', 'flow_preference', ]),
  }
}
export interface FlowRecommendResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'has_more'?: boolean;
  'items'?: feed.FeedItem[];
}
export function FlowRecommendResponseToRequestData(data: FlowRecommendResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'has_more', 'items', ]),
  }
}
export interface FlowSearchRequest {
  'q': string;
  'cursor': string;
  'search_id': string;
  'search_type': search.SearchType;
  'search_method': string;
  'debug_params': string;
  'from_search_id': string;
  'search_scene': string;
  'ab_param'?: string;
  'count': number;
}
export function FlowSearchRequestToRequestData(data: FlowSearchRequest): IRequestData {
  return {
    params: fieldsAssign(data, ['search_type', ]),
    query: fieldsAssign(data, ['q', 'cursor', 'search_id', 'search_method', 'debug_params', 'from_search_id', 'search_scene', ]),
    body: fieldsAssign(data, ['q', 'cursor', 'search_id', 'search_method', 'debug_params', 'from_search_id', 'search_scene', 'ab_param', 'count', ]),
  }
}
export interface RelatedInfo {
  'related_artists'?: number[];
  'related_tracks'?: number[];
}
export function RelatedInfoToRequestData(data: RelatedInfo): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['related_artists', 'related_tracks', ]),
  }
}
export interface SearchResult {
  'track_ids'?: number[];
  'album_ids'?: number[];
}
export function SearchResultToRequestData(data: SearchResult): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['track_ids', 'album_ids', ]),
  }
}
export interface TrackItem {
  'id': number;
  'score': number;
}
export function TrackItemToRequestData(data: TrackItem): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['id', 'score', ]),
  }
}
export interface TrackPack {
  'lyric'?: track.TrackLyrics;
  'track'?: track.Track;
  'track_player'?: media.PlayerInfo;
  'risk_result': number;
  'expire_at': number;
  'track_wrapper'?: track.TrackWrapper;
}
export function TrackPackToRequestData(data: TrackPack): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['lyric', 'track', 'track_player', 'risk_result', 'expire_at', 'track_wrapper', ]),
  }
}
