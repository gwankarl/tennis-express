import mongoose, { type ClientSession } from 'mongoose';

import { AppError } from '../../../../shared/errors/AppError.js';
import { findBestCartPromotions } from '../../cart/helpers/cart-promotion.helper.js';
import type { CartPromotionCandidate } from '../../cart/helpers/cart-promotion.helper.js';
import { buildPublicProductVisibilityStages } from '../../../products/helpers/public-product-visibility.stages.js';
import { ProductModel } from '../../../sellers/products/management/models/product.model.js';
import { ProductVariantModel } from '../../../sellers/products/variants/models/product-variant.model.js';
import type {
  CheckoutLineSnapshot,
  CheckoutMaterialChange,
} from '../types/checkout-session.types.js';

interface EligibleProductRow {
  _id: mongoose.Types.ObjectId;
  name: string;
  sellerId: mongoose.Types.ObjectId;
  storeId: mongoose.Types.ObjectId;
}

interface CurrentVariantRow {
  _id: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  name: string;
  sku: string | null;
  price: number;
  status: 'active' | 'inactive';
}

export interface RevalidatedCheckoutLines {
  lines: CheckoutLineSnapshot[];
  changes: CheckoutMaterialChange[];
}

/** Refreshes selected line snapshots and records price and promotion changes. */
export async function revalidateCheckoutLines(
  lines: CheckoutLineSnapshot[],
  session: ClientSession,
  now: Date,
): Promise<RevalidatedCheckoutLines> {
  const productIds = [
    ...new Map(lines.map((line) => [line.productId.toString(), line.productId])).values(),
  ];
  const variantIds = [
    ...new Map(lines.map((line) => [line.variantId.toString(), line.variantId])).values(),
  ];

  const [products, variants] = await Promise.all([
    ProductModel.aggregate<EligibleProductRow>(
      buildPublicProductVisibilityStages({ _id: { $in: productIds } }),
    )
      .session(session)
      .exec(),
    ProductVariantModel.find({ _id: { $in: variantIds } })
      .select('_id productId name sku price status')
      .session(session)
      .lean<CurrentVariantRow[]>()
      .exec(),
  ]);

  const productsById = new Map(products.map((product) => [product._id.toString(), product]));
  const variantsById = new Map(variants.map((variant) => [variant._id.toString(), variant]));

  const candidates: CartPromotionCandidate[] = lines.map((line) => {
    const product = productsById.get(line.productId.toString());
    const variant = variantsById.get(line.variantId.toString());

    if (
      !product ||
      !product.sellerId.equals(line.sellerId) ||
      !product.storeId.equals(line.storeId)
    ) {
      throw new AppError({
        statusCode: 409,
        code: 'CHECKOUT_ITEM_UNAVAILABLE',
        message: 'A selected product or its seller is no longer eligible for purchase.',
      });
    }

    if (!variant || !variant.productId.equals(line.productId) || variant.status !== 'active') {
      throw new AppError({
        statusCode: 409,
        code: 'CHECKOUT_VARIANT_UNAVAILABLE',
        message: 'A selected product variant is no longer available.',
      });
    }

    return {
      cartItemId: line.cartItemId.toString(),
      productId: line.productId,
      sellerId: line.sellerId,
      unitPrice: variant.price,
      quantity: line.quantity,
    };
  });

  const promotionsByLine = await findBestCartPromotions(candidates, now, session);
  const changes: CheckoutMaterialChange[] = [];

  const refreshedLines = lines.map((line) => {
    const product = productsById.get(line.productId.toString());
    const variant = variantsById.get(line.variantId.toString());

    // Eligibility checks above guarantee these records exist.
    if (!product || !variant) {
      throw new Error('A selected checkout line changed during revalidation.');
    }

    const currentPromotionCandidate = promotionsByLine.get(line.cartItemId.toString());
    const currentPromotion = currentPromotionCandidate
      ? {
          promotionId: new mongoose.Types.ObjectId(currentPromotionCandidate.id),
          name: currentPromotionCandidate.name,
          type: currentPromotionCandidate.type,
          discountAmount: currentPromotionCandidate.discountAmount,
        }
      : null;

    if (line.unitPrice !== variant.price) {
      changes.push({
        kind: 'unit_price',
        cartItemId: line.cartItemId.toString(),
        previousValue: line.unitPrice,
        currentValue: variant.price,
      });
    }

    const promotionChanged =
      line.promotion === null
        ? currentPromotion !== null
        : currentPromotion === null ||
          !line.promotion.promotionId.equals(currentPromotion.promotionId) ||
          line.promotion.name !== currentPromotion.name ||
          line.promotion.type !== currentPromotion.type ||
          line.promotion.discountAmount !== currentPromotion.discountAmount;

    if (promotionChanged) {
      changes.push({
        kind: 'promotion',
        cartItemId: line.cartItemId.toString(),
        previousValue: line.promotion,
        currentValue: currentPromotion,
      });
    }

    const subtotal = variant.price * line.quantity;
    const discount = currentPromotion?.discountAmount ?? 0;
    const total = subtotal - discount;

    if (![subtotal, discount, total].every(Number.isSafeInteger)) {
      throw new AppError({
        statusCode: 422,
        code: 'CHECKOUT_TOTAL_OUT_OF_RANGE',
        message: 'A selected line total exceeds the supported XAF amount.',
      });
    }

    return {
      ...line,
      productName: product.name,
      variantName: variant.name,
      sku: variant.sku,
      unitPrice: variant.price,
      promotion: currentPromotion,
      subtotal,
      discount,
      total,
    };
  });

  return { lines: refreshedLines, changes };
}
