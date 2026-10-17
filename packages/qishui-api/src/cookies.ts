export type CookieMap = Record<string, string>

/** 只按 name 存，域固定 .qishui.com —— 本库只打 api.qishui.com 一个站点 */
export class CookieJar {
  private map = new Map<string, string>()

  constructor(initial: CookieMap = {}) {
    for (const [k, v] of Object.entries(initial)) this.map.set(k, v)
  }

  absorb(setCookie: string[]): void {
    for (const raw of setCookie) {
      const idx = raw.indexOf('=')
      if (idx < 0) continue
      const name = raw.slice(0, idx).trim()
      const value = raw
        .slice(idx + 1)
        .split(';')[0]
        .trim()
      if (value === '' || /max-age=0/i.test(raw)) this.map.delete(name)
      else this.map.set(name, value)
    }
  }

  set(name: string, value: string): void {
    this.map.set(name, value)
  }

  get(name: string): string | undefined {
    return this.map.get(name)
  }

  toObject(): CookieMap {
    return Object.fromEntries(this.map)
  }

  header(): string | undefined {
    if (this.map.size === 0) return undefined
    return [...this.map].map(([k, v]) => `${k}=${v}`).join('; ')
  }

  /** 登录态判断：客户端用 sessionid / passport_assist_user 一类字段 */
  isLoggedIn(): boolean {
    return Boolean(this.map.get('sessionid') || this.map.get('sid_tt') || this.map.get('passport_assist_user'))
  }
}
