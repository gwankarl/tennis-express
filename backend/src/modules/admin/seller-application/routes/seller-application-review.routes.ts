import { Router } from 'express';

import { createRequireAuthentication } from '../../../../middleware/auth/require-authentication.js';
import { createRequireRole } from '../../../../middleware/auth/require-role.js';
import { validateBody } from '../../../../middleware/validateBody.js';
import { validateParams } from '../../../../middleware/validateParams.js';
import { validateQuery } from '../../../../middleware/validateQuery.js';
import {
  applicationIdParamsSchema,
  adminSellerApplicationsQuerySchema,
  rejectSellerApplicationSchema,
} from '../schemas/seller-application-review.schema.js';
import {
  approveApplication,
  getApplicationById,
  listApplications,
  rejectApplication,
} from '../controllers/seller-application-review.controller.js';

/** Creates administrator-only seller application review endpoints. */
export function createAdminSellerApplicationReviewRouter(): Router {
  const router = Router();

  router.use(createRequireAuthentication(), createRequireRole(['admin']));

  router.get('/', validateQuery(adminSellerApplicationsQuerySchema), listApplications);

  router.get('/:applicationId', validateParams(applicationIdParamsSchema), getApplicationById);

  router.patch(
    '/:applicationId/approve',
    validateParams(applicationIdParamsSchema),
    approveApplication,
  );

  router.patch(
    '/:applicationId/reject',
    validateParams(applicationIdParamsSchema),
    validateBody(rejectSellerApplicationSchema),
    rejectApplication,
  );

  return router;
}

export default createAdminSellerApplicationReviewRouter();
