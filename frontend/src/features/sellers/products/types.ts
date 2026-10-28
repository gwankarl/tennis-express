export const productModerationStatuses = [
  'not_submitted',
  'pending',
  'approved',
  'rejected',
  'changes_requested',
] as const

export type ProductModerationStatus = (typeof productModerationStatuses)[number]

export const productPublicationStatuses = ['draft', 'published', 'archived'] as const

export type ProductPublicationStatus = (typeof productPublicationStatuses)[number]

export const productConditions = ['new', 'used'] as const

export type ProductCondition = (typeof productConditions)[number]

export interface SellerProductImage {
  _id: string
  secureUrl: string
  altText: string
  isPrimary: boolean
  sortOrder: number
}

export interface UpdateSellerProductImageRequest {
  altText?: string
  isPrimary?: boolean
}

export interface ReorderSellerProductImagesRequest {
  imageIds: string[]
}

/** Product fields used by the seller product list. */
export interface SellerProduct {
  _id: string
  name?: string
  condition?: ProductCondition
  images: SellerProductImage[]
  moderationStatus: ProductModerationStatus
  publicationStatus: ProductPublicationStatus
  submittedAt: string | null
  reviewedAt: string | null
  moderationReason: string | null
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

export const productVariantStatuses = ['active', 'inactive'] as const

export type ProductVariantStatus = (typeof productVariantStatuses)[number]

export interface SellerProductVariant {
  _id: string
  productId: string
  name: string
  attributes: Record<string, string>
  configurationKey: string
  isDefault: boolean
  sku: string | null
  price: number
  stockQuantity: number
  status: ProductVariantStatus
  createdAt: string
  updatedAt: string
}

export interface SellerProductVariantListResult {
  variants: SellerProductVariant[]
  pagination: PaginationMetadata
}

export interface ListSellerProductVariantsParams {
  page: number
  limit: number
}

export interface CreateSellerProductVariantRequest {
  name: string
  attributes?: Record<string, string>
  sku?: string | null
  price: number
  stockQuantity: number
}

export type UpdateSellerProductVariantRequest = Partial<CreateSellerProductVariantRequest>

export interface UpdateSellerProductVariantStatusRequest {
  status: ProductVariantStatus
}

export interface ListSellerProductsParams {
  page: number
  limit: number
  publicationStatus?: ProductPublicationStatus
  moderationStatus?: ProductModerationStatus
  condition?: ProductCondition
}

export interface SellerProductListResult {
  products: SellerProduct[]
  pagination: PaginationMetadata
}

export interface ProductOptionDefinition {
  name: string
  values: string[]
}

export type CategoryAttributeType = 'text' | 'number' | 'boolean' | 'select'

export interface SellerProductCategoryAttribute {
  name: string
  slug: string
  type: CategoryAttributeType
  required: boolean
  options: string[]
  filterable?: boolean
}

export interface SellerProductCategory {
  _id: string
  name: string
  slug: string
  parentId: string | null
  sortOrder: number
  attributes: SellerProductCategoryAttribute[]
}

export interface SellerProductBrand {
  _id: string
  name: string
  slug: string
}

export type SellerProductModerationAction =
  'submitted' | 'resubmitted' | 'approved' | 'rejected' | 'changes_requested'

export interface SellerProductModerationEvent {
  action: SellerProductModerationAction
  actorId: string
  reason: string | null
  createdAt: string
}

/** Full product fields returned by the seller product detail endpoint. */
export interface SellerProductDetails extends SellerProduct {
  slug?: string
  description?: string
  categoryId?: string
  brandId?: string | null
  options: ProductOptionDefinition[]
  attributes: Record<string, unknown>
  publishedAt: string | null
  submittedAt: string | null
  reviewedBy: string | null
  reviewedAt: string | null
  moderationHistory: SellerProductModerationEvent[]
  moderationReason: string | null
}

export interface SellerProductDraftRequest {
  name?: string
  description?: string
  categoryId?: string
  brandId?: string | null
  condition?: ProductCondition
  options?: ProductOptionDefinition[]
  attributes?: Record<string, unknown>
}

export type UpdateSellerProductRequest = SellerProductDraftRequest

export interface SellerProductCategoryListResult {
  categories: SellerProductCategory[]
  pagination: PaginationMetadata
}

export interface SellerProductBrandListResult {
  brands: SellerProductBrand[]
  pagination: PaginationMetadata
}
