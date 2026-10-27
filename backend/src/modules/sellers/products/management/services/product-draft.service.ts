import mongoose from 'mongoose';

import { AppError } from '../../../../../shared/errors/AppError.js';
import { UserModel } from '../../../../users/profiles/models/user.model.js';
import { SellerApplicationModel } from '../../../../users/seller-applications/models/seller-application.model.js';
import { StoreModel } from '../../../store/models/store.model.js';
import { ProductModel } from '../models/product.model.js';
import type { CreateProductDraftRequest } from '../schemas/product.schema.js';
import type { Product } from '../types/product.types.js';

/** Creates incomplete product drafts for an approved seller's own storefront. */
export class ProductDraftService {
  async createDraft(sellerId: string, input: CreateProductDraftRequest): Promise<Product> {
    if (!mongoose.isValidObjectId(sellerId)) {
      throw new AppError({
        statusCode: 400,
        code: 'INVALID_SELLER_ID',
        message: 'A valid seller ID is required.',
      });
    }

    const sellerObjectId = new mongoose.Types.ObjectId(sellerId);

    const seller = await UserModel.findOne({
      _id: sellerObjectId,
      status: 'active',
      deletedAt: null,
    })
      .select('roles')
      .lean()
      .exec();

    if (!seller || !seller.roles.includes('seller')) {
      throw new AppError({
        statusCode: 403,
        code: 'SELLER_ACCOUNT_NOT_ELIGIBLE',
        message: 'An active seller account is required to create product drafts.',
      });
    }

    const approvedApplication = await SellerApplicationModel.exists({
      applicantId: sellerObjectId,
      status: 'approved',
    });

    if (!approvedApplication) {
      throw new AppError({
        statusCode: 403,
        code: 'SELLER_APPLICATION_NOT_APPROVED',
        message: 'An approved seller application is required to create product drafts.',
      });
    }

    const store = await StoreModel.findOne({ sellerId: sellerObjectId }).select('_id').exec();

    if (!store) {
      throw new AppError({
        statusCode: 404,
        code: 'STORE_NOT_FOUND',
        message: 'The authenticated seller storefront could not be found.',
      });
    }

    const product = await ProductModel.create({
      sellerId: sellerObjectId,
      storeId: store._id,
      ...(input.name === undefined ? {} : { name: input.name }),
      ...(input.description === undefined ? {} : { description: input.description }),
      ...(input.categoryId === undefined
        ? {}
        : { categoryId: new mongoose.Types.ObjectId(input.categoryId) }),
      ...(input.brandId === undefined
        ? {}
        : {
            brandId: input.brandId === null ? null : new mongoose.Types.ObjectId(input.brandId),
          }),
      ...(input.condition === undefined ? {} : { condition: input.condition }),
      options: input.options ?? [],
      attributes: input.attributes ?? {},
      moderationStatus: 'not_submitted',
      publicationStatus: 'draft',
      publishedAt: null,
    });

    return product.toObject() as Product;
  }
}
