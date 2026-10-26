import { apiClient } from '../../../../lib/apiClient'
import type { Category, CategoryFields, CategoryListResult } from '../types'

interface ListResponse {
  success: true
  data: CategoryListResult
}

interface CategoryResponse {
  success: true
  data: { category: Category }
}

export async function getAdminCategories(page: number, limit: number): Promise<CategoryListResult> {
  const response = await apiClient.get<ListResponse>('/admin/categories', {
    params: { page, limit },
  })

  return response.data.data
}

function createCategoryFormData(fields: Partial<CategoryFields>, image?: File): FormData {
  const formData = new FormData()
  formData.append('category', JSON.stringify(fields))

  if (image) {
    formData.append('image', image)
  }

  return formData
}

export async function createAdminCategory(input: {
  fields: CategoryFields
  image: File
}): Promise<Category> {
  const response = await apiClient.post<CategoryResponse>(
    '/admin/categories',
    createCategoryFormData(input.fields, input.image),
  )

  return response.data.data.category
}

export async function updateAdminCategory(input: {
  categoryId: string
  fields: Partial<CategoryFields>
  image?: File
}): Promise<Category> {
  const response = await apiClient.patch<CategoryResponse>(
    `/admin/categories/${encodeURIComponent(input.categoryId)}`,
    createCategoryFormData(input.fields as CategoryFields, input.image),
  )

  return response.data.data.category
}
