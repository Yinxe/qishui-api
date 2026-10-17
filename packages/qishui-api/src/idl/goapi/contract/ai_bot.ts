// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'
import * as ai_bot from '../entity/ai_bot.js'
import * as common from '../entity/common.js'
import * as general from './general.js'

export const ChatActionTypeEnterDiscovery: string = 'enter_discovery'
export const ChatActionTypeFeedBack: string = 'feed_back'
export const ChatActionTypeGoToListen: string = 'go_to_listen'
export const ChatActionTypeLaunchSubPlayer: string = 'launch_sub_player'
export const ChatActionTypeRefreshFeed: string = 'refresh_feed'
export const ChatActionTypeRestart: string = 'restart'
export const ChatMsgRoleAssistant: string = 'assistant'
export const ChatMsgRoleExternalAssistant: string = 'external_assistant'
export const ChatMsgRoleUser: string = 'user'
export const ChatMsgTypeChooseTag: string = 'choose_tag'
export const ChatMsgTypeSwitch: string = 'switch'
export const ChatMsgTypeTag: string = 'tag'
export const ChatMsgTypeText: string = 'text'
export const ChatTriggerTimingDislike: string = 'dislike'
export const ChatTriggerTimingForeSkip: string = 'fore_skip'
export const ChatTriggerTimingLike: string = 'like'
export const ChatTriggerTimingLoop: string = 'loop'
export const ChatTriggerTimingPlayList: string = 'playlist'
export const ChatTriggerTimingSkips: string = 'skips'
export const ChatTypeClick: string = 'click'
export const ChatTypeTrigger: string = 'trigger'
export const TagTypePlayableCard: string = 'playable_card'
export const TagTypeText: string = 'text'
export interface AIBotChatRequest {
  'meta'?: ChatMeta;
  'messages'?: ChatMessage[];
}
export function AIBotChatRequestToRequestData(data: AIBotChatRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['meta', 'messages', ]),
  }
}
export interface AIBotChatResponse {
  'status_code': number;
  'status_info'?: general.StatusInfo;
  'message'?: ChatMessage;
}
export function AIBotChatResponseToRequestData(data: AIBotChatResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'message', ]),
  }
}
export interface ChatAction {
  'type': ChatActionType;
  'schema_url': string;
}
export function ChatActionToRequestData(data: ChatAction): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['type', 'schema_url', ]),
  }
}
export interface ChatMessage {
  'id': string;
  'role': ChatMsgRole;
  'type': ChatMsgType;
  'action'?: ChatAction;
  'text_body'?: ChatMsgTextBody;
  'tag_body'?: ChatMsgTagBody;
  'choose_tag_body'?: ChatMsgChooseTagBody;
  'switch_body'?: ChatMsgSwitchTagBody;
}
export function ChatMessageToRequestData(data: ChatMessage): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['id', 'role', 'type', 'action', 'text_body', 'tag_body', 'choose_tag_body', 'switch_body', ]),
  }
}
export interface ChatMeta {
  'chat_type': ChatType;
  'trigger_timing': ChatTriggerTiming;
  'group_id': number;
  'play_list'?: number[];
  'skip_list'?: number[];
  'extra': string;
}
export function ChatMetaToRequestData(data: ChatMeta): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['chat_type', 'trigger_timing', 'group_id', 'play_list', 'skip_list', 'extra', ]),
  }
}
export interface ChatMsgChooseTagBody {
  'tag'?: ChatTag;
}
export function ChatMsgChooseTagBodyToRequestData(data: ChatMsgChooseTagBody): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['tag', ]),
  }
}
export interface ChatMsgSwitchTagBody {
  'message_id': string;
  'node_id': string;
}
export function ChatMsgSwitchTagBodyToRequestData(data: ChatMsgSwitchTagBody): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['message_id', 'node_id', ]),
  }
}
export interface ChatMsgTagBody {
  'node_id': string;
  'content': string;
  'tags'?: ChatTag[];
  'switchable': boolean;
}
export function ChatMsgTagBodyToRequestData(data: ChatMsgTagBody): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['node_id', 'content', 'tags', 'switchable', ]),
  }
}
export interface ChatMsgTextBody {
  'content': string;
}
export function ChatMsgTextBodyToRequestData(data: ChatMsgTextBody): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['content', ]),
  }
}
export interface ChatTag {
  'node_id': string;
  'type': TagType;
  'theme_entity'?: TagThemeEntity;
  'action'?: ChatAction;
  'user_reply': string;
  'extra': string;
}
export function ChatTagToRequestData(data: ChatTag): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['node_id', 'type', 'theme_entity', 'action', 'user_reply', 'extra', ]),
  }
}
export interface TagThemeEntity {
  'title': string;
  'sub_title': string;
  'cover_url'?: common.URLInfo;
}
export function TagThemeEntityToRequestData(data: TagThemeEntity): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['title', 'sub_title', 'cover_url', ]),
  }
}
export type ChatActionType = string
export type ChatMsgRole = string
export type ChatMsgType = string
export type ChatTriggerTiming = string
export type ChatType = string
export type TagType = string
