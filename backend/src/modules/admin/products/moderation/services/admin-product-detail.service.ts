import mongoose from 'mongoose';

import { AppError } from '../../../../../shared/errors/AppError.js';
import { BrandModel } from '../../../brands/models/brand.model.js';
import { CategoryModel } from '../../../categories/models/category.model.js';
import { ProductVariantModel } from '../../../../sellers/products/variants/models/product-variant.model.js';
import { ProductModel } from '../../../../sellers/products/management/models/product.model.js';
import type { Product } from '../../../../sellers/products/management/types/product.types.js';
import type { ProductVariant } from '../../../../sellers/products/variants/types/product-variant.types.js';
import { StoreModel } from '../../../../sellers/store/models/store.model.js';
import { UserModel } from '../../../../users/profiles/models/user.model.js';
import type { AdminProductDetails } from '../types/admin-product-details.types.js';
import { mapAdminProductDetails } from '../helpers/admin-product-details.mapper.js';

/** Retrieves one product and the limited related data needed for moderation. */
export class AdminProductDetailService {
  async getById(productId: string): Promise<AdminProductDetails> {
    if (!mongoose.isValidObjectId(productId)) {
      throw new AppError({
        statusCode: 400,
        code: 'INVALID_PRODUCT_ID',
        message: 'A valid product ID is required.',
      });
    }

    const productDocument = await ProductModel.findById(productId).exec();

    if (!productDocument) {
      throw new AppError({
        statusCode: 404,
        code: 'PRODUCT_NOT_FOUND',
        message: 'The product does not exist.',
      });
    }

    const product = productDocument.toObject() as Product;

    const [seller, store, category, brand, variantDocuments] = await Promise.all([
      UserModel.findOne({
        _id: product.sellerId,
        deletedAt: null,
      })
        .select('profile.userName status')
        .exec(),
      StoreModel.findById(product.storeId).select('name slug status').exec(),
      product.categoryId
        ? CategoryModel.findById(product.categoryId).select('name slug status attributes').exec()
        : Promise.resolve(null),
      product.brandId
        ? BrandModel.findById(product.brandId).select('name slug status').exec()
        : Promise.resolve(null),
      ProductVariantModel.find({ productId: product._id })
        .sort({ isDefault: -1, name: 1, _id: 1 })
        .exec(),
    ]);

    return mapAdminProductDetails({
      product,
      seller: seller
        ? {
            _id: seller._id,
            profile: { userName: seller.profile.userName },
            status: seller.status,
          }
        : null,
      store: store
        ? {
            _id: store._id,
            name: store.name,
            slug: store.slug,
            status: store.status,
          }
        : null,
      category: category
        ? {
            _id: category._id,
            name: category.name,
            slug: category.slug,
            status: category.status,
            attributes: category.attributes,
          }
        : null,
      brand: brand
        ? {
            _id: brand._id,
            name: brand.name,
            slug: brand.slug,
            status: brand.status,
          }
        : null,
      variants: variantDocuments.map((document) => document.toObject() as ProductVariant),
    });
  }
}
