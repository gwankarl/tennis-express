import { Router } from 'express';

import { createRequireAuthentication } from '../../../../middleware/auth/require-authentication.js';
import { createRequireRole } from '../../../../middleware/auth/require-role.js';
import {
  getOwnStore,
  updateOwnStore,
  updateOwnStoreLogo,
  updateOwnStoreStatus,
} from '../controllers/seller-store.controller.js';
import { validateBody } from '../../../../middleware/validateBody.js';
import {
  updateSellerStoreSchema,
  updateSellerStoreStatusSchema,
} from '../schemas/seller-store.schema.js';
import { uploadImage } from '../../../../middleware/image-uploads/image-upload.middleware.js';
import { validateImageContent } from '../../../../middleware/image-uploads/image-content.validation.middleware.js';

/** Creates authenticated seller storefront endpoints. */
export function createSellerStoreRouter(): Router {
  const router = Router();

  router.use(createRequireAuthentication(), createRequireRole(['seller']));

  router.get('/', getOwnStore);

  router.patch('/', validateBody(updateSellerStoreSchema), updateOwnStore);

  router.patch('/logo', uploadImage, validateImageContent, updateOwnStoreLogo);

  router.patch('/status', validateBody(updateSellerStoreStatusSchema), updateOwnStoreStatus);

  return router;
}

export default createSellerStoreRouter;
