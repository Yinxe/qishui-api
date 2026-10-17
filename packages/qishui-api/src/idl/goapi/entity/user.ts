// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'
import * as album from './album.js'
import * as artist from './artist.js'
import * as common from './common.js'
import * as nameplate from '../../thrift/commerce/entity/nameplate.js'
import * as playlist from './playlist.js'
import * as upsell from '../../commerce_membership_api/common/upsell.js'
import * as user_artist from './user_artist.js'

export const AudioQuality: string = 'audio_quality'
export const BlockStatusTypeBlocked: number = 1
export const BlockStatusTypeNotBlocked: number = 0
export const CountLikedPlaylistTrack: string = 'count_liked_playlist_track'
export const DeviceBlockTypeCancelBlock: number = 2
export const DeviceBlockTypeCommitBlock: number = 1
export const Dislike: string = 'dislike'
export const Download: string = 'download'
export const EntryTypeHashtag: string = 'hashtag'
export const EntryTypeSummary: string = 'summary'
export const FollowStatusTypSecretExistFollowEachOtherRequest: number = 7
export const FollowStatusTypSecretExistFollowRequest: number = 6
export const FollowStatusTypeFollowEachOther: number = 2
export const FollowStatusTypeFollowEachOtherRequest: number = 5
export const FollowStatusTypeFollowRequest: number = 4
export const FollowStatusTypeFollower: number = 3
export const FollowStatusTypeFollowing: number = 1
export const FollowStatusTypeNoRelation: number = 0
export const MeTabBannerTypeFreeVIP: string = 'free_vip'
export const MeTabBannerTypeGuideCarSdkInstall: string = 'guide_car_sdk_install'
export const MeTabBannerTypeRewardAd: string = 'reward_ad'
export const MeTabBannerTypeTreasure: string = 'treasure'
export const MeTabBannerTypeVIP: string = 'vip'
export const MixedCollectionTypeAlbum: string = 'album'
export const MixedCollectionTypePlaylist: string = 'playlist'
export const RedeemFreeVIPStatusCycleRedeemedAlready: number = 2
export const RedeemFreeVIPStatusDeviceDupAccount: number = 1
export const RedeemFreeVIPStatusSucc: number = 0
export const RelationSourceTypeDouyin: number = 1
export const RelationSourceTypeLuna: number = 2
export const RelationSourceTypeNone: number = 0
export enum BannerStatus {
  Default = 0,
  RewardTimeLeft = 1,
  RewardToday = 2,
  RewardTimeRunout = 3,
}
export enum FollowListSceneType {
  Default = 0,
  SourceAweme = 1,
  SourceLuna = 2,
}
export enum TextType {
  Plain = 1,
  Countdown = 2,
}
export interface AllCommentsLikedDetail {
  'count': string;
  'popup'?: common.Popup;
  'is_show': boolean;
}
export function AllCommentsLikedDetailToRequestData(data: AllCommentsLikedDetail): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['count', 'popup', 'is_show', ]),
  }
}
export interface AvatarFrame {
  'resource_id': string;
  'url'?: common.URLInfo;
}
export function AvatarFrameToRequestData(data: AvatarFrame): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['resource_id', 'url', ]),
  }
}
export interface BannerParams {
  'is_dy_promotion': boolean;
}
export function BannerParamsToRequestData(data: BannerParams): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['is_dy_promotion', ]),
  }
}
export interface BlockItem {
  'id': string;
  'item_type': string;
}
export function BlockItemToRequestData(data: BlockItem): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['id', 'item_type', ]),
  }
}
export interface BlockResult {
  'block_item'?: BlockItem;
  'block_status': BlockStatusType;
}
export function BlockResultToRequestData(data: BlockResult): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['block_item', 'block_status', ]),
  }
}
export interface BriefUserStats {
  'count_friend': number;
}
export function BriefUserStatsToRequestData(data: BriefUserStats): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['count_friend', ]),
  }
}
export interface CountFollowerStrExp {
  'enable': boolean;
  'follower_count_str_desc': string;
}
export function CountFollowerStrExpToRequestData(data: CountFollowerStrExp): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['enable', 'follower_count_str_desc', ]),
  }
}
export interface FreeVIPBanner {
  'title': string;
  'content': string;
  'jump_link'?: string;
  'banner_image'?: common.URLInfo;
  'banner_params'?: BannerParams;
  'style_type'?: string;
}
export function FreeVIPBannerToRequestData(data: FreeVIPBanner): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['title', 'content', 'jump_link', 'banner_image', 'banner_params', 'style_type', ]),
  }
}
export interface MeTabBanners {
  'banner_list'?: MeTabBannerType[];
  'free_vip_banner'?: FreeVIPBanner;
  'reward_ad_banner'?: RewardAdBanner;
  'treasure_banner'?: TreasureBanner;
  'vip_banner'?: upsell.Banner;
  'guide_car_sdk_install_banner'?: upsell.Banner;
  'ads_banner'?: upsell.Banner;
}
export function MeTabBannersToRequestData(data: MeTabBanners): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['banner_list', 'free_vip_banner', 'reward_ad_banner', 'treasure_banner', 'vip_banner', 'guide_car_sdk_install_banner', 'ads_banner', ]),
  }
}
export interface MixedCollectionItem {
  'item_type'?: string;
  'album'?: album.Album;
  'playlist'?: playlist.Playlist;
}
export function MixedCollectionItemToRequestData(data: MixedCollectionItem): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['item_type', 'album', 'playlist', ]),
  }
}
export interface MixedFollowItem {
  'item_type'?: string;
  'user'?: UserBrief;
  'artist'?: artist.ArtistLink;
  'my_user_state'?: MyUserState;
  'user_artist_info'?: user_artist.UserArtistBrief;
}
export function MixedFollowItemToRequestData(data: MixedFollowItem): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['item_type', 'user', 'artist', 'my_user_state', 'user_artist_info', ]),
  }
}
export interface MyUserState {
  'blocked_by_me': boolean;
  'is_blocked': boolean;
  'follow_status': FollowStatusType;
}
export function MyUserStateToRequestData(data: MyUserState): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['blocked_by_me', 'is_blocked', 'follow_status', ]),
  }
}
export interface PlayPanelInfo {
  'default_prepositive_button': string;
}
export function PlayPanelInfoToRequestData(data: PlayPanelInfo): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['default_prepositive_button', ]),
  }
}
export interface ProgressNode {
  'text'?: Text;
  'is_completed': boolean;
  'seq'?: number;
  'children'?: ProgressNode[];
}
export function ProgressNodeToRequestData(data: ProgressNode): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['text', 'is_completed', 'seq', 'children', ]),
  }
}
export interface RedeemFreeVIPInfo {
  'redeem_succ_text': string;
  'redeem_fail_text': string;
  'redeem_status': RedeemFreeVIPStatus;
}
export function RedeemFreeVIPInfoToRequestData(data: RedeemFreeVIPInfo): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['redeem_succ_text', 'redeem_fail_text', 'redeem_status', ]),
  }
}
export interface RelativeUserStruct {
  'uid'?: string;
  'nickname'?: string;
  'remark_name'?: string;
  'artist_name'?: string;
  'medium_avatar_url'?: common.URLInfo;
  'thumb_avatar_url'?: common.URLInfo;
  'relation_source'?: RelationSourceType;
  'sec_uid'?: string;
}
export function RelativeUserStructToRequestData(data: RelativeUserStruct): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['uid', 'nickname', 'remark_name', 'artist_name', 'medium_avatar_url', 'thumb_avatar_url', 'relation_source', 'sec_uid', ]),
  }
}
export interface RewardAdBanner {
  'title': string;
  'content': string;
  'banner_status': BannerStatus;
  'banner_image'?: common.URLInfo;
  'button_text'?: string;
  'progress'?: ProgressNode[];
  'guide_text'?: string;
}
export function RewardAdBannerToRequestData(data: RewardAdBanner): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['title', 'content', 'banner_status', 'banner_image', 'button_text', 'progress', 'guide_text', ]),
  }
}
export interface SearchUserBrief {
  'user_brief'?: UserBrief;
  'count_follower': number;
  'count_video': number;
  'follow_status': FollowStatusType;
  'fandom_info'?: common.FandomInfo;
}
export function SearchUserBriefToRequestData(data: SearchUserBrief): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['user_brief', 'count_follower', 'count_video', 'follow_status', 'fandom_info', ]),
  }
}
export interface TabEntry {
  'entry_type': string;
  'entry_title': string;
}
export function TabEntryToRequestData(data: TabEntry): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['entry_type', 'entry_title', ]),
  }
}
export interface Text {
  'type': TextType;
  'plain_text'?: string;
}
export function TextToRequestData(data: Text): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['type', 'plain_text', ]),
  }
}
export interface TreasureBanner {
  'title': string;
  'content': string;
  'jump_link'?: string;
  'banner_image'?: common.URLInfo;
}
export function TreasureBannerToRequestData(data: TreasureBanner): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['title', 'content', 'jump_link', 'banner_image', ]),
  }
}
export interface UserBasic {
  'nickname': string;
  'medium_avatar_url'?: common.URLInfo;
  'thumb_avatar_url'?: common.URLInfo;
}
export function UserBasicToRequestData(data: UserBasic): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['nickname', 'medium_avatar_url', 'thumb_avatar_url', ]),
  }
}
export interface UserBrief {
  'id'?: string;
  'nickname'?: string;
  'medium_avatar_url'?: common.URLInfo;
  'thumb_avatar_url'?: common.URLInfo;
  'artist_id'?: string;
  'secret': boolean;
  'test_tag': number;
  'signature'?: string;
  'sec_uid'?: string;
  'luna_register_time'?: number;
  'vip_stage'?: string;
  'is_vip'?: boolean;
  'avatar_frame'?: AvatarFrame;
  'public_name'?: string;
  'is_luna_user': boolean;
  'membership_nameplate'?: string;
  'fans_nameplate'?: nameplate.FansNameplateItem;
}
export function UserBriefToRequestData(data: UserBrief): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['id', 'nickname', 'medium_avatar_url', 'thumb_avatar_url', 'artist_id', 'secret', 'test_tag', 'signature', 'sec_uid', 'luna_register_time', 'vip_stage', 'is_vip', 'avatar_frame', 'public_name', 'is_luna_user', 'membership_nameplate', 'fans_nameplate', ]),
  }
}
export interface UserForCard {
  'user_info'?: UserBrief;
  'subtitle'?: string;
  'link'?: string;
}
export function UserForCardToRequestData(data: UserForCard): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['user_info', 'subtitle', 'link', ]),
  }
}
export interface UserInfo {
  'id': string;
  'nickname': string;
  'douyin_id': string;
  'larger_avatar_url'?: common.URLInfo;
  'medium_avatar_url'?: common.URLInfo;
  'signature'?: string;
  'gender': string;
  'age'?: number;
  'display_locations'?: string[];
  'school'?: string;
  'secret': boolean;
  'artist_id'?: string;
  'ban_user_functions'?: number[];
  'follow_info_visibility': number;
  'location'?: UserLocation;
  'school_info'?: UserSchool;
  'user_artist_type': user_artist.UserArtistType;
  'artist_brief'?: artist.ArtistBrief;
  'sec_uid'?: string;
  'avatar_frame'?: AvatarFrame;
  'liked_playlist_show_douyin_video'?: boolean;
  'is_music_wall_visible': boolean;
  'is_luna_user': boolean;
  'public_name'?: string;
  'ip_location'?: string;
  'membership_nameplate'?: string;
  'fans_nameplate'?: nameplate.FansNameplateItem;
}
export function UserInfoToRequestData(data: UserInfo): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['id', 'nickname', 'douyin_id', 'larger_avatar_url', 'medium_avatar_url', 'signature', 'gender', 'age', 'display_locations', 'school', 'secret', 'artist_id', 'ban_user_functions', 'follow_info_visibility', 'location', 'school_info', 'user_artist_type', 'artist_brief', 'sec_uid', 'avatar_frame', 'liked_playlist_show_douyin_video', 'is_music_wall_visible', 'is_luna_user', 'public_name', 'ip_location', 'membership_nameplate', 'fans_nameplate', ]),
  }
}
export interface UserListenDuration {
  'total_duration': number;
  'sub_title': string;
  'version': string;
  'week_duration': number;
  'liked_count': number;
  'liked_by_me': boolean;
  'my_week_duration': number;
}
export function UserListenDurationToRequestData(data: UserListenDuration): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['total_duration', 'sub_title', 'version', 'week_duration', 'liked_count', 'liked_by_me', 'my_week_duration', ]),
  }
}
export interface UserLocation {
  'country': string;
  'iso_country_code': string;
  'province': string;
  'city': string;
  'district': string;
  'location_hide_level': number;
  'is_first_level_city': boolean;
}
export function UserLocationToRequestData(data: UserLocation): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['country', 'iso_country_code', 'province', 'city', 'district', 'location_hide_level', 'is_first_level_city', ]),
  }
}
export interface UserMusicWallTag {
  'tag': string;
  'tag_color'?: common.Colour;
}
export function UserMusicWallTagToRequestData(data: UserMusicWallTag): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['tag', 'tag_color', ]),
  }
}
export interface UserSchool {
  'school_name'?: string;
  'college_name'?: string;
  'enroll_year'?: number;
  'education'?: number;
  'school_visible'?: number;
  'can_modify_school_info'?: boolean;
  'can_modify_school_info_text'?: string;
}
export function UserSchoolToRequestData(data: UserSchool): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['school_name', 'college_name', 'enroll_year', 'education', 'school_visible', 'can_modify_school_info', 'can_modify_school_info_text', ]),
  }
}
export interface UserSpecialStats {
  'user_special_stats_type': UserSpecialStatsType;
  'user_special_stats_count': number;
}
export function UserSpecialStatsToRequestData(data: UserSpecialStats): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['user_special_stats_type', 'user_special_stats_count', ]),
  }
}
export interface UserStats {
  'count_all_liked': number;
  'count_following': number;
  'count_follower': number;
  'count_luna_following': number;
  'count_luna_follower': number;
  'count_asset': number;
  'all_comments_liked_detail'?: AllCommentsLikedDetail;
  'count_friend'?: number;
  'count_collected_media'?: number;
  'count_follower_str_exp'?: CountFollowerStrExp;
}
export function UserStatsToRequestData(data: UserStats): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['count_all_liked', 'count_following', 'count_follower', 'count_luna_following', 'count_luna_follower', 'count_asset', 'all_comments_liked_detail', 'count_friend', 'count_collected_media', 'count_follower_str_exp', ]),
  }
}
export interface UserVerification {
  'type'?: number;
  'text'?: string;
}
export function UserVerificationToRequestData(data: UserVerification): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['type', 'text', ]),
  }
}
export interface VIPInfo {
  'expire_date'?: string;
  'is_vip': boolean;
  'vip_stage': string;
}
export function VIPInfoToRequestData(data: VIPInfo): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['expire_date', 'is_vip', 'vip_stage', ]),
  }
}
export type BlockStatusType = number
export type DeviceBlockType = number
export type Entrytype = string
export type FollowStatusType = number
export type MeTabBannerType = string
export type RedeemFreeVIPStatus = number
export type RelationSourceType = number
export type UserSpecialStatsType = string
