import { Router } from 'express';

import { createRequireAuthentication } from '../../../../middleware/auth/require-authentication.js';
import {
  getMyCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
  validateMyCart,
} from '../controllers/cart.controller.js';
import { validateBody } from '../../../../middleware/validateBody.js';
import { validateParams } from '../../../../middleware/validateParams.js';
import {
  addCartItemSchema,
  cartItemIdParamsSchema,
  updateCartItemSchema,
} from '../schemas/cart.schema.js';
/** Creates authenticated cart endpoints. */
export function createCartRouter(): Router {
  const router = Router();

  router.use(createRequireAuthentication());

  router.get('/', getMyCart);

  router.post('/items', validateBody(addCartItemSchema), addCartItem);

  router.post('/validate', validateMyCart);

  router.patch(
    '/items/:itemId',
    validateParams(cartItemIdParamsSchema),
    validateBody(updateCartItemSchema),
    updateCartItem,
  );

  router.delete('/items/:itemId', validateParams(cartItemIdParamsSchema), removeCartItem);

  router.delete('/items', clearCart);

  return router;
}
