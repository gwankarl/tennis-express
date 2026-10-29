import mongoose from 'mongoose';

import { AppError } from '../../../../shared/errors/AppError.js';
import { CartModel } from '../../cart/models/cart.model.js';
import type { Cart } from '../../cart/types/cart.types.js';
import { reserveVariantStock } from '../helpers/checkout-stock-reservation.helper.js';
import { buildCheckoutSessionSnapshot } from '../helpers/checkout-session-snapshot.helper.js';
import { CheckoutSessionModel } from '../models/checkout-session.model.js';
import type {
  AcknowledgeCheckoutChangesRequest,
  CreateCheckoutSessionRequest,
  UpdateCheckoutFulfillmentRequest,
} from '../schemas/checkout-session.schema.js';
import type {
  CheckoutFulfillmentOptionsResult,
  CheckoutLineSnapshot,
  CheckoutMaterialChange,
  CheckoutRevalidationResult,
  CheckoutSellerGroup,
  CheckoutSession,
} from '../types/checkout-session.types.js';
import { CameroonRegion } from '../../seller-applications/types/seller-application.types.js';
import { StoreModel } from '../../../sellers/store/models/store.model.js';
import type { Store } from '../../../sellers/store/types/store.types.js';
import { resolveCheckoutFulfillmentSelection } from '../helpers/checkout-fulfillment.helper.js';
import { revalidateCheckoutFulfillment } from '../helpers/checkout-fulfillment-revalidation.helper.js';
import { revalidateCheckoutLines } from '../helpers/checkout-session-revalidation.helper.js';
import { StockReservationModel } from '../models/stock-reservation.model.js';
import type { StockReservation } from '../types/stock-reservation.types.js';
import { buildCheckoutConfirmationDocuments } from '../helpers/checkout-confirmation-snapshot.helper.js';
import { OrderModel } from '../../orders/models/order.model.js';
import { PurchaseModel } from '../../purchases/models/purchase.model.js';
import type { Order } from '../../orders/types/order.types.js';
import type { Purchase } from '../../purchases/types/purchase.types.js';
import type { CheckoutConfirmationResult } from '../types/checkout-confirmation.types.js';
import { releaseCheckoutStockReservations } from '../helpers/checkout-stock-release.helper.js';

const STOCK_RESERVATION_DURATION_MS = 15 * 60 * 1000;

/** Creates an owned checkout session and reserves its selected inventory atomically. */
export class CheckoutSessionService {
  async create(userId: string, input: CreateCheckoutSessionRequest): Promise<CheckoutSession> {
    const ownerId = new mongoose.Types.ObjectId(userId);
    const transaction = await mongoose.startSession();
    let createdSession: CheckoutSession | null = null;

    try {
      await transaction.withTransaction(async () => {
        const cart = await CartModel.findOne({ userId: ownerId })
          .session(transaction)
          .lean<Cart>()
          .exec();

        if (!cart) {
          throw new AppError({
            statusCode: 404,
            code: 'CART_NOT_FOUND',
            message: 'The selected cart items could not be found.',
          });
        }

        const now = new Date();
        const expiresAt = new Date(now.getTime() + STOCK_RESERVATION_DURATION_MS);
        const snapshot = await buildCheckoutSessionSnapshot(
          cart,
          input.cartItemIds,
          transaction,
          now,
        );

        const [sessionDocument] = await CheckoutSessionModel.create(
          [
            {
              userId: ownerId,
              status: 'active',
              lines: snapshot.lines,
              sellerGroups: snapshot.sellerGroups,
              quote: snapshot.quote,
              acknowledgedQuoteVersion: null,
              expiresAt,
              confirmedPurchaseId: null,
            },
          ],
          { session: transaction },
        );

        // Reserve once per variant, even if legacy cart data has duplicate lines.
        const quantitiesByVariant = new Map<string, number>();

        for (const line of snapshot.lines) {
          const variantId = line.variantId.toString();
          quantitiesByVariant.set(
            variantId,
            (quantitiesByVariant.get(variantId) ?? 0) + line.quantity,
          );
        }

        for (const [variantId, quantity] of quantitiesByVariant) {
          await reserveVariantStock(
            {
              checkoutSessionId: sessionDocument._id,
              variantId: new mongoose.Types.ObjectId(variantId),
              quantity,
              expiresAt,
            },
            transaction,
          );
        }

        createdSession = sessionDocument.toObject() as CheckoutSession;
      });
    } finally {
      await transaction.endSession();
    }

    if (!createdSession) {
      throw new AppError({
        statusCode: 500,
        code: 'CHECKOUT_SESSION_CREATE_FAILED',
        message: 'The checkout session could not be created.',
      });
    }

    return createdSession;
  }

  /** Returns a checkout session only when it belongs to the authenticated user. */
  async getById(userId: string, sessionId: string): Promise<CheckoutSession> {
    const checkoutSession = await CheckoutSessionModel.findOne({
      _id: new mongoose.Types.ObjectId(sessionId),
      userId: new mongoose.Types.ObjectId(userId),
    })
      .lean<CheckoutSession>()
      .exec();

    if (!checkoutSession) {
      throw new AppError({
        statusCode: 404,
        code: 'CHECKOUT_SESSION_NOT_FOUND',
        message: 'The checkout session could not be found.',
      });
    }

    return checkoutSession;
  }

  /** Returns current fulfillment options for each seller in an owned session. */
  async getFulfillmentOptions(
    userId: string,
    sessionId: string,
    destinationRegion: CameroonRegion,
  ): Promise<CheckoutFulfillmentOptionsResult> {
    const checkoutSession = await CheckoutSessionModel.findOne({
      _id: new mongoose.Types.ObjectId(sessionId),
      userId: new mongoose.Types.ObjectId(userId),
    })
      .lean<CheckoutSession>()
      .exec();

    if (!checkoutSession) {
      throw new AppError({
        statusCode: 404,
        code: 'CHECKOUT_SESSION_NOT_FOUND',
        message: 'The checkout session could not be found.',
      });
    }

    if (checkoutSession.status !== 'active' || checkoutSession.expiresAt <= new Date()) {
      throw new AppError({
        statusCode: 409,
        code: 'CHECKOUT_SESSION_NOT_ACTIVE',
        message: 'Fulfillment options are available only for an active checkout session.',
      });
    }

    const sellerIds = checkoutSession.sellerGroups.map((group) => group.sellerId);

    const stores = await StoreModel.find({ sellerId: { $in: sellerIds } })
      .select('_id sellerId name status fulfilmentProfile deliveryOptions collectionOptions')
      .lean<Store[]>()
      .exec();

    const storesBySellerId = new Map(stores.map((store) => [store.sellerId.toString(), store]));

    const sellerGroups = checkoutSession.sellerGroups.map((group) => {
      const groupLine = checkoutSession.lines.find((line) => line.sellerId.equals(group.sellerId));
      const store = storesBySellerId.get(group.sellerId.toString());

      if (!groupLine) {
        throw new AppError({
          statusCode: 500,
          code: 'CHECKOUT_SESSION_INVALID',
          message: 'The checkout session contains an invalid seller group.',
        });
      }

      const storeMatchesSession = store?._id.equals(groupLine.storeId) ?? false;
      const profile = storeMatchesSession ? store?.fulfilmentProfile : null;
      const storeIsActive = storeMatchesSession && store?.status === 'active';

      const options = storeIsActive
        ? [
            ...(profile?.methods.includes('delivery') &&
            profile.serviceRegions.includes(destinationRegion)
              ? store.deliveryOptions.map((option) => ({
                  method: 'delivery' as const,
                  name: option.name,
                  description: option.description,
                  fee: option.fee,
                }))
              : []),
            ...(profile?.methods.includes('collection')
              ? store.collectionOptions.map((option) => ({
                  method: 'collection' as const,
                  name: option.name,
                  description: option.description,
                  fee: option.fee,
                }))
              : []),
          ]
        : [];

      return {
        sellerId: group.sellerId.toString(),
        storeId: groupLine.storeId.toString(),
        storeName: storeMatchesSession && store ? store.name : null,
        options,
      };
    });

    return {
      sessionId: checkoutSession._id.toString(),
      destinationRegion,
      sellerGroups,
    };
  }

  /** Saves fulfillment choices for selected seller groups and refreshes the quote. */
  async updateFulfillment(
    userId: string,
    sessionId: string,
    input: UpdateCheckoutFulfillmentRequest,
  ): Promise<CheckoutSession> {
    const ownerId = new mongoose.Types.ObjectId(userId);
    const checkoutSessionId = new mongoose.Types.ObjectId(sessionId);
    const transaction = await mongoose.startSession();
    let updatedSession: CheckoutSession | null = null;

    try {
      await transaction.withTransaction(async () => {
        const checkoutSession = await CheckoutSessionModel.findOne({
          _id: checkoutSessionId,
          userId: ownerId,
        })
          .session(transaction)
          .exec();

        if (!checkoutSession) {
          throw new AppError({
            statusCode: 404,
            code: 'CHECKOUT_SESSION_NOT_FOUND',
            message: 'The checkout session could not be found.',
          });
        }

        if (checkoutSession.status !== 'active' || checkoutSession.expiresAt <= new Date()) {
          throw new AppError({
            statusCode: 409,
            code: 'CHECKOUT_SESSION_NOT_ACTIVE',
            message: 'Fulfillment can only be changed for an active checkout session.',
          });
        }

        const targetGroups = input.groups.map((groupInput) => {
          const sellerId = new mongoose.Types.ObjectId(groupInput.sellerId);
          const sellerGroup = checkoutSession.sellerGroups.find((group: CheckoutSellerGroup) =>
            group.sellerId.equals(sellerId),
          );

          if (!sellerGroup) {
            throw new AppError({
              statusCode: 404,
              code: 'CHECKOUT_SELLER_GROUP_NOT_FOUND',
              message: 'The seller group could not be found in this checkout session.',
            });
          }

          const groupLine = checkoutSession.lines.find((line: CheckoutLineSnapshot) =>
            line.sellerId.equals(sellerId),
          );

          if (!groupLine) {
            throw new AppError({
              statusCode: 500,
              code: 'CHECKOUT_SESSION_INVALID',
              message: 'The checkout session contains an invalid seller group.',
            });
          }

          return { groupInput, sellerGroup, groupLine };
        });

        const stores = await StoreModel.find({
          sellerId: {
            $in: targetGroups.map(({ sellerGroup }) => sellerGroup.sellerId),
          },
        })
          .session(transaction)
          .lean<Store[]>()
          .exec();

        const storesBySellerId = new Map(stores.map((store) => [store.sellerId.toString(), store]));

        for (const { groupInput, sellerGroup, groupLine } of targetGroups) {
          const currentStore = storesBySellerId.get(sellerGroup.sellerId.toString());
          const storeMatchesSession = currentStore?._id.equals(groupLine.storeId) ?? false;

          sellerGroup.fulfillment = await resolveCheckoutFulfillmentSelection(
            storeMatchesSession && currentStore ? currentStore : null,
            userId,
            groupInput,
            transaction,
          );
        }

        const fulfillmentTotal = checkoutSession.sellerGroups.reduce(
          (total: number, group: CheckoutSellerGroup) => total + (group.fulfillment?.fee ?? 0),
          0,
        );
        const total =
          checkoutSession.quote.subtotal - checkoutSession.quote.discount + fulfillmentTotal;

        if (![fulfillmentTotal, total].every(Number.isSafeInteger)) {
          throw new AppError({
            statusCode: 422,
            code: 'CHECKOUT_TOTAL_OUT_OF_RANGE',
            message: 'The checkout total exceeds the supported XAF amount.',
          });
        }

        checkoutSession.quote = {
          ...checkoutSession.quote,
          version: checkoutSession.quote.version + 1,
          fulfillmentTotal,
          total,
          createdAt: new Date(),
        };
        checkoutSession.acknowledgedQuoteVersion = null;

        await checkoutSession.save({ session: transaction });
        updatedSession = checkoutSession.toObject() as CheckoutSession;
      });
    } finally {
      await transaction.endSession();
    }

    if (!updatedSession) {
      throw new AppError({
        statusCode: 500,
        code: 'CHECKOUT_FULFILLMENT_UPDATE_FAILED',
        message: 'Checkout fulfillment could not be updated.',
      });
    }

    return updatedSession;
  }

  /** Refreshes checkout details and renews valid stock holds atomically. */
  async revalidate(userId: string, sessionId: string): Promise<CheckoutRevalidationResult> {
    const ownerId = new mongoose.Types.ObjectId(userId);
    const checkoutSessionId = new mongoose.Types.ObjectId(sessionId);
    const transaction = await mongoose.startSession();
    let result: CheckoutRevalidationResult | null = null;

    try {
      await transaction.withTransaction(async () => {
        const now = new Date();
        const checkoutSession = await CheckoutSessionModel.findOne({
          _id: checkoutSessionId,
          userId: ownerId,
        })
          .session(transaction)
          .exec();

        if (!checkoutSession) {
          throw new AppError({
            statusCode: 404,
            code: 'CHECKOUT_SESSION_NOT_FOUND',
            message: 'The checkout session could not be found.',
          });
        }

        if (checkoutSession.status !== 'active' || checkoutSession.expiresAt <= now) {
          throw new AppError({
            statusCode: 409,
            code: 'CHECKOUT_SESSION_NOT_ACTIVE',
            message: 'Only an active checkout session can be revalidated.',
          });
        }

        const refreshedLinesResult = await revalidateCheckoutLines(
          checkoutSession.lines,
          transaction,
          now,
        );
        const refreshedLines = refreshedLinesResult.lines;
        const changes = [...refreshedLinesResult.changes];

        const sellerIds = checkoutSession.sellerGroups.map(
          (group: CheckoutSellerGroup) => group.sellerId,
        );
        const stores = await StoreModel.find({ sellerId: { $in: sellerIds } })
          .session(transaction)
          .lean<Store[]>()
          .exec();
        const storesBySellerId = new Map(stores.map((store) => [store.sellerId.toString(), store]));

        for (const sellerGroup of checkoutSession.sellerGroups) {
          const groupLine = refreshedLines.find((line) =>
            line.sellerId.equals(sellerGroup.sellerId),
          );

          if (!groupLine) {
            throw new AppError({
              statusCode: 500,
              code: 'CHECKOUT_SESSION_INVALID',
              message: 'The checkout session contains an invalid seller group.',
            });
          }

          const refreshedFulfillment = revalidateCheckoutFulfillment(
            storesBySellerId.get(sellerGroup.sellerId.toString()) ?? null,
            sellerGroup as CheckoutSellerGroup,
            groupLine,
          );

          sellerGroup.fulfillment = refreshedFulfillment.fulfillment;
          changes.push(...refreshedFulfillment.changes);
        }

        const quantitiesByVariant = new Map<string, number>();

        for (const line of refreshedLines) {
          const variantId = line.variantId.toString();
          quantitiesByVariant.set(
            variantId,
            (quantitiesByVariant.get(variantId) ?? 0) + line.quantity,
          );
        }

        const activeReservations = await StockReservationModel.find({
          checkoutSessionId,
          status: 'active',
        })
          .session(transaction)
          .lean<StockReservation[]>()
          .exec();

        const reservationsByVariant = new Map(
          activeReservations.map((reservation) => [reservation.variantId.toString(), reservation]),
        );

        if (reservationsByVariant.size !== quantitiesByVariant.size) {
          throw new AppError({
            statusCode: 409,
            code: 'CHECKOUT_STOCK_RESERVATION_UNAVAILABLE',
            message: 'A selected item no longer has a valid stock reservation.',
          });
        }

        for (const [variantId, quantity] of quantitiesByVariant) {
          const reservation = reservationsByVariant.get(variantId);

          if (!reservation || reservation.quantity !== quantity || reservation.expiresAt <= now) {
            throw new AppError({
              statusCode: 409,
              code: 'CHECKOUT_STOCK_RESERVATION_UNAVAILABLE',
              message: 'A selected item no longer has a valid stock reservation.',
            });
          }
        }

        const fulfillmentTotal = checkoutSession.sellerGroups.reduce(
          (total: number, group: CheckoutSellerGroup) => total + (group.fulfillment?.fee ?? 0),
          0,
        );
        const subtotal = refreshedLines.reduce((total, line) => total + line.subtotal, 0);
        const discount = refreshedLines.reduce((total, line) => total + line.discount, 0);
        const total = subtotal - discount + fulfillmentTotal;

        if (![subtotal, discount, fulfillmentTotal, total].every(Number.isSafeInteger)) {
          throw new AppError({
            statusCode: 422,
            code: 'CHECKOUT_TOTAL_OUT_OF_RANGE',
            message: 'The checkout total exceeds the supported XAF amount.',
          });
        }

        const renewedExpiresAt = new Date(now.getTime() + STOCK_RESERVATION_DURATION_MS);

        await StockReservationModel.updateMany(
          {
            checkoutSessionId,
            status: 'active',
          },
          { $set: { expiresAt: renewedExpiresAt } },
          { session: transaction },
        );

        checkoutSession.lines = refreshedLines;
        checkoutSession.expiresAt = renewedExpiresAt;
        checkoutSession.quote = {
          ...checkoutSession.quote,
          version: checkoutSession.quote.version + 1,
          subtotal,
          discount,
          fulfillmentTotal,
          total,
          createdAt: now,
        };
        checkoutSession.acknowledgedQuoteVersion = null;

        await checkoutSession.save({ session: transaction });

        result = {
          checkoutSession: checkoutSession.toObject() as CheckoutSession,
          changes,
        };
      });
    } finally {
      await transaction.endSession();
    }

    if (!result) {
      throw new AppError({
        statusCode: 500,
        code: 'CHECKOUT_REVALIDATION_FAILED',
        message: 'The checkout session could not be revalidated.',
      });
    }

    return result;
  }

  /** Records acceptance only if the customer reviewed the current quote version. */
  async acknowledgeChanges(
    userId: string,
    sessionId: string,
    input: AcknowledgeCheckoutChangesRequest,
  ): Promise<CheckoutSession> {
    const transaction = await mongoose.startSession();
    let acknowledgedSession: CheckoutSession | null = null;

    try {
      await transaction.withTransaction(async () => {
        const checkoutSession = await CheckoutSessionModel.findOne({
          _id: new mongoose.Types.ObjectId(sessionId),
          userId: new mongoose.Types.ObjectId(userId),
        })
          .session(transaction)
          .exec();

        if (!checkoutSession) {
          throw new AppError({
            statusCode: 404,
            code: 'CHECKOUT_SESSION_NOT_FOUND',
            message: 'The checkout session could not be found.',
          });
        }

        if (checkoutSession.status !== 'active' || checkoutSession.expiresAt <= new Date()) {
          throw new AppError({
            statusCode: 409,
            code: 'CHECKOUT_SESSION_NOT_ACTIVE',
            message: 'Only an active checkout session can accept quote changes.',
          });
        }

        if (checkoutSession.quote.version !== input.quoteVersion) {
          throw new AppError({
            statusCode: 409,
            code: 'CHECKOUT_QUOTE_VERSION_MISMATCH',
            message: 'The quote changed. Review the current quote before accepting it.',
          });
        }

        checkoutSession.acknowledgedQuoteVersion = input.quoteVersion;
        await checkoutSession.save({ session: transaction });

        acknowledgedSession = checkoutSession.toObject() as CheckoutSession;
      });
    } finally {
      await transaction.endSession();
    }

    if (!acknowledgedSession) {
      throw new AppError({
        statusCode: 500,
        code: 'CHECKOUT_CHANGE_ACKNOWLEDGEMENT_FAILED',
        message: 'Checkout changes could not be acknowledged.',
      });
    }

    return acknowledgedSession;
  }

  /** Confirms an acknowledged checkout and creates its purchase and seller orders atomically. */
  async confirm(userId: string, sessionId: string): Promise<CheckoutConfirmationResult> {
    const ownerId = new mongoose.Types.ObjectId(userId);
    const checkoutSessionId = new mongoose.Types.ObjectId(sessionId);
    const transaction = await mongoose.startSession();
    let result: CheckoutConfirmationResult | null = null;

    try {
      await transaction.withTransaction(async () => {
        const now = new Date();
        const checkoutSession = await CheckoutSessionModel.findOne({
          _id: checkoutSessionId,
          userId: ownerId,
        })
          .session(transaction)
          .exec();

        if (!checkoutSession) {
          throw new AppError({
            statusCode: 404,
            code: 'CHECKOUT_SESSION_NOT_FOUND',
            message: 'The checkout session could not be found.',
          });
        }

        if (checkoutSession.status === 'confirmed') {
          if (!checkoutSession.confirmedPurchaseId) {
            throw new AppError({
              statusCode: 500,
              code: 'CHECKOUT_SESSION_INVALID',
              message: 'The confirmed checkout session has no purchase reference.',
            });
          }

          const purchase = await PurchaseModel.findOne({
            _id: checkoutSession.confirmedPurchaseId,
            checkoutSessionId,
            userId: ownerId,
          })
            .session(transaction)
            .lean<Purchase>()
            .exec();

          if (!purchase) {
            throw new AppError({
              statusCode: 500,
              code: 'CHECKOUT_PURCHASE_NOT_FOUND',
              message: 'The purchase for this checkout session could not be found.',
            });
          }

          const orders = await OrderModel.find({ purchaseId: purchase._id })
            .session(transaction)
            .sort({ createdAt: 1, _id: 1 })
            .lean<Order[]>()
            .exec();

          result = {
            purchase,
            orders,
            paymentHandoff: {
              status: 'payment_required',
              purchaseId: purchase._id.toString(),
              amount: purchase.total,
              currency: purchase.currency,
              reservationExpiresAt: checkoutSession.expiresAt,
            },
          };
          return;
        }

        if (checkoutSession.confirmedPurchaseId) {
          throw new AppError({
            statusCode: 500,
            code: 'CHECKOUT_SESSION_INVALID',
            message: 'The checkout session has an unexpected purchase reference.',
          });
        }

        if (checkoutSession.status !== 'active' || checkoutSession.expiresAt <= now) {
          throw new AppError({
            statusCode: 409,
            code: 'CHECKOUT_SESSION_NOT_ACTIVE',
            message: 'Only an active checkout session can be confirmed.',
          });
        }

        if (checkoutSession.acknowledgedQuoteVersion !== checkoutSession.quote.version) {
          throw new AppError({
            statusCode: 409,
            code: 'CHECKOUT_CHANGES_NOT_ACKNOWLEDGED',
            message: 'Review and acknowledge the current quote before confirming checkout.',
          });
        }

        const refreshedLinesResult = await revalidateCheckoutLines(
          checkoutSession.lines,
          transaction,
          now,
        );

        if (refreshedLinesResult.changes.length > 0) {
          throw new AppError({
            statusCode: 409,
            code: 'CHECKOUT_REVALIDATION_REQUIRED',
            message: 'Checkout details changed. Revalidate and acknowledge the updated quote.',
          });
        }

        const currentSession = checkoutSession.toObject() as CheckoutSession;
        currentSession.lines = refreshedLinesResult.lines;

        const sellerIds = currentSession.sellerGroups.map((group) => group.sellerId);
        const stores = await StoreModel.find({ sellerId: { $in: sellerIds } })
          .session(transaction)
          .lean<Store[]>()
          .exec();
        const storesBySellerId = new Map(stores.map((store) => [store.sellerId.toString(), store]));
        const fulfillmentChanges: CheckoutMaterialChange[] = [];

        for (const sellerGroup of currentSession.sellerGroups) {
          const groupLine = currentSession.lines.find((line) =>
            line.sellerId.equals(sellerGroup.sellerId),
          );

          if (!groupLine) {
            throw new AppError({
              statusCode: 500,
              code: 'CHECKOUT_SESSION_INVALID',
              message: 'The checkout session contains an invalid seller group.',
            });
          }

          const refreshedFulfillment = revalidateCheckoutFulfillment(
            storesBySellerId.get(sellerGroup.sellerId.toString()) ?? null,
            sellerGroup,
            groupLine,
          );

          sellerGroup.fulfillment = refreshedFulfillment.fulfillment;
          fulfillmentChanges.push(...refreshedFulfillment.changes);
        }

        if (fulfillmentChanges.length > 0) {
          throw new AppError({
            statusCode: 409,
            code: 'CHECKOUT_REVALIDATION_REQUIRED',
            message: 'Fulfillment details changed. Revalidate and acknowledge the updated quote.',
          });
        }

        const quantitiesByVariant = new Map<string, number>();

        for (const line of currentSession.lines) {
          const variantId = line.variantId.toString();
          quantitiesByVariant.set(
            variantId,
            (quantitiesByVariant.get(variantId) ?? 0) + line.quantity,
          );
        }

        const activeReservations = await StockReservationModel.find({
          checkoutSessionId,
          status: 'active',
        })
          .session(transaction)
          .lean<StockReservation[]>()
          .exec();
        const reservationsByVariant = new Map(
          activeReservations.map((reservation) => [reservation.variantId.toString(), reservation]),
        );

        if (reservationsByVariant.size !== quantitiesByVariant.size) {
          throw new AppError({
            statusCode: 409,
            code: 'CHECKOUT_STOCK_RESERVATION_UNAVAILABLE',
            message: 'A selected item no longer has a valid stock reservation.',
          });
        }

        for (const [variantId, quantity] of quantitiesByVariant) {
          const reservation = reservationsByVariant.get(variantId);

          if (!reservation || reservation.quantity !== quantity || reservation.expiresAt <= now) {
            throw new AppError({
              statusCode: 409,
              code: 'CHECKOUT_STOCK_RESERVATION_UNAVAILABLE',
              message: 'A selected item no longer has a valid stock reservation.',
            });
          }
        }

        const documents = buildCheckoutConfirmationDocuments(currentSession, storesBySellerId, now);
        const [purchaseDocument] = await PurchaseModel.create([documents.purchase], {
          session: transaction,
        });
        const orderDocuments = await OrderModel.create(
          documents.orders.map((order) => ({
            ...order,
            purchaseId: purchaseDocument._id,
          })),
          { session: transaction },
        );

        checkoutSession.status = 'confirmed';
        checkoutSession.confirmedPurchaseId = purchaseDocument._id;
        await checkoutSession.save({ session: transaction });

        result = {
          purchase: purchaseDocument.toObject() as Purchase,
          orders: orderDocuments.map((order) => order.toObject() as Order),
          paymentHandoff: {
            status: 'payment_required',
            purchaseId: purchaseDocument._id.toString(),
            amount: purchaseDocument.total,
            currency: purchaseDocument.currency,
            reservationExpiresAt: checkoutSession.expiresAt,
          },
        };
      });
    } finally {
      await transaction.endSession();
    }

    if (!result) {
      throw new AppError({
        statusCode: 500,
        code: 'CHECKOUT_CONFIRMATION_FAILED',
        message: 'Checkout could not be confirmed.',
      });
    }

    return result;
  }

  /** Cancels an unconfirmed checkout session and releases any active stock holds. */
  async cancel(userId: string, sessionId: string): Promise<CheckoutSession> {
    const ownerId = new mongoose.Types.ObjectId(userId);
    const checkoutSessionId = new mongoose.Types.ObjectId(sessionId);
    const transaction = await mongoose.startSession();
    let cancelledSession: CheckoutSession | null = null;

    try {
      await transaction.withTransaction(async () => {
        const checkoutSession = await CheckoutSessionModel.findOne({
          _id: checkoutSessionId,
          userId: ownerId,
        })
          .session(transaction)
          .exec();

        if (!checkoutSession) {
          throw new AppError({
            statusCode: 404,
            code: 'CHECKOUT_SESSION_NOT_FOUND',
            message: 'The checkout session could not be found.',
          });
        }

        if (checkoutSession.status === 'confirmed' || checkoutSession.confirmedPurchaseId) {
          throw new AppError({
            statusCode: 409,
            code: 'CHECKOUT_SESSION_ALREADY_CONFIRMED',
            message: 'A confirmed checkout session cannot be cancelled.',
          });
        }

        // Expired sessions may still have active reservations; release those too.
        await releaseCheckoutStockReservations(checkoutSessionId, transaction);

        checkoutSession.status = 'cancelled';
        await checkoutSession.save({ session: transaction });

        cancelledSession = checkoutSession.toObject() as CheckoutSession;
      });
    } finally {
      await transaction.endSession();
    }

    if (!cancelledSession) {
      throw new AppError({
        statusCode: 500,
        code: 'CHECKOUT_CANCELLATION_FAILED',
        message: 'The checkout session could not be cancelled.',
      });
    }

    return cancelledSession;
  }
}
