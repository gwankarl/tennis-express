import { Router } from 'express';

import { createRequireAuthentication } from '../../../../middleware/auth/require-authentication.js';
import {
  createMyAddress,
  deleteMyAddress,
  listMyAddresses,
  updateMyAddress,
} from '../controllers/address.controller.js';
import { validateBody } from '../../../../middleware/validateBody.js';
import {
  addressIdParamsSchema,
  createAddressSchema,
  updateAddressSchema,
} from '../schemas/address.schema.js';
import { validateParams } from '../../../../middleware/validateParams.js';

/** Creates authenticated customer address endpoints. */
export function createAddressRouter(): Router {
  const router = Router();

  router.use(createRequireAuthentication());

  router.get('/', listMyAddresses);

  router.post('/', validateBody(createAddressSchema), createMyAddress);

  router.patch(
    '/:addressId',
    validateParams(addressIdParamsSchema),
    validateBody(updateAddressSchema),
    updateMyAddress,
  );

  router.delete('/:addressId', validateParams(addressIdParamsSchema), deleteMyAddress);

  return router;
}
