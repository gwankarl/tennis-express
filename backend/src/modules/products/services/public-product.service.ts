import mongoose from 'mongoose';

import { buildPaginationMetadata } from '../../../shared/pagination.js';
import { CategoryModel } from '../../admin/categories/models/category.model.js';
import { AppError } from '../../../shared/errors/AppError.js';
import { PRODUCT_CONDITIONS } from '../../sellers/products/management/types/product.types.js';
import { ProductModel } from '../../sellers/products/management/models/product.model.js';
import { getPublicProductFilterOptions } from '../helpers/public-product-filter-options.helper.js';
import { mapPublicProductCards } from '../helpers/public-product-card.mapper.js';
import { buildPublicProductListPipeline } from '../helpers/public-product-list.pipeline.js';
import { buildPublicProductNewArrivalsPipeline } from '../helpers/public-product-new-arrivals.pipeline.js';
import { buildPublicProductRelatedPipeline } from '../helpers/public-product-related.pipeline.js';
import { buildPublicProductQueryMatch } from '../helpers/public-product-query.helper.js';
import {
  PUBLIC_PRODUCT_AVAILABILITY_OPTIONS,
  PUBLIC_PRODUCT_SORT_OPTIONS,
  type PublicProductCard,
  type PublicProductFilterMetadata,
  type PublicProductListResult,
  type PublicProductDetail,
} from '../types/public-product.types.js';
import type {
  ListPublicProductsQuery,
  PublicProductFiltersQuery,
  PublicProductNewArrivalsQuery,
  PublicProductPopularQuery,
  PublicProductRelatedQuery,
} from '../schemas/public-product.schema.js';
import { CategoryAttribute } from '../../admin/categories/types/category.types.js';
import {
  mapPublicProductDetail,
  type PublicProductDetailAggregateRow,
} from '../helpers/public-product-detail.mapper.js';
import { buildPublicProductDetailPipeline } from '../helpers/public-product-detail.pipeline.js';
import { buildPublicProductPopularPipeline } from '../helpers/public-product-popular.pipeline.js';

type ProductAggregateRow = Parameters<typeof mapPublicProductCards>[0][number];

interface PublicProductListAggregationResult {
  products: ProductAggregateRow[];
  count: Array<{ totalItems: number }>;
}

/** Reads public product listings and the metadata used to filter them. */
export class PublicProductService {
  async list(query: ListPublicProductsQuery): Promise<PublicProductListResult> {
    const productFilters = await buildPublicProductQueryMatch(query);
    return this.listWithFilters(query, productFilters);
  }

  /** Returns the newest publicly visible products. */
  async getNewArrivals(query: PublicProductNewArrivalsQuery): Promise<PublicProductCard[]> {
    const pipeline = buildPublicProductNewArrivalsPipeline(query);
    const products = await ProductModel.aggregate<ProductAggregateRow>(pipeline).exec();

    return mapPublicProductCards(products);
  }

  /** Returns publicly visible products ranked by recent views and wishlist additions. */
  async getPopular(query: PublicProductPopularQuery): Promise<PublicProductCard[]> {
    const pipeline = buildPublicProductPopularPipeline(query);
    const products = await ProductModel.aggregate<ProductAggregateRow>(pipeline).exec();

    return mapPublicProductCards(products);
  }

  /** Returns publicly visible products related to the requested product. */
  async getRelated(
    productId: string,
    query: PublicProductRelatedQuery,
  ): Promise<PublicProductCard[]> {
    const sourceProduct = await this.getById(productId);
    const pipeline = buildPublicProductRelatedPipeline(sourceProduct, query);
    const products = await ProductModel.aggregate<ProductAggregateRow>(pipeline).exec();

    return mapPublicProductCards(products);
  }

  async listForStore(
    storeId: string,
    query: ListPublicProductsQuery,
  ): Promise<PublicProductListResult> {
    const productFilters = await buildPublicProductQueryMatch(query);
    productFilters.storeId = new mongoose.Types.ObjectId(storeId);

    return this.listWithFilters(query, productFilters);
  }

  async getById(productId: string): Promise<PublicProductDetail> {
    const pipeline = buildPublicProductDetailPipeline(productId);
    const [product] =
      await ProductModel.aggregate<PublicProductDetailAggregateRow>(pipeline).exec();

    if (!product) {
      throw new AppError({
        statusCode: 404,
        code: 'PRODUCT_NOT_FOUND',
        message: 'The requested product could not be found.',
      });
    }

    return mapPublicProductDetail(product);
  }

  async getFilters(query: PublicProductFiltersQuery): Promise<PublicProductFilterMetadata> {
    const categoryQuery = query.categoryId
      ? CategoryModel.findOne({
          _id: new mongoose.Types.ObjectId(query.categoryId),
          status: 'active',
        })
          .select('attributes')
          .lean()
          .exec()
      : Promise.resolve(null);

    const [category, productOptions] = await Promise.all([
      categoryQuery,
      getPublicProductFilterOptions(query.categoryId),
    ]);

    return {
      brands: productOptions.brands,
      conditions: [...PRODUCT_CONDITIONS],
      priceRange: productOptions.priceRange
        ? { ...productOptions.priceRange, currency: 'XAF' }
        : null,
      availabilityOptions: [...PUBLIC_PRODUCT_AVAILABILITY_OPTIONS],
      sortOptions: [...PUBLIC_PRODUCT_SORT_OPTIONS],
      attributes: (category?.attributes ?? [])
        .filter((attribute: CategoryAttribute) => attribute.filterable === true)
        .map((attribute: CategoryAttribute) => ({
          name: attribute.name,
          slug: attribute.slug,
          type: attribute.type,
          required: attribute.required,
          options: attribute.type === 'select' ? attribute.options : [],
        })),
    };
  }

  private async listWithFilters(
    query: ListPublicProductsQuery,
    productFilters: Record<string, unknown>,
  ): Promise<PublicProductListResult> {
    const pipeline = buildPublicProductListPipeline(query, productFilters);

    const [result] =
      await ProductModel.aggregate<PublicProductListAggregationResult>(pipeline).exec();

    const products: PublicProductCard[] = mapPublicProductCards(result?.products ?? []);
    const totalItems = result?.count[0]?.totalItems ?? 0;

    return {
      products,
      pagination: buildPaginationMetadata(query, totalItems),
    };
  }
}
