import mongoose, { type ClientSession } from 'mongoose';

import { AppError } from '../../../../shared/errors/AppError.js';
import { StoreModel } from '../../../sellers/store/models/store.model.js';
import type { Store } from '../../../sellers/store/types/store.types.js';
import { CustomerAddressModel } from '../../addresses/models/address.model.js';
import type { AddressDetails, CustomerAddress } from '../../addresses/types/address.types.js';
import type { UpdateCheckoutFulfillmentRequest } from '../schemas/checkout-session.schema.js';
import type { CheckoutFulfillmentSelection } from '../types/checkout-session.types.js';

type CheckoutFulfillmentGroupInput = UpdateCheckoutFulfillmentRequest['groups'][number];

/** Resolves a selected option against current store settings and snapshots its details. */
export async function resolveCheckoutFulfillmentSelection(
  store: Store | null,
  userId: string,
  input: CheckoutFulfillmentGroupInput,
  session: ClientSession,
): Promise<CheckoutFulfillmentSelection> {
  if (!store || store.status !== 'active') {
    throw new AppError({
      statusCode: 409,
      code: 'CHECKOUT_STORE_UNAVAILABLE',
      message: 'A seller store in this checkout is no longer available.',
    });
  }

  const profile = store.fulfilmentProfile;

  if (!profile || !profile.methods.includes(input.method)) {
    throw new AppError({
      statusCode: 409,
      code: 'FULFILLMENT_METHOD_UNAVAILABLE',
      message: 'The selected fulfillment method is not available from this store.',
    });
  }

  if (input.method === 'delivery') {
    let addressSnapshot: AddressDetails;
    let savedAddressId: mongoose.Types.ObjectId | null = null;

    if (input.address.type === 'saved') {
      const savedAddress = await CustomerAddressModel.findOne({
        _id: new mongoose.Types.ObjectId(input.address.addressId),
        userId: new mongoose.Types.ObjectId(userId),
      })
        .session(session)
        .lean<CustomerAddress>()
        .exec();

      if (!savedAddress) {
        throw new AppError({
          statusCode: 404,
          code: 'ADDRESS_NOT_FOUND',
          message: 'The selected delivery address could not be found.',
        });
      }

      savedAddressId = savedAddress._id;
      addressSnapshot = {
        recipientName: savedAddress.recipientName,
        phone: savedAddress.phone,
        region: savedAddress.region,
        city: savedAddress.city,
        neighborhood: savedAddress.neighborhood,
        street: savedAddress.street,
        deliveryInstructions: savedAddress.deliveryInstructions,
      };
    } else {
      addressSnapshot = {
        ...input.address.address,
        deliveryInstructions: input.address.address.deliveryInstructions ?? null,
      };
    }

    if (!profile.serviceRegions.some((region) => region === addressSnapshot.region)) {
      throw new AppError({
        statusCode: 409,
        code: 'DELIVERY_REGION_UNAVAILABLE',
        message: 'This store does not deliver to the selected address region.',
      });
    }

    const matchingOptions = store.deliveryOptions.filter(
      (option) => option.name === input.optionName,
    );

    if (matchingOptions.length !== 1) {
      throw new AppError({
        statusCode: 409,
        code: 'FULFILLMENT_OPTION_UNAVAILABLE',
        message: 'The selected delivery option is unavailable or ambiguous.',
      });
    }

    const [option] = matchingOptions;

    return {
      method: 'delivery',
      optionName: option.name,
      optionDescription: option.description,
      fee: option.fee,
      savedAddressId,
      deliveryAddressSnapshot: addressSnapshot,
      collectionLocation: null,
    };
  }

  const matchingOptions = store.collectionOptions.filter(
    (option) => option.name === input.optionName,
  );

  if (matchingOptions.length !== 1) {
    throw new AppError({
      statusCode: 409,
      code: 'FULFILLMENT_OPTION_UNAVAILABLE',
      message: 'The selected collection option is unavailable or ambiguous.',
    });
  }

  const [option] = matchingOptions;

  return {
    method: 'collection',
    optionName: option.name,
    optionDescription: option.description,
    fee: option.fee,
    savedAddressId: null,
    deliveryAddressSnapshot: null,
    collectionLocation: {
      region: store.location.region,
      city: store.location.city,
      address: store.location.address,
    },
  };
}
