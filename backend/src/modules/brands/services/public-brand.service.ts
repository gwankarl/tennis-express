import type { Types } from 'mongoose';

import { BrandModel } from '../../admin/brands/models/brand.model.js';
import type { PublicBrand } from '../types/public-brand.types.js';

interface PublicBrandDocument {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  logo: {
    secureUrl: string;
  } | null;
}

/** Reads active brand fields needed by public pages. */
export class PublicBrandService {
  async list(): Promise<PublicBrand[]> {
    const brands = await BrandModel.find({ status: 'active' })
      .select('_id name slug logo.secureUrl')
      .sort({ name: 1, _id: 1 })
      .lean<PublicBrandDocument[]>()
      .exec();

    return brands.map((brand) => ({
      id: brand._id.toString(),
      name: brand.name,
      slug: brand.slug,
      logo: brand.logo
        ? {
            secureUrl: brand.logo.secureUrl,
          }
        : null,
    }));
  }
}
