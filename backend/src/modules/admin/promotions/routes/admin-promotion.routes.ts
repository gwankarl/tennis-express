import { Router } from 'express';

import { createRequireAuthentication } from '../../../../middleware/auth/require-authentication.js';
import { createRequireRole } from '../../../../middleware/auth/require-role.js';

import { validateQuery } from '../../../../middleware/validateQuery.js';
import { validateParams } from '../../../../middleware/validateParams.js';
import { validateBody } from '../../../../middleware/validateBody.js';

import {
  cancelAdminMarketplaceCampaign,
  createAdminMarketplaceCampaign,
  getAdminPromotion,
  listAdminPromotions,
  updateAdminMarketplaceCampaign,
} from '../controllers/admin-promotion.controller.js';
import {
  adminPromotionIdParamsSchema,
  adminPromotionListQuerySchema,
  createAdminMarketplaceCampaignSchema,
  updateAdminMarketplaceCampaignSchema,
} from '../schemas/admin-promotion.schema.js';

/** Creates administrator-only promotion management routes. */
export function createAdminPromotionsRouter(): Router {
  const router = Router();

  router.use(createRequireAuthentication(), createRequireRole(['admin']));

  router.get('/', validateQuery(adminPromotionListQuerySchema), listAdminPromotions);

  router.get('/:promotionId', validateParams(adminPromotionIdParamsSchema), getAdminPromotion);

  router.post(
    '/',
    validateBody(createAdminMarketplaceCampaignSchema),
    createAdminMarketplaceCampaign,
  );

  router.patch(
    '/:promotionId',
    validateParams(adminPromotionIdParamsSchema),
    validateBody(updateAdminMarketplaceCampaignSchema),
    updateAdminMarketplaceCampaign,
  );

  router.post(
    '/:promotionId/cancel',
    validateParams(adminPromotionIdParamsSchema),
    cancelAdminMarketplaceCampaign,
  );

  return router;
}

export default createAdminPromotionsRouter;
