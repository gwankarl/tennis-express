import type { RequestHandler } from 'express';

import { PublicCategoryService } from '../services/public-category.service.js';

const publicCategoryService = new PublicCategoryService();

/** Returns active categories for public navigation. */
export const listPublicCategories: RequestHandler = async (_req, res, next) => {
  try {
    const categories = await publicCategoryService.list();

    res.status(200).json({
      success: true,
      data: { categories },
    });
  } catch (error) {
    next(error);
  }
};
