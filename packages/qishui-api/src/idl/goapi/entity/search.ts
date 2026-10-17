// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'
import * as album from './album.js'
import * as artist from './artist.js'
import * as campaign from './campaign.js'
import * as chart from './chart.js'
import * as common from './common.js'
import * as feed from './feed.js'
import * as playlist from './playlist.js'
import * as track from './track.js'
import * as user from './user.js'
import * as video from './video.js'

export const Albums: string = 'albums'
export const Artists: string = 'artists'
export const ChartMediaTypeTrack: string = 'track'
export const ListenVideos: string = 'listen_video'
export const Playlists: string = 'playlists'
export const QueryClickBehaviorChart: string = 'chart'
export const QueryClickBehaviorDeeplink: string = 'deeplink'
export const QueryClickBehaviorFeed: string = 'feed'
export const QueryClickBehaviorSearch: string = 'search'
export const RelatedTracks: string = 'related_tracks'
export const SCENE_NAME_LISTEN_VIDEO: string = 'search_listen_video_tab'
export const SearchBlockTypeChart: string = 'search_chart'
export const SearchBlockTypeHint: string = 'search_hint'
export const SearchBlockTypeRecommendation: string = 'search_recommendation'
export const SearchChartNameHotSearchChart: string = 'hot_search_chart'
export const SearchChartNameHotSongChart: string = 'hot_song_chart'
export const SearchChartNameMusicianSongChart: string = 'musician_song_chart'
export const SearchChartNameNewSongChart: string = 'new_song_chart'
export const SearchChartTypeQuery: string = 'query'
export const SearchChartTypeTrack: string = 'track'
export const SearchDisplayTypeTrack: string = 'track'
export const SearchDisplayTypeUgcVideo: string = 'ugc_video'
export const SearchSceneVideoLoadMore: string = 'video_load_more'
export const SearchTypeAlbum: string = 'album'
export const SearchTypeAll: string = 'all'
export const SearchTypeAnniversary2023: string = 'anniversary_2023'
export const SearchTypeArtist: string = 'artist'
export const SearchTypeListenVideo: string = 'listen_video'
export const SearchTypePlaylist: string = 'playlist'
export const SearchTypeRelatedTrack: string = 'related_track'
export const SearchTypeTrack: string = 'track'
export const SearchTypeUser: string = 'user'
export const SearchTypeVideo: string = 'video'
export const SuggestTypeRecommendation: string = 'recommendation'
export const TopResults: string = 'top_results'
export const Tracks: string = 'tracks'
export const Users: string = 'users'
export const Videos: string = 'videos'
export enum EmptySearchType {
  Default = 0,
  BlockedByShark = 1,
  HitAntiDirt = 2,
}
export enum SearchQuerySource {
  Normal = 0,
  Manual = 1,
}
export enum SearchQueryTagType {
  Hot = 1,
  New = 2,
}
export interface DeeplinkEntity {
  'id': string;
  'title'?: string;
  'description'?: string;
  'image_url'?: common.URLInfo;
  'deeplink_url'?: string;
}
export function DeeplinkEntityToRequestData(data: DeeplinkEntity): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['id', 'title', 'description', 'image_url', 'deeplink_url', ]),
  }
}
export interface HintWord {
  'keyword'?: string;
  'deeplink'?: string;
  'source'?: string;
  'transit'?: SearchTransit;
  'prefix'?: string;
}
export function HintWordToRequestData(data: HintWord): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['keyword', 'deeplink', 'source', 'transit', 'prefix', ]),
  }
}
export interface QuickPlayInfo {
  'quick_play_deeplink_url'?: string;
  'landing_page_type'?: string;
}
export function QuickPlayInfoToRequestData(data: QuickPlayInfo): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['quick_play_deeplink_url', 'landing_page_type', ]),
  }
}
export interface SearchAllAlbum {
  'albums'?: album.Album[];
  'has_more'?: boolean;
}
export function SearchAllAlbumToRequestData(data: SearchAllAlbum): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['albums', 'has_more', ]),
  }
}
export interface SearchAllArtist {
  'artists'?: artist.Artist[];
  'has_more'?: boolean;
}
export function SearchAllArtistToRequestData(data: SearchAllArtist): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['artists', 'has_more', ]),
  }
}
export interface SearchAllDeeplink {
  'has_more'?: boolean;
  'deeplink_entities'?: DeeplinkEntity[];
}
export function SearchAllDeeplinkToRequestData(data: SearchAllDeeplink): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['has_more', 'deeplink_entities', ]),
  }
}
export interface SearchAllDiscoverRadio {
  'has_more'?: boolean;
  'discover_radios'?: SearchDiscoverRadio[];
}
export function SearchAllDiscoverRadioToRequestData(data: SearchAllDiscoverRadio): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['has_more', 'discover_radios', ]),
  }
}
export interface SearchAllPlaylist {
  'has_more'?: boolean;
  'playlists'?: playlist.Playlist[];
}
export function SearchAllPlaylistToRequestData(data: SearchAllPlaylist): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['has_more', 'playlists', ]),
  }
}
export interface SearchAllSceneMode {
  'has_more'?: boolean;
  'scene_modes'?: SearchSceneMode[];
}
export function SearchAllSceneModeToRequestData(data: SearchAllSceneMode): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['has_more', 'scene_modes', ]),
  }
}
export interface SearchAllTrack {
  'has_more'?: boolean;
  'tracks'?: track.Track[];
}
export function SearchAllTrackToRequestData(data: SearchAllTrack): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['has_more', 'tracks', ]),
  }
}
export interface SearchAllUser {
  'users'?: user.SearchUserBrief[];
  'has_more'?: boolean;
}
export function SearchAllUserToRequestData(data: SearchAllUser): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['users', 'has_more', ]),
  }
}
export interface SearchAllVideo {
  'has_more'?: boolean;
  'videos'?: video.Video[];
  'next_cursor'?: string;
}
export function SearchAllVideoToRequestData(data: SearchAllVideo): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['has_more', 'videos', 'next_cursor', ]),
  }
}
export interface SearchChart {
  'id'?: string;
  'title'?: string;
  'issue_date'?: string;
  'content'?: SearchChartQuery[];
  'version'?: number;
  'type'?: SearchChartType;
  'need_play_button'?: boolean;
  'issue_note'?: string;
  'name'?: string;
  'style'?: SearchChartStyleConfig;
}
export function SearchChartToRequestData(data: SearchChart): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['id', 'title', 'issue_date', 'content', 'version', 'type', 'need_play_button', 'issue_note', 'name', 'style', ]),
  }
}
export interface SearchChartBlock {
  'charts'?: SearchChart[];
  'hybrid_url'?: string;
}
export function SearchChartBlockToRequestData(data: SearchChartBlock): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['charts', 'hybrid_url', ]),
  }
}
export interface SearchChartQuery {
  'rank'?: number;
  'keyword'?: string;
  'source'?: SearchQuerySource;
  'tags'?: SearchQueryTag[];
  'deeplink'?: string;
  'behavior'?: QueryClickBehavior;
  'media_type'?: ChartMediaType;
  'media_id'?: string;
  'rank_delta'?: number;
  'artists'?: artist.ArtistLink[];
  'album'?: album.AlbumLink;
}
export function SearchChartQueryToRequestData(data: SearchChartQuery): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['rank', 'keyword', 'source', 'tags', 'deeplink', 'behavior', 'media_type', 'media_id', 'rank_delta', 'artists', 'album', ]),
  }
}
export interface SearchChartStyleConfig {
  'title_select_color'?: string;
  'bg_color'?: string;
  'bg_cover'?: string;
}
export function SearchChartStyleConfigToRequestData(data: SearchChartStyleConfig): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['title_select_color', 'bg_color', 'bg_cover', ]),
  }
}
export interface SearchDiscoverRadio {
  'id'?: number;
  'title'?: string;
  'subtitle'?: string;
  'image_url'?: common.URLInfo;
  'sub_queue_type'?: string;
  'deeplink'?: string;
}
export function SearchDiscoverRadioToRequestData(data: SearchDiscoverRadio): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['id', 'title', 'subtitle', 'image_url', 'sub_queue_type', 'deeplink', ]),
  }
}
export interface SearchEntity {
  'album'?: album.Album;
  'artist'?: artist.Artist;
  'track'?: track.Track;
  'playlist'?: playlist.Playlist;
  'video'?: video.Video;
  'deeplink'?: DeeplinkEntity;
  'scene_mode'?: SearchSceneMode;
  'search_segment'?: SearchSegment;
  'radio'?: SearchDiscoverRadio;
  'user'?: user.SearchUserBrief;
  'track_wrapper'?: track.TrackWrapper;
  'mini_app'?: common.MiniAppInfo;
}
export function SearchEntityToRequestData(data: SearchEntity): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['album', 'artist', 'track', 'playlist', 'video', 'deeplink', 'scene_mode', 'search_segment', 'radio', 'user', 'track_wrapper', 'mini_app', ]),
  }
}
export interface SearchExtraInfo {
  'empty_search'?: EmptySearchType;
  'background_color'?: string;
  'log_extra'?: string;
  'search_related_info'?: string;
  'search_listen_guide'?: SearchListenGuide;
}
export function SearchExtraInfoToRequestData(data: SearchExtraInfo): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['empty_search', 'background_color', 'log_extra', 'search_related_info', 'search_listen_guide', ]),
  }
}
export interface SearchItemActivityMatch {
  'activity_name': string;
  'query_type': string;
}
export function SearchItemActivityMatchToRequestData(data: SearchItemActivityMatch): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['activity_name', 'query_type', ]),
  }
}
export interface SearchItemDisplayStyle {
  'display_type'?: string;
}
export function SearchItemDisplayStyleToRequestData(data: SearchItemDisplayStyle): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['display_type', ]),
  }
}
export interface SearchItemTrackMatch {
  'track_name': string;
  'track_id': string;
  'playable': boolean;
}
export function SearchItemTrackMatchToRequestData(data: SearchItemTrackMatch): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['track_name', 'track_id', 'playable', ]),
  }
}
export interface SearchListenGuide {
  'description': string;
  'schema': string;
}
export function SearchListenGuideToRequestData(data: SearchListenGuide): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['description', 'schema', ]),
  }
}
export interface SearchMeta {
  'item_type': string;
  'lyrics_match'?: SearchTrackLyricsMatch;
  'doc_id'?: string;
  'track_match'?: SearchItemTrackMatch;
  'activity_match'?: SearchItemActivityMatch;
  'display_style'?: SearchItemDisplayStyle;
  'rel_score'?: string;
  'quick_play_info'?: QuickPlayInfo;
}
export function SearchMetaToRequestData(data: SearchMeta): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['item_type', 'lyrics_match', 'doc_id', 'track_match', 'activity_match', 'display_style', 'rel_score', 'quick_play_info', ]),
  }
}
export interface SearchQueryTag {
  'type'?: SearchQueryTagType;
  'title'?: string;
  'title_color'?: string;
  'background_color'?: string;
  'border_radius'?: string;
}
export function SearchQueryTagToRequestData(data: SearchQueryTag): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['type', 'title', 'title_color', 'background_color', 'border_radius', ]),
  }
}
export interface SearchResultGroup {
  'id': SearchResultID;
  'next_cursor': string;
  'has_more': boolean;
  'data'?: SearchResultItem[];
  'display_view_all': boolean;
  'display_title': string;
  'description': string;
  'bottom_desc': string;
  'display_type': string;
}
export function SearchResultGroupToRequestData(data: SearchResultGroup): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['id', 'next_cursor', 'has_more', 'data', 'display_view_all', 'display_title', 'description', 'bottom_desc', 'display_type', ]),
  }
}
export interface SearchResultItem {
  'meta'?: SearchMeta;
  'entity'?: SearchEntity;
}
export function SearchResultItemToRequestData(data: SearchResultItem): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['meta', 'entity', ]),
  }
}
export interface SearchSceneMode {
  'id'?: number;
  'title'?: string;
  'description'?: string;
  'image_url'?: common.URLInfo;
  'sub_queue_type'?: string;
  'style_type'?: Uint8Array;
}
export function SearchSceneModeToRequestData(data: SearchSceneMode): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['id', 'title', 'description', 'image_url', 'sub_queue_type', 'style_type', ]),
  }
}
export interface SearchSegment {
  'title'?: string;
  'top_delimiter': boolean;
}
export function SearchSegmentToRequestData(data: SearchSegment): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['title', 'top_delimiter', ]),
  }
}
export interface SearchTrackLyricsMatch {
  'snippet': string;
  'match_start_index': number;
  'match_end_index': number;
}
export function SearchTrackLyricsMatchToRequestData(data: SearchTrackLyricsMatch): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['snippet', 'match_start_index', 'match_end_index', ]),
  }
}
export interface SearchTransit {
  'hint_radio_id'?: number;
  'extra'?: string;
}
export function SearchTransitToRequestData(data: SearchTransit): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['hint_radio_id', 'extra', ]),
  }
}
export interface SugEntity {
  'album'?: album.Album;
  'artist'?: artist.Artist;
  'track'?: track.Track;
  'playlist'?: playlist.Playlist;
}
export function SugEntityToRequestData(data: SugEntity): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['album', 'artist', 'track', 'playlist', ]),
  }
}
export interface SugEntry {
  'suggestion'?: string;
  'content_type'?: string;
  'entity'?: SugEntity;
  'group_id'?: string;
}
export function SugEntryToRequestData(data: SugEntry): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['suggestion', 'content_type', 'entity', 'group_id', ]),
  }
}
export interface SuggestWord {
  'keyword'?: string;
  'group_id'?: string;
  'type'?: string;
  '-': number;
  '-': number;
}
export function SuggestWordToRequestData(data: SuggestWord): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['keyword', 'group_id', 'type', '-', '-', ]),
  }
}
export type ChartMediaType = string
export type QueryClickBehavior = string
export type SearchBlockType = string
export type SearchChartName = string
export type SearchChartType = string
export type SearchDisplayType = string
export type SearchResultID = string
export type SearchScene = string
export type SearchType = string
export type SuggestType = string
