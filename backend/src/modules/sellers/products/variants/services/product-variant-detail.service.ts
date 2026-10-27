import mongoose from 'mongoose';

import { AppError } from '../../../../../shared/errors/AppError.js';
import { StoreModel } from '../../../store/models/store.model.js';
import { ProductModel } from '../../management/models/product.model.js';
import { ProductVariantModel } from '../models/product-variant.model.js';
import type { ProductVariantParams } from '../schemas/product-variant.schema.js';
import type { ProductVariant } from '../types/product-variant.types.js';

/** Retrieves a variant belonging to a product owned by the authenticated seller. */
export class ProductVariantDetailService {
  /**
   * Scopes the variant lookup to the seller-owned product in the seller's store.
   *
   * @throws AppError when an ID is invalid or the product or variant is not found.
   */
  async getOwnVariant(
    sellerId: string,
    { productId, variantId }: ProductVariantParams,
  ): Promise<ProductVariant> {
    if (!mongoose.isValidObjectId(sellerId)) {
      throw new AppError({
        statusCode: 400,
        code: 'INVALID_SELLER_ID',
        message: 'A valid seller ID is required.',
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

    const variant = await ProductVariantModel.findOne({
      _id: new mongoose.Types.ObjectId(variantId),
      productId: product._id,
    }).exec();

    if (!variant) {
      throw new AppError({
        statusCode: 404,
        code: 'PRODUCT_VARIANT_NOT_FOUND',
        message: 'The product variant could not be found.',
      });
    }

    return variant.toObject() as ProductVariant;
  }
}
