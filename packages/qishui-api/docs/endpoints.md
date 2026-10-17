# 端点清单（自动生成的产物，勿手改）

来源：`recovered/src/idl`（SodaMusic PC v3.7.0 sourcemap）。共 320 个端点。

- `官方`：出现在客户端 `idlMethods` 注册表里，即 App 真实调用的接口。
- `🚫`：播放地址类接口。签名/设备证明在 native 层，本项目只提供类型，不发可播请求。
- `登录`：由 path 前缀静态推断，未逐个实测。

| 端点 | 方法 | 路径 | 官方 | 受限 | 登录 | 必填字段 |
|---|---|---|---|---|---|---|
| AcceptFollow | POST | `/luna/me/follow/accept` |  |  | 登录 | user_id |
| AiAssistantRelated | POST | `/luna/media/assistant/related` |  |  |  | unlimited_flow_info, conversation_id, message_id, agent_session_id, feed_request |
| AIBotChat | POST | `/luna/im/ai_bot/chat` |  |  |  | — |
| AIBotTrigger | POST | `/luna/im/ai_bot/trigger` |  |  |  | — |
| AppendLaterListen | POST | `/luna/me/later-listen/append` |  |  | 登录 | — |
| AppendRecentlyPlayedMedia | POST | `/luna/pc/me/recently-played-media` | ✓ |  | 登录 | — |
| AppendRecentPlayedTracks | POST | `/luna/me/recently-played` |  |  | 登录 | — |
| ApplyFreeVip | POST | `/luna/commerce/v2/apply_free_vip` |  |  | 登录 | — |
| BookAlbum | POST | `/luna/commerce/v2/album/book` |  |  | 登录 | activity_id |
| BoostArtists | POST | `/luna/boost/artists` |  |  |  | — |
| CancelAccount | GET | `/luna/me/cancel` |  |  | 登录 | — |
| CancelBlockUser | DELETE | `/luna/me/block` |  |  | 登录 | to_user_id |
| CancelBlockV2 | POST | `/luna/pc/me/block_v2/cancel` | ✓ |  | 登录 | — |
| CancelChannelSubs | POST | `/luna/commerce/v2/cancel_channel_subs` |  |  | 登录 | — |
| CancelSubscription | POST | `/luna/commerce/offers/cancel` |  |  | 登录 | — |
| CheckCode | POST | `/luna/commerce/v2/code/check` |  |  | 登录 | code |
| CheckDownload | POST | `/luna/commerce/v2/check_download` |  |  | 登录 | — |
| CheckRedeemCodeFromPhysicalCard | POST | `/luna/commerce/code/check` |  |  | 登录 | code, sign |
| CheckSensitiveWords | GET | `/luna/me/playlist/wordcheck` |  |  | 登录 | content, type |
| CheckTrack | GET | `/luna/track/check` |  |  |  | track_id |
| CheckUpdate | POST | `/luna/check-update` |  |  |  | — |
| CollectAlbums | POST | `/luna/pc/me/collection/album` | ✓ |  | 登录 | — |
| CollectArtists | POST | `/luna/pc/me/collection/artist` | ✓ |  | 登录 | — |
| CollectFlowTracks | POST | `/luna/flow/collection/track` |  |  |  | — |
| CollectMediaList | POST | `/luna/pc/me/collection/media` | ✓ |  | 登录 | scene, collect_action |
| CollectPlaylists | POST | `/luna/pc/me/collection/playlist` | ✓ |  | 登录 | — |
| CollectTracks | POST | `/luna/me/collection/track` | ✓ |  | 登录 | — |
| CommentAction | POST | `/luna/pc/comments/action` | ✓ |  |  | comment_id, reply_id, group_id, type, scene_name |
| CommentAudioAsr | GET | `/luna/comment/audio_asr` |  |  |  | comment_id |
| PrepayQuery | POST | `/luna/commerce/v2/prepay_query` |  |  | 登录 | cj_sdk_version |
| RedeemCode | POST | `/luna/commerce/v2/code/redeem` |  |  | 登录 | code |
| ReportAction | POST | `/luna/commerce/v2/report_action` |  |  | 登录 | — |
| PrepayQuery | POST | `/luna/commerce/offers/prepay_query` |  |  | 登录 | prepay_query_offers |
| RedeemCode | POST | `/luna/commerce/code/redeem` |  |  | 登录 | code, sign |
| ReportAction | POST | `/luna/commerce/action` |  |  | 登录 | — |
| CommitAudit | POST | `/luna/audit/commit` |  |  |  | — |
| CommitBlockUser | POST | `/luna/me/block` |  |  | 登录 | to_user_id |
| CommitBlockV2 | POST | `/luna/pc/me/block_v2` | ✓ |  | 登录 | — |
| ConfirmBannerTest | POST | `/luna/activities/confirm` |  |  |  | activity_id |
| ConnPlugs | POST | `/luna/plug/conn_plugs` |  |  |  | — |
| ConsumeBenefit | POST | `/luna/commerce/v2/consume_benefit` |  |  | 登录 | — |
| CreateAnniversaryPlaylist2024 | POST | `/luna/summary-2024/playlist/create` |  |  |  | — |
| CreateAnniversaryPlaylist2025 | POST | `/luna/summary-2025/playlist/create` |  |  |  | — |
| CreateComment | POST | `/luna/pc/comments/create` | ✓ |  |  | — |
| CreatePlaylist | POST | `/luna/pc/me/playlist` | ✓ |  | 登录 | name |
| CreateRoom | POST | `/luna/social/mate/room/create` |  |  |  | room_type |
| CreateSummary2023Video | POST | `/luna/summary2023/create_video` |  |  |  | track_id, video_type, audio_type |
| DeleteCollectedFlowTracks | POST | `/luna/flow/collection/delete_track` |  |  |  | — |
| DeleteCollectedMediaList | POST | `/luna/pc/me/collection/media/delete` | ✓ |  | 登录 | — |
| DeleteComment | POST | `/luna/pc/comments/delete` | ✓ |  |  | — |
| DeleteMsg | POST | `/luna/notification/delete` |  |  | 登录 | msg_id, msg_type, msg_id, msg_type |
| DeletePlaylistMedia | POST | `/luna/pc/me/playlist/media/delete` | ✓ |  | 登录 | playlist_id |
| DeletePlaylistTracks | POST | `/luna/me/playlist/track/delete` |  |  | 登录 | playlist_id |
| DeleteRecentlyPlayedMedia | POST | `/luna/pc/me/recently-played-media/delete` | ✓ |  | 登录 | — |
| DeleteRecentPlayedTracks | POST | `/luna/me/recently-played/delete` |  |  | 登录 | — |
| DeviceBlockArtist | POST | `/luna/me/device/block/artist` |  |  | 登录 | artist_id, block_type |
| DeviceBlockUser | POST | `/luna/me/device/block` |  |  | 登录 | to_user_id, block_type |
| DeviceRecentUser | GET | `/luna/device/recent-login` |  |  |  | — |
| DiscoverMix | POST | `/luna/pc/discover/mix` | ✓ |  |  | block_type, sub_channel_id |
| DiscoverView | POST | `/luna/pc/discover` | ✓ |  |  | — |
| Dislike | POST | `/luna/dislike` | ✓ |  |  | item_id, dislike_item_type, action_type |
| FeedListenVideo | POST | `/luna/feed/listen-video` |  |  |  | — |
| FeedListenVideoTab | POST | `/luna/feed/listen-video-tab` |  |  |  | — |
| FeedLiveTab | POST | `/luna/feed/live-tab` |  |  |  | — |
| FeedMode | POST | `/luna/pc/feed/mode` | ✓ |  |  | — |
| FeedModeGuidance | POST | `/luna/feed/mode/guidance` |  |  |  | — |
| FeedPlaylistMedia | POST | `/luna/feed/playlist-media` |  |  |  | type, count, server_session_id, feed_session_id |
| FeedPlaylistSquare | POST | `/luna/feed/playlist-square` | ✓ |  |  | category_id |
| FeedRadioTracks | POST | `/luna/pc/feed/radio/tracks` | ✓ |  |  | radio_id |
| FeedSongTab | POST | `/luna/pc/feed/song-tab` | ✓ |  |  | — |
| FeedVideo | POST | `/luna/feed/video` |  |  |  | count |
| FeedVideoPlaylist | POST | `/luna/feed/video_playlist` |  |  |  | — |
| FeedVideoTab | POST | `/luna/feed/video-tab` |  |  |  | — |
| FinishMagicTask | POST | `/luna/magic/finish` |  |  |  | activity_id, task_id |
| FlowGetAlbumDetail | POST | `/luna/flow/album/detail` |  |  |  | album_id, ignore_tracks |
| FlowGetArtistMusic | POST | `/luna/flow/artist/music` |  |  |  | artist_id, sort_type |
| FlowGetChartDetail | POST | `/luna/flow/chart/detail` |  |  |  | artist_id, sort_type |
| FlowGetPlaylistDetail | POST | `/luna/flow/playlist/detail` |  |  |  | playlist_id, cursor, count, playlist_id, cursor, count |
| FlowGetRelatedMedia | POST | `/luna/flow/related/media` |  |  |  | — |
| FlowGetTrackListDetail | POST | `/luna/flow/track/detail` |  |  |  | media_type, media_type |
| FlowRecommend | POST | `/luna/flow/recommend` |  |  |  | channel, count |
| FlowRecommendNotPack | POST | `/luna/flow/recommend/not_pack` |  |  |  | — |
| FlowSearch | POST | `/luna/flow/search/${requestData.params.search_type}` |  |  |  | search_type, q, cursor, search_id, search_method, debug_params, from_search_id, search_scene, q, cursor, search_id, search_method, debug_params, from_search_id, search_scene, count |
| FollowUser | POST | `/luna/pc/me/follow` | ✓ |  | 登录 | user_id |
| GetAcquisition | GET | `/luna/acquisition` |  |  |  | — |
| GetActivityInfo | GET | `/luna/activities` |  |  |  | — |
| GetAlbumDetail | GET | `/luna/pc/albums/${requestData.params.album_id}` | ✓ |  |  | album_id, ignore_tracks |
| GetAlbumPurchasedPage | GET | `/luna/commerce/v2/album/purchased_page` |  |  | 登录 | album_id |
| GetAlbumToPurchasePage | GET | `/luna/commerce/v2/album/purchase_page` |  |  | 登录 | album_id |
| GetArtistCollection | GET | `/luna/me/collection/artist` |  |  | 登录 | cursor, count |
| GetArtistDetail | GET | `/luna/pc/artists/${requestData.params.artist_id}` | ✓ |  |  | artist_id, locate_item_id |
| GetAtList | POST | `/luna/atlist` |  |  |  | cursor, count, type, cursor, count, type |
| GetAudit | GET | `/luna/audit/result` |  |  |  | audit_id, audit_id |
| GetBlockUserList | GET | `/luna/pc/me/block/list` | ✓ |  | 登录 | cursor, count |
| GetBriefUserInfo | GET | `/luna/h5/users/${requestData.params.user_id}` |  |  |  | user_id, sec_uid |
| GetBriefUserInfoV2 | GET | `/luna/user_brief/info` |  |  |  | — |
| GetBytepayPreSignPage | POST | `/luna/commerce/v2/bytepay/pre_sign` |  |  | 登录 | offer_snapshot_id |
| GetCard | POST | `/luna/card` |  |  |  | media_id, media_type |
| GetChartDetail | GET | `/luna/pc/charts/${requestData.params.chart_id}` |  |  |  | chart_id |
| GetComment | GET | `/luna/pc/comment` |  |  |  | — |
| GetCommerceConfig | POST | `/luna/pc/commerce/v2/commerce_config` | ✓ |  | 登录 | — |
| GetCommerceInfo | POST | `/luna/pc/commerce/v2/commerce_info` | ✓ |  | 登录 | — |
| GetDeviceActiveMembership | GET | `/luna/commerce/v2/device_active_membership` |  |  | 登录 | — |
| GetDigitalAlbums | GET | `/luna/pc/me/assets/albums` | ✓ |  | 登录 | — |
| GetEcommerceOrderList | GET | `/luna/commerce/ecommerce/order_list` |  |  | 登录 | — |
| GetEligibleOffers | GET | `/luna/commerce/eligible_offers` |  |  | 登录 | scene |
| GetEvaluation | GET | `/luna/user/evaluation` |  |  |  | evaluation_id |
| GetFeaturedContentDetail | GET | `/luna/featured-content/detail` |  |  |  | featured_content_id |
| GetFeaturedContents | GET | `/luna/featured-content/list` |  |  |  | cursor, count |
| GetFollowerList | GET | `/luna/pc/users/${requestData.params.user_id}/follower` | ✓ |  |  | user_id, cursor, count, scene |
| GetFollowingList | GET | `/luna/pc/users/${requestData.params.user_id}/following` | ✓ |  |  | user_id, cursor, count, scene |
| GetFollowingLive | POST | `/luna/following/live` |  |  |  | — |
| GetFriendLinkTemplate | POST | `/seo_api/friendlink/template/get_template_info` |  |  |  | template_id |
| GetFriendRankings | POST | `/luna/me/friend_rankings` |  |  | 登录 | version, cursor, count |
| GetGamePlayConfig | POST | `/luna/game_play/config` |  |  |  | — |
| GetH5AlbumDetail | GET | `/luna/h5/albums/${requestData.params.album_id}` |  |  |  | album_id, ignore_tracks |
| GetH5ArtistDetail | GET | `/luna/h5/artists/${requestData.params.artist_id}` |  |  |  | artist_id, locate_item_id |
| GetH5FeaturedContentDetail | GET | `/luna/h5/featured-content/detail` |  |  |  | featured_content_id |
| GetH5PlaylistDetail | GET | `/luna/h5/playlist/detail` |  |  |  | playlist_id, cursor, count, session_id, reverse, ab_param, playlist_id, cursor, count, session_id, reverse, ab_param |
| GetH5Track | GET | `/luna/h5/track` |  |  |  | track_id, media_type, track_id, media_type |
| GetH5TrackV2 | GET | `/luna/h5/track_v2` |  |  |  | track_id, media_type, queue_type, track_id, media_type, queue_type |
| GetH5UserMusicWall | POST | `/luna/h5/user/music_wall` |  |  |  | user_id, user_id, sec_uid, ab_param |
| GetH5Video | POST | `/luna/h5/video` |  |  |  | video_id, type, video_id, type |
| GetH5VideoV2 | POST | `/luna/h5/video_v2` |  |  |  | video_id, type, video_id, type |
| GetHashtagDetail | GET | `/luna/hashtag/detail` |  |  |  | hashtag_id, cursor, count, pinned_comment_ids |
| GetInvitationCampaignInfo | GET | `/luna/commerce/vip/invitation` |  |  | 登录 | — |
| GetListenDurationActivityRankings | POST | `/luna/activity/listen_duration/rankings` |  |  |  | — |
| GetListenVideoTabModule | GET | `/luna/feed/listen-video-tab/module` |  |  |  | — |
| GetLiveGuideStream | POST | `/luna/live/guide-stream` |  |  |  | — |
| GetLiveRoom | GET | `/luna/live/room` |  |  |  | room_id |
| GetLocateVideo | GET | `/luna/locate_video` |  |  |  | user_id, locate_item_id, locate_item_cursor, end_cursor |
| GetLunaUGBarInfo | POST | `/luna/ug/bar/info` |  |  |  | item_id, item_id |
| GetLunaUserSettings | GET | `/luna/user/settings` |  |  |  | — |
| GetMagicTasks | GET | `/luna/magic/tasks` |  |  |  | activity_id |
| GetMediaAds | POST | `/luna/media_ads` |  |  |  | — |
| GetMediaMapping | POST | `/luna/media_mapping` |  |  |  | scene |
| GetMediaPlayer | POST | `/luna/pc/media-player` | ✓ | 🚫 |  | vid, media_type, media_id, queue_type, vid, media_type, media_id, queue_type |
| GetMediaStats | GET | `/luna/pc/media-stats` | ✓ |  |  | media_id, media_type, media_id, media_type |
| GetMeTabAutoplay | GET | `/luna/me/autoplay` |  |  | 登录 | — |
| GetMiniAppList | POST | `/luna/mini_app/list` |  |  |  | page, page_size |
| GetMixInfo | GET | `/luna/h5/mix_info` |  |  |  | — |
| GetMorePanel | POST | `/luna/more-panel` |  |  |  | — |
| GetMorePanelResource | POST | `/luna/more-panel/resource` |  |  |  | — |
| GetMsgList | GET | `/luna/notification/list` |  |  | 登录 | cursor |
| GetMusicMateGuidance | POST | `/luna/social/mate/guidance` |  |  |  | scene, scene |
| GetMusicMateHistory | POST | `/luna/social/mate/history` |  |  |  | room_id |
| GetMyAssets | GET | `/luna/commerce/me/assets` |  |  | 登录 | — |
| GetMyBriefInfo | GET | `/luna/h5/me` |  |  | 登录 | — |
| GetMyCollectionVideoList | POST | `/luna/me/collection_video_list` |  |  | 登录 | cursor, count |
| GetMyDownloadEntitlements | POST | `/luna/commerce/me/entitlements/download` |  |  | 登录 | — |
| GetMyFavoriteVideoList | POST | `/luna/me/favorite_video_list` |  |  | 登录 | cursor, count |
| GetMyInfo | GET | `/luna/pc/me` | ✓ |  | 登录 | — |
| GetMyListenStats | POST | `/luna/me/listen_stats` |  |  | 登录 | ab_param, recent_friend_rankings_version |
| GetMyMixedCollections | GET | `/luna/pc/me/collection/mixed` | ✓ |  | 登录 | cursor, count |
| GetMyMusicWall | POST | `/luna/me/music_wall` |  |  | 登录 | ab_param, recent_rankings_version |
| GetMyOrders | GET | `/luna/commerce/v2/my_orders` |  |  | 登录 | — |
| GetMyPlaylists | GET | `/luna/pc/me/playlist` | ✓ |  | 登录 | cursor, count, cursor, count, ab_param |
| GetMyPrivacySetting | GET | `/luna/pc/me/privacy/setting` | ✓ |  | 登录 | — |
| GetMySpecialStats | POST | `/luna/me/special_stats` |  |  | 登录 | — |
| GetMySubscription | GET | `/luna/pc/commerce/me/subscription` | ✓ |  | 登录 | — |
| GetMySummary | GET | `/luna/h5/me/summary` |  |  | 登录 | — |
| GetMySummary2023 | GET | `/luna/h5/summary2023` |  |  |  | — |
| GetMySummary2024 | GET | `/luna/summary-2024` |  |  |  | — |
| GetMySummary2025 | GET | `/luna/summary-2025` |  |  |  | — |
| GetMyVideoList | GET | `/luna/me/video_list` |  |  | 登录 | cursor, count, locate_item_id, reverse, end_cursor, cursor, count, locate_item_id, reverse, end_cursor, ab_param |
| GetOffersTokensForPC | POST | `/luna/pc/commerce/v2/offers/tokens` | ✓ |  | 登录 | offer_snapshot_id, report_param |
| GetOffersTokensStatusForPC | POST | `/luna/pc/commerce/v2/offers/tokens/status` | ✓ |  | 登录 | token |
| GetPlayerInfo | GET | `/luna/player` |  |  |  | media_id, type |
| GetPlayerInfoV2 | GET | `/luna/${requestData.params.id}/player` |  |  |  | id, media_id, type |
| GetPlaylistDetail | GET | `/luna/pc/playlist/detail` | ✓ |  |  | playlist_id, cursor, count, session_id, reverse, ab_param, playlist_id, cursor, count, session_id, reverse, ab_param |
| GetPlaylistFeedMedia | POST | `/luna/playlist/feed/media` |  |  |  | playlist_id, play_mode |
| GetPlaylistRelatedMedia | POST | `/luna/playlist/related_media` |  |  |  | playlist_id, playlist_type |
| GetPlugVisibility | GET | `/luna/plug/visibility/detail` |  |  |  | — |
| GetPreviewMsg | POST | `/luna/h5/preview` |  |  |  | template_id |
| GetPurchaseOfferToken | POST | `/luna/pc/commerce/offers/tokens` | ✓ |  | 登录 | offer_id, report_param |
| GetRecentPlayedMedia | GET | `/luna/pc/me/recently-played-media` | ✓ |  | 登录 | cursor, count, media_type, scene |
| GetRecentPlayedStats | GET | `/luna/me/recently-played-stats` |  |  | 登录 | — |
| GetRecentPlayedTracks | GET | `/luna/me/recently-played` |  |  | 登录 | cursor, count |
| GetRecommendEmoticons | GET | `/luna/emoticons/recommend` |  |  |  | — |
| GetRecommendHashtags | GET | `/luna/hashtag/recommend` |  |  |  | — |
| GetRecommendPlaylist | GET | `/luna/me/playlist/recommend` |  |  | 登录 | — |
| GetRelatedMedia | POST | `/luna/pc/media/related` | ✓ |  |  | — |
| GetRelatedTracks | GET | `/luna/track/related` |  |  |  | — |
| GetReportReason | GET | `/luna/pc/report/reason` | ✓ |  |  | report_type |
| GetResource | GET | `/luna/user/resource` |  |  |  | — |
| GetRoomCommerceInfo | POST | `/luna/commerce/v2/get_room_commerce_info` |  |  | 登录 | room_id |
| GetRoomInfo | POST | `/luna/social/mate/room/info` |  |  |  | room_id, pack_members |
| GetSchoolCollegeList | GET | `/luna/user/me/school/colleges` |  |  | 登录 | school_name |
| GetSchoolList | GET | `/luna/user/me/school/list` |  |  | 登录 | cursor, count |
| GetSchoolNearest | GET | `/luna/user/me/school/nearest` |  |  | 登录 | latitude, longitude, size |
| GetSearchBlock | POST | `/luna/search-block` |  |  |  | — |
| GetSeoTracks | GET | `/luna/h5/seo_track` |  |  |  | track_id |
| GetShareInfo | GET | `/luna/pc/share_info` | ✓ |  |  | item_type, item_id, extra, scene |
| GetSharePostAwemeStatus | GET | `/luna/share/post_aweme/status` |  |  |  | task_id |
| GetShareUserList | POST | `/luna/share/user_list` |  |  |  | count, scene |
| GetSharingItems | GET | `/luna/me/sharing_items` |  |  | 登录 | target_uid, cursor, count |
| GetSummary2023Video | GET | `/luna/summary2023/video` |  |  |  | task_id, task_id |
| GetSummary2024Availability | GET | `/luna/summary-2024/availability` |  |  |  | — |
| GetSummary2025Availability | GET | `/luna/summary-2025/availability` |  |  |  | — |
| GetTrack | GET | `/luna/track` |  |  |  | track_id, media_type, track_id, media_type |
| GetTrackForBell | GET | `/luna/track_for_bell` |  |  |  | track_id, media_type, track_id, media_type |
| GetTrackPlayerInfo | GET | `/luna/track_player` |  |  |  | track_id, type |
| GetTrackV2 | POST | `/luna/pc/track_v2` | ✓ | 🚫 |  | track_id, media_type, queue_type, track_id, media_type, queue_type |
| GetUGTrackInfo | GET | `/luna/ug/track/info` |  |  |  | — |
| GetUploaderInfo | GET | `/luna/pc/video/uploader` | ✓ |  |  | upload_type, scene, sdk_version |
| GetUpsell | GET | `/luna/pc/commerce/v2/upsell` | ✓ |  | 登录 | — |
| GetUpsells | GET | `/luna/commerce/upsells` |  |  | 登录 | — |
| GetUpsellsConfig | GET | `/luna/commerce/upsells_config` |  |  | 登录 | — |
| GetUserArtistCollection | GET | `/luna/user/collection/artist` |  |  |  | user_id, cursor, count |
| GetUserBookingActivityInfo | GET | `/luna/commerce/v2/album/booking/${requestData.params.activity_id}` |  |  | 登录 | activity_id |
| GetUserHashtagComments | GET | `/luna/hashtag/user_comments` |  |  |  | user_id, cursor, count |
| GetUserInfo | GET | `/luna/pc/users/${requestData.params.user_id}` | ✓ |  |  | user_id, user_id, sec_uid |
| GetUserInfoByToken | GET | `/luna/token/user/info` |  |  |  | token |
| GetUserLiveRoom | GET | `/luna/users/live_room` |  |  |  | user_id, lite_pack |
| GetUserMixedCollections | GET | `/luna/pc/user/collection/mixed` | ✓ |  |  | user_id, cursor, count |
| GetUserMixInfo | GET | `/luna/user/mix_info` |  |  |  | user_id, cursor, count |
| GetUserMusicWall | GET | `/luna/users/${requestData.params.user_id}/music_wall` |  |  |  | user_id, user_id, sec_uid, ab_param |
| GetUserPlaylists | GET | `/luna/pc/user/playlist` | ✓ |  |  | user_id, cursor, count, scene, user_id, cursor, count, ab_param, scene |
| GetUserRecentRooms | POST | `/luna/social/mate/room/user_recent` |  |  |  | user_id, room_type, only_active, filter_cross_device |
| GetUserVideoList | GET | `/luna/user/video_list` |  |  |  | user_id, artist_id, cursor, count, locate_item_id, reverse, end_cursor |
| GetVideo | POST | `/luna/video` |  |  |  | video_id, type, video_id, type |
| GetVideoMix | GET | `/luna/video_mix` |  |  |  | mix_id, count, cursor, reverse, mix_id, count, cursor, reverse |
| GetVideoPlaylistDetail | GET | `/luna/video_playlist/detail` |  |  |  | — |
| GetVideoV2 | POST | `/luna/pc/video_v2` | ✓ | 🚫 |  | video_id, type, video_id, type |
| GetVolumeStrategy | POST | `/luna/device/volume` |  |  |  | — |
| ReportAction | POST | `/luna/pc/action` | ✓ |  |  | — |
| ImportPlaylist | POST | `/luna/me/playlist/import` |  |  | 登录 | url |
| IMSend | POST | `/luna/im/send` |  |  |  | scene |
| JoinActivity | POST | `/luna/commerce/v2/join_activity` |  |  | 登录 | — |
| Launch | GET | `/luna/pc/launch` | ✓ |  |  | — |
| LaunchDevice | GET | `/luna/launch/device` |  |  |  | — |
| LightUpArtists | POST | `/luna/artist/light_up` |  |  |  | — |
| LikeUserListenDuration | POST | `/luna/user/listen_duration/like` |  |  |  | action, version |
| ListArtistAlbums | GET | `/luna/pc/artists/${requestData.params.artist_id}/albums` | ✓ |  |  | artist_id, cursor, count |
| ListArtistTracks | GET | `/luna/pc/artists/${requestData.params.artist_id}/tracks` | ✓ |  |  | artist_id, cursor, count, cursor, count |
| ListComments | GET | `/luna/pc/comments` | ✓ |  |  | group_id, cursor, count, group_type |
| ListenVideoReminder | GET | `/luna/listen-video/reminder` |  |  |  | — |
| ListLibraExperiments | GET | `/luna/commerce/experiments` |  |  | 登录 | page_num, page_size |
| ListReplies | GET | `/luna/pc/comments/${requestData.params.comment_id}/replies` | ✓ |  |  | comment_id, cursor, count, group_id, group_type |
| LogEvent | POST | `/luna/log/event` |  |  |  | event_key |
| MAppendPlaylistMedia | POST | `/luna/pc/me/playlist/media/append` | ✓ |  | 登录 | playlist_id |
| MAppendPlaylistTracks | POST | `/luna/me/playlist/track/append` |  |  | 登录 | playlist_id |
| MarkMediaList | POST | `/luna/me/mark/media` |  |  | 登录 | mark_action, scene |
| MarkRead | POST | `/luna/notification/mark_read` |  |  | 登录 | mark_type |
| MCheckMedia | POST | `/luna/pc/mcheck` | ✓ |  |  | — |
| MCheckTrack | POST | `/luna/track/mcheck` |  |  |  | — |
| MDeleteCollectedAlbums | POST | `/luna/pc/me/collection/album/delete` | ✓ |  | 登录 | — |
| MDeleteCollectedArtists | POST | `/luna/pc/me/collection/artist/delete` | ✓ |  | 登录 | — |
| MDeleteCollectedPlaylists | POST | `/luna/pc/me/collection/playlist/delete` | ✓ |  | 登录 | — |
| MDeleteCollectedTracks | POST | `/luna/me/collection/track/delete` | ✓ |  | 登录 | — |
| MDeletePlaylists | POST | `/luna/pc/me/playlist/delete` | ✓ |  | 登录 | — |
| MetabDiscover | POST | `/luna/me/discover` |  |  | 登录 | — |
| MGetMedia | GET | `/luna/media` |  |  |  | scene, scene |
| MGetMediaV2 | GET | `/luna/media_v2` |  |  |  | scene, scene |
| MGetPlaylistImportTasks | POST | `/luna/me/playlist/import_task_info` |  |  | 登录 | — |
| ModifyMyAvatarDecoration | POST | `/luna/me/avatar_decoration/modify` |  |  | 登录 | — |
| PlaylistSearch | POST | `/luna/playlist/search` |  |  |  | query, session_id, playlist_id, query, session_id |
| PlugAction | POST | `/luna/plug/action` |  |  |  | action |
| Purchase | POST | `/luna/commerce/v2/purchase` |  |  | 登录 | scene, offer_snapshot_id |
| PurchaseOffer | POST | `/luna/commerce/offers/purchase` |  |  | 登录 | — |
| PurchaseOfferByToken | POST | `/luna/pc/commerce/offers/tokens/purchase` |  |  | 登录 | token |
| PurchaseOffersByTokensForPC | GET | `/luna/pc/commerce/v2/tokens/purchase` |  |  | 登录 | token, scene |
| PurchaseOffersForH5 | GET | `/luna/h5/commerce/v2/purchase` |  |  | 登录 | offer_snapshot_id, report_params |
| PurchaseProduct | POST | `/luna/commerce/v2/purchase_product` |  |  | 登录 | scene, product_type |
| QueryGamePlayRecord | POST | `/luna/game_play/query_record` |  |  |  | query_type, query_id |
| QueryGiftOrderBrief | POST | `/luna/commerce/v2/gift/order_brief` |  |  | 登录 | gift_token, sender_sec_uid |
| QueryTokenStatus | GET | `/luna/pc/commerce/offers/tokens/status` | ✓ |  | 登录 | token |
| QueryZlink | GET | `/luna/query_zlink` |  |  |  | token |
| ReceiveGift | POST | `/luna/commerce/v2/gift/receive` |  |  | 登录 | — |
| ReceiveVoucher | POST | `/luna/commerce/v2/voucher/receive` |  |  | 登录 | — |
| RedeemAsset | POST | `/luna/commerce/asset/redeem` |  |  | 登录 | asset_order_id, asset_name |
| RedeemFreeVIP | POST | `/luna/commerce/vip/redeem` |  |  | 登录 | — |
| RedeemInvitationCode | POST | `/luna/invitation_code` |  |  |  | invitation_code |
| RefreshInvitationCodeTime | POST | `/luna/invitation/refresh_time` |  |  |  | — |
| RegisterMiniLunaUser | POST | `/luna/register_mini_luna` |  |  |  | — |
| RejectFollow | POST | `/luna/me/follow/reject` |  |  | 登录 | user_id |
| RejectJoin | POST | `/luna/social/mate/room/reject_join` |  |  |  | room_id |
| Report | POST | `/luna/pc/report` | ✓ |  |  | content_id, report_type, report_reason_code |
| ReportDeviceProfile | POST | `/luna/device/report/info` |  |  |  | — |
| ReportFeedInfo | POST | `/luna/feed/report-info` |  |  |  | info_type, content |
| ReportIapAuxiliaryInfo | POST | `/luna/commerce/v2/report_iap_info` |  |  | 登录 | — |
| ReportItemAction | POST | `/luna/item-action` |  |  |  | — |
| ReportPurchaseAction | POST | `/luna/commerce/v2/purchase/report_action` |  |  | 登录 | action_type |
| ReportSample | POST | `/luna/reco_sample` |  |  |  | — |
| ReportSID | POST | `/luna/me/report_special_id` |  |  | 登录 | special_id, report_action |
| Search | GET | `/luna/pc/search/${requestData.params.search_type}` | ✓ |  |  | search_type, q, cursor, search_id, search_method, debug_params, from_search_id, search_scene, q, cursor, search_id, search_method, debug_params, from_search_id, search_scene |
| Search2023 | POST | `/luna/h5/search/${requestData.params.search_type}` |  |  |  | search_type, q, cursor, search_id, search_method, debug_params, from_search_id, search_scene, q, cursor, search_id, search_method, debug_params, from_search_id, search_scene |
| SearchCategories | POST | `/luna/search-categories` |  |  |  | search_type, q, cursor, search_id, search_method, debug_params, from_search_id, search_scene, q, cursor, search_id, search_method, debug_params, from_search_id, search_scene |
| SearchSchool | GET | `/luna/user/me/school/search` |  |  | 登录 | keyword |
| SendGift | POST | `/luna/commerce/v2/gift/send` |  |  | 登录 | order_id, receiver_id |
| SendInvitePush | POST | `/luna/social/mate/room/invite_push` |  |  |  | room_id, from_uid, to_uid, conv_sid, conv_id |
| SetAlbumDefaultCover | POST | `/luna/commerce/v2/album/set_default_cover` |  |  | 登录 | album_id, cover_id |
| SetBoost | POST | `/luna/me/boost` |  |  | 登录 | — |
| SetPlugVisibility | POST | `/luna/plug/visibility/set` |  |  |  | — |
| ShareCodeParse | GET | `/luna/share/code/parse` |  |  |  | token |
| ShareCount | POST | `/luna/pc/count/shared` | ✓ |  |  | — |
| ShareInvitationCode | POST | `/luna/invitation/share` |  |  |  | — |
| SharePostAweme | POST | `/luna/share/post_aweme` |  |  |  | item_type, item_id, share_id |
| Shark | POST | `/luna/shark` |  |  |  | — |
| ShortenZlinkUrl | GET | `/luna/shorten_zlink` |  |  |  | zlink_id, scheme_string |
| SortPlaylistMedia | POST | `/luna/me/playlist/media/sort` |  |  | 登录 | playlist_id |
| SortPlaylistTracks | POST | `/luna/me/playlist/track/sort` |  |  | 登录 | playlist_id |
| SsoToken | GET | `/luna/sso/token` |  |  |  | — |
| SubmitEvaluateResults | POST | `/luna/user/evaluation/submit` |  |  |  | — |
| SubmitGamePlay | POST | `/luna/game_play/submit` |  |  |  | need_resp, game_play_type, feed_mode, start_time_ms, end_time_ms, duration, finish_type, track_play_count |
| Sug | GET | `/luna/pc/sug` | ✓ |  |  | q, sug_scene, sug_search_id |
| SuggestWords | GET | `/luna/suggest-words/${requestData.params.suggest_type}` |  |  |  | suggest_type |
| TLBFeedFallback | POST | `/luna/feed/tlb-fallback` |  |  |  | — |
| TrackDisLike | POST | `/luna/track/dislike` |  |  |  | track_id |
| UnBookAlbum | POST | `/luna/commerce/v2/album/unbook` |  |  | 登录 | activity_id |
| UnfollowUser | POST | `/luna/pc/me/unfollow` | ✓ |  | 登录 | user_id |
| UnreadMsg | GET | `/luna/notification/unread` |  |  | 登录 | group_id |
| UpdateLunaUserSettings | POST | `/luna/user/settings` |  |  |  | — |
| UpdateMyInfo | POST | `/luna/me` |  |  | 登录 | — |
| UpdateMyPrivacySetting | POST | `/luna/pc/user/me/privacy/setting` | ✓ |  | 登录 | — |
| UpdatePlaylistInfo | POST | `/luna/pc/me/playlist/update` | ✓ |  | 登录 | playlist_id |
| UpdatePlaylistSortType | POST | `/luna/me/playlist/update_sort` |  |  | 登录 | playlist_id, sort_type |
| Validate | POST | `/luna/commerce/v2/validate` |  |  | 登录 | order_id |
| ValidatePurchase | POST | `/luna/commerce/offers/validate` |  |  | 登录 | — |
| ValidateReward | POST | `/luna/commerce/validate_reward` |  |  | 登录 | transaction_id |
