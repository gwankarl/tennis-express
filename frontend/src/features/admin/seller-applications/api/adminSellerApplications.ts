import { apiClient } from '../../../../lib/apiClient'
import type { SellerApplicationStatus } from '../../../seller-applications/types'
import type { AdminApplicationDetails, AdminApplicationListResponse } from '../types'

interface ListResponse {
  success: true
  data: AdminApplicationListResponse
}

interface DetailResponse {
  success: true
  data: AdminApplicationDetails
}

interface MutationResponse {
  success: true
  data: {
    application: AdminApplicationDetails['application']
  }
}

export interface AdminApplicationListQuery {
  status: SellerApplicationStatus
  page: number
  limit: number
}

/** Retrieves one paginated application queue. */
export async function getAdminApplications(
  query: AdminApplicationListQuery,
): Promise<AdminApplicationListResponse> {
  const response = await apiClient.get<ListResponse>('/admin/seller-applications', {
    params: query,
  })

  return response.data.data
}

/** Retrieves full review details for one application. */
export async function getAdminApplication(applicationId: string): Promise<AdminApplicationDetails> {
  const response = await apiClient.get<DetailResponse>(
    `/admin/seller-applications/${encodeURIComponent(applicationId)}`,
  )

  return response.data.data
}

/** Approves a pending application. */
export async function approveAdminApplication(
  applicationId: string,
): Promise<AdminApplicationDetails['application']> {
  const response = await apiClient.patch<MutationResponse>(
    `/admin/seller-applications/${encodeURIComponent(applicationId)}/approve`,
  )

  return response.data.data.application
}

/** Rejects a pending application with the required reason. */
export async function rejectAdminApplication(
  applicationId: string,
  reason: string,
): Promise<AdminApplicationDetails['application']> {
  const response = await apiClient.patch<MutationResponse>(
    `/admin/seller-applications/${encodeURIComponent(applicationId)}/reject`,
    { reason },
  )

  return response.data.data.application
}
