import type { RequestHandler } from 'express';

import type { PaginationQuery } from '../../../shared/pagination.js';
import { PublicStoreService } from '../services/public-store.service.js';

const publicStoreService = new PublicStoreService();

/** Lists active storefronts using validated pagination parameters. */
export const listPublicStores: RequestHandler = async (req, res, next) => {
  try {
    const query = res.locals.validatedQuery as PaginationQuery;
    const result = await publicStoreService.list(query);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/** Retrieves one active public storefront by its validated slug. */
export const getPublicStoreBySlug: RequestHandler = async (req, res, next) => {
  try {
    const store = await publicStoreService.getBySlug(req.params.slug as string);

    res.status(200).json({
      success: true,
      data: { store },
    });
  } catch (error) {
    next(error);
  }
};
