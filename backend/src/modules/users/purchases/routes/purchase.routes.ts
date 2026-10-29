import { Router } from 'express';

import { createRequireAuthentication } from '../../../../middleware/auth/require-authentication.js';
import { validateQuery } from '../../../../middleware/validateQuery.js';
import { getMyPurchase, listMyPurchases } from '../controllers/purchase.controller.js';
import { listPurchasesQuerySchema, purchaseIdParamsSchema } from '../schemas/purchase.schema.js';
import { validateParams } from '../../../../middleware/validateParams.js';

/** Creates authenticated customer purchase endpoints. */
export function createPurchaseRouter(): Router {
  const router = Router();

  router.use(createRequireAuthentication());

  router.get('/', validateQuery(listPurchasesQuerySchema), listMyPurchases);

  router.get('/:purchaseId', validateParams(purchaseIdParamsSchema), getMyPurchase);

  return router;
}
