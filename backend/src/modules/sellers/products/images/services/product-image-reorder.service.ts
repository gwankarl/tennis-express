import mongoose from 'mongoose';

import { AppError } from '../../../../../shared/errors/AppError.js';
import { StoreModel } from '../../../store/models/store.model.js';
import { ProductModel } from '../../management/models/product.model.js';
import type { ProductImage } from '../../management/types/product.types.js';
import type { ReorderProductImagesRequest } from '../schemas/product-image.schema.js';

/** Reorders images belonging to a product owned by the authenticated seller. */
export class ProductImageReorderService {
  async reorderOwnImages(
    sellerId: string,
    productId: string,
    input: ReorderProductImagesRequest,
  ): Promise<ProductImage[]> {
    if (!mongoose.isValidObjectId(sellerId) || !mongoose.isValidObjectId(productId)) {
      throw new AppError({
        statusCode: 400,
        code: 'INVALID_PRODUCT_ID',
        message: 'A valid product ID is required.',
      });
    }

    const sellerObjectId = new mongoose.Types.ObjectId(sellerId);
    const product = await ProductModel.findOne({
      _id: new mongoose.Types.ObjectId(productId),
      sellerId: sellerObjectId,
    })
      .select('storeId images')
      .exec();

    if (!product) {
      throw new AppError({
        statusCode: 404,
        code: 'PRODUCT_NOT_FOUND',
        message: 'The product could not be found.',
      });
    }

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
    const imageById = new Map(images.map((image) => [image._id.toString().toLowerCase(), image]));
    const requestedIds = input.imageIds.map((imageId) => imageId.toLowerCase());

    const includesEveryImageExactlyOnce =
      requestedIds.length === images.length &&
      requestedIds.every((imageId) => imageById.has(imageId));

    if (!includesEveryImageExactlyOnce) {
      throw new AppError({
        statusCode: 400,
        code: 'INVALID_IMAGE_ORDER',
        message: 'Provide every image on this product exactly once.',
      });
    }

    requestedIds.forEach((imageId, sortOrder) => {
      const image = imageById.get(imageId);

      if (image) {
        image.sortOrder = sortOrder;
      }
    });

    await product.save();

    return [...images].sort((first, second) => first.sortOrder - second.sortOrder);
  }
}
