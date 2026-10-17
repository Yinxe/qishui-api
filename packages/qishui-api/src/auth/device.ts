import { QishuiError } from '../errors.js'
import { API_BASE, APP_ID, APP_VERSION, CHANNEL, type DeviceIdentity, PACKAGE, userAgent } from '../params.js'

export interface RegisterDeviceOptions {
  baseUrl?: string
  fetchImpl?: typeof fetch
  deviceModel?: string
  osVersion?: string
}

/**
 * 桌面端设备注册：/service/2/desktop/device_register/
 * 纯 HTTP 复现，参数取自官方分发包里对齐出的 header 结构；设备身份是随机 cdid + 服务端下发的 did/iid。
 */
export async function registerDevice(options: RegisterDeviceOptions = {}): Promise<DeviceIdentity> {
  const fetchImpl = options.fetchImpl ?? fetch
  const cdid = crypto.randomUUID()
  const now = Date.now()
  const payload = {
    header: {
      device_id: '',
      install_id: '',
      os: 'Windows',
      device_platform: 'PC',
      sdk_version: '1.0',
      sdk_version_code: 1,
      aid: Number(APP_ID),
      mc: '00:00:00:00:00:00',
      channel: CHANNEL,
      package: PACKAGE,
      language: 'zh-CN',
      app_version: APP_VERSION,
      os_version: options.osVersion ?? 'Windows 10: 10.0',
      device_model: options.deviceModel ?? 'no detected',
      time_zone: 'Asia/Shanghai',
      tz_name: 'Asia/Shanghai',
      tz_offset: 0,
      resolution: 'no detected',
      app_region: 'cn',
      app_language: 'zh-CN',
      display_name: '汽水音乐',
      pc_uuid: cdid,
      pc_serial: '',
    },
    gen_time: now,
    magic_tag: 'ss_app_log',
  }

  const q = new URLSearchParams({
    aid: APP_ID,
    channel: CHANNEL,
    os: 'Windows',
    os_version: options.osVersion ?? 'Windows 10: 10.0',
    device_platform: 'PC',
    app_version: APP_VERSION,
  })
  const res = await fetchImpl(`${options.baseUrl ?? API_BASE}/service/2/desktop/device_register/?${q}`, {
    method: 'POST',
    headers: { 'user-agent': userAgent(), 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const json: any = await res.json().catch(() => null)
  if (!json?.device_id_str)
    throw new QishuiError(`device_register 失败: HTTP ${res.status} ${JSON.stringify(json)?.slice(0, 200)}`)
  return {
    deviceId: String(json.device_id_str),
    installId: String(json.install_id_str ?? ''),
    cdid,
    deviceToken: json.device_token,
    ssid: json.ssid,
  }
}
