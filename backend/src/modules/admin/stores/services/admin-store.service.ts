import mongoose from 'mongoose';

import {
  buildPaginationMetadata,
  getPaginationOffset,
  type PaginationMetadata,
  type PaginationQuery,
} from '../../../../shared/pagination.js';
import { StoreModel } from '../../../sellers/store/models/store.model.js';
import { AppError } from '../../../../shared/errors/AppError.js';
import type { StoreStatus, Store } from '../../../sellers/store/types/store.types.js';
import type { AdminStoreDetails, AdminStoreListItem } from '../types/admin-store.types.js';
import { UserModel } from '../../../users/profiles/models/user.model.js';
import { SellerApplicationModel } from '../../../users/seller-applications/models/seller-application.model.js';

interface ListAdminStoresInput extends PaginationQuery {
  status?: StoreStatus;
}

/** Reads paginated store information for administrative oversight. */
export class AdminStoreService {
  async list(input: ListAdminStoresInput): Promise<{
    stores: AdminStoreListItem[];
    pagination: PaginationMetadata;
  }> {
    const filter = input.status ? { status: input.status } : {};

    const [storeDocuments, totalItems] = await Promise.all([
      StoreModel.find(filter)
        .select(
          'sellerId name slug description status location.region location.city logo.secureUrl ratingSummary createdAt updatedAt',
        )
        .sort({ status: 1, name: 1, _id: 1 })
        .skip(getPaginationOffset(input))
        .limit(input.limit)
        .lean()
        .exec(),
      StoreModel.countDocuments(filter).exec(),
    ]);

    const stores: AdminStoreListItem[] = storeDocuments.map((store) => ({
      id: store._id.toString(),
      sellerId: store.sellerId.toString(),
      name: store.name,
      slug: store.slug,
      description: store.description,
      status: store.status,
      location: {
        region: store.location.region,
        city: store.location.city,
      },
      logo: store.logo ? { secureUrl: store.logo.secureUrl } : null,
      ratingSummary: store.ratingSummary,
      createdAt: store.createdAt,
      updatedAt: store.updatedAt,
    }));

    return {
      stores,
      pagination: buildPaginationMetadata(input, totalItems),
    };
  }

  async getById(storeId: string): Promise<AdminStoreDetails> {
    if (!mongoose.isValidObjectId(storeId)) {
      throw new AppError({
        statusCode: 400,
        code: 'INVALID_STORE_ID',
        message: 'A valid store ID is required.',
      });
    }

    const store = await StoreModel.findById(storeId).exec();

    if (!store) {
      throw new AppError({
        statusCode: 404,
        code: 'STORE_NOT_FOUND',
        message: 'The store does not exist.',
      });
    }

    const { _id, sellerId, logo, ...storeFields } = store.toObject();

    return this.toAdminStoreDetails(store);
  }

  async updateStatus(storeId: string, status: StoreStatus): Promise<AdminStoreDetails> {
    if (!mongoose.isValidObjectId(storeId)) {
      throw new AppError({
        statusCode: 400,
        code: 'INVALID_STORE_ID',
        message: 'A valid store ID is required.',
      });
    }

    const store = await StoreModel.findById(storeId).exec();

    if (!store) {
      throw new AppError({
        statusCode: 404,
        code: 'STORE_NOT_FOUND',
        message: 'The store does not exist.',
      });
    }

    if (status === 'active' && store.status !== 'active') {
      const seller = await UserModel.findOne({
        _id: store.sellerId,
        deletedAt: null,
      })
        .select('status roles')
        .lean()
        .exec();

      if (!seller || seller.status !== 'active' || !seller.roles.includes('seller')) {
        throw new AppError({
          statusCode: 409,
          code: 'STORE_SELLER_NOT_ELIGIBLE',
          message: 'The seller account must be active and approved to reactivate this store.',
        });
      }

      const approvedApplication = await SellerApplicationModel.exists({
        applicantId: store.sellerId,
        status: 'approved',
      });

      if (!approvedApplication) {
        throw new AppError({
          statusCode: 409,
          code: 'STORE_SELLER_NOT_APPROVED',
          message: 'The seller must have an approved application to reactivate this store.',
        });
      }
    }

    store.status = status;
    await store.save();

    return this.toAdminStoreDetails(store);
  }

  private toAdminStoreDetails(store: { toObject: () => Store }): AdminStoreDetails {
    const { _id, sellerId, logo, ...storeFields } = store.toObject();

    return {
      ...storeFields,
      id: _id.toString(),
      sellerId: sellerId.toString(),
      logo: logo ? { secureUrl: logo.secureUrl } : null,
    };
  }
}
