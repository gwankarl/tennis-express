import mongoose from 'mongoose';

import { AppError } from '../../../../../shared/errors/AppError.js';
import { cloudinaryImageService } from '../../../../../shared/uploads/cloudinary-image.service.js';
import { ProductVariantModel } from '../../variants/models/product-variant.model.js';
import { ProductModel } from '../models/product.model.js';
import type { ProductImage } from '../types/product.types.js';

/** Permanently deletes an unsubmitted draft and its associated data. */
export class ProductDeleteService {
  async deleteOwnDraft(sellerId: string, productId: string): Promise<{ productId: string }> {
    if (!mongoose.isValidObjectId(sellerId) || !mongoose.isValidObjectId(productId)) {
      throw new AppError({
        statusCode: 400,
        code: 'INVALID_PRODUCT_ID',
        message: 'A valid product ID is required.',
      });
    }

    const sellerObjectId = new mongoose.Types.ObjectId(sellerId);
    const productObjectId = new mongoose.Types.ObjectId(productId);
    let deletedProductId: string | null = null;
    let imagePublicIds: string[] = [];

    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        const product = await ProductModel.findOne({
          _id: productObjectId,
          sellerId: sellerObjectId,
        })
          .session(session)
          .exec();

        if (!product) {
          throw new AppError({
            statusCode: 404,
            code: 'PRODUCT_NOT_FOUND',
            message: 'The product could not be found.',
          });
        }

        if (product.publicationStatus !== 'draft' || product.moderationStatus !== 'not_submitted') {
          throw new AppError({
            statusCode: 409,
            code: 'PRODUCT_NOT_DELETABLE',
            message: 'Only unsubmitted draft products can be permanently deleted.',
          });
        }

        const deleteResult = await ProductModel.deleteOne({
          _id: productObjectId,
          sellerId: sellerObjectId,
          publicationStatus: 'draft',
          moderationStatus: 'not_submitted',
        })
          .session(session)
          .exec();

        if (deleteResult.deletedCount !== 1) {
          throw new AppError({
            statusCode: 409,
            code: 'PRODUCT_NOT_DELETABLE',
            message: 'The product changed and can no longer be deleted.',
          });
        }

        await ProductVariantModel.deleteMany({ productId: productObjectId })
          .session(session)
          .exec();

        deletedProductId = productId;
        const productImages = product.images as ProductImage[];
        imagePublicIds = [...new Set(productImages.map((image) => image.publicId))];
      });
    } finally {
      await session.endSession();
    }

    if (!deletedProductId) {
      throw new AppError({
        statusCode: 500,
        code: 'PRODUCT_DELETE_FAILED',
        message: 'The product could not be deleted.',
      });
    }

    // Cloudinary is outside MongoDB's transaction; clean up only after commit.
    for (const publicId of imagePublicIds) {
      try {
        await cloudinaryImageService.delete(publicId);
      } catch (cleanupError) {
        console.error('Failed to clean up a deleted product image.', {
          publicId,
          cleanupError,
        });
      }
    }

    return { productId: deletedProductId };
  }
}
