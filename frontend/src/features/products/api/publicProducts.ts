import { apiClient } from '../../../lib/apiClient'
import type { PublicProductListResult, PublicProductSearchParams } from '../types'

interface PublicProductListApiResponse {
  success: true
  data: PublicProductListResult
}

/** Searches publicly visible products. */
export async function searchPublicProducts(
  params: PublicProductSearchParams,
): Promise<PublicProductListResult> {
  const response = await apiClient.get<PublicProductListApiResponse>('/products', {
    params,
  })

  return response.data.data
}
