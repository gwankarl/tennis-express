import mongoose from 'mongoose';

import { AppError } from '../../../../../shared/errors/AppError.js';
import { StoreModel } from '../../../store/models/store.model.js';
import { ProductModel } from '../../management/models/product.model.js';
import { ProductVariantModel } from '../models/product-variant.model.js';
import { buildVariantConfiguration } from '../helpers/variant-configuration.js';
import type {
  ProductVariantParams,
  UpdateProductVariantRequest,
} from '../schemas/product-variant.schema.js';
import type { ProductVariant } from '../types/product-variant.types.js';
import { assertProductEditable } from '../../management/helpers/assert-product-editable.js';

/** Updates a variant belonging to a product owned by the authenticated seller. */
export class ProductVariantUpdateService {
  /**
   * Updates only fields accepted by the request schema. Configuration changes
   * are revalidated and protected by the product configuration unique index.
   */
  async updateOwnVariant(
    sellerId: string,
    params: ProductVariantParams,
    changes: UpdateProductVariantRequest,
  ): Promise<ProductVariant> {
    if (
      !mongoose.isValidObjectId(sellerId) ||
      !mongoose.isValidObjectId(params.productId) ||
      !mongoose.isValidObjectId(params.variantId)
    ) {
      throw new AppError({
        statusCode: 400,
        code: 'INVALID_PRODUCT_VARIANT_ID',
        message: 'A valid product and variant ID are required.',
      });
    }

    const sellerObjectId = new mongoose.Types.ObjectId(sellerId);
    const product = await ProductModel.findOne({
      _id: new mongoose.Types.ObjectId(params.productId),
      sellerId: sellerObjectId,
    })
      .select('_id storeId options moderationStatus publicationStatus')
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

    const variant = await ProductVariantModel.findOne({
      _id: new mongoose.Types.ObjectId(params.variantId),
      productId: product._id,
    }).exec();

    if (!variant) {
      throw new AppError({
        statusCode: 404,
        code: 'PRODUCT_VARIANT_NOT_FOUND',
        message: 'The product variant could not be found.',
      });
    }

    try {
      if (changes.name !== undefined) variant.name = changes.name;
      if (changes.sku !== undefined) variant.sku = changes.sku;
      if (changes.price !== undefined) variant.price = changes.price;
      if (changes.stockQuantity !== undefined) {
        variant.stockQuantity = changes.stockQuantity;
      }

      if (changes.attributes !== undefined) {
        const configuration = buildVariantConfiguration(product.options ?? [], changes.attributes);

        variant.attributes = configuration.attributes;
        variant.configurationKey = configuration.configurationKey;
        variant.isDefault = configuration.isDefault;
      }

      await variant.save();
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
