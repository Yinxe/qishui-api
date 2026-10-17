// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'
import * as album from '../entity/album.js'
import * as general from './general.js'
import * as track from '../entity/track.js'

export interface GetAlbumDetailRequest {
  'album_id': string;
  'ignore_tracks': boolean;
}
export function GetAlbumDetailRequestToRequestData(data: GetAlbumDetailRequest): IRequestData {
  return {
    params: fieldsAssign(data, ['album_id', ]),
    query: fieldsAssign(data, ['ignore_tracks', ]),
    body: fieldsAssign(data, []),
  }
}
export interface GetAlbumDetailResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'album_info'?: album.Album;
  'tracks'?: track.Track[];
}
export function GetAlbumDetailResponseToRequestData(data: GetAlbumDetailResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'album_info', 'tracks', ]),
  }
}
