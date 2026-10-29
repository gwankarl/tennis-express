import { AppError } from '../../../../shared/errors/AppError.js';
import type { Store } from '../../../sellers/store/types/store.types.js';
import type { Order } from '../../orders/types/order.types.js';
import type { Purchase } from '../../purchases/types/purchase.types.js';
import type { CheckoutLineSnapshot, CheckoutSession } from '../types/checkout-session.types.js';

type NewPurchase = Omit<Purchase, '_id' | 'createdAt' | 'updatedAt'>;
type NewOrder = Omit<Order, '_id' | 'createdAt' | 'updatedAt' | 'purchaseId'>;

export interface CheckoutConfirmationDocuments {
  purchase: NewPurchase;
  orders: NewOrder[];
}

/** Builds immutable purchase and per-seller order snapshots from a checkout session. */
export function buildCheckoutConfirmationDocuments(
  checkoutSession: CheckoutSession,
  storesBySellerId: Map<string, Store>,
  confirmedAt: Date,
): CheckoutConfirmationDocuments {
  const assignedCartItemIds = new Set<string>();
  const orders: NewOrder[] = [];

  for (const sellerGroup of checkoutSession.sellerGroups) {
    if (!sellerGroup.fulfillment) {
      throw new AppError({
        statusCode: 409,
        code: 'CHECKOUT_FULFILLMENT_REQUIRED',
        message: 'Choose a fulfillment option for every seller before confirming checkout.',
      });
    }

    const store = storesBySellerId.get(sellerGroup.sellerId.toString());

    if (!store || store.status !== 'active') {
      throw new AppError({
        statusCode: 409,
        code: 'CHECKOUT_STORE_UNAVAILABLE',
        message: 'A seller store in this checkout is no longer available.',
      });
    }

    const groupCartItemIds = sellerGroup.cartItemIds.map((id) => id.toString());
    const groupCartItemIdSet = new Set(groupCartItemIds);

    if (groupCartItemIdSet.size !== groupCartItemIds.length) {
      throw new AppError({
        statusCode: 409,
        code: 'CHECKOUT_SESSION_INVALID',
        message: 'A seller group contains duplicate cart items.',
      });
    }

    const lines = checkoutSession.lines.filter((line) =>
      groupCartItemIdSet.has(line.cartItemId.toString()),
    );

    if (
      lines.length !== groupCartItemIds.length ||
      lines.some(
        (line) => !line.sellerId.equals(sellerGroup.sellerId) || !line.storeId.equals(store._id),
      ) ||
      groupCartItemIds.some((id) => assignedCartItemIds.has(id))
    ) {
      throw new AppError({
        statusCode: 409,
        code: 'CHECKOUT_SESSION_INVALID',
        message: 'Checkout lines do not match their seller groups.',
      });
    }

    for (const id of groupCartItemIds) {
      assignedCartItemIds.add(id);
    }

    const subtotal = lines.reduce((sum, line) => sum + line.subtotal, 0);
    const discount = lines.reduce((sum, line) => sum + line.discount, 0);
    const fulfillmentFee = sellerGroup.fulfillment.fee;
    const total = subtotal - discount + fulfillmentFee;

    if (![subtotal, discount, fulfillmentFee, total].every(Number.isSafeInteger)) {
      throw new AppError({
        statusCode: 422,
        code: 'CHECKOUT_TOTAL_OUT_OF_RANGE',
        message: 'A seller order total exceeds the supported XAF amount.',
      });
    }

    orders.push({
      checkoutSessionId: checkoutSession._id,
      sellerId: sellerGroup.sellerId,
      storeId: store._id,
      storeName: store.name,
      status: 'pending_payment',
      lines: lines.map((line: CheckoutLineSnapshot) => ({
        productId: line.productId,
        variantId: line.variantId,
        productName: line.productName,
        variantName: line.variantName,
        sku: line.sku,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        promotion: line.promotion,
        subtotal: line.subtotal,
        discount: line.discount,
        total: line.total,
      })),
      fulfillment: sellerGroup.fulfillment,
      currency: checkoutSession.quote.currency,
      subtotal,
      discount,
      fulfillmentFee,
      total,
    });
  }

  const allCartItemIds = new Set(checkoutSession.lines.map((line) => line.cartItemId.toString()));

  if (
    assignedCartItemIds.size !== allCartItemIds.size ||
    [...allCartItemIds].some((id) => !assignedCartItemIds.has(id))
  ) {
    throw new AppError({
      statusCode: 409,
      code: 'CHECKOUT_SESSION_INVALID',
      message: 'Some checkout lines are not assigned to a seller group.',
    });
  }

  const subtotal = orders.reduce((sum, order) => sum + order.subtotal, 0);
  const discount = orders.reduce((sum, order) => sum + order.discount, 0);
  const fulfillmentTotal = orders.reduce((sum, order) => sum + order.fulfillmentFee, 0);
  const total = orders.reduce((sum, order) => sum + order.total, 0);

  if (
    ![subtotal, discount, fulfillmentTotal, total].every(Number.isSafeInteger) ||
    subtotal !== checkoutSession.quote.subtotal ||
    discount !== checkoutSession.quote.discount ||
    fulfillmentTotal !== checkoutSession.quote.fulfillmentTotal ||
    total !== checkoutSession.quote.total
  ) {
    throw new AppError({
      statusCode: 409,
      code: 'CHECKOUT_QUOTE_INVALID',
      message: 'Revalidate checkout before confirming it.',
    });
  }

  return {
    purchase: {
      checkoutSessionId: checkoutSession._id,
      userId: checkoutSession.userId,
      status: 'pending_payment',
      currency: checkoutSession.quote.currency,
      subtotal,
      discount,
      fulfillmentTotal,
      total,
      confirmedAt,
    },
    orders,
  };
}
