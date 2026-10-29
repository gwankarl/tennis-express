import { Router } from 'express';

import { createRequireAuthentication } from '../../../../middleware/auth/require-authentication.js';
import { validateQuery } from '../../../../middleware/validateQuery.js';
import { paginationQuerySchema } from '../../../../shared/pagination.js';
import {
  addWishlistItem,
  getMyWishlist,
  getWishlistItemStatus,
  removeWishlistItem,
} from '../controllers/wishlist.controller.js';
import { validateBody } from '../../../../middleware/validateBody.js';
import {
  addWishlistItemSchema,
  wishlistProductIdParamsSchema,
} from '../schemas/wishlist.schema.js';
import { validateParams } from '../../../../middleware/validateParams.js';

/** Creates authenticated wishlist endpoints. */
export function createWishlistRouter(): Router {
  const router = Router();

  router.use(createRequireAuthentication());

  router.get('/', validateQuery(paginationQuerySchema), getMyWishlist);

  router.get(
    '/items/:productId',
    validateParams(wishlistProductIdParamsSchema),
    getWishlistItemStatus,
  );

  router.post('/items', validateBody(addWishlistItemSchema), addWishlistItem);

  router.delete(
    '/items/:productId',
    validateParams(wishlistProductIdParamsSchema),
    removeWishlistItem,
  );

  return router;
}

export default createWishlistRouter;
