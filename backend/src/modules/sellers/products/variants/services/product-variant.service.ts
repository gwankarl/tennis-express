import mongoose from 'mongoose';

import { AppError } from '../../../../../shared/errors/AppError.js';
import { StoreModel } from '../../../store/models/store.model.js';
import { ProductModel } from '../../management/models/product.model.js';
import { ProductVariantModel } from '../models/product-variant.model.js';
import { buildVariantConfiguration } from '../helpers/variant-configuration.js';
import type { CreateProductVariantRequest } from '../schemas/product-variant.schema.js';
import type { ProductVariant } from '../types/product-variant.types.js';

/** Creates variants for products owned by the authenticated seller. */
export class ProductVariantService {
  /**
   * Creates a default variant for a product without selectable options, or a
   * configured variant whose values match the product's declared options.
   *
   * @throws AppError when the seller does not own the product or the supplied
   * configuration is invalid or already exists.
   */
  async createVariant(
    sellerId: string,
    productId: string,
    input: CreateProductVariantRequest,
  ): Promise<ProductVariant> {
    if (!mongoose.isValidObjectId(sellerId)) {
      throw new AppError({
        statusCode: 400,
        code: 'INVALID_SELLER_ID',
        message: 'A valid seller ID is required.',
      });
    }

    if (!mongoose.isValidObjectId(productId)) {
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
    }).exec();

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

    const options = product.options ?? [];
    const configuration = buildVariantConfiguration(options, input.attributes);

    if (configuration.isDefault) {
      const existingVariant = await ProductVariantModel.exists({
        productId: product._id,
      });

      if (existingVariant) {
        throw new AppError({
          statusCode: 409,
          code: 'DEFAULT_VARIANT_ALREADY_EXISTS',
          message: 'A product without selectable options can have only one variant.',
        });
      }
    }

    try {
      const variant = await ProductVariantModel.create({
        productId: product._id,
        name: input.name,
        attributes: configuration.attributes,
        configurationKey: configuration.configurationKey,
        isDefault: configuration.isDefault,
        sku: input.sku ?? null,
        price: input.price,
        stockQuantity: input.stockQuantity,
        status: 'active',
      });

      return variant.toObject() as ProductVariant;
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        throw new AppError({
          statusCode: 409,
          code: 'PRODUCT_VARIANT_CONFLICT',
          message: 'A variant with this configuration or SKU already exists.',
        });
      }

      throw error;
    }
  }

  private isDuplicateKeyError(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
  }
}
