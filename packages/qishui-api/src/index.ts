export { type RegisterDeviceOptions, registerDevice } from './auth/device.js'
export { assertLoggedIn, type LoginContext, type QrLogin, type QrStatus, startQrLogin } from './auth/qr.js'
export {
  type Client,
  type ClientOptions,
  createClient,
  type DeepPartial,
  type RequestInput,
} from './client.js'
export { CookieJar, type CookieMap } from './cookies.js'
export {
  ENDPOINT_DATA,
  ENDPOINT_NAMES,
  type EndpointDef,
  type EndpointField,
  type EndpointName,
  endpointDef,
  endpointFn,
  type RequestOf,
  type ResponseOf,
} from './endpoints.js'
export {
  ApiError,
  AuthRequiredError,
  QishuiError,
  RiskControlError,
  StatusCode,
  TransportError,
} from './errors.js'
export type { IRequestCaller, IRequestData, IRequestPayload } from './idl/_common.js'
export {
  API_BASE,
  APP_ID,
  APP_NAME,
  APP_VERSION,
  bodyMd5,
  CHANNEL,
  type CommonParamsInput,
  commonParams,
  type DeviceIdentity,
  PACKAGE,
  userAgent,
} from './params.js'
export { createCaller, type TransportOptions } from './transport.js'
export { type CdnPattern, getImageUrl, type ImageResource, type ImageTemplateType } from './web/image.js'
export {
  getShareMeta,
  parseShareLink,
  type ResolveOptions,
  resolveShareLink,
  type ShareItem,
  type ShareKind,
  type ShareMeta,
  type ShareMetaOptions,
  shareLinkToMeta,
  type TrackRef,
} from './web/share.js'
export {
  getShareMedia,
  type ShareLyricSentence,
  type ShareLyrics,
  type ShareLyricWord,
  type ShareMedia,
  type ShareMediaOptions,
} from './web/sharePage.js'
