import {
  buildPaginationMetadata,
  getPaginationOffset,
  type PaginationMetadata,
  type PaginationQuery,
} from '../../../shared/pagination.js';
import { StoreModel } from '../../sellers/store/models/store.model.js';

import { AppError } from '../../../shared/errors/AppError.js';
import type { Store } from '../../sellers/store/types/store.types.js';
import type { PublicStore } from '../types/public-store.types.js';

/** Reads active storefronts for the public store directory. */
export class PublicStoreService {
  async list(input: PaginationQuery): Promise<{
    stores: PublicStore[];
    pagination: PaginationMetadata;
  }> {
    const [storeDocuments, totalItems] = await Promise.all([
      StoreModel.find({ status: 'active' })
        .select(
          'name slug description location.region location.city logo.secureUrl fulfilmentProfile deliveryOptions collectionOptions returnPolicy ratingSummary',
        )
        .sort({ name: 1, _id: 1 })
        .skip(getPaginationOffset(input))
        .limit(input.limit)
        .lean()
        .exec(),
      StoreModel.countDocuments({ status: 'active' }).exec(),
    ]);

    const stores: PublicStore[] = storeDocuments.map((store) => this.toPublicStore(store as Store));

    return {
      stores,
      pagination: buildPaginationMetadata(input, totalItems),
    };
  }

  async getBySlug(slug: string): Promise<PublicStore> {
    const store = await StoreModel.findOne({
      slug,
      status: 'active',
    })
      .select(
        'name slug description location.region location.city logo.secureUrl fulfilmentProfile deliveryOptions collectionOptions returnPolicy ratingSummary',
      )
      .exec();

    if (!store) {
      throw new AppError({
        statusCode: 404,
        code: 'STORE_NOT_FOUND',
        message: 'The requested storefront could not be found.',
      });
    }

    return this.toPublicStore(store.toObject() as Store);
  }

  private toPublicStore(store: Store): PublicStore {
    return {
      id: store._id.toString(),
      name: store.name,
      slug: store.slug,
      description: store.description,
      location: {
        region: store.location.region,
        city: store.location.city,
      },
      logo: store.logo ? { secureUrl: store.logo.secureUrl } : null,
      fulfilmentProfile: store.fulfilmentProfile,
      deliveryOptions: store.deliveryOptions,
      collectionOptions: store.collectionOptions,
      returnPolicy: store.returnPolicy,
      ratingSummary: store.ratingSummary,
    };
  }
}
