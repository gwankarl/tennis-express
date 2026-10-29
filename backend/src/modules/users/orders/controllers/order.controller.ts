import type { RequestHandler } from 'express';

import { AppError } from '../../../../shared/errors/AppError.js';
import type { OrderIdParams } from '../schemas/order.schema.js';
import { OrderService } from '../services/order.service.js';

const orderService = new OrderService();

/** Returns an order only to its seller or the customer who owns its purchase. */
export const getAccessibleOrder: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth?.userId) {
      throw new AppError({
        statusCode: 401,
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required to access orders.',
      });
    }

    const { orderId } = req.params as unknown as OrderIdParams;
    const order = await orderService.getAccessibleOrder(req.auth.userId, orderId);

    if (!order) {
      throw new AppError({
        statusCode: 404,
        code: 'ORDER_NOT_FOUND',
        message: 'The order could not be found.',
      });
    }

    res.status(200).json({
      success: true,
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};
