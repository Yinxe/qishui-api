/** 字节 CDN 签名地址上的公共解析 */

/** 签名地址形如 `https://<host>/<token>/<过期时刻16进制>/...` */
export function expiresAtOf(url: string): number | undefined {
  const seg = new URL(url).pathname.split('/').filter(Boolean)[1]
  if (!seg || !/^[0-9a-f]{8}$/.test(seg)) return undefined
  const ts = parseInt(seg, 16)
  // 只接受「此刻 ~ 一年后」，避免把路径里的其它 hex 当时间
  const now = Math.floor(Date.now() / 1000)
  return ts >= now - 3600 && ts <= now + 31_536_000 ? ts : undefined
}

export function mimeOf(url: string): string | undefined {
  return new URL(url).searchParams.get('mime_type') ?? undefined
}
