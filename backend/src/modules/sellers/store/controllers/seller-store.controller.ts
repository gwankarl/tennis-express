import type { RequestHandler } from 'express';

import { AppError } from '../../../../shared/errors/AppError.js';
import { SellerStoreService } from '../services/seller-store.service.js';
import type {
  UpdateSellerStoreRequest,
  UpdateSellerStoreStatusRequest,
} from '../schemas/seller-store.schema.js';
import { cloudinaryImageService } from '../../../../shared/uploads/cloudinary-image.service.js';
import type { StoreLogo } from '../types/store.types.js';

const sellerStoreService = new SellerStoreService();

/** Returns the authenticated seller's storefront. */
export const getOwnStore: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth?.userId) {
      throw new AppError({
        statusCode: 401,
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required to access this resource.',
      });
    }

    const store = await sellerStoreService.getOwnStore(req.auth.userId);

    res.status(200).json({
      success: true,
      data: { store },
    });
  } catch (error) {
    next(error);
  }
};

/** Updates editable details on the authenticated seller's storefront. */
export const updateOwnStore: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth?.userId) {
      throw new AppError({
        statusCode: 401,
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required to update this resource.',
      });
    }

    const changes = req.body as UpdateSellerStoreRequest;
    const store = await sellerStoreService.updateOwnStore(req.auth.userId, changes);

    res.status(200).json({
      success: true,
      data: { store },
    });
  } catch (error) {
    next(error);
  }
};

/** Uploads and saves a replacement logo for the authenticated seller's store. */
export const updateOwnStoreLogo: RequestHandler = async (req, res, next) => {
  let uploadedLogoPublicId: string | undefined;

  try {
    if (!req.auth?.userId) {
      throw new AppError({
        statusCode: 401,
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required to update this resource.',
      });
    }

    if (!req.file) {
      throw new AppError({
        statusCode: 400,
        code: 'STORE_LOGO_REQUIRED',
        message: 'Upload a store logo using the "image" field.',
      });
    }

    const logo: StoreLogo = await cloudinaryImageService.upload({
      buffer: req.file.buffer,
      folder: 'tennis-xpress/store-logos',
    });

    uploadedLogoPublicId = logo.publicId;

    const store = await sellerStoreService.updateOwnStoreLogo(req.auth.userId, logo);

    // The database now references this upload, so it must not be cleaned up.
    uploadedLogoPublicId = undefined;

    res.status(200).json({
      success: true,
      data: { store },
    });
  } catch (error) {
    if (uploadedLogoPublicId) {
      try {
        await cloudinaryImageService.delete(uploadedLogoPublicId);
      } catch (cleanupError) {
        console.error('Failed to clean up an unused store logo.', {
          publicId: uploadedLogoPublicId,
          cleanupError,
        });
      }
    }

    next(error);
  }
};

/** Changes the status of the authenticated seller's storefront. */
export const updateOwnStoreStatus: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth?.userId) {
      throw new AppError({
        statusCode: 401,
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required to update this resource.',
      });
    }

    const { status } = req.body as UpdateSellerStoreStatusRequest;
    const store = await sellerStoreService.updateOwnStoreStatus(req.auth.userId, status);

    res.status(200).json({
      success: true,
      data: { store },
    });
  } catch (error) {
    next(error);
  }
};
