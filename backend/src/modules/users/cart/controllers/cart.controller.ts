import type { RequestHandler } from 'express';

import { AppError } from '../../../../shared/errors/AppError.js';
import { CartService } from '../services/cart.service.js';
import {
  AddCartItemRequest,
  CartItemIdParams,
  UpdateCartItemRequest,
} from '../schemas/cart.schema.js';

const cartService = new CartService();

/** Returns the authenticated user's cart. */
export const getMyCart: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth?.userId) {
      throw new AppError({
        statusCode: 401,
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required to access the cart.',
      });
    }

    const cart = await cartService.getMyCart(req.auth.userId);

    res.status(200).json({
      success: true,
      data: { cart },
    });
  } catch (error) {
    next(error);
  }
};

/** Adds a product variant to the authenticated user's cart. */
export const addCartItem: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth?.userId) {
      throw new AppError({
        statusCode: 401,
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required to update the cart.',
      });
    }

    // validateBody parses the request before this handler runs.
    const input = req.body as AddCartItemRequest;
    const cart = await cartService.addItem(req.auth.userId, input);

    res.status(201).json({
      success: true,
      data: { cart },
    });
  } catch (error) {
    next(error);
  }
};

/** Sets the quantity of one cart item owned by the authenticated user. */
export const updateCartItem: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth?.userId) {
      throw new AppError({
        statusCode: 401,
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required to update the cart.',
      });
    }

    const { itemId } = req.params as unknown as CartItemIdParams;
    const { quantity } = req.body as UpdateCartItemRequest;
    const cart = await cartService.updateItemQuantity(req.auth.userId, itemId, quantity);

    res.status(200).json({
      success: true,
      data: { cart },
    });
  } catch (error) {
    next(error);
  }
};

/** Removes one cart item owned by the authenticated user. */
export const removeCartItem: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth?.userId) {
      throw new AppError({
        statusCode: 401,
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required to update the cart.',
      });
    }

    const { itemId } = req.params as unknown as CartItemIdParams;
    const cart = await cartService.removeItem(req.auth.userId, itemId);

    res.status(200).json({
      success: true,
      data: { cart },
    });
  } catch (error) {
    next(error);
  }
};

/** Clears the authenticated user's cart. */
export const clearCart: RequestHandler = async (_req, res, next) => {
  try {
    if (!_req.auth?.userId) {
      throw new AppError({
        statusCode: 401,
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required to update the cart.',
      });
    }

    const cart = await cartService.clearCart(_req.auth.userId);

    res.status(200).json({
      success: true,
      data: { cart },
    });
  } catch (error) {
    next(error);
  }
};

/** Validates the authenticated user's cart against current products, stock, and promotions. */
export const validateMyCart: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth?.userId) {
      throw new AppError({
        statusCode: 401,
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required to validate the cart.',
      });
    }

    const validation = await cartService.validateCart(req.auth.userId);

    res.status(200).json({
      success: true,
      data: { validation },
    });
  } catch (error) {
    next(error);
  }
};
