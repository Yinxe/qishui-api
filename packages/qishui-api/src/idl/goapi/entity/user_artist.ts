// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'
import * as artist from './artist.js'
import * as common from './common.js'
import * as conversation from './conversation.js'
import * as user from './user.js'

export enum SocialTagType {
  RecentMusicMate = 1,
  FissionNewUser = 2,
  CptiSelf = 3,
  CptiMutualFollow = 4,
  CptiSingleFollow = 5,
}
export enum UserArtistType {
  User = 0,
  Artist = 1,
  UserArtist = 2,
  Conversation = 3,
}
export interface SocialTag {
  'tag_type'?: SocialTagType;
  'tag_name'?: string;
  'priority'?: number;
}
export function SocialTagToRequestData(data: SocialTag): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['tag_type', 'tag_name', 'priority', ]),
  }
}
export interface UserArtistBrief {
  'user_artist_type': UserArtistType;
  'user_brief'?: user.UserBrief;
  'artist_brief'?: artist.ArtistBrief;
  'fallback'?: boolean;
  'social_tags'?: SocialTag[];
  'conversation_brief'?: conversation.ConversationBrief;
}
export function UserArtistBriefToRequestData(data: UserArtistBrief): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['user_artist_type', 'user_brief', 'artist_brief', 'fallback', 'social_tags', 'conversation_brief', ]),
  }
}
