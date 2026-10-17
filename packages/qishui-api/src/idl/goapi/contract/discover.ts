// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'
import * as block from '../entity/block.js'
import * as boost from '../entity/boost.js'
import * as common from '../entity/common.js'
import * as feed from '../entity/feed.js'
import * as general from './general.js'

export interface DiscoverMixRequest {
  'block_type': string;
  'sub_channel_id': number;
  'feed_discover_extra'?: feed.RecExtraDiscoverMix;
  'exposure_radio_list'?: number[];
  'cursor'?: string;
  'count'?: number;
  'session_id'?: string;
  'ab_param'?: string;
  'latest_douyin_liked_playlist_show_ts'?: number;
}
export function DiscoverMixRequestToRequestData(data: DiscoverMixRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['block_type', 'sub_channel_id', 'feed_discover_extra', 'exposure_radio_list', 'cursor', 'count', 'session_id', 'ab_param', 'latest_douyin_liked_playlist_show_ts', ]),
  }
}
export interface DiscoverMixResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'has_more'?: boolean;
  'inner_block'?: block.InnerBlock[];
  'next_cursor'?: string;
  'ab_param'?: string;
}
export function DiscoverMixResponseToRequestData(data: DiscoverMixResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'has_more', 'inner_block', 'next_cursor', 'ab_param', ]),
  }
}
export interface DiscoverPlaylistMixParam {
  'sub_channel_id'?: number;
  'latest_douyin_liked_playlist_show_ts'?: number;
}
export function DiscoverPlaylistMixParamToRequestData(data: DiscoverPlaylistMixParam): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['sub_channel_id', 'latest_douyin_liked_playlist_show_ts', ]),
  }
}
export interface DiscoverRequest {
  'ab_param'?: string;
  'selected_boost'?: boost.SelectedBoost;
  'playlist_mix_param'?: DiscoverPlaylistMixParam;
  'feed_discover_extra'?: feed.RecExtraDiscover;
  'is_carplay'?: Uint8Array;
  'first_request'?: boolean;
  'pc_new_discover_request'?: boolean;
}
export function DiscoverRequestToRequestData(data: DiscoverRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['ab_param', 'selected_boost', 'playlist_mix_param', 'feed_discover_extra', 'is_carplay', 'first_request', 'pc_new_discover_request', ]),
  }
}
export interface DiscoverResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'blocks'?: block.DisplayBlock[];
  'background_color'?: string;
  'background_image'?: common.URLInfo;
  'style'?: DiscoverStyle;
  'boost_block'?: boost.BoostBlock;
}
export function DiscoverResponseToRequestData(data: DiscoverResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'blocks', 'background_color', 'background_image', 'style', 'boost_block', ]),
  }
}
export interface DiscoverStyle {
  'background_color'?: string;
  'background_image'?: common.URLInfo;
  'refresh_text'?: string;
}
export function DiscoverStyleToRequestData(data: DiscoverStyle): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['background_color', 'background_image', 'refresh_text', ]),
  }
}
