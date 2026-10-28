import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  approveAdminProduct,
  getAdminProduct,
  getAdminProducts,
  rejectAdminProduct,
  requestAdminProductChanges,
} from '../api/adminProductModeration'
import type { AdminProductListQuery } from '../types'

export const adminProductModerationQueryKey = ['admin', 'product-moderation'] as const

/** Fetches a product queue using its current status and pagination filters. */
export function useAdminProducts(query: AdminProductListQuery) {
  return useQuery({
    queryKey: [...adminProductModerationQueryKey, 'list', query],
    queryFn: () => getAdminProducts(query),
  })
}

/** Fetches review details for the selected product. */
export function useAdminProduct(productId: string | null) {
  return useQuery({
    queryKey: [...adminProductModerationQueryKey, 'detail', productId],
    queryFn: () => getAdminProduct(productId as string),
    enabled: Boolean(productId),
  })
}

/** Approves a product and refreshes moderation lists and details. */
export function useApproveAdminProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: approveAdminProduct,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: adminProductModerationQueryKey,
      })
    },
  })
}

/** Rejects a product and refreshes moderation lists and details. */
export function useRejectAdminProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ productId, reason }: { productId: string; reason: string }) =>
      rejectAdminProduct(productId, reason),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: adminProductModerationQueryKey,
      })
    },
  })
}

/** Requests product changes and refreshes moderation lists and details. */
export function useRequestAdminProductChanges() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ productId, reason }: { productId: string; reason: string }) =>
      requestAdminProductChanges(productId, reason),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: adminProductModerationQueryKey,
      })
    },
  })
}
