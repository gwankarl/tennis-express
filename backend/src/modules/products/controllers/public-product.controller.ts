import type { RequestHandler } from 'express';

import type { ListPublicProductsQuery } from '../schemas/public-product.schema.js';
import { PublicProductService } from '../services/public-product.service.js';

const publicProductService = new PublicProductService();

/** Lists publicly eligible products using validated pagination. */
export const listPublicProducts: RequestHandler = async (req, res, next) => {
  try {
    const query = res.locals.validatedQuery as ListPublicProductsQuery;
    const result = await publicProductService.list(query);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
