import type { RequestHandler } from 'express';

import { AppError } from '../../../../../shared/errors/AppError.js';
import type { SellerProductIdParams } from '../../management/schemas/product.schema.js';
import type {
  CreateProductVariantRequest,
  ListProductVariantsQuery,
  ProductVariantParams,
  UpdateProductVariantRequest,
  UpdateProductVariantStatusRequest,
} from '../schemas/product-variant.schema.js';

import { ProductVariantService } from '../services/product-variant.service.js';
import { ProductVariantListService } from '../services/product-variant-list.service.js';
import { ProductVariantDetailService } from '../services/product-variant-detail.service.js';
import { ProductVariantUpdateService } from '../services/product-variant-update.service.js';
import { ProductVariantStatusService } from '../services/product-variant-status.service.js';

const productVariantService = new ProductVariantService();
const productVariantListService = new ProductVariantListService();
const productVariantDetailService = new ProductVariantDetailService();
const productVariantUpdateService = new ProductVariantUpdateService();
const productVariantStatusService = new ProductVariantStatusService();

/** Creates a variant for a product owned by the authenticated seller. */
export const createProductVariant: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth?.userId) {
      throw new AppError({
        statusCode: 401,
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required to create a product variant.',
      });
    }

    const { productId } = req.params as unknown as SellerProductIdParams;
    const input = req.body as CreateProductVariantRequest;

    const variant = await productVariantService.createVariant(req.auth.userId, productId, input);

    res.status(201).json({
      success: true,
      data: { variant },
    });
  } catch (error) {
    next(error);
  }
};

/** Lists paginated variants for a product owned by the authenticated seller. */
export const listProductVariants: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth?.userId) {
      throw new AppError({
        statusCode: 401,
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required to access product variants.',
      });
    }

    const { productId } = req.params as unknown as SellerProductIdParams;
    const query = res.locals.validatedQuery as ListProductVariantsQuery;

    const result = await productVariantListService.listOwnVariants(
      req.auth.userId,
      productId,
      query,
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/** Retrieves a variant belonging to a product owned by the authenticated seller. */
export const getProductVariant: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth?.userId) {
      throw new AppError({
        statusCode: 401,
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required to access product variants.',
      });
    }

    const params = req.params as unknown as ProductVariantParams;
    const variant = await productVariantDetailService.getOwnVariant(req.auth.userId, params);

    res.status(200).json({
      success: true,
      data: { variant },
    });
  } catch (error) {
    next(error);
  }
};

/** Updates a variant belonging to a product owned by the authenticated seller. */
export const updateProductVariant: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth?.userId) {
      throw new AppError({
        statusCode: 401,
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required to update a product variant.',
      });
    }

    const params = req.params as unknown as ProductVariantParams;
    const changes = req.body as UpdateProductVariantRequest;

    const variant = await productVariantUpdateService.updateOwnVariant(
      req.auth.userId,
      params,
      changes,
    );

    res.status(200).json({
      success: true,
      data: { variant },
    });
  } catch (error) {
    next(error);
  }
};

/** Changes the status of a variant owned by the authenticated seller. */
export const updateProductVariantStatus: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth?.userId) {
      throw new AppError({
        statusCode: 401,
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required to change product variant status.',
      });
    }

    const params = req.params as unknown as ProductVariantParams;
    const input = req.body as UpdateProductVariantStatusRequest;

    const variant = await productVariantStatusService.updateOwnVariantStatus(
      req.auth.userId,
      params,
      input,
    );

    res.status(200).json({
      success: true,
      data: { variant },
    });
  } catch (error) {
    next(error);
  }
};
