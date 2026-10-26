import { Router } from 'express';

import { createRequireAuthentication } from '../../../../middleware/auth/require-authentication.js';
import { createRequireRole } from '../../../../middleware/auth/require-role.js';
import { validateBody } from '../../../../middleware/validateBody.js';
import { validateParams } from '../../../../middleware/validateParams.js';
import { validateQuery } from '../../../../middleware/validateQuery.js';
import {
  createBrand,
  getBrand,
  listBrands,
  updateBrand,
  updateBrandStatus,
} from '../controllers/brand-management.controller.js';
import {
  brandIdParamsSchema,
  createBrandSchema,
  listBrandsQuerySchema,
  updateBrandSchema,
  updateBrandStatusSchema,
} from '../schemas/brand-management.schema.js';
import { uploadImage } from '../../../../middleware/image-uploads/image-upload.middleware.js';
import { validateImageContent } from '../../../../middleware/image-uploads/image-content.validation.middleware.js';

/** Creates administrator-only brand management endpoints. */
export function createBrandManagementRouter(): Router {
  const router = Router();

  router.use(createRequireAuthentication(), createRequireRole(['admin']));

  router.get('/', validateQuery(listBrandsQuerySchema), listBrands);

  router.get('/:brandId', validateParams(brandIdParamsSchema), getBrand);

  router.post('/', uploadImage, validateImageContent, validateBody(createBrandSchema), createBrand);

  router.patch(
    '/:brandId/status',
    validateParams(brandIdParamsSchema),
    validateBody(updateBrandStatusSchema),
    updateBrandStatus,
  );

  router.patch(
    '/:brandId',
    validateParams(brandIdParamsSchema),
    uploadImage,
    validateImageContent,
    validateBody(updateBrandSchema),
    updateBrand,
  );

  return router;
}

export default createBrandManagementRouter;
