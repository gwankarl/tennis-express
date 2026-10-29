import type { RequestHandler } from 'express';

import { AppError } from '../../../../shared/errors/AppError.js';
import type { ListPurchasesQuery, PurchaseIdParams } from '../schemas/purchase.schema.js';
import { PurchaseService } from '../services/purchase.service.js';

const purchaseService = new PurchaseService();

/** Lists purchases belonging to the authenticated customer. */
export const listMyPurchases: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth?.userId) {
      throw new AppError({
        statusCode: 401,
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required to access purchases.',
      });
    }

    const query = res.locals.validatedQuery as ListPurchasesQuery;
    const result = await purchaseService.listMine(req.auth.userId, query);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/** Returns a customer's purchase and its seller orders. */
export const getMyPurchase: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth?.userId) {
      throw new AppError({
        statusCode: 401,
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required to access purchases.',
      });
    }

    const { purchaseId } = req.params as unknown as PurchaseIdParams;
    const result = await purchaseService.getMineById(req.auth.userId, purchaseId);

    if (!result) {
      throw new AppError({
        statusCode: 404,
        code: 'PURCHASE_NOT_FOUND',
        message: 'The purchase could not be found.',
      });
    }

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
