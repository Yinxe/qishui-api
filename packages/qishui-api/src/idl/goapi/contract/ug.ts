// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'
import * as general from './general.js'
import * as media from '../entity/media.js'
import * as track from '../entity/track.js'
import * as ug from '../entity/ug.js'

export interface GetLunaUGBarInfoRequest {
  'item_id': string;
  'source_type'?: ug.SourceType;
  'luna_bar_type'?: number;
}
export function GetLunaUGBarInfoRequestToRequestData(data: GetLunaUGBarInfoRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['item_id', 'source_type', 'luna_bar_type', ]),
    body: fieldsAssign(data, ['item_id', 'source_type', 'luna_bar_type', ]),
  }
}
export interface GetLunaUGBarInfoResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'track_wrapper_list'?: track.TrackWrapper[];
  'ug_bar_info'?: ug.LunaUGBarInfo;
}
export function GetLunaUGBarInfoResponseToRequestData(data: GetLunaUGBarInfoResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'track_wrapper_list', 'ug_bar_info', ]),
  }
}
export interface GetUGTrackInfoRequest {
  'track_ids'?: string[];
  'scene_name'?: string;
  'queue_type'?: string;
  'limited_free_scene'?: media.LimitedFreeScene;
}
export function GetUGTrackInfoRequestToRequestData(data: GetUGTrackInfoRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['track_ids', ]),
    body: fieldsAssign(data, ['track_ids', 'scene_name', 'queue_type', 'limited_free_scene', ]),
  }
}
export interface GetUGTrackInfoResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'ug_track_list'?: ug.UGTrackInfo[];
  'risk_result': number;
}
export function GetUGTrackInfoResponseToRequestData(data: GetUGTrackInfoResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'ug_track_list', 'risk_result', ]),
  }
}
