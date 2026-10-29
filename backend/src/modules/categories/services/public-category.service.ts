import type { Types } from 'mongoose';

import { CategoryModel } from '../../admin/categories/models/category.model.js';
import type { PublicCategory } from '../types/public-category.types.js';

interface PublicCategoryDocument {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  parentId: Types.ObjectId | null;
  image: {
    secureUrl: string;
  };
  sortOrder: number;
}

/** Reads active category fields needed for public navigation. */
export class PublicCategoryService {
  async list(): Promise<PublicCategory[]> {
    const categories = await CategoryModel.find({ status: 'active' })
      .select('_id name slug parentId image.secureUrl sortOrder')
      .sort({ parentId: 1, sortOrder: 1, name: 1, _id: 1 })
      .lean<PublicCategoryDocument[]>()
      .exec();

    return categories.map((category) => ({
      id: category._id.toString(),
      name: category.name,
      slug: category.slug,
      parentId: category.parentId?.toString() ?? null,
      image: {
        secureUrl: category.image.secureUrl,
      },
      sortOrder: category.sortOrder,
    }));
  }
}
