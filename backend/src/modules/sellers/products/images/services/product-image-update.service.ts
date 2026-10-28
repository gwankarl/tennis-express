import mongoose from 'mongoose';

import { AppError } from '../../../../../shared/errors/AppError.js';
import { StoreModel } from '../../../store/models/store.model.js';
import { ProductModel } from '../../management/models/product.model.js';
import type { ProductImage } from '../../management/types/product.types.js';
import type { UpdateProductImageRequest } from '../schemas/product-image.schema.js';
import { assertProductEditable } from '../../management/helpers/assert-product-editable.js';

/** Updates metadata for an image belonging to the authenticated seller's product. */
export class ProductImageUpdateService {
  async updateOwnImage(
    sellerId: string,
    productId: string,
    imageId: string,
    changes: UpdateProductImageRequest,
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
    const image = images.find(
      (candidate) => candidate._id.toString().toLowerCase() === imageId.toLowerCase(),
    );

    if (!image) {
      throw new AppError({
        statusCode: 404,
        code: 'PRODUCT_IMAGE_NOT_FOUND',
        message: 'The product image could not be found.',
      });
    }

    if (changes.altText !== undefined) {
      image.altText = changes.altText;
    }

    if (changes.isPrimary !== undefined) {
      if (changes.isPrimary) {
        // Clear the previous primary flag before setting the selected image.
        images.forEach((candidate) => {
          candidate.isPrimary = false;
        });
      }

      image.isPrimary = changes.isPrimary;
    }

    await product.save();
    return image;
  }
}
