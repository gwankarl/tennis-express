import mongoose from 'mongoose';

import { ProductModel } from '../../../sellers/products/management/models/product.model.js';
import { ProductVariantModel } from '../../../sellers/products/variants/models/product-variant.model.js';
import { mapPublicProductCards } from '../../../products/helpers/public-product-card.mapper.js';
import { buildPublicProductVisibilityStages } from '../../../products/helpers/public-product-visibility.stages.js';
import { CartModel } from '../models/cart.model.js';
import type { Cart, CartItem, CartValidationResult, CartView } from '../types/cart.types.js';
import { AppError } from '../../../../shared/errors/AppError.js';
import type { AddCartItemRequest } from '../schemas/cart.schema.js';
import { findBestCartPromotions } from '../helpers/cart-promotion.helper.js';

type PublicProductAggregateRow = Parameters<typeof mapPublicProductCards>[0][number];

interface CartValidationProductRow {
  _id: mongoose.Types.ObjectId;
  name: string;
  sellerId: mongoose.Types.ObjectId;
}

interface CartValidationVariantRow {
  _id: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  stockQuantity: number;
  status: 'active' | 'inactive';
}

/** Reads one user's cart and enriches its lines with current catalog data. */
export class CartService {
  async getMyCart(userId: string): Promise<CartView> {
    const cart = await CartModel.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    })
      .lean<Cart>()
      .exec();

    if (!cart) {
      return {
        id: null,
        items: [],
        lineCount: 0,
        totalQuantity: 0,
      };
    }

    const productIds = [...new Set(cart.items.map((item) => item.productId.toString()))].map(
      (id) => new mongoose.Types.ObjectId(id),
    );
    const variantIds = [...new Set(cart.items.map((item) => item.variantId.toString()))].map(
      (id) => new mongoose.Types.ObjectId(id),
    );

    const [visibleProducts, variants] =
      productIds.length > 0
        ? await Promise.all([
            ProductModel.aggregate<PublicProductAggregateRow>([
              ...buildPublicProductVisibilityStages({
                _id: { $in: productIds },
              }),
            ]).exec(),
            ProductVariantModel.find({ _id: { $in: variantIds } })
              .select('_id productId name sku price stockQuantity status')
              .lean()
              .exec(),
          ])
        : [[], []];

    const productsById = new Map(
      mapPublicProductCards(visibleProducts).map((product) => [product.id, product]),
    );
    const variantsById = new Map(variants.map((variant) => [variant._id.toString(), variant]));

    const items = cart.items.map((item) => {
      const productId = item.productId.toString();
      const variantId = item.variantId.toString();
      const product = productsById.get(productId) ?? null;
      const foundVariant = variantsById.get(variantId);
      const variant = foundVariant?.productId.toString() === productId ? foundVariant : undefined;

      return {
        id: item._id.toString(),
        productId,
        variantId,
        quantity: item.quantity,
        addedAt: item.addedAt,
        product,
        variant: variant
          ? {
              id: variant._id.toString(),
              name: variant.name,
              sku: variant.sku,
              price: variant.price,
            }
          : null,
        isAvailable:
          product !== null &&
          variant?.status === 'active' &&
          variant.stockQuantity >= item.quantity,
      };
    });

    return {
      id: cart._id.toString(),
      items,
      lineCount: items.length,
      totalQuantity: items.reduce((total, item) => total + item.quantity, 0),
    };
  }

  /** Adds a publicly available product variant to the authenticated user's cart. */
  async addItem(userId: string, input: AddCartItemRequest): Promise<CartView> {
    const productId = new mongoose.Types.ObjectId(input.productId);
    const variantId = new mongoose.Types.ObjectId(input.variantId);

    const [visibleProducts, variant] = await Promise.all([
      ProductModel.aggregate<{ _id: mongoose.Types.ObjectId }>(
        buildPublicProductVisibilityStages({ _id: productId }),
      ).exec(),
      ProductVariantModel.findOne({
        _id: variantId,
        productId,
        status: 'active',
      })
        .select('_id productId stockQuantity')
        .lean()
        .exec(),
    ]);

    if (visibleProducts.length === 0) {
      throw new AppError({
        statusCode: 404,
        code: 'PRODUCT_NOT_FOUND',
        message: 'The requested product could not be found.',
      });
    }

    if (!variant) {
      throw new AppError({
        statusCode: 404,
        code: 'PRODUCT_VARIANT_NOT_FOUND',
        message: 'The requested active product variant could not be found.',
      });
    }

    if (input.quantity > variant.stockQuantity) {
      throw new AppError({
        statusCode: 409,
        code: 'CART_INSUFFICIENT_STOCK',
        message: 'The requested quantity exceeds the available stock.',
      });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const cart = await CartModel.findOneAndUpdate(
      { userId: userObjectId },
      { $setOnInsert: { userId: userObjectId, items: [] } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).exec();

    const existingItem = cart.items.find((item: CartItem) => item.variantId.equals(variantId));
    const nextQuantity = (existingItem?.quantity ?? 0) + input.quantity;

    if (nextQuantity > variant.stockQuantity) {
      throw new AppError({
        statusCode: 409,
        code: 'CART_INSUFFICIENT_STOCK',
        message: 'The requested quantity exceeds the available stock.',
      });
    }

    if (existingItem) {
      existingItem.quantity = nextQuantity;
    } else {
      cart.items.push({
        _id: new mongoose.Types.ObjectId(),
        productId,
        variantId,
        quantity: input.quantity,
        addedAt: new Date(),
      });
    }

    await cart.save();

    return this.getMyCart(userId);
  }

  /** Sets the quantity for one cart line owned by the authenticated user. */
  async updateItemQuantity(userId: string, itemId: string, quantity: number): Promise<CartView> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const itemObjectId = new mongoose.Types.ObjectId(itemId);

    const cart = await CartModel.findOne({ userId: userObjectId }).exec();
    const cartItem = cart?.items.find((item: CartItem) => item._id.equals(itemObjectId));

    if (!cart || !cartItem) {
      throw new AppError({
        statusCode: 404,
        code: 'CART_ITEM_NOT_FOUND',
        message: 'The cart item could not be found.',
      });
    }

    const productId = cartItem.productId;
    const [visibleProducts, variant] = await Promise.all([
      ProductModel.aggregate<{ _id: mongoose.Types.ObjectId }>(
        buildPublicProductVisibilityStages({ _id: productId }),
      ).exec(),
      ProductVariantModel.findOne({
        _id: cartItem.variantId,
        productId,
        status: 'active',
      })
        .select('_id stockQuantity')
        .lean()
        .exec(),
    ]);

    if (visibleProducts.length === 0 || !variant) {
      throw new AppError({
        statusCode: 409,
        code: 'CART_ITEM_UNAVAILABLE',
        message: 'This product is no longer available to purchase.',
      });
    }

    if (quantity > variant.stockQuantity) {
      throw new AppError({
        statusCode: 409,
        code: 'CART_INSUFFICIENT_STOCK',
        message: 'The requested quantity exceeds the available stock.',
      });
    }

    cartItem.quantity = quantity;
    await cart.save();

    return this.getMyCart(userId);
  }

  /** Removes one cart line belonging to the authenticated user. */
  async removeItem(userId: string, itemId: string): Promise<CartView> {
    const cart = await CartModel.findOneAndUpdate(
      {
        userId: new mongoose.Types.ObjectId(userId),
        'items._id': new mongoose.Types.ObjectId(itemId),
      },
      {
        $pull: {
          items: { _id: new mongoose.Types.ObjectId(itemId) },
        },
      },
      { new: true },
    ).exec();

    if (!cart) {
      throw new AppError({
        statusCode: 404,
        code: 'CART_ITEM_NOT_FOUND',
        message: 'The cart item could not be found.',
      });
    }

    return this.getMyCart(userId);
  }

  /** Clears every line from the authenticated user's cart. */
  async clearCart(userId: string): Promise<CartView> {
    await CartModel.updateOne(
      { userId: new mongoose.Types.ObjectId(userId) },
      { $set: { items: [] } },
    ).exec();

    return this.getMyCart(userId);
  }

  /** Rechecks current product eligibility, variant stock, prices, and discounts. */
  async validateCart(userId: string): Promise<CartValidationResult> {
    const cart = await CartModel.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    })
      .lean<Cart>()
      .exec();

    if (!cart || cart.items.length === 0) {
      return {
        cartId: cart?._id.toString() ?? null,
        currency: 'XAF',
        canCheckout: false,
        lines: [],
        totals: { subtotal: 0, discount: 0, total: 0 },
      };
    }

    const productIds = [
      ...new Map(cart.items.map((item) => [item.productId.toString(), item.productId])).values(),
    ];
    const variantIds = [
      ...new Map(cart.items.map((item) => [item.variantId.toString(), item.variantId])).values(),
    ];

    const [products, variants] = await Promise.all([
      ProductModel.aggregate<CartValidationProductRow>(
        buildPublicProductVisibilityStages({ _id: { $in: productIds } }),
      ).exec(),
      ProductVariantModel.find({ _id: { $in: variantIds } })
        .select('_id productId name price stockQuantity status')
        .lean<CartValidationVariantRow[]>()
        .exec(),
    ]);

    const productsById = new Map(products.map((product) => [product._id.toString(), product]));
    const variantsById = new Map(variants.map((variant) => [variant._id.toString(), variant]));

    const promotionCandidates = cart.items.flatMap((item) => {
      const product = productsById.get(item.productId.toString());
      const variant = variantsById.get(item.variantId.toString());

      if (
        !product ||
        !variant ||
        !variant.productId.equals(item.productId) ||
        variant.status !== 'active'
      ) {
        return [];
      }

      return [
        {
          cartItemId: item._id.toString(),
          productId: item.productId,
          sellerId: product.sellerId,
          unitPrice: variant.price,
          quantity: item.quantity,
        },
      ];
    });

    const promotionsByLine = await findBestCartPromotions(promotionCandidates);

    const lines = cart.items.map((item) => {
      const productId = item.productId.toString();
      const variantId = item.variantId.toString();
      const cartItemId = item._id.toString();
      const product = productsById.get(productId);
      const variant = variantsById.get(variantId);
      const issues: CartValidationResult['lines'][number]['issues'] = [];

      if (!product) {
        issues.push({
          code: 'PRODUCT_OR_SELLER_UNAVAILABLE',
          message: 'This product or its seller is no longer eligible for purchase.',
        });
      }

      if (!variant || !variant.productId.equals(item.productId) || variant.status !== 'active') {
        issues.push({
          code: 'VARIANT_UNAVAILABLE',
          message: 'This product variant is no longer available.',
        });
      }

      if (
        variant?.productId.equals(item.productId) &&
        variant.status === 'active' &&
        item.quantity > variant.stockQuantity
      ) {
        issues.push({
          code: 'INSUFFICIENT_STOCK',
          message: 'The requested quantity exceeds the available stock.',
        });
      }

      const priceIsAvailable =
        product !== undefined &&
        variant !== undefined &&
        variant.productId.equals(item.productId) &&
        variant.status === 'active';

      const lineSubtotal = priceIsAvailable ? variant.price * item.quantity : null;
      const appliedPromotion = promotionsByLine.get(cartItemId) ?? null;
      const lineDiscount = lineSubtotal === null ? 0 : (appliedPromotion?.discountAmount ?? 0);
      const lineTotal = lineSubtotal === null ? null : lineSubtotal - lineDiscount;

      return {
        cartItemId,
        productId,
        variantId,
        productName: product?.name ?? null,
        variantName: priceIsAvailable ? variant.name : null,
        quantity: item.quantity,
        unitPrice: priceIsAvailable ? variant.price : null,
        appliedPromotion,
        lineSubtotal,
        lineDiscount,
        lineTotal,
        issues,
      };
    });

    const subtotal = lines.reduce((total, line) => total + (line.lineSubtotal ?? 0), 0);
    const discount = lines.reduce((total, line) => total + line.lineDiscount, 0);

    return {
      cartId: cart._id.toString(),
      currency: 'XAF',
      canCheckout: lines.length > 0 && lines.every((line) => line.issues.length === 0),
      lines,
      totals: {
        subtotal,
        discount,
        total: subtotal - discount,
      },
    };
  }
}
