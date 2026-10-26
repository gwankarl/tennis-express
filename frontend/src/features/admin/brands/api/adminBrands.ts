import { apiClient } from '../../../../lib/apiClient'
import type {
  Brand,
  BrandListQuery,
  BrandListResult,
  BrandStatus,
  CreateBrandRequest,
  UpdateBrandRequest,
} from '../types'

interface BrandListApiResponse {
  success: true
  data: BrandListResult
}

interface BrandApiResponse {
  success: true
  data: { brand: Brand }
}

function createBrandFormData(
  fields: CreateBrandRequest | UpdateBrandRequest,
  logo?: File,
): FormData {
  const formData = new FormData()

  if (fields.name !== undefined) {
    formData.append('name', fields.name)
  }

  if (fields.description !== undefined) {
    formData.append('description', fields.description)
  }

  if (logo) {
    formData.append('image', logo)
  }

  return formData
}

/** Retrieves a page of brands with an optional status filter. */
export async function getAdminBrands(query: BrandListQuery): Promise<BrandListResult> {
  const response = await apiClient.get<BrandListApiResponse>('/admin/brands', {
    params: query,
  })

  return response.data.data
}

/** Retrieves one brand for editing. */
export async function getAdminBrand(brandId: string): Promise<Brand> {
  const response = await apiClient.get<BrandApiResponse>(
    `/admin/brands/${encodeURIComponent(brandId)}`,
  )

  return response.data.data.brand
}

/** Creates a brand, optionally uploading its logo. */
export async function createAdminBrand(input: {
  fields: CreateBrandRequest
  logo?: File
}): Promise<Brand> {
  const response = await apiClient.post<BrandApiResponse>(
    '/admin/brands',
    createBrandFormData(input.fields, input.logo),
  )

  return response.data.data.brand
}

/** Updates brand fields and optionally replaces its logo. */
export async function updateAdminBrand(input: {
  brandId: string
  fields: UpdateBrandRequest
  logo?: File
}): Promise<Brand> {
  const response = await apiClient.patch<BrandApiResponse>(
    `/admin/brands/${encodeURIComponent(input.brandId)}`,
    createBrandFormData(input.fields, input.logo),
  )

  return response.data.data.brand
}

/** Activates or deactivates a brand. */
export async function updateAdminBrandStatus(input: {
  brandId: string
  status: BrandStatus
}): Promise<Brand> {
  const response = await apiClient.patch<BrandApiResponse>(
    `/admin/brands/${encodeURIComponent(input.brandId)}/status`,
    { status: input.status },
  )

  return response.data.data.brand
}
