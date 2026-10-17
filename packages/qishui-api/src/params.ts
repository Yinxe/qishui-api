import { createHash } from 'node:crypto'

export const APP_ID = '386088'
export const APP_NAME = 'luna_pc'
export const APP_VERSION = '3.7.0'
export const CHANNEL = 'official'
export const PACKAGE = 'com.soda.music'
export const API_BASE = 'https://api.qishui.com'

/** 设备身份，来自 /service/2/desktop/device_register/ */
export interface DeviceIdentity {
  deviceId: string
  installId: string
  cdid: string
  deviceToken?: string
  ssid?: string
}

export interface CommonParamsInput {
  device: DeviceIdentity
  /** 覆盖默认 UA 片段 */
  channel?: string
  versionName?: string
  appId?: string
  tzName?: string
  osVersion?: string
}

/**
 * 逐字复刻 services/request/request.ts 的 getTTCommonParams()。
 * 注意 version_code 在该客户端里就是版本字符串，不是整数。
 */
export function commonParams(input: CommonParamsInput): Record<string, string> {
  const { device } = input
  return {
    aid: input.appId ?? APP_ID,
    app_name: APP_NAME,
    region: 'cn',
    geo_region: 'cn',
    os_region: 'cn',
    sim_region: '',
    device_id: device.deviceId,
    cdid: '',
    iid: device.installId,
    version_name: input.versionName ?? APP_VERSION,
    version_code: input.versionName ?? APP_VERSION,
    channel: input.channel ?? CHANNEL,
    build_mode: 'master',
    network_carrier: '',
    ac: 'wifi',
    tz_name: input.tzName ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    resolution: '',
    device_platform: 'windows',
    device_type: 'Windows',
    os_version: input.osVersion ?? 'Windows 10 Pro',
    fp: device.deviceId,
  }
}

export function userAgent(version = APP_VERSION, channel = CHANNEL): string {
  return `LunaPC/${version}(${channel})`
}

/** utils/request.ts:setBodyMd5Header —— TTNet rs.29 需要的 body 摘要头 */
export function bodyMd5(body: string): string {
  return createHash('md5').update(body).digest('hex').toUpperCase()
}
