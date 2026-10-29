import type { Types } from 'mongoose';

import { PromotionModel } from '../../../sellers/promotions/models/promotion.model.js';
import type { Promotion } from '../../../sellers/promotions/types/promotion.types.js';

export interface CartPromotionCandidate {
  cartItemId: string;
  productId: Types.ObjectId;
  sellerId: Types.ObjectId;
  unitPrice: number;
  quantity: number;
}

export interface AppliedCartPromotion {
  id: string;
  name: string;
  type: Promotion['type'];
  discountAmount: number;
}

/** Selects the highest current eligible discount for each cart line. */
export async function findBestCartPromotions(
  candidates: CartPromotionCandidate[],
  now: Date = new Date(),
): Promise<Map<string, AppliedCartPromotion>> {
  const result = new Map<string, AppliedCartPromotion>();

  if (candidates.length === 0) {
    return result;
  }

  const productIds = [
    ...new Map(
      candidates.map((candidate) => [candidate.productId.toString(), candidate.productId]),
    ).values(),
  ];

  const promotions = await PromotionModel.find({
    eligibleProductIds: { $in: productIds },
    status: 'active',
    startsAt: { $lte: now },
    endsAt: { $gt: now },
  })
    .lean<Promotion[]>()
    .exec();

  for (const candidate of candidates) {
    let bestPromotion: Promotion | null = null;
    let bestDiscountPerUnit = 0;

    for (const promotion of promotions) {
      const productIsEligible = promotion.eligibleProductIds.some((productId) =>
        productId.equals(candidate.productId),
      );

      const sellerIsEligible =
        promotion.type === 'marketplace_campaign' ||
        promotion.sellerId?.equals(candidate.sellerId) === true;

      if (!productIsEligible || !sellerIsEligible) {
        continue;
      }

      const rawDiscount =
        promotion.discountType === 'percentage'
          ? Math.floor((candidate.unitPrice * promotion.discountValue) / 100)
          : promotion.discountValue;

      const discountPerUnit = Math.min(candidate.unitPrice, rawDiscount);

      if (discountPerUnit > bestDiscountPerUnit) {
        bestPromotion = promotion;
        bestDiscountPerUnit = discountPerUnit;
      }
    }

    if (bestPromotion && bestDiscountPerUnit > 0) {
      result.set(candidate.cartItemId, {
        id: bestPromotion._id.toString(),
        name: bestPromotion.name,
        type: bestPromotion.type,
        discountAmount: bestDiscountPerUnit * candidate.quantity,
      });
    }
  }

  return result;
}
