import { Router } from 'express';

import { createRequireAuthentication } from '../../../../middleware/auth/require-authentication.js';
import { createRequireRole } from '../../../../middleware/auth/require-role.js';
import { validateBody } from '../../../../middleware/validateBody.js';
import { validateQuery } from '../../../../middleware/validateQuery.js';
import { validateParams } from '../../../../middleware/validateParams.js';

import {
  createSellerPromotionSchema,
  listSellerPromotionsQuerySchema,
  sellerPromotionIdParamsSchema,
  updateSellerPromotionSchema,
} from '../schemas/seller-promotion.schema.js';

import {
  cancelSellerPromotion,
  createSellerPromotion,
  getSellerPromotion,
  listSellerPromotions,
  updateSellerPromotion,
} from '../controllers/seller-promotion.controller.js';

/** Creates authenticated seller promotion endpoints. */
export function createSellerPromotionsRouter(): Router {
  const router = Router();

  router.use(createRequireAuthentication(), createRequireRole(['seller']));

  router.get('/', validateQuery(listSellerPromotionsQuerySchema), listSellerPromotions);

  router.get('/:promotionId', validateParams(sellerPromotionIdParamsSchema), getSellerPromotion);

  router.patch(
    '/:promotionId',
    validateParams(sellerPromotionIdParamsSchema),
    validateBody(updateSellerPromotionSchema),
    updateSellerPromotion,
  );

  router.post(
    '/:promotionId/cancel',
    validateParams(sellerPromotionIdParamsSchema),
    cancelSellerPromotion,
  );

  router.post('/', validateBody(createSellerPromotionSchema), createSellerPromotion);

  return router;
}

export default createSellerPromotionsRouter;
