import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

/** 每个用例一个独立临时数据目录，跑完删（不碰 ~/.qishui） */
export function makeTempDir(prefix = 'qishui-core-test-'): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix))
}

export function rmDir(dir: string): void {
  fs.rmSync(dir, { recursive: true, force: true })
}

export const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))
