import { Router } from 'express';

import { createRequireAuthentication } from '../../../../../middleware/auth/require-authentication.js';
import { createRequireRole } from '../../../../../middleware/auth/require-role.js';
import { validateBody } from '../../../../../middleware/validateBody.js';
import { validateQuery } from '../../../../../middleware/validateQuery.js';
import { validateParams } from '../../../../../middleware/validateParams.js';
import { paginationQuerySchema } from '../../../../../shared/pagination.js';
import {
  archiveSellerProduct,
  createProductDraft,
  deleteSellerProduct,
  getSellerProduct,
  listSellerProductBrands,
  listSellerProductCategories,
  listSellerProducts,
  publishSellerProduct,
  restoreSellerProduct,
  submitSellerProduct,
  updateSellerProduct,
} from '../controllers/product.controller.js';
import {
  createProductDraftSchema,
  listSellerProductsQuerySchema,
  sellerProductIdParamsSchema,
  updateSellerProductSchema,
} from '../schemas/product.schema.js';

import { createProductVariantRouter } from '../../variants/routes/product-variant.routes.js';
import { createProductImageRouter } from '../../images/routes/product-image.routes.js';

/** Creates authenticated seller product endpoints. */
export function createSellerProductsRouter(): Router {
  const router = Router();

  router.use(createRequireAuthentication(), createRequireRole(['seller']));

  router.use(createProductVariantRouter());
  router.use(createProductImageRouter());

  router.get('/', validateQuery(listSellerProductsQuerySchema), listSellerProducts);

  router.post(
    '/:productId/submit',
    validateParams(sellerProductIdParamsSchema),
    submitSellerProduct,
  );

  router.get(
    '/catalog/categories',
    validateQuery(paginationQuerySchema),
    listSellerProductCategories,
  );

  router.get('/catalog/brands', validateQuery(paginationQuerySchema), listSellerProductBrands);

  router.get('/:productId', validateParams(sellerProductIdParamsSchema), getSellerProduct);

  router.post('/', validateBody(createProductDraftSchema), createProductDraft);

  router.patch(
    '/:productId',
    validateParams(sellerProductIdParamsSchema),
    validateBody(updateSellerProductSchema),
    updateSellerProduct,
  );

  router.post(
    '/:productId/publish',
    validateParams(sellerProductIdParamsSchema),
    publishSellerProduct,
  );

  router.delete('/:productId', validateParams(sellerProductIdParamsSchema), deleteSellerProduct);

  router.post(
    '/:productId/archive',
    validateParams(sellerProductIdParamsSchema),
    archiveSellerProduct,
  );

  router.post(
    '/:productId/restore',
    validateParams(sellerProductIdParamsSchema),
    restoreSellerProduct,
  );

  return router;
}

export default createSellerProductsRouter;
