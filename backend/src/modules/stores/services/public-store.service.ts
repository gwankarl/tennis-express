import {
  buildPaginationMetadata,
  getPaginationOffset,
  type PaginationMetadata,
} from '../../../shared/pagination.js';
import { AppError } from '../../../shared/errors/AppError.js';
import { StoreModel } from '../../sellers/store/models/store.model.js';
import type { Store } from '../../sellers/store/types/store.types.js';
import {
  buildPublicStoreListFilter,
  buildPublicStoreListSort,
} from '../helpers/public-store-query.helper.js';
import { mapPublicStore } from '../helpers/public-store.mapper.js';
import type { ListPublicStoresQuery } from '../schemas/public-store.schema.js';
import type { PublicStore } from '../types/public-store.types.js';
import { PublicProductService } from '../../products/services/public-product.service.js';
import { ListPublicProductsQuery } from '../../products/schemas/public-product.schema.js';
import { PublicProductListResult } from '../../products/types/public-product.types.js';

const publicProductService = new PublicProductService();

const PUBLIC_STORE_SELECT =
  'name slug description location.region location.city logo.secureUrl fulfilmentProfile deliveryOptions collectionOptions returnPolicy ratingSummary';

/** Reads active storefronts for the public store directory. */
export class PublicStoreService {
  async list(input: ListPublicStoresQuery): Promise<{
    stores: PublicStore[];
    pagination: PaginationMetadata;
  }> {
    const filter = buildPublicStoreListFilter(input);
    const sort = buildPublicStoreListSort(input.sort);

    const [storeDocuments, totalItems] = await Promise.all([
      StoreModel.find(filter)
        .select(PUBLIC_STORE_SELECT)
        .sort(sort)
        .skip(getPaginationOffset(input))
        .limit(input.limit)
        .lean()
        .exec(),
      StoreModel.countDocuments(filter).exec(),
    ]);

    const stores: PublicStore[] = storeDocuments.map((store) => mapPublicStore(store as Store));

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
      .select(PUBLIC_STORE_SELECT)
      .exec();

    if (!store) {
      throw new AppError({
        statusCode: 404,
        code: 'STORE_NOT_FOUND',
        message: 'The requested storefront could not be found.',
      });
    }

    return mapPublicStore(store.toObject() as Store);
  }

  async listProductsByStoreSlug(
    slug: string,
    query: ListPublicProductsQuery,
  ): Promise<PublicProductListResult> {
    const store = await StoreModel.findOne({
      slug,
      status: 'active',
    })
      .select('_id')
      .lean()
      .exec();

    if (!store) {
      throw new AppError({
        statusCode: 404,
        code: 'STORE_NOT_FOUND',
        message: 'The requested storefront could not be found.',
      });
    }

    return publicProductService.listForStore(store._id.toString(), query);
  }
}
