import type {
  PaginationMetadata,
  ProductCondition,
  ProductModerationStatus,
  ProductOptionDefinition,
  ProductPublicationStatus,
  ProductVariantStatus,
} from '../../sellers/products/types'
import type { SellerStoreStatus } from '../../sellers/store/types'

export type AdminProductReviewStatus = Exclude<ProductModerationStatus, 'not_submitted'>

export interface AdminProductListQuery {
  page: number
  limit: number
  moderationStatus: AdminProductReviewStatus
}

export interface AdminProductListItem {
  id: string
  sellerId: string
  storeId: string
  name?: string
  slug?: string
  categoryId?: string
  brandId: string | null
  condition?: ProductCondition
  moderationStatus: AdminProductReviewStatus
  submittedAt: string | null
  createdAt: string
  updatedAt: string
  primaryImage: {
    secureUrl: string
    altText: string
  } | null
}

export interface AdminProductListResult {
  products: AdminProductListItem[]
  pagination: PaginationMetadata
}

export interface AdminProductReviewImage {
  secureUrl: string
  altText: string
  isPrimary: boolean
  sortOrder: number
}

export interface AdminProductModerationHistoryEvent {
  action: 'submitted' | 'resubmitted' | 'approved' | 'rejected' | 'changes_requested'
  actorId: string
  reason: string | null
  createdAt: string
}

export interface AdminProductReviewDetails {
  product: {
    id: string
    sellerId: string
    storeId: string
    name: string | null
    slug: string | null
    description: string | null
    categoryId: string | null
    brandId: string | null
    condition: ProductCondition | null
    attributes: Record<string, unknown>
    images: AdminProductReviewImage[]
    options: ProductOptionDefinition[]
    moderationStatus: ProductModerationStatus
    publicationStatus: ProductPublicationStatus
    createdAt: string
    updatedAt: string
    publishedAt: string | null
    submittedAt: string | null
    reviewedBy: string | null
    reviewedAt: string | null
    moderationReason: string | null
    moderationHistory: AdminProductModerationHistoryEvent[]
  }
  seller: {
    id: string
    userName: string
    status: 'pending_verification' | 'active' | 'suspended' | 'deactivated'
  } | null
  store: {
    id: string
    name: string
    slug: string
    status: SellerStoreStatus
  } | null
  category: {
    id: string
    name: string
    slug: string
    status: 'active' | 'inactive'
    attributes: {
      name: string
      slug: string
      type: 'text' | 'number' | 'boolean' | 'select'
      required: boolean
      options: string[]
    }[]
  } | null
  brand: {
    id: string
    name: string
    slug: string
    status: 'active' | 'inactive'
  } | null
  variants: {
    id: string
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
  }[]
}
