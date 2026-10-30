import { apiClient } from '../../../lib/apiClient'
import type { PublicBrand } from '../types'

interface PublicBrandsApiResponse {
  success: true
  data: {
    brands: PublicBrand[]
  }
}

/** Retrieves active brands for public browsing. Requires a public GET /brands endpoint. */
export async function getPublicBrands(): Promise<PublicBrand[]> {
  const response = await apiClient.get<PublicBrandsApiResponse>('/brands')

  return response.data.data.brands
}
