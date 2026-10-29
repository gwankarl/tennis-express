import { Router } from 'express';

import { validateQuery } from '../../../middleware/validateQuery.js';
import { validateParams } from '../../../middleware/validateParams.js';
import {
  getPublicProductById,
  getPublicProductFilters,
  listPublicProducts,
} from '../controllers/public-product.controller.js';
import {
  listPublicProductsQuerySchema,
  publicProductFiltersQuerySchema,
  publicProductIdParamsSchema,
} from '../schemas/public-product.schema.js';

/** Creates public product discovery endpoints. */
export function createPublicProductsRouter(): Router {
  const router = Router();

  router.get('/filters', validateQuery(publicProductFiltersQuerySchema), getPublicProductFilters);
  router.get('/', validateQuery(listPublicProductsQuerySchema), listPublicProducts);
  router.get('/:productId', validateParams(publicProductIdParamsSchema), getPublicProductById);

  return router;
}

export default createPublicProductsRouter;
