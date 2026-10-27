import mongoose from 'mongoose';
import { AppError } from '../../../../shared/errors/AppError.js';
import { ProductModel } from '../models/product.model.js';
import type { Product } from '../types/product.types.js';
import type { UpdateSellerProductRequest } from '../schemas/product.schema.js';

/** Updates editable fields on a product owned by the seller. */
export class ProductUpdateService {
  /**
   * Updates a seller's product without changing ownership, slug, images, or
   * moderation and publication statuses.
   *
   * @throws AppError when either ID is invalid or the seller does not own the product.
   */
  async updateOwnProduct(
    sellerId: string,
    productId: string,
    changes: UpdateSellerProductRequest,
  ): Promise<Product> {
    if (!mongoose.isValidObjectId(sellerId) || !mongoose.isValidObjectId(productId)) {
      throw new AppError({
        statusCode: 400,
        code: 'INVALID_PRODUCT_ID',
        message: 'The product ID is invalid.',
      });
    }

    const product = await ProductModel.findOne({
      _id: new mongoose.Types.ObjectId(productId),
      sellerId: new mongoose.Types.ObjectId(sellerId),
    });

    if (!product) {
      throw new AppError({
        statusCode: 404,
        code: 'PRODUCT_NOT_FOUND',
        message: 'Product not found.',
      });
    }

    if (changes.name !== undefined) product.name = changes.name;
    if (changes.description !== undefined) {
      product.description = changes.description;
    }
    if (changes.categoryId !== undefined) {
      product.categoryId = new mongoose.Types.ObjectId(changes.categoryId);
    }
    if (changes.brandId !== undefined) {
      product.brandId = changes.brandId ? new mongoose.Types.ObjectId(changes.brandId) : null;
    }
    if (changes.condition !== undefined) product.condition = changes.condition;
    if (changes.attributes !== undefined) {
      product.attributes = changes.attributes;
    }

    await product.save();
    return product.toObject() as Product;
  }
}
