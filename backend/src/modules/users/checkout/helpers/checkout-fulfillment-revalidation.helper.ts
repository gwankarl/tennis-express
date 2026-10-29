import { AppError } from '../../../../shared/errors/AppError.js';
import type { Store } from '../../../sellers/store/types/store.types.js';
import type {
  CheckoutFulfillmentSelection,
  CheckoutLineSnapshot,
  CheckoutMaterialChange,
  CheckoutSellerGroup,
} from '../types/checkout-session.types.js';

export interface RevalidatedCheckoutFulfillment {
  fulfillment: CheckoutFulfillmentSelection | null;
  changes: CheckoutMaterialChange[];
}

/** Refreshes selected fulfillment details while preserving the saved address snapshot. */
export function revalidateCheckoutFulfillment(
  store: Store | null,
  sellerGroup: CheckoutSellerGroup,
  groupLine: CheckoutLineSnapshot,
): RevalidatedCheckoutFulfillment {
  const fulfillment = sellerGroup.fulfillment;

  if (!fulfillment) {
    return { fulfillment: null, changes: [] };
  }

  if (!store || store.status !== 'active' || !store._id.equals(groupLine.storeId)) {
    throw new AppError({
      statusCode: 409,
      code: 'CHECKOUT_STORE_UNAVAILABLE',
      message: 'A seller store in this checkout is no longer available.',
    });
  }

  const profile = store.fulfilmentProfile;

  if (!profile || !profile.methods.includes(fulfillment.method)) {
    throw new AppError({
      statusCode: 409,
      code: 'FULFILLMENT_METHOD_UNAVAILABLE',
      message: 'The selected fulfillment method is no longer available.',
    });
  }

  if (
    fulfillment.method === 'delivery' &&
    (!fulfillment.deliveryAddressSnapshot ||
      !profile.serviceRegions.some(
        (region) => region === fulfillment.deliveryAddressSnapshot?.region,
      ))
  ) {
    throw new AppError({
      statusCode: 409,
      code: 'DELIVERY_REGION_UNAVAILABLE',
      message: 'This store no longer delivers to the selected address region.',
    });
  }

  const options =
    fulfillment.method === 'delivery' ? store.deliveryOptions : store.collectionOptions;
  const matchingOptions = options.filter((option) => option.name === fulfillment.optionName);

  if (matchingOptions.length !== 1) {
    throw new AppError({
      statusCode: 409,
      code: 'FULFILLMENT_OPTION_UNAVAILABLE',
      message: 'The selected fulfillment option is unavailable or ambiguous.',
    });
  }

  const [option] = matchingOptions;
  const refreshedFulfillment: CheckoutFulfillmentSelection = {
    ...fulfillment,
    optionDescription: option.description,
    fee: option.fee,
    collectionLocation:
      fulfillment.method === 'collection'
        ? {
            region: store.location.region,
            city: store.location.city,
            address: store.location.address,
          }
        : null,
  };

  const changes: CheckoutMaterialChange[] =
    fulfillment.fee === option.fee
      ? []
      : [
          {
            kind: 'fulfillment_fee',
            sellerId: sellerGroup.sellerId.toString(),
            previousValue: fulfillment.fee,
            currentValue: option.fee,
          },
        ];

  return { fulfillment: refreshedFulfillment, changes };
}
