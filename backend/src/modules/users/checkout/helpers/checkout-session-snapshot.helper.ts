import mongoose, { type ClientSession } from 'mongoose';

import { AppError } from '../../../../shared/errors/AppError.js';
import { buildPublicProductVisibilityStages } from '../../../products/helpers/public-product-visibility.stages.js';
import { ProductModel } from '../../../sellers/products/management/models/product.model.js';
import { ProductVariantModel } from '../../../sellers/products/variants/models/product-variant.model.js';
import type { Cart } from '../../cart/types/cart.types.js';
import { findBestCartPromotions } from '../../cart/helpers/cart-promotion.helper.js';
import type { CartPromotionCandidate } from '../../cart/helpers/cart-promotion.helper.js';
import type {
  CheckoutLineSnapshot,
  CheckoutQuote,
  CheckoutSellerGroup,
} from '../types/checkout-session.types.js';

interface EligibleProductRow {
  _id: mongoose.Types.ObjectId;
  name: string;
  sellerId: mongoose.Types.ObjectId;
  storeId: mongoose.Types.ObjectId;
}

interface CheckoutVariantRow {
  _id: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  name: string;
  sku: string | null;
  price: number;
  stockQuantity: number;
  status: 'active' | 'inactive';
}

export interface CheckoutSessionSnapshot {
  lines: CheckoutLineSnapshot[];
  sellerGroups: CheckoutSellerGroup[];
  quote: CheckoutQuote;
}

/** Validates selected cart lines and snapshots their current price and eligibility. */
export async function buildCheckoutSessionSnapshot(
  cart: Cart,
  selectedCartItemIds: string[],
  session: ClientSession,
  now: Date = new Date(),
): Promise<CheckoutSessionSnapshot> {
  const selectedIds = new Set(selectedCartItemIds);
  const selectedItems = cart.items.filter((item) => selectedIds.has(item._id.toString()));

  if (selectedItems.length !== selectedCartItemIds.length) {
    throw new AppError({
      statusCode: 404,
      code: 'CART_ITEM_NOT_FOUND',
      message: 'One or more selected cart items could not be found.',
    });
  }

  const productIds = [
    ...new Map(selectedItems.map((item) => [item.productId.toString(), item.productId])).values(),
  ];
  const variantIds = [
    ...new Map(selectedItems.map((item) => [item.variantId.toString(), item.variantId])).values(),
  ];

  const [products, variants] = await Promise.all([
    ProductModel.aggregate<EligibleProductRow>(
      buildPublicProductVisibilityStages({ _id: { $in: productIds } }),
    )
      .session(session)
      .exec(),
    ProductVariantModel.find({ _id: { $in: variantIds } })
      .select('_id productId name sku price stockQuantity status')
      .session(session)
      .lean<CheckoutVariantRow[]>()
      .exec(),
  ]);

  const productsById = new Map(products.map((product) => [product._id.toString(), product]));
  const variantsById = new Map(variants.map((variant) => [variant._id.toString(), variant]));

  const candidates: CartPromotionCandidate[] = selectedItems.map((item) => {
    const product = productsById.get(item.productId.toString());
    const variant = variantsById.get(item.variantId.toString());

    if (!product) {
      throw new AppError({
        statusCode: 409,
        code: 'CHECKOUT_ITEM_UNAVAILABLE',
        message: 'A selected product or its seller is no longer eligible for purchase.',
      });
    }

    if (!variant || !variant.productId.equals(item.productId) || variant.status !== 'active') {
      throw new AppError({
        statusCode: 409,
        code: 'CHECKOUT_VARIANT_UNAVAILABLE',
        message: 'A selected product variant is no longer available.',
      });
    }

    if (item.quantity > variant.stockQuantity) {
      throw new AppError({
        statusCode: 409,
        code: 'CHECKOUT_INSUFFICIENT_STOCK',
        message: 'A selected product variant no longer has enough stock.',
      });
    }

    return {
      cartItemId: item._id.toString(),
      productId: item.productId,
      sellerId: product.sellerId,
      unitPrice: variant.price,
      quantity: item.quantity,
    };
  });

  const promotionsByLine = await findBestCartPromotions(candidates, now, session);
  const lines: CheckoutLineSnapshot[] = selectedItems.map((item) => {
    const product = productsById.get(item.productId.toString());
    const variant = variantsById.get(item.variantId.toString());

    // Eligibility and variant checks above guarantee these records exist and match.
    if (!product || !variant) {
      throw new Error('Selected checkout line changed during snapshot construction.');
    }

    const appliedPromotion = promotionsByLine.get(item._id.toString()) ?? null;
    const subtotal = variant.price * item.quantity;
    const discount = appliedPromotion?.discountAmount ?? 0;
    const total = subtotal - discount;

    if (![subtotal, discount, total].every(Number.isSafeInteger)) {
      throw new AppError({
        statusCode: 422,
        code: 'CHECKOUT_TOTAL_OUT_OF_RANGE',
        message: 'A selected line total exceeds the supported XAF amount.',
      });
    }

    return {
      cartItemId: item._id,
      productId: item.productId,
      variantId: item.variantId,
      sellerId: product.sellerId,
      storeId: product.storeId,
      productName: product.name,
      variantName: variant.name,
      sku: variant.sku,
      quantity: item.quantity,
      unitPrice: variant.price,
      promotion: appliedPromotion
        ? {
            promotionId: new mongoose.Types.ObjectId(appliedPromotion.id),
            name: appliedPromotion.name,
            type: appliedPromotion.type,
            discountAmount: appliedPromotion.discountAmount,
          }
        : null,
      subtotal,
      discount,
      total,
    };
  });

  const groupsBySeller = new Map<string, CheckoutSellerGroup>();

  for (const line of lines) {
    const sellerId = line.sellerId.toString();
    const group = groupsBySeller.get(sellerId);

    if (group) {
      group.cartItemIds.push(line.cartItemId);
    } else {
      groupsBySeller.set(sellerId, {
        sellerId: line.sellerId,
        fulfillment: null,
        cartItemIds: [line.cartItemId],
      });
    }
  }

  const subtotal = lines.reduce((sum, line) => sum + line.subtotal, 0);
  const discount = lines.reduce((sum, line) => sum + line.discount, 0);
  const total = subtotal - discount;

  if (![subtotal, discount, total].every(Number.isSafeInteger)) {
    throw new AppError({
      statusCode: 422,
      code: 'CHECKOUT_TOTAL_OUT_OF_RANGE',
      message: 'The checkout total exceeds the supported XAF amount.',
    });
  }

  return {
    lines,
    sellerGroups: [...groupsBySeller.values()],
    quote: {
      version: 1,
      currency: 'XAF',
      subtotal,
      discount,
      fulfillmentTotal: 0,
      total,
      createdAt: now,
    },
  };
}
