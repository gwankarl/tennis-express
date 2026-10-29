import { Router } from 'express';

import { validateQuery } from '../../../middleware/validateQuery.js';
import { listPublicProducts } from '../controllers/public-product.controller.js';
import { listPublicProductsQuerySchema } from '../schemas/public-product.schema.js';

/** Creates public product discovery routes. */
export function createPublicProductsRouter(): Router {
  const router = Router();

  router.get('/', validateQuery(listPublicProductsQuerySchema), listPublicProducts);

  return router;
}

export default createPublicProductsRouter;
