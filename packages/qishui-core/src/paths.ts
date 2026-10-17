import os from 'node:os'
import path from 'node:path'

/**
 * core 的专属数据目录，默认 `~/.qishui`（可用 `QISHUI_HOME` 或 `createQishui({dataDir})` 覆盖）。
 *
 * ```
 * <root>/
 * ├── config.json                 偏好（可手改；不存在就用默认值）
 * ├── session.json                设备身份 + 登录 cookie（0600，别外传）
 * ├── cache/
 * │   ├── entities/<kind>/<id>.json   元数据缓存（带 TTL，LRU 按文件 mtime）
 * │   └── tracks/<trackId>/
 * │       ├── meta.json              曲目元数据 + 文件清单 + 来源信息
 * │       ├── audio.m4a             音频本体（下载中为 .part）
 * │       ├── lyrics.json           KRC 结构化歌词
 * │       └── cover.jpg             封面
 * ├── journal/plays.jsonl         本地播放历史（append-only，一行一次）
 * └── logs/                       预留（core 默认只往 stdout/logger 打）
 * ```
 */
export interface CorePaths {
  root: string
  configFile: string
  sessionFile: string
  cacheDir: string
  entityDir: string
  mediaDir: string
  journalDir: string
  playsFile: string
  logsDir: string
  /** 单曲媒体目录 */
  trackDir(trackId: string): string
  /** 元数据缓存文件 */
  entityFile(kind: string, id: string): string
}

/** id 直接当目录名用，只有数字/字母的正常 id 不会被改；带分隔符的走转义 */
export function safeSegment(value: string): string {
  return value.replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 120)
}

export function defaultDataDir(): string {
  return process.env.QISHUI_HOME?.trim() || path.join(os.homedir(), '.qishui')
}

export function resolvePaths(dataDir?: string): CorePaths {
  const root = path.resolve(dataDir?.trim() || defaultDataDir())
  const cacheDir = path.join(root, 'cache')
  const entityDir = path.join(cacheDir, 'entities')
  const mediaDir = path.join(cacheDir, 'tracks')
  const journalDir = path.join(root, 'journal')
  return {
    root,
    configFile: path.join(root, 'config.json'),
    sessionFile: path.join(root, 'session.json'),
    cacheDir,
    entityDir,
    mediaDir,
    journalDir,
    playsFile: path.join(journalDir, 'plays.jsonl'),
    logsDir: path.join(root, 'logs'),
    trackDir: (trackId: string) => path.join(mediaDir, safeSegment(trackId)),
    entityFile: (kind: string, id: string) => path.join(entityDir, safeSegment(kind), `${safeSegment(id)}.json`),
  }
}
