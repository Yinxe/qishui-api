// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'
import * as feed from '../entity/feed.js'
import * as general from './general.js'
import * as media from '../entity/media.js'

export interface AiAssistantRelatedRequest {
  'unlimited_flow_info': string;
  'conversation_id': string;
  'message_id': string;
  'agent_session_id': string;
  'feed_request': string;
  'last_viewed_media'?: media.Media;
  'play_list'?: number[];
  'skip_list'?: number[];
  'client_info_map'?: Record<string, string>;
  'req_count'?: number;
  'first_req_time'?: number;
  'count'?: number;
}
export function AiAssistantRelatedRequestToRequestData(data: AiAssistantRelatedRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['unlimited_flow_info', 'conversation_id', 'message_id', 'agent_session_id', 'feed_request', 'last_viewed_media', 'play_list', 'skip_list', 'client_info_map', 'req_count', 'first_req_time', 'count', ]),
  }
}
export interface AiAssistantRelatedResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'has_more'?: boolean;
  'items'?: feed.FeedItem[];
}
export function AiAssistantRelatedResponseToRequestData(data: AiAssistantRelatedResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'has_more', 'items', ]),
  }
}
