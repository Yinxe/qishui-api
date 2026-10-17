// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'
import * as boost from '../entity/boost.js'
import * as common from '../entity/common.js'
import * as feed from '../entity/feed.js'
import * as general from './general.js'
import * as media from '../entity/media.js'
import * as media_common from '../entity/media_common.js'
import * as playlist from '../entity/playlist.js'
import * as track from '../entity/track.js'

export const SensitiveWordCheckTypeDescription: string = 'desc'
export const SensitiveWordCheckTypeName: string = 'name'
export enum PlaylistDetailScene {
  Default = 0,
  MiniLunaMeTab = 1,
  FriendLikePopup = 2,
  AnchorDiversion = 3,
}
export interface CreatePlaylistRequest {
  'name': string;
  'is_private'?: boolean;
  'track_ids'?: string[];
  'media'?: media.Media[];
}
export function CreatePlaylistRequestToRequestData(data: CreatePlaylistRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['name', 'is_private', 'track_ids', 'media', ]),
  }
}
export interface CreatePlaylistResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'playlist'?: playlist.Playlist;
}
export function CreatePlaylistResponseToRequestData(data: CreatePlaylistResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'playlist', ]),
  }
}
export interface DeletePlaylistTrackRequest {
  'playlist_id': string;
  'delete_track_ids'?: string[];
}
export function DeletePlaylistTrackRequestToRequestData(data: DeletePlaylistTrackRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['playlist_id', 'delete_track_ids', ]),
  }
}
export interface DeletePlaylistTrackResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'delete_track_ids'?: string[];
  'playlist_id'?: string;
  'url_cover'?: common.URLInfo;
  'playlist'?: playlist.Playlist;
}
export function DeletePlaylistTrackResponseToRequestData(data: DeletePlaylistTrackResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'delete_track_ids', 'playlist_id', 'url_cover', 'playlist', ]),
  }
}
export interface DeletePlaylistsRequest {
  'playlist_ids'?: string[];
}
export function DeletePlaylistsRequestToRequestData(data: DeletePlaylistsRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['playlist_ids', ]),
  }
}
export interface DeletePlaylistsResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'deleted_playlists'?: string[];
}
export function DeletePlaylistsResponseToRequestData(data: DeletePlaylistsResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'deleted_playlists', ]),
  }
}
export interface GetMeTabAutoplayRequest {
}
export function GetMeTabAutoplayRequestToRequestData(data: GetMeTabAutoplayRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, []),
  }
}
export interface GetMeTabAutoplayResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'has_more'?: boolean;
  'next_cursor'?: string;
  'playlist'?: playlist.Playlist;
  'media_resources'?: media_common.MediaResource[];
}
export function GetMeTabAutoplayResponseToRequestData(data: GetMeTabAutoplayResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'has_more', 'next_cursor', 'playlist', 'media_resources', ]),
  }
}
export interface GetPlaylistDetailRequest {
  'playlist_id': string;
  'cursor': string;
  'count': number;
  'user_id'?: string;
  'type'?: number;
  'only_need_media'?: boolean;
  'only_need_media_id'?: boolean;
  'sec_uid'?: string;
  'feed_playlist_extra'?: feed.RecExtraGetPlaylistDetail;
  'feed_playlist_trigger'?: playlist.FeedPlaylistTrigger;
  'scene'?: PlaylistDetailScene;
  'media'?: media.Media[];
  'sort_type'?: playlist.PlaylistSortType;
  'session_id': string;
  'reverse': boolean;
  'limited_free_scene'?: media.LimitedFreeScene;
  'ab_param': string;
}
export function GetPlaylistDetailRequestToRequestData(data: GetPlaylistDetailRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['playlist_id', 'cursor', 'count', 'user_id', 'type', 'only_need_media', 'only_need_media_id', 'sec_uid', 'feed_playlist_extra', 'scene', 'media', 'sort_type', 'session_id', 'reverse', 'ab_param', ]),
    body: fieldsAssign(data, ['playlist_id', 'cursor', 'count', 'user_id', 'type', 'only_need_media', 'only_need_media_id', 'sec_uid', 'feed_playlist_extra', 'feed_playlist_trigger', 'scene', 'media', 'sort_type', 'session_id', 'reverse', 'limited_free_scene', 'ab_param', ]),
  }
}
export interface GetPlaylistDetailResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'has_more'?: boolean;
  'next_cursor'?: string;
  'playlist'?: playlist.Playlist;
  'tracks'?: track.Track[];
  'media_resources'?: media_common.MediaResource[];
  'session_id': string;
}
export function GetPlaylistDetailResponseToRequestData(data: GetPlaylistDetailResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['session_id', ]),
    body: fieldsAssign(data, ['status_code', 'status_info', 'has_more', 'next_cursor', 'playlist', 'tracks', 'media_resources', 'session_id', ]),
  }
}
export interface GetPlaylistFeedMediaRequest {
  'playlist_id': string;
  'play_mode': playlist.PlayMode;
  'feed_session_id'?: number;
  'played_media'?: media.MediaPlayed[];
  'click_media'?: media.Media;
  'feed_extra'?: feed.RecExtraGetPlaylistFeedMedia;
}
export function GetPlaylistFeedMediaRequestToRequestData(data: GetPlaylistFeedMediaRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['playlist_id', 'play_mode', 'feed_session_id', 'played_media', 'click_media', 'feed_extra', ]),
  }
}
export interface GetPlaylistFeedMediaResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'has_more': boolean;
  'media_resources'?: media_common.MediaResource[];
  'playlist_id': string;
  'feed_session_id': string;
  'next_feed_session_id': string;
}
export function GetPlaylistFeedMediaResponseToRequestData(data: GetPlaylistFeedMediaResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'has_more', 'media_resources', 'playlist_id', 'feed_session_id', 'next_feed_session_id', ]),
  }
}
export interface GetPlaylistRelatedMediaRequest {
  'playlist_id': number;
  'playlist_type': number;
  'req_count'?: number;
  'first_req_time'?: number;
  'played_media'?: media.MediaPlayed[];
  'feed_extra'?: feed.PlaylistRelatedMediaFeedExtra;
  'limited_free_scene'?: media.LimitedFreeScene;
  'selected_boost'?: boost.SelectedBoost;
}
export function GetPlaylistRelatedMediaRequestToRequestData(data: GetPlaylistRelatedMediaRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['playlist_id', 'playlist_type', 'req_count', 'first_req_time', 'played_media', 'feed_extra', 'limited_free_scene', 'selected_boost', ]),
  }
}
export interface GetPlaylistRelatedMediaResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'items'?: feed.FeedItem[];
}
export function GetPlaylistRelatedMediaResponseToRequestData(data: GetPlaylistRelatedMediaResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'items', ]),
  }
}
export interface GetPlaylistsResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'next_cursor'?: string;
  'has_more'?: boolean;
  'playlists'?: playlist.Playlist[];
  'total_num'?: number;
}
export function GetPlaylistsResponseToRequestData(data: GetPlaylistsResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'next_cursor', 'has_more', 'playlists', 'total_num', ]),
  }
}
export interface GetRecommendPlaylistRequest {
}
export function GetRecommendPlaylistRequestToRequestData(data: GetRecommendPlaylistRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, []),
  }
}
export interface GetRecommendPlaylistResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'playlists'?: playlist.Playlist[];
}
export function GetRecommendPlaylistResponseToRequestData(data: GetRecommendPlaylistResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['playlists', ]),
    body: fieldsAssign(data, ['status_code', 'status_info', 'playlists', ]),
  }
}
export interface ImportPlaylistRequest {
  'url': string;
}
export function ImportPlaylistRequestToRequestData(data: ImportPlaylistRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['url', ]),
  }
}
export interface ImportPlaylistResponse {
  'status_code': number;
  'status_info'?: general.StatusInfo;
  'playlist_id': string;
}
export function ImportPlaylistResponseToRequestData(data: ImportPlaylistResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'playlist_id', ]),
  }
}
export interface MAppendPlaylistMediaRequest {
  'playlist_id': string;
  'media'?: media.Media[];
}
export function MAppendPlaylistMediaRequestToRequestData(data: MAppendPlaylistMediaRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['playlist_id', 'media', ]),
  }
}
export interface MAppendPlaylistMediaResponse {
  'status_code': number;
  'status_info'?: general.StatusInfo;
  'media'?: media.Media[];
  'playlist'?: playlist.Playlist;
}
export function MAppendPlaylistMediaResponseToRequestData(data: MAppendPlaylistMediaResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'media', 'playlist', ]),
  }
}
export interface MAppendPlaylistTracksRequest {
  'playlist_id': string;
  'track_ids'?: string[];
}
export function MAppendPlaylistTracksRequestToRequestData(data: MAppendPlaylistTracksRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['playlist_id', 'track_ids', ]),
  }
}
export interface MAppendPlaylistTracksResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'appended_tracks'?: string[];
  'playlist_id'?: string;
  'url_cover'?: common.URLInfo;
  'playlist'?: playlist.Playlist;
}
export function MAppendPlaylistTracksResponseToRequestData(data: MAppendPlaylistTracksResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'appended_tracks', 'playlist_id', 'url_cover', 'playlist', ]),
  }
}
export interface MDeletePlaylistMediaRequest {
  'playlist_id': string;
  'media'?: media.Media[];
}
export function MDeletePlaylistMediaRequestToRequestData(data: MDeletePlaylistMediaRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['playlist_id', 'media', ]),
  }
}
export interface MDeletePlaylistMediaResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'media'?: media.Media[];
  'playlist'?: playlist.Playlist;
}
export function MDeletePlaylistMediaResponseToRequestData(data: MDeletePlaylistMediaResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'media', 'playlist', ]),
  }
}
export interface MDeletePlaylistsRequest {
  'playlist_ids'?: string[];
}
export function MDeletePlaylistsRequestToRequestData(data: MDeletePlaylistsRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['playlist_ids', ]),
  }
}
export interface MDeletePlaylistsResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'deleted_playlists'?: string[];
}
export function MDeletePlaylistsResponseToRequestData(data: MDeletePlaylistsResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'deleted_playlists', ]),
  }
}
export interface MGetPlaylistImportTasksRequest {
  'task_ids'?: string[];
}
export function MGetPlaylistImportTasksRequestToRequestData(data: MGetPlaylistImportTasksRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['task_ids', ]),
  }
}
export interface MGetPlaylistImportTasksResponse {
  'status_code': number;
  'status_info'?: general.StatusInfo;
  'task_infos'?: Record<string, playlist.ImportTaskInfo>;
}
export function MGetPlaylistImportTasksResponseToRequestData(data: MGetPlaylistImportTasksResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'task_infos', ]),
  }
}
export interface PlaylistSearchRequest {
  'playlist_id': string;
  'query': string;
  'session_id': string;
  'sort_type'?: playlist.PlaylistSortType;
  'limited_free_scene'?: media.LimitedFreeScene;
}
export function PlaylistSearchRequestToRequestData(data: PlaylistSearchRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['query', 'session_id', 'sort_type', ]),
    body: fieldsAssign(data, ['playlist_id', 'query', 'session_id', 'sort_type', 'limited_free_scene', ]),
  }
}
export interface PlaylistSearchResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'media_resources'?: media_common.MediaResource[];
  'session_id': string;
}
export function PlaylistSearchResponseToRequestData(data: PlaylistSearchResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['session_id', ]),
    body: fieldsAssign(data, ['status_code', 'status_info', 'media_resources', 'session_id', ]),
  }
}
export interface SensitiveWordCheckRequest {
  'content': string;
  'type': SensitiveWordCheckType;
}
export function SensitiveWordCheckRequestToRequestData(data: SensitiveWordCheckRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['content', 'type', ]),
    body: fieldsAssign(data, []),
  }
}
export interface SensitiveWordCheckResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'is_passed'?: boolean;
}
export function SensitiveWordCheckResponseToRequestData(data: SensitiveWordCheckResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'is_passed', ]),
  }
}
export interface SortPlaylistMediaRequest {
  'playlist_id': string;
  'media'?: media.Media[];
}
export function SortPlaylistMediaRequestToRequestData(data: SortPlaylistMediaRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['playlist_id', 'media', ]),
  }
}
export interface SortPlaylistMediaResponse {
  'status_code': number;
  'status_info'?: general.StatusInfo;
  'media'?: media.Media[];
  'playlist'?: playlist.Playlist;
}
export function SortPlaylistMediaResponseToRequestData(data: SortPlaylistMediaResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'media', 'playlist', ]),
  }
}
export interface SortPlaylistTracksRequest {
  'playlist_id': string;
  'track_ids'?: string[];
}
export function SortPlaylistTracksRequestToRequestData(data: SortPlaylistTracksRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['playlist_id', 'track_ids', ]),
  }
}
export interface SortPlaylistTracksResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'sorted_tracks'?: string[];
  'playlist_id'?: string;
  'playlist'?: playlist.Playlist;
}
export function SortPlaylistTracksResponseToRequestData(data: SortPlaylistTracksResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'sorted_tracks', 'playlist_id', 'playlist', ]),
  }
}
export interface UpdatePlaylistInfoRequest {
  'playlist_id': string;
  'name'?: string;
  'description'?: string;
  'is_private'?: boolean;
  'cover_uri'?: string;
}
export function UpdatePlaylistInfoRequestToRequestData(data: UpdatePlaylistInfoRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['playlist_id', 'name', 'description', 'is_private', 'cover_uri', ]),
  }
}
export interface UpdatePlaylistInfoResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'playlist_id'?: string;
  'name'?: string;
  'description'?: string;
  'is_private'?: boolean;
  'cover_uri'?: string;
  'playlist'?: playlist.Playlist;
}
export function UpdatePlaylistInfoResponseToRequestData(data: UpdatePlaylistInfoResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'playlist_id', 'name', 'description', 'is_private', 'cover_uri', 'playlist', ]),
  }
}
export interface UpdatePlaylistSortTypeRequest {
  'playlist_id': string;
  'sort_type': playlist.PlaylistSortType;
}
export function UpdatePlaylistSortTypeRequestToRequestData(data: UpdatePlaylistSortTypeRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['playlist_id', 'sort_type', ]),
  }
}
export interface UpdatePlaylistSortTypeResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
}
export function UpdatePlaylistSortTypeResponseToRequestData(data: UpdatePlaylistSortTypeResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', ]),
  }
}
export type SensitiveWordCheckType = string
