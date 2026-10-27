import mongoose from 'mongoose';

import { AppError } from '../../../../shared/errors/AppError.js';
import { ProductModel } from '../models/product.model.js';
import type { Product } from '../types/product.types.js';

/** Restores a seller-owned archived product to draft status. */
export class ProductRestoreService {
  /**
   * Restores an archived product as a draft while preserving its moderation status.
   * Repeating the operation on a non-archived product leaves it unchanged.
   *
   * @throws AppError when an ID is invalid or the seller does not own the product.
   */
  async restoreOwnProduct(sellerId: string, productId: string): Promise<Product> {
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

    const product = await ProductModel.findOne({
      _id: new mongoose.Types.ObjectId(productId),
      sellerId: new mongoose.Types.ObjectId(sellerId),
    }).exec();

    if (!product) {
      throw new AppError({
        statusCode: 404,
        code: 'PRODUCT_NOT_FOUND',
        message: 'The product could not be found.',
      });
    }

    if (product.publicationStatus === 'archived') {
      product.publicationStatus = 'draft';
      product.publishedAt = null;
      await product.save();
    }

    return product.toObject() as Product;
  }
}
