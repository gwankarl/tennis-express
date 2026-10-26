import { Router } from 'express';

import { validateQuery } from '../../../middleware/validateQuery.js';
import { validateParams } from '../../../middleware/validateParams.js';
import { getPublicStoreBySlug, listPublicStores } from '../controllers/public-store.controller.js';
import {
  listPublicStoresQuerySchema,
  publicStoreSlugParamsSchema,
} from '../schemas/public-store.schema.js';

/** Creates public storefront listing endpoints. */
export function createPublicStoresRouter(): Router {
  const router = Router();

  router.get('/', validateQuery(listPublicStoresQuerySchema), listPublicStores);

  router.get('/:slug', validateParams(publicStoreSlugParamsSchema), getPublicStoreBySlug);

  return router;
}

export default createPublicStoresRouter;
