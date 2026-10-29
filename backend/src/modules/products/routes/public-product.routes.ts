import { Router } from 'express';

import { validateQuery } from '../../../middleware/validateQuery.js';
import { validateParams } from '../../../middleware/validateParams.js';
import { createOptionalAuthentication } from '../../../middleware/auth/optional-authentication.js';
import {
  getPublicProductById,
  getPublicProductFilters,
  getRelatedPublicProducts,
  listPopularPublicProducts,
  listPublicNewArrivals,
  listPublicProducts,
} from '../controllers/public-product.controller.js';
import {
  listPublicProductsQuerySchema,
  publicProductFiltersQuerySchema,
  publicProductIdParamsSchema,
  publicProductNewArrivalsQuerySchema,
  publicProductPopularQuerySchema,
  publicProductRelatedQuerySchema,
} from '../schemas/public-product.schema.js';

/** Creates public product discovery endpoints. */
export function createPublicProductsRouter(): Router {
  const router = Router();

  router.get('/filters', validateQuery(publicProductFiltersQuerySchema), getPublicProductFilters);

  router.get('/', validateQuery(listPublicProductsQuerySchema), listPublicProducts);

  router.get(
    '/new-arrivals',
    validateQuery(publicProductNewArrivalsQuerySchema),
    listPublicNewArrivals,
  );

  router.get('/popular', validateQuery(publicProductPopularQuerySchema), listPopularPublicProducts);

  router.get(
    '/:productId/related',
    validateParams(publicProductIdParamsSchema),
    validateQuery(publicProductRelatedQuerySchema),
    getRelatedPublicProducts,
  );

  router.get(
    '/:productId',
    createOptionalAuthentication(),
    validateParams(publicProductIdParamsSchema),
    getPublicProductById,
  );

  return router;
}

export default createPublicProductsRouter;
