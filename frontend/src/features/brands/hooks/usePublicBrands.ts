import { useQuery } from '@tanstack/react-query'
import { getPublicBrands } from '../api/publicBrands'

export const publicBrandsQueryKey = ['public', 'brands'] as const

/** Loads active brands for the homepage and public brand browsing. */
export function usePublicBrands() {
  return useQuery({
    queryKey: publicBrandsQueryKey,
    queryFn: getPublicBrands,
  })
}
