import { Router } from 'express';

import { createRequireAuthentication } from '../../../../middleware/auth/require-authentication.js';
import { validateQuery } from '../../../../middleware/validateQuery.js';
import { paginationQuerySchema } from '../../../../shared/pagination.js';
import { createSellerApplicationController } from '../controllers/seller-application.controller.js';
import { parseSellerApplicationMultipart } from '../middleware/seller-application-upload.middleware.js';

/** Creates authenticated seller application endpoints. */
export function createSellerApplicationsRouter(): Router {
  const router = Router();
  const controller = createSellerApplicationController();

  router.use(createRequireAuthentication());

  router.post('/', parseSellerApplicationMultipart, controller.submitApplication);

  // Put fixed paths before parameterized paths to avoid matching "me" as an ID.
  router.get('/me/history', validateQuery(paginationQuerySchema), controller.getMyApplications);
  router.get('/me', controller.getLatestApplication);

  router.post(
    '/:applicationId/resubmit',
    parseSellerApplicationMultipart,
    controller.resubmitApplication,
  );

  return router;
}

export default createSellerApplicationsRouter();
