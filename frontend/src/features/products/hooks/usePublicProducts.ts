import { useQuery } from '@tanstack/react-query'

import { searchPublicProducts } from '../api/publicProducts'
import type { PublicProductSearchParams } from '../types'

export const publicProductsQueryKey = ['public', 'products'] as const

/** Loads search results for the submitted query and page. */
export function usePublicProductSearch(params: PublicProductSearchParams) {
  const normalizedParams = {
    ...params,
    q: params.q?.trim() || undefined,
    categoryId: params.categoryId?.trim() || undefined,
  }

  return useQuery({
    queryKey: [...publicProductsQueryKey, normalizedParams],
    queryFn: () => searchPublicProducts(normalizedParams),
    enabled: Boolean(normalizedParams.q || normalizedParams.categoryId),
  })
}
