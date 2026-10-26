import { Router } from 'express';

import { createRequireAuthentication } from '../../../../middleware/auth/require-authentication.js';
import { createRequireRole } from '../../../../middleware/auth/require-role.js';
import { validateBody } from '../../../../middleware/validateBody.js';
import { validateParams } from '../../../../middleware/validateParams.js';
import { validateQuery } from '../../../../middleware/validateQuery.js';
import {
  createCategory,
  listCategories,
  updateCategory,
} from '../controllers/category-management.controller.js';
import {
  createCategorySchema,
  listCategoriesQuerySchema,
  updateCategoryParamsSchema,
  updateCategorySchema,
} from '../schemas/category.schema.js';
import { uploadImage } from '../../../../middleware/image-uploads/image-upload.middleware.js';
import { validateImageContent } from '../../../../middleware/image-uploads/image-content.validation.middleware.js';
import { parseCategoryMultipartData } from '../middleware/category-multipart.middleware.js';

/** Creates administrator-only category management endpoints. */
export function createCategoryManagementRouter(): Router {
  const router = Router();

  router.use(createRequireAuthentication(), createRequireRole(['admin']));

  router.get('/', validateQuery(listCategoriesQuerySchema), listCategories);

  router.post(
    '/',
    uploadImage,
    validateImageContent,
    parseCategoryMultipartData,
    validateBody(createCategorySchema),
    createCategory,
  );

  router.patch(
    '/:categoryId',
    validateParams(updateCategoryParamsSchema),
    uploadImage,
    validateImageContent,
    parseCategoryMultipartData,
    validateBody(updateCategorySchema),
    updateCategory,
  );

  return router;
}

export default createCategoryManagementRouter;
