import type { ClientSession, Types } from 'mongoose';

import { AppError } from '../../../../shared/errors/AppError.js';
import { ProductVariantModel } from '../../../sellers/products/variants/models/product-variant.model.js';
import { StockReservationModel } from '../models/stock-reservation.model.js';

interface CreateStockReservationInput {
  checkoutSessionId: Types.ObjectId;
  variantId: Types.ObjectId;
  quantity: number;
  expiresAt: Date;
}

/**
 * Atomically claims available stock and records its reservation.
 * Call only inside the transaction that creates the checkout session.
 */
export async function reserveVariantStock(
  input: CreateStockReservationInput,
  session: ClientSession,
): Promise<void> {
  const stockUpdate = await ProductVariantModel.updateOne(
    {
      _id: input.variantId,
      status: 'active',
      stockQuantity: { $gte: input.quantity },
    },
    {
      $inc: { stockQuantity: -input.quantity },
    },
  )
    .session(session)
    .exec();

  if (stockUpdate.modifiedCount !== 1) {
    throw new AppError({
      statusCode: 409,
      code: 'CHECKOUT_INSUFFICIENT_STOCK',
      message: 'A selected product variant no longer has enough stock.',
    });
  }

  await StockReservationModel.create(
    [
      {
        checkoutSessionId: input.checkoutSessionId,
        variantId: input.variantId,
        quantity: input.quantity,
        status: 'active',
        expiresAt: input.expiresAt,
      },
    ],
    { session },
  );
}
