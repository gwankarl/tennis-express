import { Router } from 'express';

import { createRequireAuthentication } from '../../../../middleware/auth/require-authentication.js';
import { validateBody } from '../../../../middleware/validateBody.js';
import {
  createCheckoutSession,
  getCheckoutSession,
} from '../controllers/checkout-session.controller.js';
import {
  checkoutSessionIdParamsSchema,
  createCheckoutSessionSchema,
} from '../schemas/checkout-session.schema.js';
import { validateParams } from '../../../../middleware/validateParams.js';

/** Creates authenticated checkout-session endpoints. */
export function createCheckoutSessionRouter(): Router {
  const router = Router();

  router.use(createRequireAuthentication());

  router.get('/:sessionId', validateParams(checkoutSessionIdParamsSchema), getCheckoutSession);

  router.post('/', validateBody(createCheckoutSessionSchema), createCheckoutSession);

  return router;
}
