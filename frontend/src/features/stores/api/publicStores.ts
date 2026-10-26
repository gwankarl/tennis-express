import { apiClient } from '../../../lib/apiClient'
import type { PublicStore } from '../types'

interface PublicStoreApiResponse {
  success: true
  data: {
    store: PublicStore
  }
}

/** Fetches an active public storefront by its URL slug. */
export async function getPublicStore(slug: string): Promise<PublicStore> {
  const response = await apiClient.get<PublicStoreApiResponse>(
    `/stores/${encodeURIComponent(slug)}`,
  )

  return response.data.data.store
}
