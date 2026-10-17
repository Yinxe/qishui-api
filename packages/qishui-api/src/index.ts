export {
  createClient,
  type Client,
  type ClientOptions,
  type DeepPartial,
  type RequestInput,
} from './client.js'
export { registerDevice, type RegisterDeviceOptions } from './auth/device.js'
export { startQrLogin, assertLoggedIn, type QrLogin, type QrStatus, type LoginContext } from './auth/qr.js'
export { getImageUrl, type ImageResource, type CdnPattern, type ImageTemplateType } from './web/image.js'
export {
  parseShareLink,
  resolveShareLink,
  getShareMeta,
  shareLinkToMeta,
  type ShareItem,
  type ShareKind,
  type ShareMeta,
  type ShareMetaOptions,
  type TrackRef,
  type ResolveOptions,
} from './web/share.js'
export { getShareMedia, type ShareMedia, type ShareMediaOptions, type ShareLyrics, type ShareLyricSentence, type ShareLyricWord } from './web/sharePage.js'
export { CookieJar, type CookieMap } from './cookies.js'
export { createCaller, type TransportOptions } from './transport.js'
export {
  commonParams,
  userAgent,
  bodyMd5,
  API_BASE,
  APP_ID,
  APP_NAME,
  APP_VERSION,
  CHANNEL,
  PACKAGE,
  type DeviceIdentity,
  type CommonParamsInput,
} from './params.js'
export {
  QishuiError,
  TransportError,
  ApiError,
  AuthRequiredError,
  RiskControlError,
  StatusCode,
} from './errors.js'
export {
  ENDPOINT_DATA,
  ENDPOINT_NAMES,
  endpointDef,
  endpointFn,
  type EndpointDef,
  type EndpointField,
  type EndpointName,
  type RequestOf,
  type ResponseOf,
} from './endpoints.js'
export type { IRequestCaller, IRequestPayload, IRequestData } from './idl/_common.js'
