import { apiClient } from '../../../lib/apiClient'
import type { PublicCategory } from '../types'

interface PublicCategoriesApiResponse {
  success: true
  data: {
    categories: PublicCategory[]
  }
}

/** Retrieves active categories for public navigation. */
export async function getPublicCategories(): Promise<PublicCategory[]> {
  const response = await apiClient.get<PublicCategoriesApiResponse>('/categories')

  return response.data.data.categories
}
