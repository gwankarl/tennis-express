import { Router } from 'express';

import { createRequireAuthentication } from '../../../../middleware/auth/require-authentication.js';
import { validateBody } from '../../../../middleware/validateBody.js';
import {
  acknowledgeCheckoutChanges,
  cancelCheckoutSession,
  confirmCheckoutSession,
  createCheckoutSession,
  getCheckoutFulfillmentOptions,
  getCheckoutSession,
  revalidateCheckoutSession,
  updateCheckoutFulfillment,
} from '../controllers/checkout-session.controller.js';
import {
  acknowledgeCheckoutChangesSchema,
  checkoutSessionIdParamsSchema,
  createCheckoutSessionSchema,
  fulfillmentOptionsQuerySchema,
  updateCheckoutFulfillmentSchema,
} from '../schemas/checkout-session.schema.js';
import { validateParams } from '../../../../middleware/validateParams.js';
import { validateQuery } from '../../../../middleware/validateQuery.js';

/** Creates authenticated checkout-session endpoints. */
export function createCheckoutSessionRouter(): Router {
  const router = Router();

  router.use(createRequireAuthentication());

  router.get('/:sessionId', validateParams(checkoutSessionIdParamsSchema), getCheckoutSession);

  router.get(
    '/:sessionId/fulfillment-options',
    validateParams(checkoutSessionIdParamsSchema),
    validateQuery(fulfillmentOptionsQuerySchema),
    getCheckoutFulfillmentOptions,
  );

  router.post(
    '/:sessionId/revalidate',
    validateParams(checkoutSessionIdParamsSchema),
    revalidateCheckoutSession,
  );

  router.post(
    '/:sessionId/acknowledge-changes',
    validateParams(checkoutSessionIdParamsSchema),
    validateBody(acknowledgeCheckoutChangesSchema),
    acknowledgeCheckoutChanges,
  );

  router.post(
    '/:sessionId/confirm',
    validateParams(checkoutSessionIdParamsSchema),
    confirmCheckoutSession,
  );

  router.patch(
    '/:sessionId/fulfillment',
    validateParams(checkoutSessionIdParamsSchema),
    validateBody(updateCheckoutFulfillmentSchema),
    updateCheckoutFulfillment,
  );

  router.post(
    '/:sessionId/cancel',
    validateParams(checkoutSessionIdParamsSchema),
    cancelCheckoutSession,
  );

  router.post('/', validateBody(createCheckoutSessionSchema), createCheckoutSession);

  return router;
}
