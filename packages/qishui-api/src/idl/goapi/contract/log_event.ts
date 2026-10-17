// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../../_common.js'
import * as general from './general.js'
import * as log_event from '../entity/log_event.js'

export const EventKeyDIDReverseProbe: string = 'did_reverse_probe'
export const EventKeyPrivacyPopup: string = 'privacy_popup'
export interface LogEventRequest {
  'event_key': string;
  'details'?: log_event.EventDetails;
}
export function LogEventRequestToRequestData(data: LogEventRequest): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['event_key', 'details', ]),
  }
}
export interface LogEventResponse {
  'status_code'?: number;
  'status_info'?: general.StatusInfo;
}
export function LogEventResponseToRequestData(data: LogEventResponse): IRequestData {
  return {
    params: fieldsAssign(data, []),
    query: fieldsAssign(data, []),
    body: fieldsAssign(data, ['status_code', 'status_info', ]),
  }
}
