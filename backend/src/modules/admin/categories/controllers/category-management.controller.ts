import type { RequestHandler } from 'express';
import { Types } from 'mongoose';

import { AppError } from '../../../../shared/errors/AppError.js';
import type { PaginationQuery } from '../../../../shared/pagination.js';
import { CategoryManagementService } from '../services/category-management.service.js';
import type { CategoryStatus } from '../types/category.types.js';
import type { CreateCategoryRequest, UpdateCategoryRequest } from '../schemas/category.schema.js';
import { cloudinaryImageService } from '../../../../shared/uploads/cloudinary-image.service.js';
import type { Category } from '../types/category.types.js';

function getAuthenticatedAdminId(req: Parameters<RequestHandler>[0]): Types.ObjectId {
  if (!req.auth?.userId) {
    throw new AppError({
      statusCode: 401,
      code: 'AUTHENTICATION_REQUIRED',
      message: 'Authentication is required to access this resource.',
    });
  }

  return new Types.ObjectId(req.auth.userId);
}

function requireUploadedImage(req: Parameters<RequestHandler>[0]) {
  if (!req.file) {
    throw new AppError({
      statusCode: 400,
      code: 'CATEGORY_IMAGE_REQUIRED',
      message: 'A category image must be uploaded.',
    });
  }

  return req.file;
}

/** Lists categories for the administrator, optionally filtered by status. */
export const listCategories: RequestHandler = async (req, res, next) => {
  try {
    const query = res.locals.validatedQuery as PaginationQuery & {
      status?: CategoryStatus;
    };

    const result = await CategoryManagementService.list(query);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/** Creates a category for the authenticated administrator. */
export const createCategory: RequestHandler = async (req, res, next) => {
  try {
    const input = req.body as CreateCategoryRequest;

    const file = requireUploadedImage(req);
    const image = await cloudinaryImageService.upload({
      buffer: file.buffer,
      folder: 'tennis-xpress/category-images',
    });

    let category;

    try {
      category = await CategoryManagementService.create({
        ...input,
        image,
        createdBy: getAuthenticatedAdminId(req),
      });
    } catch (error) {
      try {
        await cloudinaryImageService.delete(image.publicId);
      } catch (cleanupError) {
        console.error('Failed to clean up an unused category image.', {
          publicId: image.publicId,
          cleanupError,
        });
      }

      throw error;
    }

    res.status(201).json({ success: true, data: { category } });
  } catch (error) {
    next(error);
  }
};

/** Updates a category and optionally replaces its image. */
export const updateCategory: RequestHandler = async (req, res, next) => {
  let uploadedPublicId: string | undefined;

  try {
    const categoryId = req.params.categoryId;

    if (typeof categoryId !== 'string') {
      throw new AppError({
        statusCode: 400,
        code: 'INVALID_CATEGORY_ID',
        message: 'A valid category ID is required.',
      });
    }

    const changes = req.body as UpdateCategoryRequest;

    if (Object.keys(changes).length === 0 && !req.file) {
      throw new AppError({
        statusCode: 400,
        code: 'CATEGORY_UPDATE_EMPTY',
        message: 'Provide category fields or a replacement image.',
      });
    }

    const image = req.file
      ? await cloudinaryImageService.upload({
          buffer: req.file.buffer,
          folder: 'tennis-xpress/category-images',
        })
      : undefined;

    uploadedPublicId = image?.publicId;

    const category: Category = await CategoryManagementService.update({
      categoryId: new Types.ObjectId(categoryId),
      updatedBy: getAuthenticatedAdminId(req),
      changes,
      image,
    });

    res.status(200).json({
      success: true,
      data: { category },
    });
  } catch (error) {
    if (uploadedPublicId) {
      try {
        await cloudinaryImageService.delete(uploadedPublicId);
      } catch (cleanupError) {
        console.error('Failed to clean up an unused category image.', {
          publicId: uploadedPublicId,
          cleanupError,
        });
      }
    }

    next(error);
  }
};
