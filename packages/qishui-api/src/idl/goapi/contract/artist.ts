// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'
import * as album from '../entity/album.js'
import * as artist from '../entity/artist.js'
import * as general from './general.js'
import * as playlist from '../entity/playlist.js'
import * as track from '../entity/track.js'
import * as video from '../entity/video.js'

export enum ArtistTrackSortType {
  Hot = 0,
  CopyrightStartTime = 1,
  CollectionCount = 2,
}
export interface GetArtistDetailRequest {
  'artist_id': string;
  'user_id'?: string;
  'locate_item_id': string;
}
export function GetArtistDetailRequestToRequestData(data: GetArtistDetailRequest): IRequestData {
  return {
    params: fieldsAssign(data, ['artist_id', ]),
    query: fieldsAssign(data, ['user_id', 'locate_item_id', ]),
    body: fieldsAssign(data, []),
  }
}
export interface GetArtistDetailResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'artist_info'?: artist.Artist;
  'hot_tracks'?: track.Track[];
  'hot_mvs'?: video.Video[];
  'hot_albums'?: album.Album[];
  'has_more_tracks'?: boolean;
  'has_more_albums'?: boolean;
  'on_sale_digital_album'?: album.Album;
  'post_videos'?: video.Video[];
  'has_more_videos'?: boolean;
  'playlists'?: playlist.Playlist[];
  'has_more_playlists'?: boolean;
  'has_locate_item': boolean;
  'locate_item_cursor': string;
  'post_video_cursor'?: string;
  'my_artist_stats'?: artist.MyArtistStats;
}
export function GetArtistDetailResponseToRequestData(data: GetArtistDetailResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'artist_info', 'hot_tracks', 'hot_mvs', 'hot_albums', 'has_more_tracks', 'has_more_albums', 'on_sale_digital_album', 'post_videos', 'has_more_videos', 'playlists', 'has_more_playlists', 'has_locate_item', 'locate_item_cursor', 'post_video_cursor', 'my_artist_stats', ]),
  }
}
export interface LightUpArtistsRequest {
  'artist_ids'?: string[];
}
export function LightUpArtistsRequestToRequestData(data: LightUpArtistsRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['artist_ids', ]),
  }
}
export interface LightUpArtistsResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'my_artist_stats'?: Record<string, artist.MyArtistStats>;
}
export function LightUpArtistsResponseToRequestData(data: LightUpArtistsResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'my_artist_stats', ]),
  }
}
export interface ListArtistAlbumsRequest {
  'artist_id': string;
  'cursor': string;
  'count': string;
}
export function ListArtistAlbumsRequestToRequestData(data: ListArtistAlbumsRequest): IRequestData {
  return {
    params: fieldsAssign(data, ['artist_id', ]),
    query: fieldsAssign(data, ['cursor', 'count', ]),
    body: fieldsAssign(data, []),
  }
}
export interface ListArtistAlbumsResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'albums'?: album.Album[];
  'has_more'?: boolean;
  'next_cursor'?: string;
}
export function ListArtistAlbumsResponseToRequestData(data: ListArtistAlbumsResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'albums', 'has_more', 'next_cursor', ]),
  }
}
export interface ListArtistTracksRequest {
  'artist_id': string;
  'cursor': string;
  'count': string;
  'sort_type'?: ArtistTrackSortType;
  'passthrough'?: Record<string, string>;
}
export function ListArtistTracksRequestToRequestData(data: ListArtistTracksRequest): IRequestData {
  return {
    params: fieldsAssign(data, ['artist_id', ]),
    query: fieldsAssign(data, ['cursor', 'count', 'sort_type', ]),
    body: fieldsAssign(data, ['cursor', 'count', 'sort_type', 'passthrough', ]),
  }
}
export interface ListArtistTracksResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'tracks'?: track.Track[];
  'mvs'?: video.Video[];
  'has_more'?: boolean;
  'next_cursor'?: string;
  'passthrough'?: Record<string, string>;
}
export function ListArtistTracksResponseToRequestData(data: ListArtistTracksResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'tracks', 'mvs', 'has_more', 'next_cursor', 'passthrough', ]),
  }
}
