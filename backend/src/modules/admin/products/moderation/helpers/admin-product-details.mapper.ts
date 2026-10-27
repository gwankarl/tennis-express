import type { Brand } from '../../../brands/types/brand.types.js';
import type { Category } from '../../../categories/types/category.types.js';
import type {
  Product,
  ProductModerationStatus,
} from '../../../../sellers/products/management/types/product.types.js';
import type { ProductVariant } from '../../../../sellers/products/variants/types/product-variant.types.js';
import type { Store } from '../../../../sellers/store/types/store.types.js';
import type { User, UserProfile } from '../../../../users/profiles/types/user.types.js';
import type { AdminProductDetails } from '../types/admin-product-details.types.js';

type SellerSummarySource = Pick<User, '_id' | 'status'> & {
  profile: Pick<UserProfile, 'userName'>;
};

type StoreSummarySource = Pick<Store, '_id' | 'name' | 'slug' | 'status'>;

type CategorySummarySource = Pick<Category, '_id' | 'name' | 'slug' | 'status' | 'attributes'>;

type BrandSummarySource = Pick<Brand, '_id' | 'name' | 'slug' | 'status'>;

/** Inputs required to map database records into the admin review response. */
export interface AdminProductDetailsMappingInput {
  product: Product;
  seller: SellerSummarySource | null;
  store: StoreSummarySource | null;
  category: CategorySummarySource | null;
  brand: BrandSummarySource | null;
  variants: ProductVariant[];
}

/**
 * Converts product and related records into the safe administrator review response.
 * Cloudinary identifiers and unrelated seller profile fields are intentionally omitted.
 */
export function mapAdminProductDetails({
  product,
  seller,
  store,
  category,
  brand,
  variants,
}: AdminProductDetailsMappingInput): AdminProductDetails {
  const productModerationStatus: ProductModerationStatus = product.moderationStatus;

  return {
    product: {
      id: product._id.toString(),
      sellerId: product.sellerId.toString(),
      storeId: product.storeId.toString(),
      name: product.name ?? null,
      slug: product.slug ?? null,
      description: product.description ?? null,
      categoryId: product.categoryId?.toString() ?? null,
      brandId: product.brandId?.toString() ?? null,
      condition: product.condition ?? null,
      attributes: product.attributes,
      images: product.images.map((image) => ({
        secureUrl: image.secureUrl,
        altText: image.altText,
        isPrimary: image.isPrimary,
        sortOrder: image.sortOrder,
      })),
      options: product.options,
      moderationStatus: productModerationStatus,
      publicationStatus: product.publicationStatus,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      publishedAt: product.publishedAt,
      submittedAt: product.submittedAt,
      reviewedBy: product.reviewedBy?.toString() ?? null,
      reviewedAt: product.reviewedAt,
      moderationReason: product.moderationReason,
      moderationHistory: product.moderationHistory.map((event) => ({
        action: event.action,
        actorId: event.actorId.toString(),
        reason: event.reason,
        createdAt: event.createdAt,
      })),
    },
    seller: seller
      ? {
          id: seller._id.toString(),
          userName: seller.profile.userName,
          status: seller.status,
        }
      : null,
    store: store
      ? {
          id: store._id.toString(),
          name: store.name,
          slug: store.slug,
          status: store.status,
        }
      : null,
    category: category
      ? {
          id: category._id.toString(),
          name: category.name,
          slug: category.slug,
          status: category.status,
          attributes: category.attributes.map((attribute) => ({
            name: attribute.name,
            slug: attribute.slug,
            type: attribute.type,
            required: attribute.required,
            options: attribute.options,
          })),
        }
      : null,
    brand: brand
      ? {
          id: brand._id.toString(),
          name: brand.name,
          slug: brand.slug,
          status: brand.status,
        }
      : null,
    variants: variants.map((variant) => ({
      id: variant._id.toString(),
      name: variant.name,
      attributes: variant.attributes,
      configurationKey: variant.configurationKey,
      isDefault: variant.isDefault,
      sku: variant.sku,
      price: variant.price,
      stockQuantity: variant.stockQuantity,
      status: variant.status,
      createdAt: variant.createdAt,
      updatedAt: variant.updatedAt,
    })),
  };
}
