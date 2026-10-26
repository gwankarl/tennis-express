export type BrandStatus = 'active' | 'inactive'

export interface BrandLogo {
  publicId: string
  secureUrl: string
}

export interface Brand {
  _id: string
  name: string
  slug: string
  description: string | null
  logo: BrandLogo | null
  status: BrandStatus
  createdBy: string
  updatedBy: string
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

export interface BrandListResult {
  brands: Brand[]
  pagination: PaginationMetadata
}

export interface BrandListQuery {
  page: number
  limit: number
  status?: BrandStatus
}

export interface CreateBrandRequest {
  name: string
  description?: string
}

export interface UpdateBrandRequest {
  name?: string
  description?: string
}
