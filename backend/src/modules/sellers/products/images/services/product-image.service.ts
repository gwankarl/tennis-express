import mongoose from 'mongoose';

import { AppError } from '../../../../../shared/errors/AppError.js';
import { cloudinaryImageService } from '../../../../../shared/uploads/cloudinary-image.service.js';
import { StoreModel } from '../../../store/models/store.model.js';
import { ProductModel } from '../../management/models/product.model.js';
import type { ProductImage } from '../../management/types/product.types.js';
import type { AddProductImageRequest } from '../schemas/product-image.schema.js';
import { assertProductEditable } from '../../management/helpers/assert-product-editable.js';

interface UploadProductImageInput extends AddProductImageRequest {
  sellerId: string;
  productId: string;
  buffer: Buffer;
  originalFileName: string;
}

function generateProductImageAltText(
  productName: string | undefined,
  originalFileName: string,
): string {
  const fileName = originalFileName.split(/[\\/]/).pop() ?? '';
  const extensionIndex = fileName.lastIndexOf('.');
  const fileLabel = (extensionIndex > 0 ? fileName.slice(0, extensionIndex) : fileName)
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const generatedText = [productName?.trim(), fileLabel]
    .filter((part): part is string => Boolean(part))
    .join(' - ');

  return (generatedText || 'Product image').slice(0, 250);
}

/** Uploads product images to Cloudinary and registers them in the Product document. */
export class ProductImageService {
  /**
   * Uploads one image for a seller-owned product and embeds the server-generated
   * Cloudinary reference in that product.
   */
  async uploadAndRegister(input: UploadProductImageInput): Promise<ProductImage> {
    if (!mongoose.isValidObjectId(input.sellerId) || !mongoose.isValidObjectId(input.productId)) {
      throw new AppError({
        statusCode: 400,
        code: 'INVALID_PRODUCT_ID',
        message: 'A valid product ID is required.',
      });
    }

    const sellerObjectId = new mongoose.Types.ObjectId(input.sellerId);
    const product = await ProductModel.findOne({
      _id: new mongoose.Types.ObjectId(input.productId),
      sellerId: sellerObjectId,
    }).exec();

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

    const cloudinaryImage = await cloudinaryImageService.upload({
      buffer: input.buffer,
      folder: `tennis-xpress/product-images/${input.sellerId}/${input.productId}`,
    });

    const existingImages = product.images as ProductImage[];

    if (existingImages.some((image) => image.publicId === cloudinaryImage.publicId)) {
      throw new AppError({
        statusCode: 409,
        code: 'PRODUCT_IMAGE_ALREADY_REGISTERED',
        message: 'This image is already registered on the product.',
      });
    }

    const nextSortOrder =
      existingImages.reduce((highest, image) => Math.max(highest, image.sortOrder), -1) + 1;

    const image: ProductImage = {
      _id: new mongoose.Types.ObjectId(),
      publicId: cloudinaryImage.publicId,
      secureUrl: cloudinaryImage.secureUrl,
      altText:
        input.altText?.trim() || generateProductImageAltText(product.name, input.originalFileName),
      isPrimary: false,
      sortOrder: nextSortOrder,
    };

    try {
      product.images.push(image);
      await product.save();
      return image;
    } catch (error) {
      try {
        await cloudinaryImageService.delete(cloudinaryImage.publicId);
      } catch (cleanupError) {
        console.error('Failed to clean up an unregistered product image.', {
          publicId: cloudinaryImage.publicId,
          cleanupError,
        });
      }

      throw error;
    }
  }
}
