// 面向「做一个音乐 App 需要什么」整理的接口清单。
// 每条 = 分类 + 端点 key + 能拿到什么 + 测试用最小参数（params 由 test/run.ts 注入真实样本 id）。
// 运行：node --experimental-strip-types test/run.ts      （先 pnpm run build）
//
// auth 三档：anon = 匿名可用；login = 必须带会话；gated = 上游对匿名客户端拒答的标记类
// write = 会改账号数据的写接口（有会话时默认不跑，除非 ALLOW_WRITE=1）
//
// `gated` 只是**标记**，不影响调用：库照常发请求，上游怎么答就怎么记（曾经这里抛本库自造的 UnsupportedError，
// 已被推翻 —— 上游才是裁判，本库不代它下结论）。这类接口的「是否与登录态/会员有关」还没验证。

export type AuthLevel = 'anon' | 'login' | 'gated'

export interface Ctx {
  trackId: string
  albumId: string
  artistId: string
  playlistId: string
  userId: string
  commentId: string
  radioId: string
  mixBlockType: string
  chartId: string
  vid: string
  searchId: string
}

export interface Entry {
  /** 分类（也是文档的章节） */
  group: string
  /** 端点 key，直接喂 client.request() */
  name: string
  /** 同名端点不同参数版面的区分标签 */
  label?: string
  auth: AuthLevel
  write?: boolean
  /** 已弃用：不再调用，也不会被实测台发送（理由写进 capability） */
  deprecated?: boolean
  /** 这个接口能拿到什么 —— 文档正文就靠这一行 */
  capability: string
  params: (c: Ctx) => Record<string, unknown>
}

/**
 * 搜索类接口共用的一套参数（PC 官方口径）。
 * 注意两点实测结论：① 不能带 `debug_params`（传 `{}`/`'null'` 都会 `1000004`，不发就正常）；
 * ② 真正可用的是 `/luna/search/<type>`，`/luna/pc/search/<type>` 恒 `200+0字节` —— transport 会按候选 path 自动回退。
 */
const searchParams = (c: Ctx, q = '晴天') => ({
  search_type: 'track',
  q,
  cursor: '0',
  search_id: c.searchId,
  search_method: 'track',
  from_search_id: '',
  search_scene: '',
})

export const CATALOG: Entry[] = [
  // ---------------------------------------------------------------- 启动 / 身份
  {
    group: '启动 / 身份',
    name: 'Launch',
    auth: 'anon',
    capability: '冷启动配置：灰度开关、域名/entry 配置、协议版本。App 第一个要打的接口',
    params: () => ({}),
  },
  {
    group: '启动 / 身份',
    name: 'GetMyInfo',
    auth: 'login',
    capability:
      '「我的」页一次铺满：my_info{28}（id/nickname/douyin_id/头像/signature/gender/age/birthday/location/sec_uid/public_name/is_vip/vip_stage/is_musician/user_artist_type…）+ my_stats{9}（收藏/关注/粉丝/获赞）+ me_tab_sidebar。**顶层键是 my_info，不是 user**',
    params: () => ({}),
  },

  // ---------------------------------------------------------------- 发现 / 推荐
  {
    group: '发现 / 推荐',
    name: 'DiscoverView',
    label: '推荐页版（空 body）',
    auth: 'anon',
    capability: '首页大盘：热歌榜/新歌榜/欧美榜（discover_track_top_list）+ 推荐歌单 + 场景队列，一次 159 个 resources',
    params: () => ({}),
  },
  {
    group: '发现 / 推荐',
    name: 'DiscoverView',
    label: '听歌模式版（sceneMode）',
    auth: 'anon',
    capability: '另一套版面：30 个 discover_radio 场景队列（榜单块不在响应里），官方 sceneMode 用',
    params: () => ({ first_request: true, pc_new_discover_request: true }),
  },
  {
    group: '发现 / 推荐',
    name: 'DiscoverMix',
    auth: 'anon',
    capability: '单个内容块下钻：block_type + sub_channel_id → inner_block 里的曲目/歌单列表',
    params: (c) => ({ block_type: c.mixBlockType, sub_channel_id: c.mixBlockType }),
  },
  {
    group: '发现 / 推荐',
    name: 'FeedMode',
    auth: 'anon',
    capability: 'Feed 模式配置：preference_mode / scene_mode 的枚举与文案（推荐流的路由表）',
    params: () => ({}),
  },
  {
    group: '发现 / 推荐',
    name: 'FeedSongTab',
    auth: 'anon',
    capability: '单曲推荐 tab：5 首曲目（含 album / artists 完整字段），做「随便听听」最省事',
    params: () => ({}),
  },
  {
    group: '发现 / 推荐',
    name: 'FeedPlaylistSquare',
    auth: 'anon',
    capability: '歌单广场：按 category_id 拉的歌单列表（分类歌单页的数据源）',
    params: () => ({ category_id: '' }),
  },
  {
    group: '发现 / 推荐',
    name: 'FeedRadioTracks',
    auth: 'anon',
    capability: '电台曲目流：radio_id（= 场景队列条目里的 inner_block_id）→ 6 首同调性曲目，无限电台的续播来源',
    params: (c) => ({ radio_id: c.radioId }),
  },
  {
    group: '发现 / 推荐',
    name: 'GetFeaturedContents',
    auth: 'anon',
    capability: '精选内容列表（IDL 里有，实测回空 body —— 不可用的推荐位）',
    params: () => ({ cursor: 0, count: 20 }),
  },

  // ---------------------------------------------------------------- 搜索
  {
    group: '搜索',
    name: 'Sug',
    auth: 'anon',
    capability: '搜索联想词：q → sugs 列表（做搜索框下拉；只回词条不回实体）',
    params: () => ({ q: '晴天', sug_scene: 'search_sug', sug_search_id: '' }),
  },
  {
    group: '搜索',
    name: 'SuggestWords',
    auth: 'anon',
    capability: '推荐搜索词：suggest_type=recommendation → 6 条 {keyword, type, group_id(track id)}，可当真实体用',
    params: () => ({ suggest_type: 'recommendation' }),
  },
  {
    group: '搜索',
    name: 'Search',
    auth: 'anon',
    capability:
      '官方搜索（/luna/search/<type>）：q → result_groups[{id,next_cursor,has_more,items}]，分页靠 next_cursor。**匿名可用**（track 一次 ~114KB 完整实体）；search_type 取 SearchCategories 的 7 个值（all/track/video/artist/album/playlist/user）',
    params: (c) => searchParams(c),
  },
  {
    group: '搜索',
    name: 'Search2023',
    auth: 'login',
    deprecated: true,
    capability:
      '【已弃用，不再调用】h5 版搜索（/luna/h5/search）：2023 年的旧 h5 接口，要登录且可能过时，老接口更易被风控。搜索结果一律走 Search（/luna/search）',
    params: (c) => searchParams(c),
  },
  {
    group: '搜索',
    name: 'FlowSearch',
    auth: 'anon',
    capability: 'flow 版搜索：404（search_type 枚举所在模块被类型擦除，路径插值出空串）',
    params: (c) => ({ ...searchParams(c), count: 20 }),
  },
  {
    group: '搜索',
    name: 'SearchCategories',
    auth: 'anon',
    capability: '搜索分类 tab：7 个 {search_type, name}，给搜索页做分类切换（空 body 即可）',
    params: () => ({}),
  },
  {
    group: '搜索',
    name: 'GetSearchBlock',
    auth: 'anon',
    capability: '搜索页聚合块（热搜/热歌榜）。实测 search_chart_block 恒空：那是 h5/移动端的东西',
    params: () => ({}),
  },

  // ---------------------------------------------------------------- 曲目 / 专辑 / 艺人
  {
    group: '曲目 / 专辑 / 艺人',
    name: 'GetAlbumDetail',
    auth: 'anon',
    capability: '专辑详情：标题/封面/艺人/发行信息 + tracks 曲目列表（完整 track 结构）',
    params: (c) => ({ album_id: c.albumId, ignore_tracks: false }),
  },
  {
    group: '曲目 / 专辑 / 艺人',
    name: 'GetArtistDetail',
    auth: 'anon',
    capability: '艺人详情：昵称/头像/简介/关注态 + 热门曲目 + 专辑入口',
    params: (c) => ({ artist_id: c.artistId, locate_item_id: 0 }),
  },
  {
    group: '曲目 / 专辑 / 艺人',
    name: 'ListArtistAlbums',
    auth: 'anon',
    capability: '艺人专辑分页列表（艺人页的「专辑」tab）',
    params: (c) => ({ artist_id: c.artistId, cursor: 0, count: 20 }),
  },
  {
    group: '曲目 / 专辑 / 艺人',
    name: 'ListArtistTracks',
    auth: 'anon',
    capability: '艺人曲目分页列表（艺人页的「歌曲」tab）',
    params: (c) => ({ artist_id: c.artistId, cursor: 0, count: 20 }),
  },
  {
    group: '曲目 / 专辑 / 艺人',
    name: 'GetRelatedMedia',
    auth: 'anon',
    capability:
      '相关推荐：给一首曲目 → 6 首相关曲目（含 album / artists），播放页「相似歌曲」。**必须用 `media_list` 指定曲目**：' +
      '该端点的 IDL 只映射 `media_list`/`artist_ids`/`scene_name`/`media_type`/`req_count`…，写 `media_id` 会被静默丢弃（上游当没指定，回通用推荐；' +
      '2026-10-17 定点复测：`media_id` 版与 `media_list` 版都回 `items[6]`，但条目内容不同）。core 的 `catalog.related()` 另带 `full_media`/`req_count`',
    params: (c) => ({ media_list: [{ id: c.trackId, type: 'track' }] }),
  },

  // ---------------------------------------------------------------- 播放 / 媒体地址
  {
    group: '播放 / 媒体地址',
    name: 'GetShareInfo',
    auth: 'anon',
    capability: '条目分享信息：标题/歌手文案/封面(URLInfo)/可播性 VIP 标记 + share_link —— 拿曲目元数据的主力',
    params: (c) => ({ item_type: 'track', item_id: c.trackId, extra: {}, scene: '' }),
  },
  {
    group: '播放 / 媒体地址',
    name: 'MCheckMedia',
    auth: 'anon',
    capability:
      '批量可播性检查：media_list → 每条的权益判定（VIP/无版权/下架），播放前先问它（**这个端点就是 media_list**，别和 CollectMediaList 的 media 混淆）',
    params: (c) => ({ media_list: [{ id: c.trackId, type: 'track' }] }),
  },
  {
    group: '播放 / 媒体地址',
    name: 'GetMediaStats',
    auth: 'anon',
    capability: '条目统计：收藏数/评论数/分享数（stats）',
    params: (c) => ({ media_id: c.trackId, media_type: 'track' }),
  },
  {
    group: '播放 / 媒体地址',
    name: 'GetTrackV2',
    auth: 'gated',
    capability:
      'goapi 音频地址。匿名实测：每个 path 变体都是 `200+0字节`（pc / 非 pc、GET / POST 全一样）。上游对这类接口会按客户端完整性校验拒答（同类 GetMediaPlayer 的非 pc 变体回 `1000062 应用版本有风险`）。库照发请求、不拦；可播地址走 web 分享页（getShareMedia）。**登录/会员后是否放行未验证**',
    params: (c) => ({ track_id: c.trackId, media_type: 1, queue_type: '' }),
  },
  {
    group: '播放 / 媒体地址',
    name: 'GetMediaPlayer',
    auth: 'gated',
    capability:
      'goapi 播放器。匿名实测：pc 变体 `200+0字节`、非 pc 变体回 `1000062 应用版本有风险`（上游客户端完整性校验，换参数/带 cookie 都不变）。库照发请求、不拦。**带会话/VIP 后未验证**',
    params: (c) => ({ vid: c.vid, media_type: 1, media_id: c.trackId, queue_type: '' }),
  },
  {
    group: '播放 / 媒体地址',
    name: 'GetVideoV2',
    auth: 'gated',
    capability: 'goapi 视频地址。匿名实测同 GetTrackV2：各变体均空响应。库照发请求、不拦。**带会话/VIP 后未验证**',
    params: (c) => ({ video_id: c.trackId, type: 1 }),
  },
  {
    group: '播放 / 媒体地址',
    name: 'MGetMedia',
    auth: 'anon',
    label: '曲目（track）',
    capability:
      '按 id 批量取媒体实体（**匿名可用**）：media[] 里每条的 entity 是完整 DisplayEntity（曲目在 entity.track_wrapper.track：含 album/artists/label_info/url_cover/duration，**但不含播放地址**）——「按 id 批量补曲目详情」就走它，不用再爬分享页 HTML。scene 传 ""/playlist/music_mate_queue 都行',
    params: (c) => ({ scene: 'playlist', media: [{ id: c.trackId, type: 'track' }] }),
  },
  {
    group: '播放 / 媒体地址',
    name: 'MGetMedia',
    auth: 'anon',
    label: '混类型（album/playlist/video 都为 0 条）',
    capability:
      '同端点喂 album/playlist 类型：**回 0 条**（另有探针确认 ugc_video/video 同样 0 条）——只有 track 类型有实体。说明它是「曲目批量详情」专用口，不能当通用多类型入口',
    params: (c) => ({
      scene: 'playlist',
      media: [
        { id: c.trackId, type: 'track' },
        { id: c.albumId, type: 'album' },
        { id: c.playlistId, type: 'playlist' },
      ],
    }),
  },
  {
    group: '播放 / 媒体地址',
    name: 'MGetMediaV2',
    auth: 'gated',
    capability:
      'v2 版（GET `/luna/media_v2`）。匿名实测：`200+0字节`，各 path 变体一样。库照发请求、不拦。**带会话/VIP 后未验证**',
    params: (c) => ({ scene: 'playlist', media: [{ id: c.trackId, type: 'track' }] }),
  },
  {
    group: '播放 / 媒体地址',
    name: 'MCheckTrack',
    auth: 'anon',
    capability:
      '按 track_ids 批量查曲目状态（**匿名可用**）→ `track_status[]`。粒度比 MCheckMedia 细（按 track 维度给权益/上下架判定）',
    params: (c) => ({ track_ids: [c.trackId], scene: 0 }),
  },
  {
    group: '播放 / 媒体地址',
    name: 'GetTrack',
    auth: 'gated',
    capability:
      '单曲信息（非 h5 path `/luna/track`）。匿名实测：`1000062 应用版本有风险`（上游客户端完整性校验）。库照发请求、不拦。**带会话/VIP 后未验证**',
    params: (c) => ({ track_id: c.trackId, media_type: 'track' }),
  },
  {
    group: '播放 / 媒体地址',
    name: 'GetH5Track',
    auth: 'gated',
    capability:
      'h5 path（`/luna/h5/track`）。匿名实测同 GetTrack：`1000062 应用版本有风险`。库照发请求、不拦。**带会话/VIP 后未验证**',
    params: (c) => ({ track_id: c.trackId, media_type: 'track' }),
  },
  {
    group: '播放 / 媒体地址',
    name: 'GetH5TrackV2',
    auth: 'gated',
    capability:
      'h5 v2（`/luna/h5/track_v2`）。匿名实测：`1000062 应用版本有风险`。库照发请求、不拦。**带会话/VIP 后未验证**（这条用 `track.GetTrackV2Request`，比 GetTrack/GetH5Track 多一个必填的 `queue_type`）',
    params: (c) => ({ track_id: c.trackId, media_type: 'track', queue_type: '' }),
  },
  {
    group: '播放 / 媒体地址',
    name: 'GetTrackPlayerInfo',
    auth: 'gated',
    capability:
      '播放器信息（`/luna/track_player`）。匿名实测：`1000062 应用版本有风险`。库照发请求、不拦。**带会话/VIP 后未验证**',
    params: (c) => ({ track_id: c.trackId, type: 'track' }),
  },

  // ---------------------------------------------------------------- 榜单
  {
    group: '榜单',
    name: 'GetChartDetail',
    auth: 'anon',
    capability:
      '榜单详情：chart_id 取 DiscoverView 榜单块的 inner_block_id（不是 "hot_song_chart" 这种常量名，那样回 1000004）→ chart{title,count_tracks,period,release_time,track_ranks[{rank,track}],style{desc…}}',
    params: (c) => ({ chart_id: c.chartId }),
  },

  // ---------------------------------------------------------------- 歌单 / 收藏（读）
  {
    group: '歌单 / 收藏（读）',
    name: 'GetPlaylistDetail',
    auth: 'anon',
    capability:
      '歌单详情：标题(title)/计数(count_tracks)/创建者 + 曲目。**曲目在 `media_resources[{id,type,entity,collect_info,index}]` 里**（不是 tracks/media_list），entity.track_wrapper.track 才是曲目；请求 count=20 实测回 18 条 + has_more=true + next_cursor=20。分享出去的歌单匿名可读',
    params: (c) => ({
      playlist_id: c.playlistId,
      cursor: 0,
      count: 20,
      session_id: '',
      reverse: false,
      ab_param: '',
    }),
  },
  {
    group: '歌单 / 收藏（读）',
    name: 'GetUserPlaylists',
    auth: 'anon',
    capability: '某用户的公开歌单列表（看别人的主页用）',
    params: (c) => ({ user_id: c.userId, cursor: 0, count: 20, scene: '', ab_param: '' }),
  },
  {
    group: '歌单 / 收藏（读）',
    name: 'GetUserMixedCollections',
    auth: 'anon',
    capability: '某用户收藏的歌单/专辑混排（注意：**不含**喜欢的曲目）',
    params: (c) => ({ user_id: c.userId, cursor: 0, count: 20 }),
  },
  {
    group: '歌单 / 收藏（读）',
    name: 'GetMyPlaylists',
    auth: 'login',
    capability:
      '我的歌单（已验 playlists[]）：含「我喜欢的音乐」(type=1)、「抖音收藏的音乐」(type=4) —— 取收藏曲目的唯一入口；条目带 title/count_tracks/url_cover/stats/type/from_feed/owner/all_sort_types',
    params: () => ({ cursor: 0, count: 20, ab_param: '' }),
  },
  {
    group: '歌单 / 收藏（读）',
    name: 'GetMyMixedCollections',
    auth: 'login',
    capability:
      '我的收藏混排：只装「收藏的歌单/专辑」，没有收藏的曲目（曲目在自建歌单里）。已验：不再被拦，status_code=0 —— 该账号没数据所以是空的',
    params: () => ({ cursor: 0, count: 20 }),
  },
  {
    group: '歌单 / 收藏（读）',
    name: 'GetRecentPlayedMedia',
    auth: 'login',
    capability: '最近播放列表（播放页/历史页数据源）。响应键是 media 不是 items；新登录账号没有播放记录 → 已验为空',
    params: () => ({ cursor: 0, count: 20, media_type: 1, scene: '' }),
  },
  {
    group: '歌单 / 收藏（读）',
    name: 'GetDigitalAlbums',
    auth: 'login',
    capability: '我购买/拥有的数字专辑。已验：不再被拦，status_code=0 —— 该账号没买过所以是空的',
    params: () => ({}),
  },

  // ---------------------------------------------------------------- 歌单 / 收藏（写）
  {
    group: '歌单 / 收藏（写）',
    name: 'CreatePlaylist',
    auth: 'login',
    write: true,
    capability: '建歌单（name；type=2 私有单）→ 返回新歌单 id',
    params: () => ({ name: 'qishui-api 测试单' }),
  },
  {
    group: '歌单 / 收藏（写）',
    name: 'UpdatePlaylistInfo',
    auth: 'login',
    write: true,
    capability: '改歌单信息（标题/简介/封面/可见性）',
    params: (c) => ({ playlist_id: c.playlistId, name: 'qishui-api 测试单' }),
  },
  {
    group: '歌单 / 收藏（写）',
    name: 'MAppendPlaylistMedia',
    auth: 'login',
    write: true,
    capability: '往歌单加歌：media: [{ id, type: "track" }]，count_tracks 随之 +1',
    params: (c) => ({ playlist_id: c.playlistId, media: [{ id: c.trackId, type: 'track' }] }),
  },
  {
    group: '歌单 / 收藏（写）',
    name: 'DeletePlaylistMedia',
    auth: 'login',
    write: true,
    capability: '从歌单移除曲目（playlist_id + 媒体列表）',
    params: (c) => ({ playlist_id: c.playlistId, media: [{ id: c.trackId, type: 'track' }] }),
  },
  {
    group: '歌单 / 收藏（写）',
    name: 'MDeletePlaylists',
    auth: 'login',
    write: true,
    capability: '批量删歌单：响应**没有 status_code**，成功标志是 deleted_playlists 里带上该 id',
    params: (c) => ({ playlist_ids: [c.playlistId] }),
  },
  {
    group: '歌单 / 收藏（写）',
    name: 'CollectTracks',
    auth: 'login',
    write: true,
    capability: '收藏曲目（「喜欢」按钮）',
    params: (c) => ({ track_ids: [c.trackId] }),
  },
  {
    group: '歌单 / 收藏（写）',
    name: 'MDeleteCollectedTracks',
    auth: 'login',
    write: true,
    capability: '取消收藏曲目',
    params: (c) => ({ track_ids: [c.trackId] }),
  },
  {
    group: '歌单 / 收藏（写）',
    name: 'CollectAlbums',
    auth: 'login',
    write: true,
    capability: '收藏专辑',
    params: (c) => ({ album_ids: [c.albumId] }),
  },
  {
    group: '歌单 / 收藏（写）',
    name: 'MDeleteCollectedAlbums',
    auth: 'login',
    write: true,
    capability: '取消收藏专辑',
    params: (c) => ({ album_ids: [c.albumId] }),
  },
  {
    group: '歌单 / 收藏（写）',
    name: 'CollectArtists',
    auth: 'login',
    write: true,
    capability: '关注艺人（收藏歌手）',
    params: (c) => ({ artist_ids: [c.artistId] }),
  },
  {
    group: '歌单 / 收藏（写）',
    name: 'MDeleteCollectedArtists',
    auth: 'login',
    write: true,
    capability: '取消关注的艺人',
    params: (c) => ({ artist_ids: [c.artistId] }),
  },
  {
    group: '歌单 / 收藏（写）',
    name: 'CollectPlaylists',
    auth: 'login',
    write: true,
    capability: '收藏（订阅）歌单',
    params: (c) => ({ playlist_ids: [c.playlistId] }),
  },
  {
    group: '歌单 / 收藏（写）',
    name: 'MDeleteCollectedPlaylists',
    auth: 'login',
    write: true,
    capability: '取消收藏歌单',
    params: (c) => ({ playlist_ids: [c.playlistId] }),
  },
  {
    group: '歌单 / 收藏（写）',
    name: 'CollectMediaList',
    auth: 'login',
    write: true,
    capability: '批量收藏（scene + collect_action 指定场景与动作）',
    params: (c) => ({ scene: 'track', collect_action: 1, media: [{ id: c.trackId, type: 'track' }] }),
  },
  {
    group: '歌单 / 收藏（写）',
    name: 'DeleteCollectedMediaList',
    auth: 'login',
    write: true,
    capability:
      '批量取消收藏。**参数是 `media[]`**（不是 `scene`+`media`：`CollectMediaList` 的 `scene` 在这个端点不存在，会被 IDL 静默丢弃）',
    params: (c) => ({ media: [{ id: c.trackId, type: 'track' }] }),
  },
  {
    group: '歌单 / 收藏（写）',
    name: 'AppendRecentlyPlayedMedia',
    auth: 'login',
    write: true,
    capability: '上报播放（写进最近播放）',
    params: (c) => ({ media: [{ id: c.trackId, type: 'track' }] }),
  },
  {
    group: '歌单 / 收藏（写）',
    name: 'DeleteRecentlyPlayedMedia',
    auth: 'login',
    write: true,
    capability: '清空/删除最近播放',
    params: (c) => ({ media: [{ id: c.trackId, type: 'track' }] }),
  },

  // ---------------------------------------------------------------- 用户 / 社交
  {
    group: '用户 / 社交',
    name: 'GetUserInfo',
    auth: 'anon',
    capability:
      '用户资料：昵称/头像/签名/关注粉丝数（别人的主页）。**风控敏感**：连打两次就被 captcha 拦（带会话也一样），降频重试',
    params: (c) => ({ user_id: c.userId, sec_uid: '' }),
  },
  {
    group: '用户 / 社交',
    name: 'GetFollowerList',
    auth: 'anon',
    capability: '粉丝列表（分页）',
    params: (c) => ({ user_id: c.userId, cursor: 0, count: 20, scene: '' }),
  },
  {
    group: '用户 / 社交',
    name: 'GetFollowingList',
    auth: 'anon',
    capability: '关注列表（分页）。匿名并发跑容易被风控打标',
    params: (c) => ({ user_id: c.userId, cursor: 0, count: 20, scene: '' }),
  },
  {
    group: '用户 / 社交',
    name: 'FollowUser',
    auth: 'login',
    write: true,
    capability: '关注某人',
    params: (c) => ({ user_id: c.userId }),
  },
  {
    group: '用户 / 社交',
    name: 'UnfollowUser',
    auth: 'login',
    write: true,
    capability: '取消关注',
    params: (c) => ({ user_id: c.userId }),
  },
  {
    group: '用户 / 社交',
    name: 'GetBlockUserList',
    auth: 'login',
    capability:
      '黑名单列表（分页，回 next_cursor）。**必须登录**：匿名回 1000004，带会话正常（已验）——「得登录才有数据」的典型',
    params: () => ({ cursor: 0, count: 20 }),
  },
  {
    group: '用户 / 社交',
    name: 'CommitBlockV2',
    auth: 'login',
    write: true,
    capability: '拉黑某人：block_items: [{ id, item_type: "user" }]',
    params: (c) => ({ block_items: [{ id: c.userId, item_type: 'user' }] }),
  },
  {
    group: '用户 / 社交',
    name: 'CancelBlockV2',
    auth: 'login',
    write: true,
    capability: '解除拉黑：block_items: [{ id, item_type: "user" }]',
    params: (c) => ({ block_items: [{ id: c.userId, item_type: 'user' }] }),
  },
  {
    group: '用户 / 社交',
    name: 'GetUploaderInfo',
    auth: 'login',
    capability:
      '上传者信息 / **imagex 直传凭据**（已验，须登录）：uploader_info{image_host, service_id, security_token{access_key_id, secret_access_key, session_token, expired_time, space_name}}。security_token 是敏感凭据，别落盘别打日志',
    params: () => ({ upload_type: 1, scene: '', sdk_version: '' }),
  },

  // ---------------------------------------------------------------- 评论
  {
    group: '评论',
    name: 'ListComments',
    auth: 'anon',
    capability: '评论列表：group_id（曲目 id）+ group_type → 一级评论分页',
    params: (c) => ({ group_id: c.trackId, cursor: 0, count: 20, group_type: 1 }),
  },
  {
    group: '评论',
    name: 'ListReplies',
    auth: 'anon',
    capability: '评论的回复列表',
    params: (c) => ({ comment_id: c.commentId, cursor: 0, count: 20, group_id: c.trackId, group_type: 1 }),
  },
  {
    group: '评论',
    name: 'CreateComment',
    auth: 'login',
    write: true,
    capability:
      '发评论。**group_type 必须 0(Track)**（用 1 回 status_code=5）；曲目评论区关着时回 3056，换一首就能发（实测通过）',
    params: (c) => ({ group_id: c.trackId, group_type: 0, text: 'qishui-api 写测', comment_type: 0 }),
  },
  {
    group: '评论',
    name: 'DeleteComment',
    auth: 'login',
    write: true,
    capability: '删自己的评论（要删自己刚发的那条，别拿别人的 commentId）',
    params: (c) => ({ comment_id: c.commentId }),
  },
  {
    group: '评论',
    name: 'CommentAction',
    auth: 'login',
    write: true,
    capability: '评论互动：点赞/踩（comment_id + type）',
    params: (c) => ({ comment_id: c.commentId, reply_id: '', group_id: c.trackId, type: 1, scene_name: '' }),
  },

  // ---------------------------------------------------------------- 行为上报
  {
    group: '行为上报',
    name: 'ReportAction',
    auth: 'anon',
    capability: '行为埋点上报（播放/曝光），只回 status —— 做统计与推荐反哺用',
    params: () => ({}),
  },
  {
    group: '行为上报',
    name: 'ShareCount',
    auth: 'anon',
    capability:
      '分享计数上报。**曲目要塞进 `items[]`**（顶层 `item_id`/`item_type` 会被 IDL 静默丢弃）；`share.ShareItem` 在 IDL 里是 `any`，' +
      '字段名按 `GetShareInfo` 的 `item_id`/`item_type` 推——2026-10-17 定点复测：空 body 与 `items[]` 两版返回相同（都是空 JSON，无 `status_code`），上游不校验形状',
    params: (c) => ({ items: [{ item_id: c.trackId, item_type: 'track' }] }),
  },
  {
    group: '行为上报',
    name: 'Dislike',
    auth: 'login',
    write: true,
    capability: '「不感兴趣」：item_id + dislike_item_type + action_type',
    params: (c) => ({ item_id: c.trackId, dislike_item_type: 1, action_type: 1 }),
  },
  {
    group: '行为上报',
    name: 'GetReportReason',
    auth: 'login',
    capability:
      '举报原因枚举（举报弹窗的选项列表）。**report_type 是字符串枚举**：`track` 可用（实测 `report_reasons[]` 7 条，`{code:"4001", reason:"色情低俗"}`…）；给数字回 1000004',
    params: () => ({ report_type: 'track' }),
  },
  {
    group: '行为上报',
    name: 'Report',
    auth: 'login',
    write: true,
    capability:
      '提交举报。**参数**：content_id + report_type(字符串，"track") + report_reason_code（取 GetReportReason 的 `code`，如 "4001"）；path 用非 pc 的 `/luna/report`（pc 那条会回 101「你已举报过」）。给数字/占位参数上游直接 500 —— 这才是之前判死的原因',
    params: (c) => ({ content_id: c.trackId, report_type: 'track', report_reason_code: '4001' }),
  },

  // ---------------------------------------------------------------- 设置 / 隐私
  {
    group: '设置 / 隐私',
    name: 'GetMyPrivacySetting',
    auth: 'login',
    capability:
      '隐私设置读（已验）：「设置」页 6 个开关 —— privacy_setting{follow_info_visibility, playlist_album_visibility, sync_video_to_luna, my_favorite_visibility, music_wall_visibility, game_play_stats_visibility}',
    params: () => ({}),
  },
  {
    group: '设置 / 隐私',
    name: 'UpdateMyPrivacySetting',
    auth: 'login',
    write: true,
    capability:
      '隐私设置写。参数是 4 个数值开关：follow_info_visibility / sync_video_to_luna / my_favorite_visibility / music_wall_visibility（写测里用「读到的原值回写」验证通道，不改任何东西）',
    params: () => ({}),
  },

  // ---------------------------------------------------------------- 商业化 / 会员
  {
    group: '商业化 / 会员',
    name: 'GetMySubscription',
    auth: 'login',
    capability: '我的会员状态（订阅类型/到期时间）',
    params: () => ({}),
  },
  {
    group: '商业化 / 会员',
    name: 'GetUpsell',
    auth: 'login',
    capability: '会员售卖位的 upsell 文案/价格（开通会员弹窗）',
    params: () => ({}),
  },
  {
    group: '商业化 / 会员',
    name: 'GetCommerceConfig',
    auth: 'login',
    capability: '商业化配置（支付方式、开关、协议版本）',
    params: () => ({}),
  },
  {
    group: '商业化 / 会员',
    name: 'GetCommerceInfo',
    auth: 'login',
    capability: '商业化信息（商品/价格/权益展示）',
    params: () => ({}),
  },
  {
    group: '商业化 / 会员',
    name: 'GetPurchaseOfferToken',
    auth: 'login',
    write: true,
    capability:
      '下单：拿购买 token（**只取 token，没付款**）。offer_id 取 `GetMySubscription.to_purchase_offers[].offer_id`（实测 "8zbHKdkwHWzPGc21sQjN"），report_param 给字符串 `"{}"` → 回 `token`',
    params: () => ({ offer_id: '', report_param: '{}' }),
  },
  {
    group: '商业化 / 会员',
    name: 'GetOffersTokensForPC',
    auth: 'login',
    write: true,
    capability: 'PC 端下单 token（v2 路径）。offer_snapshot_id + report_param（字符串）→ 回 `token`，实测通过',
    params: () => ({ offer_snapshot_id: '', report_param: '{}' }),
  },
  {
    group: '商业化 / 会员',
    name: 'GetOffersTokensStatusForPC',
    auth: 'login',
    capability: 'PC 端下单状态查询（POST，v2 路径 /commerce/v2/offers/tokens/status）→ 回 `token_status`，实测通过',
    params: () => ({ token: '' }),
  },
  {
    group: '商业化 / 会员',
    name: 'QueryTokenStatus',
    auth: 'login',
    capability:
      '**上游 500**：GET `/luna/pc/commerce/offers/tokens/status`（v1）无论参数都回 HTTP 500；同 token 走 POST 的 v2 `GetOffersTokensStatusForPC` 正常 → 这条路疑似已下线',
    params: () => ({ token: '' }),
  },
]

/** 分类顺序（文档与报告都按这个顺序排） */
export const GROUPS = [
  '启动 / 身份',
  '发现 / 推荐',
  '搜索',
  '曲目 / 专辑 / 艺人',
  '播放 / 媒体地址',
  '榜单',
  '歌单 / 收藏（读）',
  '歌单 / 收藏（写）',
  '用户 / 社交',
  '评论',
  '行为上报',
  '设置 / 隐私',
  '商业化 / 会员',
] as const
