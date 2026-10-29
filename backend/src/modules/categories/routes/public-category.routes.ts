import { Router } from 'express';

import { listPublicCategories } from '../controllers/public-category.controller.js';

/** Creates public category navigation endpoints. */
export function createPublicCategoriesRouter(): Router {
  const router = Router();

  router.get('/', listPublicCategories);

  return router;
}
