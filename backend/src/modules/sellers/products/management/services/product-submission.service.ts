import mongoose from 'mongoose';

import { AppError } from '../../../../../shared/errors/AppError.js';
import type { Product } from '../types/product.types.js';
import { ProductSubmissionValidationService } from './product-submission-validation.service.js';

/** Submits a complete seller-owned product for administrator moderation. */
export class ProductSubmissionService {
  private readonly validationService = new ProductSubmissionValidationService();

  /**
   * Validates and submits a product atomically.
   *
   * The transaction ensures validation and the moderation-state change apply
   * together. A correction resubmission retains the previous decision event.
   */
  async submitOwnProduct(sellerId: string, productId: string): Promise<Product> {
    const session = await mongoose.startSession();
    let submittedProduct: Product | null = null;

    try {
      await session.withTransaction(async () => {
        const product = await this.validationService.validateForSubmission(
          sellerId,
          productId,
          session,
        );
        const isResubmission = product.moderationStatus === 'changes_requested';
        const submittedAt = new Date();

        product.moderationStatus = 'pending';
        product.submittedAt = submittedAt;
        product.reviewedBy = null;
        product.reviewedAt = null;
        product.moderationReason = null;
        product.moderationHistory.push({
          action: isResubmission ? 'resubmitted' : 'submitted',
          actorId: new mongoose.Types.ObjectId(sellerId),
          reason: null,
          createdAt: submittedAt,
        });

        await product.save({ session });
        submittedProduct = product.toObject() as Product;
      });
    } finally {
      await session.endSession();
    }

    if (!submittedProduct) {
      throw new AppError({
        statusCode: 500,
        code: 'PRODUCT_SUBMISSION_FAILED',
        message: 'The product submission could not be completed.',
      });
    }

    return submittedProduct;
  }
}
