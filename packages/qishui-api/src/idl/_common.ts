// @ts-nocheck
/* eslint-disable */
export interface IRequestPath {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS',
  path: string,
}

export interface IRequestPayload {
  context: any,
  name: string,
  paths: IRequestPath[],
  query: any,
  body: any
}

export interface IRequestData {
  params: any,
  query: any,
  body: any
}

export function mergeRequestData(data: IRequestData[]): IRequestData {
  return {
    params: Object.assign({}, ...data.map(d => d.params)),
    query: Object.assign({}, ...data.map(d => d.query)),
    body: Object.assign({}, ...data.map(d => d.body)),
  }
}

export function isNil(item: any) {
  return item === undefined || item === null;
}

export function fieldsAssign(src: any, fields: ([string, string]|string)[]) {
  const dst = {};
  for (const key of fields) {
    if (Array.isArray(key)) {
      const [dstKey, srcKey] = key;
      if (!isNil(src[srcKey])) {
        dst[dstKey] = src[srcKey];
      }
    } else {
      if (!isNil(src[key])) {
        dst[key] = src[key];
      }
    }
  }
  return dst;
}

export interface IRequestCaller {
  (request: IRequestPayload): Promise<any>;
}
export interface IRequest<Request, Response> {
  (caller: IRequestCaller, request: Request, context: any): Promise<Response>;
}
