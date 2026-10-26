import { Router } from 'express';

import { createRequireAuthentication } from '../../../../middleware/auth/require-authentication.js';
import { createRequireRole } from '../../../../middleware/auth/require-role.js';
import { validateQuery } from '../../../../middleware/validateQuery.js';
import { validateParams } from '../../../../middleware/validateParams.js';
import { validateBody } from '../../../../middleware/validateBody.js';
import {
  getAdminStore,
  listAdminStores,
  updateAdminStoreStatus,
} from '../controllers/admin-store.controller.js';
import {
  adminStoreIdParamsSchema,
  adminStoreListQuerySchema,
  adminStoreStatusSchema,
} from '../schemas/admin-store.schema.js';

/** Creates administrator-only store management endpoints. */
export function createAdminStoreRouter(): Router {
  const router = Router();

  router.use(createRequireAuthentication(), createRequireRole(['admin']));

  router.get('/', validateQuery(adminStoreListQuerySchema), listAdminStores);

  router.get('/:storeId', validateParams(adminStoreIdParamsSchema), getAdminStore);

  router.patch(
    '/:storeId/status',
    validateParams(adminStoreIdParamsSchema),
    validateBody(adminStoreStatusSchema),
    updateAdminStoreStatus,
  );

  return router;
}

export default createAdminStoreRouter;
