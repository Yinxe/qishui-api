// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'
import * as common from '../entity/common.js'
import * as general from './general.js'

export interface AvatarFrameGuidingCopy {
  'unuse'?: string;
  'inuse'?: string;
}
export function AvatarFrameGuidingCopyToRequestData(data: AvatarFrameGuidingCopy): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['unuse', 'inuse', ]),
  }
}
export interface AvatarFrameResource {
  'resource_id'?: string;
  'url'?: common.URLInfo;
  'guiding_copy'?: AvatarFrameGuidingCopy;
}
export function AvatarFrameResourceToRequestData(data: AvatarFrameResource): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['resource_id', 'url', 'guiding_copy', ]),
  }
}
export interface GetResourceRequest {
}
export function GetResourceRequestToRequestData(data: GetResourceRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, []),
  }
}
export interface GetResourceResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
  'avatar_frame_list'?: AvatarFrameResource[];
}
export function GetResourceResponseToRequestData(data: GetResourceResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', 'avatar_frame_list', ]),
  }
}
