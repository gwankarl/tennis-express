import { Router } from 'express';

import { createRequireAuthentication } from '../../../../middleware/auth/require-authentication.js';
import { validateParams } from '../../../../middleware/validateParams.js';
import { getAccessibleOrder } from '../controllers/order.controller.js';
import { orderIdParamsSchema } from '../schemas/order.schema.js';

/** Creates the authenticated seller and customer order endpoint. */
export function createOrderRouter(): Router {
  const router = Router();

  router.use(createRequireAuthentication());
  router.get('/:orderId', validateParams(orderIdParamsSchema), getAccessibleOrder);

  return router;
}
