import type { RequestHandler } from 'express';

import { PublicBrandService } from '../services/public-brand.service.js';

const publicBrandService = new PublicBrandService();

/** Returns active brands for public browsing. */
export const listPublicBrands: RequestHandler = async (_req, res, next) => {
  try {
    const brands = await publicBrandService.list();

    res.status(200).json({
      success: true,
      data: { brands },
    });
  } catch (error) {
    next(error);
  }
};
