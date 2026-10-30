import { Router } from 'express';

import { listPublicBrands } from '../controllers/public-brand.controller.js';

/** Creates public brand browsing endpoints. */
export function createPublicBrandsRouter(): Router {
  const router = Router();

  router.get('/', listPublicBrands);

  return router;
}

export default createPublicBrandsRouter;
