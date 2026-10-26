import mongoose from 'mongoose';

import { AppError } from '../../../../shared/errors/AppError.js';
import { StoreModel } from '../models/store.model.js';

import type { UpdateSellerStoreRequest } from '../schemas/seller-store.schema.js';
import type { Store, StoreLogo, StoreStatus } from '../types/store.types.js';
import { cloudinaryImageService } from '../../../../shared/uploads/cloudinary-image.service.js';

/** Retrieves a storefront owned by the authenticated seller. */
export class SellerStoreService {
  async getOwnStore(sellerId: string): Promise<Store> {
    if (!mongoose.isValidObjectId(sellerId)) {
      throw new AppError({
        statusCode: 400,
        code: 'INVALID_SELLER_ID',
        message: 'A valid seller ID is required.',
      });
    }

    const store = await StoreModel.findOne({
      sellerId: new mongoose.Types.ObjectId(sellerId),
    }).exec();

    if (!store) {
      throw new AppError({
        statusCode: 404,
        code: 'STORE_NOT_FOUND',
        message: 'The authenticated seller storefront could not be found.',
      });
    }

    return store.toObject() as Store;
  }

  /** Updates editable storefront details belonging to the authenticated seller. */
  async updateOwnStore(sellerId: string, changes: UpdateSellerStoreRequest): Promise<Store> {
    if (!mongoose.isValidObjectId(sellerId)) {
      throw new AppError({
        statusCode: 400,
        code: 'INVALID_SELLER_ID',
        message: 'A valid seller ID is required.',
      });
    }

    const store = await StoreModel.findOne({
      sellerId: new mongoose.Types.ObjectId(sellerId),
    }).exec();

    if (!store) {
      throw new AppError({
        statusCode: 404,
        code: 'STORE_NOT_FOUND',
        message: 'The authenticated seller storefront could not be found.',
      });
    }

    store.set(changes);
    await store.save();

    return store.toObject() as Store;
  }

  /** Replaces the logo on the authenticated seller's storefront. */
  async updateOwnStoreLogo(sellerId: string, logo: StoreLogo): Promise<Store> {
    if (!mongoose.isValidObjectId(sellerId)) {
      throw new AppError({
        statusCode: 400,
        code: 'INVALID_SELLER_ID',
        message: 'A valid seller ID is required.',
      });
    }

    const store = await StoreModel.findOne({
      sellerId: new mongoose.Types.ObjectId(sellerId),
    }).exec();

    if (!store) {
      throw new AppError({
        statusCode: 404,
        code: 'STORE_NOT_FOUND',
        message: 'The authenticated seller storefront could not be found.',
      });
    }

    const previousLogo = store.logo;
    store.logo = logo;
    await store.save();

    if (previousLogo?.publicId) {
      try {
        await cloudinaryImageService.delete(previousLogo.publicId);
      } catch (cleanupError) {
        console.error('Failed to delete the replaced store logo.', {
          publicId: previousLogo.publicId,
          cleanupError,
        });
      }
    }

    return store.toObject() as Store;
  }

  /** Activates or pauses the authenticated seller's storefront. */
  async updateOwnStoreStatus(sellerId: string, status: StoreStatus): Promise<Store> {
    if (!mongoose.isValidObjectId(sellerId)) {
      throw new AppError({
        statusCode: 400,
        code: 'INVALID_SELLER_ID',
        message: 'A valid seller ID is required.',
      });
    }

    const store = await StoreModel.findOne({
      sellerId: new mongoose.Types.ObjectId(sellerId),
    }).exec();

    if (!store) {
      throw new AppError({
        statusCode: 404,
        code: 'STORE_NOT_FOUND',
        message: 'The authenticated seller storefront could not be found.',
      });
    }

    store.status = status;
    await store.save();

    return store.toObject() as Store;
  }
}
