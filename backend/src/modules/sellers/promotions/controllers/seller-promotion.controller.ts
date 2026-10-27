import type { RequestHandler } from 'express';

import { AppError } from '../../../../shared/errors/AppError.js';
import type {
  CreateSellerPromotionRequest,
  ListSellerPromotionsQuery,
  SellerPromotionIdParams,
  UpdateSellerPromotionRequest,
} from '../schemas/seller-promotion.schema.js';
import { SellerPromotionService } from '../services/seller-promotion.service.js';

const sellerPromotionService = new SellerPromotionService();

/** Creates a promotion for the authenticated seller. */
export const createSellerPromotion: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth?.userId) {
      throw new AppError({
        statusCode: 401,
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required to create a promotion.',
      });
    }

    // validateBody parses and replaces req.body before this handler runs.
    const input = req.body as CreateSellerPromotionRequest;
    const promotion = await sellerPromotionService.createPromotion(req.auth.userId, input);

    res.status(201).json({
      success: true,
      data: { promotion },
    });
  } catch (error) {
    next(error);
  }
};

/** Lists promotions owned by the authenticated seller. */
export const listSellerPromotions: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth?.userId) {
      throw new AppError({
        statusCode: 401,
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required to access seller promotions.',
      });
    }

    const query = res.locals.validatedQuery as ListSellerPromotionsQuery;
    const result = await sellerPromotionService.listOwnPromotions(req.auth.userId, query);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/** Retrieves a promotion owned by the authenticated seller. */
export const getSellerPromotion: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth?.userId) {
      throw new AppError({
        statusCode: 401,
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required to access seller promotions.',
      });
    }

    const { promotionId } = req.params as unknown as SellerPromotionIdParams;
    const promotion = await sellerPromotionService.getOwnPromotion(req.auth.userId, promotionId);

    res.status(200).json({
      success: true,
      data: { promotion },
    });
  } catch (error) {
    next(error);
  }
};

/** Updates an editable promotion owned by the authenticated seller. */
export const updateSellerPromotion: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth?.userId) {
      throw new AppError({
        statusCode: 401,
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required to update a promotion.',
      });
    }

    const { promotionId } = req.params as unknown as SellerPromotionIdParams;
    const changes = req.body as UpdateSellerPromotionRequest;
    const promotion = await sellerPromotionService.updateOwnPromotion(
      req.auth.userId,
      promotionId,
      changes,
    );

    res.status(200).json({
      success: true,
      data: { promotion },
    });
  } catch (error) {
    next(error);
  }
};

/** Cancels a promotion owned by the authenticated seller. */
export const cancelSellerPromotion: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth?.userId) {
      throw new AppError({
        statusCode: 401,
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required to cancel a promotion.',
      });
    }

    const { promotionId } = req.params as unknown as SellerPromotionIdParams;
    const promotion = await sellerPromotionService.cancelOwnPromotion(req.auth.userId, promotionId);

    res.status(200).json({
      success: true,
      data: { promotion },
    });
  } catch (error) {
    next(error);
  }
};
