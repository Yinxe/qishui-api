/** 接口里图片字段的形态：IDL 中是 entity/common.URLInfo，该模块被类型擦除，这里显式声明用到的部分 */
export interface ImageResource {
  uri?: string
  urls?: string[]
  template?: string
  template_prefix?: string
}

export interface CdnPattern {
  width?: number
  height?: number
  extname?: string
}

export type ImageTemplateType = 'crop-center' | 'resize'

// 逐字复刻 utils/image.ts 的官方 CDN 拼串规则；模板一改就取不到图
function processTemplate(img: ImageResource, pattern?: CdnPattern, type?: ImageTemplateType): string {
  const width = pattern?.width ?? 400
  const height = pattern?.height ?? width ?? 400
  if (type === 'resize') return `${img.template_prefix}-resize:${width}:${height}.${pattern?.extname ?? 'webp'}`
  return `${img.template_prefix}-crop-center:${width}:${height}.${pattern?.extname ?? 'jpg'}`
}

/** 把 URLInfo 拼成可显示的封面/头像地址。getImageUrl(undefined) 返回空串，调用方按 falsy 处理 */
export function getImageUrl(img?: ImageResource, pattern?: CdnPattern, type?: ImageTemplateType): string {
  if (img?.uri) {
    const extname = pattern?.extname ?? 'jpg'
    const width = pattern?.width ?? 400
    const height = pattern?.height ?? width ?? 400
    return `${img.urls?.[0]}${img.uri}~${img.template_prefix ? processTemplate(img, pattern, type ?? 'crop-center') : `c5_${width}x${height}.${extname}`}`
  }
  return img?.urls?.[0] ?? ''
}
