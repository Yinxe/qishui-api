// AUTOGEN —— 由官方分发包 sourcemap 整理生成，请勿手改。
/* eslint-disable */
import * as ns0 from './idl/goapi/main.js'
import * as ns1 from './idl/user/main.js'
import * as ns2 from './idl/commerce/main.js'
import * as ns3 from './idl/commerce_membership/main.js'

export interface EndpointField {
  name: string
  loc: 'params' | 'query' | 'body'
  required: boolean
  type: string
}
export interface EndpointDef {
  /** 调用用 key；跨模块重名时形如 `commerce_membership_GetUpsell` */
  key: string
  /** IDL 里的原始 name */
  name: string
  module: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  paths: { method: string; path: string }[]
  fields: EndpointField[]
  /** 官方客户端 idlMethods 注册表里有这个接口 */
  official: boolean
  /** 官方客户端注册表里声明的 HTTP 方法（决定多 path/多 method 时选哪个） */
  declaredMethod: string | null
  /** 存在 /luna/pc/ 变体 */
  pcVariant: boolean
  /** 标记（不影响调用）：播放地址类接口，匿名实测上游拒答（1000062 / 空响应）。库照发请求，上游为准 */
  gated: boolean
  login: 'static' | 'unknown'
  /** 重名端点的裸名别名 */
  alias?: string
  reqType: string
  resType: string
}

export const ENDPOINT_DATA = [
  {
    "key": "AcceptFollow",
    "name": "AcceptFollow",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/me/follow/accept",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/me/follow/accept"
      }
    ],
    "fields": [
      {
        "name": "user_id",
        "loc": "body",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "me.AcceptFollowRequest",
    "resType": "me.AcceptFollowResponse"
  },
  {
    "key": "AiAssistantRelated",
    "name": "AiAssistantRelated",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/media/assistant/related",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/media/assistant/related"
      }
    ],
    "fields": [
      {
        "name": "unlimited_flow_info",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "conversation_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "message_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "agent_session_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "feed_request",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "last_viewed_media",
        "loc": "body",
        "required": false,
        "type": "media.Media"
      },
      {
        "name": "play_list",
        "loc": "body",
        "required": false,
        "type": "number[]"
      },
      {
        "name": "skip_list",
        "loc": "body",
        "required": false,
        "type": "number[]"
      },
      {
        "name": "client_info_map",
        "loc": "body",
        "required": false,
        "type": "Record<string, string>"
      },
      {
        "name": "req_count",
        "loc": "body",
        "required": false,
        "type": "number"
      },
      {
        "name": "first_req_time",
        "loc": "body",
        "required": false,
        "type": "number"
      },
      {
        "name": "count",
        "loc": "body",
        "required": false,
        "type": "number"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "ai_assistant.AiAssistantRelatedRequest",
    "resType": "ai_assistant.AiAssistantRelatedResponse"
  },
  {
    "key": "AIBotChat",
    "name": "AIBotChat",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/im/ai_bot/chat",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/im/ai_bot/chat"
      }
    ],
    "fields": [
      {
        "name": "meta",
        "loc": "body",
        "required": false,
        "type": "ChatMeta"
      },
      {
        "name": "messages",
        "loc": "body",
        "required": false,
        "type": "ChatMessage[]"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "ai_bot.AIBotChatRequest",
    "resType": "ai_bot.AIBotChatResponse"
  },
  {
    "key": "AIBotTrigger",
    "name": "AIBotTrigger",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/im/ai_bot/trigger",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/im/ai_bot/trigger"
      }
    ],
    "fields": [
      {
        "name": "meta",
        "loc": "body",
        "required": false,
        "type": "ChatMeta"
      },
      {
        "name": "messages",
        "loc": "body",
        "required": false,
        "type": "ChatMessage[]"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "ai_bot.AIBotChatRequest",
    "resType": "ai_bot.AIBotChatResponse"
  },
  {
    "key": "AppendLaterListen",
    "name": "AppendLaterListen",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/me/later-listen/append",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/me/later-listen/append"
      }
    ],
    "fields": [
      {
        "name": "media",
        "loc": "body",
        "required": false,
        "type": "media.Media[]"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "me.AppendLaterListenRequest",
    "resType": "me.AppendLaterListenResponse"
  },
  {
    "key": "AppendRecentlyPlayedMedia",
    "name": "AppendRecentlyPlayedMedia",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": "POST",
    "pcVariant": true,
    "path": "/luna/pc/me/recently-played-media",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/me/recently-played-media"
      },
      {
        "method": "POST",
        "path": "/luna/pc/me/recently-played-media"
      }
    ],
    "fields": [
      {
        "name": "media",
        "loc": "body",
        "required": false,
        "type": "media.Media[]"
      }
    ],
    "official": true,
    "gated": false,
    "login": "static",
    "reqType": "me.AppendRecentlyPlayedMediaRequest",
    "resType": "general.GeneralResponse"
  },
  {
    "key": "AppendRecentPlayedTracks",
    "name": "AppendRecentPlayedTracks",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/me/recently-played",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/me/recently-played"
      }
    ],
    "fields": [
      {
        "name": "track_ids",
        "loc": "body",
        "required": false,
        "type": "string[]"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "me.AppendRecentPlayedTracksRequest",
    "resType": "general.GeneralResponse"
  },
  {
    "key": "ApplyFreeVip",
    "name": "ApplyFreeVip",
    "module": "commerce_membership",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/commerce/v2/apply_free_vip",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/commerce/v2/apply_free_vip"
      }
    ],
    "fields": [],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "ApplyFreeVipRequest",
    "resType": "ApplyFreeVipResponse"
  },
  {
    "key": "BookAlbum",
    "name": "BookAlbum",
    "module": "commerce_membership",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/commerce/v2/album/book",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/commerce/v2/album/book"
      }
    ],
    "fields": [
      {
        "name": "activity_id",
        "loc": "body",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "BookAlbumRequest",
    "resType": "BookAlbumResponse"
  },
  {
    "key": "BoostArtists",
    "name": "BoostArtists",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/boost/artists",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/boost/artists"
      }
    ],
    "fields": [
      {
        "name": "req_no",
        "loc": "body",
        "required": false,
        "type": "number"
      },
      {
        "name": "new_showed_artists",
        "loc": "body",
        "required": false,
        "type": "number[]"
      },
      {
        "name": "all_selected_artists",
        "loc": "body",
        "required": false,
        "type": "number[]"
      },
      {
        "name": "source_artists",
        "loc": "body",
        "required": false,
        "type": "number[]"
      },
      {
        "name": "selected_genres",
        "loc": "body",
        "required": false,
        "type": "number[]"
      },
      {
        "name": "selected_langs",
        "loc": "body",
        "required": false,
        "type": "string[]"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "feed.BoostArtistsRequest",
    "resType": "feed.BoostArtistsResponse"
  },
  {
    "key": "CancelAccount",
    "name": "CancelAccount",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/me/cancel",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/me/cancel"
      }
    ],
    "fields": [],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "me.CancelAccountRequest",
    "resType": "me.CancelAccountResponse"
  },
  {
    "key": "CancelBlockUser",
    "name": "CancelBlockUser",
    "module": "goapi",
    "method": "DELETE",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/me/block",
    "paths": [
      {
        "method": "DELETE",
        "path": "/luna/me/block"
      }
    ],
    "fields": [
      {
        "name": "to_user_id",
        "loc": "query",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "me.CancelBlockUserRequest",
    "resType": "me.CancelBlockUserResponse"
  },
  {
    "key": "CancelBlockV2",
    "name": "CancelBlockV2",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": "POST",
    "pcVariant": true,
    "path": "/luna/pc/me/block_v2/cancel",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/me/block_v2/cancel"
      },
      {
        "method": "POST",
        "path": "/luna/pc/me/block_v2/cancel"
      }
    ],
    "fields": [
      {
        "name": "block_items",
        "loc": "body",
        "required": false,
        "type": "user.BlockItem[]"
      }
    ],
    "official": true,
    "gated": false,
    "login": "static",
    "reqType": "me.CancelBlockV2Request",
    "resType": "me.CancelBlockV2Response"
  },
  {
    "key": "CancelChannelSubs",
    "name": "CancelChannelSubs",
    "module": "commerce_membership",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/commerce/v2/cancel_channel_subs",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/commerce/v2/cancel_channel_subs"
      }
    ],
    "fields": [],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "CancelChannelSubsRequest",
    "resType": "CancelChannelSubsResponse"
  },
  {
    "key": "CancelSubscription",
    "name": "CancelSubscription",
    "module": "commerce",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/commerce/offers/cancel",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/commerce/offers/cancel"
      }
    ],
    "fields": [],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "CancelSubscriptionRequest",
    "resType": "CancelSubscriptionResponse"
  },
  {
    "key": "CheckCode",
    "name": "CheckCode",
    "module": "commerce_membership",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/commerce/v2/code/check",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/commerce/v2/code/check"
      }
    ],
    "fields": [
      {
        "name": "code",
        "loc": "body",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "CheckCodeRequest",
    "resType": "CheckCodeResponse"
  },
  {
    "key": "CheckDownload",
    "name": "CheckDownload",
    "module": "commerce_membership",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/commerce/v2/check_download",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/commerce/v2/check_download"
      }
    ],
    "fields": [
      {
        "name": "tracks",
        "loc": "body",
        "required": false,
        "type": "benefit.DownloadItem[]"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "CheckDownloadRequest",
    "resType": "CheckDownloadResponse"
  },
  {
    "key": "CheckRedeemCodeFromPhysicalCard",
    "name": "CheckRedeemCodeFromPhysicalCard",
    "module": "commerce",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/commerce/code/check",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/commerce/code/check"
      }
    ],
    "fields": [
      {
        "name": "code",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "sign",
        "loc": "body",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "CheckRedeemCodeRequest",
    "resType": "CheckRedeemCodeResponse"
  },
  {
    "key": "CheckSensitiveWords",
    "name": "CheckSensitiveWords",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/me/playlist/wordcheck",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/me/playlist/wordcheck"
      }
    ],
    "fields": [
      {
        "name": "content",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "type",
        "loc": "query",
        "required": true,
        "type": "SensitiveWordCheckType"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "playlist.SensitiveWordCheckRequest",
    "resType": "playlist.SensitiveWordCheckResponse"
  },
  {
    "key": "CheckTrack",
    "name": "CheckTrack",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/track/check",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/track/check"
      }
    ],
    "fields": [
      {
        "name": "track_id",
        "loc": "query",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "track.CheckTrackRequest",
    "resType": "track.CheckTrackResponse"
  },
  {
    "key": "CheckUpdate",
    "name": "CheckUpdate",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/check-update",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/check-update"
      }
    ],
    "fields": [
      {
        "name": "media_list",
        "loc": "query",
        "required": false,
        "type": "media.ReqMedia[]"
      },
      {
        "name": "scene",
        "loc": "body",
        "required": false,
        "type": "number"
      },
      {
        "name": "scene_name",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "queue_type",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "media_list",
        "loc": "body",
        "required": false,
        "type": "media.ReqMedia[]"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "media.CheckUpdateRequest",
    "resType": "media.CheckUpdateResponse"
  },
  {
    "key": "CollectAlbums",
    "name": "CollectAlbums",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": "POST",
    "pcVariant": true,
    "path": "/luna/pc/me/collection/album",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/me/collection/album"
      },
      {
        "method": "POST",
        "path": "/luna/pc/me/collection/album"
      }
    ],
    "fields": [
      {
        "name": "album_ids",
        "loc": "body",
        "required": false,
        "type": "string[]"
      }
    ],
    "official": true,
    "gated": false,
    "login": "static",
    "reqType": "me.CollectAlbumRequest",
    "resType": "me.CollectAlbumResponse"
  },
  {
    "key": "CollectArtists",
    "name": "CollectArtists",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": "POST",
    "pcVariant": true,
    "path": "/luna/pc/me/collection/artist",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/me/collection/artist"
      },
      {
        "method": "POST",
        "path": "/luna/pc/me/collection/artist"
      }
    ],
    "fields": [
      {
        "name": "artist_ids",
        "loc": "body",
        "required": false,
        "type": "string[]"
      }
    ],
    "official": true,
    "gated": false,
    "login": "static",
    "reqType": "me.CollectArtistsRequest",
    "resType": "me.CollectArtistsResponse"
  },
  {
    "key": "CollectFlowTracks",
    "name": "CollectFlowTracks",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/flow/collection/track",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/flow/collection/track"
      }
    ],
    "fields": [
      {
        "name": "track_ids",
        "loc": "body",
        "required": false,
        "type": "number[]"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "flow_contract.CollectFlowTracksRequest",
    "resType": "flow_contract.CollectFlowTracksResponse"
  },
  {
    "key": "CollectMediaList",
    "name": "CollectMediaList",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": "POST",
    "pcVariant": true,
    "path": "/luna/pc/me/collection/media",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/me/collection/media"
      },
      {
        "method": "POST",
        "path": "/luna/pc/me/collection/media"
      }
    ],
    "fields": [
      {
        "name": "media",
        "loc": "body",
        "required": false,
        "type": "media.Media[]"
      },
      {
        "name": "scene",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "collect_action",
        "loc": "body",
        "required": true,
        "type": "CollectActionType"
      }
    ],
    "official": true,
    "gated": false,
    "login": "static",
    "reqType": "me.CollectMediaListRequest",
    "resType": "me.CollectMediaListResponse"
  },
  {
    "key": "CollectPlaylists",
    "name": "CollectPlaylists",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": "POST",
    "pcVariant": true,
    "path": "/luna/pc/me/collection/playlist",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/me/collection/playlist"
      },
      {
        "method": "POST",
        "path": "/luna/pc/me/collection/playlist"
      }
    ],
    "fields": [
      {
        "name": "playlist_ids",
        "loc": "body",
        "required": false,
        "type": "string[]"
      }
    ],
    "official": true,
    "gated": false,
    "login": "static",
    "reqType": "me.CollectPlaylistRequest",
    "resType": "me.CollectPlaylistResponse"
  },
  {
    "key": "CollectTracks",
    "name": "CollectTracks",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": "POST",
    "pcVariant": false,
    "path": "/luna/me/collection/track",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/me/collection/track"
      }
    ],
    "fields": [
      {
        "name": "track_ids",
        "loc": "body",
        "required": false,
        "type": "string[]"
      }
    ],
    "official": true,
    "gated": false,
    "login": "static",
    "reqType": "me.CollectTracksRequest",
    "resType": "me.CollectTracksResponse"
  },
  {
    "key": "CommentAction",
    "name": "CommentAction",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": "POST",
    "pcVariant": true,
    "path": "/luna/pc/comments/action",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/comments/action"
      },
      {
        "method": "POST",
        "path": "/luna/pc/comments/action"
      }
    ],
    "fields": [
      {
        "name": "comment_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "reply_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "group_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "type",
        "loc": "body",
        "required": true,
        "type": "number"
      },
      {
        "name": "scene_name",
        "loc": "body",
        "required": true,
        "type": "string"
      }
    ],
    "official": true,
    "gated": false,
    "login": "unknown",
    "reqType": "comment.CommentActionRequest",
    "resType": "comment.CommentActionResponse"
  },
  {
    "key": "CommentAudioAsr",
    "name": "CommentAudioAsr",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/comment/audio_asr",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/comment/audio_asr"
      }
    ],
    "fields": [
      {
        "name": "comment_id",
        "loc": "query",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "comment.CommentAudioAsrRequest",
    "resType": "comment.CommentAudioAsrResponse"
  },
  {
    "key": "commerce_membership_PrepayQuery",
    "name": "PrepayQuery",
    "module": "commerce_membership",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/commerce/v2/prepay_query",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/commerce/v2/prepay_query"
      }
    ],
    "fields": [
      {
        "name": "prepay_query_offers",
        "loc": "body",
        "required": false,
        "type": "trade.PrepayQueryOffer[]"
      },
      {
        "name": "pay_channel_horizontal_layout",
        "loc": "body",
        "required": false,
        "type": "boolean"
      },
      {
        "name": "biz_scene",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "cj_sdk_version",
        "loc": "body",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "PrepayQueryRequest",
    "resType": "PrepayQueryResponse"
  },
  {
    "key": "commerce_membership_RedeemCode",
    "name": "RedeemCode",
    "module": "commerce_membership",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/commerce/v2/code/redeem",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/commerce/v2/code/redeem"
      }
    ],
    "fields": [
      {
        "name": "code",
        "loc": "body",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "RedeemCodeRequest",
    "resType": "RedeemCodeResponse"
  },
  {
    "key": "commerce_membership_ReportAction",
    "name": "ReportAction",
    "module": "commerce_membership",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/commerce/v2/report_action",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/commerce/v2/report_action"
      }
    ],
    "fields": [
      {
        "name": "actions",
        "loc": "body",
        "required": false,
        "type": "action.Action[]"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "ReportActionRequest",
    "resType": "ReportActionResponse"
  },
  {
    "key": "commerce_PrepayQuery",
    "name": "PrepayQuery",
    "module": "commerce",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/commerce/offers/prepay_query",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/commerce/offers/prepay_query"
      }
    ],
    "fields": [
      {
        "name": "prepay_query_offers",
        "loc": "query",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "PrepayQueryRequest",
    "resType": "PrepayQueryResponse"
  },
  {
    "key": "commerce_RedeemCode",
    "name": "RedeemCode",
    "module": "commerce",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/commerce/code/redeem",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/commerce/code/redeem"
      }
    ],
    "fields": [
      {
        "name": "code",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "sign",
        "loc": "body",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "RedeemVipCodeRequest",
    "resType": "RedeemVipCodeResponse"
  },
  {
    "key": "commerce_ReportAction",
    "name": "ReportAction",
    "module": "commerce",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/commerce/action",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/commerce/action"
      }
    ],
    "fields": [
      {
        "name": "action_type",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "item_type",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "action_items",
        "loc": "body",
        "required": false,
        "type": "ActionItem[]"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "ReportActionRequest",
    "resType": "ReportActionResponse"
  },
  {
    "key": "CommitAudit",
    "name": "CommitAudit",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/audit/commit",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/audit/commit"
      }
    ],
    "fields": [
      {
        "name": "scene",
        "loc": "body",
        "required": false,
        "type": "audit.AuditScene"
      },
      {
        "name": "content",
        "loc": "body",
        "required": false,
        "type": "audit.AuditContent"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "audit.CommitAuditRequest",
    "resType": "audit.CommitAuditResponse"
  },
  {
    "key": "CommitBlockUser",
    "name": "CommitBlockUser",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/me/block",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/me/block"
      }
    ],
    "fields": [
      {
        "name": "to_user_id",
        "loc": "body",
        "required": true,
        "type": "number"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "me.CommitBlockUserRequest",
    "resType": "me.CommitBlockUserResponse"
  },
  {
    "key": "CommitBlockV2",
    "name": "CommitBlockV2",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": "POST",
    "pcVariant": true,
    "path": "/luna/pc/me/block_v2",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/me/block_v2"
      },
      {
        "method": "POST",
        "path": "/luna/pc/me/block_v2"
      }
    ],
    "fields": [
      {
        "name": "block_items",
        "loc": "body",
        "required": false,
        "type": "user.BlockItem[]"
      }
    ],
    "official": true,
    "gated": false,
    "login": "static",
    "reqType": "me.CommitBlocV2Request",
    "resType": "me.CommitBlocV2Response"
  },
  {
    "key": "ConfirmBannerTest",
    "name": "ConfirmBannerTest",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/activities/confirm",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/activities/confirm"
      }
    ],
    "fields": [
      {
        "name": "activity_id",
        "loc": "body",
        "required": true,
        "type": "number"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "activity.ConfirmActivityTestRequest",
    "resType": "activity.ConfirmActivityTestResponse"
  },
  {
    "key": "ConnPlugs",
    "name": "ConnPlugs",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/plug/conn_plugs",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/plug/conn_plugs"
      }
    ],
    "fields": [
      {
        "name": "item",
        "loc": "body",
        "required": false,
        "type": "item.Item"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "plug.ConnPlugsRequest",
    "resType": "plug.ConnPlugsResponse"
  },
  {
    "key": "ConsumeBenefit",
    "name": "ConsumeBenefit",
    "module": "commerce_membership",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/commerce/v2/consume_benefit",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/commerce/v2/consume_benefit"
      }
    ],
    "fields": [
      {
        "name": "downloads",
        "loc": "body",
        "required": false,
        "type": "benefit.DownloadItem[]"
      },
      {
        "name": "audio_effect",
        "loc": "body",
        "required": false,
        "type": "benefit.AudioEffectItem"
      },
      {
        "name": "activity",
        "loc": "body",
        "required": false,
        "type": "benefit.ActivityItem"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "ConsumeBenefitRequest",
    "resType": "ConsumeBenefitResponse"
  },
  {
    "key": "CreateAnniversaryPlaylist2024",
    "name": "CreateAnniversaryPlaylist2024",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/summary-2024/playlist/create",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/summary-2024/playlist/create"
      }
    ],
    "fields": [
      {
        "name": "mock_user_id",
        "loc": "query",
        "required": false,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "summary2024.CreateAnniversaryPlaylist2024Request",
    "resType": "summary2024.CreateAnniversaryPlaylist2024Response"
  },
  {
    "key": "CreateAnniversaryPlaylist2025",
    "name": "CreateAnniversaryPlaylist2025",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/summary-2025/playlist/create",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/summary-2025/playlist/create"
      }
    ],
    "fields": [
      {
        "name": "mock_user_id",
        "loc": "query",
        "required": false,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "summary2025.CreateAnniversaryPlaylist2025Request",
    "resType": "summary2025.CreateAnniversaryPlaylist2025Response"
  },
  {
    "key": "CreateComment",
    "name": "CreateComment",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": "POST",
    "pcVariant": true,
    "path": "/luna/pc/comments/create",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/comments/create"
      },
      {
        "method": "POST",
        "path": "/luna/pc/comments/create"
      }
    ],
    "fields": [
      {
        "name": "group_id",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "text",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "reply_id",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "reply_to_reply_id",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "reply_to_user_id",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "comment_type",
        "loc": "body",
        "required": false,
        "type": "comment.SpecialCommentType"
      },
      {
        "name": "group_type",
        "loc": "body",
        "required": false,
        "type": "GroupType"
      },
      {
        "name": "hashtags",
        "loc": "body",
        "required": false,
        "type": "hashtag.HashtagBrief[]"
      },
      {
        "name": "text_extra",
        "loc": "body",
        "required": false,
        "type": "comment.TextExtra[]"
      },
      {
        "name": "image_list",
        "loc": "body",
        "required": false,
        "type": "comment.Image[]"
      },
      {
        "name": "audio",
        "loc": "body",
        "required": false,
        "type": "comment.AudioInput"
      }
    ],
    "official": true,
    "gated": false,
    "login": "unknown",
    "reqType": "comment.CreateCommentRequest",
    "resType": "comment.CreateCommentResponse"
  },
  {
    "key": "CreatePlaylist",
    "name": "CreatePlaylist",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": "POST",
    "pcVariant": true,
    "path": "/luna/pc/me/playlist",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/me/playlist"
      },
      {
        "method": "POST",
        "path": "/luna/pc/me/playlist"
      }
    ],
    "fields": [
      {
        "name": "name",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "is_private",
        "loc": "body",
        "required": false,
        "type": "boolean"
      },
      {
        "name": "track_ids",
        "loc": "body",
        "required": false,
        "type": "string[]"
      },
      {
        "name": "media",
        "loc": "body",
        "required": false,
        "type": "media.Media[]"
      }
    ],
    "official": true,
    "gated": false,
    "login": "static",
    "reqType": "playlist.CreatePlaylistRequest",
    "resType": "playlist.CreatePlaylistResponse"
  },
  {
    "key": "CreateRoom",
    "name": "CreateRoom",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/social/mate/room/create",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/social/mate/room/create"
      }
    ],
    "fields": [
      {
        "name": "room_type",
        "loc": "body",
        "required": true,
        "type": "number"
      },
      {
        "name": "media",
        "loc": "body",
        "required": false,
        "type": "media.Media"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "music_mate.CreateRoomRequest",
    "resType": "music_mate.CreateRoomResponse"
  },
  {
    "key": "CreateSummary2023Video",
    "name": "CreateSummary2023Video",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/summary2023/create_video",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/summary2023/create_video"
      }
    ],
    "fields": [
      {
        "name": "track_id",
        "loc": "body",
        "required": true,
        "type": "number"
      },
      {
        "name": "video_type",
        "loc": "body",
        "required": true,
        "type": "summary2023.Summary2023VideoType"
      },
      {
        "name": "media_list",
        "loc": "body",
        "required": false,
        "type": "summary2023.Summary2023VideoMedia[]"
      },
      {
        "name": "audio_type",
        "loc": "body",
        "required": true,
        "type": "summary2023.AudioTypeEnum"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "summary2023.CreateSummary2023VideoRequest",
    "resType": "summary2023.CreateSummary2023VideoResponse"
  },
  {
    "key": "DeleteCollectedFlowTracks",
    "name": "DeleteCollectedFlowTracks",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/flow/collection/delete_track",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/flow/collection/delete_track"
      }
    ],
    "fields": [
      {
        "name": "track_ids",
        "loc": "body",
        "required": false,
        "type": "number[]"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "flow_contract.DeleteCollectedFlowTracksRequest",
    "resType": "flow_contract.DeleteCollectedFlowTracksResponse"
  },
  {
    "key": "DeleteCollectedMediaList",
    "name": "DeleteCollectedMediaList",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": "POST",
    "pcVariant": true,
    "path": "/luna/pc/me/collection/media/delete",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/me/collection/media/delete"
      },
      {
        "method": "POST",
        "path": "/luna/pc/me/collection/media/delete"
      }
    ],
    "fields": [
      {
        "name": "media",
        "loc": "body",
        "required": false,
        "type": "media.Media[]"
      }
    ],
    "official": true,
    "gated": false,
    "login": "static",
    "reqType": "me.DeleteCollectedMediaListRequest",
    "resType": "me.DeleteCollectedMediaListResponse"
  },
  {
    "key": "DeleteComment",
    "name": "DeleteComment",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": "POST",
    "pcVariant": true,
    "path": "/luna/pc/comments/delete",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/comments/delete"
      },
      {
        "method": "POST",
        "path": "/luna/pc/comments/delete"
      }
    ],
    "fields": [
      {
        "name": "comment_id",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "reply_id",
        "loc": "body",
        "required": false,
        "type": "string"
      }
    ],
    "official": true,
    "gated": false,
    "login": "unknown",
    "reqType": "comment.DeleteCommentRequest",
    "resType": "comment.DeleteCommentResponse"
  },
  {
    "key": "DeleteMsg",
    "name": "DeleteMsg",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/notification/delete",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/notification/delete"
      }
    ],
    "fields": [
      {
        "name": "msg_id",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "msg_type",
        "loc": "query",
        "required": true,
        "type": "number"
      },
      {
        "name": "msg_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "msg_type",
        "loc": "body",
        "required": true,
        "type": "number"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "message.DeleteMsgRequest",
    "resType": "general.GeneralResponse"
  },
  {
    "key": "DeletePlaylistMedia",
    "name": "DeletePlaylistMedia",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": "POST",
    "pcVariant": true,
    "path": "/luna/pc/me/playlist/media/delete",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/me/playlist/media/delete"
      },
      {
        "method": "POST",
        "path": "/luna/pc/me/playlist/media/delete"
      }
    ],
    "fields": [
      {
        "name": "playlist_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "media",
        "loc": "body",
        "required": false,
        "type": "media.Media[]"
      }
    ],
    "official": true,
    "gated": false,
    "login": "static",
    "reqType": "playlist.MDeletePlaylistMediaRequest",
    "resType": "playlist.MDeletePlaylistMediaResponse"
  },
  {
    "key": "DeletePlaylistTracks",
    "name": "DeletePlaylistTracks",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/me/playlist/track/delete",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/me/playlist/track/delete"
      }
    ],
    "fields": [
      {
        "name": "playlist_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "delete_track_ids",
        "loc": "body",
        "required": false,
        "type": "string[]"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "playlist.DeletePlaylistTrackRequest",
    "resType": "playlist.DeletePlaylistTrackResponse"
  },
  {
    "key": "DeleteRecentlyPlayedMedia",
    "name": "DeleteRecentlyPlayedMedia",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": "POST",
    "pcVariant": true,
    "path": "/luna/pc/me/recently-played-media/delete",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/me/recently-played-media/delete"
      },
      {
        "method": "POST",
        "path": "/luna/pc/me/recently-played-media/delete"
      }
    ],
    "fields": [
      {
        "name": "media",
        "loc": "body",
        "required": false,
        "type": "media.Media[]"
      }
    ],
    "official": true,
    "gated": false,
    "login": "static",
    "reqType": "me.DeleteRecentlyPlayedMediaRequest",
    "resType": "me.DeleteRecentlyPlayedMediaResponse"
  },
  {
    "key": "DeleteRecentPlayedTracks",
    "name": "DeleteRecentPlayedTracks",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/me/recently-played/delete",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/me/recently-played/delete"
      }
    ],
    "fields": [
      {
        "name": "track_ids",
        "loc": "body",
        "required": false,
        "type": "string[]"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "me.DeleteRecentPlayedTracksRequest",
    "resType": "me.DeleteRecentPlayedTracksResponse"
  },
  {
    "key": "DeviceBlockArtist",
    "name": "DeviceBlockArtist",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/me/device/block/artist",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/me/device/block/artist"
      }
    ],
    "fields": [
      {
        "name": "artist_id",
        "loc": "body",
        "required": true,
        "type": "number"
      },
      {
        "name": "block_type",
        "loc": "body",
        "required": true,
        "type": "user.DeviceBlockType"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "me.DeviceBlockArtistRequest",
    "resType": "me.DeviceBlockArtistResponse"
  },
  {
    "key": "DeviceBlockUser",
    "name": "DeviceBlockUser",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/me/device/block",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/me/device/block"
      }
    ],
    "fields": [
      {
        "name": "to_user_id",
        "loc": "body",
        "required": true,
        "type": "number"
      },
      {
        "name": "block_type",
        "loc": "body",
        "required": true,
        "type": "user.DeviceBlockType"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "me.DeviceBlockUserRequest",
    "resType": "me.DeviceBlockUserResponse"
  },
  {
    "key": "DeviceRecentUser",
    "name": "DeviceRecentUser",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/device/recent-login",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/device/recent-login"
      }
    ],
    "fields": [],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "misc.DeviceRecentUserRequest",
    "resType": "misc.DeviceRecentUserResponse"
  },
  {
    "key": "DiscoverMix",
    "name": "DiscoverMix",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": "POST",
    "pcVariant": true,
    "path": "/luna/pc/discover/mix",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/discover/mix"
      },
      {
        "method": "POST",
        "path": "/luna/pc/discover/mix"
      }
    ],
    "fields": [
      {
        "name": "block_type",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "sub_channel_id",
        "loc": "body",
        "required": true,
        "type": "number"
      },
      {
        "name": "feed_discover_extra",
        "loc": "body",
        "required": false,
        "type": "feed.RecExtraDiscoverMix"
      },
      {
        "name": "exposure_radio_list",
        "loc": "body",
        "required": false,
        "type": "number[]"
      },
      {
        "name": "cursor",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "count",
        "loc": "body",
        "required": false,
        "type": "number"
      },
      {
        "name": "session_id",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "ab_param",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "latest_douyin_liked_playlist_show_ts",
        "loc": "body",
        "required": false,
        "type": "number"
      }
    ],
    "official": true,
    "gated": false,
    "login": "unknown",
    "reqType": "discover.DiscoverMixRequest",
    "resType": "discover.DiscoverMixResponse"
  },
  {
    "key": "DiscoverView",
    "name": "DiscoverView",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": "POST",
    "pcVariant": true,
    "path": "/luna/pc/discover",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/discover"
      },
      {
        "method": "POST",
        "path": "/luna/pc/discover"
      }
    ],
    "fields": [
      {
        "name": "ab_param",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "selected_boost",
        "loc": "body",
        "required": false,
        "type": "boost.SelectedBoost"
      },
      {
        "name": "playlist_mix_param",
        "loc": "body",
        "required": false,
        "type": "DiscoverPlaylistMixParam"
      },
      {
        "name": "feed_discover_extra",
        "loc": "body",
        "required": false,
        "type": "feed.RecExtraDiscover"
      },
      {
        "name": "is_carplay",
        "loc": "body",
        "required": false,
        "type": "Uint8Array"
      },
      {
        "name": "first_request",
        "loc": "body",
        "required": false,
        "type": "boolean"
      },
      {
        "name": "pc_new_discover_request",
        "loc": "body",
        "required": false,
        "type": "boolean"
      }
    ],
    "official": true,
    "gated": false,
    "login": "unknown",
    "reqType": "discover.DiscoverRequest",
    "resType": "discover.DiscoverResponse"
  },
  {
    "key": "Dislike",
    "name": "Dislike",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": "POST",
    "pcVariant": false,
    "path": "/luna/dislike",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/dislike"
      }
    ],
    "fields": [
      {
        "name": "item_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "author_ids",
        "loc": "body",
        "required": false,
        "type": "number[]"
      },
      {
        "name": "dislike_item_type",
        "loc": "body",
        "required": true,
        "type": "number"
      },
      {
        "name": "action_type",
        "loc": "body",
        "required": true,
        "type": "number"
      }
    ],
    "official": true,
    "gated": false,
    "login": "unknown",
    "reqType": "dislike.DislikeRequest",
    "resType": "dislike.DislikeResponse"
  },
  {
    "key": "FeedListenVideo",
    "name": "FeedListenVideo",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/feed/listen-video",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/feed/listen-video"
      }
    ],
    "fields": [
      {
        "name": "category_id",
        "loc": "body",
        "required": false,
        "type": "number"
      },
      {
        "name": "played_tracks",
        "loc": "body",
        "required": false,
        "type": "track.TrackPlayed[]"
      },
      {
        "name": "played_media",
        "loc": "body",
        "required": false,
        "type": "media.MediaPlayed[]"
      },
      {
        "name": "selected_boost",
        "loc": "body",
        "required": false,
        "type": "boost.SelectedBoost"
      },
      {
        "name": "feed_extra",
        "loc": "body",
        "required": false,
        "type": "feed.RecExtraFeedListenVideo"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "feed.FeedListenVideoRequest",
    "resType": "feed.FeedListenVideoResponse"
  },
  {
    "key": "FeedListenVideoTab",
    "name": "FeedListenVideoTab",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/feed/listen-video-tab",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/feed/listen-video-tab"
      }
    ],
    "fields": [
      {
        "name": "selected_boost",
        "loc": "body",
        "required": false,
        "type": "boost.SelectedBoost"
      },
      {
        "name": "played_media",
        "loc": "body",
        "required": false,
        "type": "media.MediaPlayed[]"
      },
      {
        "name": "count",
        "loc": "body",
        "required": false,
        "type": "number"
      },
      {
        "name": "feed_extra",
        "loc": "body",
        "required": false,
        "type": "feed.FeedExtra"
      },
      {
        "name": "category_id",
        "loc": "body",
        "required": false,
        "type": "number"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "feed.FeedListenVideoTabRequest",
    "resType": "feed.FeedListenVideoTabResponse"
  },
  {
    "key": "FeedLiveTab",
    "name": "FeedLiveTab",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/feed/live-tab",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/feed/live-tab"
      }
    ],
    "fields": [
      {
        "name": "enter_from_merge",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "enter_method",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "req_from",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "client_ab_param",
        "loc": "body",
        "required": false,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "feed.FeedLiveTabRequest",
    "resType": "feed.FeedLiveTabResponse"
  },
  {
    "key": "FeedMode",
    "name": "FeedMode",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": "POST",
    "pcVariant": true,
    "path": "/luna/pc/feed/mode",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/feed/mode"
      },
      {
        "method": "GET",
        "path": "/luna/pc/feed/mode"
      },
      {
        "method": "POST",
        "path": "/luna/feed/mode"
      },
      {
        "method": "POST",
        "path": "/luna/pc/feed/mode"
      }
    ],
    "fields": [
      {
        "name": "ab_param",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "device_profile",
        "loc": "body",
        "required": false,
        "type": "feed.DeviceProfile"
      },
      {
        "name": "feed_extra",
        "loc": "body",
        "required": false,
        "type": "feed.RecExtraFeedMode"
      }
    ],
    "official": true,
    "gated": false,
    "login": "unknown",
    "reqType": "feed.FeedModeRequest",
    "resType": "feed.FeedModeResponse"
  },
  {
    "key": "FeedModeGuidance",
    "name": "FeedModeGuidance",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/feed/mode/guidance",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/feed/mode/guidance"
      }
    ],
    "fields": [
      {
        "name": "scene",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "disliked_media",
        "loc": "body",
        "required": false,
        "type": "media.Media[]"
      },
      {
        "name": "device_profile",
        "loc": "body",
        "required": false,
        "type": "feed.DeviceProfile"
      },
      {
        "name": "feed_extra",
        "loc": "body",
        "required": false,
        "type": "feed.RecExtraFeedModeGuidance"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "feed.FeedModeGuidanceRequest",
    "resType": "feed.FeedModeGuidanceResponse"
  },
  {
    "key": "FeedPlaylistMedia",
    "name": "FeedPlaylistMedia",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/feed/playlist-media",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/feed/playlist-media"
      }
    ],
    "fields": [
      {
        "name": "type",
        "loc": "body",
        "required": true,
        "type": "FeedPlaylistType"
      },
      {
        "name": "count",
        "loc": "body",
        "required": true,
        "type": "number"
      },
      {
        "name": "server_session_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "feed_session_id",
        "loc": "body",
        "required": true,
        "type": "number"
      },
      {
        "name": "played_media",
        "loc": "body",
        "required": false,
        "type": "media.MediaPlayed[]"
      },
      {
        "name": "click_media",
        "loc": "body",
        "required": false,
        "type": "media.Media"
      },
      {
        "name": "feed_extra",
        "loc": "body",
        "required": false,
        "type": "feed.RecExtraFeedPlaylistMedia"
      },
      {
        "name": "player_info_param",
        "loc": "body",
        "required": false,
        "type": "feed.FeedPlayerInfoParam"
      },
      {
        "name": "full_media",
        "loc": "body",
        "required": false,
        "type": "boolean"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "feed.FeedPlaylistMediaRequest",
    "resType": "feed.FeedPlaylistMediaResponse"
  },
  {
    "key": "FeedPlaylistSquare",
    "name": "FeedPlaylistSquare",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": "POST",
    "pcVariant": false,
    "path": "/luna/feed/playlist-square",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/feed/playlist-square"
      },
      {
        "method": "POST",
        "path": " /luna/pc/feed/playlist-square"
      }
    ],
    "fields": [
      {
        "name": "includes",
        "loc": "body",
        "required": false,
        "type": "string[]"
      },
      {
        "name": "category_id",
        "loc": "body",
        "required": true,
        "type": "number"
      },
      {
        "name": "feed_playlist_extra",
        "loc": "body",
        "required": false,
        "type": "feed.RecExtraFeedPlaylistSquare"
      }
    ],
    "official": true,
    "gated": false,
    "login": "unknown",
    "reqType": "feed.FeedPlaylistSquareRequest",
    "resType": "feed.FeedPlaylistSquareResponse"
  },
  {
    "key": "FeedRadioTracks",
    "name": "FeedRadioTracks",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": "POST",
    "pcVariant": true,
    "path": "/luna/pc/feed/radio/tracks",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/feed/radio/tracks"
      },
      {
        "method": "POST",
        "path": "/luna/pc/feed/radio/tracks"
      }
    ],
    "fields": [
      {
        "name": "radio_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "played_tracks",
        "loc": "body",
        "required": false,
        "type": "track.TrackPlayed[]"
      },
      {
        "name": "played_media",
        "loc": "body",
        "required": false,
        "type": "media.MediaPlayed[]"
      },
      {
        "name": "flow_type",
        "loc": "body",
        "required": false,
        "type": "number"
      },
      {
        "name": "cursor",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "trigger_info",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "feed_radio_media_extra",
        "loc": "body",
        "required": false,
        "type": "feed.FeedRadioMediaExtra"
      },
      {
        "name": "passthrough",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "limited_free_scene",
        "loc": "body",
        "required": false,
        "type": "media.LimitedFreeScene"
      },
      {
        "name": "player_info_param",
        "loc": "body",
        "required": false,
        "type": "feed.FeedPlayerInfoParam"
      },
      {
        "name": "full_media",
        "loc": "body",
        "required": false,
        "type": "boolean"
      }
    ],
    "official": true,
    "gated": false,
    "login": "unknown",
    "reqType": "feed.FeedRadioTracksRequest",
    "resType": "feed.FeedRadioTracksResponse"
  },
  {
    "key": "FeedSongTab",
    "name": "FeedSongTab",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": "POST",
    "pcVariant": true,
    "path": "/luna/pc/feed/song-tab",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/feed/song-tab"
      },
      {
        "method": "POST",
        "path": "/luna/pc/feed/song-tab"
      }
    ],
    "fields": [
      {
        "name": "played_tracks",
        "loc": "body",
        "required": false,
        "type": "track.TrackPlayed[]"
      },
      {
        "name": "selected_boost",
        "loc": "body",
        "required": false,
        "type": "boost.SelectedBoost"
      },
      {
        "name": "is_first_request",
        "loc": "body",
        "required": false,
        "type": "boolean"
      },
      {
        "name": "feed_mode",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "played_media",
        "loc": "body",
        "required": false,
        "type": "media.MediaPlayed[]"
      },
      {
        "name": "with_client_cache",
        "loc": "body",
        "required": false,
        "type": "boolean"
      },
      {
        "name": "preference_mode",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "total_request_count",
        "loc": "body",
        "required": false,
        "type": "number"
      },
      {
        "name": "preference_mode_request_count",
        "loc": "body",
        "required": false,
        "type": "number"
      },
      {
        "name": "is_did_first_request",
        "loc": "body",
        "required": false,
        "type": "boolean"
      },
      {
        "name": "feed_preference",
        "loc": "body",
        "required": false,
        "type": "feed.FeedPreference"
      },
      {
        "name": "interesting_search",
        "loc": "body",
        "required": false,
        "type": "InterestingSearch"
      },
      {
        "name": "feed_type",
        "loc": "body",
        "required": false,
        "type": "number"
      },
      {
        "name": "feed_counts",
        "loc": "body",
        "required": false,
        "type": "feed.FeedCounts"
      },
      {
        "name": "did_first_use_time",
        "loc": "body",
        "required": false,
        "type": "number"
      },
      {
        "name": "feed_extra",
        "loc": "body",
        "required": false,
        "type": "feed.FeedExtra"
      },
      {
        "name": "count",
        "loc": "body",
        "required": false,
        "type": "number"
      },
      {
        "name": "diversion_extra",
        "loc": "body",
        "required": false,
        "type": "diversion.DiversionExtra"
      },
      {
        "name": "device_profile",
        "loc": "body",
        "required": false,
        "type": "feed.DeviceProfile"
      },
      {
        "name": "limited_free_scene",
        "loc": "body",
        "required": false,
        "type": "media.LimitedFreeScene"
      },
      {
        "name": "player_info_param",
        "loc": "body",
        "required": false,
        "type": "feed.FeedPlayerInfoParam"
      },
      {
        "name": "full_media",
        "loc": "body",
        "required": false,
        "type": "boolean"
      }
    ],
    "official": true,
    "gated": false,
    "login": "unknown",
    "reqType": "feed.FeedSongTabRequest",
    "resType": "feed.FeedResponse"
  },
  {
    "key": "FeedVideo",
    "name": "FeedVideo",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/feed/video",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/feed/video"
      }
    ],
    "fields": [
      {
        "name": "selected_boost",
        "loc": "body",
        "required": false,
        "type": "boost.SelectedBoost"
      },
      {
        "name": "played_media",
        "loc": "body",
        "required": false,
        "type": "media.MediaPlayed[]"
      },
      {
        "name": "feed_extra",
        "loc": "body",
        "required": false,
        "type": "feed.FeedVideoExtra"
      },
      {
        "name": "count",
        "loc": "body",
        "required": true,
        "type": "number"
      },
      {
        "name": "diversion_extra",
        "loc": "body",
        "required": false,
        "type": "diversion.DiversionExtra"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "feed.FeedVideoRequest",
    "resType": "feed.FeedResponse"
  },
  {
    "key": "FeedVideoPlaylist",
    "name": "FeedVideoPlaylist",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/feed/video_playlist",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/feed/video_playlist"
      }
    ],
    "fields": [
      {
        "name": "count",
        "loc": "body",
        "required": false,
        "type": "number"
      },
      {
        "name": "feed_extra",
        "loc": "body",
        "required": false,
        "type": "feed.FeedVideoPlaylistExtra"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "feed.FeedVideoPlaylistRequest",
    "resType": "feed.FeedVideoPlaylistResponse"
  },
  {
    "key": "FeedVideoTab",
    "name": "FeedVideoTab",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/feed/video-tab",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/feed/video-tab"
      }
    ],
    "fields": [
      {
        "name": "selected_boost",
        "loc": "body",
        "required": false,
        "type": "boost.SelectedBoost"
      },
      {
        "name": "played_media",
        "loc": "body",
        "required": false,
        "type": "media.MediaPlayed[]"
      },
      {
        "name": "feed_extra",
        "loc": "body",
        "required": false,
        "type": "feed.FeedExtra"
      },
      {
        "name": "count",
        "loc": "body",
        "required": false,
        "type": "number"
      },
      {
        "name": "diversion_extra",
        "loc": "body",
        "required": false,
        "type": "diversion.DiversionExtra"
      },
      {
        "name": "device_profile",
        "loc": "body",
        "required": false,
        "type": "feed.DeviceProfile"
      },
      {
        "name": "feed_video_type",
        "loc": "body",
        "required": false,
        "type": "number"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "feed.FeedVideoTabRequest",
    "resType": "feed.FeedResponse"
  },
  {
    "key": "FinishMagicTask",
    "name": "FinishMagicTask",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/magic/finish",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/magic/finish"
      }
    ],
    "fields": [
      {
        "name": "activity_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "task_id",
        "loc": "body",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "magic.FinishMagicTaskRequest",
    "resType": "magic.FinishMagicTaskResponse"
  },
  {
    "key": "FlowGetAlbumDetail",
    "name": "FlowGetAlbumDetail",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/flow/album/detail",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/flow/album/detail"
      }
    ],
    "fields": [
      {
        "name": "album_id",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "ignore_tracks",
        "loc": "query",
        "required": true,
        "type": "boolean"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "flow_contract.FlowGetAlbumDetailRequest",
    "resType": "flow_contract.FlowGetAlbumDetailResponse"
  },
  {
    "key": "FlowGetArtistMusic",
    "name": "FlowGetArtistMusic",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/flow/artist/music",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/flow/artist/music"
      }
    ],
    "fields": [
      {
        "name": "artist_id",
        "loc": "body",
        "required": true,
        "type": "number"
      },
      {
        "name": "sort_type",
        "loc": "body",
        "required": true,
        "type": "number"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "flow_contract.FlowGetArtistMusicRequest",
    "resType": "flow_contract.FlowGetArtistMusicResponse"
  },
  {
    "key": "FlowGetChartDetail",
    "name": "FlowGetChartDetail",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/flow/chart/detail",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/flow/chart/detail"
      }
    ],
    "fields": [
      {
        "name": "artist_id",
        "loc": "body",
        "required": true,
        "type": "number"
      },
      {
        "name": "sort_type",
        "loc": "body",
        "required": true,
        "type": "number"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "flow_contract.FlowGetArtistMusicRequest",
    "resType": "flow_contract.FlowGetChartDetailResponse"
  },
  {
    "key": "FlowGetPlaylistDetail",
    "name": "FlowGetPlaylistDetail",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/flow/playlist/detail",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/flow/playlist/detail"
      }
    ],
    "fields": [
      {
        "name": "playlist_id",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "cursor",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "count",
        "loc": "query",
        "required": true,
        "type": "number"
      },
      {
        "name": "user_id",
        "loc": "query",
        "required": false,
        "type": "string"
      },
      {
        "name": "type",
        "loc": "query",
        "required": false,
        "type": "number"
      },
      {
        "name": "only_need_media",
        "loc": "query",
        "required": false,
        "type": "boolean"
      },
      {
        "name": "only_need_media_id",
        "loc": "query",
        "required": false,
        "type": "boolean"
      },
      {
        "name": "sec_uid",
        "loc": "query",
        "required": false,
        "type": "string"
      },
      {
        "name": "feed_playlist_extra",
        "loc": "query",
        "required": false,
        "type": "feed.RecExtraGetPlaylistDetail"
      },
      {
        "name": "playlist_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "cursor",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "count",
        "loc": "body",
        "required": true,
        "type": "number"
      },
      {
        "name": "user_id",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "type",
        "loc": "body",
        "required": false,
        "type": "number"
      },
      {
        "name": "only_need_media",
        "loc": "body",
        "required": false,
        "type": "boolean"
      },
      {
        "name": "only_need_media_id",
        "loc": "body",
        "required": false,
        "type": "boolean"
      },
      {
        "name": "sec_uid",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "feed_playlist_extra",
        "loc": "body",
        "required": false,
        "type": "feed.RecExtraGetPlaylistDetail"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "flow_contract.FlowGetPlaylistDetailRequest",
    "resType": "flow_contract.FlowGetPlaylistDetailResponse"
  },
  {
    "key": "FlowGetRelatedMedia",
    "name": "FlowGetRelatedMedia",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/flow/related/media",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/flow/related/media"
      }
    ],
    "fields": [
      {
        "name": "media_list",
        "loc": "query",
        "required": false,
        "type": "media.Media[]"
      },
      {
        "name": "artist_ids",
        "loc": "query",
        "required": false,
        "type": "string[]"
      },
      {
        "name": "scene_name",
        "loc": "query",
        "required": false,
        "type": "string"
      },
      {
        "name": "media_list",
        "loc": "body",
        "required": false,
        "type": "media.Media[]"
      },
      {
        "name": "artist_ids",
        "loc": "body",
        "required": false,
        "type": "string[]"
      },
      {
        "name": "scene_name",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "played_media",
        "loc": "body",
        "required": false,
        "type": "media.MediaPlayed[]"
      },
      {
        "name": "req_count",
        "loc": "body",
        "required": false,
        "type": "number"
      },
      {
        "name": "first_req_time",
        "loc": "body",
        "required": false,
        "type": "number"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "flow_contract.FlowGetRelatedMediaRequest",
    "resType": "feed.FeedResponse"
  },
  {
    "key": "FlowGetTrackListDetail",
    "name": "FlowGetTrackListDetail",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/flow/track/detail",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/flow/track/detail"
      }
    ],
    "fields": [
      {
        "name": "track_ids",
        "loc": "query",
        "required": false,
        "type": "string[]"
      },
      {
        "name": "media_type",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "scene",
        "loc": "query",
        "required": false,
        "type": "number"
      },
      {
        "name": "track_ids",
        "loc": "body",
        "required": false,
        "type": "string[]"
      },
      {
        "name": "media_type",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "scene",
        "loc": "body",
        "required": false,
        "type": "number"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "flow_contract.FlowGetTrackListDetailRequest",
    "resType": "flow_contract.FlowGetTrackListDetailResponse"
  },
  {
    "key": "FlowRecommend",
    "name": "FlowRecommend",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/flow/recommend",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/flow/recommend"
      }
    ],
    "fields": [
      {
        "name": "channel",
        "loc": "body",
        "required": true,
        "type": "number"
      },
      {
        "name": "played_media",
        "loc": "body",
        "required": false,
        "type": "media.MediaPlayed[]"
      },
      {
        "name": "count",
        "loc": "body",
        "required": true,
        "type": "number"
      },
      {
        "name": "flow_preference",
        "loc": "body",
        "required": false,
        "type": "FlowPreference"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "flow_contract.FlowRecommendRequest",
    "resType": "flow_contract.FlowRecommendResponse"
  },
  {
    "key": "FlowRecommendNotPack",
    "name": "FlowRecommendNotPack",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/flow/recommend/not_pack",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/flow/recommend/not_pack"
      }
    ],
    "fields": [
      {
        "name": "played_tracks",
        "loc": "body",
        "required": false,
        "type": "track.TrackPlayed[]"
      },
      {
        "name": "selected_boost",
        "loc": "body",
        "required": false,
        "type": "boost.SelectedBoost"
      },
      {
        "name": "is_first_request",
        "loc": "body",
        "required": false,
        "type": "boolean"
      },
      {
        "name": "feed_mode",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "played_media",
        "loc": "body",
        "required": false,
        "type": "media.MediaPlayed[]"
      },
      {
        "name": "with_client_cache",
        "loc": "body",
        "required": false,
        "type": "boolean"
      },
      {
        "name": "preference_mode",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "total_request_count",
        "loc": "body",
        "required": false,
        "type": "number"
      },
      {
        "name": "preference_mode_request_count",
        "loc": "body",
        "required": false,
        "type": "number"
      },
      {
        "name": "is_did_first_request",
        "loc": "body",
        "required": false,
        "type": "boolean"
      },
      {
        "name": "feed_preference",
        "loc": "body",
        "required": false,
        "type": "feed.FeedPreference"
      },
      {
        "name": "interesting_search",
        "loc": "body",
        "required": false,
        "type": "InterestingSearch"
      },
      {
        "name": "feed_type",
        "loc": "body",
        "required": false,
        "type": "number"
      },
      {
        "name": "feed_counts",
        "loc": "body",
        "required": false,
        "type": "feed.FeedCounts"
      },
      {
        "name": "did_first_use_time",
        "loc": "body",
        "required": false,
        "type": "number"
      },
      {
        "name": "feed_extra",
        "loc": "body",
        "required": false,
        "type": "feed.FeedExtra"
      },
      {
        "name": "count",
        "loc": "body",
        "required": false,
        "type": "number"
      },
      {
        "name": "diversion_extra",
        "loc": "body",
        "required": false,
        "type": "diversion.DiversionExtra"
      },
      {
        "name": "device_profile",
        "loc": "body",
        "required": false,
        "type": "feed.DeviceProfile"
      },
      {
        "name": "limited_free_scene",
        "loc": "body",
        "required": false,
        "type": "media.LimitedFreeScene"
      },
      {
        "name": "player_info_param",
        "loc": "body",
        "required": false,
        "type": "feed.FeedPlayerInfoParam"
      },
      {
        "name": "full_media",
        "loc": "body",
        "required": false,
        "type": "boolean"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "feed.FeedSongTabRequest",
    "resType": "flow_contract.FlowRecommendNotPackResponse"
  },
  {
    "key": "FlowSearch",
    "name": "FlowSearch",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/flow/search/${requestData.params.search_type}",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/flow/search/${requestData.params.search_type}"
      }
    ],
    "fields": [
      {
        "name": "search_type",
        "loc": "params",
        "required": true,
        "type": "search.SearchType"
      },
      {
        "name": "q",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "cursor",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "search_id",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "search_method",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "debug_params",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "from_search_id",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "search_scene",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "q",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "cursor",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "search_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "search_method",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "debug_params",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "from_search_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "search_scene",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "ab_param",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "count",
        "loc": "body",
        "required": true,
        "type": "number"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "flow_contract.FlowSearchRequest",
    "resType": "search.SearchResponse"
  },
  {
    "key": "FollowUser",
    "name": "FollowUser",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": "POST",
    "pcVariant": true,
    "path": "/luna/pc/me/follow",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/me/follow"
      },
      {
        "method": "POST",
        "path": "/luna/pc/me/follow"
      }
    ],
    "fields": [
      {
        "name": "user_id",
        "loc": "body",
        "required": true,
        "type": "string"
      }
    ],
    "official": true,
    "gated": false,
    "login": "static",
    "reqType": "me.FollowUserRequest",
    "resType": "me.FollowUserResponse"
  },
  {
    "key": "GetAcquisition",
    "name": "GetAcquisition",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/acquisition",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/acquisition"
      }
    ],
    "fields": [],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "acquisition.GetAcquisitionRequest",
    "resType": "acquisition.GetAcquisitionResponse"
  },
  {
    "key": "GetActivityInfo",
    "name": "GetActivityInfo",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/activities",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/activities"
      }
    ],
    "fields": [
      {
        "name": "includes",
        "loc": "query",
        "required": false,
        "type": "string[]"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "activity.GetActivityInfoRequest",
    "resType": "activity.GetActivityInfoResponse"
  },
  {
    "key": "GetAlbumDetail",
    "name": "GetAlbumDetail",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": "GET",
    "pcVariant": true,
    "path": "/luna/pc/albums/${requestData.params.album_id}",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/albums/${requestData.params.album_id}"
      },
      {
        "method": "GET",
        "path": "/luna/pc/albums/${requestData.params.album_id}"
      }
    ],
    "fields": [
      {
        "name": "album_id",
        "loc": "params",
        "required": true,
        "type": "string"
      },
      {
        "name": "ignore_tracks",
        "loc": "query",
        "required": true,
        "type": "boolean"
      }
    ],
    "official": true,
    "gated": false,
    "login": "unknown",
    "reqType": "album.GetAlbumDetailRequest",
    "resType": "album.GetAlbumDetailResponse"
  },
  {
    "key": "GetAlbumPurchasedPage",
    "name": "GetAlbumPurchasedPage",
    "module": "commerce_membership",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/commerce/v2/album/purchased_page",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/commerce/v2/album/purchased_page"
      }
    ],
    "fields": [
      {
        "name": "album_id",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "is_preview",
        "loc": "query",
        "required": false,
        "type": "boolean"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "GetAlbumPageRequest",
    "resType": "GetAlbumPageResponse"
  },
  {
    "key": "GetAlbumToPurchasePage",
    "name": "GetAlbumToPurchasePage",
    "module": "commerce_membership",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/commerce/v2/album/purchase_page",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/commerce/v2/album/purchase_page"
      }
    ],
    "fields": [
      {
        "name": "album_id",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "is_preview",
        "loc": "query",
        "required": false,
        "type": "boolean"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "GetAlbumPageRequest",
    "resType": "GetAlbumPageResponse"
  },
  {
    "key": "GetArtistCollection",
    "name": "GetArtistCollection",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/me/collection/artist",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/me/collection/artist"
      }
    ],
    "fields": [
      {
        "name": "cursor",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "count",
        "loc": "query",
        "required": true,
        "type": "number"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "me.GetArtistCollectionRequest",
    "resType": "me.GetArtistCollectionResponse"
  },
  {
    "key": "GetArtistDetail",
    "name": "GetArtistDetail",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": "GET",
    "pcVariant": true,
    "path": "/luna/pc/artists/${requestData.params.artist_id}",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/artists/${requestData.params.artist_id}"
      },
      {
        "method": "GET",
        "path": "/luna/pc/artists/${requestData.params.artist_id}"
      }
    ],
    "fields": [
      {
        "name": "artist_id",
        "loc": "params",
        "required": true,
        "type": "string"
      },
      {
        "name": "user_id",
        "loc": "query",
        "required": false,
        "type": "string"
      },
      {
        "name": "locate_item_id",
        "loc": "query",
        "required": true,
        "type": "string"
      }
    ],
    "official": true,
    "gated": false,
    "login": "unknown",
    "reqType": "artist.GetArtistDetailRequest",
    "resType": "artist.GetArtistDetailResponse"
  },
  {
    "key": "GetAtList",
    "name": "GetAtList",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/atlist",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/atlist"
      },
      {
        "method": "GET",
        "path": "/luna/atlist"
      }
    ],
    "fields": [
      {
        "name": "cursor",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "count",
        "loc": "query",
        "required": true,
        "type": "number"
      },
      {
        "name": "type",
        "loc": "query",
        "required": true,
        "type": "atlist.AtListType"
      },
      {
        "name": "group_id",
        "loc": "query",
        "required": false,
        "type": "string"
      },
      {
        "name": "group_type",
        "loc": "query",
        "required": false,
        "type": "number"
      },
      {
        "name": "query",
        "loc": "query",
        "required": false,
        "type": "string"
      },
      {
        "name": "extra",
        "loc": "query",
        "required": false,
        "type": "Record<string, string>"
      },
      {
        "name": "scene",
        "loc": "query",
        "required": false,
        "type": "string"
      },
      {
        "name": "cursor",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "count",
        "loc": "body",
        "required": true,
        "type": "number"
      },
      {
        "name": "type",
        "loc": "body",
        "required": true,
        "type": "atlist.AtListType"
      },
      {
        "name": "group_id",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "group_type",
        "loc": "body",
        "required": false,
        "type": "number"
      },
      {
        "name": "query",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "extra",
        "loc": "body",
        "required": false,
        "type": "Record<string, string>"
      },
      {
        "name": "scene",
        "loc": "body",
        "required": false,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "atlist.GetAtListRequest",
    "resType": "atlist.GetAtListResponse"
  },
  {
    "key": "GetAudit",
    "name": "GetAudit",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/audit/result",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/audit/result"
      }
    ],
    "fields": [
      {
        "name": "audit_id",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "audit_id",
        "loc": "body",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "audit.GetAuditRequest",
    "resType": "audit.GetAuditResponse"
  },
  {
    "key": "GetBlockUserList",
    "name": "GetBlockUserList",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": "GET",
    "pcVariant": true,
    "path": "/luna/pc/me/block/list",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/me/block/list"
      },
      {
        "method": "GET",
        "path": "/luna/pc/me/block/list"
      }
    ],
    "fields": [
      {
        "name": "cursor",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "count",
        "loc": "query",
        "required": true,
        "type": "number"
      }
    ],
    "official": true,
    "gated": false,
    "login": "static",
    "reqType": "me.GetBlockUserListRequest",
    "resType": "me.GetBlockUserListResponse"
  },
  {
    "key": "GetBriefUserInfo",
    "name": "GetBriefUserInfo",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/h5/users/${requestData.params.user_id}",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/h5/users/${requestData.params.user_id}"
      }
    ],
    "fields": [
      {
        "name": "user_id",
        "loc": "params",
        "required": true,
        "type": "string"
      },
      {
        "name": "sec_uid",
        "loc": "query",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "user.GetBriefUserInfoRequest",
    "resType": "user.GetBriefUserInfoResponse"
  },
  {
    "key": "GetBriefUserInfoV2",
    "name": "GetBriefUserInfoV2",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/user_brief/info",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/user_brief/info"
      }
    ],
    "fields": [
      {
        "name": "sec_uid",
        "loc": "query",
        "required": false,
        "type": "string"
      },
      {
        "name": "by_login_user_id",
        "loc": "query",
        "required": false,
        "type": "boolean"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "user.GetBriefUserInfoRequestV2",
    "resType": "user.GetBriefUserInfoResponse"
  },
  {
    "key": "GetBytepayPreSignPage",
    "name": "GetBytepayPreSignPage",
    "module": "commerce_membership",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/commerce/v2/bytepay/pre_sign",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/commerce/v2/bytepay/pre_sign"
      }
    ],
    "fields": [
      {
        "name": "offer_snapshot_id",
        "loc": "body",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "GetBytepayPreSignPageRequest",
    "resType": "GetBytepayPreSignPageResponse"
  },
  {
    "key": "GetCard",
    "name": "GetCard",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/card",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/card"
      },
      {
        "method": "POST",
        "path": "/luna/h5/card"
      }
    ],
    "fields": [
      {
        "name": "media_id",
        "loc": "body",
        "required": true,
        "type": "number"
      },
      {
        "name": "media_type",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "context",
        "loc": "body",
        "required": false,
        "type": "Record<string, string>"
      },
      {
        "name": "is_vip",
        "loc": "body",
        "required": false,
        "type": "boolean"
      },
      {
        "name": "queue_type",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "ab_param",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "vip_redeem_token",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "limited_free_param",
        "loc": "body",
        "required": false,
        "type": "common.LimitedFreeParam"
      },
      {
        "name": "sub_queue_type",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "user_action",
        "loc": "body",
        "required": false,
        "type": "UserAction"
      },
      {
        "name": "search_scene",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "is_listen_video_scene",
        "loc": "body",
        "required": false,
        "type": "boolean"
      },
      {
        "name": "main_player_first_track",
        "loc": "body",
        "required": false,
        "type": "boolean"
      },
      {
        "name": "client_card_config",
        "loc": "body",
        "required": false,
        "type": "ClientCardConfig"
      },
      {
        "name": "need_related_track_card",
        "loc": "body",
        "required": false,
        "type": "boolean"
      },
      {
        "name": "feed_extra_card",
        "loc": "body",
        "required": false,
        "type": "feed.RecExtraCard"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "card.GetCardRequest",
    "resType": "card.GetCardResponse"
  },
  {
    "key": "GetChartDetail",
    "name": "GetChartDetail",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": true,
    "path": "/luna/pc/charts/${requestData.params.chart_id}",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/charts/${requestData.params.chart_id}"
      },
      {
        "method": "GET",
        "path": "/luna/pc/charts/${requestData.params.chart_id}"
      }
    ],
    "fields": [
      {
        "name": "chart_id",
        "loc": "params",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "chart.GetChartDetailRequest",
    "resType": "chart.GetChartDetailResponse"
  },
  {
    "key": "GetComment",
    "name": "GetComment",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": true,
    "path": "/luna/pc/comment",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/comment"
      },
      {
        "method": "GET",
        "path": "/luna/pc/comment"
      }
    ],
    "fields": [
      {
        "name": "parent_id",
        "loc": "query",
        "required": false,
        "type": "string"
      },
      {
        "name": "reply_id",
        "loc": "query",
        "required": false,
        "type": "string"
      },
      {
        "name": "image_strategy",
        "loc": "query",
        "required": false,
        "type": "comment.CommentImageDisplayStrategy"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "comment.GetCommentRequest",
    "resType": "comment.GetCommentResponse"
  },
  {
    "key": "GetCommerceConfig",
    "name": "GetCommerceConfig",
    "module": "commerce_membership",
    "method": "POST",
    "declaredMethod": "POST",
    "pcVariant": true,
    "path": "/luna/pc/commerce/v2/commerce_config",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/commerce/v2/commerce_config"
      },
      {
        "method": "POST",
        "path": "/luna/pc/commerce/v2/commerce_config"
      },
      {
        "method": "POST",
        "path": "/luna/h5/commerce/v2/commerce_config"
      }
    ],
    "fields": [],
    "official": true,
    "gated": false,
    "login": "static",
    "reqType": "GetCommerceConfigRequest",
    "resType": "GetCommerceConfigResponse"
  },
  {
    "key": "GetCommerceInfo",
    "name": "GetCommerceInfo",
    "module": "commerce_membership",
    "method": "POST",
    "declaredMethod": "POST",
    "pcVariant": true,
    "path": "/luna/pc/commerce/v2/commerce_info",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/commerce/v2/commerce_info"
      },
      {
        "method": "POST",
        "path": "/luna/pc/commerce/v2/commerce_info"
      },
      {
        "method": "POST",
        "path": "/luna/h5/commerce/v2/commerce_info"
      }
    ],
    "fields": [
      {
        "name": "includes",
        "loc": "body",
        "required": false,
        "type": "Include[]"
      }
    ],
    "official": true,
    "gated": false,
    "login": "static",
    "reqType": "GetCommerceInfoRequest",
    "resType": "GetCommerceInfoResponse"
  },
  {
    "key": "GetDeviceActiveMembership",
    "name": "GetDeviceActiveMembership",
    "module": "commerce_membership",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/commerce/v2/device_active_membership",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/commerce/v2/device_active_membership"
      }
    ],
    "fields": [],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "GetDeviceActiveMembershipRequest",
    "resType": "GetDeviceActiveMembershipResponse"
  },
  {
    "key": "GetDigitalAlbums",
    "name": "GetDigitalAlbums",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": "GET",
    "pcVariant": true,
    "path": "/luna/pc/me/assets/albums",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/me/assets/albums"
      },
      {
        "method": "GET",
        "path": "/luna/pc/me/assets/albums"
      }
    ],
    "fields": [],
    "official": true,
    "gated": false,
    "login": "static",
    "reqType": "me.GetMyDigitalAlbumsRequest",
    "resType": "me.GetMyDigitalAlbumsResponse"
  },
  {
    "key": "GetEcommerceOrderList",
    "name": "GetEcommerceOrderList",
    "module": "commerce",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/commerce/ecommerce/order_list",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/commerce/ecommerce/order_list"
      }
    ],
    "fields": [
      {
        "name": "scenes",
        "loc": "query",
        "required": false,
        "type": "string[]"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "GetEcommerceOrderListRequest",
    "resType": "GetEcommerceOrderListResponse"
  },
  {
    "key": "GetEligibleOffers",
    "name": "GetEligibleOffers",
    "module": "commerce",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/commerce/eligible_offers",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/commerce/eligible_offers"
      }
    ],
    "fields": [
      {
        "name": "scene",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "scenes",
        "loc": "query",
        "required": false,
        "type": "string[]"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "GetEligibleOffersRequest",
    "resType": "GetEligibleOffersResponse"
  },
  {
    "key": "GetEvaluation",
    "name": "GetEvaluation",
    "module": "user",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/user/evaluation",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/user/evaluation"
      }
    ],
    "fields": [
      {
        "name": "evaluation_id",
        "loc": "query",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "evaluation.GetEvaluationRequest",
    "resType": "evaluation.GetEvaluationResponse"
  },
  {
    "key": "GetFeaturedContentDetail",
    "name": "GetFeaturedContentDetail",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/featured-content/detail",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/featured-content/detail"
      }
    ],
    "fields": [
      {
        "name": "featured_content_id",
        "loc": "query",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "featured_content.GetFeaturedContentDetailRequest",
    "resType": "featured_content.GetFeaturedContentDetailResponse"
  },
  {
    "key": "GetFeaturedContents",
    "name": "GetFeaturedContents",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/featured-content/list",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/featured-content/list"
      }
    ],
    "fields": [
      {
        "name": "cursor",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "count",
        "loc": "query",
        "required": true,
        "type": "number"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "featured_content.GetFeaturedContentsRequest",
    "resType": "featured_content.GetFeaturedContentsResponse"
  },
  {
    "key": "GetFollowerList",
    "name": "GetFollowerList",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": "GET",
    "pcVariant": true,
    "path": "/luna/pc/users/${requestData.params.user_id}/follower",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/users/${requestData.params.user_id}/follower"
      },
      {
        "method": "GET",
        "path": "/luna/pc/users/${requestData.params.user_id}/follower"
      }
    ],
    "fields": [
      {
        "name": "user_id",
        "loc": "params",
        "required": true,
        "type": "string"
      },
      {
        "name": "cursor",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "count",
        "loc": "query",
        "required": true,
        "type": "number"
      },
      {
        "name": "scene",
        "loc": "query",
        "required": true,
        "type": "user.FollowListSceneType"
      }
    ],
    "official": true,
    "gated": false,
    "login": "unknown",
    "reqType": "user.GetFollowListRequest",
    "resType": "user.GetFollowListResponse"
  },
  {
    "key": "GetFollowingList",
    "name": "GetFollowingList",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": "GET",
    "pcVariant": true,
    "path": "/luna/pc/users/${requestData.params.user_id}/following",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/users/${requestData.params.user_id}/following"
      },
      {
        "method": "GET",
        "path": "/luna/pc/users/${requestData.params.user_id}/following"
      }
    ],
    "fields": [
      {
        "name": "user_id",
        "loc": "params",
        "required": true,
        "type": "string"
      },
      {
        "name": "cursor",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "count",
        "loc": "query",
        "required": true,
        "type": "number"
      },
      {
        "name": "scene",
        "loc": "query",
        "required": true,
        "type": "user.FollowListSceneType"
      }
    ],
    "official": true,
    "gated": false,
    "login": "unknown",
    "reqType": "user.GetFollowListRequest",
    "resType": "user.GetFollowListResponse"
  },
  {
    "key": "GetFollowingLive",
    "name": "GetFollowingLive",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/following/live",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/following/live"
      }
    ],
    "fields": [
      {
        "name": "enter_from_merge",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "enter_method",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "req_from",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "scene",
        "loc": "body",
        "required": false,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "live.GetFollowingLiveRequest",
    "resType": "live.GetFollowingLiveResponse"
  },
  {
    "key": "GetFriendLinkTemplate",
    "name": "GetFriendLinkTemplate",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/seo_api/friendlink/template/get_template_info",
    "paths": [
      {
        "method": "POST",
        "path": "/seo_api/friendlink/template/get_template_info"
      }
    ],
    "fields": [
      {
        "name": "template_id",
        "loc": "body",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "friend_link.GetFriendLinkTemplateRequest",
    "resType": "friend_link.GetFriendLinkTemplateResponse"
  },
  {
    "key": "GetFriendRankings",
    "name": "GetFriendRankings",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/me/friend_rankings",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/me/friend_rankings"
      }
    ],
    "fields": [
      {
        "name": "version",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "cursor",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "count",
        "loc": "body",
        "required": true,
        "type": "number"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "me.GetFriendRankingsRequest",
    "resType": "me.GetFriendRankingsResponse"
  },
  {
    "key": "GetGamePlayConfig",
    "name": "GetGamePlayConfig",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/game_play/config",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/game_play/config"
      }
    ],
    "fields": [
      {
        "name": "includes",
        "loc": "body",
        "required": false,
        "type": "string[]"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "game_play.GetGamePlayConfigRequest",
    "resType": "game_play.GetGamePlayConfigResponse"
  },
  {
    "key": "GetH5AlbumDetail",
    "name": "GetH5AlbumDetail",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/h5/albums/${requestData.params.album_id}",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/h5/albums/${requestData.params.album_id}"
      }
    ],
    "fields": [
      {
        "name": "album_id",
        "loc": "params",
        "required": true,
        "type": "string"
      },
      {
        "name": "ignore_tracks",
        "loc": "query",
        "required": true,
        "type": "boolean"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "album.GetAlbumDetailRequest",
    "resType": "album.GetAlbumDetailResponse"
  },
  {
    "key": "GetH5ArtistDetail",
    "name": "GetH5ArtistDetail",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/h5/artists/${requestData.params.artist_id}",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/h5/artists/${requestData.params.artist_id}"
      }
    ],
    "fields": [
      {
        "name": "artist_id",
        "loc": "params",
        "required": true,
        "type": "string"
      },
      {
        "name": "user_id",
        "loc": "query",
        "required": false,
        "type": "string"
      },
      {
        "name": "locate_item_id",
        "loc": "query",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "artist.GetArtistDetailRequest",
    "resType": "artist.GetArtistDetailResponse"
  },
  {
    "key": "GetH5FeaturedContentDetail",
    "name": "GetH5FeaturedContentDetail",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/h5/featured-content/detail",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/h5/featured-content/detail"
      }
    ],
    "fields": [
      {
        "name": "featured_content_id",
        "loc": "query",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "featured_content.GetFeaturedContentDetailRequest",
    "resType": "featured_content.GetFeaturedContentDetailResponse"
  },
  {
    "key": "GetH5PlaylistDetail",
    "name": "GetH5PlaylistDetail",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/h5/playlist/detail",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/h5/playlist/detail"
      },
      {
        "method": "POST",
        "path": "/luna/h5/playlist/detail"
      }
    ],
    "fields": [
      {
        "name": "playlist_id",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "cursor",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "count",
        "loc": "query",
        "required": true,
        "type": "number"
      },
      {
        "name": "user_id",
        "loc": "query",
        "required": false,
        "type": "string"
      },
      {
        "name": "type",
        "loc": "query",
        "required": false,
        "type": "number"
      },
      {
        "name": "only_need_media",
        "loc": "query",
        "required": false,
        "type": "boolean"
      },
      {
        "name": "only_need_media_id",
        "loc": "query",
        "required": false,
        "type": "boolean"
      },
      {
        "name": "sec_uid",
        "loc": "query",
        "required": false,
        "type": "string"
      },
      {
        "name": "feed_playlist_extra",
        "loc": "query",
        "required": false,
        "type": "feed.RecExtraGetPlaylistDetail"
      },
      {
        "name": "scene",
        "loc": "query",
        "required": false,
        "type": "PlaylistDetailScene"
      },
      {
        "name": "media",
        "loc": "query",
        "required": false,
        "type": "media.Media[]"
      },
      {
        "name": "sort_type",
        "loc": "query",
        "required": false,
        "type": "playlist.PlaylistSortType"
      },
      {
        "name": "session_id",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "reverse",
        "loc": "query",
        "required": true,
        "type": "boolean"
      },
      {
        "name": "ab_param",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "playlist_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "cursor",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "count",
        "loc": "body",
        "required": true,
        "type": "number"
      },
      {
        "name": "user_id",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "type",
        "loc": "body",
        "required": false,
        "type": "number"
      },
      {
        "name": "only_need_media",
        "loc": "body",
        "required": false,
        "type": "boolean"
      },
      {
        "name": "only_need_media_id",
        "loc": "body",
        "required": false,
        "type": "boolean"
      },
      {
        "name": "sec_uid",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "feed_playlist_extra",
        "loc": "body",
        "required": false,
        "type": "feed.RecExtraGetPlaylistDetail"
      },
      {
        "name": "feed_playlist_trigger",
        "loc": "body",
        "required": false,
        "type": "playlist.FeedPlaylistTrigger"
      },
      {
        "name": "scene",
        "loc": "body",
        "required": false,
        "type": "PlaylistDetailScene"
      },
      {
        "name": "media",
        "loc": "body",
        "required": false,
        "type": "media.Media[]"
      },
      {
        "name": "sort_type",
        "loc": "body",
        "required": false,
        "type": "playlist.PlaylistSortType"
      },
      {
        "name": "session_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "reverse",
        "loc": "body",
        "required": true,
        "type": "boolean"
      },
      {
        "name": "limited_free_scene",
        "loc": "body",
        "required": false,
        "type": "media.LimitedFreeScene"
      },
      {
        "name": "ab_param",
        "loc": "body",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "playlist.GetPlaylistDetailRequest",
    "resType": "playlist.GetPlaylistDetailResponse"
  },
  {
    "key": "GetH5Track",
    "name": "GetH5Track",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/h5/track",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/h5/track"
      },
      {
        "method": "POST",
        "path": "/luna/h5/track"
      }
    ],
    "fields": [
      {
        "name": "track_id",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "includes",
        "loc": "query",
        "required": false,
        "type": "string[]"
      },
      {
        "name": "recommend_req_info",
        "loc": "query",
        "required": false,
        "type": "RecommendReqInfo"
      },
      {
        "name": "media_type",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "track_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "includes",
        "loc": "body",
        "required": false,
        "type": "string[]"
      },
      {
        "name": "recommend_req_info",
        "loc": "body",
        "required": false,
        "type": "RecommendReqInfo"
      },
      {
        "name": "media_type",
        "loc": "body",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "track.GetTrackRequest",
    "resType": "track.GetTrackResponse"
  },
  {
    "key": "GetH5TrackV2",
    "name": "GetH5TrackV2",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/h5/track_v2",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/h5/track_v2"
      },
      {
        "method": "POST",
        "path": "/luna/h5/track_v2"
      }
    ],
    "fields": [
      {
        "name": "track_id",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "media_type",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "queue_type",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "need_show_diversion_anchor",
        "loc": "query",
        "required": false,
        "type": "string"
      },
      {
        "name": "scene",
        "loc": "query",
        "required": false,
        "type": "track.TrackV2Scene"
      },
      {
        "name": "enable_refresh_api",
        "loc": "query",
        "required": false,
        "type": "boolean"
      },
      {
        "name": "track_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "media_type",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "queue_type",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "limited_free_param",
        "loc": "body",
        "required": false,
        "type": "common.LimitedFreeParam"
      },
      {
        "name": "need_show_diversion_anchor",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "extra_params",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "scene",
        "loc": "body",
        "required": false,
        "type": "track.TrackV2Scene"
      },
      {
        "name": "enable_refresh_api",
        "loc": "body",
        "required": false,
        "type": "boolean"
      },
      {
        "name": "scene_name",
        "loc": "body",
        "required": false,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "track.GetTrackV2Request",
    "resType": "track.GetTrackV2Response"
  },
  {
    "key": "GetH5UserMusicWall",
    "name": "GetH5UserMusicWall",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/h5/user/music_wall",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/h5/user/music_wall"
      }
    ],
    "fields": [
      {
        "name": "user_id",
        "loc": "params",
        "required": true,
        "type": "string"
      },
      {
        "name": "user_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "feed_music_wall_extra",
        "loc": "body",
        "required": false,
        "type": "feed.RecExtraMusicWall"
      },
      {
        "name": "sec_uid",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "ab_param",
        "loc": "body",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "user.GetUserMusicWallRequest",
    "resType": "user.GetUserMusicWallResponse"
  },
  {
    "key": "GetH5Video",
    "name": "GetH5Video",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/h5/video",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/h5/video"
      }
    ],
    "fields": [
      {
        "name": "video_id",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "type",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "includes",
        "loc": "query",
        "required": false,
        "type": "string[]"
      },
      {
        "name": "video_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "type",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "includes",
        "loc": "body",
        "required": false,
        "type": "string[]"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "video.GetVideoRequest",
    "resType": "video.GetVideoResponse"
  },
  {
    "key": "GetH5VideoV2",
    "name": "GetH5VideoV2",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/h5/video_v2",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/h5/video_v2"
      }
    ],
    "fields": [
      {
        "name": "video_id",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "type",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "enable_refresh_api",
        "loc": "query",
        "required": false,
        "type": "boolean"
      },
      {
        "name": "enable_dash",
        "loc": "query",
        "required": false,
        "type": "boolean"
      },
      {
        "name": "video_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "type",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "enable_refresh_api",
        "loc": "body",
        "required": false,
        "type": "boolean"
      },
      {
        "name": "enable_dash",
        "loc": "body",
        "required": false,
        "type": "boolean"
      },
      {
        "name": "scene_name",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "queue_type",
        "loc": "body",
        "required": false,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "video.GetVideoV2Request",
    "resType": "video.GetVideoV2Response"
  },
  {
    "key": "GetHashtagDetail",
    "name": "GetHashtagDetail",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/hashtag/detail",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/hashtag/detail"
      }
    ],
    "fields": [
      {
        "name": "hashtag_id",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "cursor",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "count",
        "loc": "query",
        "required": true,
        "type": "number"
      },
      {
        "name": "pinned_comment_ids",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "image_strategy",
        "loc": "query",
        "required": false,
        "type": "comment.CommentImageDisplayStrategy"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "hashtag.GetHashtagDetailRequest",
    "resType": "hashtag.GetHashtagDetailResponse"
  },
  {
    "key": "GetInvitationCampaignInfo",
    "name": "GetInvitationCampaignInfo",
    "module": "commerce",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/commerce/vip/invitation",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/commerce/vip/invitation"
      }
    ],
    "fields": [
      {
        "name": "user_id",
        "loc": "query",
        "required": false,
        "type": "string"
      },
      {
        "name": "sec_uid",
        "loc": "query",
        "required": false,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "GetInvitationCampaignInfoRequest",
    "resType": "GetInvitationCampaignInfoResponse"
  },
  {
    "key": "GetListenDurationActivityRankings",
    "name": "GetListenDurationActivityRankings",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/activity/listen_duration/rankings",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/activity/listen_duration/rankings"
      }
    ],
    "fields": [
      {
        "name": "activity_id",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "rank_type",
        "loc": "body",
        "required": false,
        "type": "ListenDurationActivityRankType"
      },
      {
        "name": "periods",
        "loc": "body",
        "required": false,
        "type": "string[]"
      },
      {
        "name": "cursor",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "count",
        "loc": "body",
        "required": false,
        "type": "number"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "activity.GetListenDurationActivityRankingsRequest",
    "resType": "activity.GetListenDurationActivityRankingsResponse"
  },
  {
    "key": "GetListenVideoTabModule",
    "name": "GetListenVideoTabModule",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/feed/listen-video-tab/module",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/feed/listen-video-tab/module"
      }
    ],
    "fields": [
      {
        "name": "scene",
        "loc": "query",
        "required": false,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "module.GetListenVideoTabModuleRequest",
    "resType": "module.GetListenVideoTabModuleResponse"
  },
  {
    "key": "GetLiveGuideStream",
    "name": "GetLiveGuideStream",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/live/guide-stream",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/live/guide-stream"
      }
    ],
    "fields": [
      {
        "name": "scene",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "enter_from_merge",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "enter_method",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "req_from",
        "loc": "body",
        "required": false,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "live.GetLiveGuideStreamRequest",
    "resType": "live.GetLiveGuideStreamResponse"
  },
  {
    "key": "GetLiveRoom",
    "name": "GetLiveRoom",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/live/room",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/live/room"
      }
    ],
    "fields": [
      {
        "name": "room_id",
        "loc": "query",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "live.GetLiveRoomRequest",
    "resType": "live.GetLiveRoomResponse"
  },
  {
    "key": "GetLocateVideo",
    "name": "GetLocateVideo",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/locate_video",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/locate_video"
      }
    ],
    "fields": [
      {
        "name": "user_id",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "locate_item_id",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "locate_item_cursor",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "end_cursor",
        "loc": "query",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "user.GetLocateVideoRequest",
    "resType": "user.GetLocateVideoResponse"
  },
  {
    "key": "GetLunaUGBarInfo",
    "name": "GetLunaUGBarInfo",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/ug/bar/info",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/ug/bar/info"
      }
    ],
    "fields": [
      {
        "name": "item_id",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "source_type",
        "loc": "query",
        "required": false,
        "type": "ug.SourceType"
      },
      {
        "name": "luna_bar_type",
        "loc": "query",
        "required": false,
        "type": "number"
      },
      {
        "name": "item_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "source_type",
        "loc": "body",
        "required": false,
        "type": "ug.SourceType"
      },
      {
        "name": "luna_bar_type",
        "loc": "body",
        "required": false,
        "type": "number"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "ug.GetLunaUGBarInfoRequest",
    "resType": "ug.GetLunaUGBarInfoResponse"
  },
  {
    "key": "GetLunaUserSettings",
    "name": "GetLunaUserSettings",
    "module": "user",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/user/settings",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/user/settings"
      }
    ],
    "fields": [],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "me.GetLunaUserSettingsRequest",
    "resType": "me.GetLunaUserSettingsResponse"
  },
  {
    "key": "GetMagicTasks",
    "name": "GetMagicTasks",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/magic/tasks",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/magic/tasks"
      }
    ],
    "fields": [
      {
        "name": "activity_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "task_ids",
        "loc": "body",
        "required": false,
        "type": "string[]"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "magic.GetMagicTasksRequest",
    "resType": "magic.GetMagicTasksResponse"
  },
  {
    "key": "GetMediaAds",
    "name": "GetMediaAds",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/media_ads",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/media_ads"
      }
    ],
    "fields": [
      {
        "name": "slot_id",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "client_extra_params",
        "loc": "body",
        "required": false,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "ads.GetMediaAdsRequest",
    "resType": "ads.GetMediaAdsResponse"
  },
  {
    "key": "GetMediaMapping",
    "name": "GetMediaMapping",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/media_mapping",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/media_mapping"
      }
    ],
    "fields": [
      {
        "name": "src_media",
        "loc": "body",
        "required": false,
        "type": "media.Media[]"
      },
      {
        "name": "scene",
        "loc": "body",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "media.GetMediaMappingRequest",
    "resType": "media.GetMediaMappingResponse"
  },
  {
    "key": "GetMediaPlayer",
    "name": "GetMediaPlayer",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": "POST",
    "pcVariant": true,
    "path": "/luna/pc/media-player",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/media-player"
      },
      {
        "method": "GET",
        "path": "/luna/pc/media-player"
      },
      {
        "method": "POST",
        "path": "/luna/media-player"
      },
      {
        "method": "POST",
        "path": "/luna/pc/media-player"
      }
    ],
    "fields": [
      {
        "name": "vid",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "media_type",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "media_id",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "queue_type",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "enable_refresh_api",
        "loc": "query",
        "required": false,
        "type": "boolean"
      },
      {
        "name": "enable_dash",
        "loc": "query",
        "required": false,
        "type": "boolean"
      },
      {
        "name": "vid",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "media_type",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "media_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "queue_type",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "limited_free_param",
        "loc": "body",
        "required": false,
        "type": "common.LimitedFreeParam"
      },
      {
        "name": "enable_refresh_api",
        "loc": "body",
        "required": false,
        "type": "boolean"
      },
      {
        "name": "enable_dash",
        "loc": "body",
        "required": false,
        "type": "boolean"
      },
      {
        "name": "scene_name",
        "loc": "body",
        "required": false,
        "type": "string"
      }
    ],
    "official": true,
    "gated": true,
    "login": "unknown",
    "reqType": "media.GetMediaPlayerRequest",
    "resType": "media.GetPlayerInfoResponse"
  },
  {
    "key": "GetMediaStats",
    "name": "GetMediaStats",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": "GET",
    "pcVariant": true,
    "path": "/luna/pc/media-stats",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/media-stats"
      },
      {
        "method": "GET",
        "path": "/luna/pc/media-stats"
      },
      {
        "method": "POST",
        "path": "/luna/media-stats"
      }
    ],
    "fields": [
      {
        "name": "media_id",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "media_type",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "media_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "media_type",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "artist_ids",
        "loc": "body",
        "required": false,
        "type": "string[]"
      }
    ],
    "official": true,
    "gated": false,
    "login": "unknown",
    "reqType": "media.GetMediaStatsRequest",
    "resType": "media.GetMediaStatsResponse"
  },
  {
    "key": "GetMeTabAutoplay",
    "name": "GetMeTabAutoplay",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/me/autoplay",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/me/autoplay"
      }
    ],
    "fields": [],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "playlist.GetMeTabAutoplayRequest",
    "resType": "playlist.GetMeTabAutoplayResponse"
  },
  {
    "key": "GetMiniAppList",
    "name": "GetMiniAppList",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/mini_app/list",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/mini_app/list"
      }
    ],
    "fields": [
      {
        "name": "page",
        "loc": "body",
        "required": true,
        "type": "number"
      },
      {
        "name": "page_size",
        "loc": "body",
        "required": true,
        "type": "number"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "mini_app.GetMiniAppListRequest",
    "resType": "mini_app.GetMiniAppListResponse"
  },
  {
    "key": "GetMixInfo",
    "name": "GetMixInfo",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/h5/mix_info",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/h5/mix_info"
      },
      {
        "method": "POST",
        "path": "/luna/h5/mix_info"
      }
    ],
    "fields": [
      {
        "name": "mix_param",
        "loc": "query",
        "required": false,
        "type": "mix.MixParam[]"
      },
      {
        "name": "mix_param",
        "loc": "body",
        "required": false,
        "type": "mix.MixParam[]"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "mix.GetMixInfoRequest",
    "resType": "mix.GetMixInfoResponse"
  },
  {
    "key": "GetMorePanel",
    "name": "GetMorePanel",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/more-panel",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/more-panel"
      }
    ],
    "fields": [
      {
        "name": "media",
        "loc": "body",
        "required": false,
        "type": "media.Media"
      },
      {
        "name": "related_track_param",
        "loc": "body",
        "required": false,
        "type": "RelatedTrackParam"
      },
      {
        "name": "related_video_param",
        "loc": "body",
        "required": false,
        "type": "RelatedVideoParam"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "more_panel.MorePanelRequest",
    "resType": "more_panel.MorePanelResponse"
  },
  {
    "key": "GetMorePanelResource",
    "name": "GetMorePanelResource",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/more-panel/resource",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/more-panel/resource"
      }
    ],
    "fields": [
      {
        "name": "media",
        "loc": "body",
        "required": false,
        "type": "media.Media"
      },
      {
        "name": "block_type",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "related_track_param",
        "loc": "body",
        "required": false,
        "type": "RelatedTrackParam"
      },
      {
        "name": "related_video_param",
        "loc": "body",
        "required": false,
        "type": "RelatedVideoParam"
      },
      {
        "name": "player_info_param",
        "loc": "body",
        "required": false,
        "type": "feed.FeedPlayerInfoParam"
      },
      {
        "name": "full_media",
        "loc": "body",
        "required": false,
        "type": "boolean"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "more_panel.MorePanelResourceRequest",
    "resType": "more_panel.MorePanelResourceResponse"
  },
  {
    "key": "GetMsgList",
    "name": "GetMsgList",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/notification/list",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/notification/list"
      }
    ],
    "fields": [
      {
        "name": "cursor",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "group_id",
        "loc": "query",
        "required": false,
        "type": "message.MsgGroup"
      },
      {
        "name": "image_strategy",
        "loc": "query",
        "required": false,
        "type": "comment.CommentImageDisplayStrategy"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "message.GetMsgListRequest",
    "resType": "message.GetMsgListResponse"
  },
  {
    "key": "GetMusicMateGuidance",
    "name": "GetMusicMateGuidance",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/social/mate/guidance",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/social/mate/guidance"
      }
    ],
    "fields": [
      {
        "name": "scene",
        "loc": "query",
        "required": true,
        "type": "GuidanceScene"
      },
      {
        "name": "scene",
        "loc": "body",
        "required": true,
        "type": "GuidanceScene"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "music_mate.GetMusicMateGuidanceRequest",
    "resType": "music_mate.GetMusicMateGuidanceResponse"
  },
  {
    "key": "GetMusicMateHistory",
    "name": "GetMusicMateHistory",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/social/mate/history",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/social/mate/history"
      }
    ],
    "fields": [
      {
        "name": "room_id",
        "loc": "body",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "music_mate.GetMusicMateHistoryRequest",
    "resType": "music_mate.GetMusicMateHistoryResponse"
  },
  {
    "key": "GetMyAssets",
    "name": "GetMyAssets",
    "module": "commerce",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/commerce/me/assets",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/commerce/me/assets"
      }
    ],
    "fields": [],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "GetMyAssetsRequest",
    "resType": "GetMyAssetsResponse"
  },
  {
    "key": "GetMyBriefInfo",
    "name": "GetMyBriefInfo",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/h5/me",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/h5/me"
      }
    ],
    "fields": [],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "me.GetMyBriefInfoRequest",
    "resType": "me.GetMyBriefInfoResponse"
  },
  {
    "key": "GetMyCollectionVideoList",
    "name": "GetMyCollectionVideoList",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/me/collection_video_list",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/me/collection_video_list"
      }
    ],
    "fields": [
      {
        "name": "cursor",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "count",
        "loc": "body",
        "required": true,
        "type": "number"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "me.GetMyCollectionVideoListRequest",
    "resType": "me.GetMyCollectionVideoListResponse"
  },
  {
    "key": "GetMyDownloadEntitlements",
    "name": "GetMyDownloadEntitlements",
    "module": "commerce",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/commerce/me/entitlements/download",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/commerce/me/entitlements/download"
      }
    ],
    "fields": [
      {
        "name": "tracks",
        "loc": "body",
        "required": false,
        "type": "TrackBrief[]"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "GetMyDownloadEntitlementsRequest",
    "resType": "GetMyDownloadEntitlementsResponse"
  },
  {
    "key": "GetMyFavoriteVideoList",
    "name": "GetMyFavoriteVideoList",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/me/favorite_video_list",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/me/favorite_video_list"
      }
    ],
    "fields": [
      {
        "name": "cursor",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "count",
        "loc": "body",
        "required": true,
        "type": "number"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "me.GetMyFavoriteVideoListRequest",
    "resType": "me.GetMyFavoriteVideoListResponse"
  },
  {
    "key": "GetMyInfo",
    "name": "GetMyInfo",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": "GET",
    "pcVariant": true,
    "path": "/luna/pc/me",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/me"
      },
      {
        "method": "GET",
        "path": "/luna/pc/me"
      }
    ],
    "fields": [
      {
        "name": "includes",
        "loc": "body",
        "required": false,
        "type": "Include[]"
      }
    ],
    "official": true,
    "gated": false,
    "login": "static",
    "reqType": "me.GetMyInfoRequest",
    "resType": "me.GetMyInfoResponse"
  },
  {
    "key": "GetMyListenStats",
    "name": "GetMyListenStats",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/me/listen_stats",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/me/listen_stats"
      }
    ],
    "fields": [
      {
        "name": "ab_param",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "recent_friend_rankings_version",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "schema_extra",
        "loc": "body",
        "required": false,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "me.GetMyListenStatsRequest",
    "resType": "me.GetMyListenStatsResponse"
  },
  {
    "key": "GetMyMixedCollections",
    "name": "GetMyMixedCollections",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": "GET",
    "pcVariant": true,
    "path": "/luna/pc/me/collection/mixed",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/me/collection/mixed"
      },
      {
        "method": "GET",
        "path": "/luna/pc/me/collection/mixed"
      }
    ],
    "fields": [
      {
        "name": "cursor",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "count",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "item_types",
        "loc": "query",
        "required": false,
        "type": "string[]"
      }
    ],
    "official": true,
    "gated": false,
    "login": "static",
    "reqType": "me.GetMyMixedCollectionsRequest",
    "resType": "user.GetUserMixedCollectionsResponse"
  },
  {
    "key": "GetMyMusicWall",
    "name": "GetMyMusicWall",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/me/music_wall",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/me/music_wall"
      }
    ],
    "fields": [
      {
        "name": "feed_music_wall_extra",
        "loc": "body",
        "required": false,
        "type": "feed.RecExtraMusicWall"
      },
      {
        "name": "ab_param",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "recent_rankings_version",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "schema_extra",
        "loc": "body",
        "required": false,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "me.GetMyMusicWallRequest",
    "resType": "me.GetMyMusicWallResponse"
  },
  {
    "key": "GetMyOrders",
    "name": "GetMyOrders",
    "module": "commerce_membership",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/commerce/v2/my_orders",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/commerce/v2/my_orders"
      }
    ],
    "fields": [],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "GetMyOrdersRequest",
    "resType": "GetMyOrdersResponse"
  },
  {
    "key": "GetMyPlaylists",
    "name": "GetMyPlaylists",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": "GET",
    "pcVariant": true,
    "path": "/luna/pc/me/playlist",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/me/playlist"
      },
      {
        "method": "GET",
        "path": "/luna/pc/me/playlist"
      },
      {
        "method": "POST",
        "path": "/luna/me/playlist/v2"
      }
    ],
    "fields": [
      {
        "name": "cursor",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "count",
        "loc": "query",
        "required": true,
        "type": "number"
      },
      {
        "name": "cursor",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "count",
        "loc": "body",
        "required": true,
        "type": "number"
      },
      {
        "name": "ab_param",
        "loc": "body",
        "required": true,
        "type": "string"
      }
    ],
    "official": true,
    "gated": false,
    "login": "static",
    "reqType": "me.GetMyPlaylistsRequest",
    "resType": "playlist.GetPlaylistsResponse"
  },
  {
    "key": "GetMyPrivacySetting",
    "name": "GetMyPrivacySetting",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": "GET",
    "pcVariant": true,
    "path": "/luna/pc/me/privacy/setting",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/me/privacy/setting"
      },
      {
        "method": "GET",
        "path": "/luna/pc/me/privacy/setting"
      }
    ],
    "fields": [],
    "official": true,
    "gated": false,
    "login": "static",
    "reqType": "me.GetPrivacySettingRequest",
    "resType": "me.GetPrivacySettingResponse"
  },
  {
    "key": "GetMySpecialStats",
    "name": "GetMySpecialStats",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/me/special_stats",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/me/special_stats"
      }
    ],
    "fields": [
      {
        "name": "user_special_stats_type",
        "loc": "body",
        "required": false,
        "type": "user.UserSpecialStatsType[]"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "me.GetMySpecialStatsRequest",
    "resType": "me.GetMySpecialStatsResponse"
  },
  {
    "key": "GetMySubscription",
    "name": "GetMySubscription",
    "module": "commerce",
    "method": "GET",
    "declaredMethod": "GET",
    "pcVariant": true,
    "path": "/luna/pc/commerce/me/subscription",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/commerce/me/subscription"
      },
      {
        "method": "GET",
        "path": "/luna/pc/commerce/me/subscription"
      }
    ],
    "fields": [
      {
        "name": "redeem_token",
        "loc": "query",
        "required": false,
        "type": "string"
      },
      {
        "name": "first_req",
        "loc": "query",
        "required": false,
        "type": "boolean"
      }
    ],
    "official": true,
    "gated": false,
    "login": "static",
    "reqType": "GetMySubscriptionRequest",
    "resType": "GetMySubscriptionsResponse"
  },
  {
    "key": "GetMySummary",
    "name": "GetMySummary",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/h5/me/summary",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/h5/me/summary"
      }
    ],
    "fields": [],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "summary.GetMySummaryRequest",
    "resType": "summary.GetMySummaryResponse"
  },
  {
    "key": "GetMySummary2023",
    "name": "GetMySummary2023",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/h5/summary2023",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/h5/summary2023"
      }
    ],
    "fields": [],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "summary2023.GetMySummary2023Request",
    "resType": "summary2023.GetMySummary2023Response"
  },
  {
    "key": "GetMySummary2024",
    "name": "GetMySummary2024",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/summary-2024",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/summary-2024"
      }
    ],
    "fields": [
      {
        "name": "mock_user_id",
        "loc": "query",
        "required": false,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "summary2024.GetMySummary2024Request",
    "resType": "summary2024.GetMySummary2024Response"
  },
  {
    "key": "GetMySummary2025",
    "name": "GetMySummary2025",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/summary-2025",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/summary-2025"
      }
    ],
    "fields": [
      {
        "name": "mock_user_id",
        "loc": "query",
        "required": false,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "summary2025.GetMySummary2025Request",
    "resType": "summary2025.GetMySummary2025Response"
  },
  {
    "key": "GetMyVideoList",
    "name": "GetMyVideoList",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/me/video_list",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/me/video_list"
      }
    ],
    "fields": [
      {
        "name": "cursor",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "count",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "locate_item_id",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "reverse",
        "loc": "query",
        "required": true,
        "type": "boolean"
      },
      {
        "name": "end_cursor",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "cursor",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "count",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "locate_item_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "reverse",
        "loc": "body",
        "required": true,
        "type": "boolean"
      },
      {
        "name": "end_cursor",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "ab_param",
        "loc": "body",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "me.GetMyVideoListRequest",
    "resType": "me.GetMyVideoListResponse"
  },
  {
    "key": "GetOffersTokensForPC",
    "name": "GetOffersTokensForPC",
    "module": "commerce_membership",
    "method": "POST",
    "declaredMethod": "POST",
    "pcVariant": true,
    "path": "/luna/pc/commerce/v2/offers/tokens",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/pc/commerce/v2/offers/tokens"
      }
    ],
    "fields": [
      {
        "name": "offer_snapshot_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "report_param",
        "loc": "body",
        "required": true,
        "type": "string"
      }
    ],
    "official": true,
    "gated": false,
    "login": "static",
    "reqType": "GetOffersTokensForPCRequest",
    "resType": "GetOffersTokensForPCResponse"
  },
  {
    "key": "GetOffersTokensStatusForPC",
    "name": "GetOffersTokensStatusForPC",
    "module": "commerce_membership",
    "method": "POST",
    "declaredMethod": "POST",
    "pcVariant": true,
    "path": "/luna/pc/commerce/v2/offers/tokens/status",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/pc/commerce/v2/offers/tokens/status"
      }
    ],
    "fields": [
      {
        "name": "token",
        "loc": "body",
        "required": true,
        "type": "string"
      }
    ],
    "official": true,
    "gated": false,
    "login": "static",
    "reqType": "GetOffersTokensStatusForPCRequest",
    "resType": "GetOffersTokensStatusForPCResponse"
  },
  {
    "key": "GetPlayerInfo",
    "name": "GetPlayerInfo",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/player",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/player"
      }
    ],
    "fields": [
      {
        "name": "media_id",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "type",
        "loc": "query",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "media.GetMediaPlayerInfoRequest",
    "resType": "media.GetPlayerInfoResponse"
  },
  {
    "key": "GetPlayerInfoV2",
    "name": "GetPlayerInfoV2",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/${requestData.params.id}/player",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/${requestData.params.id}/player"
      }
    ],
    "fields": [
      {
        "name": "id",
        "loc": "params",
        "required": true,
        "type": "string"
      },
      {
        "name": "media_id",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "type",
        "loc": "query",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "media.GetPlayerInfoRequest",
    "resType": "media.GetPlayerInfoResponse"
  },
  {
    "key": "GetPlaylistDetail",
    "name": "GetPlaylistDetail",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": "GET",
    "pcVariant": true,
    "path": "/luna/pc/playlist/detail",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/playlist/detail"
      },
      {
        "method": "GET",
        "path": "/luna/pc/playlist/detail"
      },
      {
        "method": "POST",
        "path": "/luna/playlist/detail"
      },
      {
        "method": "POST",
        "path": "/luna/pc/playlist/detail"
      }
    ],
    "fields": [
      {
        "name": "playlist_id",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "cursor",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "count",
        "loc": "query",
        "required": true,
        "type": "number"
      },
      {
        "name": "user_id",
        "loc": "query",
        "required": false,
        "type": "string"
      },
      {
        "name": "type",
        "loc": "query",
        "required": false,
        "type": "number"
      },
      {
        "name": "only_need_media",
        "loc": "query",
        "required": false,
        "type": "boolean"
      },
      {
        "name": "only_need_media_id",
        "loc": "query",
        "required": false,
        "type": "boolean"
      },
      {
        "name": "sec_uid",
        "loc": "query",
        "required": false,
        "type": "string"
      },
      {
        "name": "feed_playlist_extra",
        "loc": "query",
        "required": false,
        "type": "feed.RecExtraGetPlaylistDetail"
      },
      {
        "name": "scene",
        "loc": "query",
        "required": false,
        "type": "PlaylistDetailScene"
      },
      {
        "name": "media",
        "loc": "query",
        "required": false,
        "type": "media.Media[]"
      },
      {
        "name": "sort_type",
        "loc": "query",
        "required": false,
        "type": "playlist.PlaylistSortType"
      },
      {
        "name": "session_id",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "reverse",
        "loc": "query",
        "required": true,
        "type": "boolean"
      },
      {
        "name": "ab_param",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "playlist_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "cursor",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "count",
        "loc": "body",
        "required": true,
        "type": "number"
      },
      {
        "name": "user_id",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "type",
        "loc": "body",
        "required": false,
        "type": "number"
      },
      {
        "name": "only_need_media",
        "loc": "body",
        "required": false,
        "type": "boolean"
      },
      {
        "name": "only_need_media_id",
        "loc": "body",
        "required": false,
        "type": "boolean"
      },
      {
        "name": "sec_uid",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "feed_playlist_extra",
        "loc": "body",
        "required": false,
        "type": "feed.RecExtraGetPlaylistDetail"
      },
      {
        "name": "feed_playlist_trigger",
        "loc": "body",
        "required": false,
        "type": "playlist.FeedPlaylistTrigger"
      },
      {
        "name": "scene",
        "loc": "body",
        "required": false,
        "type": "PlaylistDetailScene"
      },
      {
        "name": "media",
        "loc": "body",
        "required": false,
        "type": "media.Media[]"
      },
      {
        "name": "sort_type",
        "loc": "body",
        "required": false,
        "type": "playlist.PlaylistSortType"
      },
      {
        "name": "session_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "reverse",
        "loc": "body",
        "required": true,
        "type": "boolean"
      },
      {
        "name": "limited_free_scene",
        "loc": "body",
        "required": false,
        "type": "media.LimitedFreeScene"
      },
      {
        "name": "ab_param",
        "loc": "body",
        "required": true,
        "type": "string"
      }
    ],
    "official": true,
    "gated": false,
    "login": "unknown",
    "reqType": "playlist.GetPlaylistDetailRequest",
    "resType": "playlist.GetPlaylistDetailResponse"
  },
  {
    "key": "GetPlaylistFeedMedia",
    "name": "GetPlaylistFeedMedia",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/playlist/feed/media",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/playlist/feed/media"
      }
    ],
    "fields": [
      {
        "name": "playlist_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "play_mode",
        "loc": "body",
        "required": true,
        "type": "playlist.PlayMode"
      },
      {
        "name": "feed_session_id",
        "loc": "body",
        "required": false,
        "type": "number"
      },
      {
        "name": "played_media",
        "loc": "body",
        "required": false,
        "type": "media.MediaPlayed[]"
      },
      {
        "name": "click_media",
        "loc": "body",
        "required": false,
        "type": "media.Media"
      },
      {
        "name": "feed_extra",
        "loc": "body",
        "required": false,
        "type": "feed.RecExtraGetPlaylistFeedMedia"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "playlist.GetPlaylistFeedMediaRequest",
    "resType": "playlist.GetPlaylistFeedMediaResponse"
  },
  {
    "key": "GetPlaylistRelatedMedia",
    "name": "GetPlaylistRelatedMedia",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/playlist/related_media",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/playlist/related_media"
      }
    ],
    "fields": [
      {
        "name": "playlist_id",
        "loc": "body",
        "required": true,
        "type": "number"
      },
      {
        "name": "playlist_type",
        "loc": "body",
        "required": true,
        "type": "number"
      },
      {
        "name": "req_count",
        "loc": "body",
        "required": false,
        "type": "number"
      },
      {
        "name": "first_req_time",
        "loc": "body",
        "required": false,
        "type": "number"
      },
      {
        "name": "played_media",
        "loc": "body",
        "required": false,
        "type": "media.MediaPlayed[]"
      },
      {
        "name": "feed_extra",
        "loc": "body",
        "required": false,
        "type": "feed.PlaylistRelatedMediaFeedExtra"
      },
      {
        "name": "limited_free_scene",
        "loc": "body",
        "required": false,
        "type": "media.LimitedFreeScene"
      },
      {
        "name": "selected_boost",
        "loc": "body",
        "required": false,
        "type": "boost.SelectedBoost"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "playlist.GetPlaylistRelatedMediaRequest",
    "resType": "playlist.GetPlaylistRelatedMediaResponse"
  },
  {
    "key": "GetPlugVisibility",
    "name": "GetPlugVisibility",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/plug/visibility/detail",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/plug/visibility/detail"
      }
    ],
    "fields": [],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "plug.GetPlugVisibilityRequest",
    "resType": "plug.GetPlugVisibilityResponse"
  },
  {
    "key": "GetPreviewMsg",
    "name": "GetPreviewMsg",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/h5/preview",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/h5/preview"
      }
    ],
    "fields": [
      {
        "name": "template_id",
        "loc": "body",
        "required": true,
        "type": "number"
      },
      {
        "name": "media_list",
        "loc": "body",
        "required": false,
        "type": "summary2023.Summary2023VideoMedia[]"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "summary2023.GetPreviewMsgRequest",
    "resType": "summary2023.GetPreviewMsgResponse"
  },
  {
    "key": "GetPurchaseOfferToken",
    "name": "GetPurchaseOfferToken",
    "module": "commerce",
    "method": "POST",
    "declaredMethod": "POST",
    "pcVariant": true,
    "path": "/luna/pc/commerce/offers/tokens",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/pc/commerce/offers/tokens"
      }
    ],
    "fields": [
      {
        "name": "offer_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "report_param",
        "loc": "body",
        "required": true,
        "type": "string"
      }
    ],
    "official": true,
    "gated": false,
    "login": "static",
    "reqType": "GetPurchaseOfferTokenRequest",
    "resType": "GetPurchaseOfferTokenResponse"
  },
  {
    "key": "GetRecentPlayedMedia",
    "name": "GetRecentPlayedMedia",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": "GET",
    "pcVariant": true,
    "path": "/luna/pc/me/recently-played-media",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/me/recently-played-media"
      },
      {
        "method": "GET",
        "path": "/luna/pc/me/recently-played-media"
      }
    ],
    "fields": [
      {
        "name": "cursor",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "count",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "media_type",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "scene",
        "loc": "query",
        "required": true,
        "type": "string"
      }
    ],
    "official": true,
    "gated": false,
    "login": "static",
    "reqType": "me.GetRecentPlayedMediaRequest",
    "resType": "me.GetRecentPlayedMediaResponse"
  },
  {
    "key": "GetRecentPlayedStats",
    "name": "GetRecentPlayedStats",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/me/recently-played-stats",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/me/recently-played-stats"
      }
    ],
    "fields": [],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "me.GetRecentPlayedStatsRequest",
    "resType": "me.GetRecentPlayedStatsResponse"
  },
  {
    "key": "GetRecentPlayedTracks",
    "name": "GetRecentPlayedTracks",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/me/recently-played",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/me/recently-played"
      }
    ],
    "fields": [
      {
        "name": "cursor",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "count",
        "loc": "query",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "me.GetRecentPlayedTracksRequest",
    "resType": "me.GetRecentPlayedTracksResponse"
  },
  {
    "key": "GetRecommendEmoticons",
    "name": "GetRecommendEmoticons",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/emoticons/recommend",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/emoticons/recommend"
      }
    ],
    "fields": [],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "emoticon.GetRecommendEmoticonsRequest",
    "resType": "emoticon.GetRecommendEmoticonsResponse"
  },
  {
    "key": "GetRecommendHashtags",
    "name": "GetRecommendHashtags",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/hashtag/recommend",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/hashtag/recommend"
      }
    ],
    "fields": [
      {
        "name": "group_id",
        "loc": "query",
        "required": false,
        "type": "string"
      },
      {
        "name": "group_type",
        "loc": "query",
        "required": false,
        "type": "number"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "hashtag.GetRecommendHashtagsRequest",
    "resType": "hashtag.GetRecommendHashtagsResponse"
  },
  {
    "key": "GetRecommendPlaylist",
    "name": "GetRecommendPlaylist",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/me/playlist/recommend",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/me/playlist/recommend"
      }
    ],
    "fields": [],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "playlist.GetRecommendPlaylistRequest",
    "resType": "playlist.GetRecommendPlaylistResponse"
  },
  {
    "key": "GetRelatedMedia",
    "name": "GetRelatedMedia",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": "POST",
    "pcVariant": true,
    "path": "/luna/pc/media/related",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/media/related"
      },
      {
        "method": "POST",
        "path": "/luna/pc/media/related"
      }
    ],
    "fields": [
      {
        "name": "media_list",
        "loc": "query",
        "required": false,
        "type": "media.Media[]"
      },
      {
        "name": "artist_ids",
        "loc": "query",
        "required": false,
        "type": "string[]"
      },
      {
        "name": "scene_name",
        "loc": "query",
        "required": false,
        "type": "string"
      },
      {
        "name": "media_list",
        "loc": "body",
        "required": false,
        "type": "media.Media[]"
      },
      {
        "name": "artist_ids",
        "loc": "body",
        "required": false,
        "type": "string[]"
      },
      {
        "name": "scene_name",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "played_media",
        "loc": "body",
        "required": false,
        "type": "media.MediaPlayed[]"
      },
      {
        "name": "req_count",
        "loc": "body",
        "required": false,
        "type": "number"
      },
      {
        "name": "first_req_time",
        "loc": "body",
        "required": false,
        "type": "number"
      },
      {
        "name": "feed_related_media_extra",
        "loc": "body",
        "required": false,
        "type": "feed.FeedRelatedMediaExtra"
      },
      {
        "name": "search_query",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "search_related_info",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "category_id",
        "loc": "body",
        "required": false,
        "type": "number"
      },
      {
        "name": "limited_free_scene",
        "loc": "body",
        "required": false,
        "type": "media.LimitedFreeScene"
      },
      {
        "name": "media_type",
        "loc": "body",
        "required": false,
        "type": "feed.FeedMediaType"
      },
      {
        "name": "player_info_param",
        "loc": "body",
        "required": false,
        "type": "feed.FeedPlayerInfoParam"
      },
      {
        "name": "full_media",
        "loc": "body",
        "required": false,
        "type": "boolean"
      }
    ],
    "official": true,
    "gated": false,
    "login": "unknown",
    "reqType": "feed.GetRelatedMediaRequest",
    "resType": "feed.FeedResponse"
  },
  {
    "key": "GetRelatedTracks",
    "name": "GetRelatedTracks",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/track/related",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/track/related"
      },
      {
        "method": "POST",
        "path": "/luna/track/related"
      }
    ],
    "fields": [
      {
        "name": "track_ids",
        "loc": "query",
        "required": false,
        "type": "string[]"
      },
      {
        "name": "artist_ids",
        "loc": "query",
        "required": false,
        "type": "string[]"
      },
      {
        "name": "scene_name",
        "loc": "query",
        "required": false,
        "type": "string"
      },
      {
        "name": "played_tracks",
        "loc": "query",
        "required": false,
        "type": "track.TrackPlayed[]"
      },
      {
        "name": "track_ids",
        "loc": "body",
        "required": false,
        "type": "string[]"
      },
      {
        "name": "artist_ids",
        "loc": "body",
        "required": false,
        "type": "string[]"
      },
      {
        "name": "scene_name",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "played_tracks",
        "loc": "body",
        "required": false,
        "type": "track.TrackPlayed[]"
      },
      {
        "name": "played_media",
        "loc": "body",
        "required": false,
        "type": "media.MediaPlayed[]"
      },
      {
        "name": "feed_related_media_extra",
        "loc": "body",
        "required": false,
        "type": "feed.FeedRelatedMediaExtra"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "feed.GetRelatedTracksRequest",
    "resType": "feed.FeedResponse"
  },
  {
    "key": "GetReportReason",
    "name": "GetReportReason",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": "GET",
    "pcVariant": true,
    "path": "/luna/pc/report/reason",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/pc/report/reason"
      }
    ],
    "fields": [
      {
        "name": "report_type",
        "loc": "query",
        "required": true,
        "type": "string"
      }
    ],
    "official": true,
    "gated": false,
    "login": "unknown",
    "reqType": "report.GetReportReasonRequest",
    "resType": "report.GetReportReasonResponse"
  },
  {
    "key": "GetResource",
    "name": "GetResource",
    "module": "user",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/user/resource",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/user/resource"
      }
    ],
    "fields": [],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "resource.GetResourceRequest",
    "resType": "resource.GetResourceResponse"
  },
  {
    "key": "GetRoomCommerceInfo",
    "name": "GetRoomCommerceInfo",
    "module": "commerce_membership",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/commerce/v2/get_room_commerce_info",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/commerce/v2/get_room_commerce_info"
      }
    ],
    "fields": [
      {
        "name": "room_id",
        "loc": "body",
        "required": true,
        "type": "number"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "GetRoomCommerceInfoRequest",
    "resType": "GetRoomCommerceInfoResponse"
  },
  {
    "key": "GetRoomInfo",
    "name": "GetRoomInfo",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/social/mate/room/info",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/social/mate/room/info"
      }
    ],
    "fields": [
      {
        "name": "room_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "pack_members",
        "loc": "body",
        "required": true,
        "type": "boolean"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "music_mate.GetRoomInfoRequest",
    "resType": "music_mate.GetRoomInfoResponse"
  },
  {
    "key": "GetSchoolCollegeList",
    "name": "GetSchoolCollegeList",
    "module": "user",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/user/me/school/colleges",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/user/me/school/colleges"
      }
    ],
    "fields": [
      {
        "name": "school_name",
        "loc": "query",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "school.GetSchoolCollegeListRequest",
    "resType": "school.GetSchoolCollegeListResponse"
  },
  {
    "key": "GetSchoolList",
    "name": "GetSchoolList",
    "module": "user",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/user/me/school/list",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/user/me/school/list"
      }
    ],
    "fields": [
      {
        "name": "cursor",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "count",
        "loc": "query",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "school.GetSchoolListRequest",
    "resType": "school.GetSchoolListResponse"
  },
  {
    "key": "GetSchoolNearest",
    "name": "GetSchoolNearest",
    "module": "user",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/user/me/school/nearest",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/user/me/school/nearest"
      }
    ],
    "fields": [
      {
        "name": "latitude",
        "loc": "query",
        "required": true,
        "type": "number"
      },
      {
        "name": "longitude",
        "loc": "query",
        "required": true,
        "type": "number"
      },
      {
        "name": "size",
        "loc": "query",
        "required": true,
        "type": "number"
      },
      {
        "name": "location_permission",
        "loc": "query",
        "required": false,
        "type": "boolean"
      },
      {
        "name": "lat",
        "loc": "query",
        "required": false,
        "type": "string"
      },
      {
        "name": "lon",
        "loc": "query",
        "required": false,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "school.GetSchoolNearestRequest",
    "resType": "school.GetSchoolNearestResponse"
  },
  {
    "key": "GetSearchBlock",
    "name": "GetSearchBlock",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/search-block",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/search-block"
      }
    ],
    "fields": [
      {
        "name": "includes",
        "loc": "body",
        "required": false,
        "type": "string[]"
      },
      {
        "name": "ab_param",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "from_query",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "scene_name",
        "loc": "body",
        "required": false,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "search.GetSearchBlockRequest",
    "resType": "search.GetSearchBlockResponse"
  },
  {
    "key": "GetSeoTracks",
    "name": "GetSeoTracks",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/h5/seo_track",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/h5/seo_track"
      }
    ],
    "fields": [
      {
        "name": "track_id",
        "loc": "query",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "seo.GetSeoTracksRequest",
    "resType": "seo.GetSeoTracksResponse"
  },
  {
    "key": "GetShareInfo",
    "name": "GetShareInfo",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": "GET",
    "pcVariant": true,
    "path": "/luna/pc/share_info",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/share_info"
      },
      {
        "method": "GET",
        "path": "/luna/pc/share_info"
      }
    ],
    "fields": [
      {
        "name": "item_type",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "item_id",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "open_anchor_info",
        "loc": "query",
        "required": false,
        "type": "share.OpenAnchorInfo"
      },
      {
        "name": "extra",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "scene",
        "loc": "query",
        "required": true,
        "type": "share.ShareScene"
      }
    ],
    "official": true,
    "gated": false,
    "login": "unknown",
    "reqType": "share.GetShareInfoRequest",
    "resType": "share.GetShareInfoResponse"
  },
  {
    "key": "GetSharePostAwemeStatus",
    "name": "GetSharePostAwemeStatus",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/share/post_aweme/status",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/share/post_aweme/status"
      }
    ],
    "fields": [
      {
        "name": "task_id",
        "loc": "query",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "share.GetSharePostAwemeStatusRequest",
    "resType": "share.GetSharePostAwemeStatusResponse"
  },
  {
    "key": "GetShareUserList",
    "name": "GetShareUserList",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/share/user_list",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/share/user_list"
      }
    ],
    "fields": [
      {
        "name": "count",
        "loc": "body",
        "required": true,
        "type": "number"
      },
      {
        "name": "scene",
        "loc": "body",
        "required": true,
        "type": "share.ShareScene"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "share.GetShareUserListRequest",
    "resType": "share.GetShareUserListResponse"
  },
  {
    "key": "GetSharingItems",
    "name": "GetSharingItems",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/me/sharing_items",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/me/sharing_items"
      }
    ],
    "fields": [
      {
        "name": "target_uid",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "cursor",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "count",
        "loc": "query",
        "required": true,
        "type": "number"
      },
      {
        "name": "image_strategy",
        "loc": "query",
        "required": false,
        "type": "comment.CommentImageDisplayStrategy"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "me.GetSharingItemsRequest",
    "resType": "me.GetSharingItemsResponse"
  },
  {
    "key": "GetSummary2023Video",
    "name": "GetSummary2023Video",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/summary2023/video",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/summary2023/video"
      }
    ],
    "fields": [
      {
        "name": "task_id",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "task_id",
        "loc": "body",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "summary2023.GetSummary2023VideoRequest",
    "resType": "summary2023.GetSummary2023VideoResponse"
  },
  {
    "key": "GetSummary2024Availability",
    "name": "GetSummary2024Availability",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/summary-2024/availability",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/summary-2024/availability"
      }
    ],
    "fields": [],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "summary2024.GetSummary2024AvailabilityRequest",
    "resType": "summary2024.GetSummary2024AvailabilityResponse"
  },
  {
    "key": "GetSummary2025Availability",
    "name": "GetSummary2025Availability",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/summary-2025/availability",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/summary-2025/availability"
      }
    ],
    "fields": [],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "summary2025.GetSummary2025AvailabilityRequest",
    "resType": "summary2025.GetSummary2025AvailabilityResponse"
  },
  {
    "key": "GetTrack",
    "name": "GetTrack",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/track",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/track"
      },
      {
        "method": "POST",
        "path": "/luna/track"
      }
    ],
    "fields": [
      {
        "name": "track_id",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "includes",
        "loc": "query",
        "required": false,
        "type": "string[]"
      },
      {
        "name": "recommend_req_info",
        "loc": "query",
        "required": false,
        "type": "RecommendReqInfo"
      },
      {
        "name": "media_type",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "track_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "includes",
        "loc": "body",
        "required": false,
        "type": "string[]"
      },
      {
        "name": "recommend_req_info",
        "loc": "body",
        "required": false,
        "type": "RecommendReqInfo"
      },
      {
        "name": "media_type",
        "loc": "body",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "track.GetTrackRequest",
    "resType": "track.GetTrackResponse"
  },
  {
    "key": "GetTrackForBell",
    "name": "GetTrackForBell",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/track_for_bell",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/track_for_bell"
      },
      {
        "method": "POST",
        "path": "/luna/track_for_bell"
      }
    ],
    "fields": [
      {
        "name": "track_id",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "media_type",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "track_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "media_type",
        "loc": "body",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "track.GetTrackForBellRequest",
    "resType": "track.GetTrackV2Response"
  },
  {
    "key": "GetTrackPlayerInfo",
    "name": "GetTrackPlayerInfo",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/track_player",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/track_player"
      }
    ],
    "fields": [
      {
        "name": "track_id",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "type",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "enable_refresh_api",
        "loc": "query",
        "required": false,
        "type": "boolean"
      },
      {
        "name": "enable_refresh_api",
        "loc": "body",
        "required": false,
        "type": "boolean"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "media.GetTrackPlayerInfoRequest",
    "resType": "media.GetTrackPlayerInfoResponse"
  },
  {
    "key": "GetTrackV2",
    "name": "GetTrackV2",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": "POST",
    "pcVariant": true,
    "path": "/luna/pc/track_v2",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/track_v2"
      },
      {
        "method": "GET",
        "path": "/luna/pc/track_v2"
      },
      {
        "method": "POST",
        "path": "/luna/track_v2"
      },
      {
        "method": "POST",
        "path": "/luna/pc/track_v2"
      }
    ],
    "fields": [
      {
        "name": "track_id",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "media_type",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "queue_type",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "need_show_diversion_anchor",
        "loc": "query",
        "required": false,
        "type": "string"
      },
      {
        "name": "scene",
        "loc": "query",
        "required": false,
        "type": "track.TrackV2Scene"
      },
      {
        "name": "enable_refresh_api",
        "loc": "query",
        "required": false,
        "type": "boolean"
      },
      {
        "name": "track_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "media_type",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "queue_type",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "limited_free_param",
        "loc": "body",
        "required": false,
        "type": "common.LimitedFreeParam"
      },
      {
        "name": "need_show_diversion_anchor",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "extra_params",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "scene",
        "loc": "body",
        "required": false,
        "type": "track.TrackV2Scene"
      },
      {
        "name": "enable_refresh_api",
        "loc": "body",
        "required": false,
        "type": "boolean"
      },
      {
        "name": "scene_name",
        "loc": "body",
        "required": false,
        "type": "string"
      }
    ],
    "official": true,
    "gated": true,
    "login": "unknown",
    "reqType": "track.GetTrackV2Request",
    "resType": "track.GetTrackV2Response"
  },
  {
    "key": "GetUGTrackInfo",
    "name": "GetUGTrackInfo",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/ug/track/info",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/ug/track/info"
      },
      {
        "method": "POST",
        "path": "/luna/ug/track/info"
      }
    ],
    "fields": [
      {
        "name": "track_ids",
        "loc": "query",
        "required": false,
        "type": "string[]"
      },
      {
        "name": "track_ids",
        "loc": "body",
        "required": false,
        "type": "string[]"
      },
      {
        "name": "scene_name",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "queue_type",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "limited_free_scene",
        "loc": "body",
        "required": false,
        "type": "media.LimitedFreeScene"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "ug.GetUGTrackInfoRequest",
    "resType": "ug.GetUGTrackInfoResponse"
  },
  {
    "key": "GetUploaderInfo",
    "name": "GetUploaderInfo",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": "GET",
    "pcVariant": true,
    "path": "/luna/pc/video/uploader",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/video/uploader"
      },
      {
        "method": "GET",
        "path": "/luna/pc/video/uploader"
      }
    ],
    "fields": [
      {
        "name": "upload_type",
        "loc": "query",
        "required": true,
        "type": "UploadType"
      },
      {
        "name": "scene",
        "loc": "query",
        "required": true,
        "type": "UploadScene"
      },
      {
        "name": "sdk_version",
        "loc": "query",
        "required": true,
        "type": "UploadSDKVersion"
      }
    ],
    "official": true,
    "gated": false,
    "login": "unknown",
    "reqType": "media.GetUploderInfoRequest",
    "resType": "media.GetUploaderInfoResponse"
  },
  {
    "key": "GetUpsell",
    "name": "GetUpsell",
    "module": "commerce_membership",
    "method": "GET",
    "declaredMethod": "GET",
    "pcVariant": true,
    "path": "/luna/pc/commerce/v2/upsell",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/commerce/v2/upsell"
      },
      {
        "method": "GET",
        "path": "/luna/pc/commerce/v2/upsell"
      }
    ],
    "fields": [],
    "official": true,
    "gated": false,
    "login": "static",
    "reqType": "GetUpsellRequest",
    "resType": "GetUpsellResponse"
  },
  {
    "key": "GetUpsells",
    "name": "GetUpsells",
    "module": "commerce",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/commerce/upsells",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/commerce/upsells"
      }
    ],
    "fields": [
      {
        "name": "scene",
        "loc": "query",
        "required": false,
        "type": "common.RequestScene"
      },
      {
        "name": "free_vip_token",
        "loc": "query",
        "required": false,
        "type": "string"
      },
      {
        "name": "first_req",
        "loc": "query",
        "required": false,
        "type": "boolean"
      },
      {
        "name": "need_payment_compensation",
        "loc": "query",
        "required": false,
        "type": "boolean"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "GetUpsellsRequest",
    "resType": "GetUpsellsResponse"
  },
  {
    "key": "GetUpsellsConfig",
    "name": "GetUpsellsConfig",
    "module": "commerce",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/commerce/upsells_config",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/commerce/upsells_config"
      }
    ],
    "fields": [
      {
        "name": "scene",
        "loc": "query",
        "required": false,
        "type": "common.RequestScene"
      },
      {
        "name": "free_vip_token",
        "loc": "query",
        "required": false,
        "type": "string"
      },
      {
        "name": "first_req",
        "loc": "query",
        "required": false,
        "type": "boolean"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "GetUpsellsConfigRequest",
    "resType": "GetUpsellsConfigResponse"
  },
  {
    "key": "GetUserArtistCollection",
    "name": "GetUserArtistCollection",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/user/collection/artist",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/user/collection/artist"
      }
    ],
    "fields": [
      {
        "name": "user_id",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "cursor",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "count",
        "loc": "query",
        "required": true,
        "type": "number"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "user.GetUserArtistCollectionRequest",
    "resType": "me.GetArtistCollectionResponse"
  },
  {
    "key": "GetUserBookingActivityInfo",
    "name": "GetUserBookingActivityInfo",
    "module": "commerce_membership",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/commerce/v2/album/booking/${requestData.params.activity_id}",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/commerce/v2/album/booking/${requestData.params.activity_id}"
      }
    ],
    "fields": [
      {
        "name": "activity_id",
        "loc": "params",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "GetUserBookingActivityInfoRequest",
    "resType": "GetUserBookingActivityInfoResponse"
  },
  {
    "key": "GetUserHashtagComments",
    "name": "GetUserHashtagComments",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/hashtag/user_comments",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/hashtag/user_comments"
      }
    ],
    "fields": [
      {
        "name": "user_id",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "cursor",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "count",
        "loc": "query",
        "required": true,
        "type": "number"
      },
      {
        "name": "image_strategy",
        "loc": "query",
        "required": false,
        "type": "comment.CommentImageDisplayStrategy"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "hashtag.GetUserHashtagCommentsRequest",
    "resType": "hashtag.GetUserHashtagCommentsResponse"
  },
  {
    "key": "GetUserInfo",
    "name": "GetUserInfo",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": "GET",
    "pcVariant": true,
    "path": "/luna/pc/users/${requestData.params.user_id}",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/users/${requestData.params.user_id}"
      },
      {
        "method": "GET",
        "path": "/luna/user/info"
      },
      {
        "method": "GET",
        "path": "/luna/pc/users/${requestData.params.user_id}"
      }
    ],
    "fields": [
      {
        "name": "user_id",
        "loc": "params",
        "required": true,
        "type": "string"
      },
      {
        "name": "user_id",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "sec_uid",
        "loc": "query",
        "required": true,
        "type": "string"
      }
    ],
    "official": true,
    "gated": false,
    "login": "unknown",
    "reqType": "user.GetUserInfoRequest",
    "resType": "user.GetUserInfoResponse"
  },
  {
    "key": "GetUserInfoByToken",
    "name": "GetUserInfoByToken",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/token/user/info",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/token/user/info"
      }
    ],
    "fields": [
      {
        "name": "token",
        "loc": "query",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "user.GetUserInfoByTokenRequest",
    "resType": "user.GetUserInfoByTokenResponse"
  },
  {
    "key": "GetUserLiveRoom",
    "name": "GetUserLiveRoom",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/users/live_room",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/users/live_room"
      }
    ],
    "fields": [
      {
        "name": "user_id",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "lite_pack",
        "loc": "query",
        "required": true,
        "type": "boolean"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "live.GetUserLiveRoomRequest",
    "resType": "live.GetUserLiveRoomResponse"
  },
  {
    "key": "GetUserMixedCollections",
    "name": "GetUserMixedCollections",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": "GET",
    "pcVariant": true,
    "path": "/luna/pc/user/collection/mixed",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/user/collection/mixed"
      },
      {
        "method": "GET",
        "path": "/luna/pc/user/collection/mixed"
      }
    ],
    "fields": [
      {
        "name": "user_id",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "item_types",
        "loc": "query",
        "required": false,
        "type": "string[]"
      },
      {
        "name": "cursor",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "count",
        "loc": "query",
        "required": true,
        "type": "number"
      },
      {
        "name": "sec_uid",
        "loc": "query",
        "required": false,
        "type": "string"
      }
    ],
    "official": true,
    "gated": false,
    "login": "unknown",
    "reqType": "user.GetUserMixedCollectionsRequest",
    "resType": "user.GetUserMixedCollectionsResponse"
  },
  {
    "key": "GetUserMixInfo",
    "name": "GetUserMixInfo",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/user/mix_info",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/user/mix_info"
      }
    ],
    "fields": [
      {
        "name": "user_id",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "cursor",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "count",
        "loc": "query",
        "required": true,
        "type": "number"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "user.GetUserMixInfoRequest",
    "resType": "user.GetUserMixInfoResponse"
  },
  {
    "key": "GetUserMusicWall",
    "name": "GetUserMusicWall",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/users/${requestData.params.user_id}/music_wall",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/users/${requestData.params.user_id}/music_wall"
      },
      {
        "method": "POST",
        "path": "/luna/users/${requestData.params.user_id}/music_wall"
      },
      {
        "method": "POST",
        "path": "/luna/user/music_wall"
      }
    ],
    "fields": [
      {
        "name": "user_id",
        "loc": "params",
        "required": true,
        "type": "string"
      },
      {
        "name": "user_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "feed_music_wall_extra",
        "loc": "body",
        "required": false,
        "type": "feed.RecExtraMusicWall"
      },
      {
        "name": "sec_uid",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "ab_param",
        "loc": "body",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "user.GetUserMusicWallRequest",
    "resType": "user.GetUserMusicWallResponse"
  },
  {
    "key": "GetUserPlaylists",
    "name": "GetUserPlaylists",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": "GET",
    "pcVariant": true,
    "path": "/luna/pc/user/playlist",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/user/playlist"
      },
      {
        "method": "GET",
        "path": "/luna/pc/user/playlist"
      },
      {
        "method": "POST",
        "path": "/luna/user/playlist"
      },
      {
        "method": "POST",
        "path": "/luna/pc/user/playlist"
      }
    ],
    "fields": [
      {
        "name": "user_id",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "cursor",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "count",
        "loc": "query",
        "required": true,
        "type": "number"
      },
      {
        "name": "sec_uid",
        "loc": "query",
        "required": false,
        "type": "string"
      },
      {
        "name": "scene",
        "loc": "query",
        "required": true,
        "type": "UserPlaylistScene"
      },
      {
        "name": "user_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "cursor",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "count",
        "loc": "body",
        "required": true,
        "type": "number"
      },
      {
        "name": "sec_uid",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "ab_param",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "scene",
        "loc": "body",
        "required": true,
        "type": "UserPlaylistScene"
      }
    ],
    "official": true,
    "gated": false,
    "login": "unknown",
    "reqType": "user.GetUserPlaylistsRequest",
    "resType": "playlist.GetPlaylistsResponse"
  },
  {
    "key": "GetUserRecentRooms",
    "name": "GetUserRecentRooms",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/social/mate/room/user_recent",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/social/mate/room/user_recent"
      }
    ],
    "fields": [
      {
        "name": "user_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "room_type",
        "loc": "body",
        "required": true,
        "type": "number"
      },
      {
        "name": "only_active",
        "loc": "body",
        "required": true,
        "type": "boolean"
      },
      {
        "name": "filter_cross_device",
        "loc": "body",
        "required": true,
        "type": "boolean"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "music_mate.GetUserRecentRoomsRequest",
    "resType": "music_mate.GetUserRecentRoomsResponse"
  },
  {
    "key": "GetUserVideoList",
    "name": "GetUserVideoList",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/user/video_list",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/user/video_list"
      }
    ],
    "fields": [
      {
        "name": "user_id",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "artist_id",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "cursor",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "count",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "locate_item_id",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "reverse",
        "loc": "query",
        "required": true,
        "type": "boolean"
      },
      {
        "name": "end_cursor",
        "loc": "query",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "user.GetUserVideoListRequest",
    "resType": "user.GetUserVideoListResponse"
  },
  {
    "key": "GetVideo",
    "name": "GetVideo",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/video",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/video"
      }
    ],
    "fields": [
      {
        "name": "video_id",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "type",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "includes",
        "loc": "query",
        "required": false,
        "type": "string[]"
      },
      {
        "name": "video_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "type",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "includes",
        "loc": "body",
        "required": false,
        "type": "string[]"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "video.GetVideoRequest",
    "resType": "video.GetVideoResponse"
  },
  {
    "key": "GetVideoMix",
    "name": "GetVideoMix",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/video_mix",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/video_mix"
      }
    ],
    "fields": [
      {
        "name": "mix_id",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "count",
        "loc": "query",
        "required": true,
        "type": "number"
      },
      {
        "name": "cursor",
        "loc": "query",
        "required": true,
        "type": "number"
      },
      {
        "name": "reverse",
        "loc": "query",
        "required": true,
        "type": "boolean"
      },
      {
        "name": "mix_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "count",
        "loc": "body",
        "required": true,
        "type": "number"
      },
      {
        "name": "cursor",
        "loc": "body",
        "required": true,
        "type": "number"
      },
      {
        "name": "reverse",
        "loc": "body",
        "required": true,
        "type": "boolean"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "video.GetVideoMixRequest",
    "resType": "video.GetVideoMixResponse"
  },
  {
    "key": "GetVideoPlaylistDetail",
    "name": "GetVideoPlaylistDetail",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/video_playlist/detail",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/video_playlist/detail"
      }
    ],
    "fields": [
      {
        "name": "video_id",
        "loc": "query",
        "required": false,
        "type": "string"
      },
      {
        "name": "count",
        "loc": "query",
        "required": false,
        "type": "number"
      },
      {
        "name": "cursor",
        "loc": "query",
        "required": false,
        "type": "number"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "video.GetVideoPlaylistDetailRequest",
    "resType": "video.GetVideoPlaylistDetailResponse"
  },
  {
    "key": "GetVideoV2",
    "name": "GetVideoV2",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": "POST",
    "pcVariant": true,
    "path": "/luna/pc/video_v2",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/video_v2"
      },
      {
        "method": "POST",
        "path": "/luna/pc/video_v2"
      }
    ],
    "fields": [
      {
        "name": "video_id",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "type",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "enable_refresh_api",
        "loc": "query",
        "required": false,
        "type": "boolean"
      },
      {
        "name": "enable_dash",
        "loc": "query",
        "required": false,
        "type": "boolean"
      },
      {
        "name": "video_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "type",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "enable_refresh_api",
        "loc": "body",
        "required": false,
        "type": "boolean"
      },
      {
        "name": "enable_dash",
        "loc": "body",
        "required": false,
        "type": "boolean"
      },
      {
        "name": "scene_name",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "queue_type",
        "loc": "body",
        "required": false,
        "type": "string"
      }
    ],
    "official": true,
    "gated": true,
    "login": "unknown",
    "reqType": "video.GetVideoV2Request",
    "resType": "video.GetVideoV2Response"
  },
  {
    "key": "GetVolumeStrategy",
    "name": "GetVolumeStrategy",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/device/volume",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/device/volume"
      }
    ],
    "fields": [],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "device.GetVolumeStrategyRequest",
    "resType": "device.GetVolumeStrategyResponse"
  },
  {
    "key": "goapi_ReportAction",
    "name": "ReportAction",
    "alias": "ReportAction",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": "POST",
    "pcVariant": true,
    "path": "/luna/pc/action",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/action"
      },
      {
        "method": "POST",
        "path": "/luna/pc/action"
      }
    ],
    "fields": [
      {
        "name": "actions",
        "loc": "body",
        "required": false,
        "type": "misc.Action[]"
      },
      {
        "name": "report_action_extra",
        "loc": "body",
        "required": false,
        "type": "feed.FeedReportActionExtra"
      }
    ],
    "official": true,
    "gated": false,
    "login": "unknown",
    "reqType": "misc.ReportActionsRequest",
    "resType": "misc.ReportActionsResponse"
  },
  {
    "key": "ImportPlaylist",
    "name": "ImportPlaylist",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/me/playlist/import",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/me/playlist/import"
      }
    ],
    "fields": [
      {
        "name": "url",
        "loc": "body",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "playlist.ImportPlaylistRequest",
    "resType": "playlist.ImportPlaylistResponse"
  },
  {
    "key": "IMSend",
    "name": "IMSend",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/im/send",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/im/send"
      }
    ],
    "fields": [
      {
        "name": "user_ids",
        "loc": "body",
        "required": false,
        "type": "string[]"
      },
      {
        "name": "msg_type",
        "loc": "body",
        "required": false,
        "type": "number"
      },
      {
        "name": "awe_type",
        "loc": "body",
        "required": false,
        "type": "number"
      },
      {
        "name": "content",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "conv_short_ids",
        "loc": "body",
        "required": false,
        "type": "string[]"
      },
      {
        "name": "scene",
        "loc": "body",
        "required": true,
        "type": "share.ShareScene"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "im.IMSendRequest",
    "resType": "im.IMSendResponse"
  },
  {
    "key": "JoinActivity",
    "name": "JoinActivity",
    "module": "commerce_membership",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/commerce/v2/join_activity",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/commerce/v2/join_activity"
      }
    ],
    "fields": [
      {
        "name": "activity",
        "loc": "body",
        "required": false,
        "type": "benefit.ActivityItem"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "JoinActivityRequest",
    "resType": "JoinActivityResponse"
  },
  {
    "key": "Launch",
    "name": "Launch",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": "GET",
    "pcVariant": true,
    "path": "/luna/pc/launch",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/launch"
      },
      {
        "method": "GET",
        "path": "/luna/pc/launch"
      }
    ],
    "fields": [],
    "official": true,
    "gated": false,
    "login": "unknown",
    "reqType": "misc.LaunchRequest",
    "resType": "misc.LaunchResponse"
  },
  {
    "key": "LaunchDevice",
    "name": "LaunchDevice",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/launch/device",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/launch/device"
      }
    ],
    "fields": [],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "misc.LaunchDeviceRequest",
    "resType": "misc.LaunchDeviceResponse"
  },
  {
    "key": "LightUpArtists",
    "name": "LightUpArtists",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/artist/light_up",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/artist/light_up"
      }
    ],
    "fields": [
      {
        "name": "artist_ids",
        "loc": "body",
        "required": false,
        "type": "string[]"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "artist.LightUpArtistsRequest",
    "resType": "artist.LightUpArtistsResponse"
  },
  {
    "key": "LikeUserListenDuration",
    "name": "LikeUserListenDuration",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/user/listen_duration/like",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/user/listen_duration/like"
      }
    ],
    "fields": [
      {
        "name": "to_user_ids",
        "loc": "body",
        "required": false,
        "type": "number[]"
      },
      {
        "name": "action",
        "loc": "body",
        "required": true,
        "type": "number"
      },
      {
        "name": "version",
        "loc": "body",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "user.LikeUserListenDurationRequest",
    "resType": "general.GeneralResponse"
  },
  {
    "key": "ListArtistAlbums",
    "name": "ListArtistAlbums",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": "GET",
    "pcVariant": true,
    "path": "/luna/pc/artists/${requestData.params.artist_id}/albums",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/artists/${requestData.params.artist_id}/albums"
      },
      {
        "method": "GET",
        "path": "/luna/pc/artists/${requestData.params.artist_id}/albums"
      }
    ],
    "fields": [
      {
        "name": "artist_id",
        "loc": "params",
        "required": true,
        "type": "string"
      },
      {
        "name": "cursor",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "count",
        "loc": "query",
        "required": true,
        "type": "string"
      }
    ],
    "official": true,
    "gated": false,
    "login": "unknown",
    "reqType": "artist.ListArtistAlbumsRequest",
    "resType": "artist.ListArtistAlbumsResponse"
  },
  {
    "key": "ListArtistTracks",
    "name": "ListArtistTracks",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": "GET",
    "pcVariant": true,
    "path": "/luna/pc/artists/${requestData.params.artist_id}/tracks",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/artists/${requestData.params.artist_id}/tracks"
      },
      {
        "method": "GET",
        "path": "/luna/pc/artists/${requestData.params.artist_id}/tracks"
      }
    ],
    "fields": [
      {
        "name": "artist_id",
        "loc": "params",
        "required": true,
        "type": "string"
      },
      {
        "name": "cursor",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "count",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "sort_type",
        "loc": "query",
        "required": false,
        "type": "ArtistTrackSortType"
      },
      {
        "name": "cursor",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "count",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "sort_type",
        "loc": "body",
        "required": false,
        "type": "ArtistTrackSortType"
      },
      {
        "name": "passthrough",
        "loc": "body",
        "required": false,
        "type": "Record<string, string>"
      }
    ],
    "official": true,
    "gated": false,
    "login": "unknown",
    "reqType": "artist.ListArtistTracksRequest",
    "resType": "artist.ListArtistTracksResponse"
  },
  {
    "key": "ListComments",
    "name": "ListComments",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": "GET",
    "pcVariant": true,
    "path": "/luna/pc/comments",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/comments"
      },
      {
        "method": "GET",
        "path": "/luna/h5/comments"
      },
      {
        "method": "GET",
        "path": "/luna/pc/comments"
      }
    ],
    "fields": [
      {
        "name": "group_id",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "cursor",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "count",
        "loc": "query",
        "required": true,
        "type": "number"
      },
      {
        "name": "group_type",
        "loc": "query",
        "required": true,
        "type": "GroupType"
      },
      {
        "name": "image_strategy",
        "loc": "query",
        "required": false,
        "type": "comment.CommentImageDisplayStrategy"
      },
      {
        "name": "sort_type",
        "loc": "query",
        "required": false,
        "type": "string"
      }
    ],
    "official": true,
    "gated": false,
    "login": "unknown",
    "reqType": "comment.ListCommentsRequest",
    "resType": "comment.ListCommentsResponse"
  },
  {
    "key": "ListenVideoReminder",
    "name": "ListenVideoReminder",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/listen-video/reminder",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/listen-video/reminder"
      }
    ],
    "fields": [
      {
        "name": "listen_reco_session_info",
        "loc": "body",
        "required": false,
        "type": "feed.ListenRecoSessionInfo"
      },
      {
        "name": "recent_lv_consume",
        "loc": "body",
        "required": false,
        "type": "Record<string, feed.MediaPlayInfo>"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "module.ListenVideoReminderRequest",
    "resType": "module.ListenVideoReminderResponse"
  },
  {
    "key": "ListLibraExperiments",
    "name": "ListLibraExperiments",
    "module": "commerce",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/commerce/experiments",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/commerce/experiments"
      }
    ],
    "fields": [
      {
        "name": "page_num",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "page_size",
        "loc": "query",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "ListLibraExperimentsRequest",
    "resType": "ListLibraExperimentsResponse"
  },
  {
    "key": "ListReplies",
    "name": "ListReplies",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": "GET",
    "pcVariant": true,
    "path": "/luna/pc/comments/${requestData.params.comment_id}/replies",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/comments/${requestData.params.comment_id}/replies"
      },
      {
        "method": "GET",
        "path": "/luna/pc/comments/${requestData.params.comment_id}/replies"
      }
    ],
    "fields": [
      {
        "name": "comment_id",
        "loc": "params",
        "required": true,
        "type": "string"
      },
      {
        "name": "cursor",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "count",
        "loc": "query",
        "required": true,
        "type": "number"
      },
      {
        "name": "image_strategy",
        "loc": "query",
        "required": false,
        "type": "comment.CommentImageDisplayStrategy"
      },
      {
        "name": "ab_param",
        "loc": "query",
        "required": false,
        "type": "string"
      },
      {
        "name": "group_id",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "group_type",
        "loc": "query",
        "required": true,
        "type": "GroupType"
      }
    ],
    "official": true,
    "gated": false,
    "login": "unknown",
    "reqType": "comment.ListRepliesRequest",
    "resType": "comment.ListRepliesResponse"
  },
  {
    "key": "LogEvent",
    "name": "LogEvent",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/log/event",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/log/event"
      }
    ],
    "fields": [
      {
        "name": "event_key",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "details",
        "loc": "body",
        "required": false,
        "type": "log_event.EventDetails"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "log_event.LogEventRequest",
    "resType": "log_event.LogEventResponse"
  },
  {
    "key": "MAppendPlaylistMedia",
    "name": "MAppendPlaylistMedia",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": "POST",
    "pcVariant": true,
    "path": "/luna/pc/me/playlist/media/append",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/me/playlist/media/append"
      },
      {
        "method": "POST",
        "path": "/luna/pc/me/playlist/media/append"
      }
    ],
    "fields": [
      {
        "name": "playlist_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "media",
        "loc": "body",
        "required": false,
        "type": "media.Media[]"
      }
    ],
    "official": true,
    "gated": false,
    "login": "static",
    "reqType": "playlist.MAppendPlaylistMediaRequest",
    "resType": "playlist.MAppendPlaylistMediaResponse"
  },
  {
    "key": "MAppendPlaylistTracks",
    "name": "MAppendPlaylistTracks",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/me/playlist/track/append",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/me/playlist/track/append"
      }
    ],
    "fields": [
      {
        "name": "playlist_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "track_ids",
        "loc": "body",
        "required": false,
        "type": "string[]"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "playlist.MAppendPlaylistTracksRequest",
    "resType": "playlist.MAppendPlaylistTracksResponse"
  },
  {
    "key": "MarkMediaList",
    "name": "MarkMediaList",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/me/mark/media",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/me/mark/media"
      }
    ],
    "fields": [
      {
        "name": "media",
        "loc": "body",
        "required": false,
        "type": "media.Media[]"
      },
      {
        "name": "mark_action",
        "loc": "body",
        "required": true,
        "type": "MarkActionType"
      },
      {
        "name": "extra_param",
        "loc": "body",
        "required": false,
        "type": "ExtraParam"
      },
      {
        "name": "scene",
        "loc": "body",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "me.MarkMediaListRequest",
    "resType": "me.MarkMediaListResponse"
  },
  {
    "key": "MarkRead",
    "name": "MarkRead",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/notification/mark_read",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/notification/mark_read"
      }
    ],
    "fields": [
      {
        "name": "mark_type",
        "loc": "body",
        "required": true,
        "type": "message.MarkReadType"
      },
      {
        "name": "group_id",
        "loc": "body",
        "required": false,
        "type": "message.MsgGroup"
      },
      {
        "name": "msg_id",
        "loc": "body",
        "required": false,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "message.MarkReadRequest",
    "resType": "message.MarkReadResponse"
  },
  {
    "key": "MCheckMedia",
    "name": "MCheckMedia",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": "POST",
    "pcVariant": true,
    "path": "/luna/pc/mcheck",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/mcheck"
      },
      {
        "method": "POST",
        "path": "/luna/pc/mcheck"
      }
    ],
    "fields": [
      {
        "name": "media_list",
        "loc": "body",
        "required": false,
        "type": "media.Media[]"
      },
      {
        "name": "scene",
        "loc": "body",
        "required": false,
        "type": "number"
      },
      {
        "name": "limited_free_param_map",
        "loc": "body",
        "required": false,
        "type": "Record<string, common.LimitedFreeParam>"
      },
      {
        "name": "scene_name",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "queue_type",
        "loc": "body",
        "required": false,
        "type": "string"
      }
    ],
    "official": true,
    "gated": false,
    "login": "unknown",
    "reqType": "media.MCheckMediaRequest",
    "resType": "media.MCheckMediaResponse"
  },
  {
    "key": "MCheckTrack",
    "name": "MCheckTrack",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/track/mcheck",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/track/mcheck"
      }
    ],
    "fields": [
      {
        "name": "track_ids",
        "loc": "body",
        "required": false,
        "type": "string[]"
      },
      {
        "name": "scene",
        "loc": "body",
        "required": false,
        "type": "number"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "track.MCheckTrackRequest",
    "resType": "track.MCheckTrackResponse"
  },
  {
    "key": "MDeleteCollectedAlbums",
    "name": "MDeleteCollectedAlbums",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": "POST",
    "pcVariant": true,
    "path": "/luna/pc/me/collection/album/delete",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/me/collection/album/delete"
      },
      {
        "method": "POST",
        "path": "/luna/pc/me/collection/album/delete"
      }
    ],
    "fields": [
      {
        "name": "album_ids",
        "loc": "body",
        "required": false,
        "type": "string[]"
      }
    ],
    "official": true,
    "gated": false,
    "login": "static",
    "reqType": "me.DeleteCollectedAlbumsRequest",
    "resType": "me.DeleteCollectedAlbumsResponse"
  },
  {
    "key": "MDeleteCollectedArtists",
    "name": "MDeleteCollectedArtists",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": "POST",
    "pcVariant": true,
    "path": "/luna/pc/me/collection/artist/delete",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/me/collection/artist/delete"
      },
      {
        "method": "POST",
        "path": "/luna/pc/me/collection/artist/delete"
      }
    ],
    "fields": [
      {
        "name": "artist_ids",
        "loc": "body",
        "required": false,
        "type": "string[]"
      }
    ],
    "official": true,
    "gated": false,
    "login": "static",
    "reqType": "me.DeleteCollectedArtistsRequest",
    "resType": "me.DeleteCollectedArtistsResponse"
  },
  {
    "key": "MDeleteCollectedPlaylists",
    "name": "MDeleteCollectedPlaylists",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": "POST",
    "pcVariant": true,
    "path": "/luna/pc/me/collection/playlist/delete",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/me/collection/playlist/delete"
      },
      {
        "method": "POST",
        "path": "/luna/pc/me/collection/playlist/delete"
      }
    ],
    "fields": [
      {
        "name": "playlist_ids",
        "loc": "body",
        "required": false,
        "type": "string[]"
      }
    ],
    "official": true,
    "gated": false,
    "login": "static",
    "reqType": "me.DeleteCollectedPlaylistsRequest",
    "resType": "me.DeleteCollectedPlaylistsResponse"
  },
  {
    "key": "MDeleteCollectedTracks",
    "name": "MDeleteCollectedTracks",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": "POST",
    "pcVariant": false,
    "path": "/luna/me/collection/track/delete",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/me/collection/track/delete"
      }
    ],
    "fields": [
      {
        "name": "track_ids",
        "loc": "body",
        "required": false,
        "type": "string[]"
      }
    ],
    "official": true,
    "gated": false,
    "login": "static",
    "reqType": "me.DeleteCollectedTracksRequest",
    "resType": "me.DeleteCollectedTracksResponse"
  },
  {
    "key": "MDeletePlaylists",
    "name": "MDeletePlaylists",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": "POST",
    "pcVariant": true,
    "path": "/luna/pc/me/playlist/delete",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/me/playlist/delete"
      },
      {
        "method": "POST",
        "path": "/luna/pc/me/playlist/delete"
      }
    ],
    "fields": [
      {
        "name": "playlist_ids",
        "loc": "body",
        "required": false,
        "type": "string[]"
      }
    ],
    "official": true,
    "gated": false,
    "login": "static",
    "reqType": "playlist.MDeletePlaylistsRequest",
    "resType": "playlist.MDeletePlaylistsResponse"
  },
  {
    "key": "MetabDiscover",
    "name": "MetabDiscover",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/me/discover",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/me/discover"
      }
    ],
    "fields": [
      {
        "name": "ab_param",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "selected_boost",
        "loc": "body",
        "required": false,
        "type": "boost.SelectedBoost"
      },
      {
        "name": "feed_discover_extra",
        "loc": "body",
        "required": false,
        "type": "feed.RecExtraDiscover"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "me.MetabDiscoverRequest",
    "resType": "me.MetabDiscoverResponse"
  },
  {
    "key": "MGetMedia",
    "name": "MGetMedia",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/media",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/media"
      },
      {
        "method": "POST",
        "path": "/luna/media"
      }
    ],
    "fields": [
      {
        "name": "media",
        "loc": "query",
        "required": false,
        "type": "media.Media[]"
      },
      {
        "name": "scene",
        "loc": "query",
        "required": true,
        "type": "MediaScene"
      },
      {
        "name": "media",
        "loc": "body",
        "required": false,
        "type": "media.Media[]"
      },
      {
        "name": "scene",
        "loc": "body",
        "required": true,
        "type": "MediaScene"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "media.MGetMediaRequest",
    "resType": "media.MGetMediaResponse"
  },
  {
    "key": "MGetMediaV2",
    "name": "MGetMediaV2",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/media_v2",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/media_v2"
      },
      {
        "method": "POST",
        "path": "/luna/media_v2"
      }
    ],
    "fields": [
      {
        "name": "scene",
        "loc": "query",
        "required": true,
        "type": "MediaScene"
      },
      {
        "name": "media",
        "loc": "query",
        "required": false,
        "type": "media.ReqMedia[]"
      },
      {
        "name": "scene",
        "loc": "body",
        "required": true,
        "type": "MediaScene"
      },
      {
        "name": "scene_name",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "queue_type",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "limited_free_scene",
        "loc": "body",
        "required": false,
        "type": "media.LimitedFreeScene"
      },
      {
        "name": "media",
        "loc": "body",
        "required": false,
        "type": "media.ReqMedia[]"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "media.MGetMediaV2Request",
    "resType": "media.MGetMediaV2Response"
  },
  {
    "key": "MGetPlaylistImportTasks",
    "name": "MGetPlaylistImportTasks",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/me/playlist/import_task_info",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/me/playlist/import_task_info"
      }
    ],
    "fields": [
      {
        "name": "task_ids",
        "loc": "body",
        "required": false,
        "type": "string[]"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "playlist.MGetPlaylistImportTasksRequest",
    "resType": "playlist.MGetPlaylistImportTasksResponse"
  },
  {
    "key": "ModifyMyAvatarDecoration",
    "name": "ModifyMyAvatarDecoration",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/me/avatar_decoration/modify",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/me/avatar_decoration/modify"
      }
    ],
    "fields": [
      {
        "name": "config_id",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "decoration_id",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "not_bind",
        "loc": "body",
        "required": false,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "summary.ModifyMyAvatarDecorationRequest",
    "resType": "summary.ModifyMyAvatarDecorationResponse"
  },
  {
    "key": "PlaylistSearch",
    "name": "PlaylistSearch",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/playlist/search",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/playlist/search"
      }
    ],
    "fields": [
      {
        "name": "query",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "session_id",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "sort_type",
        "loc": "query",
        "required": false,
        "type": "playlist.PlaylistSortType"
      },
      {
        "name": "playlist_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "query",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "session_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "sort_type",
        "loc": "body",
        "required": false,
        "type": "playlist.PlaylistSortType"
      },
      {
        "name": "limited_free_scene",
        "loc": "body",
        "required": false,
        "type": "media.LimitedFreeScene"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "playlist.PlaylistSearchRequest",
    "resType": "playlist.PlaylistSearchResponse"
  },
  {
    "key": "PlugAction",
    "name": "PlugAction",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/plug/action",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/plug/action"
      }
    ],
    "fields": [
      {
        "name": "action",
        "loc": "body",
        "required": true,
        "type": "plug.PlugActionType"
      },
      {
        "name": "item",
        "loc": "body",
        "required": false,
        "type": "item.Item"
      },
      {
        "name": "enter_from",
        "loc": "body",
        "required": false,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "plug.PlugActionRequest",
    "resType": "plug.PlugActionResponse"
  },
  {
    "key": "Purchase",
    "name": "Purchase",
    "module": "commerce_membership",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/commerce/v2/purchase",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/commerce/v2/purchase"
      }
    ],
    "fields": [
      {
        "name": "scene",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "offer_snapshot_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "pay_params",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "benefited_type",
        "loc": "body",
        "required": false,
        "type": "trade.BenefitedType"
      },
      {
        "name": "benefited_party_list",
        "loc": "body",
        "required": false,
        "type": "string[]"
      },
      {
        "name": "magic_activity_config",
        "loc": "body",
        "required": false,
        "type": "MagicActivityConfig"
      },
      {
        "name": "biz_extra",
        "loc": "body",
        "required": false,
        "type": "PurchaseBizExtra"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "PurchaseRequest",
    "resType": "PurchaseResponse"
  },
  {
    "key": "PurchaseOffer",
    "name": "PurchaseOffer",
    "module": "commerce",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/commerce/offers/purchase",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/commerce/offers/purchase"
      }
    ],
    "fields": [
      {
        "name": "offer_id",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "payment_method",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "item_id",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "item_type",
        "loc": "body",
        "required": false,
        "type": "PaymentItemType"
      },
      {
        "name": "quantity",
        "loc": "body",
        "required": false,
        "type": "number"
      },
      {
        "name": "encrypted_offer_identifier",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "one_step_order",
        "loc": "body",
        "required": false,
        "type": "boolean"
      },
      {
        "name": "pay_params",
        "loc": "body",
        "required": false,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "PurchaseOfferRequest",
    "resType": "PurchaseOfferResponse"
  },
  {
    "key": "PurchaseOfferByToken",
    "name": "PurchaseOfferByToken",
    "module": "commerce",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": true,
    "path": "/luna/pc/commerce/offers/tokens/purchase",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/pc/commerce/offers/tokens/purchase"
      }
    ],
    "fields": [
      {
        "name": "token",
        "loc": "query",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "PurchaseOfferByTokenRequest",
    "resType": "DummyResponse"
  },
  {
    "key": "PurchaseOffersByTokensForPC",
    "name": "PurchaseOffersByTokensForPC",
    "module": "commerce_membership",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": true,
    "path": "/luna/pc/commerce/v2/tokens/purchase",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/pc/commerce/v2/tokens/purchase"
      }
    ],
    "fields": [
      {
        "name": "token",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "scene",
        "loc": "query",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "PurchaseOffersByTokensForPCRequest",
    "resType": "DummyResponse"
  },
  {
    "key": "PurchaseOffersForH5",
    "name": "PurchaseOffersForH5",
    "module": "commerce_membership",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/h5/commerce/v2/purchase",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/h5/commerce/v2/purchase"
      }
    ],
    "fields": [
      {
        "name": "offer_snapshot_id",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "report_params",
        "loc": "query",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "PurchaseOffersForH5Request",
    "resType": "DummyResponse"
  },
  {
    "key": "PurchaseProduct",
    "name": "PurchaseProduct",
    "module": "commerce_membership",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/commerce/v2/purchase_product",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/commerce/v2/purchase_product"
      }
    ],
    "fields": [
      {
        "name": "scene",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "product_type",
        "loc": "body",
        "required": true,
        "type": "product.ProductType"
      },
      {
        "name": "purchase_album_req",
        "loc": "body",
        "required": false,
        "type": "PurchaseAlbumReq"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "PurchaseProductRequest",
    "resType": "PurchaseProductResponse"
  },
  {
    "key": "QueryGamePlayRecord",
    "name": "QueryGamePlayRecord",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/game_play/query_record",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/game_play/query_record"
      }
    ],
    "fields": [
      {
        "name": "query_type",
        "loc": "body",
        "required": true,
        "type": "GamePlayQueryType"
      },
      {
        "name": "query_id",
        "loc": "body",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "game_play.QueryGamePlayRecordRequest",
    "resType": "game_play.QueryGamePlayRecordResponse"
  },
  {
    "key": "QueryGiftOrderBrief",
    "name": "QueryGiftOrderBrief",
    "module": "commerce_membership",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/commerce/v2/gift/order_brief",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/commerce/v2/gift/order_brief"
      }
    ],
    "fields": [
      {
        "name": "gift_token",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "sender_sec_uid",
        "loc": "body",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "QueryGiftOrderBriefRequest",
    "resType": "QueryGiftOrderBriefResponse"
  },
  {
    "key": "QueryTokenStatus",
    "name": "QueryTokenStatus",
    "module": "commerce",
    "method": "GET",
    "declaredMethod": "GET",
    "pcVariant": true,
    "path": "/luna/pc/commerce/offers/tokens/status",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/pc/commerce/offers/tokens/status"
      }
    ],
    "fields": [
      {
        "name": "token",
        "loc": "query",
        "required": true,
        "type": "string"
      }
    ],
    "official": true,
    "gated": false,
    "login": "static",
    "reqType": "QueryTokenStatusRequest",
    "resType": "QueryTokenStatusResponse"
  },
  {
    "key": "QueryZlink",
    "name": "QueryZlink",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/query_zlink",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/query_zlink"
      }
    ],
    "fields": [
      {
        "name": "token",
        "loc": "query",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "share.QueryZlinkRequest",
    "resType": "share.QueryZlinkResponse"
  },
  {
    "key": "ReceiveGift",
    "name": "ReceiveGift",
    "module": "commerce_membership",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/commerce/v2/gift/receive",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/commerce/v2/gift/receive"
      }
    ],
    "fields": [
      {
        "name": "gift_token",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "sender_sec_uid",
        "loc": "body",
        "required": false,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "ReceiveGiftRequest",
    "resType": "ReceiveGiftResponse"
  },
  {
    "key": "ReceiveVoucher",
    "name": "ReceiveVoucher",
    "module": "commerce_membership",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/commerce/v2/voucher/receive",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/commerce/v2/voucher/receive"
      }
    ],
    "fields": [
      {
        "name": "voucher_template_list",
        "loc": "body",
        "required": false,
        "type": "string[]"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "ReceiveVoucherRequest",
    "resType": "ReceiveVoucherResponse"
  },
  {
    "key": "RedeemAsset",
    "name": "RedeemAsset",
    "module": "commerce",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/commerce/asset/redeem",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/commerce/asset/redeem"
      }
    ],
    "fields": [
      {
        "name": "asset_order_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "external_account",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "asset_name",
        "loc": "body",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "RedeemAssetRequest",
    "resType": "RedeemAssetResponse"
  },
  {
    "key": "RedeemFreeVIP",
    "name": "RedeemFreeVIP",
    "module": "commerce",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/commerce/vip/redeem",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/commerce/vip/redeem"
      }
    ],
    "fields": [
      {
        "name": "redeem_token",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "first_req",
        "loc": "body",
        "required": false,
        "type": "boolean"
      },
      {
        "name": "invitation_code",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "activity_name",
        "loc": "body",
        "required": false,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "RedeemFreeVIPRequest",
    "resType": "RedeemFreeVIPResponse"
  },
  {
    "key": "RedeemInvitationCode",
    "name": "RedeemInvitationCode",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/invitation_code",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/invitation_code"
      }
    ],
    "fields": [
      {
        "name": "invitation_code",
        "loc": "body",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "misc.RedeemInvitationCodeRequest",
    "resType": "misc.RedeemInvitationCodeResponse"
  },
  {
    "key": "RefreshInvitationCodeTime",
    "name": "RefreshInvitationCodeTime",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/invitation/refresh_time",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/invitation/refresh_time"
      }
    ],
    "fields": [],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "misc.RefreshInvitationCodeTimeRequest",
    "resType": "misc.RefreshInvitationCodeTimeResponse"
  },
  {
    "key": "RegisterMiniLunaUser",
    "name": "RegisterMiniLunaUser",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/register_mini_luna",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/register_mini_luna"
      }
    ],
    "fields": [],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "mini_luna.RegisterMiniLunaUserRequest",
    "resType": "mini_luna.RegisterMiniLunaUserResponse"
  },
  {
    "key": "RejectFollow",
    "name": "RejectFollow",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/me/follow/reject",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/me/follow/reject"
      }
    ],
    "fields": [
      {
        "name": "user_id",
        "loc": "body",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "me.RejectFollowRequest",
    "resType": "me.RejectFollowResponse"
  },
  {
    "key": "RejectJoin",
    "name": "RejectJoin",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/social/mate/room/reject_join",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/social/mate/room/reject_join"
      }
    ],
    "fields": [
      {
        "name": "room_id",
        "loc": "body",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "music_mate.RejectJoinRequest",
    "resType": "music_mate.RejectJoinResponse"
  },
  {
    "key": "Report",
    "name": "Report",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": "POST",
    "pcVariant": true,
    "path": "/luna/pc/report",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/report"
      },
      {
        "method": "POST",
        "path": "/luna/pc/report"
      }
    ],
    "fields": [
      {
        "name": "content_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "report_type",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "report_reason_code",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "description",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "image_uris",
        "loc": "body",
        "required": false,
        "type": "string[]"
      }
    ],
    "official": true,
    "gated": false,
    "login": "unknown",
    "reqType": "report.ReportRequest",
    "resType": "report.ReportResponse"
  },
  {
    "key": "ReportDeviceProfile",
    "name": "ReportDeviceProfile",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/device/report/info",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/device/report/info"
      }
    ],
    "fields": [
      {
        "name": "device_profile",
        "loc": "body",
        "required": false,
        "type": "device.DeviceProf"
      },
      {
        "name": "app_list",
        "loc": "body",
        "required": false,
        "type": "string[]"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "device.ReportDeviceProfileRequest",
    "resType": "device.ReportDeviceProfileResponse"
  },
  {
    "key": "ReportFeedInfo",
    "name": "ReportFeedInfo",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/feed/report-info",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/feed/report-info"
      }
    ],
    "fields": [
      {
        "name": "info_type",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "content",
        "loc": "body",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "feed.ReportFeedInfoRequest",
    "resType": "feed.ReportFeedInfoResponse"
  },
  {
    "key": "ReportIapAuxiliaryInfo",
    "name": "ReportIapAuxiliaryInfo",
    "module": "commerce_membership",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/commerce/v2/report_iap_info",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/commerce/v2/report_iap_info"
      }
    ],
    "fields": [
      {
        "name": "iap_auxiliary_info_map",
        "loc": "body",
        "required": false,
        "type": "Record<string, IapSubsAuxiliaryInfo>"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "ReportIapAuxiliaryInfoRequest",
    "resType": "ReportIapAuxiliaryInfoResponse"
  },
  {
    "key": "ReportItemAction",
    "name": "ReportItemAction",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/item-action",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/item-action"
      }
    ],
    "fields": [
      {
        "name": "actions",
        "loc": "body",
        "required": false,
        "type": "misc.ItemActionInfo[]"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "misc.ReportItemActionRequest",
    "resType": "misc.ReportItemActionResponse"
  },
  {
    "key": "ReportPurchaseAction",
    "name": "ReportPurchaseAction",
    "module": "commerce_membership",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/commerce/v2/purchase/report_action",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/commerce/v2/purchase/report_action"
      }
    ],
    "fields": [
      {
        "name": "action_type",
        "loc": "body",
        "required": true,
        "type": "constants.PurchaseActionType"
      },
      {
        "name": "order_id",
        "loc": "body",
        "required": false,
        "type": "number"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "ReportPurchaseActionRequest",
    "resType": "ReportPurchaseActionResponse"
  },
  {
    "key": "ReportSample",
    "name": "ReportSample",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/reco_sample",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/reco_sample"
      }
    ],
    "fields": [
      {
        "name": "samples",
        "loc": "body",
        "required": false,
        "type": "reco_sample.RecommendSample[]"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "reco_sample.ReportSampleRequest",
    "resType": "reco_sample.ReportSampleResponse"
  },
  {
    "key": "ReportSID",
    "name": "ReportSID",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/me/report_special_id",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/me/report_special_id"
      }
    ],
    "fields": [
      {
        "name": "user_id",
        "loc": "body",
        "required": false,
        "type": "number"
      },
      {
        "name": "special_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "report_action",
        "loc": "body",
        "required": true,
        "type": "ReportAction"
      },
      {
        "name": "platform",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "appid",
        "loc": "body",
        "required": false,
        "type": "number"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "misc.ReportSpecialIDRequest",
    "resType": "misc.ReportSpecialIDResponse"
  },
  {
    "key": "Search",
    "name": "Search",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": "GET",
    "pcVariant": true,
    "path": "/luna/pc/search/${requestData.params.search_type}",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/search/${requestData.params.search_type}"
      },
      {
        "method": "GET",
        "path": "/luna/pc/search/${requestData.params.search_type}"
      },
      {
        "method": "POST",
        "path": "/luna/search/${requestData.params.search_type}"
      }
    ],
    "fields": [
      {
        "name": "search_type",
        "loc": "params",
        "required": true,
        "type": "search.SearchType"
      },
      {
        "name": "q",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "cursor",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "search_id",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "search_method",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "debug_params",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "from_search_id",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "search_scene",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "scene_name",
        "loc": "query",
        "required": false,
        "type": "string"
      },
      {
        "name": "transit",
        "loc": "query",
        "required": false,
        "type": "search.SearchTransit"
      },
      {
        "name": "q",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "cursor",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "search_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "search_method",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "debug_params",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "from_search_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "search_scene",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "ab_param",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "last_viewed_media",
        "loc": "body",
        "required": false,
        "type": "media.Media"
      },
      {
        "name": "scene_name",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "transit",
        "loc": "body",
        "required": false,
        "type": "search.SearchTransit"
      },
      {
        "name": "limited_free_scene",
        "loc": "body",
        "required": false,
        "type": "media.LimitedFreeScene"
      }
    ],
    "official": true,
    "gated": false,
    "login": "unknown",
    "reqType": "search.SearchRequest",
    "resType": "search.SearchResponse"
  },
  {
    "key": "Search2023",
    "name": "Search2023",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/h5/search/${requestData.params.search_type}",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/h5/search/${requestData.params.search_type}"
      }
    ],
    "fields": [
      {
        "name": "search_type",
        "loc": "params",
        "required": true,
        "type": "search.SearchType"
      },
      {
        "name": "q",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "cursor",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "search_id",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "search_method",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "debug_params",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "from_search_id",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "search_scene",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "scene_name",
        "loc": "query",
        "required": false,
        "type": "string"
      },
      {
        "name": "transit",
        "loc": "query",
        "required": false,
        "type": "search.SearchTransit"
      },
      {
        "name": "q",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "cursor",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "search_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "search_method",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "debug_params",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "from_search_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "search_scene",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "ab_param",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "last_viewed_media",
        "loc": "body",
        "required": false,
        "type": "media.Media"
      },
      {
        "name": "scene_name",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "transit",
        "loc": "body",
        "required": false,
        "type": "search.SearchTransit"
      },
      {
        "name": "limited_free_scene",
        "loc": "body",
        "required": false,
        "type": "media.LimitedFreeScene"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "search.SearchRequest",
    "resType": "search.SearchResponse"
  },
  {
    "key": "SearchCategories",
    "name": "SearchCategories",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/search-categories",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/search-categories"
      }
    ],
    "fields": [
      {
        "name": "search_type",
        "loc": "params",
        "required": true,
        "type": "search.SearchType"
      },
      {
        "name": "q",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "cursor",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "search_id",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "search_method",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "debug_params",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "from_search_id",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "search_scene",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "scene_name",
        "loc": "query",
        "required": false,
        "type": "string"
      },
      {
        "name": "transit",
        "loc": "query",
        "required": false,
        "type": "search.SearchTransit"
      },
      {
        "name": "q",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "cursor",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "search_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "search_method",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "debug_params",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "from_search_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "search_scene",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "ab_param",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "last_viewed_media",
        "loc": "body",
        "required": false,
        "type": "media.Media"
      },
      {
        "name": "scene_name",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "transit",
        "loc": "body",
        "required": false,
        "type": "search.SearchTransit"
      },
      {
        "name": "limited_free_scene",
        "loc": "body",
        "required": false,
        "type": "media.LimitedFreeScene"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "search.SearchRequest",
    "resType": "search.SearchCategoriesResponse"
  },
  {
    "key": "SearchSchool",
    "name": "SearchSchool",
    "module": "user",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/user/me/school/search",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/user/me/school/search"
      }
    ],
    "fields": [
      {
        "name": "keyword",
        "loc": "query",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "school.SearchRequest",
    "resType": "school.SearchResponse"
  },
  {
    "key": "SendGift",
    "name": "SendGift",
    "module": "commerce_membership",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/commerce/v2/gift/send",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/commerce/v2/gift/send"
      }
    ],
    "fields": [
      {
        "name": "order_id",
        "loc": "body",
        "required": true,
        "type": "number"
      },
      {
        "name": "receiver_id",
        "loc": "body",
        "required": true,
        "type": "number"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "SendGiftRequest",
    "resType": "SendGiftResponse"
  },
  {
    "key": "SendInvitePush",
    "name": "SendInvitePush",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/social/mate/room/invite_push",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/social/mate/room/invite_push"
      }
    ],
    "fields": [
      {
        "name": "room_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "from_uid",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "to_uid",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "conv_sid",
        "loc": "body",
        "required": true,
        "type": "number"
      },
      {
        "name": "conv_id",
        "loc": "body",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "music_mate.SendInvitePushRequest",
    "resType": "music_mate.SendInvitePushResponse"
  },
  {
    "key": "SetAlbumDefaultCover",
    "name": "SetAlbumDefaultCover",
    "module": "commerce_membership",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/commerce/v2/album/set_default_cover",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/commerce/v2/album/set_default_cover"
      }
    ],
    "fields": [
      {
        "name": "album_id",
        "loc": "body",
        "required": true,
        "type": "number"
      },
      {
        "name": "cover_id",
        "loc": "body",
        "required": true,
        "type": "number"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "SetAlbumDefaultCoverRequest",
    "resType": "SetAlbumDefaultCoverResponse"
  },
  {
    "key": "SetBoost",
    "name": "SetBoost",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/me/boost",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/me/boost"
      }
    ],
    "fields": [
      {
        "name": "selected_genres",
        "loc": "body",
        "required": false,
        "type": "number[]"
      },
      {
        "name": "selected_langs",
        "loc": "body",
        "required": false,
        "type": "string[]"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "me.SetUserBoostRequest",
    "resType": "me.SetUserBoostResponse"
  },
  {
    "key": "SetPlugVisibility",
    "name": "SetPlugVisibility",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/plug/visibility/set",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/plug/visibility/set"
      }
    ],
    "fields": [
      {
        "name": "visibility",
        "loc": "body",
        "required": false,
        "type": "plug.PlugVisibility"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "plug.SetPlugVisibilityRequest",
    "resType": "plug.SetPlugVisibilityResponse"
  },
  {
    "key": "ShareCodeParse",
    "name": "ShareCodeParse",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/share/code/parse",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/share/code/parse"
      }
    ],
    "fields": [
      {
        "name": "token",
        "loc": "query",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "share.ShareCodeParseRequest",
    "resType": "share.ShareCodeParseResponse"
  },
  {
    "key": "ShareCount",
    "name": "ShareCount",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": "POST",
    "pcVariant": true,
    "path": "/luna/pc/count/shared",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/count/shared"
      },
      {
        "method": "POST",
        "path": "/luna/pc/count/shared"
      }
    ],
    "fields": [
      {
        "name": "items",
        "loc": "body",
        "required": false,
        "type": "share.ShareItem[]"
      },
      {
        "name": "share_platform",
        "loc": "body",
        "required": false,
        "type": "string"
      }
    ],
    "official": true,
    "gated": false,
    "login": "unknown",
    "reqType": "share.ShareCountRequest",
    "resType": "general.GeneralResponse"
  },
  {
    "key": "ShareInvitationCode",
    "name": "ShareInvitationCode",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/invitation/share",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/invitation/share"
      }
    ],
    "fields": [],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "misc.ShareInvitationCodeRequest",
    "resType": "misc.ShareInvitationCodeResponse"
  },
  {
    "key": "SharePostAweme",
    "name": "SharePostAweme",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/share/post_aweme",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/share/post_aweme"
      }
    ],
    "fields": [
      {
        "name": "item_type",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "item_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "share_id",
        "loc": "body",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "share.SharePostAwemeRequest",
    "resType": "share.SharePostAwemeResponse"
  },
  {
    "key": "Shark",
    "name": "Shark",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/shark",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/shark"
      }
    ],
    "fields": [
      {
        "name": "media_list",
        "loc": "body",
        "required": false,
        "type": "media.Media[]"
      },
      {
        "name": "scene_name",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "queue_type",
        "loc": "body",
        "required": false,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "media.SharkRequest",
    "resType": "media.SharkResponse"
  },
  {
    "key": "ShortenZlinkUrl",
    "name": "ShortenZlinkUrl",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/shorten_zlink",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/shorten_zlink"
      }
    ],
    "fields": [
      {
        "name": "zlink_id",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "scheme_string",
        "loc": "query",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "share.ShortenZlinkUrlRequest",
    "resType": "share.ShortenZlinkUrlResponse"
  },
  {
    "key": "SortPlaylistMedia",
    "name": "SortPlaylistMedia",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/me/playlist/media/sort",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/me/playlist/media/sort"
      }
    ],
    "fields": [
      {
        "name": "playlist_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "media",
        "loc": "body",
        "required": false,
        "type": "media.Media[]"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "playlist.SortPlaylistMediaRequest",
    "resType": "playlist.SortPlaylistMediaResponse"
  },
  {
    "key": "SortPlaylistTracks",
    "name": "SortPlaylistTracks",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/me/playlist/track/sort",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/me/playlist/track/sort"
      }
    ],
    "fields": [
      {
        "name": "playlist_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "track_ids",
        "loc": "body",
        "required": false,
        "type": "string[]"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "playlist.SortPlaylistTracksRequest",
    "resType": "playlist.SortPlaylistTracksResponse"
  },
  {
    "key": "SsoToken",
    "name": "SsoToken",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/sso/token",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/sso/token"
      }
    ],
    "fields": [
      {
        "name": "code",
        "loc": "query",
        "required": false,
        "type": "string"
      },
      {
        "name": "state",
        "loc": "query",
        "required": false,
        "type": "string"
      },
      {
        "name": "device_id",
        "loc": "query",
        "required": false,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "sso.SsoTokenRequest",
    "resType": "sso.SsoTokenResponse"
  },
  {
    "key": "SubmitEvaluateResults",
    "name": "SubmitEvaluateResults",
    "module": "user",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/user/evaluation/submit",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/user/evaluation/submit"
      }
    ],
    "fields": [
      {
        "name": "evaluation_id",
        "loc": "body",
        "required": false,
        "type": "number"
      },
      {
        "name": "user_name",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "evaluate_results",
        "loc": "body",
        "required": false,
        "type": "EvaluateResult[]"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "evaluation.SubmitEvaluateResultsRequest",
    "resType": "evaluation.SubmitEvaluateResultsResponse"
  },
  {
    "key": "SubmitGamePlay",
    "name": "SubmitGamePlay",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/game_play/submit",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/game_play/submit"
      }
    ],
    "fields": [
      {
        "name": "need_resp",
        "loc": "body",
        "required": true,
        "type": "boolean"
      },
      {
        "name": "game_play_type",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "feed_mode",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "start_time_ms",
        "loc": "body",
        "required": true,
        "type": "number"
      },
      {
        "name": "end_time_ms",
        "loc": "body",
        "required": true,
        "type": "number"
      },
      {
        "name": "duration",
        "loc": "body",
        "required": true,
        "type": "number"
      },
      {
        "name": "finish_type",
        "loc": "body",
        "required": true,
        "type": "FinishType"
      },
      {
        "name": "track_play_count",
        "loc": "body",
        "required": true,
        "type": "number"
      },
      {
        "name": "extra",
        "loc": "body",
        "required": false,
        "type": "game_play.GamePlayExtra"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "game_play.SubmitGamePlayRequest",
    "resType": "game_play.SubmitGamePlayResponse"
  },
  {
    "key": "Sug",
    "name": "Sug",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": "GET",
    "pcVariant": true,
    "path": "/luna/pc/sug",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/sug"
      },
      {
        "method": "GET",
        "path": "/luna/pc/sug"
      }
    ],
    "fields": [
      {
        "name": "q",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "sug_scene",
        "loc": "query",
        "required": true,
        "type": "string"
      },
      {
        "name": "sug_search_id",
        "loc": "query",
        "required": true,
        "type": "string"
      }
    ],
    "official": true,
    "gated": false,
    "login": "unknown",
    "reqType": "search.SugRequest",
    "resType": "search.SugResponse"
  },
  {
    "key": "SuggestWords",
    "name": "SuggestWords",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/suggest-words/${requestData.params.suggest_type}",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/suggest-words/${requestData.params.suggest_type}"
      }
    ],
    "fields": [
      {
        "name": "suggest_type",
        "loc": "params",
        "required": true,
        "type": "search.SuggestType"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "search.SuggestWordsRequest",
    "resType": "search.SuggestWordsResponse"
  },
  {
    "key": "TLBFeedFallback",
    "name": "TLBFeedFallback",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/feed/tlb-fallback",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/feed/tlb-fallback"
      }
    ],
    "fields": [],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "feed.TLBFeedFallbackRequest",
    "resType": "feed.TLBFeedFallbackResponse"
  },
  {
    "key": "TrackDisLike",
    "name": "TrackDisLike",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/track/dislike",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/track/dislike"
      }
    ],
    "fields": [
      {
        "name": "track_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "artist_ids",
        "loc": "body",
        "required": false,
        "type": "number[]"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "media.TrackDisLikeRequest",
    "resType": "media.TrackDisLikeResponse"
  },
  {
    "key": "UnBookAlbum",
    "name": "UnBookAlbum",
    "module": "commerce_membership",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/commerce/v2/album/unbook",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/commerce/v2/album/unbook"
      }
    ],
    "fields": [
      {
        "name": "activity_id",
        "loc": "body",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "BookAlbumRequest",
    "resType": "BookAlbumResponse"
  },
  {
    "key": "UnfollowUser",
    "name": "UnfollowUser",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": "POST",
    "pcVariant": true,
    "path": "/luna/pc/me/unfollow",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/me/unfollow"
      },
      {
        "method": "POST",
        "path": "/luna/pc/me/unfollow"
      }
    ],
    "fields": [
      {
        "name": "user_id",
        "loc": "body",
        "required": true,
        "type": "string"
      }
    ],
    "official": true,
    "gated": false,
    "login": "static",
    "reqType": "me.UnfollowUserRequest",
    "resType": "me.UnfollowUserResponse"
  },
  {
    "key": "UnreadMsg",
    "name": "UnreadMsg",
    "module": "goapi",
    "method": "GET",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/notification/unread",
    "paths": [
      {
        "method": "GET",
        "path": "/luna/notification/unread"
      }
    ],
    "fields": [
      {
        "name": "group_id",
        "loc": "query",
        "required": true,
        "type": "message.MsgGroup"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "message.UnreadMsgRequest",
    "resType": "message.UnreadMsgResponse"
  },
  {
    "key": "UpdateLunaUserSettings",
    "name": "UpdateLunaUserSettings",
    "module": "user",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/user/settings",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/user/settings"
      }
    ],
    "fields": [
      {
        "name": "avatar_frame_resource_id",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "popup_auto_start_ad",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "music_wall_visibility",
        "loc": "body",
        "required": false,
        "type": "number"
      },
      {
        "name": "disable_cover_mv_auto_play",
        "loc": "body",
        "required": false,
        "type": "number"
      }
    ],
    "official": false,
    "gated": false,
    "login": "unknown",
    "reqType": "me.UpdateLunaUserSettingsRequest",
    "resType": "me.UpdateLunaUserSettingsResponse"
  },
  {
    "key": "UpdateMyInfo",
    "name": "UpdateMyInfo",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/me",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/me"
      }
    ],
    "fields": [
      {
        "name": "nickname",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "avatar_uri",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "gender",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "birthday",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "birthday_hide_level",
        "loc": "body",
        "required": false,
        "type": "number"
      },
      {
        "name": "location",
        "loc": "body",
        "required": false,
        "type": "user.UserLocation"
      },
      {
        "name": "school_info",
        "loc": "body",
        "required": false,
        "type": "user.UserSchool"
      },
      {
        "name": "signature",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "liked_playlist_show_douyin_video",
        "loc": "body",
        "required": false,
        "type": "boolean"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "me.UpdateMyInfoRequest",
    "resType": "me.UpdateMyInfoResponse"
  },
  {
    "key": "UpdateMyPrivacySetting",
    "name": "UpdateMyPrivacySetting",
    "module": "user",
    "method": "POST",
    "declaredMethod": "POST",
    "pcVariant": true,
    "path": "/luna/pc/user/me/privacy/setting",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/user/me/privacy/setting"
      },
      {
        "method": "POST",
        "path": "/luna/pc/user/me/privacy/setting"
      }
    ],
    "fields": [
      {
        "name": "follow_info_visibility",
        "loc": "body",
        "required": false,
        "type": "number"
      },
      {
        "name": "sync_video_to_luna",
        "loc": "body",
        "required": false,
        "type": "number"
      },
      {
        "name": "my_favorite_visibility",
        "loc": "body",
        "required": false,
        "type": "number"
      },
      {
        "name": "music_wall_visibility",
        "loc": "body",
        "required": false,
        "type": "number"
      }
    ],
    "official": true,
    "gated": false,
    "login": "static",
    "reqType": "me.UpdatePrivacySettingRequest",
    "resType": "me.UpdatePrivacySettingResponse"
  },
  {
    "key": "UpdatePlaylistInfo",
    "name": "UpdatePlaylistInfo",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": "POST",
    "pcVariant": true,
    "path": "/luna/pc/me/playlist/update",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/me/playlist/update"
      },
      {
        "method": "POST",
        "path": "/luna/pc/me/playlist/update"
      }
    ],
    "fields": [
      {
        "name": "playlist_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "name",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "description",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "is_private",
        "loc": "body",
        "required": false,
        "type": "boolean"
      },
      {
        "name": "cover_uri",
        "loc": "body",
        "required": false,
        "type": "string"
      }
    ],
    "official": true,
    "gated": false,
    "login": "static",
    "reqType": "playlist.UpdatePlaylistInfoRequest",
    "resType": "playlist.UpdatePlaylistInfoResponse"
  },
  {
    "key": "UpdatePlaylistSortType",
    "name": "UpdatePlaylistSortType",
    "module": "goapi",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/me/playlist/update_sort",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/me/playlist/update_sort"
      }
    ],
    "fields": [
      {
        "name": "playlist_id",
        "loc": "body",
        "required": true,
        "type": "string"
      },
      {
        "name": "sort_type",
        "loc": "body",
        "required": true,
        "type": "playlist.PlaylistSortType"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "playlist.UpdatePlaylistSortTypeRequest",
    "resType": "playlist.UpdatePlaylistSortTypeResponse"
  },
  {
    "key": "Validate",
    "name": "Validate",
    "module": "commerce_membership",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/commerce/v2/validate",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/commerce/v2/validate"
      }
    ],
    "fields": [
      {
        "name": "order_id",
        "loc": "body",
        "required": true,
        "type": "number"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "ValidateRequest",
    "resType": "ValidateResponse"
  },
  {
    "key": "ValidatePurchase",
    "name": "ValidatePurchase",
    "module": "commerce",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/commerce/offers/validate",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/commerce/offers/validate"
      }
    ],
    "fields": [
      {
        "name": "order_id",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "payment_method",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "is_external_success",
        "loc": "body",
        "required": false,
        "type": "boolean"
      },
      {
        "name": "external_error_info",
        "loc": "body",
        "required": false,
        "type": "string"
      },
      {
        "name": "external_order_id",
        "loc": "body",
        "required": false,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "ValidateRequest",
    "resType": "ValidateResponse"
  },
  {
    "key": "ValidateReward",
    "name": "ValidateReward",
    "module": "commerce",
    "method": "POST",
    "declaredMethod": null,
    "pcVariant": false,
    "path": "/luna/commerce/validate_reward",
    "paths": [
      {
        "method": "POST",
        "path": "/luna/commerce/validate_reward"
      }
    ],
    "fields": [
      {
        "name": "transaction_id",
        "loc": "body",
        "required": true,
        "type": "string"
      }
    ],
    "official": false,
    "gated": false,
    "login": "static",
    "reqType": "ValidateRewardRequest",
    "resType": "ValidateRewardResponse"
  }
] as unknown as EndpointDef[]

export interface EndpointSignatures {
  AcceptFollow: typeof ns0.AcceptFollow
  AiAssistantRelated: typeof ns0.AiAssistantRelated
  AIBotChat: typeof ns0.AIBotChat
  AIBotTrigger: typeof ns0.AIBotTrigger
  AppendLaterListen: typeof ns0.AppendLaterListen
  AppendRecentlyPlayedMedia: typeof ns0.AppendRecentlyPlayedMedia
  AppendRecentPlayedTracks: typeof ns0.AppendRecentPlayedTracks
  ApplyFreeVip: typeof ns3.ApplyFreeVip
  BookAlbum: typeof ns3.BookAlbum
  BoostArtists: typeof ns0.BoostArtists
  CancelAccount: typeof ns0.CancelAccount
  CancelBlockUser: typeof ns0.CancelBlockUser
  CancelBlockV2: typeof ns0.CancelBlockV2
  CancelChannelSubs: typeof ns3.CancelChannelSubs
  CancelSubscription: typeof ns2.CancelSubscription
  CheckCode: typeof ns3.CheckCode
  CheckDownload: typeof ns3.CheckDownload
  CheckRedeemCodeFromPhysicalCard: typeof ns2.CheckRedeemCodeFromPhysicalCard
  CheckSensitiveWords: typeof ns0.CheckSensitiveWords
  CheckTrack: typeof ns0.CheckTrack
  CheckUpdate: typeof ns0.CheckUpdate
  CollectAlbums: typeof ns0.CollectAlbums
  CollectArtists: typeof ns0.CollectArtists
  CollectFlowTracks: typeof ns0.CollectFlowTracks
  CollectMediaList: typeof ns0.CollectMediaList
  CollectPlaylists: typeof ns0.CollectPlaylists
  CollectTracks: typeof ns0.CollectTracks
  CommentAction: typeof ns0.CommentAction
  CommentAudioAsr: typeof ns0.CommentAudioAsr
  commerce_membership_PrepayQuery: typeof ns3.PrepayQuery
  commerce_membership_RedeemCode: typeof ns3.RedeemCode
  commerce_membership_ReportAction: typeof ns3.ReportAction
  commerce_PrepayQuery: typeof ns2.PrepayQuery
  commerce_RedeemCode: typeof ns2.RedeemCode
  commerce_ReportAction: typeof ns2.ReportAction
  CommitAudit: typeof ns0.CommitAudit
  CommitBlockUser: typeof ns0.CommitBlockUser
  CommitBlockV2: typeof ns0.CommitBlockV2
  ConfirmBannerTest: typeof ns0.ConfirmBannerTest
  ConnPlugs: typeof ns0.ConnPlugs
  ConsumeBenefit: typeof ns3.ConsumeBenefit
  CreateAnniversaryPlaylist2024: typeof ns0.CreateAnniversaryPlaylist2024
  CreateAnniversaryPlaylist2025: typeof ns0.CreateAnniversaryPlaylist2025
  CreateComment: typeof ns0.CreateComment
  CreatePlaylist: typeof ns0.CreatePlaylist
  CreateRoom: typeof ns0.CreateRoom
  CreateSummary2023Video: typeof ns0.CreateSummary2023Video
  DeleteCollectedFlowTracks: typeof ns0.DeleteCollectedFlowTracks
  DeleteCollectedMediaList: typeof ns0.DeleteCollectedMediaList
  DeleteComment: typeof ns0.DeleteComment
  DeleteMsg: typeof ns0.DeleteMsg
  DeletePlaylistMedia: typeof ns0.DeletePlaylistMedia
  DeletePlaylistTracks: typeof ns0.DeletePlaylistTracks
  DeleteRecentlyPlayedMedia: typeof ns0.DeleteRecentlyPlayedMedia
  DeleteRecentPlayedTracks: typeof ns0.DeleteRecentPlayedTracks
  DeviceBlockArtist: typeof ns0.DeviceBlockArtist
  DeviceBlockUser: typeof ns0.DeviceBlockUser
  DeviceRecentUser: typeof ns0.DeviceRecentUser
  DiscoverMix: typeof ns0.DiscoverMix
  DiscoverView: typeof ns0.DiscoverView
  Dislike: typeof ns0.Dislike
  FeedListenVideo: typeof ns0.FeedListenVideo
  FeedListenVideoTab: typeof ns0.FeedListenVideoTab
  FeedLiveTab: typeof ns0.FeedLiveTab
  FeedMode: typeof ns0.FeedMode
  FeedModeGuidance: typeof ns0.FeedModeGuidance
  FeedPlaylistMedia: typeof ns0.FeedPlaylistMedia
  FeedPlaylistSquare: typeof ns0.FeedPlaylistSquare
  FeedRadioTracks: typeof ns0.FeedRadioTracks
  FeedSongTab: typeof ns0.FeedSongTab
  FeedVideo: typeof ns0.FeedVideo
  FeedVideoPlaylist: typeof ns0.FeedVideoPlaylist
  FeedVideoTab: typeof ns0.FeedVideoTab
  FinishMagicTask: typeof ns0.FinishMagicTask
  FlowGetAlbumDetail: typeof ns0.FlowGetAlbumDetail
  FlowGetArtistMusic: typeof ns0.FlowGetArtistMusic
  FlowGetChartDetail: typeof ns0.FlowGetChartDetail
  FlowGetPlaylistDetail: typeof ns0.FlowGetPlaylistDetail
  FlowGetRelatedMedia: typeof ns0.FlowGetRelatedMedia
  FlowGetTrackListDetail: typeof ns0.FlowGetTrackListDetail
  FlowRecommend: typeof ns0.FlowRecommend
  FlowRecommendNotPack: typeof ns0.FlowRecommendNotPack
  FlowSearch: typeof ns0.FlowSearch
  FollowUser: typeof ns0.FollowUser
  GetAcquisition: typeof ns0.GetAcquisition
  GetActivityInfo: typeof ns0.GetActivityInfo
  GetAlbumDetail: typeof ns0.GetAlbumDetail
  GetAlbumPurchasedPage: typeof ns3.GetAlbumPurchasedPage
  GetAlbumToPurchasePage: typeof ns3.GetAlbumToPurchasePage
  GetArtistCollection: typeof ns0.GetArtistCollection
  GetArtistDetail: typeof ns0.GetArtistDetail
  GetAtList: typeof ns0.GetAtList
  GetAudit: typeof ns0.GetAudit
  GetBlockUserList: typeof ns0.GetBlockUserList
  GetBriefUserInfo: typeof ns0.GetBriefUserInfo
  GetBriefUserInfoV2: typeof ns0.GetBriefUserInfoV2
  GetBytepayPreSignPage: typeof ns3.GetBytepayPreSignPage
  GetCard: typeof ns0.GetCard
  GetChartDetail: typeof ns0.GetChartDetail
  GetComment: typeof ns0.GetComment
  GetCommerceConfig: typeof ns3.GetCommerceConfig
  GetCommerceInfo: typeof ns3.GetCommerceInfo
  GetDeviceActiveMembership: typeof ns3.GetDeviceActiveMembership
  GetDigitalAlbums: typeof ns0.GetDigitalAlbums
  GetEcommerceOrderList: typeof ns2.GetEcommerceOrderList
  GetEligibleOffers: typeof ns2.GetEligibleOffers
  GetEvaluation: typeof ns1.GetEvaluation
  GetFeaturedContentDetail: typeof ns0.GetFeaturedContentDetail
  GetFeaturedContents: typeof ns0.GetFeaturedContents
  GetFollowerList: typeof ns0.GetFollowerList
  GetFollowingList: typeof ns0.GetFollowingList
  GetFollowingLive: typeof ns0.GetFollowingLive
  GetFriendLinkTemplate: typeof ns0.GetFriendLinkTemplate
  GetFriendRankings: typeof ns0.GetFriendRankings
  GetGamePlayConfig: typeof ns0.GetGamePlayConfig
  GetH5AlbumDetail: typeof ns0.GetH5AlbumDetail
  GetH5ArtistDetail: typeof ns0.GetH5ArtistDetail
  GetH5FeaturedContentDetail: typeof ns0.GetH5FeaturedContentDetail
  GetH5PlaylistDetail: typeof ns0.GetH5PlaylistDetail
  GetH5Track: typeof ns0.GetH5Track
  GetH5TrackV2: typeof ns0.GetH5TrackV2
  GetH5UserMusicWall: typeof ns0.GetH5UserMusicWall
  GetH5Video: typeof ns0.GetH5Video
  GetH5VideoV2: typeof ns0.GetH5VideoV2
  GetHashtagDetail: typeof ns0.GetHashtagDetail
  GetInvitationCampaignInfo: typeof ns2.GetInvitationCampaignInfo
  GetListenDurationActivityRankings: typeof ns0.GetListenDurationActivityRankings
  GetListenVideoTabModule: typeof ns0.GetListenVideoTabModule
  GetLiveGuideStream: typeof ns0.GetLiveGuideStream
  GetLiveRoom: typeof ns0.GetLiveRoom
  GetLocateVideo: typeof ns0.GetLocateVideo
  GetLunaUGBarInfo: typeof ns0.GetLunaUGBarInfo
  GetLunaUserSettings: typeof ns1.GetLunaUserSettings
  GetMagicTasks: typeof ns0.GetMagicTasks
  GetMediaAds: typeof ns0.GetMediaAds
  GetMediaMapping: typeof ns0.GetMediaMapping
  GetMediaPlayer: typeof ns0.GetMediaPlayer
  GetMediaStats: typeof ns0.GetMediaStats
  GetMeTabAutoplay: typeof ns0.GetMeTabAutoplay
  GetMiniAppList: typeof ns0.GetMiniAppList
  GetMixInfo: typeof ns0.GetMixInfo
  GetMorePanel: typeof ns0.GetMorePanel
  GetMorePanelResource: typeof ns0.GetMorePanelResource
  GetMsgList: typeof ns0.GetMsgList
  GetMusicMateGuidance: typeof ns0.GetMusicMateGuidance
  GetMusicMateHistory: typeof ns0.GetMusicMateHistory
  GetMyAssets: typeof ns2.GetMyAssets
  GetMyBriefInfo: typeof ns0.GetMyBriefInfo
  GetMyCollectionVideoList: typeof ns0.GetMyCollectionVideoList
  GetMyDownloadEntitlements: typeof ns2.GetMyDownloadEntitlements
  GetMyFavoriteVideoList: typeof ns0.GetMyFavoriteVideoList
  GetMyInfo: typeof ns0.GetMyInfo
  GetMyListenStats: typeof ns0.GetMyListenStats
  GetMyMixedCollections: typeof ns0.GetMyMixedCollections
  GetMyMusicWall: typeof ns0.GetMyMusicWall
  GetMyOrders: typeof ns3.GetMyOrders
  GetMyPlaylists: typeof ns0.GetMyPlaylists
  GetMyPrivacySetting: typeof ns0.GetMyPrivacySetting
  GetMySpecialStats: typeof ns0.GetMySpecialStats
  GetMySubscription: typeof ns2.GetMySubscription
  GetMySummary: typeof ns0.GetMySummary
  GetMySummary2023: typeof ns0.GetMySummary2023
  GetMySummary2024: typeof ns0.GetMySummary2024
  GetMySummary2025: typeof ns0.GetMySummary2025
  GetMyVideoList: typeof ns0.GetMyVideoList
  GetOffersTokensForPC: typeof ns3.GetOffersTokensForPC
  GetOffersTokensStatusForPC: typeof ns3.GetOffersTokensStatusForPC
  GetPlayerInfo: typeof ns0.GetPlayerInfo
  GetPlayerInfoV2: typeof ns0.GetPlayerInfoV2
  GetPlaylistDetail: typeof ns0.GetPlaylistDetail
  GetPlaylistFeedMedia: typeof ns0.GetPlaylistFeedMedia
  GetPlaylistRelatedMedia: typeof ns0.GetPlaylistRelatedMedia
  GetPlugVisibility: typeof ns0.GetPlugVisibility
  GetPreviewMsg: typeof ns0.GetPreviewMsg
  GetPurchaseOfferToken: typeof ns2.GetPurchaseOfferToken
  GetRecentPlayedMedia: typeof ns0.GetRecentPlayedMedia
  GetRecentPlayedStats: typeof ns0.GetRecentPlayedStats
  GetRecentPlayedTracks: typeof ns0.GetRecentPlayedTracks
  GetRecommendEmoticons: typeof ns0.GetRecommendEmoticons
  GetRecommendHashtags: typeof ns0.GetRecommendHashtags
  GetRecommendPlaylist: typeof ns0.GetRecommendPlaylist
  GetRelatedMedia: typeof ns0.GetRelatedMedia
  GetRelatedTracks: typeof ns0.GetRelatedTracks
  GetReportReason: typeof ns0.GetReportReason
  GetResource: typeof ns1.GetResource
  GetRoomCommerceInfo: typeof ns3.GetRoomCommerceInfo
  GetRoomInfo: typeof ns0.GetRoomInfo
  GetSchoolCollegeList: typeof ns1.GetSchoolCollegeList
  GetSchoolList: typeof ns1.GetSchoolList
  GetSchoolNearest: typeof ns1.GetSchoolNearest
  GetSearchBlock: typeof ns0.GetSearchBlock
  GetSeoTracks: typeof ns0.GetSeoTracks
  GetShareInfo: typeof ns0.GetShareInfo
  GetSharePostAwemeStatus: typeof ns0.GetSharePostAwemeStatus
  GetShareUserList: typeof ns0.GetShareUserList
  GetSharingItems: typeof ns0.GetSharingItems
  GetSummary2023Video: typeof ns0.GetSummary2023Video
  GetSummary2024Availability: typeof ns0.GetSummary2024Availability
  GetSummary2025Availability: typeof ns0.GetSummary2025Availability
  GetTrack: typeof ns0.GetTrack
  GetTrackForBell: typeof ns0.GetTrackForBell
  GetTrackPlayerInfo: typeof ns0.GetTrackPlayerInfo
  GetTrackV2: typeof ns0.GetTrackV2
  GetUGTrackInfo: typeof ns0.GetUGTrackInfo
  GetUploaderInfo: typeof ns0.GetUploaderInfo
  GetUpsell: typeof ns3.GetUpsell
  GetUpsells: typeof ns2.GetUpsells
  GetUpsellsConfig: typeof ns2.GetUpsellsConfig
  GetUserArtistCollection: typeof ns0.GetUserArtistCollection
  GetUserBookingActivityInfo: typeof ns3.GetUserBookingActivityInfo
  GetUserHashtagComments: typeof ns0.GetUserHashtagComments
  GetUserInfo: typeof ns0.GetUserInfo
  GetUserInfoByToken: typeof ns0.GetUserInfoByToken
  GetUserLiveRoom: typeof ns0.GetUserLiveRoom
  GetUserMixedCollections: typeof ns0.GetUserMixedCollections
  GetUserMixInfo: typeof ns0.GetUserMixInfo
  GetUserMusicWall: typeof ns0.GetUserMusicWall
  GetUserPlaylists: typeof ns0.GetUserPlaylists
  GetUserRecentRooms: typeof ns0.GetUserRecentRooms
  GetUserVideoList: typeof ns0.GetUserVideoList
  GetVideo: typeof ns0.GetVideo
  GetVideoMix: typeof ns0.GetVideoMix
  GetVideoPlaylistDetail: typeof ns0.GetVideoPlaylistDetail
  GetVideoV2: typeof ns0.GetVideoV2
  GetVolumeStrategy: typeof ns0.GetVolumeStrategy
  goapi_ReportAction: typeof ns0.ReportAction
  ImportPlaylist: typeof ns0.ImportPlaylist
  IMSend: typeof ns0.IMSend
  JoinActivity: typeof ns3.JoinActivity
  Launch: typeof ns0.Launch
  LaunchDevice: typeof ns0.LaunchDevice
  LightUpArtists: typeof ns0.LightUpArtists
  LikeUserListenDuration: typeof ns0.LikeUserListenDuration
  ListArtistAlbums: typeof ns0.ListArtistAlbums
  ListArtistTracks: typeof ns0.ListArtistTracks
  ListComments: typeof ns0.ListComments
  ListenVideoReminder: typeof ns0.ListenVideoReminder
  ListLibraExperiments: typeof ns2.ListLibraExperiments
  ListReplies: typeof ns0.ListReplies
  LogEvent: typeof ns0.LogEvent
  MAppendPlaylistMedia: typeof ns0.MAppendPlaylistMedia
  MAppendPlaylistTracks: typeof ns0.MAppendPlaylistTracks
  MarkMediaList: typeof ns0.MarkMediaList
  MarkRead: typeof ns0.MarkRead
  MCheckMedia: typeof ns0.MCheckMedia
  MCheckTrack: typeof ns0.MCheckTrack
  MDeleteCollectedAlbums: typeof ns0.MDeleteCollectedAlbums
  MDeleteCollectedArtists: typeof ns0.MDeleteCollectedArtists
  MDeleteCollectedPlaylists: typeof ns0.MDeleteCollectedPlaylists
  MDeleteCollectedTracks: typeof ns0.MDeleteCollectedTracks
  MDeletePlaylists: typeof ns0.MDeletePlaylists
  MetabDiscover: typeof ns0.MetabDiscover
  MGetMedia: typeof ns0.MGetMedia
  MGetMediaV2: typeof ns0.MGetMediaV2
  MGetPlaylistImportTasks: typeof ns0.MGetPlaylistImportTasks
  ModifyMyAvatarDecoration: typeof ns0.ModifyMyAvatarDecoration
  PlaylistSearch: typeof ns0.PlaylistSearch
  PlugAction: typeof ns0.PlugAction
  Purchase: typeof ns3.Purchase
  PurchaseOffer: typeof ns2.PurchaseOffer
  PurchaseOfferByToken: typeof ns2.PurchaseOfferByToken
  PurchaseOffersByTokensForPC: typeof ns3.PurchaseOffersByTokensForPC
  PurchaseOffersForH5: typeof ns3.PurchaseOffersForH5
  PurchaseProduct: typeof ns3.PurchaseProduct
  QueryGamePlayRecord: typeof ns0.QueryGamePlayRecord
  QueryGiftOrderBrief: typeof ns3.QueryGiftOrderBrief
  QueryTokenStatus: typeof ns2.QueryTokenStatus
  QueryZlink: typeof ns0.QueryZlink
  ReceiveGift: typeof ns3.ReceiveGift
  ReceiveVoucher: typeof ns3.ReceiveVoucher
  RedeemAsset: typeof ns2.RedeemAsset
  RedeemFreeVIP: typeof ns2.RedeemFreeVIP
  RedeemInvitationCode: typeof ns0.RedeemInvitationCode
  RefreshInvitationCodeTime: typeof ns0.RefreshInvitationCodeTime
  RegisterMiniLunaUser: typeof ns0.RegisterMiniLunaUser
  RejectFollow: typeof ns0.RejectFollow
  RejectJoin: typeof ns0.RejectJoin
  Report: typeof ns0.Report
  ReportAction: typeof ns0.ReportAction
  ReportDeviceProfile: typeof ns0.ReportDeviceProfile
  ReportFeedInfo: typeof ns0.ReportFeedInfo
  ReportIapAuxiliaryInfo: typeof ns3.ReportIapAuxiliaryInfo
  ReportItemAction: typeof ns0.ReportItemAction
  ReportPurchaseAction: typeof ns3.ReportPurchaseAction
  ReportSample: typeof ns0.ReportSample
  ReportSID: typeof ns0.ReportSID
  Search: typeof ns0.Search
  Search2023: typeof ns0.Search2023
  SearchCategories: typeof ns0.SearchCategories
  SearchSchool: typeof ns1.SearchSchool
  SendGift: typeof ns3.SendGift
  SendInvitePush: typeof ns0.SendInvitePush
  SetAlbumDefaultCover: typeof ns3.SetAlbumDefaultCover
  SetBoost: typeof ns0.SetBoost
  SetPlugVisibility: typeof ns0.SetPlugVisibility
  ShareCodeParse: typeof ns0.ShareCodeParse
  ShareCount: typeof ns0.ShareCount
  ShareInvitationCode: typeof ns0.ShareInvitationCode
  SharePostAweme: typeof ns0.SharePostAweme
  Shark: typeof ns0.Shark
  ShortenZlinkUrl: typeof ns0.ShortenZlinkUrl
  SortPlaylistMedia: typeof ns0.SortPlaylistMedia
  SortPlaylistTracks: typeof ns0.SortPlaylistTracks
  SsoToken: typeof ns0.SsoToken
  SubmitEvaluateResults: typeof ns1.SubmitEvaluateResults
  SubmitGamePlay: typeof ns0.SubmitGamePlay
  Sug: typeof ns0.Sug
  SuggestWords: typeof ns0.SuggestWords
  TLBFeedFallback: typeof ns0.TLBFeedFallback
  TrackDisLike: typeof ns0.TrackDisLike
  UnBookAlbum: typeof ns3.UnBookAlbum
  UnfollowUser: typeof ns0.UnfollowUser
  UnreadMsg: typeof ns0.UnreadMsg
  UpdateLunaUserSettings: typeof ns1.UpdateLunaUserSettings
  UpdateMyInfo: typeof ns0.UpdateMyInfo
  UpdateMyPrivacySetting: typeof ns1.UpdateMyPrivacySetting
  UpdatePlaylistInfo: typeof ns0.UpdatePlaylistInfo
  UpdatePlaylistSortType: typeof ns0.UpdatePlaylistSortType
  Validate: typeof ns3.Validate
  ValidatePurchase: typeof ns2.ValidatePurchase
  ValidateReward: typeof ns2.ValidateReward
}

export type EndpointName = keyof EndpointSignatures

export type RequestOf<K extends EndpointName> = NonNullable<Parameters<EndpointSignatures[K]>[1]>
export type ResponseOf<K extends EndpointName> = Awaited<ReturnType<EndpointSignatures[K]>>

export const ENDPOINT_NAMES = ["AcceptFollow","AiAssistantRelated","AIBotChat","AIBotTrigger","AppendLaterListen","AppendRecentlyPlayedMedia","AppendRecentPlayedTracks","ApplyFreeVip","BookAlbum","BoostArtists","CancelAccount","CancelBlockUser","CancelBlockV2","CancelChannelSubs","CancelSubscription","CheckCode","CheckDownload","CheckRedeemCodeFromPhysicalCard","CheckSensitiveWords","CheckTrack","CheckUpdate","CollectAlbums","CollectArtists","CollectFlowTracks","CollectMediaList","CollectPlaylists","CollectTracks","CommentAction","CommentAudioAsr","commerce_membership_PrepayQuery","commerce_membership_RedeemCode","commerce_membership_ReportAction","commerce_PrepayQuery","commerce_RedeemCode","commerce_ReportAction","CommitAudit","CommitBlockUser","CommitBlockV2","ConfirmBannerTest","ConnPlugs","ConsumeBenefit","CreateAnniversaryPlaylist2024","CreateAnniversaryPlaylist2025","CreateComment","CreatePlaylist","CreateRoom","CreateSummary2023Video","DeleteCollectedFlowTracks","DeleteCollectedMediaList","DeleteComment","DeleteMsg","DeletePlaylistMedia","DeletePlaylistTracks","DeleteRecentlyPlayedMedia","DeleteRecentPlayedTracks","DeviceBlockArtist","DeviceBlockUser","DeviceRecentUser","DiscoverMix","DiscoverView","Dislike","FeedListenVideo","FeedListenVideoTab","FeedLiveTab","FeedMode","FeedModeGuidance","FeedPlaylistMedia","FeedPlaylistSquare","FeedRadioTracks","FeedSongTab","FeedVideo","FeedVideoPlaylist","FeedVideoTab","FinishMagicTask","FlowGetAlbumDetail","FlowGetArtistMusic","FlowGetChartDetail","FlowGetPlaylistDetail","FlowGetRelatedMedia","FlowGetTrackListDetail","FlowRecommend","FlowRecommendNotPack","FlowSearch","FollowUser","GetAcquisition","GetActivityInfo","GetAlbumDetail","GetAlbumPurchasedPage","GetAlbumToPurchasePage","GetArtistCollection","GetArtistDetail","GetAtList","GetAudit","GetBlockUserList","GetBriefUserInfo","GetBriefUserInfoV2","GetBytepayPreSignPage","GetCard","GetChartDetail","GetComment","GetCommerceConfig","GetCommerceInfo","GetDeviceActiveMembership","GetDigitalAlbums","GetEcommerceOrderList","GetEligibleOffers","GetEvaluation","GetFeaturedContentDetail","GetFeaturedContents","GetFollowerList","GetFollowingList","GetFollowingLive","GetFriendLinkTemplate","GetFriendRankings","GetGamePlayConfig","GetH5AlbumDetail","GetH5ArtistDetail","GetH5FeaturedContentDetail","GetH5PlaylistDetail","GetH5Track","GetH5TrackV2","GetH5UserMusicWall","GetH5Video","GetH5VideoV2","GetHashtagDetail","GetInvitationCampaignInfo","GetListenDurationActivityRankings","GetListenVideoTabModule","GetLiveGuideStream","GetLiveRoom","GetLocateVideo","GetLunaUGBarInfo","GetLunaUserSettings","GetMagicTasks","GetMediaAds","GetMediaMapping","GetMediaPlayer","GetMediaStats","GetMeTabAutoplay","GetMiniAppList","GetMixInfo","GetMorePanel","GetMorePanelResource","GetMsgList","GetMusicMateGuidance","GetMusicMateHistory","GetMyAssets","GetMyBriefInfo","GetMyCollectionVideoList","GetMyDownloadEntitlements","GetMyFavoriteVideoList","GetMyInfo","GetMyListenStats","GetMyMixedCollections","GetMyMusicWall","GetMyOrders","GetMyPlaylists","GetMyPrivacySetting","GetMySpecialStats","GetMySubscription","GetMySummary","GetMySummary2023","GetMySummary2024","GetMySummary2025","GetMyVideoList","GetOffersTokensForPC","GetOffersTokensStatusForPC","GetPlayerInfo","GetPlayerInfoV2","GetPlaylistDetail","GetPlaylistFeedMedia","GetPlaylistRelatedMedia","GetPlugVisibility","GetPreviewMsg","GetPurchaseOfferToken","GetRecentPlayedMedia","GetRecentPlayedStats","GetRecentPlayedTracks","GetRecommendEmoticons","GetRecommendHashtags","GetRecommendPlaylist","GetRelatedMedia","GetRelatedTracks","GetReportReason","GetResource","GetRoomCommerceInfo","GetRoomInfo","GetSchoolCollegeList","GetSchoolList","GetSchoolNearest","GetSearchBlock","GetSeoTracks","GetShareInfo","GetSharePostAwemeStatus","GetShareUserList","GetSharingItems","GetSummary2023Video","GetSummary2024Availability","GetSummary2025Availability","GetTrack","GetTrackForBell","GetTrackPlayerInfo","GetTrackV2","GetUGTrackInfo","GetUploaderInfo","GetUpsell","GetUpsells","GetUpsellsConfig","GetUserArtistCollection","GetUserBookingActivityInfo","GetUserHashtagComments","GetUserInfo","GetUserInfoByToken","GetUserLiveRoom","GetUserMixedCollections","GetUserMixInfo","GetUserMusicWall","GetUserPlaylists","GetUserRecentRooms","GetUserVideoList","GetVideo","GetVideoMix","GetVideoPlaylistDetail","GetVideoV2","GetVolumeStrategy","goapi_ReportAction","ImportPlaylist","IMSend","JoinActivity","Launch","LaunchDevice","LightUpArtists","LikeUserListenDuration","ListArtistAlbums","ListArtistTracks","ListComments","ListenVideoReminder","ListLibraExperiments","ListReplies","LogEvent","MAppendPlaylistMedia","MAppendPlaylistTracks","MarkMediaList","MarkRead","MCheckMedia","MCheckTrack","MDeleteCollectedAlbums","MDeleteCollectedArtists","MDeleteCollectedPlaylists","MDeleteCollectedTracks","MDeletePlaylists","MetabDiscover","MGetMedia","MGetMediaV2","MGetPlaylistImportTasks","ModifyMyAvatarDecoration","PlaylistSearch","PlugAction","Purchase","PurchaseOffer","PurchaseOfferByToken","PurchaseOffersByTokensForPC","PurchaseOffersForH5","PurchaseProduct","QueryGamePlayRecord","QueryGiftOrderBrief","QueryTokenStatus","QueryZlink","ReceiveGift","ReceiveVoucher","RedeemAsset","RedeemFreeVIP","RedeemInvitationCode","RefreshInvitationCodeTime","RegisterMiniLunaUser","RejectFollow","RejectJoin","Report","ReportAction","ReportDeviceProfile","ReportFeedInfo","ReportIapAuxiliaryInfo","ReportItemAction","ReportPurchaseAction","ReportSample","ReportSID","Search","Search2023","SearchCategories","SearchSchool","SendGift","SendInvitePush","SetAlbumDefaultCover","SetBoost","SetPlugVisibility","ShareCodeParse","ShareCount","ShareInvitationCode","SharePostAweme","Shark","ShortenZlinkUrl","SortPlaylistMedia","SortPlaylistTracks","SsoToken","SubmitEvaluateResults","SubmitGamePlay","Sug","SuggestWords","TLBFeedFallback","TrackDisLike","UnBookAlbum","UnfollowUser","UnreadMsg","UpdateLunaUserSettings","UpdateMyInfo","UpdateMyPrivacySetting","UpdatePlaylistInfo","UpdatePlaylistSortType","Validate","ValidatePurchase","ValidateReward"] as EndpointName[]

const FN = {
  AcceptFollow: ns0.AcceptFollow,
  AiAssistantRelated: ns0.AiAssistantRelated,
  AIBotChat: ns0.AIBotChat,
  AIBotTrigger: ns0.AIBotTrigger,
  AppendLaterListen: ns0.AppendLaterListen,
  AppendRecentlyPlayedMedia: ns0.AppendRecentlyPlayedMedia,
  AppendRecentPlayedTracks: ns0.AppendRecentPlayedTracks,
  ApplyFreeVip: ns3.ApplyFreeVip,
  BookAlbum: ns3.BookAlbum,
  BoostArtists: ns0.BoostArtists,
  CancelAccount: ns0.CancelAccount,
  CancelBlockUser: ns0.CancelBlockUser,
  CancelBlockV2: ns0.CancelBlockV2,
  CancelChannelSubs: ns3.CancelChannelSubs,
  CancelSubscription: ns2.CancelSubscription,
  CheckCode: ns3.CheckCode,
  CheckDownload: ns3.CheckDownload,
  CheckRedeemCodeFromPhysicalCard: ns2.CheckRedeemCodeFromPhysicalCard,
  CheckSensitiveWords: ns0.CheckSensitiveWords,
  CheckTrack: ns0.CheckTrack,
  CheckUpdate: ns0.CheckUpdate,
  CollectAlbums: ns0.CollectAlbums,
  CollectArtists: ns0.CollectArtists,
  CollectFlowTracks: ns0.CollectFlowTracks,
  CollectMediaList: ns0.CollectMediaList,
  CollectPlaylists: ns0.CollectPlaylists,
  CollectTracks: ns0.CollectTracks,
  CommentAction: ns0.CommentAction,
  CommentAudioAsr: ns0.CommentAudioAsr,
  commerce_membership_PrepayQuery: ns3.PrepayQuery,
  commerce_membership_RedeemCode: ns3.RedeemCode,
  commerce_membership_ReportAction: ns3.ReportAction,
  commerce_PrepayQuery: ns2.PrepayQuery,
  commerce_RedeemCode: ns2.RedeemCode,
  commerce_ReportAction: ns2.ReportAction,
  CommitAudit: ns0.CommitAudit,
  CommitBlockUser: ns0.CommitBlockUser,
  CommitBlockV2: ns0.CommitBlockV2,
  ConfirmBannerTest: ns0.ConfirmBannerTest,
  ConnPlugs: ns0.ConnPlugs,
  ConsumeBenefit: ns3.ConsumeBenefit,
  CreateAnniversaryPlaylist2024: ns0.CreateAnniversaryPlaylist2024,
  CreateAnniversaryPlaylist2025: ns0.CreateAnniversaryPlaylist2025,
  CreateComment: ns0.CreateComment,
  CreatePlaylist: ns0.CreatePlaylist,
  CreateRoom: ns0.CreateRoom,
  CreateSummary2023Video: ns0.CreateSummary2023Video,
  DeleteCollectedFlowTracks: ns0.DeleteCollectedFlowTracks,
  DeleteCollectedMediaList: ns0.DeleteCollectedMediaList,
  DeleteComment: ns0.DeleteComment,
  DeleteMsg: ns0.DeleteMsg,
  DeletePlaylistMedia: ns0.DeletePlaylistMedia,
  DeletePlaylistTracks: ns0.DeletePlaylistTracks,
  DeleteRecentlyPlayedMedia: ns0.DeleteRecentlyPlayedMedia,
  DeleteRecentPlayedTracks: ns0.DeleteRecentPlayedTracks,
  DeviceBlockArtist: ns0.DeviceBlockArtist,
  DeviceBlockUser: ns0.DeviceBlockUser,
  DeviceRecentUser: ns0.DeviceRecentUser,
  DiscoverMix: ns0.DiscoverMix,
  DiscoverView: ns0.DiscoverView,
  Dislike: ns0.Dislike,
  FeedListenVideo: ns0.FeedListenVideo,
  FeedListenVideoTab: ns0.FeedListenVideoTab,
  FeedLiveTab: ns0.FeedLiveTab,
  FeedMode: ns0.FeedMode,
  FeedModeGuidance: ns0.FeedModeGuidance,
  FeedPlaylistMedia: ns0.FeedPlaylistMedia,
  FeedPlaylistSquare: ns0.FeedPlaylistSquare,
  FeedRadioTracks: ns0.FeedRadioTracks,
  FeedSongTab: ns0.FeedSongTab,
  FeedVideo: ns0.FeedVideo,
  FeedVideoPlaylist: ns0.FeedVideoPlaylist,
  FeedVideoTab: ns0.FeedVideoTab,
  FinishMagicTask: ns0.FinishMagicTask,
  FlowGetAlbumDetail: ns0.FlowGetAlbumDetail,
  FlowGetArtistMusic: ns0.FlowGetArtistMusic,
  FlowGetChartDetail: ns0.FlowGetChartDetail,
  FlowGetPlaylistDetail: ns0.FlowGetPlaylistDetail,
  FlowGetRelatedMedia: ns0.FlowGetRelatedMedia,
  FlowGetTrackListDetail: ns0.FlowGetTrackListDetail,
  FlowRecommend: ns0.FlowRecommend,
  FlowRecommendNotPack: ns0.FlowRecommendNotPack,
  FlowSearch: ns0.FlowSearch,
  FollowUser: ns0.FollowUser,
  GetAcquisition: ns0.GetAcquisition,
  GetActivityInfo: ns0.GetActivityInfo,
  GetAlbumDetail: ns0.GetAlbumDetail,
  GetAlbumPurchasedPage: ns3.GetAlbumPurchasedPage,
  GetAlbumToPurchasePage: ns3.GetAlbumToPurchasePage,
  GetArtistCollection: ns0.GetArtistCollection,
  GetArtistDetail: ns0.GetArtistDetail,
  GetAtList: ns0.GetAtList,
  GetAudit: ns0.GetAudit,
  GetBlockUserList: ns0.GetBlockUserList,
  GetBriefUserInfo: ns0.GetBriefUserInfo,
  GetBriefUserInfoV2: ns0.GetBriefUserInfoV2,
  GetBytepayPreSignPage: ns3.GetBytepayPreSignPage,
  GetCard: ns0.GetCard,
  GetChartDetail: ns0.GetChartDetail,
  GetComment: ns0.GetComment,
  GetCommerceConfig: ns3.GetCommerceConfig,
  GetCommerceInfo: ns3.GetCommerceInfo,
  GetDeviceActiveMembership: ns3.GetDeviceActiveMembership,
  GetDigitalAlbums: ns0.GetDigitalAlbums,
  GetEcommerceOrderList: ns2.GetEcommerceOrderList,
  GetEligibleOffers: ns2.GetEligibleOffers,
  GetEvaluation: ns1.GetEvaluation,
  GetFeaturedContentDetail: ns0.GetFeaturedContentDetail,
  GetFeaturedContents: ns0.GetFeaturedContents,
  GetFollowerList: ns0.GetFollowerList,
  GetFollowingList: ns0.GetFollowingList,
  GetFollowingLive: ns0.GetFollowingLive,
  GetFriendLinkTemplate: ns0.GetFriendLinkTemplate,
  GetFriendRankings: ns0.GetFriendRankings,
  GetGamePlayConfig: ns0.GetGamePlayConfig,
  GetH5AlbumDetail: ns0.GetH5AlbumDetail,
  GetH5ArtistDetail: ns0.GetH5ArtistDetail,
  GetH5FeaturedContentDetail: ns0.GetH5FeaturedContentDetail,
  GetH5PlaylistDetail: ns0.GetH5PlaylistDetail,
  GetH5Track: ns0.GetH5Track,
  GetH5TrackV2: ns0.GetH5TrackV2,
  GetH5UserMusicWall: ns0.GetH5UserMusicWall,
  GetH5Video: ns0.GetH5Video,
  GetH5VideoV2: ns0.GetH5VideoV2,
  GetHashtagDetail: ns0.GetHashtagDetail,
  GetInvitationCampaignInfo: ns2.GetInvitationCampaignInfo,
  GetListenDurationActivityRankings: ns0.GetListenDurationActivityRankings,
  GetListenVideoTabModule: ns0.GetListenVideoTabModule,
  GetLiveGuideStream: ns0.GetLiveGuideStream,
  GetLiveRoom: ns0.GetLiveRoom,
  GetLocateVideo: ns0.GetLocateVideo,
  GetLunaUGBarInfo: ns0.GetLunaUGBarInfo,
  GetLunaUserSettings: ns1.GetLunaUserSettings,
  GetMagicTasks: ns0.GetMagicTasks,
  GetMediaAds: ns0.GetMediaAds,
  GetMediaMapping: ns0.GetMediaMapping,
  GetMediaPlayer: ns0.GetMediaPlayer,
  GetMediaStats: ns0.GetMediaStats,
  GetMeTabAutoplay: ns0.GetMeTabAutoplay,
  GetMiniAppList: ns0.GetMiniAppList,
  GetMixInfo: ns0.GetMixInfo,
  GetMorePanel: ns0.GetMorePanel,
  GetMorePanelResource: ns0.GetMorePanelResource,
  GetMsgList: ns0.GetMsgList,
  GetMusicMateGuidance: ns0.GetMusicMateGuidance,
  GetMusicMateHistory: ns0.GetMusicMateHistory,
  GetMyAssets: ns2.GetMyAssets,
  GetMyBriefInfo: ns0.GetMyBriefInfo,
  GetMyCollectionVideoList: ns0.GetMyCollectionVideoList,
  GetMyDownloadEntitlements: ns2.GetMyDownloadEntitlements,
  GetMyFavoriteVideoList: ns0.GetMyFavoriteVideoList,
  GetMyInfo: ns0.GetMyInfo,
  GetMyListenStats: ns0.GetMyListenStats,
  GetMyMixedCollections: ns0.GetMyMixedCollections,
  GetMyMusicWall: ns0.GetMyMusicWall,
  GetMyOrders: ns3.GetMyOrders,
  GetMyPlaylists: ns0.GetMyPlaylists,
  GetMyPrivacySetting: ns0.GetMyPrivacySetting,
  GetMySpecialStats: ns0.GetMySpecialStats,
  GetMySubscription: ns2.GetMySubscription,
  GetMySummary: ns0.GetMySummary,
  GetMySummary2023: ns0.GetMySummary2023,
  GetMySummary2024: ns0.GetMySummary2024,
  GetMySummary2025: ns0.GetMySummary2025,
  GetMyVideoList: ns0.GetMyVideoList,
  GetOffersTokensForPC: ns3.GetOffersTokensForPC,
  GetOffersTokensStatusForPC: ns3.GetOffersTokensStatusForPC,
  GetPlayerInfo: ns0.GetPlayerInfo,
  GetPlayerInfoV2: ns0.GetPlayerInfoV2,
  GetPlaylistDetail: ns0.GetPlaylistDetail,
  GetPlaylistFeedMedia: ns0.GetPlaylistFeedMedia,
  GetPlaylistRelatedMedia: ns0.GetPlaylistRelatedMedia,
  GetPlugVisibility: ns0.GetPlugVisibility,
  GetPreviewMsg: ns0.GetPreviewMsg,
  GetPurchaseOfferToken: ns2.GetPurchaseOfferToken,
  GetRecentPlayedMedia: ns0.GetRecentPlayedMedia,
  GetRecentPlayedStats: ns0.GetRecentPlayedStats,
  GetRecentPlayedTracks: ns0.GetRecentPlayedTracks,
  GetRecommendEmoticons: ns0.GetRecommendEmoticons,
  GetRecommendHashtags: ns0.GetRecommendHashtags,
  GetRecommendPlaylist: ns0.GetRecommendPlaylist,
  GetRelatedMedia: ns0.GetRelatedMedia,
  GetRelatedTracks: ns0.GetRelatedTracks,
  GetReportReason: ns0.GetReportReason,
  GetResource: ns1.GetResource,
  GetRoomCommerceInfo: ns3.GetRoomCommerceInfo,
  GetRoomInfo: ns0.GetRoomInfo,
  GetSchoolCollegeList: ns1.GetSchoolCollegeList,
  GetSchoolList: ns1.GetSchoolList,
  GetSchoolNearest: ns1.GetSchoolNearest,
  GetSearchBlock: ns0.GetSearchBlock,
  GetSeoTracks: ns0.GetSeoTracks,
  GetShareInfo: ns0.GetShareInfo,
  GetSharePostAwemeStatus: ns0.GetSharePostAwemeStatus,
  GetShareUserList: ns0.GetShareUserList,
  GetSharingItems: ns0.GetSharingItems,
  GetSummary2023Video: ns0.GetSummary2023Video,
  GetSummary2024Availability: ns0.GetSummary2024Availability,
  GetSummary2025Availability: ns0.GetSummary2025Availability,
  GetTrack: ns0.GetTrack,
  GetTrackForBell: ns0.GetTrackForBell,
  GetTrackPlayerInfo: ns0.GetTrackPlayerInfo,
  GetTrackV2: ns0.GetTrackV2,
  GetUGTrackInfo: ns0.GetUGTrackInfo,
  GetUploaderInfo: ns0.GetUploaderInfo,
  GetUpsell: ns3.GetUpsell,
  GetUpsells: ns2.GetUpsells,
  GetUpsellsConfig: ns2.GetUpsellsConfig,
  GetUserArtistCollection: ns0.GetUserArtistCollection,
  GetUserBookingActivityInfo: ns3.GetUserBookingActivityInfo,
  GetUserHashtagComments: ns0.GetUserHashtagComments,
  GetUserInfo: ns0.GetUserInfo,
  GetUserInfoByToken: ns0.GetUserInfoByToken,
  GetUserLiveRoom: ns0.GetUserLiveRoom,
  GetUserMixedCollections: ns0.GetUserMixedCollections,
  GetUserMixInfo: ns0.GetUserMixInfo,
  GetUserMusicWall: ns0.GetUserMusicWall,
  GetUserPlaylists: ns0.GetUserPlaylists,
  GetUserRecentRooms: ns0.GetUserRecentRooms,
  GetUserVideoList: ns0.GetUserVideoList,
  GetVideo: ns0.GetVideo,
  GetVideoMix: ns0.GetVideoMix,
  GetVideoPlaylistDetail: ns0.GetVideoPlaylistDetail,
  GetVideoV2: ns0.GetVideoV2,
  GetVolumeStrategy: ns0.GetVolumeStrategy,
  goapi_ReportAction: ns0.ReportAction,
  ImportPlaylist: ns0.ImportPlaylist,
  IMSend: ns0.IMSend,
  JoinActivity: ns3.JoinActivity,
  Launch: ns0.Launch,
  LaunchDevice: ns0.LaunchDevice,
  LightUpArtists: ns0.LightUpArtists,
  LikeUserListenDuration: ns0.LikeUserListenDuration,
  ListArtistAlbums: ns0.ListArtistAlbums,
  ListArtistTracks: ns0.ListArtistTracks,
  ListComments: ns0.ListComments,
  ListenVideoReminder: ns0.ListenVideoReminder,
  ListLibraExperiments: ns2.ListLibraExperiments,
  ListReplies: ns0.ListReplies,
  LogEvent: ns0.LogEvent,
  MAppendPlaylistMedia: ns0.MAppendPlaylistMedia,
  MAppendPlaylistTracks: ns0.MAppendPlaylistTracks,
  MarkMediaList: ns0.MarkMediaList,
  MarkRead: ns0.MarkRead,
  MCheckMedia: ns0.MCheckMedia,
  MCheckTrack: ns0.MCheckTrack,
  MDeleteCollectedAlbums: ns0.MDeleteCollectedAlbums,
  MDeleteCollectedArtists: ns0.MDeleteCollectedArtists,
  MDeleteCollectedPlaylists: ns0.MDeleteCollectedPlaylists,
  MDeleteCollectedTracks: ns0.MDeleteCollectedTracks,
  MDeletePlaylists: ns0.MDeletePlaylists,
  MetabDiscover: ns0.MetabDiscover,
  MGetMedia: ns0.MGetMedia,
  MGetMediaV2: ns0.MGetMediaV2,
  MGetPlaylistImportTasks: ns0.MGetPlaylistImportTasks,
  ModifyMyAvatarDecoration: ns0.ModifyMyAvatarDecoration,
  PlaylistSearch: ns0.PlaylistSearch,
  PlugAction: ns0.PlugAction,
  Purchase: ns3.Purchase,
  PurchaseOffer: ns2.PurchaseOffer,
  PurchaseOfferByToken: ns2.PurchaseOfferByToken,
  PurchaseOffersByTokensForPC: ns3.PurchaseOffersByTokensForPC,
  PurchaseOffersForH5: ns3.PurchaseOffersForH5,
  PurchaseProduct: ns3.PurchaseProduct,
  QueryGamePlayRecord: ns0.QueryGamePlayRecord,
  QueryGiftOrderBrief: ns3.QueryGiftOrderBrief,
  QueryTokenStatus: ns2.QueryTokenStatus,
  QueryZlink: ns0.QueryZlink,
  ReceiveGift: ns3.ReceiveGift,
  ReceiveVoucher: ns3.ReceiveVoucher,
  RedeemAsset: ns2.RedeemAsset,
  RedeemFreeVIP: ns2.RedeemFreeVIP,
  RedeemInvitationCode: ns0.RedeemInvitationCode,
  RefreshInvitationCodeTime: ns0.RefreshInvitationCodeTime,
  RegisterMiniLunaUser: ns0.RegisterMiniLunaUser,
  RejectFollow: ns0.RejectFollow,
  RejectJoin: ns0.RejectJoin,
  Report: ns0.Report,
  ReportAction: ns0.ReportAction,
  ReportDeviceProfile: ns0.ReportDeviceProfile,
  ReportFeedInfo: ns0.ReportFeedInfo,
  ReportIapAuxiliaryInfo: ns3.ReportIapAuxiliaryInfo,
  ReportItemAction: ns0.ReportItemAction,
  ReportPurchaseAction: ns3.ReportPurchaseAction,
  ReportSample: ns0.ReportSample,
  ReportSID: ns0.ReportSID,
  Search: ns0.Search,
  Search2023: ns0.Search2023,
  SearchCategories: ns0.SearchCategories,
  SearchSchool: ns1.SearchSchool,
  SendGift: ns3.SendGift,
  SendInvitePush: ns0.SendInvitePush,
  SetAlbumDefaultCover: ns3.SetAlbumDefaultCover,
  SetBoost: ns0.SetBoost,
  SetPlugVisibility: ns0.SetPlugVisibility,
  ShareCodeParse: ns0.ShareCodeParse,
  ShareCount: ns0.ShareCount,
  ShareInvitationCode: ns0.ShareInvitationCode,
  SharePostAweme: ns0.SharePostAweme,
  Shark: ns0.Shark,
  ShortenZlinkUrl: ns0.ShortenZlinkUrl,
  SortPlaylistMedia: ns0.SortPlaylistMedia,
  SortPlaylistTracks: ns0.SortPlaylistTracks,
  SsoToken: ns0.SsoToken,
  SubmitEvaluateResults: ns1.SubmitEvaluateResults,
  SubmitGamePlay: ns0.SubmitGamePlay,
  Sug: ns0.Sug,
  SuggestWords: ns0.SuggestWords,
  TLBFeedFallback: ns0.TLBFeedFallback,
  TrackDisLike: ns0.TrackDisLike,
  UnBookAlbum: ns3.UnBookAlbum,
  UnfollowUser: ns0.UnfollowUser,
  UnreadMsg: ns0.UnreadMsg,
  UpdateLunaUserSettings: ns1.UpdateLunaUserSettings,
  UpdateMyInfo: ns0.UpdateMyInfo,
  UpdateMyPrivacySetting: ns1.UpdateMyPrivacySetting,
  UpdatePlaylistInfo: ns0.UpdatePlaylistInfo,
  UpdatePlaylistSortType: ns0.UpdatePlaylistSortType,
  Validate: ns3.Validate,
  ValidatePurchase: ns2.ValidatePurchase,
  ValidateReward: ns2.ValidateReward,
}

export function endpointFn<K extends EndpointName>(key: K): EndpointSignatures[K] {
  return FN[key] as EndpointSignatures[K]
}

export function endpointDef(key: string): EndpointDef {
  const d = ENDPOINT_DATA.find((e) => e.key === key || e.alias === key)
  if (!d) throw new Error(`未知端点: ${key}`)
  return d
}
