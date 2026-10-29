import { Router } from 'express';

import { validateQuery } from '../../../middleware/validateQuery.js';
import { validateParams } from '../../../middleware/validateParams.js';
import {
  getPublicStoreBySlug,
  listPublicStoreProducts,
  listPublicStores,
} from '../controllers/public-store.controller.js';
import {
  listPublicStoresQuerySchema,
  publicStoreSlugParamsSchema,
} from '../schemas/public-store.schema.js';
import { listPublicProductsQuerySchema } from '../../products/schemas/public-product.schema.js';

/** Creates public storefront listing endpoints. */
export function createPublicStoresRouter(): Router {
  const router = Router();

  router.get('/', validateQuery(listPublicStoresQuerySchema), listPublicStores);

  router.get(
    '/:slug/products',
    validateParams(publicStoreSlugParamsSchema),
    validateQuery(listPublicProductsQuerySchema),
    listPublicStoreProducts,
  );

  router.get('/:slug', validateParams(publicStoreSlugParamsSchema), getPublicStoreBySlug);

  return router;
}

export default createPublicStoresRouter;
