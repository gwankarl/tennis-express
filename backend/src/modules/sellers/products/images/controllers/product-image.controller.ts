import type { RequestHandler } from 'express';

import { AppError } from '../../../../../shared/errors/AppError.js';
import type { SellerProductIdParams } from '../../management/schemas/product.schema.js';
import type {
  AddProductImageRequest,
  ProductImageParams,
  ReorderProductImagesRequest,
  UpdateProductImageRequest,
} from '../schemas/product-image.schema.js';

import { ProductImageService } from '../services/product-image.service.js';
import { ProductImageListService } from '../services/product-image-list.service.js';
import { ProductImageUpdateService } from '../services/product-image-update.service.js';
import { ProductImageReorderService } from '../services/product-image-reorder.service.js';
import { ProductImageDeleteService } from '../services/product-image-delete.service.js';

const productImageService = new ProductImageService();
const productImageListService = new ProductImageListService();
const productImageUpdateService = new ProductImageUpdateService();
const productImageReorderService = new ProductImageReorderService();
const productImageDeleteService = new ProductImageDeleteService();

/** Uploads and registers one image for a product owned by the authenticated seller. */
export const uploadAndRegisterProductImage: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth?.userId) {
      throw new AppError({
        statusCode: 401,
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required to upload a product image.',
      });
    }

    if (!req.file) {
      throw new AppError({
        statusCode: 400,
        code: 'IMAGE_REQUIRED',
        message: 'Select an image to upload.',
      });
    }

    const { productId } = req.params as unknown as SellerProductIdParams;
    const input = req.body as AddProductImageRequest;

    const image = await productImageService.uploadAndRegister({
      sellerId: req.auth.userId,
      productId,
      buffer: req.file.buffer,
      originalFileName: req.file.originalname,
      altText: input.altText,
    });

    res.status(201).json({
      success: true,
      data: { image },
    });
  } catch (error) {
    next(error);
  }
};

/** Lists images for a product owned by the authenticated seller. */
export const listSellerProductImages: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth?.userId) {
      throw new AppError({
        statusCode: 401,
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required to access product images.',
      });
    }

    const { productId } = req.params as unknown as SellerProductIdParams;
    const images = await productImageListService.listOwnImages(req.auth.userId, productId);

    res.status(200).json({
      success: true,
      data: { images },
    });
  } catch (error) {
    next(error);
  }
};

/** Updates alt text or primary status for an image on the seller's product. */
export const updateSellerProductImage: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth?.userId) {
      throw new AppError({
        statusCode: 401,
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required to update a product image.',
      });
    }

    const { productId, imageId } = req.params as unknown as ProductImageParams;
    const changes = req.body as UpdateProductImageRequest;

    const image = await productImageUpdateService.updateOwnImage(
      req.auth.userId,
      productId,
      imageId,
      changes,
    );

    res.status(200).json({
      success: true,
      data: { image },
    });
  } catch (error) {
    next(error);
  }
};

/** Reorders all images on a product owned by the authenticated seller. */
export const reorderSellerProductImages: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth?.userId) {
      throw new AppError({
        statusCode: 401,
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required to reorder product images.',
      });
    }

    const { productId } = req.params as unknown as SellerProductIdParams;
    const input = req.body as ReorderProductImagesRequest;

    const images = await productImageReorderService.reorderOwnImages(
      req.auth.userId,
      productId,
      input,
    );

    res.status(200).json({
      success: true,
      data: { images },
    });
  } catch (error) {
    next(error);
  }
};

/** Deletes an image from a product owned by the authenticated seller. */
export const deleteSellerProductImage: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth?.userId) {
      throw new AppError({
        statusCode: 401,
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required to delete a product image.',
      });
    }

    const { productId, imageId } = req.params as unknown as ProductImageParams;
    const image = await productImageDeleteService.deleteOwnImage(
      req.auth.userId,
      productId,
      imageId,
    );

    res.status(200).json({
      success: true,
      data: { image },
    });
  } catch (error) {
    next(error);
  }
};
