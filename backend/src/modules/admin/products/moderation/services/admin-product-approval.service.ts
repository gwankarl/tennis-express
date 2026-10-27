import mongoose from 'mongoose';

import { AppError } from '../../../../../shared/errors/AppError.js';
import { ProductModel } from '../../../../sellers/products/management/models/product.model.js';
import type { Product } from '../../../../sellers/products/management/types/product.types.js';

/** Approves pending products for the authenticated administrator. */
export class AdminProductApprovalService {
  /**
   * Records approval atomically without changing the publication status.
   *
   * @throws AppError when either ID is invalid, the product is missing,
   * or the product is no longer pending.
   */
  async approve(productId: string, reviewerId: string): Promise<Product> {
    if (!mongoose.isValidObjectId(productId)) {
      throw new AppError({
        statusCode: 400,
        code: 'INVALID_PRODUCT_ID',
        message: 'A valid product ID is required.',
      });
    }

    if (!mongoose.isValidObjectId(reviewerId)) {
      throw new AppError({
        statusCode: 404,
        code: 'USER_NOT_FOUND',
        message: 'The reviewing administrator could not be found.',
      });
    }

    const productObjectId = new mongoose.Types.ObjectId(productId);
    const reviewerObjectId = new mongoose.Types.ObjectId(reviewerId);
    const reviewedAt = new Date();

    const product = await ProductModel.findOneAndUpdate(
      {
        _id: productObjectId,
        moderationStatus: 'pending',
      },
      {
        $set: {
          moderationStatus: 'approved',
          reviewedBy: reviewerObjectId,
          reviewedAt,
          moderationReason: null,
        },
        $push: {
          moderationHistory: {
            action: 'approved',
            actorId: reviewerObjectId,
            reason: null,
            createdAt: reviewedAt,
          },
        },
      },
      {
        new: true,
        runValidators: true,
      },
    ).exec();

    if (product) {
      return product.toObject() as Product;
    }

    const existingProduct = await ProductModel.findById(productObjectId)
      .select('_id moderationStatus')
      .lean()
      .exec();

    if (!existingProduct) {
      throw new AppError({
        statusCode: 404,
        code: 'PRODUCT_NOT_FOUND',
        message: 'The product does not exist.',
      });
    }

    throw new AppError({
      statusCode: 409,
      code: 'PRODUCT_NOT_PENDING',
      message: 'Only pending products can be approved.',
    });
  }
}
