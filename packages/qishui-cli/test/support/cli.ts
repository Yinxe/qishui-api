/**
 * CLI 离线测试台：spawn 构建产物 `dist/cli.js`，数据目录里预置 device.json，
 * 让「不碰上游」的命令（帮助/配置/accounts/缓存命令/seed 过的播放）真正零网络。
 */
import { type SpawnSyncReturns, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

export const CLI = path.resolve(import.meta.dirname, '..', '..', 'dist', 'cli.js')

const MOCK_DEVICE = { deviceId: '9000000000000000001', installId: '9000000000000000002', cdid: 'mock-cdid' }

export interface CliResult extends SpawnSyncReturns<string> {
  json: <T = any>() => T
}

export function makeCliHome(prefix = 'qishui-cli-test-'): string {
  const home = fs.mkdtempSync(path.join('/tmp', prefix))
  fs.writeFileSync(path.join(home, 'device.json'), JSON.stringify({ v: 1, device: MOCK_DEVICE }))
  return home
}

export function rmDir(dir: string): void {
  fs.rmSync(dir, { recursive: true, force: true })
}

export function runCli(
  home: string,
  args: string[],
  opts: { env?: Record<string, string>; timeoutMs?: number } = {},
): CliResult {
  const result = spawnSync(process.execPath, [CLI, '--data-dir', home, ...args], {
    encoding: 'utf8',
    timeout: opts.timeoutMs ?? 30_000,
    env: { ...process.env, ...opts.env, NO_COLOR: '1' },
  }) as CliResult
  result.json = <T>() => JSON.parse(result.stdout) as T
  return result
}

/** 3 秒单声道 WAV（不依赖 ffmpeg），mpv 直接能播 */
export function writeWav(file: string, seconds: number, freq: number): number {
  const rate = 8000
  const samples = Math.floor(rate * seconds)
  const data = Buffer.alloc(samples * 2)
  for (let i = 0; i < samples; i++) {
    data.writeInt16LE(Math.round(Math.sin((2 * Math.PI * freq * i) / rate) * 6000), i * 2)
  }
  const header = Buffer.alloc(44)
  header.write('RIFF', 0)
  header.writeUInt32LE(36 + data.length, 4)
  header.write('WAVE', 8)
  header.write('fmt ', 12)
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20)
  header.writeUInt16LE(1, 22)
  header.writeUInt32LE(rate, 24)
  header.writeUInt32LE(rate * 2, 28)
  header.writeUInt16LE(2, 32)
  header.writeUInt16LE(16, 34)
  header.write('data', 36)
  header.writeUInt32LE(data.length, 40)
  const audio = Buffer.concat([header, data])
  fs.writeFileSync(file, audio)
  return audio.length
}

/**
 * 把一首曲目「当成已经在本地」：实体缓存（catalog.track 零网络）+ 媒体缓存（resolve peek 命中）。
 * 返回 [id, 名称]，直接喂 `play track:<id>`。
 */
export function seedTrack(home: string, id: string, name: string, seconds: number): void {
  const data = {
    id,
    name,
    artists: [{ id: '', name: '测试歌手' }],
    durationMs: seconds * 1000,
  }
  const entityDir = path.join(home, 'cache', 'entities', 'track')
  fs.mkdirSync(entityDir, { recursive: true })
  fs.writeFileSync(
    path.join(entityDir, `${id}.json`),
    JSON.stringify({ v: 1, kind: 'track', id, at: Date.now(), expires: Date.now() + 3_600_000, data }),
  )

  const mediaDir = path.join(home, 'cache', 'tracks', id)
  fs.mkdirSync(mediaDir, { recursive: true })
  const bytes = writeWav(path.join(mediaDir, 'audio.wav'), seconds, 440 + (id.charCodeAt(id.length - 1) % 100))
  const meta = {
    // 必须跟 core 的 `META_VERSION`（media.ts）一致：低于它的命中会被当成「旧版」重拉分享页
    v: 2,
    trackId: id,
    track: data,
    audio: { file: 'audio.wav', mime: 'audio_wav', bytes, fetchedAt: Date.now() },
    fetchedAt: Date.now(),
    accessedAt: Date.now(),
    plays: 0,
  }
  fs.writeFileSync(path.join(mediaDir, 'meta.json'), JSON.stringify(meta, null, 2))
}

export function which(bin: string): boolean {
  return spawnSync('sh', ['-c', `command -v ${bin}`], { stdio: 'ignore' }).status === 0
}
