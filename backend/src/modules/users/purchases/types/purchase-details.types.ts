import type { Order } from '../../orders/types/order.types.js';
import type { Purchase } from './purchase.types.js';

/** One customer purchase and its seller-specific order snapshots. */
export interface PurchaseDetailsResult {
  purchase: Purchase;
  orders: Order[];
}
