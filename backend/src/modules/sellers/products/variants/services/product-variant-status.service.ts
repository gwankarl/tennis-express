import mongoose from 'mongoose';

import { AppError } from '../../../../../shared/errors/AppError.js';
import { StoreModel } from '../../../store/models/store.model.js';
import { ProductModel } from '../../management/models/product.model.js';
import { ProductVariantModel } from '../models/product-variant.model.js';
import type {
  ProductVariantParams,
  UpdateProductVariantStatusRequest,
} from '../schemas/product-variant.schema.js';
import type { ProductVariant } from '../types/product-variant.types.js';

/** Changes the active status of a variant owned by the authenticated seller. */
export class ProductVariantStatusService {
  /**
   * Changes only the variant status; stock, configuration, and product
   * publication status remain unchanged.
   */
  async updateOwnVariantStatus(
    sellerId: string,
    params: ProductVariantParams,
    input: UpdateProductVariantStatusRequest,
  ): Promise<ProductVariant> {
    if (
      !mongoose.isValidObjectId(sellerId) ||
      !mongoose.isValidObjectId(params.productId) ||
      !mongoose.isValidObjectId(params.variantId)
    ) {
      throw new AppError({
        statusCode: 400,
        code: 'INVALID_PRODUCT_VARIANT_ID',
        message: 'A valid product and variant ID are required.',
      });
    }

    const sellerObjectId = new mongoose.Types.ObjectId(sellerId);
    const product = await ProductModel.findOne({
      _id: new mongoose.Types.ObjectId(params.productId),
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
      _id: new mongoose.Types.ObjectId(params.variantId),
      productId: product._id,
    }).exec();

    if (!variant) {
      throw new AppError({
        statusCode: 404,
        code: 'PRODUCT_VARIANT_NOT_FOUND',
        message: 'The product variant could not be found.',
      });
    }

    if (variant.status !== input.status) {
      variant.status = input.status;
      await variant.save();
    }

    return variant.toObject() as ProductVariant;
  }
}
