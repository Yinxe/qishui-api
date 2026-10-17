// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'
import * as artist from '../entity/artist.js'
import * as common from '../entity/common.js'
import * as feed from '../entity/feed.js'
import * as general from './general.js'
import * as live from '../entity/live.js'
import * as playlist from '../entity/playlist.js'
import * as track from '../entity/track.js'
import * as user from '../entity/user.js'
import * as user_artist from '../entity/user_artist.js'
import * as video from '../entity/video.js'

export const UserPlaylistSceneAwemeUserProfile: string = 'aweme_user_profile'
export interface GetBriefUserInfoRequest {
  'user_id': string;
  'sec_uid': string;
}
export function GetBriefUserInfoRequestToRequestData(data: GetBriefUserInfoRequest): IRequestData {
  return {
    params: fieldsAssign(data, ['user_id', ]),
    query: fieldsAssign(data, ['sec_uid', ]),
    body: fieldsAssign(data, []),
  }
}
export interface GetBriefUserInfoRequestV2 {
  'sec_uid'?: string;
  'by_login_user_id'?: boolean;
}
export function GetBriefUserInfoRequestV2ToRequestData(data: GetBriefUserInfoRequestV2): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['sec_uid', 'by_login_user_id', ]),
    body: fieldsAssign(data, []),
  }
}
export interface GetBriefUserInfoResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'user'?: user.UserBrief;
  'user_artist_info'?: user_artist.UserArtistBrief;
  'user_stats'?: user.BriefUserStats;
}
export function GetBriefUserInfoResponseToRequestData(data: GetBriefUserInfoResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'user', 'user_artist_info', 'user_stats', ]),
  }
}
export interface GetFollowListRequest {
  'user_id': string;
  'cursor': string;
  'count': number;
  'scene': user.FollowListSceneType;
}
export function GetFollowListRequestToRequestData(data: GetFollowListRequest): IRequestData {
  return {
    params: fieldsAssign(data, ['user_id', ]),
    query: fieldsAssign(data, ['cursor', 'count', 'scene', ]),
    body: fieldsAssign(data, []),
  }
}
export interface GetFollowListResponse {
  'status_code': number;
  'status_info'?: general.StatusInfo;
  'follow_items'?: user.MixedFollowItem[];
  'total_count'?: number;
  'next_cursor'?: string;
  'has_more'?: boolean;
}
export function GetFollowListResponseToRequestData(data: GetFollowListResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'follow_items', 'total_count', 'next_cursor', 'has_more', ]),
  }
}
export interface GetLocateVideoRequest {
  'user_id': string;
  'locate_item_id': string;
  'locate_item_cursor': string;
  'end_cursor': string;
}
export function GetLocateVideoRequestToRequestData(data: GetLocateVideoRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['user_id', 'locate_item_id', 'locate_item_cursor', 'end_cursor', ]),
    body: fieldsAssign(data, []),
  }
}
export interface GetLocateVideoResponse {
  'status_code': number;
  'status_info'?: general.StatusInfo;
  'videos'?: video.Video[];
  'offset': number;
  'max_cursor': string;
  'min_cursor': string;
  'has_more': boolean;
  'forward_has_more': boolean;
}
export function GetLocateVideoResponseToRequestData(data: GetLocateVideoResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'videos', 'offset', 'max_cursor', 'min_cursor', 'has_more', 'forward_has_more', ]),
  }
}
export interface GetUserArtistCollectionRequest {
  'user_id': string;
  'cursor': string;
  'count': number;
}
export function GetUserArtistCollectionRequestToRequestData(data: GetUserArtistCollectionRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['user_id', 'cursor', 'count', ]),
    body: fieldsAssign(data, []),
  }
}
export interface GetUserInfoByTokenRequest {
  'token': string;
}
export function GetUserInfoByTokenRequestToRequestData(data: GetUserInfoByTokenRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['token', ]),
    body: fieldsAssign(data, []),
  }
}
export interface GetUserInfoByTokenResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'user'?: user.UserBasic;
}
export function GetUserInfoByTokenResponseToRequestData(data: GetUserInfoByTokenResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'user', ]),
  }
}
export interface GetUserInfoRequest {
  'user_id': string;
  'sec_uid': string;
}
export function GetUserInfoRequestToRequestData(data: GetUserInfoRequest): IRequestData {
  return {
    params: fieldsAssign(data, ['user_id', ]),
    query: fieldsAssign(data, ['user_id', 'sec_uid', ]),
    body: fieldsAssign(data, []),
  }
}
export interface GetUserInfoResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'user'?: user.UserInfo;
  'user_stats'?: user.UserStats;
  'my_user_state'?: user.MyUserState;
  'vip_info'?: user.VIPInfo;
  'tab_entries'?: user.TabEntry[];
  'anchor_live_state'?: live.AnchorLiveState;
}
export function GetUserInfoResponseToRequestData(data: GetUserInfoResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'user', 'user_stats', 'my_user_state', 'vip_info', 'tab_entries', 'anchor_live_state', ]),
  }
}
export interface GetUserMixInfoRequest {
  'user_id': string;
  'cursor': string;
  'count': number;
}
export function GetUserMixInfoRequestToRequestData(data: GetUserMixInfoRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['user_id', 'cursor', 'count', ]),
    body: fieldsAssign(data, []),
  }
}
export interface GetUserMixInfoResponse {
  'status_code': number;
  'status_info'?: general.StatusInfo;
  'mix_infos'?: video.VideoMixInfo[];
  'has_more': boolean;
  'cursor': string;
}
export function GetUserMixInfoResponseToRequestData(data: GetUserMixInfoResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'mix_infos', 'has_more', 'cursor', ]),
  }
}
export interface GetUserMixedCollectionsRequest {
  'user_id': string;
  'item_types'?: string[];
  'cursor': string;
  'count': number;
  'sec_uid'?: string;
}
export function GetUserMixedCollectionsRequestToRequestData(data: GetUserMixedCollectionsRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['user_id', 'item_types', 'cursor', 'count', 'sec_uid', ]),
    body: fieldsAssign(data, []),
  }
}
export interface GetUserMixedCollectionsResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'next_cursor'?: string;
  'has_more'?: boolean;
  'mixed_collections'?: user.MixedCollectionItem[];
  'total_num'?: number;
}
export function GetUserMixedCollectionsResponseToRequestData(data: GetUserMixedCollectionsResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'next_cursor', 'has_more', 'mixed_collections', 'total_num', ]),
  }
}
export interface GetUserMusicWallRequest {
  'user_id': string;
  'feed_music_wall_extra'?: feed.RecExtraMusicWall;
  'sec_uid': string;
  'ab_param': string;
}
export function GetUserMusicWallRequestToRequestData(data: GetUserMusicWallRequest): IRequestData {
  return {
    params: fieldsAssign(data, ['user_id', ]),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['user_id', 'feed_music_wall_extra', 'sec_uid', 'ab_param', ]),
  }
}
export interface GetUserMusicWallResponse {
  'status_code': number;
  'status_info'?: general.StatusInfo;
  'tracks'?: track.Track[];
  'tags'?: user.UserMusicWallTag[];
  'play_button_color'?: common.Colour;
  'user_brief'?: user.UserBrief;
  'is_visible': boolean;
  'user_listen_duration'?: user.UserListenDuration;
  'my_music_wall_visibility': number;
}
export function GetUserMusicWallResponseToRequestData(data: GetUserMusicWallResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'tracks', 'tags', 'play_button_color', 'user_brief', 'is_visible', 'user_listen_duration', 'my_music_wall_visibility', ]),
  }
}
export interface GetUserPlaylistsRequest {
  'user_id': string;
  'cursor': string;
  'count': number;
  'sec_uid'?: string;
  'ab_param': string;
  'scene': UserPlaylistScene;
}
export function GetUserPlaylistsRequestToRequestData(data: GetUserPlaylistsRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['user_id', 'cursor', 'count', 'sec_uid', 'scene', ]),
    body: fieldsAssign(data, ['user_id', 'cursor', 'count', 'sec_uid', 'ab_param', 'scene', ]),
  }
}
export interface GetUserVideoListRequest {
  'user_id': string;
  'artist_id': string;
  'cursor': string;
  'count': string;
  'locate_item_id': string;
  'reverse': boolean;
  'end_cursor': string;
}
export function GetUserVideoListRequestToRequestData(data: GetUserVideoListRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['user_id', 'artist_id', 'cursor', 'count', 'locate_item_id', 'reverse', 'end_cursor', ]),
    body: fieldsAssign(data, []),
  }
}
export interface GetUserVideoListResponse {
  'status_code': number;
  'status_info'?: general.StatusInfo;
  'videos'?: video.Video[];
  'has_more': boolean;
  'cursor': string;
  'has_locate_item': boolean;
  'locate_item_cursor': string;
}
export function GetUserVideoListResponseToRequestData(data: GetUserVideoListResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'videos', 'has_more', 'cursor', 'has_locate_item', 'locate_item_cursor', ]),
  }
}
export interface LikeUserListenDurationRequest {
  'to_user_ids'?: number[];
  'action': number;
  'version': string;
}
export function LikeUserListenDurationRequestToRequestData(data: LikeUserListenDurationRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['to_user_ids', 'action', 'version', ]),
  }
}
export type UserPlaylistScene = string
