import { Router } from 'express';

import { validateImageContent } from '../../../../../middleware/image-uploads/image-content.validation.middleware.js';
import { uploadImage } from '../../../../../middleware/image-uploads/image-upload.middleware.js';
import { validateBody } from '../../../../../middleware/validateBody.js';
import { validateParams } from '../../../../../middleware/validateParams.js';
import {
  addProductImageSchema,
  productImageParamsSchema,
  reorderProductImagesSchema,
  updateProductImageSchema,
} from '../schemas/product-image.schema.js';
import { sellerProductIdParamsSchema } from '../../management/schemas/product.schema.js';
import {
  deleteSellerProductImage,
  listSellerProductImages,
  reorderSellerProductImages,
  updateSellerProductImage,
  uploadAndRegisterProductImage,
} from '../controllers/product-image.controller.js';

/** Creates product image routes mounted under the authenticated seller products router. */
export function createProductImageRouter(): Router {
  const router = Router();

  router.get(
    '/:productId/images',
    validateParams(sellerProductIdParamsSchema),
    listSellerProductImages,
  );

  router.post(
    '/:productId/images',
    validateParams(sellerProductIdParamsSchema),
    uploadImage,
    validateImageContent,
    validateBody(addProductImageSchema),
    uploadAndRegisterProductImage,
  );

  router.patch(
    '/:productId/images/reorder',
    validateParams(sellerProductIdParamsSchema),
    validateBody(reorderProductImagesSchema),
    reorderSellerProductImages,
  );

  router.patch(
    '/:productId/images/:imageId',
    validateParams(productImageParamsSchema),
    validateBody(updateProductImageSchema),
    updateSellerProductImage,
  );

  router.delete(
    '/:productId/images/:imageId',
    validateParams(productImageParamsSchema),
    deleteSellerProductImage,
  );

  return router;
}

export default createProductImageRouter;
