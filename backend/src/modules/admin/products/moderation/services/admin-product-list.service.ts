import {
  buildPaginationMetadata,
  getPaginationOffset,
  type PaginationMetadata,
} from '../../../../../shared/pagination.js';
import { ProductModel } from '../../../../sellers/products/management/models/product.model.js';
import type { Product } from '../../../../sellers/products/management/types/product.types.js';
import type { AdminProductListQuery } from '../schemas/admin-product-moderation.schema.js';
import type { AdminProductListItem } from '../types/admin-product-moderation.types.js';

/** Lists submitted products for administrator moderation. */
export class AdminProductListService {
  async list(input: AdminProductListQuery): Promise<{
    products: AdminProductListItem[];
    pagination: PaginationMetadata;
  }> {
    const filter = { moderationStatus: input.moderationStatus };

    const [productDocuments, totalItems] = await Promise.all([
      ProductModel.find(filter)
        .select(
          'sellerId storeId name slug categoryId brandId condition moderationStatus submittedAt createdAt updatedAt images',
        )
        .sort({ submittedAt: -1, _id: -1 })
        .skip(getPaginationOffset(input))
        .limit(input.limit)
        .exec(),
      ProductModel.countDocuments(filter).exec(),
    ]);

    const products: AdminProductListItem[] = productDocuments.map((document) => {
      const product = document.toObject() as Product;
      const primaryImage = product.images.find((image) => image.isPrimary);

      return {
        id: product._id.toString(),
        sellerId: product.sellerId.toString(),
        storeId: product.storeId.toString(),
        ...(product.name === undefined ? {} : { name: product.name }),
        ...(product.slug === undefined ? {} : { slug: product.slug }),
        ...(product.categoryId === undefined ? {} : { categoryId: product.categoryId.toString() }),
        brandId: product.brandId?.toString() ?? null,
        ...(product.condition === undefined ? {} : { condition: product.condition }),
        // The query filter excludes not_submitted products.
        moderationStatus: product.moderationStatus as AdminProductListItem['moderationStatus'],
        submittedAt: product.submittedAt,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        primaryImage: primaryImage
          ? {
              secureUrl: primaryImage.secureUrl,
              altText: primaryImage.altText,
            }
          : null,
      };
    });

    return {
      products,
      pagination: buildPaginationMetadata(input, totalItems),
    };
  }
}
