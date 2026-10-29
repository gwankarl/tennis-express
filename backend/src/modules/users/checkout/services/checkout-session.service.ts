import mongoose from 'mongoose';

import { AppError } from '../../../../shared/errors/AppError.js';
import { CartModel } from '../../cart/models/cart.model.js';
import type { Cart } from '../../cart/types/cart.types.js';
import { reserveVariantStock } from '../helpers/checkout-stock-reservation.helper.js';
import { buildCheckoutSessionSnapshot } from '../helpers/checkout-session-snapshot.helper.js';
import { CheckoutSessionModel } from '../models/checkout-session.model.js';
import type { CreateCheckoutSessionRequest } from '../schemas/checkout-session.schema.js';
import type { CheckoutSession } from '../types/checkout-session.types.js';

const STOCK_RESERVATION_DURATION_MS = 15 * 60 * 1000;

/** Creates an owned checkout session and reserves its selected inventory atomically. */
export class CheckoutSessionService {
  async create(userId: string, input: CreateCheckoutSessionRequest): Promise<CheckoutSession> {
    const ownerId = new mongoose.Types.ObjectId(userId);
    const transaction = await mongoose.startSession();
    let createdSession: CheckoutSession | null = null;

    try {
      await transaction.withTransaction(async () => {
        const cart = await CartModel.findOne({ userId: ownerId })
          .session(transaction)
          .lean<Cart>()
          .exec();

        if (!cart) {
          throw new AppError({
            statusCode: 404,
            code: 'CART_NOT_FOUND',
            message: 'The selected cart items could not be found.',
          });
        }

        const now = new Date();
        const expiresAt = new Date(now.getTime() + STOCK_RESERVATION_DURATION_MS);
        const snapshot = await buildCheckoutSessionSnapshot(
          cart,
          input.cartItemIds,
          transaction,
          now,
        );

        const [sessionDocument] = await CheckoutSessionModel.create(
          [
            {
              userId: ownerId,
              status: 'active',
              lines: snapshot.lines,
              sellerGroups: snapshot.sellerGroups,
              quote: snapshot.quote,
              acknowledgedQuoteVersion: null,
              expiresAt,
              confirmedPurchaseId: null,
            },
          ],
          { session: transaction },
        );

        // Reserve once per variant, even if legacy cart data has duplicate lines.
        const quantitiesByVariant = new Map<string, number>();

        for (const line of snapshot.lines) {
          const variantId = line.variantId.toString();
          quantitiesByVariant.set(
            variantId,
            (quantitiesByVariant.get(variantId) ?? 0) + line.quantity,
          );
        }

        for (const [variantId, quantity] of quantitiesByVariant) {
          await reserveVariantStock(
            {
              checkoutSessionId: sessionDocument._id,
              variantId: new mongoose.Types.ObjectId(variantId),
              quantity,
              expiresAt,
            },
            transaction,
          );
        }

        createdSession = sessionDocument.toObject() as CheckoutSession;
      });
    } finally {
      await transaction.endSession();
    }

    if (!createdSession) {
      throw new AppError({
        statusCode: 500,
        code: 'CHECKOUT_SESSION_CREATE_FAILED',
        message: 'The checkout session could not be created.',
      });
    }

    return createdSession;
  }

  /** Returns a checkout session only when it belongs to the authenticated user. */
  async getById(userId: string, sessionId: string): Promise<CheckoutSession> {
    const checkoutSession = await CheckoutSessionModel.findOne({
      _id: new mongoose.Types.ObjectId(sessionId),
      userId: new mongoose.Types.ObjectId(userId),
    })
      .lean<CheckoutSession>()
      .exec();

    if (!checkoutSession) {
      throw new AppError({
        statusCode: 404,
        code: 'CHECKOUT_SESSION_NOT_FOUND',
        message: 'The checkout session could not be found.',
      });
    }

    return checkoutSession;
  }
}
