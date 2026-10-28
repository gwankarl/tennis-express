import { apiClient } from '../../../../../lib/apiClient'
import type {
  ReorderSellerProductImagesRequest,
  SellerProductImage,
  UpdateSellerProductImageRequest,
} from '../../types'

interface ProductImageApiResponse {
  success: true
  data: {
    image: SellerProductImage
  }
}

interface ProductImagesApiResponse {
  success: true
  data: {
    images: SellerProductImage[]
  }
}

function productImagesPath(productId: string): string {
  return `/seller/products/${encodeURIComponent(productId)}/images`
}

/** Lists the images belonging to a seller-owned product. */
export async function getSellerProductImages(productId: string): Promise<SellerProductImage[]> {
  const response = await apiClient.get<ProductImagesApiResponse>(productImagesPath(productId))

  return response.data.data.images
}

/**
 * Uploads one product image. The backend expects a multipart field named
 * "image" and an optional "altText" field. Axios sets the multipart boundary.
 */
export async function uploadSellerProductImage(
  productId: string,
  file: File,
  altText?: string,
): Promise<SellerProductImage> {
  const formData = new FormData()
  formData.append('image', file)

  if (altText?.trim()) {
    formData.append('altText', altText.trim())
  }

  const response = await apiClient.post<ProductImageApiResponse>(
    productImagesPath(productId),
    formData,
  )

  return response.data.data.image
}

/** Updates an image's alt text, primary flag, or both. */
export async function updateSellerProductImage(
  productId: string,
  imageId: string,
  changes: UpdateSellerProductImageRequest,
): Promise<SellerProductImage> {
  const response = await apiClient.patch<ProductImageApiResponse>(
    `${productImagesPath(productId)}/${encodeURIComponent(imageId)}`,
    changes,
  )

  return response.data.data.image
}

/**
 * Sets the complete image order. Supply every image ID on the product once,
 * arranged in the desired order.
 */
export async function reorderSellerProductImages(
  productId: string,
  input: ReorderSellerProductImagesRequest,
): Promise<SellerProductImage[]> {
  const response = await apiClient.patch<ProductImagesApiResponse>(
    `${productImagesPath(productId)}/reorder`,
    input,
  )

  return response.data.data.images
}

/** Deletes a product image and returns the removed image metadata. */
export async function deleteSellerProductImage(
  productId: string,
  imageId: string,
): Promise<SellerProductImage> {
  const response = await apiClient.delete<ProductImageApiResponse>(
    `${productImagesPath(productId)}/${encodeURIComponent(imageId)}`,
  )

  return response.data.data.image
}
