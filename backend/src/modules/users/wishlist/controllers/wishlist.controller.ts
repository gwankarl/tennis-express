import type { RequestHandler } from 'express';

import { AppError } from '../../../../shared/errors/AppError.js';
import type { PaginationQuery } from '../../../../shared/pagination.js';
import { WishlistService } from '../services/wishlist.service.js';
import { AddWishlistItemRequest, WishlistProductIdParams } from '../schemas/wishlist.schema.js';

const wishlistService = new WishlistService();

/** Lists saved products for the authenticated account. */
export const getMyWishlist: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth?.userId) {
      throw new AppError({
        statusCode: 401,
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required to access the wishlist.',
      });
    }

    const query = res.locals.validatedQuery as PaginationQuery;
    const result = await wishlistService.getMyWishlist(req.auth.userId, query);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/** Adds a publicly visible product to the authenticated user's wishlist. */
export const addWishlistItem: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth?.userId) {
      throw new AppError({
        statusCode: 401,
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required to update the wishlist.',
      });
    }

    // validateBody parses and replaces req.body before this handler runs.
    const input = req.body as AddWishlistItemRequest;
    const result = await wishlistService.addItem(req.auth.userId, input.productId);

    res.status(result.created ? 201 : 200).json({
      success: true,
      data: { item: result.item },
    });
  } catch (error) {
    next(error);
  }
};

/** Removes a saved product belonging to the authenticated user. */
export const removeWishlistItem: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth?.userId) {
      throw new AppError({
        statusCode: 401,
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required to update the wishlist.',
      });
    }

    const { productId } = req.params as unknown as WishlistProductIdParams;
    await wishlistService.removeItem(req.auth.userId, productId);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

/** Checks whether a product is saved by the authenticated user. */
export const getWishlistItemStatus: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth?.userId) {
      throw new AppError({
        statusCode: 401,
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required to check wishlist status.',
      });
    }

    const { productId } = req.params as unknown as WishlistProductIdParams;
    const result = await wishlistService.getItemStatus(req.auth.userId, productId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
