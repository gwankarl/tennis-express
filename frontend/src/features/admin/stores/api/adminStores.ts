import { apiClient } from '../../../../lib/apiClient'
import type {
  AdminStoreDetails,
  AdminStoreListQuery,
  AdminStoreListResult,
  AdminStoreStatus,
} from '../types'

interface AdminStoreListApiResponse {
  success: true
  data: AdminStoreListResult
}

interface AdminStoreApiResponse {
  success: true
  data: {
    store: AdminStoreDetails
  }
}

/** Retrieves one paginated page of stores, optionally filtered by status. */
export async function getAdminStores(query: AdminStoreListQuery): Promise<AdminStoreListResult> {
  const response = await apiClient.get<AdminStoreListApiResponse>('/admin/stores', {
    params: query,
  })

  return response.data.data
}

/** Retrieves the complete administrative details for one store. */
export async function getAdminStore(storeId: string): Promise<AdminStoreDetails> {
  const response = await apiClient.get<AdminStoreApiResponse>(
    `/admin/stores/${encodeURIComponent(storeId)}`,
  )

  return response.data.data.store
}

/** Activates or pauses a store using the administrator status endpoint. */
export async function updateAdminStoreStatus(input: {
  storeId: string
  status: AdminStoreStatus
}): Promise<AdminStoreDetails> {
  const response = await apiClient.patch<AdminStoreApiResponse>(
    `/admin/stores/${encodeURIComponent(input.storeId)}/status`,
    { status: input.status },
  )

  return response.data.data.store
}
