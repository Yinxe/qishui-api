// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'
import * as card from '../entity/card.js'
import * as common from '../entity/common.js'
import * as feed from '../entity/feed.js'
import * as general from './general.js'

export const CardContextKeyFeaturedComment: string = 'featured_comment'
export const CardContextKeyRecallReason: string = 'recall_reason'
export const PreviewGuidePosAboveSeekBar: string = 'above_seek_bar'
export const PreviewGuidePosNearSeekBar: string = 'near_seek_bar'
export interface ClientCardConfig {
  'can_show_bubble_ai_recommend'?: boolean;
  'disable_milestone'?: string[];
}
export function ClientCardConfigToRequestData(data: ClientCardConfig): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['can_show_bubble_ai_recommend', 'disable_milestone', ]),
  }
}
export interface GetCardRequest {
  'media_id': number;
  'media_type': string;
  'context'?: Record<string, string>;
  'is_vip'?: boolean;
  'queue_type'?: string;
  'ab_param'?: string;
  'vip_redeem_token'?: string;
  'limited_free_param'?: common.LimitedFreeParam;
  'sub_queue_type'?: string;
  'user_action'?: UserAction;
  'search_scene'?: string;
  'is_listen_video_scene'?: boolean;
  'main_player_first_track'?: boolean;
  'client_card_config'?: ClientCardConfig;
  'need_related_track_card'?: boolean;
  'feed_extra_card'?: feed.RecExtraCard;
}
export function GetCardRequestToRequestData(data: GetCardRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['media_id', 'media_type', 'context', 'is_vip', 'queue_type', 'ab_param', 'vip_redeem_token', 'limited_free_param', 'sub_queue_type', 'user_action', 'search_scene', 'is_listen_video_scene', 'main_player_first_track', 'client_card_config', 'need_related_track_card', 'feed_extra_card', ]),
  }
}
export interface GetCardResponse {
  'status_code': number;
  'status_info'?: general.StatusInfo;
  'card_items'?: card.CardItem[];
  'preview_guide'?: PreviewGuide;
}
export function GetCardResponseToRequestData(data: GetCardResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'card_items', 'preview_guide', ]),
  }
}
export interface PreviewGuide {
  'pos': string;
  'text': string;
  'deep_link': string;
  'type': string;
  'rewind_prev_preview_guide'?: PreviewGuide;
}
export function PreviewGuideToRequestData(data: PreviewGuide): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['pos', 'text', 'deep_link', 'type', 'rewind_prev_preview_guide', ]),
  }
}
export interface UserAction {
  'action_type'?: string;
}
export function UserActionToRequestData(data: UserAction): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['action_type', ]),
  }
}
