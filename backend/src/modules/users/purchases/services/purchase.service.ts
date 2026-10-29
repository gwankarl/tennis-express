import mongoose from 'mongoose';

import { PurchaseModel } from '../models/purchase.model.js';
import type { ListPurchasesQuery } from '../schemas/purchase.schema.js';
import type { Purchase, PurchaseListResult } from '../types/purchase.types.js';
import { OrderModel } from '../../orders/models/order.model.js';
import type { Order } from '../../orders/types/order.types.js';
import type { PurchaseDetailsResult } from '../types/purchase-details.types.js';

/** Lists the authenticated customer's purchases, newest first. */
export class PurchaseService {
  async listMine(userId: string, query: ListPurchasesQuery): Promise<PurchaseListResult> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const filter = { userId: userObjectId };
    const skip = (query.page - 1) * query.limit;

    const [purchases, totalItems] = await Promise.all([
      PurchaseModel.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(query.limit)
        .lean<Purchase[]>()
        .exec(),
      PurchaseModel.countDocuments(filter).exec(),
    ]);

    return {
      purchases,
      pagination: {
        page: query.page,
        limit: query.limit,
        totalItems,
        totalPages: Math.ceil(totalItems / query.limit),
      },
    };
  }

  /** Returns one purchase and its orders only when the purchase belongs to the customer. */
  async getMineById(userId: string, purchaseId: string): Promise<PurchaseDetailsResult | null> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const purchaseObjectId = new mongoose.Types.ObjectId(purchaseId);

    const purchase = await PurchaseModel.findOne({
      _id: purchaseObjectId,
      userId: userObjectId,
    })
      .lean<Purchase>()
      .exec();

    if (!purchase) {
      return null;
    }

    const orders = await OrderModel.find({ purchaseId: purchase._id })
      .sort({ createdAt: 1, _id: 1 })
      .lean<Order[]>()
      .exec();

    return { purchase, orders };
  }
}
