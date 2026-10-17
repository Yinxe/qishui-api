import { createHash } from 'node:crypto'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'

export async function ensureDir(dir: string): Promise<void> {
  await fsp.mkdir(dir, { recursive: true })
}

export async function pathExists(file: string): Promise<boolean> {
  try {
    await fsp.stat(file)
    return true
  } catch {
    return false
  }
}

export async function fileSize(file: string): Promise<number | undefined> {
  try {
    const st = await fsp.stat(file)
    return st.isFile() ? st.size : undefined
  } catch {
    return undefined
  }
}

export function readJsonSync<T>(file: string): T | undefined {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')) as T
  } catch {
    return undefined
  }
}

export async function readJson<T>(file: string): Promise<T | undefined> {
  try {
    return JSON.parse(await fsp.readFile(file, 'utf8')) as T
  } catch {
    return undefined
  }
}

/**
 * 先写 `.tmp` 再 rename：进程中途挂掉也不会留下半个 JSON（缓存损坏是本项目最不想看到的故障）。
 * mode 用于 session.json 这类含凭据的文件（0600）。
 */
export async function writeJsonAtomic(file: string, data: unknown, mode?: number): Promise<void> {
  await ensureDir(path.dirname(file))
  const tmp = `${file}.tmp-${process.pid}`
  await fsp.writeFile(tmp, JSON.stringify(data, null, 2), mode ? { mode } : undefined)
  await fsp.rename(tmp, file)
}

export async function appendLine(file: string, line: string): Promise<void> {
  await ensureDir(path.dirname(file))
  await fsp.appendFile(file, line.endsWith('\n') ? line : `${line}\n`)
}

export async function removeQuiet(target: string): Promise<void> {
  await fsp.rm(target, { recursive: true, force: true })
}

export async function hashFile(file: string): Promise<string> {
  const hash = createHash('sha1')
  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(file)
      .on('data', (chunk) => hash.update(chunk))
      .on('error', reject)
      .on('end', () => resolve())
  })
  return hash.digest('hex')
}

export async function dirStats(dir: string): Promise<{ files: number; bytes: number }> {
  let files = 0
  let bytes = 0
  let entries: fs.Dirent[]
  try {
    entries = await fsp.readdir(dir, { withFileTypes: true })
  } catch {
    return { files, bytes }
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      const sub = await dirStats(full)
      files += sub.files
      bytes += sub.bytes
    } else if (entry.isFile()) {
      files++
      bytes += (await fileSize(full)) ?? 0
    }
  }
  return { files, bytes }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** 数值字段在 IDL 里可能是 number 也可能是字符串（duration、count_* 都见过两种） */
export function num(value: unknown): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

export function bool(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined
}

export function str(value: unknown): string | undefined {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  return undefined
}
