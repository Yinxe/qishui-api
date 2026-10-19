/**
 * 「这份队列是谁的」—— 界面到 core 队列书架之间的那层翻译。
 *
 * 一份**播放队列**按来源分四种（策略在 core 的 `QueueBook` 里，这里只管拼 spec）：
 *  - `recommend` 听歌模式（场景 / 推荐 / 熟悉 / 新鲜）：只往后追加（听过的不删）+ 自动续批，顺序播
 *  - `playlist` 每张歌单一份（本地歌单也算）：整张进队，顺序播，切走再切回来接着上次那一首
 *  - `liked` 我喜欢的音乐 / 本地喜欢：随机
 *  - `temporary` 搜索 / 榜单 / 专辑 / 艺人 / 首页推荐块这些**浏览型结果**：每次点播整队替换
 *
 * 所以列表页的「播放这首」不再是「覆盖播放器队列」，而是「把这首所在的这份队列切到前台」。
 */
import {
  FEED_PREFERENCE_MODES,
  type FeedModeRef,
  type QishuiCore,
  type QueueInfo,
  type QueueKind,
  type TrackData,
} from 'qishui-core'
import { truncate } from './format.js'
import type { ListSource } from './types.js'

export type QueueSpec =
  | { kind: 'recommend'; feed: FeedModeRef; title: string }
  | { kind: 'liked'; id: string; title: string; load: () => Promise<TrackData[]> }
  | { kind: 'playlist'; id: string; title: string; load: () => Promise<TrackData[]> }
  | { kind: 'temporary'; title: string }

/** 队列种类的中文词（书架弹层与播放页头部共用） */
export function queueKindLabel(kind: QueueKind): string {
  switch (kind) {
    case 'recommend':
      return '推荐'
    case 'playlist':
      return '歌单'
    case 'liked':
      return '喜欢'
    case 'temporary':
      return '临时'
  }
}

/** 推荐队列的标题：模式名照实写，认不出的就写 id（不替上游编名字） */
export function recommendTitle(ref: FeedModeRef, sceneText?: string): string {
  if (ref.kind === 'preference') {
    const label = FEED_PREFERENCE_MODES.find((item) => item.mode === ref.mode)?.label ?? ref.mode
    return `推荐 · ${label}`
  }
  return `推荐 · ${sceneText || `场景 ${ref.sceneModeId}`}`
}

/** 一份队列一行的备注：`种类 · N 首 · 第 k 首 · 当前曲目`（推荐队列另标「自动续批」）；书架页与播放页的切换弹层共用 */
export function queueNote(queue: QueueInfo): string {
  const bits = [queueKindLabel(queue.kind), `${queue.count} 首`]
  if (queue.kind === 'liked') bits.push('随机')
  if (queue.refilling) bits.push('自动续批')
  if (queue.count > 0 && queue.index >= 0) bits.push(`第 ${queue.index + 1} 首`)
  if (queue.current) bits.push(truncate(queue.current, 16))
  return bits.join(' · ')
}

const trackData = (tracks: { data: TrackData }[]): TrackData[] => tracks.map((track) => track.data)

/**
 * 列表页 → 队列 spec。歌单与「我喜欢的音乐」是**自己的**队列；其余（搜索/榜单/专辑/艺人/
 * 首页块/最近播放/用户歌单列表…）都是浏览型结果，进临时队列。
 */
export function queueSpecOfSource(core: QishuiCore, source: ListSource, title: string): QueueSpec {
  /** 页标题形如「歌单 · 晴天合集」：队列名自己会带前缀，这里去掉页面的那一段，别叠两层 */
  const bare = title.replace(/^(歌单|本地歌单|榜单|专辑|艺人) · /, '')
  switch (source.kind) {
    case 'playlist':
      return {
        kind: 'playlist',
        id: `playlist:${source.id}`,
        title: `歌单 · ${bare}`,
        load: async () => trackData(await (await core.catalog.playlist(source.id)).allTracks()),
      }
    case 'liked':
      return {
        kind: 'liked',
        id: 'liked',
        title: '我喜欢的音乐',
        load: async () => trackData(await core.library.likedTracks()),
      }
    case 'local-playlist':
      return {
        kind: 'playlist',
        id: `local-playlist:${source.id}`,
        title: `本地歌单 · ${bare}`,
        load: async () => trackData(core.local.playlistTracks(source.id)),
      }
    case 'local-likes':
      return {
        kind: 'liked',
        id: 'local-likes',
        title: '本地喜欢',
        load: async () => trackData(core.local.likes()),
      }
    default:
      // 浏览型结果：标题照页面原样带上（「临时 · 专辑 · 叶惠美」比只留专辑名更清楚）
      return { kind: 'temporary', title: `临时 · ${title}` }
  }
}
