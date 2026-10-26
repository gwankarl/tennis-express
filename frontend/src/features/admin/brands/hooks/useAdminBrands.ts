import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createAdminBrand,
  getAdminBrand,
  getAdminBrands,
  updateAdminBrand,
  updateAdminBrandStatus,
} from '../api/adminBrands'
import type { BrandListQuery } from '../types'

export const adminBrandsQueryKey = ['admin', 'brands'] as const

/** Fetches one page of brands with its selected filters. */
export function useAdminBrands(query: BrandListQuery) {
  return useQuery({
    queryKey: [...adminBrandsQueryKey, 'list', query],
    queryFn: () => getAdminBrands(query),
  })
}

/** Fetches one brand for the edit form when an ID is selected. */
export function useAdminBrand(brandId: string | null) {
  return useQuery({
    queryKey: [...adminBrandsQueryKey, 'detail', brandId],
    queryFn: () => getAdminBrand(brandId as string),
    enabled: Boolean(brandId),
  })
}

/** Creates a brand and refreshes cached brand lists. */
export function useCreateAdminBrand() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createAdminBrand,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: adminBrandsQueryKey,
      })
    },
  })
}

/** Updates brand fields or its logo and refreshes cached brand data. */
export function useUpdateAdminBrand() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateAdminBrand,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: adminBrandsQueryKey,
      })
    },
  })
}

/** Changes a brand's active status and refreshes cached brand data. */
export function useUpdateAdminBrandStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateAdminBrandStatus,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: adminBrandsQueryKey,
      })
    },
  })
}
