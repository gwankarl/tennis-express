import mongoose from 'mongoose';
import type { ClientSession, HydratedDocument } from 'mongoose';

import { BrandModel } from '../../../../admin/brands/models/brand.model.js';
import { CategoryModel } from '../../../../admin/categories/models/category.model.js';
import type { CategoryAttribute } from '../../../../admin/categories/types/category.types.js';
import { AppError } from '../../../../../shared/errors/AppError.js';
import { UserModel } from '../../../../users/profiles/models/user.model.js';
import { SellerApplicationModel } from '../../../../users/seller-applications/models/seller-application.model.js';
import { StoreModel } from '../../../store/models/store.model.js';
import { ProductModel } from '../models/product.model.js';
import type { Product, ProductImage } from '../types/product.types.js';
import { ProductVariantModel } from '../../variants/models/product-variant.model.js';
import { buildVariantConfiguration } from '../../variants/helpers/variant-configuration.js';
import { PRODUCT_VARIANT_STATUSES } from '../../variants/types/product-variant.types.js';

/** Checks whether the seller-owned product meets the current submission requirements. */
export class ProductSubmissionValidationService {
  /**
   * Validates seller eligibility and product completeness without changing data.
   *
   * A paused store is allowed: store availability and product moderation are
   * separate, and submission does not publish the product.
   */
  async validateForSubmission(
    sellerId: string,
    productId: string,
    session?: ClientSession,
  ): Promise<HydratedDocument<Product>> {
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

    const sellerQuery = UserModel.findOne({
      _id: sellerObjectId,
      status: 'active',
      deletedAt: null,
    }).select('roles');

    if (session) sellerQuery.session(session);

    const seller = await sellerQuery.lean().exec();

    if (!seller || !seller.roles.includes('seller')) {
      throw new AppError({
        statusCode: 403,
        code: 'SELLER_ACCOUNT_NOT_ELIGIBLE',
        message: 'An active seller account is required to submit products.',
      });
    }

    const approvedApplicationQuery = SellerApplicationModel.exists({
      applicantId: sellerObjectId,
      status: 'approved',
    });

    if (session) approvedApplicationQuery.session(session);

    if (!(await approvedApplicationQuery.exec())) {
      throw new AppError({
        statusCode: 403,
        code: 'SELLER_APPLICATION_NOT_APPROVED',
        message: 'An approved seller application is required to submit products.',
      });
    }

    const productQuery = ProductModel.findOne({
      _id: new mongoose.Types.ObjectId(productId),
      sellerId: sellerObjectId,
    });

    if (session) productQuery.session(session);

    const product = await productQuery.exec();

    if (!product) {
      throw new AppError({
        statusCode: 404,
        code: 'PRODUCT_NOT_FOUND',
        message: 'The product could not be found.',
      });
    }

    const storeQuery = StoreModel.findOne({
      _id: product.storeId,
      sellerId: sellerObjectId,
    }).select('_id');

    if (session) storeQuery.session(session);

    if (!(await storeQuery.exec())) {
      throw new AppError({
        statusCode: 404,
        code: 'STORE_NOT_FOUND',
        message: 'The seller storefront could not be found.',
      });
    }

    if (
      product.moderationStatus !== 'not_submitted' &&
      product.moderationStatus !== 'changes_requested'
    ) {
      throw new AppError({
        statusCode: 409,
        code: 'PRODUCT_NOT_SUBMITTABLE',
        message: 'The product is not in a state that permits submission.',
      });
    }

    if (product.publicationStatus !== 'draft') {
      throw new AppError({
        statusCode: 409,
        code: 'PRODUCT_NOT_SUBMITTABLE',
        message: 'Only draft products can be submitted for review.',
      });
    }

    if (
      !product.name?.trim() ||
      product.name.trim().length < 2 ||
      !product.description?.trim() ||
      product.description.trim().length < 10 ||
      !product.categoryId ||
      !product.condition
    ) {
      throw new AppError({
        statusCode: 400,
        code: 'PRODUCT_DETAILS_INCOMPLETE',
        message:
          'Complete the product name, description, category, and condition before submission.',
      });
    }

    const categoryQuery = CategoryModel.findOne({
      _id: product.categoryId,
      status: 'active',
    }).select('attributes');

    if (session) categoryQuery.session(session);

    const category = await categoryQuery.exec();

    if (!category) {
      throw new AppError({
        statusCode: 400,
        code: 'PRODUCT_CATEGORY_NOT_AVAILABLE',
        message: 'Select an active category before submitting the product.',
      });
    }

    if (product.brandId) {
      const brandQuery = BrandModel.exists({
        _id: product.brandId,
        status: 'active',
      });

      if (session) brandQuery.session(session);

      if (!(await brandQuery.exec())) {
        throw new AppError({
          statusCode: 400,
          code: 'PRODUCT_BRAND_NOT_AVAILABLE',
          message: 'Select an active brand or remove the product brand.',
        });
      }
    }

    this.validateCategoryAttributes(product.attributes, category.attributes);

    const images = product.images as ProductImage[];
    const primaryImageCount = images.filter((image) => image.isPrimary).length;

    if (images.length === 0 || primaryImageCount !== 1) {
      throw new AppError({
        statusCode: 400,
        code: 'PRODUCT_IMAGES_INCOMPLETE',
        message: 'Add at least one image and select exactly one primary image.',
      });
    }

    const variantsQuery = ProductVariantModel.find({
      productId: product._id,
    });

    if (session) variantsQuery.session(session);

    const variants = await variantsQuery.exec();

    if (variants.length === 0) {
      throw new AppError({
        statusCode: 400,
        code: 'PRODUCT_VARIANTS_REQUIRED',
        message: 'Add at least one product variant before submission.',
      });
    }

    let activeVariantCount = 0;
    const configurationKeys = new Set<string>();
    const skus = new Set<string>();

    for (const variant of variants) {
      if (!PRODUCT_VARIANT_STATUSES.includes(variant.status)) {
        throw this.invalidVariantsError();
      }

      if (variant.status === 'active') {
        activeVariantCount += 1;
      }

      if (
        !Number.isSafeInteger(variant.price) ||
        variant.price < 1 ||
        !Number.isSafeInteger(variant.stockQuantity) ||
        variant.stockQuantity < 0
      ) {
        throw this.invalidVariantsError();
      }

      const configuration = buildVariantConfiguration(product.options ?? [], variant.attributes);

      if (
        configuration.configurationKey !== variant.configurationKey ||
        configuration.isDefault !== variant.isDefault ||
        configurationKeys.has(variant.configurationKey)
      ) {
        throw this.invalidVariantsError();
      }

      configurationKeys.add(variant.configurationKey);

      if (variant.sku !== null) {
        const normalizedSku = variant.sku.trim().toUpperCase();

        if (!normalizedSku || skus.has(normalizedSku)) {
          throw this.invalidVariantsError();
        }

        skus.add(normalizedSku);
      }
    }

    if (activeVariantCount === 0) {
      throw new AppError({
        statusCode: 400,
        code: 'PRODUCT_ACTIVE_VARIANT_REQUIRED',
        message: 'At least one active variant is required for submission.',
      });
    }

    return product;
  }

  private validateCategoryAttributes(
    suppliedAttributes: unknown,
    definitions: CategoryAttribute[],
  ): void {
    if (
      typeof suppliedAttributes !== 'object' ||
      suppliedAttributes === null ||
      Array.isArray(suppliedAttributes)
    ) {
      throw this.invalidAttributesError();
    }

    const definitionsBySlug = new Map(
      definitions.map((definition) => [definition.slug.trim().toLowerCase(), definition]),
    );
    const valuesBySlug = new Map<string, unknown>();

    for (const [key, value] of Object.entries(suppliedAttributes)) {
      const normalizedKey = key.trim().toLowerCase();

      if (valuesBySlug.has(normalizedKey) || !definitionsBySlug.has(normalizedKey)) {
        throw this.invalidAttributesError();
      }

      valuesBySlug.set(normalizedKey, value);
    }

    for (const [slug, definition] of definitionsBySlug) {
      if (!valuesBySlug.has(slug)) {
        if (definition.required) {
          throw this.invalidAttributesError();
        }

        continue;
      }

      const value = valuesBySlug.get(slug);
      let isValid = false;

      switch (definition.type) {
        case 'text':
          isValid = typeof value === 'string' && value.trim().length > 0;
          break;
        case 'number':
          isValid = typeof value === 'number' && Number.isFinite(value);
          break;
        case 'boolean':
          isValid = typeof value === 'boolean';
          break;
        case 'select':
          isValid =
            typeof value === 'string' &&
            definition.options.some(
              (option) => option.trim().toLowerCase() === value.trim().toLowerCase(),
            );
          break;
      }

      if (!isValid) {
        throw this.invalidAttributesError();
      }
    }
  }

  private invalidAttributesError(): AppError {
    return new AppError({
      statusCode: 400,
      code: 'PRODUCT_ATTRIBUTES_INVALID',
      message: 'The product attributes do not match the selected category.',
    });
  }

  private invalidVariantsError(): AppError {
    return new AppError({
      statusCode: 400,
      code: 'PRODUCT_VARIANTS_INVALID',
      message: 'One or more product variants are invalid for submission.',
    });
  }
}
