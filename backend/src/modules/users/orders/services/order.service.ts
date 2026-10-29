import mongoose from 'mongoose';

import { PurchaseModel } from '../../purchases/models/purchase.model.js';
import { OrderModel } from '../models/order.model.js';
import type { Order } from '../types/order.types.js';

export class OrderService {
  /**
   * Returns an order to its seller or to the customer who owns its purchase.
   * Returns null for both missing and inaccessible orders to avoid revealing
   * whether another user's order exists.
   */
  async getAccessibleOrder(userId: string, orderId: string): Promise<Order | null> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const orderObjectId = new mongoose.Types.ObjectId(orderId);

    const order = await OrderModel.findById(orderObjectId).lean<Order>().exec();

    if (!order) {
      return null;
    }

    if (order.sellerId.equals(userObjectId)) {
      return order;
    }

    const customerOwnsPurchase = await PurchaseModel.exists({
      _id: order.purchaseId,
      userId: userObjectId,
    }).exec();

    return customerOwnsPurchase ? order : null;
  }
}
