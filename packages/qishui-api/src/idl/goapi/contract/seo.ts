// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'
import * as comment from '../entity/comment.js'
import * as common from '../entity/common.js'
import * as general from './general.js'
import * as media from '../entity/media.js'
import * as seo from '../entity/seo.js'
import * as track from '../entity/track.js'

export interface GetSeoTracksRequest {
  'track_id': string;
}
export function GetSeoTracksRequestToRequestData(data: GetSeoTracksRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['track_id', ]),
    body: fieldsAssign(data, []),
  }
}
export interface GetSeoTracksResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'lyric'?: track.TrackLyrics;
  'seo_track'?: seo.SeoTrack;
  'track_player'?: media.PlayerInfo;
  'comments'?: seo.CommentStruct;
  'album_tracks'?: seo.SeoTrack[];
  'artist_tracks'?: seo.SeoTrack[];
  'related_tracks'?: seo.SeoTrack[];
  'chart_tracks'?: seo.SeoTrack[];
}
export function GetSeoTracksResponseToRequestData(data: GetSeoTracksResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'lyric', 'seo_track', 'track_player', 'comments', 'album_tracks', 'artist_tracks', 'related_tracks', 'chart_tracks', ]),
  }
}
