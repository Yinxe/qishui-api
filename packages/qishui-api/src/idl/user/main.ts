// @ts-nocheck
/* eslint-disable */
import { IRequestPayload, IRequestData, IRequestCaller, IRequest, mergeRequestData, isNil, fieldsAssign } from '../_common.js'
import * as common from './entity/common.js'
import * as evaluation from './contract/evaluation.js'
import * as me from './contract/me.js'
import * as resource from './contract/resource.js'
import * as school from './contract/school.js'

export const AbroadType_Abroad: number = 2
export const AbroadType_Normal: number = 0
// User
export async function GetEvaluation(caller: IRequestCaller, req: evaluation.GetEvaluationRequest, context: any): Promise<evaluation.GetEvaluationResponse> {
  const requestData = mergeRequestData([
    evaluation.GetEvaluationRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetEvaluation',
    paths: [{ method: 'GET', path: `/luna/user/evaluation` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetLunaUserSettings(caller: IRequestCaller, req: me.GetLunaUserSettingsRequest, context: any): Promise<me.GetLunaUserSettingsResponse> {
  const requestData = mergeRequestData([
    me.GetLunaUserSettingsRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetLunaUserSettings',
    paths: [{ method: 'GET', path: `/luna/user/settings` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetResource(caller: IRequestCaller, req: resource.GetResourceRequest, context: any): Promise<resource.GetResourceResponse> {
  const requestData = mergeRequestData([
    resource.GetResourceRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetResource',
    paths: [{ method: 'GET', path: `/luna/user/resource` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetSchoolCollegeList(caller: IRequestCaller, req: school.GetSchoolCollegeListRequest, context: any): Promise<school.GetSchoolCollegeListResponse> {
  const requestData = mergeRequestData([
    school.GetSchoolCollegeListRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetSchoolCollegeList',
    paths: [{ method: 'GET', path: `/luna/user/me/school/colleges` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetSchoolList(caller: IRequestCaller, req: school.GetSchoolListRequest, context: any): Promise<school.GetSchoolListResponse> {
  const requestData = mergeRequestData([
    school.GetSchoolListRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetSchoolList',
    paths: [{ method: 'GET', path: `/luna/user/me/school/list` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function GetSchoolNearest(caller: IRequestCaller, req: school.GetSchoolNearestRequest, context: any): Promise<school.GetSchoolNearestResponse> {
  const requestData = mergeRequestData([
    school.GetSchoolNearestRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'GetSchoolNearest',
    paths: [{ method: 'GET', path: `/luna/user/me/school/nearest` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function SearchSchool(caller: IRequestCaller, req: school.SearchRequest, context: any): Promise<school.SearchResponse> {
  const requestData = mergeRequestData([
    school.SearchRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'SearchSchool',
    paths: [{ method: 'GET', path: `/luna/user/me/school/search` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function SubmitEvaluateResults(caller: IRequestCaller, req: evaluation.SubmitEvaluateResultsRequest, context: any): Promise<evaluation.SubmitEvaluateResultsResponse> {
  const requestData = mergeRequestData([
    evaluation.SubmitEvaluateResultsRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'SubmitEvaluateResults',
    paths: [{ method: 'POST', path: `/luna/user/evaluation/submit` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function UpdateLunaUserSettings(caller: IRequestCaller, req: me.UpdateLunaUserSettingsRequest, context: any): Promise<me.UpdateLunaUserSettingsResponse> {
  const requestData = mergeRequestData([
    me.UpdateLunaUserSettingsRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'UpdateLunaUserSettings',
    paths: [{ method: 'POST', path: `/luna/user/settings` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export async function UpdateMyPrivacySetting(caller: IRequestCaller, req: me.UpdatePrivacySettingRequest, context: any): Promise<me.UpdatePrivacySettingResponse> {
  const requestData = mergeRequestData([
    me.UpdatePrivacySettingRequestToRequestData(req)
  ])
  const response = await caller({
    context,
    name: 'UpdateMyPrivacySetting',
    paths: [{ method: 'POST', path: `/luna/user/me/privacy/setting` }, { method: 'POST', path: `/luna/pc/user/me/privacy/setting` }, ],
    query: requestData.query,
    body: requestData.body,
  })
  return response
}
export type AbroadType = number
