export type CategoryStatus = 'active' | 'inactive'
export type CategoryAttributeType = 'text' | 'number' | 'boolean' | 'select'

export interface CategoryAttribute {
  name: string
  slug: string
  type: CategoryAttributeType
  required: boolean
  options: string[]
  filterable?: boolean
}

export interface CategoryImage {
  publicId: string
  secureUrl: string
}

export interface Category {
  _id: string
  name: string
  slug: string
  parentId: string | null
  description: string | null
  attributes: CategoryAttribute[]
  status: CategoryStatus
  sortOrder: number
  image: CategoryImage
  createdAt: string
  updatedAt: string
}

export interface PaginationMetadata {
  page: number
  limit: number
  totalItems: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface CategoryListResult {
  categories: Category[]
  pagination: PaginationMetadata
}

export interface CategoryFields {
  name: string
  parentId: string | null
  description: string | null
  attributes: CategoryAttribute[]
  status: CategoryStatus
  sortOrder: number
}
