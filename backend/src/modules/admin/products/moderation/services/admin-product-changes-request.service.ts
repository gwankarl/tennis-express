import mongoose from 'mongoose';

import { AppError } from '../../../../../shared/errors/AppError.js';
import { ProductModel } from '../../../../sellers/products/management/models/product.model.js';
import type { Product } from '../../../../sellers/products/management/types/product.types.js';

/** Records an administrator's requested corrections for a pending product. */
export class AdminProductChangesRequestService {
  /**
   * Records the requested changes atomically without changing publication status.
   *
   * @throws AppError when an ID or reason is invalid, the product is missing,
   * or the product is no longer pending.
   */
  async requestChanges(productId: string, reviewerId: string, reason: string): Promise<Product> {
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

    const normalizedReason = reason.trim();

    if (normalizedReason.length < 20 || normalizedReason.length > 1000) {
      throw new AppError({
        statusCode: 400,
        code: 'INVALID_PRODUCT_REVIEW_REASON',
        message: 'The review reason must contain between 20 and 1000 characters.',
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
          moderationStatus: 'changes_requested',
          reviewedBy: reviewerObjectId,
          reviewedAt,
          moderationReason: normalizedReason,
        },
        $push: {
          moderationHistory: {
            action: 'changes_requested',
            actorId: reviewerObjectId,
            reason: normalizedReason,
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
      message: 'Only pending products can be sent back for changes.',
    });
  }
}
