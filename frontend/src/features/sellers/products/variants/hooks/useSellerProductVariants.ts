import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createSellerProductVariant,
  getSellerProductVariant,
  getSellerProductVariants,
  getSellerProductVariantSummary,
  updateSellerProductVariant,
  updateSellerProductVariantStatus,
} from '../api/sellerProductVariants'
import type {
  CreateSellerProductVariantRequest,
  ListSellerProductVariantsParams,
  UpdateSellerProductVariantRequest,
  UpdateSellerProductVariantStatusRequest,
} from '../../types'
import { sellerProductDetailQueryKey } from '../../hooks/useSellerProducts'

export const sellerProductVariantsQueryKey = (productId: string) =>
  [...sellerProductDetailQueryKey(productId), 'variants'] as const

export const sellerProductVariantSummaryQueryKey = (productId: string) =>
  [...sellerProductVariantsQueryKey(productId), 'submission-summary'] as const

export const sellerProductVariantDetailQueryKey = (productId: string, variantId: string) =>
  [...sellerProductVariantsQueryKey(productId), variantId] as const

/** Fetches one page of variants for the selected product. */
export function useSellerProductVariants(
  productId: string,
  params: ListSellerProductVariantsParams,
) {
  return useQuery({
    queryKey: [...sellerProductVariantsQueryKey(productId), params],
    queryFn: () => getSellerProductVariants(productId, params),
    enabled: Boolean(productId),
  })
}

/** Fetches the total and active variant counts needed by submission review. */
export function useSellerProductVariantSummary(productId: string, enabled: boolean) {
  return useQuery({
    queryKey: sellerProductVariantSummaryQueryKey(productId),
    queryFn: () => getSellerProductVariantSummary(productId),
    enabled: Boolean(productId) && enabled,
  })
}

/** Fetches one variant belonging to the selected product. */
export function useSellerProductVariant(productId: string, variantId: string) {
  return useQuery({
    queryKey: sellerProductVariantDetailQueryKey(productId, variantId),
    queryFn: () => getSellerProductVariant(productId, variantId),
    enabled: Boolean(productId && variantId),
  })
}

/** Creates a variant and refreshes the variant list and option-lock check. */
export function useCreateSellerProductVariant(productId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateSellerProductVariantRequest) =>
      createSellerProductVariant(productId, input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: sellerProductVariantsQueryKey(productId),
        }),
        queryClient.invalidateQueries({
          queryKey: [...sellerProductDetailQueryKey(productId), 'variant-count'],
        }),
        queryClient.invalidateQueries({
          queryKey: sellerProductVariantSummaryQueryKey(productId),
        }),
      ])
    },
  })
}

/** Updates a variant and refreshes its detail and list data. */
export function useUpdateSellerProductVariant(productId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      variantId,
      changes,
    }: {
      variantId: string
      changes: UpdateSellerProductVariantRequest
    }) => updateSellerProductVariant(productId, variantId, changes),
    onSuccess: async (variant) => {
      queryClient.setQueryData(sellerProductVariantDetailQueryKey(productId, variant._id), variant)
      await queryClient.invalidateQueries({
        queryKey: sellerProductVariantsQueryKey(productId),
      })
    },
  })
}

/** Changes a variant's active state and refreshes its cached data. */
export function useUpdateSellerProductVariantStatus(productId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      variantId,
      input,
    }: {
      variantId: string
      input: UpdateSellerProductVariantStatusRequest
    }) => updateSellerProductVariantStatus(productId, variantId, input),
    onSuccess: async (variant) => {
      queryClient.setQueryData(sellerProductVariantDetailQueryKey(productId, variant._id), variant)
      await queryClient.invalidateQueries({
        queryKey: sellerProductVariantsQueryKey(productId),
      })
    },
  })
}
