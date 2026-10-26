import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { SellerStoreStatus, UpdateSellerStoreRequest } from '../types'

import {
  getSellerStore,
  updateSellerStore,
  updateSellerStoreStatus,
  uploadSellerStoreLogo,
} from '../api/sellerStore'

export const sellerStoreQueryKey = ['seller', 'store'] as const

/** Fetches the authenticated seller's storefront. */
export function useSellerStore() {
  return useQuery({
    queryKey: sellerStoreQueryKey,
    queryFn: getSellerStore,
  })
}

/** Saves storefront details and refreshes the cached store response. */
export function useUpdateSellerStore() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (changes: UpdateSellerStoreRequest) => updateSellerStore(changes),
    onSuccess: async (store) => {
      queryClient.setQueryData(sellerStoreQueryKey, store)
      await queryClient.invalidateQueries({ queryKey: sellerStoreQueryKey })
    },
  })
}

/** Uploads a replacement logo and refreshes the cached storefront. */
export function useUploadSellerStoreLogo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => uploadSellerStoreLogo(file),
    onSuccess: async (store) => {
      queryClient.setQueryData(sellerStoreQueryKey, store)
      await queryClient.invalidateQueries({ queryKey: sellerStoreQueryKey })
    },
  })
}

/** Changes the storefront status and refreshes the cached store response. */
export function useUpdateSellerStoreStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (status: SellerStoreStatus) => updateSellerStoreStatus(status),
    onSuccess: async (store) => {
      queryClient.setQueryData(sellerStoreQueryKey, store)
      await queryClient.invalidateQueries({ queryKey: sellerStoreQueryKey })
    },
  })
}
