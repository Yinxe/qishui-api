import { QishuiError } from 'qishui-api'

/** core 自己的错误基类，方便上层把「core 的问题」和「上游的问题」分开 catch */
export class CoreError extends QishuiError {}

/** 需要登录才能继续（core 侧的前置检查；上游的 1000016 由 qishui-api 抛 AuthRequiredError） */
export class NotLoggedInError extends CoreError {}

/**
 * 拿不到媒体：分享页没有可播地址（多为版权/VIP 限制）、条目不可用、或文件校验不通过。
 * 注意这不是「接口不可用」——上游给了明确答案，只是这个条目不可播。
 */
export class MediaUnavailableError extends CoreError {}

/** 本地数据目录读写失败（权限、磁盘、JSON 损坏等） */
export class CacheError extends CoreError {}
