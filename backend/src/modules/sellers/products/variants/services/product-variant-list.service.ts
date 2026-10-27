import mongoose from 'mongoose';

import { AppError } from '../../../../../shared/errors/AppError.js';
import {
  buildPaginationMetadata,
  getPaginationOffset,
  type PaginationMetadata,
} from '../../../../../shared/pagination.js';
import { StoreModel } from '../../../store/models/store.model.js';
import { ProductModel } from '../../management/models/product.model.js';
import { ProductVariantModel } from '../models/product-variant.model.js';
import type { ListProductVariantsQuery } from '../schemas/product-variant.schema.js';
import type { ProductVariant } from '../types/product-variant.types.js';

export interface ProductVariantListResult {
  variants: ProductVariant[];
  pagination: PaginationMetadata;
}

/** Lists variants for a product owned by the authenticated seller. */
export class ProductVariantListService {
  /**
   * Returns all variants, including inactive ones, in paginated creation order.
   *
   * @throws AppError when an ID is invalid or the seller does not own the product.
   */
  async listOwnVariants(
    sellerId: string,
    productId: string,
    query: ListProductVariantsQuery,
  ): Promise<ProductVariantListResult> {
    if (!mongoose.isValidObjectId(sellerId)) {
      throw new AppError({
        statusCode: 400,
        code: 'INVALID_SELLER_ID',
        message: 'A valid seller ID is required.',
      });
    }

    if (!mongoose.isValidObjectId(productId)) {
      throw new AppError({
        statusCode: 400,
        code: 'INVALID_PRODUCT_ID',
        message: 'A valid product ID is required.',
      });
    }

    const sellerObjectId = new mongoose.Types.ObjectId(sellerId);
    const product = await ProductModel.findOne({
      _id: new mongoose.Types.ObjectId(productId),
      sellerId: sellerObjectId,
    })
      .select('_id storeId')
      .exec();

    if (!product) {
      throw new AppError({
        statusCode: 404,
        code: 'PRODUCT_NOT_FOUND',
        message: 'The product could not be found.',
      });
    }

    const authorizedStore = await StoreModel.exists({
      _id: product.storeId,
      sellerId: sellerObjectId,
    });

    if (!authorizedStore) {
      throw new AppError({
        statusCode: 404,
        code: 'PRODUCT_NOT_FOUND',
        message: 'The product could not be found.',
      });
    }

    const filter = { productId: product._id };

    const [documents, totalItems] = await Promise.all([
      ProductVariantModel.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(getPaginationOffset(query))
        .limit(query.limit)
        .exec(),
      ProductVariantModel.countDocuments(filter).exec(),
    ]);

    return {
      variants: documents.map((document) => document.toObject() as ProductVariant),
      pagination: buildPaginationMetadata(query, totalItems),
    };
  }
}
