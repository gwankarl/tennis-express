import {
  buildPaginationMetadata,
  getPaginationOffset,
  type PaginationMetadata,
  type PaginationQuery,
} from '../../../../../shared/pagination.js';
import { BrandModel } from '../../../../admin/brands/models/brand.model.js';
import { CategoryModel } from '../../../../admin/categories/models/category.model.js';
import type { CategoryAttribute } from '../../../../admin/categories/types/category.types.js';

export interface SellerProductCatalogCategory {
  _id: string;
  name: string;
  slug: string;
  parentId: string | null;
  sortOrder: number;
  attributes: CategoryAttribute[];
}

export interface SellerProductCatalogBrand {
  _id: string;
  name: string;
  slug: string;
}

export interface SellerProductCatalogCategoryList {
  categories: SellerProductCatalogCategory[];
  pagination: PaginationMetadata;
}

export interface SellerProductCatalogBrandList {
  brands: SellerProductCatalogBrand[];
  pagination: PaginationMetadata;
}

/** Reads active category and brand options for seller product editing. */
export class ProductCatalogService {
  /** Lists active categories and their attribute definitions in display order. */
  async listActiveCategories(query: PaginationQuery): Promise<SellerProductCatalogCategoryList> {
    const filter = { status: 'active' as const };

    const [documents, totalItems] = await Promise.all([
      CategoryModel.find(filter)
        .select('name slug parentId sortOrder attributes')
        .sort({ parentId: 1, sortOrder: 1, name: 1, _id: 1 })
        .skip(getPaginationOffset(query))
        .limit(query.limit)
        .lean()
        .exec(),
      CategoryModel.countDocuments(filter).exec(),
    ]);

    return {
      categories: documents.map((category) => ({
        _id: category._id.toString(),
        name: category.name,
        slug: category.slug,
        parentId: category.parentId?.toString() ?? null,
        sortOrder: category.sortOrder,
        attributes: category.attributes,
      })),
      pagination: buildPaginationMetadata(query, totalItems),
    };
  }

  /** Lists active brands in name order. */
  async listActiveBrands(query: PaginationQuery): Promise<SellerProductCatalogBrandList> {
    const filter = { status: 'active' as const };

    const [documents, totalItems] = await Promise.all([
      BrandModel.find(filter)
        .select('name slug')
        .sort({ name: 1, _id: 1 })
        .skip(getPaginationOffset(query))
        .limit(query.limit)
        .lean()
        .exec(),
      BrandModel.countDocuments(filter).exec(),
    ]);

    return {
      brands: documents.map((brand) => ({
        _id: brand._id.toString(),
        name: brand.name,
        slug: brand.slug,
      })),
      pagination: buildPaginationMetadata(query, totalItems),
    };
  }
}
