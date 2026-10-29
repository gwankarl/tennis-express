import type { ClientSession, Types } from 'mongoose';

import { AppError } from '../../../../shared/errors/AppError.js';
import { ProductVariantModel } from '../../../sellers/products/variants/models/product-variant.model.js';
import { StockReservationModel } from '../models/stock-reservation.model.js';
import type { StockReservation } from '../types/stock-reservation.types.js';

/** Releases active session reservations and restores their stock atomically. */
export async function releaseCheckoutStockReservations(
  checkoutSessionId: Types.ObjectId,
  session: ClientSession,
): Promise<void> {
  const reservations = await StockReservationModel.find({
    checkoutSessionId,
    status: 'active',
  })
    .session(session)
    .lean<StockReservation[]>()
    .exec();

  for (const reservation of reservations) {
    const releaseResult = await StockReservationModel.updateOne(
      {
        _id: reservation._id,
        status: 'active',
      },
      { $set: { status: 'released' } },
    )
      .session(session)
      .exec();

    // Another successful cancellation may already have released this hold.
    if (releaseResult.modifiedCount !== 1) {
      continue;
    }

    const stockResult = await ProductVariantModel.updateOne(
      {
        _id: reservation.variantId,
        stockQuantity: {
          $lte: Number.MAX_SAFE_INTEGER - reservation.quantity,
        },
      },
      { $inc: { stockQuantity: reservation.quantity } },
    )
      .session(session)
      .exec();

    if (stockResult.modifiedCount !== 1) {
      throw new AppError({
        statusCode: 500,
        code: 'CHECKOUT_STOCK_RESTORATION_FAILED',
        message: 'Reserved stock could not be restored.',
      });
    }
  }
}
