import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'

import {
  deleteSellerProductImage,
  getSellerProductImages,
  reorderSellerProductImages,
  updateSellerProductImage,
  uploadSellerProductImage,
} from '../api/sellerProductImages'
import type {
  ReorderSellerProductImagesRequest,
  UpdateSellerProductImageRequest,
} from '../../types'
import { sellerProductDetailQueryKey, sellerProductsQueryKey } from '../../hooks/useSellerProducts'

export const sellerProductImagesQueryKey = (productId: string) =>
  [...sellerProductsQueryKey, 'images', productId] as const

async function invalidateProductImageData(
  queryClient: QueryClient,
  productId: string,
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: sellerProductImagesQueryKey(productId),
    }),
    queryClient.invalidateQueries({
      queryKey: sellerProductDetailQueryKey(productId),
    }),
    queryClient.invalidateQueries({
      queryKey: sellerProductsQueryKey,
    }),
  ])
}

/** Fetches all images for a seller-owned product. */
export function useSellerProductImages(productId: string) {
  return useQuery({
    queryKey: sellerProductImagesQueryKey(productId),
    queryFn: () => getSellerProductImages(productId),
    enabled: Boolean(productId),
  })
}

/** Uploads an image and refreshes image, product-detail, and product-list data. */
export function useUploadSellerProductImage(productId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ file, altText }: { file: File; altText?: string }) =>
      uploadSellerProductImage(productId, file, altText),
    onSuccess: () => invalidateProductImageData(queryClient, productId),
  })
}

/** Updates image metadata and refreshes image, product-detail, and product-list data. */
export function useUpdateSellerProductImage(productId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      imageId,
      changes,
    }: {
      imageId: string
      changes: UpdateSellerProductImageRequest
    }) => updateSellerProductImage(productId, imageId, changes),
    onSuccess: () => invalidateProductImageData(queryClient, productId),
  })
}

/** Reorders all product images and refreshes the affected queries. */
export function useReorderSellerProductImages(productId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: ReorderSellerProductImagesRequest) =>
      reorderSellerProductImages(productId, input),
    onSuccess: () => invalidateProductImageData(queryClient, productId),
  })
}

/** Deletes a product image and refreshes the affected queries. */
export function useDeleteSellerProductImage(productId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (imageId: string) => deleteSellerProductImage(productId, imageId),
    onSuccess: () => invalidateProductImageData(queryClient, productId),
  })
}
