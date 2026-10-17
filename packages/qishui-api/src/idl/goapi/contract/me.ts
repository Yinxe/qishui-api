// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'
import * as album from '../entity/album.js'
import * as artist from '../entity/artist.js'
import * as block from '../entity/block.js'
import * as boost from '../entity/boost.js'
import * as comment from '../entity/comment.js'
import * as common from '../entity/common.js'
import * as feed from '../entity/feed.js'
import * as general from './general.js'
import * as listen_duration from '../entity/listen_duration.js'
import * as me from '../entity/me.js'
import * as media from '../entity/media.js'
import * as media_common from '../entity/media_common.js'
import * as playlist from '../entity/playlist.js'
import * as tool_list from '../entity/tool_list.js'
import * as track from '../entity/track.js'
import * as user from '../entity/user.js'
import * as user_artist from '../entity/user_artist.js'
import * as video from '../entity/video.js'

export const IncludeToolList: string = 'tool_list'
export const RecentPlayedSceneListenVideoTab: string = 'listen_video_tab'
export const RecentPlayedSceneMeTab: string = 'me_tab'
export enum CollectActionType {
  Unknown = 0,
  ClickHeartFromPlayer = 1,
  DoubleClickFromPlayer = 2,
  ClickFromBackground = 3,
  Other = 4,
}
export enum MarkActionType {
  Mark = 1,
  Unmark = 2,
}
export interface AcceptFollowRequest {
  'user_id': string;
}
export function AcceptFollowRequestToRequestData(data: AcceptFollowRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['user_id', ]),
  }
}
export interface AcceptFollowResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
}
export function AcceptFollowResponseToRequestData(data: AcceptFollowResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', ]),
  }
}
export interface AppendLaterListenDisplayInfo {
  'snackbar_text': string;
  'snackbar_fallback_text': string;
  'popview_text': string;
  'popview_fallback_text': string;
}
export function AppendLaterListenDisplayInfoToRequestData(data: AppendLaterListenDisplayInfo): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['snackbar_text', 'snackbar_fallback_text', 'popview_text', 'popview_fallback_text', ]),
  }
}
export interface AppendLaterListenRequest {
  'media'?: media.Media[];
}
export function AppendLaterListenRequestToRequestData(data: AppendLaterListenRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['media', ]),
  }
}
export interface AppendLaterListenResponse {
  'status_code': number;
  'status_info'?: general.StatusInfo;
  'display_info'?: AppendLaterListenDisplayInfo;
}
export function AppendLaterListenResponseToRequestData(data: AppendLaterListenResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'display_info', ]),
  }
}
export interface AppendRecentPlayedTracksRequest {
  'track_ids'?: string[];
}
export function AppendRecentPlayedTracksRequestToRequestData(data: AppendRecentPlayedTracksRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['track_ids', ]),
  }
}
export interface AppendRecentlyPlayedMediaRequest {
  'media'?: media.Media[];
}
export function AppendRecentlyPlayedMediaRequestToRequestData(data: AppendRecentlyPlayedMediaRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['media', ]),
  }
}
export interface CancelAccountRequest {
}
export function CancelAccountRequestToRequestData(data: CancelAccountRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, []),
  }
}
export interface CancelAccountResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'msg'?: string;
}
export function CancelAccountResponseToRequestData(data: CancelAccountResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'msg', ]),
  }
}
export interface CancelBlockUserRequest {
  'to_user_id': string;
}
export function CancelBlockUserRequestToRequestData(data: CancelBlockUserRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['to_user_id', ]),
    body: fieldsAssign(data, []),
  }
}
export interface CancelBlockUserResponse {
  'status_code': number;
  'status_info'?: general.StatusInfo;
  'to_user_id': number;
  'block_status': user.BlockStatusType;
}
export function CancelBlockUserResponseToRequestData(data: CancelBlockUserResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'to_user_id', 'block_status', ]),
  }
}
export interface CancelBlockV2Request {
  'block_items'?: user.BlockItem[];
}
export function CancelBlockV2RequestToRequestData(data: CancelBlockV2Request): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['block_items', ]),
  }
}
export interface CancelBlockV2Response {
  'status_code': number;
  'status_info'?: general.StatusInfo;
  'block_results'?: user.BlockResult[];
}
export function CancelBlockV2ResponseToRequestData(data: CancelBlockV2Response): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'block_results', ]),
  }
}
export interface CollectAlbumRequest {
  'album_ids'?: string[];
}
export function CollectAlbumRequestToRequestData(data: CollectAlbumRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['album_ids', ]),
  }
}
export interface CollectAlbumResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'collected_albums'?: string[];
}
export function CollectAlbumResponseToRequestData(data: CollectAlbumResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'collected_albums', ]),
  }
}
export interface CollectArtistsRequest {
  'artist_ids'?: string[];
}
export function CollectArtistsRequestToRequestData(data: CollectArtistsRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['artist_ids', ]),
  }
}
export interface CollectArtistsResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'artist_ids'?: string[];
  'collect_artist_status'?: Record<string, user.FollowStatusType>;
}
export function CollectArtistsResponseToRequestData(data: CollectArtistsResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'artist_ids', 'collect_artist_status', ]),
  }
}
export interface CollectMediaListRequest {
  'media'?: media.Media[];
  'scene': string;
  'collect_action': CollectActionType;
}
export function CollectMediaListRequestToRequestData(data: CollectMediaListRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['media', 'scene', 'collect_action', ]),
  }
}
export interface CollectMediaListResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'collected_media'?: media.Media[];
  'playlist'?: playlist.Playlist;
  'playlists'?: playlist.Playlist[];
  'added_to_liked_playlist'?: boolean;
}
export function CollectMediaListResponseToRequestData(data: CollectMediaListResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'collected_media', 'playlist', 'playlists', 'added_to_liked_playlist', ]),
  }
}
export interface CollectPlaylistRequest {
  'playlist_ids'?: string[];
}
export function CollectPlaylistRequestToRequestData(data: CollectPlaylistRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['playlist_ids', ]),
  }
}
export interface CollectPlaylistResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'playlist_ids'?: string[];
}
export function CollectPlaylistResponseToRequestData(data: CollectPlaylistResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'playlist_ids', ]),
  }
}
export interface CollectTracksRequest {
  'track_ids'?: string[];
}
export function CollectTracksRequestToRequestData(data: CollectTracksRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['track_ids', ]),
  }
}
export interface CollectTracksResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'track_ids'?: string[];
  'playlist_id'?: string;
  'url_cover'?: common.URLInfo;
  'playlist'?: playlist.Playlist;
}
export function CollectTracksResponseToRequestData(data: CollectTracksResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'track_ids', 'playlist_id', 'url_cover', 'playlist', ]),
  }
}
export interface CommitBlocV2Request {
  'block_items'?: user.BlockItem[];
}
export function CommitBlocV2RequestToRequestData(data: CommitBlocV2Request): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['block_items', ]),
  }
}
export interface CommitBlocV2Response {
  'status_code': number;
  'status_info'?: general.StatusInfo;
  'block_results'?: user.BlockResult[];
}
export function CommitBlocV2ResponseToRequestData(data: CommitBlocV2Response): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'block_results', ]),
  }
}
export interface CommitBlockUserRequest {
  'to_user_id': number;
}
export function CommitBlockUserRequestToRequestData(data: CommitBlockUserRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['to_user_id', ]),
  }
}
export interface CommitBlockUserResponse {
  'status_code': number;
  'status_info'?: general.StatusInfo;
  'to_user_id': number;
  'block_status': user.BlockStatusType;
}
export function CommitBlockUserResponseToRequestData(data: CommitBlockUserResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'to_user_id', 'block_status', ]),
  }
}
export interface DeleteCollectedAlbumsRequest {
  'album_ids'?: string[];
}
export function DeleteCollectedAlbumsRequestToRequestData(data: DeleteCollectedAlbumsRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['album_ids', ]),
  }
}
export interface DeleteCollectedAlbumsResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'deleted_albums'?: string[];
}
export function DeleteCollectedAlbumsResponseToRequestData(data: DeleteCollectedAlbumsResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'deleted_albums', ]),
  }
}
export interface DeleteCollectedArtistsRequest {
  'artist_ids'?: string[];
}
export function DeleteCollectedArtistsRequestToRequestData(data: DeleteCollectedArtistsRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['artist_ids', ]),
  }
}
export interface DeleteCollectedArtistsResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'deleted_artists'?: string[];
  'deleted_artist_status'?: Record<string, user.FollowStatusType>;
}
export function DeleteCollectedArtistsResponseToRequestData(data: DeleteCollectedArtistsResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'deleted_artists', 'deleted_artist_status', ]),
  }
}
export interface DeleteCollectedMediaListRequest {
  'media'?: media.Media[];
}
export function DeleteCollectedMediaListRequestToRequestData(data: DeleteCollectedMediaListRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['media', ]),
  }
}
export interface DeleteCollectedMediaListResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'deleted_media'?: media.Media[];
  'playlist'?: playlist.Playlist;
}
export function DeleteCollectedMediaListResponseToRequestData(data: DeleteCollectedMediaListResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'deleted_media', 'playlist', ]),
  }
}
export interface DeleteCollectedPlaylistsRequest {
  'playlist_ids'?: string[];
}
export function DeleteCollectedPlaylistsRequestToRequestData(data: DeleteCollectedPlaylistsRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['playlist_ids', ]),
  }
}
export interface DeleteCollectedPlaylistsResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'deleted_playlists'?: string[];
}
export function DeleteCollectedPlaylistsResponseToRequestData(data: DeleteCollectedPlaylistsResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'deleted_playlists', ]),
  }
}
export interface DeleteCollectedTracksRequest {
  'track_ids'?: string[];
}
export function DeleteCollectedTracksRequestToRequestData(data: DeleteCollectedTracksRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['track_ids', ]),
  }
}
export interface DeleteCollectedTracksResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'deleted_tracks'?: string[];
  'playlist_id'?: string;
  'url_cover'?: common.URLInfo;
  'playlist'?: playlist.Playlist;
}
export function DeleteCollectedTracksResponseToRequestData(data: DeleteCollectedTracksResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'deleted_tracks', 'playlist_id', 'url_cover', 'playlist', ]),
  }
}
export interface DeleteRecentPlayedTracksRequest {
  'track_ids'?: string[];
}
export function DeleteRecentPlayedTracksRequestToRequestData(data: DeleteRecentPlayedTracksRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['track_ids', ]),
  }
}
export interface DeleteRecentPlayedTracksResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'deleted_track_ids'?: string[];
}
export function DeleteRecentPlayedTracksResponseToRequestData(data: DeleteRecentPlayedTracksResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'deleted_track_ids', ]),
  }
}
export interface DeleteRecentlyPlayedMediaRequest {
  'media'?: media.Media[];
}
export function DeleteRecentlyPlayedMediaRequestToRequestData(data: DeleteRecentlyPlayedMediaRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['media', ]),
  }
}
export interface DeleteRecentlyPlayedMediaResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'deleted_media'?: media.Media[];
}
export function DeleteRecentlyPlayedMediaResponseToRequestData(data: DeleteRecentlyPlayedMediaResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'deleted_media', ]),
  }
}
export interface DeviceBlockArtistRequest {
  'artist_id': number;
  'block_type': user.DeviceBlockType;
}
export function DeviceBlockArtistRequestToRequestData(data: DeviceBlockArtistRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['artist_id', 'block_type', ]),
  }
}
export interface DeviceBlockArtistResponse {
  'status_code': number;
  'status_info'?: general.StatusInfo;
  'artist_id': number;
  'block_status': user.BlockStatusType;
}
export function DeviceBlockArtistResponseToRequestData(data: DeviceBlockArtistResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'artist_id', 'block_status', ]),
  }
}
export interface DeviceBlockUserRequest {
  'to_user_id': number;
  'block_type': user.DeviceBlockType;
}
export function DeviceBlockUserRequestToRequestData(data: DeviceBlockUserRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['to_user_id', 'block_type', ]),
  }
}
export interface DeviceBlockUserResponse {
  'status_code': number;
  'status_info'?: general.StatusInfo;
  'to_user_id': number;
  'block_status': user.BlockStatusType;
}
export function DeviceBlockUserResponseToRequestData(data: DeviceBlockUserResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'to_user_id', 'block_status', ]),
  }
}
export interface ExtraParam {
  'enter_from'?: string;
  'launch_url'?: string;
  'channel_id'?: string;
}
export function ExtraParamToRequestData(data: ExtraParam): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['enter_from', 'launch_url', 'channel_id', ]),
  }
}
export interface FollowUserRequest {
  'user_id': string;
}
export function FollowUserRequestToRequestData(data: FollowUserRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['user_id', ]),
  }
}
export interface FollowUserResponse {
  'status_code': number;
  'status_info'?: general.StatusInfo;
  'follow_status': user.FollowStatusType;
  'user_id': number;
}
export function FollowUserResponseToRequestData(data: FollowUserResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'follow_status', 'user_id', ]),
  }
}
export interface GetArtistCollectionRequest {
  'cursor': string;
  'count': number;
}
export function GetArtistCollectionRequestToRequestData(data: GetArtistCollectionRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['cursor', 'count', ]),
    body: fieldsAssign(data, []),
  }
}
export interface GetArtistCollectionResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'artists'?: artist.Artist[];
  'total_num'?: number;
  'next_cursor'?: string;
  'has_more'?: boolean;
}
export function GetArtistCollectionResponseToRequestData(data: GetArtistCollectionResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'artists', 'total_num', 'next_cursor', 'has_more', ]),
  }
}
export interface GetBlockUserListRequest {
  'cursor': string;
  'count': number;
}
export function GetBlockUserListRequestToRequestData(data: GetBlockUserListRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['cursor', 'count', ]),
    body: fieldsAssign(data, []),
  }
}
export interface GetBlockUserListResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'next_cursor'?: string;
  'has_more'?: boolean;
  'users'?: user.UserBrief[];
  'user_artist_list'?: user_artist.UserArtistBrief[];
}
export function GetBlockUserListResponseToRequestData(data: GetBlockUserListResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'next_cursor', 'has_more', 'users', 'user_artist_list', ]),
  }
}
export interface GetFriendRankingsRequest {
  'version': string;
  'cursor': string;
  'count': number;
}
export function GetFriendRankingsRequestToRequestData(data: GetFriendRankingsRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['version', 'cursor', 'count', ]),
  }
}
export interface GetFriendRankingsResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'rankings'?: me.FriendRankings;
}
export function GetFriendRankingsResponseToRequestData(data: GetFriendRankingsResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'rankings', ]),
  }
}
export interface GetMyBriefInfoRequest {
}
export function GetMyBriefInfoRequestToRequestData(data: GetMyBriefInfoRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, []),
  }
}
export interface GetMyBriefInfoResponse {
  'status_code': number;
  'status_info'?: general.StatusInfo;
  'user_info'?: user.UserBrief;
  'tab_entries'?: user.TabEntry[];
  'user_artist_info'?: user_artist.UserArtistBrief;
}
export function GetMyBriefInfoResponseToRequestData(data: GetMyBriefInfoResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'user_info', 'tab_entries', 'user_artist_info', ]),
  }
}
export interface GetMyCollectionVideoListRequest {
  'cursor': string;
  'count': number;
}
export function GetMyCollectionVideoListRequestToRequestData(data: GetMyCollectionVideoListRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['cursor', 'count', ]),
  }
}
export interface GetMyCollectionVideoListResponse {
  'status_code': number;
  'status_info'?: general.StatusInfo;
  'videos'?: video.Video[];
  'has_more': boolean;
  'next_cursor': string;
}
export function GetMyCollectionVideoListResponseToRequestData(data: GetMyCollectionVideoListResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'videos', 'has_more', 'next_cursor', ]),
  }
}
export interface GetMyDigitalAlbumsRequest {
}
export function GetMyDigitalAlbumsRequestToRequestData(data: GetMyDigitalAlbumsRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, []),
  }
}
export interface GetMyDigitalAlbumsResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'albums'?: album.Album[];
}
export function GetMyDigitalAlbumsResponseToRequestData(data: GetMyDigitalAlbumsResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'albums', ]),
  }
}
export interface GetMyFavoriteVideoListRequest {
  'cursor': string;
  'count': number;
}
export function GetMyFavoriteVideoListRequestToRequestData(data: GetMyFavoriteVideoListRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['cursor', 'count', ]),
  }
}
export interface GetMyFavoriteVideoListResponse {
  'status_code': number;
  'status_info'?: general.StatusInfo;
  'videos'?: video.Video[];
  'has_more': boolean;
  'next_cursor': string;
}
export function GetMyFavoriteVideoListResponseToRequestData(data: GetMyFavoriteVideoListResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'videos', 'has_more', 'next_cursor', ]),
  }
}
export interface GetMyInfoRequest {
  'includes'?: Include[];
}
export function GetMyInfoRequestToRequestData(data: GetMyInfoRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['includes', ]),
  }
}
export interface GetMyInfoResponse {
  'status_code': number;
  'status_info'?: general.StatusInfo;
  'my_info'?: me.MyInfo;
  'my_stats'?: user.UserStats;
  'redeem_freevip_info'?: user.RedeemFreeVIPInfo;
  'tab_entries'?: user.TabEntry[];
  'free_vip_banner'?: user.FreeVIPBanner;
  'reward_ad_banner'?: user.RewardAdBanner;
  'me_tab_banners'?: user.MeTabBanners;
  'play_panel_info'?: user.PlayPanelInfo;
  'me_tab_tool_list'?: tool_list.MeTabToolList;
}
export function GetMyInfoResponseToRequestData(data: GetMyInfoResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'my_info', 'my_stats', 'redeem_freevip_info', 'tab_entries', 'free_vip_banner', 'reward_ad_banner', 'me_tab_banners', 'play_panel_info', 'me_tab_tool_list', ]),
  }
}
export interface GetMyListenStatsRequest {
  'ab_param': string;
  'recent_friend_rankings_version': string;
  'schema_extra'?: string;
}
export function GetMyListenStatsRequestToRequestData(data: GetMyListenStatsRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['ab_param', 'recent_friend_rankings_version', 'schema_extra', ]),
  }
}
export interface GetMyListenStatsResponse {
  'status_code': number;
  'status_info'?: general.StatusInfo;
  'friend_rankings'?: me.FriendRankings;
  'artist_rankings'?: me.ArtistRankings;
  'song_rankings'?: me.SongRankings;
  'reminder_list'?: me.MusicWallReminder[];
}
export function GetMyListenStatsResponseToRequestData(data: GetMyListenStatsResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'friend_rankings', 'artist_rankings', 'song_rankings', 'reminder_list', ]),
  }
}
export interface GetMyMixedCollectionsRequest {
  'cursor': string;
  'count': string;
  'item_types'?: string[];
}
export function GetMyMixedCollectionsRequestToRequestData(data: GetMyMixedCollectionsRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['cursor', 'count', 'item_types', ]),
    body: fieldsAssign(data, []),
  }
}
export interface GetMyMusicWallRequest {
  'feed_music_wall_extra'?: feed.RecExtraMusicWall;
  'ab_param': string;
  'recent_rankings_version': string;
  'schema_extra'?: string;
}
export function GetMyMusicWallRequestToRequestData(data: GetMyMusicWallRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['feed_music_wall_extra', 'ab_param', 'recent_rankings_version', 'schema_extra', ]),
  }
}
export interface GetMyMusicWallResponse {
  'status_code': number;
  'status_info'?: general.StatusInfo;
  'tracks'?: track.Track[];
  'tags'?: user.UserMusicWallTag[];
  'play_button_color'?: common.Colour;
  'listen_duration'?: me.MyListenDuration;
  'reminder'?: me.MusicWallReminder;
  'friend_rankings'?: me.FriendRankings;
  'last_week_friend_rankings'?: me.FriendRankings;
  'enable_invite': boolean;
  'visibility': number;
  'enable_like': boolean;
  'invite_share_module'?: listen_duration.InviteShareModule;
}
export function GetMyMusicWallResponseToRequestData(data: GetMyMusicWallResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'tracks', 'tags', 'play_button_color', 'listen_duration', 'reminder', 'friend_rankings', 'last_week_friend_rankings', 'enable_invite', 'visibility', 'enable_like', 'invite_share_module', ]),
  }
}
export interface GetMyPlaylistsRequest {
  'cursor': string;
  'count': number;
  'ab_param': string;
}
export function GetMyPlaylistsRequestToRequestData(data: GetMyPlaylistsRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['cursor', 'count', ]),
    body: fieldsAssign(data, ['cursor', 'count', 'ab_param', ]),
  }
}
export interface GetMyPlaylistsResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'next_cursor'?: string;
  'has_more'?: boolean;
  'playlists'?: playlist.Playlist[];
  'total_num'?: number;
}
export function GetMyPlaylistsResponseToRequestData(data: GetMyPlaylistsResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'next_cursor', 'has_more', 'playlists', 'total_num', ]),
  }
}
export interface GetMySpecialStatsRequest {
  'user_special_stats_type'?: user.UserSpecialStatsType[];
}
export function GetMySpecialStatsRequestToRequestData(data: GetMySpecialStatsRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['user_special_stats_type', ]),
  }
}
export interface GetMySpecialStatsResponse {
  'status_code': number;
  'status_info'?: general.StatusInfo;
  'user_special_stats'?: user.UserSpecialStats[];
}
export function GetMySpecialStatsResponseToRequestData(data: GetMySpecialStatsResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'user_special_stats', ]),
  }
}
export interface GetMyVideoListRequest {
  'cursor': string;
  'count': string;
  'locate_item_id': string;
  'reverse': boolean;
  'end_cursor': string;
  'ab_param': string;
}
export function GetMyVideoListRequestToRequestData(data: GetMyVideoListRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['cursor', 'count', 'locate_item_id', 'reverse', 'end_cursor', ]),
    body: fieldsAssign(data, ['cursor', 'count', 'locate_item_id', 'reverse', 'end_cursor', 'ab_param', ]),
  }
}
export interface GetMyVideoListResponse {
  'status_code': number;
  'status_info'?: general.StatusInfo;
  'videos'?: video.Video[];
  'has_more': boolean;
  'cursor': string;
  'has_locate_item': boolean;
  'locate_item_cursor': string;
}
export function GetMyVideoListResponseToRequestData(data: GetMyVideoListResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'videos', 'has_more', 'cursor', 'has_locate_item', 'locate_item_cursor', ]),
  }
}
export interface GetPrivacySettingRequest {
}
export function GetPrivacySettingRequestToRequestData(data: GetPrivacySettingRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, []),
  }
}
export interface GetPrivacySettingResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'privacy_setting'?: me.PrivacySetting;
}
export function GetPrivacySettingResponseToRequestData(data: GetPrivacySettingResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'privacy_setting', ]),
  }
}
export interface GetRecentPlayedMediaRequest {
  'cursor': string;
  'count': string;
  'media_type': string;
  'scene': string;
}
export function GetRecentPlayedMediaRequestToRequestData(data: GetRecentPlayedMediaRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['cursor', 'count', 'media_type', 'scene', ]),
    body: fieldsAssign(data, []),
  }
}
export interface GetRecentPlayedMediaResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'media'?: media_common.PlayedMediaResource[];
  'next_cursor'?: string;
  'has_more'?: boolean;
  'total_num'?: number;
}
export function GetRecentPlayedMediaResponseToRequestData(data: GetRecentPlayedMediaResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'media', 'next_cursor', 'has_more', 'total_num', ]),
  }
}
export interface GetRecentPlayedStatsRequest {
}
export function GetRecentPlayedStatsRequestToRequestData(data: GetRecentPlayedStatsRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, []),
  }
}
export interface GetRecentPlayedStatsResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'user_ext_data'?: string;
}
export function GetRecentPlayedStatsResponseToRequestData(data: GetRecentPlayedStatsResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'user_ext_data', ]),
  }
}
export interface GetRecentPlayedTracksRequest {
  'cursor': string;
  'count': string;
}
export function GetRecentPlayedTracksRequestToRequestData(data: GetRecentPlayedTracksRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['cursor', 'count', ]),
    body: fieldsAssign(data, []),
  }
}
export interface GetRecentPlayedTracksResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'tracks'?: track.Track[];
  'next_cursor'?: string;
  'has_more'?: boolean;
  'total_num'?: number;
}
export function GetRecentPlayedTracksResponseToRequestData(data: GetRecentPlayedTracksResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'tracks', 'next_cursor', 'has_more', 'total_num', ]),
  }
}
export interface GetSharingItemsRequest {
  'target_uid': string;
  'cursor': string;
  'count': number;
  'image_strategy'?: comment.CommentImageDisplayStrategy;
}
export function GetSharingItemsRequestToRequestData(data: GetSharingItemsRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['target_uid', 'cursor', 'count', 'image_strategy', ]),
    body: fieldsAssign(data, []),
  }
}
export interface GetSharingItemsResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'user'?: user_artist.UserArtistBrief;
  'item_list'?: me.SharingItem[];
  'next_cursor'?: string;
  'has_more'?: boolean;
  'total_num'?: number;
}
export function GetSharingItemsResponseToRequestData(data: GetSharingItemsResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'user', 'item_list', 'next_cursor', 'has_more', 'total_num', ]),
  }
}
export interface MarkMediaListRequest {
  'media'?: media.Media[];
  'mark_action': MarkActionType;
  'extra_param'?: ExtraParam;
  'scene': string;
}
export function MarkMediaListRequestToRequestData(data: MarkMediaListRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['media', 'mark_action', 'extra_param', 'scene', ]),
  }
}
export interface MarkMediaListResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'marked_media'?: media.Media[];
  'unmarked_media'?: media.Media[];
}
export function MarkMediaListResponseToRequestData(data: MarkMediaListResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'marked_media', 'unmarked_media', ]),
  }
}
export interface MetabDiscoverRequest {
  'ab_param'?: string;
  'selected_boost'?: boost.SelectedBoost;
  'feed_discover_extra'?: feed.RecExtraDiscover;
}
export function MetabDiscoverRequestToRequestData(data: MetabDiscoverRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['ab_param', 'selected_boost', 'feed_discover_extra', ]),
  }
}
export interface MetabDiscoverResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'blocks'?: block.DisplayBlock[];
}
export function MetabDiscoverResponseToRequestData(data: MetabDiscoverResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'blocks', ]),
  }
}
export interface RejectFollowRequest {
  'user_id': string;
}
export function RejectFollowRequestToRequestData(data: RejectFollowRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['user_id', ]),
  }
}
export interface RejectFollowResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
}
export function RejectFollowResponseToRequestData(data: RejectFollowResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', ]),
  }
}
export interface SetUserBoostRequest {
  'selected_genres'?: number[];
  'selected_langs'?: string[];
}
export function SetUserBoostRequestToRequestData(data: SetUserBoostRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['selected_genres', 'selected_langs', ]),
  }
}
export interface SetUserBoostResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
}
export function SetUserBoostResponseToRequestData(data: SetUserBoostResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', ]),
  }
}
export interface UnfollowUserRequest {
  'user_id': string;
}
export function UnfollowUserRequestToRequestData(data: UnfollowUserRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['user_id', ]),
  }
}
export interface UnfollowUserResponse {
  'status_code': number;
  'status_info'?: general.StatusInfo;
  'follow_status': user.FollowStatusType;
  'user_id': number;
}
export function UnfollowUserResponseToRequestData(data: UnfollowUserResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'follow_status', 'user_id', ]),
  }
}
export interface UpdateMyInfoRequest {
  'nickname'?: string;
  'avatar_uri'?: string;
  'gender'?: string;
  'birthday'?: string;
  'birthday_hide_level'?: number;
  'location'?: user.UserLocation;
  'school_info'?: user.UserSchool;
  'signature'?: string;
  'liked_playlist_show_douyin_video'?: boolean;
}
export function UpdateMyInfoRequestToRequestData(data: UpdateMyInfoRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['nickname', 'avatar_uri', 'gender', 'birthday', 'birthday_hide_level', 'location', 'school_info', 'signature', 'liked_playlist_show_douyin_video', ]),
  }
}
export interface UpdateMyInfoResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
}
export function UpdateMyInfoResponseToRequestData(data: UpdateMyInfoResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', ]),
  }
}
export type Include = string
export type RecentPlayedScene = string
