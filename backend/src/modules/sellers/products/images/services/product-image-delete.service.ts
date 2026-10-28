import mongoose from 'mongoose';

import { AppError } from '../../../../../shared/errors/AppError.js';
import { cloudinaryImageService } from '../../../../../shared/uploads/cloudinary-image.service.js';
import { StoreModel } from '../../../store/models/store.model.js';
import { ProductModel } from '../../management/models/product.model.js';
import type { ProductImage } from '../../management/types/product.types.js';
import { assertProductEditable } from '../../management/helpers/assert-product-editable.js';

/** Removes an image from a product owned by the authenticated seller. */
export class ProductImageDeleteService {
  async deleteOwnImage(
    sellerId: string,
    productId: string,
    imageId: string,
  ): Promise<ProductImage> {
    if (
      !mongoose.isValidObjectId(sellerId) ||
      !mongoose.isValidObjectId(productId) ||
      !mongoose.isValidObjectId(imageId)
    ) {
      throw new AppError({
        statusCode: 400,
        code: 'INVALID_PRODUCT_IMAGE_ID',
        message: 'Valid product and image IDs are required.',
      });
    }

    const sellerObjectId = new mongoose.Types.ObjectId(sellerId);
    const product = await ProductModel.findOne({
      _id: new mongoose.Types.ObjectId(productId),
      sellerId: sellerObjectId,
    })
      .select('storeId images moderationStatus publicationStatus')
      .exec();

    if (!product) {
      throw new AppError({
        statusCode: 404,
        code: 'PRODUCT_NOT_FOUND',
        message: 'The product could not be found.',
      });
    }

    assertProductEditable(product);

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

    const images = product.images as ProductImage[];
    const imageIndex = images.findIndex(
      (image) => image._id.toString().toLowerCase() === imageId.toLowerCase(),
    );

    if (imageIndex === -1) {
      throw new AppError({
        statusCode: 404,
        code: 'PRODUCT_IMAGE_NOT_FOUND',
        message: 'The product image could not be found.',
      });
    }

    const [removedImage] = images.splice(imageIndex, 1);

    await product.save();

    // Remove the Cloudinary asset only after the database no longer references it.
    try {
      await cloudinaryImageService.delete(removedImage.publicId);
    } catch (cleanupError) {
      console.error('Failed to delete a removed product image from Cloudinary.', {
        publicId: removedImage.publicId,
        cleanupError,
      });
    }

    return removedImage;
  }
}
