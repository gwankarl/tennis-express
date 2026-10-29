import { useQuery } from '@tanstack/react-query'

import { getPublicCategories } from '../api/publicCategories'

export const publicCategoriesQueryKey = ['public', 'categories'] as const

/** Loads active categories for public navigation. */
export function usePublicCategories() {
  return useQuery({
    queryKey: publicCategoriesQueryKey,
    queryFn: getPublicCategories,
  })
}
