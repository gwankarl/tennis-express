import type { SellerProductBrand, SellerProductCategory, SellerProductDetails } from '../types'
import type {
  ProductEditorSection,
  ProductEditorSectionStatus,
} from '../components/SellerProductEditorNavigation'

interface ProductEditorReadinessInput {
  product: SellerProductDetails | null
  categories: SellerProductCategory[]
  brands: SellerProductBrand[]
  variantCount: number | undefined
  activeVariantCount: number | undefined
}

export type ProductEditorReadiness = Record<ProductEditorSection, ProductEditorSectionStatus>

function isValidAttributeValue(
  value: unknown,
  definition: SellerProductCategory['attributes'][number],
): boolean {
  switch (definition.type) {
    case 'text':
      return typeof value === 'string' && value.trim().length > 0
    case 'number':
      return typeof value === 'number' && Number.isFinite(value)
    case 'boolean':
      return typeof value === 'boolean'
    case 'select':
      return (
        typeof value === 'string' &&
        definition.options.some(
          (option) => option.trim().toLowerCase() === value.trim().toLowerCase(),
        )
      )
  }
}

function hasValidCategoryAttributes(
  suppliedAttributes: Record<string, unknown>,
  definitions: SellerProductCategory['attributes'],
): boolean {
  const definitionsBySlug = new Map(
    definitions.map((definition) => [definition.slug.trim().toLowerCase(), definition]),
  )
  const suppliedValues = new Map<string, unknown>()

  for (const [key, value] of Object.entries(suppliedAttributes)) {
    const normalizedKey = key.trim().toLowerCase()

    if (suppliedValues.has(normalizedKey) || !definitionsBySlug.has(normalizedKey)) {
      return false
    }

    suppliedValues.set(normalizedKey, value)
  }

  for (const [slug, definition] of definitionsBySlug) {
    if (!suppliedValues.has(slug)) {
      if (definition.required) return false
      continue
    }

    if (!isValidAttributeValue(suppliedValues.get(slug), definition)) {
      return false
    }
  }

  return true
}

/** Calculates preliminary editor progress from persisted product and catalog data. */
export function getProductEditorReadiness({
  product,
  categories,
  brands,
  variantCount,
  activeVariantCount,
}: ProductEditorReadinessInput): ProductEditorReadiness {
  if (!product) {
    return {
      details: 'incomplete',
      variants: 'incomplete',
      images: 'incomplete',
      review: 'incomplete',
    }
  }

  const category = categories.find((item) => item._id === product.categoryId)
  const brandIsAvailable = !product.brandId || brands.some((item) => item._id === product.brandId)

  const detailsComplete =
    Boolean(product.name?.trim() && product.name.trim().length >= 2) &&
    Boolean(product.description?.trim() && product.description.trim().length >= 10) &&
    Boolean(category) &&
    Boolean(product.condition) &&
    brandIsAvailable &&
    Boolean(category && hasValidCategoryAttributes(product.attributes ?? {}, category.attributes))

  const imagesComplete =
    product.images.length > 0 && product.images.filter((image) => image.isPrimary).length === 1

  const variantsStatus: ProductEditorSectionStatus =
    activeVariantCount === undefined
      ? 'checking'
      : activeVariantCount > 0
        ? 'complete'
        : 'incomplete'

  const reviewReady =
    detailsComplete &&
    imagesComplete &&
    variantCount !== undefined &&
    variantCount > 0 &&
    activeVariantCount !== undefined &&
    activeVariantCount > 0

  return {
    details: detailsComplete ? 'complete' : 'incomplete',
    variants: variantsStatus,
    images: imagesComplete ? 'complete' : 'incomplete',
    review: reviewReady ? 'ready' : 'incomplete',
  }
}
