import { Router } from 'express';

import { validateBody } from '../../../../../middleware/validateBody.js';
import { validateParams } from '../../../../../middleware/validateParams.js';
import { validateQuery } from '../../../../../middleware/validateQuery.js';
import { sellerProductIdParamsSchema } from '../../management/schemas/product.schema.js';
import {
  createProductVariant,
  getProductVariant,
  listProductVariants,
  updateProductVariant,
  updateProductVariantStatus,
} from '../controllers/product-variant.controller.js';
import {
  createProductVariantSchema,
  listProductVariantsQuerySchema,
  productVariantParamsSchema,
  updateProductVariantSchema,
  updateProductVariantStatusSchema,
} from '../schemas/product-variant.schema.js';

/** Creates the product-variant routes mounted under the seller products router. */
export function createProductVariantRouter(): Router {
  const router = Router();

  router.get(
    '/:productId/variants/:variantId',
    validateParams(productVariantParamsSchema),
    getProductVariant,
  );

  router.get(
    '/:productId/variants',
    validateParams(sellerProductIdParamsSchema),
    validateQuery(listProductVariantsQuerySchema),
    listProductVariants,
  );

  router.post(
    '/:productId/variants',
    validateParams(sellerProductIdParamsSchema),
    validateBody(createProductVariantSchema),
    createProductVariant,
  );

  router.patch(
    '/:productId/variants/:variantId',
    validateParams(productVariantParamsSchema),
    validateBody(updateProductVariantSchema),
    updateProductVariant,
  );

  router.patch(
    '/:productId/variants/:variantId/status',
    validateParams(productVariantParamsSchema),
    validateBody(updateProductVariantStatusSchema),
    updateProductVariantStatus,
  );

  return router;
}

export default createProductVariantRouter;
