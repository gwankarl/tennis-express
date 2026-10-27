import { Router } from 'express';

import { createRequireAuthentication } from '../../../../../middleware/auth/require-authentication.js';
import { createRequireRole } from '../../../../../middleware/auth/require-role.js';
import { validateQuery } from '../../../../../middleware/validateQuery.js';
import { validateParams } from '../../../../../middleware/validateParams.js';
import { validateBody } from '../../../../../middleware/validateBody.js';

import {
  approveAdminProduct,
  getAdminProduct,
  listAdminProducts,
  rejectAdminProduct,
  requestAdminProductChanges,
} from '../controllers/admin-product-moderation.controller.js';
import {
  adminProductIdParamsSchema,
  adminProductListQuerySchema,
  rejectAdminProductSchema,
  requestAdminProductChangesSchema,
} from '../schemas/admin-product-moderation.schema.js';

/** Creates administrator-only product moderation routes. */
export function createAdminProductModerationRouter(): Router {
  const router = Router();

  router.use(createRequireAuthentication(), createRequireRole(['admin']));

  router.get('/', validateQuery(adminProductListQuerySchema), listAdminProducts);

  router.get('/:productId', validateParams(adminProductIdParamsSchema), getAdminProduct);

  router.patch(
    '/:productId/approve',
    validateParams(adminProductIdParamsSchema),
    approveAdminProduct,
  );

  router.patch(
    '/:productId/reject',
    validateParams(adminProductIdParamsSchema),
    validateBody(rejectAdminProductSchema),
    rejectAdminProduct,
  );

  router.patch(
    '/:productId/request-changes',
    validateParams(adminProductIdParamsSchema),
    validateBody(requestAdminProductChangesSchema),
    requestAdminProductChanges,
  );

  return router;
}

export default createAdminProductModerationRouter;
