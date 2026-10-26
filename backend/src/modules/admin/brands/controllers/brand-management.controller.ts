import type { RequestHandler } from 'express';
import mongoose from 'mongoose';

import { AppError } from '../../../../shared/errors/AppError.js';
import type { PaginationQuery } from '../../../../shared/pagination.js';
import { BrandManagementService } from '../services/brand-management.service.js';
import type {
  CreateBrandRequest,
  ListBrandsQuery,
  UpdateBrandRequest,
  UpdateBrandStatusRequest,
} from '../schemas/brand-management.schema.js';
import { cloudinaryImageService } from '../../../../shared/uploads/cloudinary-image.service.js';
import type { BrandImage } from '../types/brand.types.js';

const brandManagementService = new BrandManagementService();

function getAdminId(req: Parameters<RequestHandler>[0]): mongoose.Types.ObjectId {
  if (!req.auth?.userId || !mongoose.isValidObjectId(req.auth.userId)) {
    throw new AppError({
      statusCode: 401,
      code: 'AUTHENTICATION_REQUIRED',
      message: 'Authentication is required to access this resource.',
    });
  }

  return new mongoose.Types.ObjectId(req.auth.userId);
}

/** Lists brands using validated pagination and optional status filtering. */
export const listBrands: RequestHandler = async (req, res, next) => {
  try {
    const query = res.locals.validatedQuery as ListBrandsQuery & PaginationQuery;
    const result = await brandManagementService.list(query);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/** Retrieves one brand by its validated route ID. */
export const getBrand: RequestHandler = async (req, res, next) => {
  try {
    const brand = await brandManagementService.getById(req.params.brandId as string);

    res.status(200).json({
      success: true,
      data: { brand },
    });
  } catch (error) {
    next(error);
  }
};

/** Creates a brand and optionally uploads its logo. */
export const createBrand: RequestHandler = async (req, res, next) => {
  let uploadedLogoPublicId: string | undefined;

  try {
    const input = req.body as CreateBrandRequest;

    const logo: BrandImage | null = req.file
      ? await cloudinaryImageService.upload({
          buffer: req.file.buffer,
          folder: 'tennis-xpress/brand-logos',
        })
      : null;

    uploadedLogoPublicId = logo?.publicId;

    const brand = await brandManagementService.create({
      ...input,
      logo,
      createdBy: getAdminId(req),
    });

    // The saved brand now owns the uploaded image.
    uploadedLogoPublicId = undefined;

    res.status(201).json({
      success: true,
      data: { brand },
    });
  } catch (error) {
    if (uploadedLogoPublicId) {
      try {
        await cloudinaryImageService.delete(uploadedLogoPublicId);
      } catch (cleanupError) {
        console.error('Failed to clean up an unused brand logo.', {
          publicId: uploadedLogoPublicId,
          cleanupError,
        });
      }
    }

    next(error);
  }
};

/** Updates brand fields and optionally replaces its logo. */
export const updateBrand: RequestHandler = async (req, res, next) => {
  let uploadedLogoPublicId: string | undefined;

  try {
    const changes = req.body as UpdateBrandRequest;

    if (Object.keys(changes).length === 0 && !req.file) {
      throw new AppError({
        statusCode: 400,
        code: 'BRAND_UPDATE_EMPTY',
        message: 'Provide brand fields or a replacement logo.',
      });
    }

    const logo = req.file
      ? await cloudinaryImageService.upload({
          buffer: req.file.buffer,
          folder: 'tennis-xpress/brand-logos',
        })
      : undefined;

    uploadedLogoPublicId = logo?.publicId;

    const brand = await brandManagementService.update({
      brandId: req.params.brandId as string,
      updatedBy: getAdminId(req),
      changes,
      logo,
    });

    // The update succeeded; the service has also attempted old-logo cleanup.
    uploadedLogoPublicId = undefined;

    res.status(200).json({
      success: true,
      data: { brand },
    });
  } catch (error) {
    if (uploadedLogoPublicId) {
      try {
        await cloudinaryImageService.delete(uploadedLogoPublicId);
      } catch (cleanupError) {
        console.error('Failed to clean up an unused brand logo.', {
          publicId: uploadedLogoPublicId,
          cleanupError,
        });
      }
    }

    next(error);
  }
};

/** Activates or deactivates a brand using the model's status values. */
export const updateBrandStatus: RequestHandler = async (req, res, next) => {
  try {
    const body = req.body as UpdateBrandStatusRequest;
    const brand = await brandManagementService.updateStatus({
      brandId: req.params.brandId as string,
      updatedBy: getAdminId(req),
      status: body.status,
    });

    res.status(200).json({
      success: true,
      data: { brand },
    });
  } catch (error) {
    next(error);
  }
};
