import mongoose from 'mongoose';

import { CustomerAddressModel } from '../models/address.model.js';
import type { CustomerAddress, CustomerAddressView } from '../types/address.types.js';
import { CreateAddressRequest, UpdateAddressRequest } from '../schemas/address.schema.js';
import { AppError } from '../../../../shared/errors/AppError.js';

/** Provides owner-scoped customer address operations. */
export class AddressService {
  /** Lists the authenticated user's saved addresses, with the default first. */
  async listMine(userId: string): Promise<CustomerAddressView[]> {
    const addresses = await CustomerAddressModel.find({
      userId: new mongoose.Types.ObjectId(userId),
    })
      .sort({ isDefault: -1, createdAt: -1, _id: -1 })
      .lean<CustomerAddress[]>()
      .exec();

    return addresses.map(({ _id, userId: _ownerId, ...address }) => ({
      ...address,
      id: _id.toString(),
    }));
  }

  /** Saves an address for the user, replacing their default when requested. */
  async createMine(userId: string, input: CreateAddressRequest): Promise<CustomerAddressView> {
    const addressData = {
      userId: new mongoose.Types.ObjectId(userId),
      recipientName: input.recipientName,
      phone: input.phone,
      region: input.region,
      city: input.city,
      neighborhood: input.neighborhood,
      street: input.street,
      deliveryInstructions: input.deliveryInstructions ?? null,
      isDefault: input.isDefault,
    };

    if (!input.isDefault) {
      const address = await CustomerAddressModel.create(addressData);
      return this.toAddressView(address);
    }

    const session = await mongoose.startSession();

    try {
      const address = await session.withTransaction(async () => {
        await CustomerAddressModel.updateMany(
          { userId: addressData.userId, isDefault: true },
          { $set: { isDefault: false } },
          { session },
        ).exec();

        const [createdAddress] = await CustomerAddressModel.create([addressData], { session });

        return createdAddress.toObject() as CustomerAddress;
      });

      return this.toAddressView(address);
    } finally {
      await session.endSession();
    }
  }

  /** Updates an address owned by the user, replacing their default when requested. */
  async updateMine(
    userId: string,
    addressId: string,
    input: UpdateAddressRequest,
  ): Promise<CustomerAddressView> {
    const ownerObjectId = new mongoose.Types.ObjectId(userId);
    const addressObjectId = new mongoose.Types.ObjectId(addressId);

    if (input.isDefault !== true) {
      const address = await CustomerAddressModel.findOneAndUpdate(
        { _id: addressObjectId, userId: ownerObjectId },
        { $set: input },
        { new: true, runValidators: true },
      ).exec();

      if (!address) {
        throw new AppError({
          statusCode: 404,
          code: 'ADDRESS_NOT_FOUND',
          message: 'The address was not found.',
        });
      }

      return this.toAddressView(address);
    }

    const session = await mongoose.startSession();

    try {
      const address = await session.withTransaction(async () => {
        const existingAddress = await CustomerAddressModel.findOne({
          _id: addressObjectId,
          userId: ownerObjectId,
        })
          .session(session)
          .exec();

        if (!existingAddress) {
          throw new AppError({
            statusCode: 404,
            code: 'ADDRESS_NOT_FOUND',
            message: 'The address was not found.',
          });
        }

        await CustomerAddressModel.updateMany(
          { userId: ownerObjectId, isDefault: true },
          { $set: { isDefault: false } },
          { session },
        ).exec();

        const updatedAddress = await CustomerAddressModel.findOneAndUpdate(
          { _id: addressObjectId, userId: ownerObjectId },
          { $set: input },
          { new: true, runValidators: true, session },
        ).exec();

        if (!updatedAddress) {
          throw new AppError({
            statusCode: 404,
            code: 'ADDRESS_NOT_FOUND',
            message: 'The address was not found.',
          });
        }

        return updatedAddress.toObject() as CustomerAddress;
      });

      return this.toAddressView(address);
    } finally {
      await session.endSession();
    }
  }

  /** Deletes an address owned by the user. */
  async deleteMine(userId: string, addressId: string): Promise<void> {
    const deletedAddress = await CustomerAddressModel.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(addressId),
      userId: new mongoose.Types.ObjectId(userId),
    }).exec();

    if (!deletedAddress) {
      throw new AppError({
        statusCode: 404,
        code: 'ADDRESS_NOT_FOUND',
        message: 'The address was not found.',
      });
    }
  }

  private toAddressView(address: CustomerAddress): CustomerAddressView {
    return {
      id: address._id.toString(),
      recipientName: address.recipientName,
      phone: address.phone,
      region: address.region,
      city: address.city,
      neighborhood: address.neighborhood,
      street: address.street,
      deliveryInstructions: address.deliveryInstructions,
      isDefault: address.isDefault,
      createdAt: address.createdAt,
      updatedAt: address.updatedAt,
    };
  }
}
