// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'
import * as feed from '../entity/feed.js'
import * as general from './general.js'
import * as media from '../entity/media.js'
import * as search from '../entity/search.js'

export interface GetSearchBlockRequest {
  'includes'?: string[];
  'ab_param'?: string;
  'from_query'?: string;
  'scene_name'?: string;
}
export function GetSearchBlockRequestToRequestData(data: GetSearchBlockRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['includes', 'ab_param', 'from_query', 'scene_name', ]),
  }
}
export interface GetSearchBlockResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'suggest_words'?: search.SuggestWord[];
  'hint_words'?: search.HintWord[];
  'search_chart_block'?: search.SearchChartBlock;
}
export function GetSearchBlockResponseToRequestData(data: GetSearchBlockResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'suggest_words', 'hint_words', 'search_chart_block', ]),
  }
}
export interface SearchCategoriesResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'search_category_tabs'?: SearchCategoryTab[];
}
export function SearchCategoriesResponseToRequestData(data: SearchCategoriesResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'search_category_tabs', ]),
  }
}
export interface SearchCategoryTab {
  'search_type'?: string;
  'name'?: string;
}
export function SearchCategoryTabToRequestData(data: SearchCategoryTab): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['search_type', 'name', ]),
  }
}
export interface SearchRequest {
  'q': string;
  'cursor': string;
  'search_id': string;
  'search_type': search.SearchType;
  'search_method': string;
  'debug_params': string;
  'from_search_id': string;
  'search_scene': string;
  'ab_param'?: string;
  'last_viewed_media'?: media.Media;
  'scene_name'?: string;
  'transit'?: search.SearchTransit;
  'limited_free_scene'?: media.LimitedFreeScene;
}
export function SearchRequestToRequestData(data: SearchRequest): IRequestData {
  return {
    params: fieldsAssign(data, ['search_type', ]),
    query: fieldsAssign(data, ['q', 'cursor', 'search_id', 'search_method', 'debug_params', 'from_search_id', 'search_scene', 'scene_name', 'transit', ]),
    body: fieldsAssign(data, ['q', 'cursor', 'search_id', 'search_method', 'debug_params', 'from_search_id', 'search_scene', 'ab_param', 'last_viewed_media', 'scene_name', 'transit', 'limited_free_scene', ]),
  }
}
export interface SearchResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'result_groups'?: search.SearchResultGroup[];
  'debug_info'?: string;
  'extra'?: search.SearchExtraInfo;
}
export function SearchResponseToRequestData(data: SearchResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'result_groups', 'debug_info', 'extra', ]),
  }
}
export interface SugRequest {
  'q': string;
  'sug_scene': string;
  'sug_search_id': string;
}
export function SugRequestToRequestData(data: SugRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, ['q', 'sug_scene', 'sug_search_id', ]),
    body: fieldsAssign(data, []),
  }
}
export interface SugResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'sugs'?: search.SugEntry[];
}
export function SugResponseToRequestData(data: SugResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'sugs', ]),
  }
}
export interface SuggestWordsRequest {
  'suggest_type': search.SuggestType;
}
export function SuggestWordsRequestToRequestData(data: SuggestWordsRequest): IRequestData {
  return {
    params: fieldsAssign(data, ['suggest_type', ]),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, []),
  }
}
export interface SuggestWordsResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'suggest_words'?: search.SuggestWord[];
}
export function SuggestWordsResponseToRequestData(data: SuggestWordsResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'suggest_words', ]),
  }
}
