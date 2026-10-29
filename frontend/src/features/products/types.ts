export interface PublicProductCard {
  id: string
  name: string
  slug: string
  price: {
    min: number
    max: number
    currency: 'XAF'
  }
  primaryImage: {
    secureUrl: string
    altText: string
  } | null
  condition: 'new' | 'used'
  availability: 'in_stock' | 'out_of_stock'
  store: {
    id: string
    name: string
    slug: string
  }
}

export interface PublicProductPagination {
  page: number
  limit: number
  totalItems: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface PublicProductListResult {
  products: PublicProductCard[]
  pagination: PublicProductPagination
}

export interface PublicProductSearchParams {
  q?: string
  categoryId?: string
  page: number
  limit: number
}
