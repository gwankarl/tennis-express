import type { Order } from '../../orders/types/order.types.js';
import type { Purchase } from '../../purchases/types/purchase.types.js';

/** Indicates that payment must be completed through a later payment flow. */
export interface CheckoutPaymentHandoff {
  status: 'payment_required';
  purchaseId: string;
  amount: number;
  currency: 'XAF';
  reservationExpiresAt: Date;
}

/** Result returned by checkout confirmation, including its seller orders. */
export interface CheckoutConfirmationResult {
  purchase: Purchase;
  orders: Order[];
  paymentHandoff: CheckoutPaymentHandoff;
}
