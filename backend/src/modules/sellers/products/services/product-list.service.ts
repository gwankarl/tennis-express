import mongoose, { type QueryFilter } from 'mongoose';

import {
  buildPaginationMetadata,
  getPaginationOffset,
  type PaginationMetadata,
} from '../../../../shared/pagination.js';
import { AppError } from '../../../../shared/errors/AppError.js';
import { ProductModel } from '../models/product.model.js';
import type { ListSellerProductsQuery } from '../schemas/product.schema.js';
import type { Product } from '../types/product.types.js';

export interface SellerProductListResult {
  products: Product[];
  pagination: PaginationMetadata;
}

/** Retrieves a seller's products with pagination and supported filters. */
export class ProductListService {
  async listOwnProducts(
    sellerId: string,
    query: ListSellerProductsQuery,
  ): Promise<SellerProductListResult> {
    if (!mongoose.isValidObjectId(sellerId)) {
      throw new AppError({
        statusCode: 400,
        code: 'INVALID_SELLER_ID',
        message: 'A valid seller ID is required.',
      });
    }

    const sellerObjectId = new mongoose.Types.ObjectId(sellerId);
    const filter: QueryFilter<Product> = {
      sellerId: sellerObjectId,
    };

    if (query.publicationStatus !== undefined) {
      filter.publicationStatus = query.publicationStatus;
    }

    if (query.moderationStatus !== undefined) {
      filter.moderationStatus = query.moderationStatus;
    }

    if (query.condition !== undefined) {
      filter.condition = query.condition;
    }

    const [documents, totalItems] = await Promise.all([
      ProductModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(getPaginationOffset(query))
        .limit(query.limit)
        .exec(),
      ProductModel.countDocuments(filter).exec(),
    ]);

    return {
      products: documents.map((document) => document.toObject() as Product),
      pagination: buildPaginationMetadata(query, totalItems),
    };
  }
}
