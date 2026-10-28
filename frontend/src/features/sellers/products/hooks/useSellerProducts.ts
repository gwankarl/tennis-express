import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  archiveSellerProduct,
  createSellerProductDraft,
  deleteSellerProduct,
  getSellerProduct,
  getSellerProductBrands,
  getSellerProductCategories,
  getSellerProductVariantCount,
  getSellerProducts,
  publishSellerProduct,
  restoreSellerProduct,
  submitSellerProduct,
  updateSellerProduct,
} from '../api/sellerProducts'
import type { ListSellerProductsParams, UpdateSellerProductRequest } from '../types'

export const sellerProductsQueryKey = ['seller', 'products'] as const

/** Fetches the seller's products for the requested page and filters. */
export function useSellerProducts(params: ListSellerProductsParams) {
  return useQuery({
    queryKey: [...sellerProductsQueryKey, params],
    queryFn: () => getSellerProducts(params),
  })
}

/** Archives a product and refreshes product-list queries after success. */
export function useArchiveSellerProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: archiveSellerProduct,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: sellerProductsQueryKey })
    },
  })
}

/** Restores a product and refreshes product-list queries after success. */
export function useRestoreSellerProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: restoreSellerProduct,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: sellerProductsQueryKey })
    },
  })
}

/** Publishes an approved draft and refreshes seller product lists. */
export function usePublishSellerProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: publishSellerProduct,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: sellerProductsQueryKey })
    },
  })
}

/** Deletes an unsubmitted draft and refreshes product lists and details. */
export function useDeleteSellerProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteSellerProduct,
    onSuccess: async ({ productId }) => {
      queryClient.removeQueries({ queryKey: sellerProductDetailQueryKey(productId) })
      await queryClient.invalidateQueries({ queryKey: sellerProductsQueryKey })
    },
  })
}

export const sellerProductDetailQueryKey = (productId: string) =>
  [...sellerProductsQueryKey, 'detail', productId] as const

export const sellerProductCategoriesQueryKey = [
  ...sellerProductsQueryKey,
  'catalog',
  'categories',
] as const

export const sellerProductBrandsQueryKey = [...sellerProductsQueryKey, 'catalog', 'brands'] as const

/** Fetches one seller-owned product. */
export function useSellerProduct(productId: string) {
  return useQuery({
    queryKey: sellerProductDetailQueryKey(productId),
    queryFn: () => getSellerProduct(productId),
    enabled: Boolean(productId),
  })
}

/** Fetches active categories for the product editor. */
export function useSellerProductCategories() {
  return useQuery({
    queryKey: sellerProductCategoriesQueryKey,
    queryFn: getSellerProductCategories,
  })
}

/** Fetches active brands for the product editor. */
export function useSellerProductBrands() {
  return useQuery({
    queryKey: sellerProductBrandsQueryKey,
    queryFn: getSellerProductBrands,
  })
}

/** Fetches the number of variants so product options can be locked when needed. */
export function useSellerProductVariantCount(productId: string) {
  return useQuery({
    queryKey: [...sellerProductDetailQueryKey(productId), 'variant-count'],
    queryFn: () => getSellerProductVariantCount(productId),
    enabled: Boolean(productId),
  })
}

/** Creates a draft and refreshes the seller's product lists. */
export function useCreateSellerProductDraft() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createSellerProductDraft,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: sellerProductsQueryKey })
    },
  })
}

/** Saves product details and refreshes the detail and list caches. */
export function useUpdateSellerProduct(productId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (changes: UpdateSellerProductRequest) => updateSellerProduct(productId, changes),
    onSuccess: async (product) => {
      queryClient.setQueryData(sellerProductDetailQueryKey(productId), product)
      await queryClient.invalidateQueries({ queryKey: sellerProductsQueryKey })
    },
  })
}

/** Submits a product and refreshes its detail and seller product-list caches. */
export function useSubmitSellerProduct(productId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => submitSellerProduct(productId),
    onSuccess: async (product) => {
      queryClient.setQueryData(sellerProductDetailQueryKey(productId), product)
      await queryClient.invalidateQueries({ queryKey: sellerProductsQueryKey })
    },
  })
}
