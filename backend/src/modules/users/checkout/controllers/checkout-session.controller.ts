import type { RequestHandler } from 'express';

import { AppError } from '../../../../shared/errors/AppError.js';
import type {
  AcknowledgeCheckoutChangesRequest,
  CheckoutSessionIdParams,
  CreateCheckoutSessionRequest,
  FulfillmentOptionsQuery,
  UpdateCheckoutFulfillmentRequest,
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

/** Lists current fulfillment options for each seller in an owned checkout session. */
export const getCheckoutFulfillmentOptions: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth?.userId) {
      throw new AppError({
        statusCode: 401,
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required to access checkout.',
      });
    }

    const { sessionId } = req.params as unknown as CheckoutSessionIdParams;
    const query = res.locals.validatedQuery as FulfillmentOptionsQuery;

    const fulfillmentOptions = await checkoutSessionService.getFulfillmentOptions(
      req.auth.userId,
      sessionId,
      query.destinationRegion,
    );

    res.status(200).json({
      success: true,
      data: { fulfillmentOptions },
    });
  } catch (error) {
    next(error);
  }
};

/** Updates fulfillment choices for seller groups in an owned checkout session. */
export const updateCheckoutFulfillment: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth?.userId) {
      throw new AppError({
        statusCode: 401,
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required to update checkout.',
      });
    }

    const { sessionId } = req.params as unknown as CheckoutSessionIdParams;
    const input = req.body as UpdateCheckoutFulfillmentRequest;
    const checkoutSession = await checkoutSessionService.updateFulfillment(
      req.auth.userId,
      sessionId,
      input,
    );

    res.status(200).json({
      success: true,
      data: { checkoutSession },
    });
  } catch (error) {
    next(error);
  }
};

/** Revalidates an owned checkout session and renews its stock reservations. */
export const revalidateCheckoutSession: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth?.userId) {
      throw new AppError({
        statusCode: 401,
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required to revalidate checkout.',
      });
    }

    const { sessionId } = req.params as unknown as CheckoutSessionIdParams;
    const result = await checkoutSessionService.revalidate(req.auth.userId, sessionId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/** Records the customer's acceptance of the current checkout quote. */
export const acknowledgeCheckoutChanges: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth?.userId) {
      throw new AppError({
        statusCode: 401,
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required to acknowledge checkout changes.',
      });
    }

    const { sessionId } = req.params as unknown as CheckoutSessionIdParams;
    const input = req.body as AcknowledgeCheckoutChangesRequest;
    const checkoutSession = await checkoutSessionService.acknowledgeChanges(
      req.auth.userId,
      sessionId,
      input,
    );

    res.status(200).json({
      success: true,
      data: { checkoutSession },
    });
  } catch (error) {
    next(error);
  }
};

/** Confirms checkout and returns its purchase, seller orders, and payment handoff. */
export const confirmCheckoutSession: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth?.userId) {
      throw new AppError({
        statusCode: 401,
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required to confirm checkout.',
      });
    }

    const { sessionId } = req.params as unknown as CheckoutSessionIdParams;
    const result = await checkoutSessionService.confirm(req.auth.userId, sessionId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/** Cancels an unconfirmed checkout session and releases its active stock holds. */
export const cancelCheckoutSession: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth?.userId) {
      throw new AppError({
        statusCode: 401,
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required to cancel checkout.',
      });
    }

    const { sessionId } = req.params as unknown as CheckoutSessionIdParams;
    const checkoutSession = await checkoutSessionService.cancel(req.auth.userId, sessionId);

    res.status(200).json({
      success: true,
      data: { checkoutSession },
    });
  } catch (error) {
    next(error);
  }
};
