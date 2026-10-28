import mongoose from 'mongoose';

import { AppError } from '../../../../../shared/errors/AppError.js';
import { ProductModel } from '../models/product.model.js';
import type { Product } from '../types/product.types.js';

/** Publishes a product after administrator approval. */
export class ProductPublishService {
  async publishOwnProduct(sellerId: string, productId: string): Promise<Product> {
    if (!mongoose.isValidObjectId(sellerId) || !mongoose.isValidObjectId(productId)) {
      throw new AppError({
        statusCode: 400,
        code: 'INVALID_PRODUCT_ID',
        message: 'A valid product ID is required.',
      });
    }

    const productFilter = {
      _id: new mongoose.Types.ObjectId(productId),
      sellerId: new mongoose.Types.ObjectId(sellerId),
    };

    const product = await ProductModel.findOneAndUpdate(
      {
        ...productFilter,
        moderationStatus: 'approved',
        publicationStatus: 'draft',
      },
      {
        $set: {
          publicationStatus: 'published',
          publishedAt: new Date(),
        },
      },
      { new: true, runValidators: true },
    ).exec();

    if (product) return product.toObject() as Product;

    const existingProduct = await ProductModel.findOne(productFilter)
      .select('moderationStatus publicationStatus')
      .exec();

    if (!existingProduct) {
      throw new AppError({
        statusCode: 404,
        code: 'PRODUCT_NOT_FOUND',
        message: 'The product could not be found.',
      });
    }

    // Repeating a successful publish request is safe.
    if (
      existingProduct.moderationStatus === 'approved' &&
      existingProduct.publicationStatus === 'published'
    ) {
      return (await ProductModel.findById(productId).exec())!.toObject() as Product;
    }

    throw new AppError({
      statusCode: 409,
      code: 'PRODUCT_NOT_PUBLISHABLE',
      message: 'Only an approved draft product can be published.',
    });
  }
}
