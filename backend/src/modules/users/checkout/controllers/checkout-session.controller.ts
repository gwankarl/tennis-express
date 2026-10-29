import type { RequestHandler } from 'express';

import { AppError } from '../../../../shared/errors/AppError.js';
import type {
  CheckoutSessionIdParams,
  CreateCheckoutSessionRequest,
} from '../schemas/checkout-session.schema.js';
import { CheckoutSessionService } from '../services/checkout-session.service.js';

const checkoutSessionService = new CheckoutSessionService();

/** Creates a checkout session for selected lines in the authenticated user's cart. */
export const createCheckoutSession: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth?.userId) {
      throw new AppError({
        statusCode: 401,
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required to start checkout.',
      });
    }

    const input = req.body as CreateCheckoutSessionRequest;
    const checkoutSession = await checkoutSessionService.create(req.auth.userId, input);

    res.status(201).json({
      success: true,
      data: { checkoutSession },
    });
  } catch (error) {
    next(error);
  }
};

/** Returns a checkout session owned by the authenticated user. */
export const getCheckoutSession: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth?.userId) {
      throw new AppError({
        statusCode: 401,
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required to access checkout.',
      });
    }

    const { sessionId } = req.params as unknown as CheckoutSessionIdParams;
    const checkoutSession = await checkoutSessionService.getById(req.auth.userId, sessionId);

    res.status(200).json({
      success: true,
      data: { checkoutSession },
    });
  } catch (error) {
    next(error);
  }
};
