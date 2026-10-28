import mongoose from 'mongoose';

import { AppError } from '../../../../../shared/errors/AppError.js';
import { ProductModel } from '../models/product.model.js';
import type { Product } from '../types/product.types.js';

/** Archives a seller-owned product without deleting it. */
export class ProductArchiveService {
  /**
   * Sets the product's publication status to archived.
   * Repeating the operation for an already archived product is safe.
   *
   * @throws AppError when an ID is invalid or the seller does not own the product.
   */
  async archiveOwnProduct(sellerId: string, productId: string): Promise<Product> {
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

    if (product.publicationStatus === 'archived' && product.moderationStatus === 'approved') {
      return product.toObject() as Product;
    }

    if (product.publicationStatus !== 'published' || product.moderationStatus !== 'approved') {
      throw new AppError({
        statusCode: 409,
        code: 'PRODUCT_NOT_ARCHIVABLE',
        message: 'Only approved, published products can be archived.',
      });
    }

    product.publicationStatus = 'archived';
    // Keep publishedAt so restore can return it to its prior published state.
    await product.save();

    return product.toObject() as Product;
  }
}
