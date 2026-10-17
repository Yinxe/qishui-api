import os from 'node:os'
import path from 'node:path'

/**
 * core 的专属数据目录，默认 `~/.qishui`（可用 `QISHUI_HOME` 或 `createQishui({dataDir})` 覆盖）。
 *
 * ```
 * <root>/
 * ├── config.json                 偏好（可手改；不存在就用默认值）；activeUid 记激活账号
 * ├── device.json                 设备身份（与账号解耦，全体账号共用一份，避免换号触发新注册）
 * ├── accounts.json               已登录账号索引（0600）
 * ├── accounts/<uid>.json         每个账号一份会话 cookie（0600，别外传）
 * ├── cache/
 * │   ├── entities/<kind>/<id>.json           公共元数据缓存（带 TTL，LRU 按文件 mtime）
 * │   ├── entities/_acct/<uid>/<kind>/<id>.json  账号私有/带我态元数据
 * │   └── tracks/<trackId>/
 * │       ├── meta.json              曲目元数据 + 文件清单 + 来源信息
 * │       ├── audio.m4a             音频本体（下载中为 .part）
 * │       ├── lyrics.json           KRC 结构化歌词
 * │       └── cover.jpg             封面
 * ├── journal/plays.jsonl         未登录/迁移前的播放历史（append-only，一行一次）
 * ├── journal/<uid>/plays.jsonl   各账号的播放历史
 * └── logs/                       预留（core 默认只往 stdout/logger 打）
 * ```
 *
 * 旧版单账号 `session.json` 只作迁移输入（`SessionManager.migrateLegacySession`），迁完改名 `.bak`。
 */
export interface CorePaths {
  root: string
  configFile: string
  /** 旧版单账号会话文件（仅迁移期读取） */
  sessionFile: string
  deviceFile: string
  accountsIndexFile: string
  accountsDir: string
  cacheDir: string
  entityDir: string
  mediaDir: string
  journalDir: string
  playsFile: string
  logsDir: string
  /** 单曲媒体目录 */
  trackDir(trackId: string): string
  /** 元数据缓存文件；scope=uid 时落 `_acct/<uid>/` 子层 */
  entityFile(kind: string, id: string, scope?: string): string
  /** 账号会话文件 */
  accountFile(uid: string): string
  /** 播放历史文件；uid 缺省 = 共享的 legacy 原位 */
  journalFileFor(uid?: string): string
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
  const accountsDir = path.join(root, 'accounts')
  return {
    root,
    configFile: path.join(root, 'config.json'),
    sessionFile: path.join(root, 'session.json'),
    deviceFile: path.join(root, 'device.json'),
    accountsIndexFile: path.join(root, 'accounts.json'),
    accountsDir,
    cacheDir,
    entityDir,
    mediaDir,
    journalDir,
    playsFile: path.join(journalDir, 'plays.jsonl'),
    logsDir: path.join(root, 'logs'),
    trackDir: (trackId: string) => path.join(mediaDir, safeSegment(trackId)),
    entityFile: (kind: string, id: string, scope?: string) =>
      scope
        ? path.join(entityDir, '_acct', safeSegment(scope), safeSegment(kind), `${safeSegment(id)}.json`)
        : path.join(entityDir, safeSegment(kind), `${safeSegment(id)}.json`),
    accountFile: (uid: string) => path.join(accountsDir, `${safeSegment(uid)}.json`),
    journalFileFor: (uid?: string) =>
      uid ? path.join(journalDir, safeSegment(uid), 'plays.jsonl') : path.join(journalDir, 'plays.jsonl'),
  }
}
