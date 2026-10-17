// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../_common.js'
import * as acquisition from './contract/acquisition.js'
import * as activity from './contract/activity.js'
import * as ads from './contract/ads.js'
import * as ai_assistant from './contract/ai_assistant.js'
import * as ai_bot from './contract/ai_bot.js'
import * as album from './contract/album.js'
import * as artist from './contract/artist.js'
import * as atlist from './contract/atlist.js'
import * as audit from './contract/audit.js'
import * as card from './contract/card.js'
import * as chart from './contract/chart.js'
import * as comment from './contract/comment.js'
import * as device from './contract/device.js'
import * as discover from './contract/discover.js'
import * as dislike from './contract/dislike.js'
import * as emoticon from './contract/emoticon.js'
import * as featured_content from './contract/featured_content.js'
import * as feed from './contract/feed.js'
import * as flow_contract from './flow/flow_contract.js'
import * as friend_link from './contract/friend_link.js'
import * as game_play from './contract/game_play.js'
import * as general from './contract/general.js'
import * as hashtag from './contract/hashtag.js'
import * as im from './contract/im.js'
import * as live from './contract/live.js'
import * as log_event from './contract/log_event.js'
import * as magic from './contract/magic.js'
import * as me from './contract/me.js'
import * as media from './contract/media.js'
import * as message from './contract/message.js'
import * as mini_app from './contract/mini_app.js'
import * as mini_luna from './contract/mini_luna.js'
import * as misc from './contract/misc.js'
import * as mix from './contract/mix.js'
import * as module from './contract/module.js'
import * as more_panel from './contract/more_panel.js'
import * as music_mate from './contract/music_mate.js'
import * as playlist from './contract/playlist.js'
import * as plug from './contract/plug.js'
import * as reco_sample from './contract/reco_sample.js'
import * as report from './contract/report.js'
import * as search from './contract/search.js'
import * as seo from './contract/seo.js'
import * as share from './contract/share.js'
import * as sso from './contract/sso.js'
import * as summary from './contract/summary.js'
import * as summary2023 from './contract/summary2023.js'
import * as summary2024 from './contract/summary2024.js'
import * as summary2025 from './contract/summary2025.js'
import * as track from './contract/track.js'
import * as ug from './contract/ug.js'
import * as user from './contract/user.js'
import * as video from './contract/video.js'

// Goapi
export async function AIBotChat(caller: IRequestCaller, req: ai_bot.AIBotChatRequest, context: any): Promise<ai_bot.AIBotChatResponse> {
  const requestData = mergeRequestData([
    ai_bot.AIBotChatRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'AIBotChat',
    paths: [{ method: 'POST', path: `/luna/im/ai_bot/chat` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function AIBotTrigger(caller: IRequestCaller, req: ai_bot.AIBotChatRequest, context: any): Promise<ai_bot.AIBotChatResponse> {
  const requestData = mergeRequestData([
    ai_bot.AIBotChatRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'AIBotTrigger',
    paths: [{ method: 'POST', path: `/luna/im/ai_bot/trigger` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function AcceptFollow(caller: IRequestCaller, req: me.AcceptFollowRequest, context: any): Promise<me.AcceptFollowResponse> {
  const requestData = mergeRequestData([
    me.AcceptFollowRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'AcceptFollow',
    paths: [{ method: 'POST', path: `/luna/me/follow/accept` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function AiAssistantRelated(caller: IRequestCaller, req: ai_assistant.AiAssistantRelatedRequest, context: any): Promise<ai_assistant.AiAssistantRelatedResponse> {
  const requestData = mergeRequestData([
    ai_assistant.AiAssistantRelatedRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'AiAssistantRelated',
    paths: [{ method: 'POST', path: `/luna/media/assistant/related` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function AppendLaterListen(caller: IRequestCaller, req: me.AppendLaterListenRequest, context: any): Promise<me.AppendLaterListenResponse> {
  const requestData = mergeRequestData([
    me.AppendLaterListenRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'AppendLaterListen',
    paths: [{ method: 'POST', path: `/luna/me/later-listen/append` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function AppendRecentPlayedTracks(caller: IRequestCaller, req: me.AppendRecentPlayedTracksRequest, context: any): Promise<general.GeneralResponse> {
  const requestData = mergeRequestData([
    me.AppendRecentPlayedTracksRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'AppendRecentPlayedTracks',
    paths: [{ method: 'POST', path: `/luna/me/recently-played` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function AppendRecentlyPlayedMedia(caller: IRequestCaller, req: me.AppendRecentlyPlayedMediaRequest, context: any): Promise<general.GeneralResponse> {
  const requestData = mergeRequestData([
    me.AppendRecentlyPlayedMediaRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'AppendRecentlyPlayedMedia',
    paths: [{ method: 'POST', path: `/luna/me/recently-played-media` }, { method: 'POST', path: `/luna/pc/me/recently-played-media` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function BoostArtists(caller: IRequestCaller, request: feed.BoostArtistsRequest, context: any): Promise<feed.BoostArtistsResponse> {
  const requestData = mergeRequestData([
    feed.BoostArtistsRequestToRequestData(request)
  ])
  const response = await caller({
    context,
    name: 'BoostArtists',
    paths: [{ method: 'POST', path: `/luna/boost/artists` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function CancelAccount(caller: IRequestCaller, req: me.CancelAccountRequest, context: any): Promise<me.CancelAccountResponse> {
  const requestData = mergeRequestData([
    me.CancelAccountRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'CancelAccount',
    paths: [{ method: 'GET', path: `/luna/me/cancel` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function CancelBlockUser(caller: IRequestCaller, req: me.CancelBlockUserRequest, context: any): Promise<me.CancelBlockUserResponse> {
  const requestData = mergeRequestData([
    me.CancelBlockUserRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'CancelBlockUser',
    paths: [{ method: 'DELETE', path: `/luna/me/block` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function CancelBlockV2(caller: IRequestCaller, req: me.CancelBlockV2Request, context: any): Promise<me.CancelBlockV2Response> {
  const requestData = mergeRequestData([
    me.CancelBlockV2RequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'CancelBlockV2',
    paths: [{ method: 'POST', path: `/luna/me/block_v2/cancel` }, { method: 'POST', path: `/luna/pc/me/block_v2/cancel` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function CheckSensitiveWords(caller: IRequestCaller, req: playlist.SensitiveWordCheckRequest, context: any): Promise<playlist.SensitiveWordCheckResponse> {
  const requestData = mergeRequestData([
    playlist.SensitiveWordCheckRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'CheckSensitiveWords',
    paths: [{ method: 'GET', path: `/luna/me/playlist/wordcheck` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function CheckTrack(caller: IRequestCaller, req: track.CheckTrackRequest, context: any): Promise<track.CheckTrackResponse> {
  const requestData = mergeRequestData([
    track.CheckTrackRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'CheckTrack',
    paths: [{ method: 'GET', path: `/luna/track/check` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function CheckUpdate(caller: IRequestCaller, req: media.CheckUpdateRequest, context: any): Promise<media.CheckUpdateResponse> {
  const requestData = mergeRequestData([
    media.CheckUpdateRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'CheckUpdate',
    paths: [{ method: 'POST', path: `/luna/check-update` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function CollectAlbums(caller: IRequestCaller, request: me.CollectAlbumRequest, context: any): Promise<me.CollectAlbumResponse> {
  const requestData = mergeRequestData([
    me.CollectAlbumRequestToRequestData(request)
  ])
  const response = await caller({
    context,
    name: 'CollectAlbums',
    paths: [{ method: 'POST', path: `/luna/me/collection/album` }, { method: 'POST', path: `/luna/pc/me/collection/album` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function CollectArtists(caller: IRequestCaller, request: me.CollectArtistsRequest, context: any): Promise<me.CollectArtistsResponse> {
  const requestData = mergeRequestData([
    me.CollectArtistsRequestToRequestData(request)
  ])
  const response = await caller({
    context,
    name: 'CollectArtists',
    paths: [{ method: 'POST', path: `/luna/me/collection/artist` }, { method: 'POST', path: `/luna/pc/me/collection/artist` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function CollectFlowTracks(caller: IRequestCaller, req: flow_contract.CollectFlowTracksRequest, context: any): Promise<flow_contract.CollectFlowTracksResponse> {
  const requestData = mergeRequestData([
    flow_contract.CollectFlowTracksRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'CollectFlowTracks',
    paths: [{ method: 'POST', path: `/luna/flow/collection/track` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function CollectMediaList(caller: IRequestCaller, request: me.CollectMediaListRequest, context: any): Promise<me.CollectMediaListResponse> {
  const requestData = mergeRequestData([
    me.CollectMediaListRequestToRequestData(request)
  ])
  const response = await caller({
    context,
    name: 'CollectMediaList',
    paths: [{ method: 'POST', path: `/luna/me/collection/media` }, { method: 'POST', path: `/luna/pc/me/collection/media` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function CollectPlaylists(caller: IRequestCaller, req: me.CollectPlaylistRequest, context: any): Promise<me.CollectPlaylistResponse> {
  const requestData = mergeRequestData([
    me.CollectPlaylistRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'CollectPlaylists',
    paths: [{ method: 'POST', path: `/luna/me/collection/playlist` }, { method: 'POST', path: `/luna/pc/me/collection/playlist` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function CollectTracks(caller: IRequestCaller, request: me.CollectTracksRequest, context: any): Promise<me.CollectTracksResponse> {
  const requestData = mergeRequestData([
    me.CollectTracksRequestToRequestData(request)
  ])
  const response = await caller({
    context,
    name: 'CollectTracks',
    paths: [{ method: 'POST', path: `/luna/me/collection/track` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function CommentAction(caller: IRequestCaller, req: comment.CommentActionRequest, context: any): Promise<comment.CommentActionResponse> {
  const requestData = mergeRequestData([
    comment.CommentActionRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'CommentAction',
    paths: [{ method: 'POST', path: `/luna/comments/action` }, { method: 'POST', path: `/luna/pc/comments/action` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function CommentAudioAsr(caller: IRequestCaller, req: comment.CommentAudioAsrRequest, context: any): Promise<comment.CommentAudioAsrResponse> {
  const requestData = mergeRequestData([
    comment.CommentAudioAsrRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'CommentAudioAsr',
    paths: [{ method: 'GET', path: `/luna/comment/audio_asr` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function CommitAudit(caller: IRequestCaller, req: audit.CommitAuditRequest, context: any): Promise<audit.CommitAuditResponse> {
  const requestData = mergeRequestData([
    audit.CommitAuditRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'CommitAudit',
    paths: [{ method: 'POST', path: `/luna/audit/commit` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function CommitBlockUser(caller: IRequestCaller, req: me.CommitBlockUserRequest, context: any): Promise<me.CommitBlockUserResponse> {
  const requestData = mergeRequestData([
    me.CommitBlockUserRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'CommitBlockUser',
    paths: [{ method: 'POST', path: `/luna/me/block` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function CommitBlockV2(caller: IRequestCaller, req: me.CommitBlocV2Request, context: any): Promise<me.CommitBlocV2Response> {
  const requestData = mergeRequestData([
    me.CommitBlocV2RequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'CommitBlockV2',
    paths: [{ method: 'POST', path: `/luna/me/block_v2` }, { method: 'POST', path: `/luna/pc/me/block_v2` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function ConfirmBannerTest(caller: IRequestCaller, req: activity.ConfirmActivityTestRequest, context: any): Promise<activity.ConfirmActivityTestResponse> {
  const requestData = mergeRequestData([
    activity.ConfirmActivityTestRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'ConfirmBannerTest',
    paths: [{ method: 'POST', path: `/luna/activities/confirm` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function ConnPlugs(caller: IRequestCaller, req: plug.ConnPlugsRequest, context: any): Promise<plug.ConnPlugsResponse> {
  const requestData = mergeRequestData([
    plug.ConnPlugsRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'ConnPlugs',
    paths: [{ method: 'POST', path: `/luna/plug/conn_plugs` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function CreateAnniversaryPlaylist2024(caller: IRequestCaller, req: summary2024.CreateAnniversaryPlaylist2024Request, context: any): Promise<summary2024.CreateAnniversaryPlaylist2024Response> {
  const requestData = mergeRequestData([
    summary2024.CreateAnniversaryPlaylist2024RequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'CreateAnniversaryPlaylist2024',
    paths: [{ method: 'POST', path: `/luna/summary-2024/playlist/create` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function CreateAnniversaryPlaylist2025(caller: IRequestCaller, req: summary2025.CreateAnniversaryPlaylist2025Request, context: any): Promise<summary2025.CreateAnniversaryPlaylist2025Response> {
  const requestData = mergeRequestData([
    summary2025.CreateAnniversaryPlaylist2025RequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'CreateAnniversaryPlaylist2025',
    paths: [{ method: 'POST', path: `/luna/summary-2025/playlist/create` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function CreateComment(caller: IRequestCaller, req: comment.CreateCommentRequest, context: any): Promise<comment.CreateCommentResponse> {
  const requestData = mergeRequestData([
    comment.CreateCommentRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'CreateComment',
    paths: [{ method: 'POST', path: `/luna/comments/create` }, { method: 'POST', path: `/luna/pc/comments/create` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function CreatePlaylist(caller: IRequestCaller, req: playlist.CreatePlaylistRequest, context: any): Promise<playlist.CreatePlaylistResponse> {
  const requestData = mergeRequestData([
    playlist.CreatePlaylistRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'CreatePlaylist',
    paths: [{ method: 'POST', path: `/luna/me/playlist` }, { method: 'POST', path: `/luna/pc/me/playlist` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function CreateRoom(caller: IRequestCaller, req: music_mate.CreateRoomRequest, context: any): Promise<music_mate.CreateRoomResponse> {
  const requestData = mergeRequestData([
    music_mate.CreateRoomRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'CreateRoom',
    paths: [{ method: 'POST', path: `/luna/social/mate/room/create` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function CreateSummary2023Video(caller: IRequestCaller, req: summary2023.CreateSummary2023VideoRequest, context: any): Promise<summary2023.CreateSummary2023VideoResponse> {
  const requestData = mergeRequestData([
    summary2023.CreateSummary2023VideoRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'CreateSummary2023Video',
    paths: [{ method: 'POST', path: `/luna/summary2023/create_video` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function DeleteCollectedFlowTracks(caller: IRequestCaller, req: flow_contract.DeleteCollectedFlowTracksRequest, context: any): Promise<flow_contract.DeleteCollectedFlowTracksResponse> {
  const requestData = mergeRequestData([
    flow_contract.DeleteCollectedFlowTracksRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'DeleteCollectedFlowTracks',
    paths: [{ method: 'POST', path: `/luna/flow/collection/delete_track` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function DeleteCollectedMediaList(caller: IRequestCaller, request: me.DeleteCollectedMediaListRequest, context: any): Promise<me.DeleteCollectedMediaListResponse> {
  const requestData = mergeRequestData([
    me.DeleteCollectedMediaListRequestToRequestData(request)
  ])
  const response = await caller({
    context,
    name: 'DeleteCollectedMediaList',
    paths: [{ method: 'POST', path: `/luna/me/collection/media/delete` }, { method: 'POST', path: `/luna/pc/me/collection/media/delete` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function DeleteComment(caller: IRequestCaller, req: comment.DeleteCommentRequest, context: any): Promise<comment.DeleteCommentResponse> {
  const requestData = mergeRequestData([
    comment.DeleteCommentRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'DeleteComment',
    paths: [{ method: 'POST', path: `/luna/comments/delete` }, { method: 'POST', path: `/luna/pc/comments/delete` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function DeleteMsg(caller: IRequestCaller, req: message.DeleteMsgRequest, context: any): Promise<general.GeneralResponse> {
  const requestData = mergeRequestData([
    message.DeleteMsgRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'DeleteMsg',
    paths: [{ method: 'POST', path: `/luna/notification/delete` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function DeletePlaylistMedia(caller: IRequestCaller, req: playlist.MDeletePlaylistMediaRequest, context: any): Promise<playlist.MDeletePlaylistMediaResponse> {
  const requestData = mergeRequestData([
    playlist.MDeletePlaylistMediaRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'DeletePlaylistMedia',
    paths: [{ method: 'POST', path: `/luna/me/playlist/media/delete` }, { method: 'POST', path: `/luna/pc/me/playlist/media/delete` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function DeletePlaylistTracks(caller: IRequestCaller, req: playlist.DeletePlaylistTrackRequest, context: any): Promise<playlist.DeletePlaylistTrackResponse> {
  const requestData = mergeRequestData([
    playlist.DeletePlaylistTrackRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'DeletePlaylistTracks',
    paths: [{ method: 'POST', path: `/luna/me/playlist/track/delete` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function DeleteRecentPlayedTracks(caller: IRequestCaller, req: me.DeleteRecentPlayedTracksRequest, context: any): Promise<me.DeleteRecentPlayedTracksResponse> {
  const requestData = mergeRequestData([
    me.DeleteRecentPlayedTracksRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'DeleteRecentPlayedTracks',
    paths: [{ method: 'POST', path: `/luna/me/recently-played/delete` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function DeleteRecentlyPlayedMedia(caller: IRequestCaller, req: me.DeleteRecentlyPlayedMediaRequest, context: any): Promise<me.DeleteRecentlyPlayedMediaResponse> {
  const requestData = mergeRequestData([
    me.DeleteRecentlyPlayedMediaRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'DeleteRecentlyPlayedMedia',
    paths: [{ method: 'POST', path: `/luna/me/recently-played-media/delete` }, { method: 'POST', path: `/luna/pc/me/recently-played-media/delete` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function DeviceBlockArtist(caller: IRequestCaller, req: me.DeviceBlockArtistRequest, context: any): Promise<me.DeviceBlockArtistResponse> {
  const requestData = mergeRequestData([
    me.DeviceBlockArtistRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'DeviceBlockArtist',
    paths: [{ method: 'POST', path: `/luna/me/device/block/artist` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function DeviceBlockUser(caller: IRequestCaller, req: me.DeviceBlockUserRequest, context: any): Promise<me.DeviceBlockUserResponse> {
  const requestData = mergeRequestData([
    me.DeviceBlockUserRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'DeviceBlockUser',
    paths: [{ method: 'POST', path: `/luna/me/device/block` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function DeviceRecentUser(caller: IRequestCaller, req: misc.DeviceRecentUserRequest, context: any): Promise<misc.DeviceRecentUserResponse> {
  const requestData = mergeRequestData([
    misc.DeviceRecentUserRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'DeviceRecentUser',
    paths: [{ method: 'GET', path: `/luna/device/recent-login` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function DiscoverMix(caller: IRequestCaller, req: discover.DiscoverMixRequest, context: any): Promise<discover.DiscoverMixResponse> {
  const requestData = mergeRequestData([
    discover.DiscoverMixRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'DiscoverMix',
    paths: [{ method: 'POST', path: `/luna/discover/mix` }, { method: 'POST', path: `/luna/pc/discover/mix` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function DiscoverView(caller: IRequestCaller, req: discover.DiscoverRequest, context: any): Promise<discover.DiscoverResponse> {
  const requestData = mergeRequestData([
    discover.DiscoverRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'DiscoverView',
    paths: [{ method: 'POST', path: `/luna/discover` }, { method: 'POST', path: `/luna/pc/discover` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function Dislike(caller: IRequestCaller, req: dislike.DislikeRequest, context: any): Promise<dislike.DislikeResponse> {
  const requestData = mergeRequestData([
    dislike.DislikeRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'Dislike',
    paths: [{ method: 'POST', path: `/luna/dislike` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function FeedListenVideo(caller: IRequestCaller, req: feed.FeedListenVideoRequest, context: any): Promise<feed.FeedListenVideoResponse> {
  const requestData = mergeRequestData([
    feed.FeedListenVideoRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'FeedListenVideo',
    paths: [{ method: 'POST', path: `/luna/feed/listen-video` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function FeedListenVideoTab(caller: IRequestCaller, req: feed.FeedListenVideoTabRequest, context: any): Promise<feed.FeedListenVideoTabResponse> {
  const requestData = mergeRequestData([
    feed.FeedListenVideoTabRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'FeedListenVideoTab',
    paths: [{ method: 'POST', path: `/luna/feed/listen-video-tab` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function FeedLiveTab(caller: IRequestCaller, req: feed.FeedLiveTabRequest, context: any): Promise<feed.FeedLiveTabResponse> {
  const requestData = mergeRequestData([
    feed.FeedLiveTabRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'FeedLiveTab',
    paths: [{ method: 'POST', path: `/luna/feed/live-tab` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function FeedMode(caller: IRequestCaller, request: feed.FeedModeRequest, context: any): Promise<feed.FeedModeResponse> {
  const requestData = mergeRequestData([
    feed.FeedModeRequestToRequestData(request)
  ])
  const response = await caller({
    context,
    name: 'FeedMode',
    paths: [{ method: 'GET', path: `/luna/feed/mode` }, { method: 'GET', path: `/luna/pc/feed/mode` }, { method: 'POST', path: `/luna/feed/mode` }, { method: 'POST', path: `/luna/pc/feed/mode` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function FeedModeGuidance(caller: IRequestCaller, request: feed.FeedModeGuidanceRequest, context: any): Promise<feed.FeedModeGuidanceResponse> {
  const requestData = mergeRequestData([
    feed.FeedModeGuidanceRequestToRequestData(request)
  ])
  const response = await caller({
    context,
    name: 'FeedModeGuidance',
    paths: [{ method: 'POST', path: `/luna/feed/mode/guidance` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function FeedPlaylistMedia(caller: IRequestCaller, req: feed.FeedPlaylistMediaRequest, context: any): Promise<feed.FeedPlaylistMediaResponse> {
  const requestData = mergeRequestData([
    feed.FeedPlaylistMediaRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'FeedPlaylistMedia',
    paths: [{ method: 'POST', path: `/luna/feed/playlist-media` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function FeedPlaylistSquare(caller: IRequestCaller, request: feed.FeedPlaylistSquareRequest, context: any): Promise<feed.FeedPlaylistSquareResponse> {
  const requestData = mergeRequestData([
    feed.FeedPlaylistSquareRequestToRequestData(request)
  ])
  const response = await caller({
    context,
    name: 'FeedPlaylistSquare',
    paths: [{ method: 'POST', path: `/luna/feed/playlist-square` }, { method: 'POST', path: ` /luna/pc/feed/playlist-square` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function FeedRadioTracks(caller: IRequestCaller, request: feed.FeedRadioTracksRequest, context: any): Promise<feed.FeedRadioTracksResponse> {
  const requestData = mergeRequestData([
    feed.FeedRadioTracksRequestToRequestData(request)
  ])
  const response = await caller({
    context,
    name: 'FeedRadioTracks',
    paths: [{ method: 'POST', path: `/luna/feed/radio/tracks` }, { method: 'POST', path: `/luna/pc/feed/radio/tracks` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function FeedSongTab(caller: IRequestCaller, req: feed.FeedSongTabRequest, context: any): Promise<feed.FeedResponse> {
  const requestData = mergeRequestData([
    feed.FeedSongTabRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'FeedSongTab',
    paths: [{ method: 'POST', path: `/luna/feed/song-tab` }, { method: 'POST', path: `/luna/pc/feed/song-tab` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function FeedVideo(caller: IRequestCaller, req: feed.FeedVideoRequest, context: any): Promise<feed.FeedResponse> {
  const requestData = mergeRequestData([
    feed.FeedVideoRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'FeedVideo',
    paths: [{ method: 'POST', path: `/luna/feed/video` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function FeedVideoPlaylist(caller: IRequestCaller, req: feed.FeedVideoPlaylistRequest, context: any): Promise<feed.FeedVideoPlaylistResponse> {
  const requestData = mergeRequestData([
    feed.FeedVideoPlaylistRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'FeedVideoPlaylist',
    paths: [{ method: 'POST', path: `/luna/feed/video_playlist` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function FeedVideoTab(caller: IRequestCaller, req: feed.FeedVideoTabRequest, context: any): Promise<feed.FeedResponse> {
  const requestData = mergeRequestData([
    feed.FeedVideoTabRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'FeedVideoTab',
    paths: [{ method: 'POST', path: `/luna/feed/video-tab` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function FinishMagicTask(caller: IRequestCaller, req: magic.FinishMagicTaskRequest, context: any): Promise<magic.FinishMagicTaskResponse> {
  const requestData = mergeRequestData([
    magic.FinishMagicTaskRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'FinishMagicTask',
    paths: [{ method: 'POST', path: `/luna/magic/finish` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function FlowGetAlbumDetail(caller: IRequestCaller, req: flow_contract.FlowGetAlbumDetailRequest, context: any): Promise<flow_contract.FlowGetAlbumDetailResponse> {
  const requestData = mergeRequestData([
    flow_contract.FlowGetAlbumDetailRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'FlowGetAlbumDetail',
    paths: [{ method: 'POST', path: `/luna/flow/album/detail` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function FlowGetArtistMusic(caller: IRequestCaller, req: flow_contract.FlowGetArtistMusicRequest, context: any): Promise<flow_contract.FlowGetArtistMusicResponse> {
  const requestData = mergeRequestData([
    flow_contract.FlowGetArtistMusicRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'FlowGetArtistMusic',
    paths: [{ method: 'POST', path: `/luna/flow/artist/music` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function FlowGetChartDetail(caller: IRequestCaller, req: flow_contract.FlowGetArtistMusicRequest, context: any): Promise<flow_contract.FlowGetChartDetailResponse> {
  const requestData = mergeRequestData([
    flow_contract.FlowGetArtistMusicRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'FlowGetChartDetail',
    paths: [{ method: 'POST', path: `/luna/flow/chart/detail` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function FlowGetPlaylistDetail(caller: IRequestCaller, req: flow_contract.FlowGetPlaylistDetailRequest, context: any): Promise<flow_contract.FlowGetPlaylistDetailResponse> {
  const requestData = mergeRequestData([
    flow_contract.FlowGetPlaylistDetailRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'FlowGetPlaylistDetail',
    paths: [{ method: 'POST', path: `/luna/flow/playlist/detail` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function FlowGetRelatedMedia(caller: IRequestCaller, req: flow_contract.FlowGetRelatedMediaRequest, context: any): Promise<feed.FeedResponse> {
  const requestData = mergeRequestData([
    flow_contract.FlowGetRelatedMediaRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'FlowGetRelatedMedia',
    paths: [{ method: 'POST', path: `/luna/flow/related/media` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function FlowGetTrackListDetail(caller: IRequestCaller, req: flow_contract.FlowGetTrackListDetailRequest, context: any): Promise<flow_contract.FlowGetTrackListDetailResponse> {
  const requestData = mergeRequestData([
    flow_contract.FlowGetTrackListDetailRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'FlowGetTrackListDetail',
    paths: [{ method: 'POST', path: `/luna/flow/track/detail` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function FlowRecommend(caller: IRequestCaller, req: flow_contract.FlowRecommendRequest, context: any): Promise<flow_contract.FlowRecommendResponse> {
  const requestData = mergeRequestData([
    flow_contract.FlowRecommendRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'FlowRecommend',
    paths: [{ method: 'POST', path: `/luna/flow/recommend` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function FlowRecommendNotPack(caller: IRequestCaller, req: feed.FeedSongTabRequest, context: any): Promise<flow_contract.FlowRecommendNotPackResponse> {
  const requestData = mergeRequestData([
    feed.FeedSongTabRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'FlowRecommendNotPack',
    paths: [{ method: 'POST', path: `/luna/flow/recommend/not_pack` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function FlowSearch(caller: IRequestCaller, req: flow_contract.FlowSearchRequest, context: any): Promise<search.SearchResponse> {
  const requestData = mergeRequestData([
    flow_contract.FlowSearchRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'FlowSearch',
    paths: [{ method: 'POST', path: `/luna/flow/search/${requestData.params.search_type}` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function FollowUser(caller: IRequestCaller, req: me.FollowUserRequest, context: any): Promise<me.FollowUserResponse> {
  const requestData = mergeRequestData([
    me.FollowUserRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'FollowUser',
    paths: [{ method: 'POST', path: `/luna/me/follow` }, { method: 'POST', path: `/luna/pc/me/follow` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetAcquisition(caller: IRequestCaller, req: acquisition.GetAcquisitionRequest, context: any): Promise<acquisition.GetAcquisitionResponse> {
  const requestData = mergeRequestData([
    acquisition.GetAcquisitionRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetAcquisition',
    paths: [{ method: 'GET', path: `/luna/acquisition` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetActivityInfo(caller: IRequestCaller, req: activity.GetActivityInfoRequest, context: any): Promise<activity.GetActivityInfoResponse> {
  const requestData = mergeRequestData([
    activity.GetActivityInfoRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetActivityInfo',
    paths: [{ method: 'GET', path: `/luna/activities` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetAlbumDetail(caller: IRequestCaller, req: album.GetAlbumDetailRequest, context: any): Promise<album.GetAlbumDetailResponse> {
  const requestData = mergeRequestData([
    album.GetAlbumDetailRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetAlbumDetail',
    paths: [{ method: 'GET', path: `/luna/albums/${requestData.params.album_id}` }, { method: 'GET', path: `/luna/pc/albums/${requestData.params.album_id}` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetArtistCollection(caller: IRequestCaller, req: me.GetArtistCollectionRequest, context: any): Promise<me.GetArtistCollectionResponse> {
  const requestData = mergeRequestData([
    me.GetArtistCollectionRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetArtistCollection',
    paths: [{ method: 'GET', path: `/luna/me/collection/artist` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetArtistDetail(caller: IRequestCaller, req: artist.GetArtistDetailRequest, context: any): Promise<artist.GetArtistDetailResponse> {
  const requestData = mergeRequestData([
    artist.GetArtistDetailRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetArtistDetail',
    paths: [{ method: 'GET', path: `/luna/artists/${requestData.params.artist_id}` }, { method: 'GET', path: `/luna/pc/artists/${requestData.params.artist_id}` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetAtList(caller: IRequestCaller, req: atlist.GetAtListRequest, context: any): Promise<atlist.GetAtListResponse> {
  const requestData = mergeRequestData([
    atlist.GetAtListRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetAtList',
    paths: [{ method: 'POST', path: `/luna/atlist` }, { method: 'GET', path: `/luna/atlist` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetAudit(caller: IRequestCaller, req: audit.GetAuditRequest, context: any): Promise<audit.GetAuditResponse> {
  const requestData = mergeRequestData([
    audit.GetAuditRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetAudit',
    paths: [{ method: 'GET', path: `/luna/audit/result` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetBlockUserList(caller: IRequestCaller, req: me.GetBlockUserListRequest, context: any): Promise<me.GetBlockUserListResponse> {
  const requestData = mergeRequestData([
    me.GetBlockUserListRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetBlockUserList',
    paths: [{ method: 'GET', path: `/luna/me/block/list` }, { method: 'GET', path: `/luna/pc/me/block/list` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetBriefUserInfo(caller: IRequestCaller, req: user.GetBriefUserInfoRequest, context: any): Promise<user.GetBriefUserInfoResponse> {
  const requestData = mergeRequestData([
    user.GetBriefUserInfoRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetBriefUserInfo',
    paths: [{ method: 'GET', path: `/luna/h5/users/${requestData.params.user_id}` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetBriefUserInfoV2(caller: IRequestCaller, req: user.GetBriefUserInfoRequestV2, context: any): Promise<user.GetBriefUserInfoResponse> {
  const requestData = mergeRequestData([
    user.GetBriefUserInfoRequestV2ToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetBriefUserInfoV2',
    paths: [{ method: 'GET', path: `/luna/user_brief/info` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetCard(caller: IRequestCaller, req: card.GetCardRequest, context: any): Promise<card.GetCardResponse> {
  const requestData = mergeRequestData([
    card.GetCardRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetCard',
    paths: [{ method: 'POST', path: `/luna/card` }, { method: 'POST', path: `/luna/h5/card` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetChartDetail(caller: IRequestCaller, req: chart.GetChartDetailRequest, context: any): Promise<chart.GetChartDetailResponse> {
  const requestData = mergeRequestData([
    chart.GetChartDetailRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetChartDetail',
    paths: [{ method: 'GET', path: `/luna/charts/${requestData.params.chart_id}` }, { method: 'GET', path: `/luna/pc/charts/${requestData.params.chart_id}` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetComment(caller: IRequestCaller, req: comment.GetCommentRequest, context: any): Promise<comment.GetCommentResponse> {
  const requestData = mergeRequestData([
    comment.GetCommentRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetComment',
    paths: [{ method: 'GET', path: `/luna/comment` }, { method: 'GET', path: `/luna/pc/comment` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetDigitalAlbums(caller: IRequestCaller, req: me.GetMyDigitalAlbumsRequest, context: any): Promise<me.GetMyDigitalAlbumsResponse> {
  const requestData = mergeRequestData([
    me.GetMyDigitalAlbumsRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetDigitalAlbums',
    paths: [{ method: 'GET', path: `/luna/me/assets/albums` }, { method: 'GET', path: `/luna/pc/me/assets/albums` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetFeaturedContentDetail(caller: IRequestCaller, req: featured_content.GetFeaturedContentDetailRequest, context: any): Promise<featured_content.GetFeaturedContentDetailResponse> {
  const requestData = mergeRequestData([
    featured_content.GetFeaturedContentDetailRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetFeaturedContentDetail',
    paths: [{ method: 'GET', path: `/luna/featured-content/detail` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetFeaturedContents(caller: IRequestCaller, req: featured_content.GetFeaturedContentsRequest, context: any): Promise<featured_content.GetFeaturedContentsResponse> {
  const requestData = mergeRequestData([
    featured_content.GetFeaturedContentsRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetFeaturedContents',
    paths: [{ method: 'GET', path: `/luna/featured-content/list` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetFollowerList(caller: IRequestCaller, req: user.GetFollowListRequest, context: any): Promise<user.GetFollowListResponse> {
  const requestData = mergeRequestData([
    user.GetFollowListRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetFollowerList',
    paths: [{ method: 'GET', path: `/luna/users/${requestData.params.user_id}/follower` }, { method: 'GET', path: `/luna/pc/users/${requestData.params.user_id}/follower` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetFollowingList(caller: IRequestCaller, req: user.GetFollowListRequest, context: any): Promise<user.GetFollowListResponse> {
  const requestData = mergeRequestData([
    user.GetFollowListRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetFollowingList',
    paths: [{ method: 'GET', path: `/luna/users/${requestData.params.user_id}/following` }, { method: 'GET', path: `/luna/pc/users/${requestData.params.user_id}/following` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetFollowingLive(caller: IRequestCaller, req: live.GetFollowingLiveRequest, context: any): Promise<live.GetFollowingLiveResponse> {
  const requestData = mergeRequestData([
    live.GetFollowingLiveRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetFollowingLive',
    paths: [{ method: 'POST', path: `/luna/following/live` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetFriendLinkTemplate(caller: IRequestCaller, req: friend_link.GetFriendLinkTemplateRequest, context: any): Promise<friend_link.GetFriendLinkTemplateResponse> {
  const requestData = mergeRequestData([
    friend_link.GetFriendLinkTemplateRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetFriendLinkTemplate',
    paths: [{ method: 'POST', path: `/seo_api/friendlink/template/get_template_info` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetFriendRankings(caller: IRequestCaller, request: me.GetFriendRankingsRequest, context: any): Promise<me.GetFriendRankingsResponse> {
  const requestData = mergeRequestData([
    me.GetFriendRankingsRequestToRequestData(request)
  ])
  const response = await caller({
    context,
    name: 'GetFriendRankings',
    paths: [{ method: 'POST', path: `/luna/me/friend_rankings` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetGamePlayConfig(caller: IRequestCaller, req: game_play.GetGamePlayConfigRequest, context: any): Promise<game_play.GetGamePlayConfigResponse> {
  const requestData = mergeRequestData([
    game_play.GetGamePlayConfigRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetGamePlayConfig',
    paths: [{ method: 'POST', path: `/luna/game_play/config` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetH5AlbumDetail(caller: IRequestCaller, req: album.GetAlbumDetailRequest, context: any): Promise<album.GetAlbumDetailResponse> {
  const requestData = mergeRequestData([
    album.GetAlbumDetailRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetH5AlbumDetail',
    paths: [{ method: 'GET', path: `/luna/h5/albums/${requestData.params.album_id}` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetH5ArtistDetail(caller: IRequestCaller, req: artist.GetArtistDetailRequest, context: any): Promise<artist.GetArtistDetailResponse> {
  const requestData = mergeRequestData([
    artist.GetArtistDetailRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetH5ArtistDetail',
    paths: [{ method: 'GET', path: `/luna/h5/artists/${requestData.params.artist_id}` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetH5FeaturedContentDetail(caller: IRequestCaller, req: featured_content.GetFeaturedContentDetailRequest, context: any): Promise<featured_content.GetFeaturedContentDetailResponse> {
  const requestData = mergeRequestData([
    featured_content.GetFeaturedContentDetailRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetH5FeaturedContentDetail',
    paths: [{ method: 'GET', path: `/luna/h5/featured-content/detail` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetH5PlaylistDetail(caller: IRequestCaller, req: playlist.GetPlaylistDetailRequest, context: any): Promise<playlist.GetPlaylistDetailResponse> {
  const requestData = mergeRequestData([
    playlist.GetPlaylistDetailRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetH5PlaylistDetail',
    paths: [{ method: 'GET', path: `/luna/h5/playlist/detail` }, { method: 'POST', path: `/luna/h5/playlist/detail` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetH5Track(caller: IRequestCaller, req: track.GetTrackRequest, context: any): Promise<track.GetTrackResponse> {
  const requestData = mergeRequestData([
    track.GetTrackRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetH5Track',
    paths: [{ method: 'GET', path: `/luna/h5/track` }, { method: 'POST', path: `/luna/h5/track` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetH5TrackV2(caller: IRequestCaller, req: track.GetTrackV2Request, context: any): Promise<track.GetTrackV2Response> {
  const requestData = mergeRequestData([
    track.GetTrackV2RequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetH5TrackV2',
    paths: [{ method: 'GET', path: `/luna/h5/track_v2` }, { method: 'POST', path: `/luna/h5/track_v2` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetH5UserMusicWall(caller: IRequestCaller, req: user.GetUserMusicWallRequest, context: any): Promise<user.GetUserMusicWallResponse> {
  const requestData = mergeRequestData([
    user.GetUserMusicWallRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetH5UserMusicWall',
    paths: [{ method: 'POST', path: `/luna/h5/user/music_wall` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetH5Video(caller: IRequestCaller, req: video.GetVideoRequest, context: any): Promise<video.GetVideoResponse> {
  const requestData = mergeRequestData([
    video.GetVideoRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetH5Video',
    paths: [{ method: 'POST', path: `/luna/h5/video` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetH5VideoV2(caller: IRequestCaller, req: video.GetVideoV2Request, context: any): Promise<video.GetVideoV2Response> {
  const requestData = mergeRequestData([
    video.GetVideoV2RequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetH5VideoV2',
    paths: [{ method: 'POST', path: `/luna/h5/video_v2` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetHashtagDetail(caller: IRequestCaller, req: hashtag.GetHashtagDetailRequest, context: any): Promise<hashtag.GetHashtagDetailResponse> {
  const requestData = mergeRequestData([
    hashtag.GetHashtagDetailRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetHashtagDetail',
    paths: [{ method: 'GET', path: `/luna/hashtag/detail` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetListenDurationActivityRankings(caller: IRequestCaller, req: activity.GetListenDurationActivityRankingsRequest, context: any): Promise<activity.GetListenDurationActivityRankingsResponse> {
  const requestData = mergeRequestData([
    activity.GetListenDurationActivityRankingsRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetListenDurationActivityRankings',
    paths: [{ method: 'POST', path: `/luna/activity/listen_duration/rankings` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetListenVideoTabModule(caller: IRequestCaller, req: module.GetListenVideoTabModuleRequest, context: any): Promise<module.GetListenVideoTabModuleResponse> {
  const requestData = mergeRequestData([
    module.GetListenVideoTabModuleRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetListenVideoTabModule',
    paths: [{ method: 'GET', path: `/luna/feed/listen-video-tab/module` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetLiveGuideStream(caller: IRequestCaller, req: live.GetLiveGuideStreamRequest, context: any): Promise<live.GetLiveGuideStreamResponse> {
  const requestData = mergeRequestData([
    live.GetLiveGuideStreamRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetLiveGuideStream',
    paths: [{ method: 'POST', path: `/luna/live/guide-stream` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetLiveRoom(caller: IRequestCaller, req: live.GetLiveRoomRequest, context: any): Promise<live.GetLiveRoomResponse> {
  const requestData = mergeRequestData([
    live.GetLiveRoomRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetLiveRoom',
    paths: [{ method: 'GET', path: `/luna/live/room` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetLocateVideo(caller: IRequestCaller, req: user.GetLocateVideoRequest, context: any): Promise<user.GetLocateVideoResponse> {
  const requestData = mergeRequestData([
    user.GetLocateVideoRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetLocateVideo',
    paths: [{ method: 'GET', path: `/luna/locate_video` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetLunaUGBarInfo(caller: IRequestCaller, req: ug.GetLunaUGBarInfoRequest, context: any): Promise<ug.GetLunaUGBarInfoResponse> {
  const requestData = mergeRequestData([
    ug.GetLunaUGBarInfoRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetLunaUGBarInfo',
    paths: [{ method: 'POST', path: `/luna/ug/bar/info` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetMagicTasks(caller: IRequestCaller, req: magic.GetMagicTasksRequest, context: any): Promise<magic.GetMagicTasksResponse> {
  const requestData = mergeRequestData([
    magic.GetMagicTasksRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetMagicTasks',
    paths: [{ method: 'GET', path: `/luna/magic/tasks` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetMeTabAutoplay(caller: IRequestCaller, req: playlist.GetMeTabAutoplayRequest, context: any): Promise<playlist.GetMeTabAutoplayResponse> {
  const requestData = mergeRequestData([
    playlist.GetMeTabAutoplayRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetMeTabAutoplay',
    paths: [{ method: 'GET', path: `/luna/me/autoplay` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetMediaAds(caller: IRequestCaller, req: ads.GetMediaAdsRequest, context: any): Promise<ads.GetMediaAdsResponse> {
  const requestData = mergeRequestData([
    ads.GetMediaAdsRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetMediaAds',
    paths: [{ method: 'POST', path: `/luna/media_ads` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetMediaMapping(caller: IRequestCaller, req: media.GetMediaMappingRequest, context: any): Promise<media.GetMediaMappingResponse> {
  const requestData = mergeRequestData([
    media.GetMediaMappingRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetMediaMapping',
    paths: [{ method: 'POST', path: `/luna/media_mapping` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetMediaPlayer(caller: IRequestCaller, req: media.GetMediaPlayerRequest, context: any): Promise<media.GetPlayerInfoResponse> {
  const requestData = mergeRequestData([
    media.GetMediaPlayerRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetMediaPlayer',
    paths: [{ method: 'GET', path: `/luna/media-player` }, { method: 'GET', path: `/luna/pc/media-player` }, { method: 'POST', path: `/luna/media-player` }, { method: 'POST', path: `/luna/pc/media-player` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetMediaStats(caller: IRequestCaller, req: media.GetMediaStatsRequest, context: any): Promise<media.GetMediaStatsResponse> {
  const requestData = mergeRequestData([
    media.GetMediaStatsRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetMediaStats',
    paths: [{ method: 'GET', path: `/luna/media-stats` }, { method: 'GET', path: `/luna/pc/media-stats` }, { method: 'POST', path: `/luna/media-stats` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetMiniAppList(caller: IRequestCaller, req: mini_app.GetMiniAppListRequest, context: any): Promise<mini_app.GetMiniAppListResponse> {
  const requestData = mergeRequestData([
    mini_app.GetMiniAppListRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetMiniAppList',
    paths: [{ method: 'POST', path: `/luna/mini_app/list` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetMixInfo(caller: IRequestCaller, req: mix.GetMixInfoRequest, context: any): Promise<mix.GetMixInfoResponse> {
  const requestData = mergeRequestData([
    mix.GetMixInfoRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetMixInfo',
    paths: [{ method: 'GET', path: `/luna/h5/mix_info` }, { method: 'POST', path: `/luna/h5/mix_info` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetMorePanel(caller: IRequestCaller, req: more_panel.MorePanelRequest, context: any): Promise<more_panel.MorePanelResponse> {
  const requestData = mergeRequestData([
    more_panel.MorePanelRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetMorePanel',
    paths: [{ method: 'POST', path: `/luna/more-panel` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetMorePanelResource(caller: IRequestCaller, req: more_panel.MorePanelResourceRequest, context: any): Promise<more_panel.MorePanelResourceResponse> {
  const requestData = mergeRequestData([
    more_panel.MorePanelResourceRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetMorePanelResource',
    paths: [{ method: 'POST', path: `/luna/more-panel/resource` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetMsgList(caller: IRequestCaller, req: message.GetMsgListRequest, context: any): Promise<message.GetMsgListResponse> {
  const requestData = mergeRequestData([
    message.GetMsgListRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetMsgList',
    paths: [{ method: 'GET', path: `/luna/notification/list` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetMusicMateGuidance(caller: IRequestCaller, req: music_mate.GetMusicMateGuidanceRequest, context: any): Promise<music_mate.GetMusicMateGuidanceResponse> {
  const requestData = mergeRequestData([
    music_mate.GetMusicMateGuidanceRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetMusicMateGuidance',
    paths: [{ method: 'POST', path: `/luna/social/mate/guidance` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetMusicMateHistory(caller: IRequestCaller, req: music_mate.GetMusicMateHistoryRequest, context: any): Promise<music_mate.GetMusicMateHistoryResponse> {
  const requestData = mergeRequestData([
    music_mate.GetMusicMateHistoryRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetMusicMateHistory',
    paths: [{ method: 'POST', path: `/luna/social/mate/history` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetMyBriefInfo(caller: IRequestCaller, req: me.GetMyBriefInfoRequest, context: any): Promise<me.GetMyBriefInfoResponse> {
  const requestData = mergeRequestData([
    me.GetMyBriefInfoRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetMyBriefInfo',
    paths: [{ method: 'GET', path: `/luna/h5/me` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetMyCollectionVideoList(caller: IRequestCaller, req: me.GetMyCollectionVideoListRequest, context: any): Promise<me.GetMyCollectionVideoListResponse> {
  const requestData = mergeRequestData([
    me.GetMyCollectionVideoListRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetMyCollectionVideoList',
    paths: [{ method: 'POST', path: `/luna/me/collection_video_list` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetMyFavoriteVideoList(caller: IRequestCaller, req: me.GetMyFavoriteVideoListRequest, context: any): Promise<me.GetMyFavoriteVideoListResponse> {
  const requestData = mergeRequestData([
    me.GetMyFavoriteVideoListRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetMyFavoriteVideoList',
    paths: [{ method: 'POST', path: `/luna/me/favorite_video_list` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetMyInfo(caller: IRequestCaller, req: me.GetMyInfoRequest, context: any): Promise<me.GetMyInfoResponse> {
  const requestData = mergeRequestData([
    me.GetMyInfoRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetMyInfo',
    paths: [{ method: 'GET', path: `/luna/me` }, { method: 'GET', path: `/luna/pc/me` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetMyListenStats(caller: IRequestCaller, req: me.GetMyListenStatsRequest, context: any): Promise<me.GetMyListenStatsResponse> {
  const requestData = mergeRequestData([
    me.GetMyListenStatsRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetMyListenStats',
    paths: [{ method: 'POST', path: `/luna/me/listen_stats` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetMyMixedCollections(caller: IRequestCaller, req: me.GetMyMixedCollectionsRequest, context: any): Promise<user.GetUserMixedCollectionsResponse> {
  const requestData = mergeRequestData([
    me.GetMyMixedCollectionsRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetMyMixedCollections',
    paths: [{ method: 'GET', path: `/luna/me/collection/mixed` }, { method: 'GET', path: `/luna/pc/me/collection/mixed` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetMyMusicWall(caller: IRequestCaller, request: me.GetMyMusicWallRequest, context: any): Promise<me.GetMyMusicWallResponse> {
  const requestData = mergeRequestData([
    me.GetMyMusicWallRequestToRequestData(request)
  ])
  const response = await caller({
    context,
    name: 'GetMyMusicWall',
    paths: [{ method: 'POST', path: `/luna/me/music_wall` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetMyPlaylists(caller: IRequestCaller, req: me.GetMyPlaylistsRequest, context: any): Promise<playlist.GetPlaylistsResponse> {
  const requestData = mergeRequestData([
    me.GetMyPlaylistsRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetMyPlaylists',
    paths: [{ method: 'GET', path: `/luna/me/playlist` }, { method: 'GET', path: `/luna/pc/me/playlist` }, { method: 'POST', path: `/luna/me/playlist/v2` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetMyPrivacySetting(caller: IRequestCaller, req: me.GetPrivacySettingRequest, context: any): Promise<me.GetPrivacySettingResponse> {
  const requestData = mergeRequestData([
    me.GetPrivacySettingRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetMyPrivacySetting',
    paths: [{ method: 'GET', path: `/luna/me/privacy/setting` }, { method: 'GET', path: `/luna/pc/me/privacy/setting` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetMySpecialStats(caller: IRequestCaller, request: me.GetMySpecialStatsRequest, context: any): Promise<me.GetMySpecialStatsResponse> {
  const requestData = mergeRequestData([
    me.GetMySpecialStatsRequestToRequestData(request)
  ])
  const response = await caller({
    context,
    name: 'GetMySpecialStats',
    paths: [{ method: 'POST', path: `/luna/me/special_stats` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetMySummary(caller: IRequestCaller, req: summary.GetMySummaryRequest, context: any): Promise<summary.GetMySummaryResponse> {
  const requestData = mergeRequestData([
    summary.GetMySummaryRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetMySummary',
    paths: [{ method: 'GET', path: `/luna/h5/me/summary` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetMySummary2023(caller: IRequestCaller, req: summary2023.GetMySummary2023Request, context: any): Promise<summary2023.GetMySummary2023Response> {
  const requestData = mergeRequestData([
    summary2023.GetMySummary2023RequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetMySummary2023',
    paths: [{ method: 'GET', path: `/luna/h5/summary2023` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetMySummary2024(caller: IRequestCaller, req: summary2024.GetMySummary2024Request, context: any): Promise<summary2024.GetMySummary2024Response> {
  const requestData = mergeRequestData([
    summary2024.GetMySummary2024RequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetMySummary2024',
    paths: [{ method: 'GET', path: `/luna/summary-2024` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetMySummary2025(caller: IRequestCaller, req: summary2025.GetMySummary2025Request, context: any): Promise<summary2025.GetMySummary2025Response> {
  const requestData = mergeRequestData([
    summary2025.GetMySummary2025RequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetMySummary2025',
    paths: [{ method: 'GET', path: `/luna/summary-2025` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetMyVideoList(caller: IRequestCaller, req: me.GetMyVideoListRequest, context: any): Promise<me.GetMyVideoListResponse> {
  const requestData = mergeRequestData([
    me.GetMyVideoListRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetMyVideoList',
    paths: [{ method: 'GET', path: `/luna/me/video_list` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetPlayerInfo(caller: IRequestCaller, req: media.GetMediaPlayerInfoRequest, context: any): Promise<media.GetPlayerInfoResponse> {
  const requestData = mergeRequestData([
    media.GetMediaPlayerInfoRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetPlayerInfo',
    paths: [{ method: 'GET', path: `/luna/player` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetPlayerInfoV2(caller: IRequestCaller, req: media.GetPlayerInfoRequest, context: any): Promise<media.GetPlayerInfoResponse> {
  const requestData = mergeRequestData([
    media.GetPlayerInfoRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetPlayerInfoV2',
    paths: [{ method: 'GET', path: `/luna/${requestData.params.id}/player` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetPlaylistDetail(caller: IRequestCaller, req: playlist.GetPlaylistDetailRequest, context: any): Promise<playlist.GetPlaylistDetailResponse> {
  const requestData = mergeRequestData([
    playlist.GetPlaylistDetailRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetPlaylistDetail',
    paths: [{ method: 'GET', path: `/luna/playlist/detail` }, { method: 'GET', path: `/luna/pc/playlist/detail` }, { method: 'POST', path: `/luna/playlist/detail` }, { method: 'POST', path: `/luna/pc/playlist/detail` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetPlaylistFeedMedia(caller: IRequestCaller, req: playlist.GetPlaylistFeedMediaRequest, context: any): Promise<playlist.GetPlaylistFeedMediaResponse> {
  const requestData = mergeRequestData([
    playlist.GetPlaylistFeedMediaRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetPlaylistFeedMedia',
    paths: [{ method: 'POST', path: `/luna/playlist/feed/media` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetPlaylistRelatedMedia(caller: IRequestCaller, req: playlist.GetPlaylistRelatedMediaRequest, context: any): Promise<playlist.GetPlaylistRelatedMediaResponse> {
  const requestData = mergeRequestData([
    playlist.GetPlaylistRelatedMediaRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetPlaylistRelatedMedia',
    paths: [{ method: 'POST', path: `/luna/playlist/related_media` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetPlugVisibility(caller: IRequestCaller, req: plug.GetPlugVisibilityRequest, context: any): Promise<plug.GetPlugVisibilityResponse> {
  const requestData = mergeRequestData([
    plug.GetPlugVisibilityRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetPlugVisibility',
    paths: [{ method: 'GET', path: `/luna/plug/visibility/detail` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetPreviewMsg(caller: IRequestCaller, req: summary2023.GetPreviewMsgRequest, context: any): Promise<summary2023.GetPreviewMsgResponse> {
  const requestData = mergeRequestData([
    summary2023.GetPreviewMsgRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetPreviewMsg',
    paths: [{ method: 'POST', path: `/luna/h5/preview` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetRecentPlayedMedia(caller: IRequestCaller, req: me.GetRecentPlayedMediaRequest, context: any): Promise<me.GetRecentPlayedMediaResponse> {
  const requestData = mergeRequestData([
    me.GetRecentPlayedMediaRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetRecentPlayedMedia',
    paths: [{ method: 'GET', path: `/luna/me/recently-played-media` }, { method: 'GET', path: `/luna/pc/me/recently-played-media` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetRecentPlayedStats(caller: IRequestCaller, req: me.GetRecentPlayedStatsRequest, context: any): Promise<me.GetRecentPlayedStatsResponse> {
  const requestData = mergeRequestData([
    me.GetRecentPlayedStatsRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetRecentPlayedStats',
    paths: [{ method: 'GET', path: `/luna/me/recently-played-stats` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetRecentPlayedTracks(caller: IRequestCaller, req: me.GetRecentPlayedTracksRequest, context: any): Promise<me.GetRecentPlayedTracksResponse> {
  const requestData = mergeRequestData([
    me.GetRecentPlayedTracksRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetRecentPlayedTracks',
    paths: [{ method: 'GET', path: `/luna/me/recently-played` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetRecommendEmoticons(caller: IRequestCaller, req: emoticon.GetRecommendEmoticonsRequest, context: any): Promise<emoticon.GetRecommendEmoticonsResponse> {
  const requestData = mergeRequestData([
    emoticon.GetRecommendEmoticonsRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetRecommendEmoticons',
    paths: [{ method: 'GET', path: `/luna/emoticons/recommend` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetRecommendHashtags(caller: IRequestCaller, req: hashtag.GetRecommendHashtagsRequest, context: any): Promise<hashtag.GetRecommendHashtagsResponse> {
  const requestData = mergeRequestData([
    hashtag.GetRecommendHashtagsRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetRecommendHashtags',
    paths: [{ method: 'GET', path: `/luna/hashtag/recommend` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetRecommendPlaylist(caller: IRequestCaller, req: playlist.GetRecommendPlaylistRequest, context: any): Promise<playlist.GetRecommendPlaylistResponse> {
  const requestData = mergeRequestData([
    playlist.GetRecommendPlaylistRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetRecommendPlaylist',
    paths: [{ method: 'GET', path: `/luna/me/playlist/recommend` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetRelatedMedia(caller: IRequestCaller, req: feed.GetRelatedMediaRequest, context: any): Promise<feed.FeedResponse> {
  const requestData = mergeRequestData([
    feed.GetRelatedMediaRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetRelatedMedia',
    paths: [{ method: 'POST', path: `/luna/media/related` }, { method: 'POST', path: `/luna/pc/media/related` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetRelatedTracks(caller: IRequestCaller, req: feed.GetRelatedTracksRequest, context: any): Promise<feed.FeedResponse> {
  const requestData = mergeRequestData([
    feed.GetRelatedTracksRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetRelatedTracks',
    paths: [{ method: 'GET', path: `/luna/track/related` }, { method: 'POST', path: `/luna/track/related` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetReportReason(caller: IRequestCaller, req: report.GetReportReasonRequest, context: any): Promise<report.GetReportReasonResponse> {
  const requestData = mergeRequestData([
    report.GetReportReasonRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetReportReason',
    paths: [{ method: 'GET', path: `/luna/pc/report/reason` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetRoomInfo(caller: IRequestCaller, req: music_mate.GetRoomInfoRequest, context: any): Promise<music_mate.GetRoomInfoResponse> {
  const requestData = mergeRequestData([
    music_mate.GetRoomInfoRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetRoomInfo',
    paths: [{ method: 'POST', path: `/luna/social/mate/room/info` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetSearchBlock(caller: IRequestCaller, req: search.GetSearchBlockRequest, context: any): Promise<search.GetSearchBlockResponse> {
  const requestData = mergeRequestData([
    search.GetSearchBlockRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetSearchBlock',
    paths: [{ method: 'POST', path: `/luna/search-block` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetSeoTracks(caller: IRequestCaller, req: seo.GetSeoTracksRequest, context: any): Promise<seo.GetSeoTracksResponse> {
  const requestData = mergeRequestData([
    seo.GetSeoTracksRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetSeoTracks',
    paths: [{ method: 'GET', path: `/luna/h5/seo_track` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetShareInfo(caller: IRequestCaller, req: share.GetShareInfoRequest, context: any): Promise<share.GetShareInfoResponse> {
  const requestData = mergeRequestData([
    share.GetShareInfoRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetShareInfo',
    paths: [{ method: 'GET', path: `/luna/share_info` }, { method: 'GET', path: `/luna/pc/share_info` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetSharePostAwemeStatus(caller: IRequestCaller, req: share.GetSharePostAwemeStatusRequest, context: any): Promise<share.GetSharePostAwemeStatusResponse> {
  const requestData = mergeRequestData([
    share.GetSharePostAwemeStatusRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetSharePostAwemeStatus',
    paths: [{ method: 'GET', path: `/luna/share/post_aweme/status` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetShareUserList(caller: IRequestCaller, request: share.GetShareUserListRequest, context: any): Promise<share.GetShareUserListResponse> {
  const requestData = mergeRequestData([
    share.GetShareUserListRequestToRequestData(request)
  ])
  const response = await caller({
    context,
    name: 'GetShareUserList',
    paths: [{ method: 'POST', path: `/luna/share/user_list` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetSharingItems(caller: IRequestCaller, req: me.GetSharingItemsRequest, context: any): Promise<me.GetSharingItemsResponse> {
  const requestData = mergeRequestData([
    me.GetSharingItemsRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetSharingItems',
    paths: [{ method: 'GET', path: `/luna/me/sharing_items` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetSummary2023Video(caller: IRequestCaller, req: summary2023.GetSummary2023VideoRequest, context: any): Promise<summary2023.GetSummary2023VideoResponse> {
  const requestData = mergeRequestData([
    summary2023.GetSummary2023VideoRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetSummary2023Video',
    paths: [{ method: 'GET', path: `/luna/summary2023/video` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetSummary2024Availability(caller: IRequestCaller, req: summary2024.GetSummary2024AvailabilityRequest, context: any): Promise<summary2024.GetSummary2024AvailabilityResponse> {
  const requestData = mergeRequestData([
    summary2024.GetSummary2024AvailabilityRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetSummary2024Availability',
    paths: [{ method: 'GET', path: `/luna/summary-2024/availability` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetSummary2025Availability(caller: IRequestCaller, req: summary2025.GetSummary2025AvailabilityRequest, context: any): Promise<summary2025.GetSummary2025AvailabilityResponse> {
  const requestData = mergeRequestData([
    summary2025.GetSummary2025AvailabilityRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetSummary2025Availability',
    paths: [{ method: 'GET', path: `/luna/summary-2025/availability` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetTrack(caller: IRequestCaller, req: track.GetTrackRequest, context: any): Promise<track.GetTrackResponse> {
  const requestData = mergeRequestData([
    track.GetTrackRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetTrack',
    paths: [{ method: 'GET', path: `/luna/track` }, { method: 'POST', path: `/luna/track` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetTrackForBell(caller: IRequestCaller, req: track.GetTrackForBellRequest, context: any): Promise<track.GetTrackV2Response> {
  const requestData = mergeRequestData([
    track.GetTrackForBellRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetTrackForBell',
    paths: [{ method: 'GET', path: `/luna/track_for_bell` }, { method: 'POST', path: `/luna/track_for_bell` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetTrackPlayerInfo(caller: IRequestCaller, req: media.GetTrackPlayerInfoRequest, context: any): Promise<media.GetTrackPlayerInfoResponse> {
  const requestData = mergeRequestData([
    media.GetTrackPlayerInfoRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetTrackPlayerInfo',
    paths: [{ method: 'GET', path: `/luna/track_player` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetTrackV2(caller: IRequestCaller, req: track.GetTrackV2Request, context: any): Promise<track.GetTrackV2Response> {
  const requestData = mergeRequestData([
    track.GetTrackV2RequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetTrackV2',
    paths: [{ method: 'GET', path: `/luna/track_v2` }, { method: 'GET', path: `/luna/pc/track_v2` }, { method: 'POST', path: `/luna/track_v2` }, { method: 'POST', path: `/luna/pc/track_v2` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetUGTrackInfo(caller: IRequestCaller, req: ug.GetUGTrackInfoRequest, context: any): Promise<ug.GetUGTrackInfoResponse> {
  const requestData = mergeRequestData([
    ug.GetUGTrackInfoRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetUGTrackInfo',
    paths: [{ method: 'GET', path: `/luna/ug/track/info` }, { method: 'POST', path: `/luna/ug/track/info` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetUploaderInfo(caller: IRequestCaller, req: media.GetUploderInfoRequest, context: any): Promise<media.GetUploaderInfoResponse> {
  const requestData = mergeRequestData([
    media.GetUploderInfoRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetUploaderInfo',
    paths: [{ method: 'GET', path: `/luna/video/uploader` }, { method: 'GET', path: `/luna/pc/video/uploader` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetUserArtistCollection(caller: IRequestCaller, req: user.GetUserArtistCollectionRequest, context: any): Promise<me.GetArtistCollectionResponse> {
  const requestData = mergeRequestData([
    user.GetUserArtistCollectionRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetUserArtistCollection',
    paths: [{ method: 'GET', path: `/luna/user/collection/artist` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetUserHashtagComments(caller: IRequestCaller, req: hashtag.GetUserHashtagCommentsRequest, context: any): Promise<hashtag.GetUserHashtagCommentsResponse> {
  const requestData = mergeRequestData([
    hashtag.GetUserHashtagCommentsRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetUserHashtagComments',
    paths: [{ method: 'GET', path: `/luna/hashtag/user_comments` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetUserInfo(caller: IRequestCaller, req: user.GetUserInfoRequest, context: any): Promise<user.GetUserInfoResponse> {
  const requestData = mergeRequestData([
    user.GetUserInfoRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetUserInfo',
    paths: [{ method: 'GET', path: `/luna/users/${requestData.params.user_id}` }, { method: 'GET', path: `/luna/user/info` }, { method: 'GET', path: `/luna/pc/users/${requestData.params.user_id}` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetUserInfoByToken(caller: IRequestCaller, req: user.GetUserInfoByTokenRequest, context: any): Promise<user.GetUserInfoByTokenResponse> {
  const requestData = mergeRequestData([
    user.GetUserInfoByTokenRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetUserInfoByToken',
    paths: [{ method: 'GET', path: `/luna/token/user/info` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetUserLiveRoom(caller: IRequestCaller, req: live.GetUserLiveRoomRequest, context: any): Promise<live.GetUserLiveRoomResponse> {
  const requestData = mergeRequestData([
    live.GetUserLiveRoomRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetUserLiveRoom',
    paths: [{ method: 'GET', path: `/luna/users/live_room` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetUserMixInfo(caller: IRequestCaller, req: user.GetUserMixInfoRequest, context: any): Promise<user.GetUserMixInfoResponse> {
  const requestData = mergeRequestData([
    user.GetUserMixInfoRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetUserMixInfo',
    paths: [{ method: 'GET', path: `/luna/user/mix_info` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetUserMixedCollections(caller: IRequestCaller, request: user.GetUserMixedCollectionsRequest, context: any): Promise<user.GetUserMixedCollectionsResponse> {
  const requestData = mergeRequestData([
    user.GetUserMixedCollectionsRequestToRequestData(request)
  ])
  const response = await caller({
    context,
    name: 'GetUserMixedCollections',
    paths: [{ method: 'GET', path: `/luna/user/collection/mixed` }, { method: 'GET', path: `/luna/pc/user/collection/mixed` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetUserMusicWall(caller: IRequestCaller, req: user.GetUserMusicWallRequest, context: any): Promise<user.GetUserMusicWallResponse> {
  const requestData = mergeRequestData([
    user.GetUserMusicWallRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetUserMusicWall',
    paths: [{ method: 'GET', path: `/luna/users/${requestData.params.user_id}/music_wall` }, { method: 'POST', path: `/luna/users/${requestData.params.user_id}/music_wall` }, { method: 'POST', path: `/luna/user/music_wall` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetUserPlaylists(caller: IRequestCaller, req: user.GetUserPlaylistsRequest, context: any): Promise<playlist.GetPlaylistsResponse> {
  const requestData = mergeRequestData([
    user.GetUserPlaylistsRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetUserPlaylists',
    paths: [{ method: 'GET', path: `/luna/user/playlist` }, { method: 'GET', path: `/luna/pc/user/playlist` }, { method: 'POST', path: `/luna/user/playlist` }, { method: 'POST', path: `/luna/pc/user/playlist` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetUserRecentRooms(caller: IRequestCaller, req: music_mate.GetUserRecentRoomsRequest, context: any): Promise<music_mate.GetUserRecentRoomsResponse> {
  const requestData = mergeRequestData([
    music_mate.GetUserRecentRoomsRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetUserRecentRooms',
    paths: [{ method: 'POST', path: `/luna/social/mate/room/user_recent` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetUserVideoList(caller: IRequestCaller, req: user.GetUserVideoListRequest, context: any): Promise<user.GetUserVideoListResponse> {
  const requestData = mergeRequestData([
    user.GetUserVideoListRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetUserVideoList',
    paths: [{ method: 'GET', path: `/luna/user/video_list` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetVideo(caller: IRequestCaller, req: video.GetVideoRequest, context: any): Promise<video.GetVideoResponse> {
  const requestData = mergeRequestData([
    video.GetVideoRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetVideo',
    paths: [{ method: 'POST', path: `/luna/video` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetVideoMix(caller: IRequestCaller, req: video.GetVideoMixRequest, context: any): Promise<video.GetVideoMixResponse> {
  const requestData = mergeRequestData([
    video.GetVideoMixRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetVideoMix',
    paths: [{ method: 'GET', path: `/luna/video_mix` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetVideoPlaylistDetail(caller: IRequestCaller, req: video.GetVideoPlaylistDetailRequest, context: any): Promise<video.GetVideoPlaylistDetailResponse> {
  const requestData = mergeRequestData([
    video.GetVideoPlaylistDetailRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetVideoPlaylistDetail',
    paths: [{ method: 'GET', path: `/luna/video_playlist/detail` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetVideoV2(caller: IRequestCaller, req: video.GetVideoV2Request, context: any): Promise<video.GetVideoV2Response> {
  const requestData = mergeRequestData([
    video.GetVideoV2RequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetVideoV2',
    paths: [{ method: 'POST', path: `/luna/video_v2` }, { method: 'POST', path: `/luna/pc/video_v2` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetVolumeStrategy(caller: IRequestCaller, req: device.GetVolumeStrategyRequest, context: any): Promise<device.GetVolumeStrategyResponse> {
  const requestData = mergeRequestData([
    device.GetVolumeStrategyRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetVolumeStrategy',
    paths: [{ method: 'POST', path: `/luna/device/volume` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function IMSend(caller: IRequestCaller, req: im.IMSendRequest, context: any): Promise<im.IMSendResponse> {
  const requestData = mergeRequestData([
    im.IMSendRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'IMSend',
    paths: [{ method: 'POST', path: `/luna/im/send` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function ImportPlaylist(caller: IRequestCaller, req: playlist.ImportPlaylistRequest, context: any): Promise<playlist.ImportPlaylistResponse> {
  const requestData = mergeRequestData([
    playlist.ImportPlaylistRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'ImportPlaylist',
    paths: [{ method: 'POST', path: `/luna/me/playlist/import` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function Launch(caller: IRequestCaller, req: misc.LaunchRequest, context: any): Promise<misc.LaunchResponse> {
  const requestData = mergeRequestData([
    misc.LaunchRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'Launch',
    paths: [{ method: 'GET', path: `/luna/launch` }, { method: 'GET', path: `/luna/pc/launch` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function LaunchDevice(caller: IRequestCaller, req: misc.LaunchDeviceRequest, context: any): Promise<misc.LaunchDeviceResponse> {
  const requestData = mergeRequestData([
    misc.LaunchDeviceRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'LaunchDevice',
    paths: [{ method: 'GET', path: `/luna/launch/device` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function LightUpArtists(caller: IRequestCaller, req: artist.LightUpArtistsRequest, context: any): Promise<artist.LightUpArtistsResponse> {
  const requestData = mergeRequestData([
    artist.LightUpArtistsRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'LightUpArtists',
    paths: [{ method: 'POST', path: `/luna/artist/light_up` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function LikeUserListenDuration(caller: IRequestCaller, req: user.LikeUserListenDurationRequest, context: any): Promise<general.GeneralResponse> {
  const requestData = mergeRequestData([
    user.LikeUserListenDurationRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'LikeUserListenDuration',
    paths: [{ method: 'POST', path: `/luna/user/listen_duration/like` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function ListArtistAlbums(caller: IRequestCaller, req: artist.ListArtistAlbumsRequest, context: any): Promise<artist.ListArtistAlbumsResponse> {
  const requestData = mergeRequestData([
    artist.ListArtistAlbumsRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'ListArtistAlbums',
    paths: [{ method: 'GET', path: `/luna/artists/${requestData.params.artist_id}/albums` }, { method: 'GET', path: `/luna/pc/artists/${requestData.params.artist_id}/albums` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function ListArtistTracks(caller: IRequestCaller, req: artist.ListArtistTracksRequest, context: any): Promise<artist.ListArtistTracksResponse> {
  const requestData = mergeRequestData([
    artist.ListArtistTracksRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'ListArtistTracks',
    paths: [{ method: 'GET', path: `/luna/artists/${requestData.params.artist_id}/tracks` }, { method: 'GET', path: `/luna/pc/artists/${requestData.params.artist_id}/tracks` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function ListComments(caller: IRequestCaller, req: comment.ListCommentsRequest, context: any): Promise<comment.ListCommentsResponse> {
  const requestData = mergeRequestData([
    comment.ListCommentsRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'ListComments',
    paths: [{ method: 'GET', path: `/luna/comments` }, { method: 'GET', path: `/luna/h5/comments` }, { method: 'GET', path: `/luna/pc/comments` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function ListReplies(caller: IRequestCaller, req: comment.ListRepliesRequest, context: any): Promise<comment.ListRepliesResponse> {
  const requestData = mergeRequestData([
    comment.ListRepliesRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'ListReplies',
    paths: [{ method: 'GET', path: `/luna/comments/${requestData.params.comment_id}/replies` }, { method: 'GET', path: `/luna/pc/comments/${requestData.params.comment_id}/replies` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function ListenVideoReminder(caller: IRequestCaller, req: module.ListenVideoReminderRequest, context: any): Promise<module.ListenVideoReminderResponse> {
  const requestData = mergeRequestData([
    module.ListenVideoReminderRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'ListenVideoReminder',
    paths: [{ method: 'GET', path: `/luna/listen-video/reminder` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function LogEvent(caller: IRequestCaller, req: log_event.LogEventRequest, context: any): Promise<log_event.LogEventResponse> {
  const requestData = mergeRequestData([
    log_event.LogEventRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'LogEvent',
    paths: [{ method: 'POST', path: `/luna/log/event` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function MAppendPlaylistMedia(caller: IRequestCaller, req: playlist.MAppendPlaylistMediaRequest, context: any): Promise<playlist.MAppendPlaylistMediaResponse> {
  const requestData = mergeRequestData([
    playlist.MAppendPlaylistMediaRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'MAppendPlaylistMedia',
    paths: [{ method: 'POST', path: `/luna/me/playlist/media/append` }, { method: 'POST', path: `/luna/pc/me/playlist/media/append` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function MAppendPlaylistTracks(caller: IRequestCaller, req: playlist.MAppendPlaylistTracksRequest, context: any): Promise<playlist.MAppendPlaylistTracksResponse> {
  const requestData = mergeRequestData([
    playlist.MAppendPlaylistTracksRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'MAppendPlaylistTracks',
    paths: [{ method: 'POST', path: `/luna/me/playlist/track/append` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function MCheckMedia(caller: IRequestCaller, req: media.MCheckMediaRequest, context: any): Promise<media.MCheckMediaResponse> {
  const requestData = mergeRequestData([
    media.MCheckMediaRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'MCheckMedia',
    paths: [{ method: 'POST', path: `/luna/mcheck` }, { method: 'POST', path: `/luna/pc/mcheck` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function MCheckTrack(caller: IRequestCaller, req: track.MCheckTrackRequest, context: any): Promise<track.MCheckTrackResponse> {
  const requestData = mergeRequestData([
    track.MCheckTrackRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'MCheckTrack',
    paths: [{ method: 'POST', path: `/luna/track/mcheck` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function MDeleteCollectedAlbums(caller: IRequestCaller, request: me.DeleteCollectedAlbumsRequest, context: any): Promise<me.DeleteCollectedAlbumsResponse> {
  const requestData = mergeRequestData([
    me.DeleteCollectedAlbumsRequestToRequestData(request)
  ])
  const response = await caller({
    context,
    name: 'MDeleteCollectedAlbums',
    paths: [{ method: 'POST', path: `/luna/me/collection/album/delete` }, { method: 'POST', path: `/luna/pc/me/collection/album/delete` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function MDeleteCollectedArtists(caller: IRequestCaller, request: me.DeleteCollectedArtistsRequest, context: any): Promise<me.DeleteCollectedArtistsResponse> {
  const requestData = mergeRequestData([
    me.DeleteCollectedArtistsRequestToRequestData(request)
  ])
  const response = await caller({
    context,
    name: 'MDeleteCollectedArtists',
    paths: [{ method: 'POST', path: `/luna/me/collection/artist/delete` }, { method: 'POST', path: `/luna/pc/me/collection/artist/delete` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function MDeleteCollectedPlaylists(caller: IRequestCaller, req: me.DeleteCollectedPlaylistsRequest, context: any): Promise<me.DeleteCollectedPlaylistsResponse> {
  const requestData = mergeRequestData([
    me.DeleteCollectedPlaylistsRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'MDeleteCollectedPlaylists',
    paths: [{ method: 'POST', path: `/luna/me/collection/playlist/delete` }, { method: 'POST', path: `/luna/pc/me/collection/playlist/delete` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function MDeleteCollectedTracks(caller: IRequestCaller, request: me.DeleteCollectedTracksRequest, context: any): Promise<me.DeleteCollectedTracksResponse> {
  const requestData = mergeRequestData([
    me.DeleteCollectedTracksRequestToRequestData(request)
  ])
  const response = await caller({
    context,
    name: 'MDeleteCollectedTracks',
    paths: [{ method: 'POST', path: `/luna/me/collection/track/delete` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function MDeletePlaylists(caller: IRequestCaller, req: playlist.MDeletePlaylistsRequest, context: any): Promise<playlist.MDeletePlaylistsResponse> {
  const requestData = mergeRequestData([
    playlist.MDeletePlaylistsRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'MDeletePlaylists',
    paths: [{ method: 'POST', path: `/luna/me/playlist/delete` }, { method: 'POST', path: `/luna/pc/me/playlist/delete` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function MGetMedia(caller: IRequestCaller, req: media.MGetMediaRequest, context: any): Promise<media.MGetMediaResponse> {
  const requestData = mergeRequestData([
    media.MGetMediaRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'MGetMedia',
    paths: [{ method: 'GET', path: `/luna/media` }, { method: 'POST', path: `/luna/media` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function MGetMediaV2(caller: IRequestCaller, req: media.MGetMediaV2Request, context: any): Promise<media.MGetMediaV2Response> {
  const requestData = mergeRequestData([
    media.MGetMediaV2RequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'MGetMediaV2',
    paths: [{ method: 'GET', path: `/luna/media_v2` }, { method: 'POST', path: `/luna/media_v2` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function MGetPlaylistImportTasks(caller: IRequestCaller, req: playlist.MGetPlaylistImportTasksRequest, context: any): Promise<playlist.MGetPlaylistImportTasksResponse> {
  const requestData = mergeRequestData([
    playlist.MGetPlaylistImportTasksRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'MGetPlaylistImportTasks',
    paths: [{ method: 'POST', path: `/luna/me/playlist/import_task_info` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function MarkMediaList(caller: IRequestCaller, request: me.MarkMediaListRequest, context: any): Promise<me.MarkMediaListResponse> {
  const requestData = mergeRequestData([
    me.MarkMediaListRequestToRequestData(request)
  ])
  const response = await caller({
    context,
    name: 'MarkMediaList',
    paths: [{ method: 'POST', path: `/luna/me/mark/media` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function MarkRead(caller: IRequestCaller, req: message.MarkReadRequest, context: any): Promise<message.MarkReadResponse> {
  const requestData = mergeRequestData([
    message.MarkReadRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'MarkRead',
    paths: [{ method: 'POST', path: `/luna/notification/mark_read` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function MetabDiscover(caller: IRequestCaller, req: me.MetabDiscoverRequest, context: any): Promise<me.MetabDiscoverResponse> {
  const requestData = mergeRequestData([
    me.MetabDiscoverRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'MetabDiscover',
    paths: [{ method: 'POST', path: `/luna/me/discover` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function ModifyMyAvatarDecoration(caller: IRequestCaller, req: summary.ModifyMyAvatarDecorationRequest, context: any): Promise<summary.ModifyMyAvatarDecorationResponse> {
  const requestData = mergeRequestData([
    summary.ModifyMyAvatarDecorationRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'ModifyMyAvatarDecoration',
    paths: [{ method: 'POST', path: `/luna/me/avatar_decoration/modify` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function PlaylistSearch(caller: IRequestCaller, req: playlist.PlaylistSearchRequest, context: any): Promise<playlist.PlaylistSearchResponse> {
  const requestData = mergeRequestData([
    playlist.PlaylistSearchRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'PlaylistSearch',
    paths: [{ method: 'POST', path: `/luna/playlist/search` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function PlugAction(caller: IRequestCaller, req: plug.PlugActionRequest, context: any): Promise<plug.PlugActionResponse> {
  const requestData = mergeRequestData([
    plug.PlugActionRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'PlugAction',
    paths: [{ method: 'POST', path: `/luna/plug/action` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function QueryGamePlayRecord(caller: IRequestCaller, req: game_play.QueryGamePlayRecordRequest, context: any): Promise<game_play.QueryGamePlayRecordResponse> {
  const requestData = mergeRequestData([
    game_play.QueryGamePlayRecordRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'QueryGamePlayRecord',
    paths: [{ method: 'POST', path: `/luna/game_play/query_record` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function QueryZlink(caller: IRequestCaller, req: share.QueryZlinkRequest, context: any): Promise<share.QueryZlinkResponse> {
  const requestData = mergeRequestData([
    share.QueryZlinkRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'QueryZlink',
    paths: [{ method: 'GET', path: `/luna/query_zlink` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function RedeemInvitationCode(caller: IRequestCaller, req: misc.RedeemInvitationCodeRequest, context: any): Promise<misc.RedeemInvitationCodeResponse> {
  const requestData = mergeRequestData([
    misc.RedeemInvitationCodeRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'RedeemInvitationCode',
    paths: [{ method: 'POST', path: `/luna/invitation_code` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function RefreshInvitationCodeTime(caller: IRequestCaller, req: misc.RefreshInvitationCodeTimeRequest, context: any): Promise<misc.RefreshInvitationCodeTimeResponse> {
  const requestData = mergeRequestData([
    misc.RefreshInvitationCodeTimeRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'RefreshInvitationCodeTime',
    paths: [{ method: 'POST', path: `/luna/invitation/refresh_time` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function RegisterMiniLunaUser(caller: IRequestCaller, req: mini_luna.RegisterMiniLunaUserRequest, context: any): Promise<mini_luna.RegisterMiniLunaUserResponse> {
  const requestData = mergeRequestData([
    mini_luna.RegisterMiniLunaUserRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'RegisterMiniLunaUser',
    paths: [{ method: 'POST', path: `/luna/register_mini_luna` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function RejectFollow(caller: IRequestCaller, req: me.RejectFollowRequest, context: any): Promise<me.RejectFollowResponse> {
  const requestData = mergeRequestData([
    me.RejectFollowRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'RejectFollow',
    paths: [{ method: 'POST', path: `/luna/me/follow/reject` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function RejectJoin(caller: IRequestCaller, req: music_mate.RejectJoinRequest, context: any): Promise<music_mate.RejectJoinResponse> {
  const requestData = mergeRequestData([
    music_mate.RejectJoinRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'RejectJoin',
    paths: [{ method: 'POST', path: `/luna/social/mate/room/reject_join` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function Report(caller: IRequestCaller, req: report.ReportRequest, context: any): Promise<report.ReportResponse> {
  const requestData = mergeRequestData([
    report.ReportRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'Report',
    paths: [{ method: 'POST', path: `/luna/report` }, { method: 'POST', path: `/luna/pc/report` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function ReportAction(caller: IRequestCaller, req: misc.ReportActionsRequest, context: any): Promise<misc.ReportActionsResponse> {
  const requestData = mergeRequestData([
    misc.ReportActionsRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'ReportAction',
    paths: [{ method: 'POST', path: `/luna/action` }, { method: 'POST', path: `/luna/pc/action` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function ReportDeviceProfile(caller: IRequestCaller, req: device.ReportDeviceProfileRequest, context: any): Promise<device.ReportDeviceProfileResponse> {
  const requestData = mergeRequestData([
    device.ReportDeviceProfileRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'ReportDeviceProfile',
    paths: [{ method: 'POST', path: `/luna/device/report/info` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function ReportFeedInfo(caller: IRequestCaller, req: feed.ReportFeedInfoRequest, context: any): Promise<feed.ReportFeedInfoResponse> {
  const requestData = mergeRequestData([
    feed.ReportFeedInfoRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'ReportFeedInfo',
    paths: [{ method: 'POST', path: `/luna/feed/report-info` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function ReportItemAction(caller: IRequestCaller, req: misc.ReportItemActionRequest, context: any): Promise<misc.ReportItemActionResponse> {
  const requestData = mergeRequestData([
    misc.ReportItemActionRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'ReportItemAction',
    paths: [{ method: 'POST', path: `/luna/item-action` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function ReportSID(caller: IRequestCaller, req: misc.ReportSpecialIDRequest, context: any): Promise<misc.ReportSpecialIDResponse> {
  const requestData = mergeRequestData([
    misc.ReportSpecialIDRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'ReportSID',
    paths: [{ method: 'POST', path: `/luna/me/report_special_id` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function ReportSample(caller: IRequestCaller, req: reco_sample.ReportSampleRequest, context: any): Promise<reco_sample.ReportSampleResponse> {
  const requestData = mergeRequestData([
    reco_sample.ReportSampleRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'ReportSample',
    paths: [{ method: 'POST', path: `/luna/reco_sample` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function Search(caller: IRequestCaller, req: search.SearchRequest, context: any): Promise<search.SearchResponse> {
  const requestData = mergeRequestData([
    search.SearchRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'Search',
    paths: [{ method: 'GET', path: `/luna/search/${requestData.params.search_type}` }, { method: 'GET', path: `/luna/pc/search/${requestData.params.search_type}` }, { method: 'POST', path: `/luna/search/${requestData.params.search_type}` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function Search2023(caller: IRequestCaller, req: search.SearchRequest, context: any): Promise<search.SearchResponse> {
  const requestData = mergeRequestData([
    search.SearchRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'Search2023',
    paths: [{ method: 'POST', path: `/luna/h5/search/${requestData.params.search_type}` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function SearchCategories(caller: IRequestCaller, req: search.SearchRequest, context: any): Promise<search.SearchCategoriesResponse> {
  const requestData = mergeRequestData([
    search.SearchRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'SearchCategories',
    paths: [{ method: 'POST', path: `/luna/search-categories` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function SendInvitePush(caller: IRequestCaller, req: music_mate.SendInvitePushRequest, context: any): Promise<music_mate.SendInvitePushResponse> {
  const requestData = mergeRequestData([
    music_mate.SendInvitePushRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'SendInvitePush',
    paths: [{ method: 'POST', path: `/luna/social/mate/room/invite_push` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function SetBoost(caller: IRequestCaller, request: me.SetUserBoostRequest, context: any): Promise<me.SetUserBoostResponse> {
  const requestData = mergeRequestData([
    me.SetUserBoostRequestToRequestData(request)
  ])
  const response = await caller({
    context,
    name: 'SetBoost',
    paths: [{ method: 'POST', path: `/luna/me/boost` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function SetPlugVisibility(caller: IRequestCaller, req: plug.SetPlugVisibilityRequest, context: any): Promise<plug.SetPlugVisibilityResponse> {
  const requestData = mergeRequestData([
    plug.SetPlugVisibilityRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'SetPlugVisibility',
    paths: [{ method: 'POST', path: `/luna/plug/visibility/set` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function ShareCodeParse(caller: IRequestCaller, req: share.ShareCodeParseRequest, context: any): Promise<share.ShareCodeParseResponse> {
  const requestData = mergeRequestData([
    share.ShareCodeParseRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'ShareCodeParse',
    paths: [{ method: 'GET', path: `/luna/share/code/parse` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function ShareCount(caller: IRequestCaller, req: share.ShareCountRequest, context: any): Promise<general.GeneralResponse> {
  const requestData = mergeRequestData([
    share.ShareCountRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'ShareCount',
    paths: [{ method: 'POST', path: `/luna/count/shared` }, { method: 'POST', path: `/luna/pc/count/shared` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function ShareInvitationCode(caller: IRequestCaller, req: misc.ShareInvitationCodeRequest, context: any): Promise<misc.ShareInvitationCodeResponse> {
  const requestData = mergeRequestData([
    misc.ShareInvitationCodeRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'ShareInvitationCode',
    paths: [{ method: 'POST', path: `/luna/invitation/share` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function SharePostAweme(caller: IRequestCaller, req: share.SharePostAwemeRequest, context: any): Promise<share.SharePostAwemeResponse> {
  const requestData = mergeRequestData([
    share.SharePostAwemeRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'SharePostAweme',
    paths: [{ method: 'POST', path: `/luna/share/post_aweme` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function Shark(caller: IRequestCaller, req: media.SharkRequest, context: any): Promise<media.SharkResponse> {
  const requestData = mergeRequestData([
    media.SharkRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'Shark',
    paths: [{ method: 'POST', path: `/luna/shark` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function ShortenZlinkUrl(caller: IRequestCaller, req: share.ShortenZlinkUrlRequest, context: any): Promise<share.ShortenZlinkUrlResponse> {
  const requestData = mergeRequestData([
    share.ShortenZlinkUrlRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'ShortenZlinkUrl',
    paths: [{ method: 'GET', path: `/luna/shorten_zlink` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function SortPlaylistMedia(caller: IRequestCaller, req: playlist.SortPlaylistMediaRequest, context: any): Promise<playlist.SortPlaylistMediaResponse> {
  const requestData = mergeRequestData([
    playlist.SortPlaylistMediaRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'SortPlaylistMedia',
    paths: [{ method: 'POST', path: `/luna/me/playlist/media/sort` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function SortPlaylistTracks(caller: IRequestCaller, req: playlist.SortPlaylistTracksRequest, context: any): Promise<playlist.SortPlaylistTracksResponse> {
  const requestData = mergeRequestData([
    playlist.SortPlaylistTracksRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'SortPlaylistTracks',
    paths: [{ method: 'POST', path: `/luna/me/playlist/track/sort` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function SsoToken(caller: IRequestCaller, req: sso.SsoTokenRequest, context: any): Promise<sso.SsoTokenResponse> {
  const requestData = mergeRequestData([
    sso.SsoTokenRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'SsoToken',
    paths: [{ method: 'GET', path: `/luna/sso/token` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function SubmitGamePlay(caller: IRequestCaller, req: game_play.SubmitGamePlayRequest, context: any): Promise<game_play.SubmitGamePlayResponse> {
  const requestData = mergeRequestData([
    game_play.SubmitGamePlayRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'SubmitGamePlay',
    paths: [{ method: 'POST', path: `/luna/game_play/submit` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function Sug(caller: IRequestCaller, req: search.SugRequest, context: any): Promise<search.SugResponse> {
  const requestData = mergeRequestData([
    search.SugRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'Sug',
    paths: [{ method: 'GET', path: `/luna/sug` }, { method: 'GET', path: `/luna/pc/sug` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function SuggestWords(caller: IRequestCaller, req: search.SuggestWordsRequest, context: any): Promise<search.SuggestWordsResponse> {
  const requestData = mergeRequestData([
    search.SuggestWordsRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'SuggestWords',
    paths: [{ method: 'GET', path: `/luna/suggest-words/${requestData.params.suggest_type}` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function TLBFeedFallback(caller: IRequestCaller, request: feed.TLBFeedFallbackRequest, context: any): Promise<feed.TLBFeedFallbackResponse> {
  const requestData = mergeRequestData([
    feed.TLBFeedFallbackRequestToRequestData(request)
  ])
  const response = await caller({
    context,
    name: 'TLBFeedFallback',
    paths: [{ method: 'POST', path: `/luna/feed/tlb-fallback` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function TrackDisLike(caller: IRequestCaller, req: media.TrackDisLikeRequest, context: any): Promise<media.TrackDisLikeResponse> {
  const requestData = mergeRequestData([
    media.TrackDisLikeRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'TrackDisLike',
    paths: [{ method: 'POST', path: `/luna/track/dislike` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function UnfollowUser(caller: IRequestCaller, req: me.UnfollowUserRequest, context: any): Promise<me.UnfollowUserResponse> {
  const requestData = mergeRequestData([
    me.UnfollowUserRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'UnfollowUser',
    paths: [{ method: 'POST', path: `/luna/me/unfollow` }, { method: 'POST', path: `/luna/pc/me/unfollow` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function UnreadMsg(caller: IRequestCaller, req: message.UnreadMsgRequest, context: any): Promise<message.UnreadMsgResponse> {
  const requestData = mergeRequestData([
    message.UnreadMsgRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'UnreadMsg',
    paths: [{ method: 'GET', path: `/luna/notification/unread` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function UpdateMyInfo(caller: IRequestCaller, req: me.UpdateMyInfoRequest, context: any): Promise<me.UpdateMyInfoResponse> {
  const requestData = mergeRequestData([
    me.UpdateMyInfoRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'UpdateMyInfo',
    paths: [{ method: 'POST', path: `/luna/me` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function UpdatePlaylistInfo(caller: IRequestCaller, req: playlist.UpdatePlaylistInfoRequest, context: any): Promise<playlist.UpdatePlaylistInfoResponse> {
  const requestData = mergeRequestData([
    playlist.UpdatePlaylistInfoRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'UpdatePlaylistInfo',
    paths: [{ method: 'POST', path: `/luna/me/playlist/update` }, { method: 'POST', path: `/luna/pc/me/playlist/update` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function UpdatePlaylistSortType(caller: IRequestCaller, req: playlist.UpdatePlaylistSortTypeRequest, context: any): Promise<playlist.UpdatePlaylistSortTypeResponse> {
  const requestData = mergeRequestData([
    playlist.UpdatePlaylistSortTypeRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'UpdatePlaylistSortType',
    paths: [{ method: 'POST', path: `/luna/me/playlist/update_sort` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
