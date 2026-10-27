import type { RequestHandler } from 'express';

import { AppError } from '../../../../../shared/errors/AppError.js';
import type {
  CreateProductDraftRequest,
  ListSellerProductsQuery,
  SellerProductIdParams,
} from '../schemas/product.schema.js';
import type { UpdateSellerProductRequest } from '../schemas/product.schema.js';

import { ProductDraftService } from '../services/product-draft.service.js';
import { ProductListService } from '../services/product-list.service.js';
import { ProductDetailService } from '../services/product-detail.service.js';
import { ProductUpdateService } from '../services/product-update.service.js';
import { ProductArchiveService } from '../services/product-archive.service.js';
import { ProductRestoreService } from '../services/product-restore.service.js';
import { ProductSubmissionService } from '../services/product-submission.service.js';

const productDraftService = new ProductDraftService();
const productListService = new ProductListService();
const productDetailService = new ProductDetailService();
const productUpdateService = new ProductUpdateService();
const productArchiveService = new ProductArchiveService();
const productRestoreService = new ProductRestoreService();
const productSubmissionService = new ProductSubmissionService();

/** Creates a product draft for the authenticated seller. */
export const createProductDraft: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth?.userId) {
      throw new AppError({
        statusCode: 401,
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required to create a product draft.',
      });
    }

    // validateBody parses and replaces req.body before this handler runs.
    const input = req.body as CreateProductDraftRequest;
    const product = await productDraftService.createDraft(req.auth.userId, input);

    res.status(201).json({
      success: true,
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};

/** Lists products owned by the authenticated seller using validated filters. */
export const listSellerProducts: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth?.userId) {
      throw new AppError({
        statusCode: 401,
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required to access seller products.',
      });
    }

    const query = res.locals.validatedQuery as ListSellerProductsQuery;
    const result = await productListService.listOwnProducts(req.auth.userId, query);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/** Retrieves a product owned by the authenticated seller. */
export const getSellerProduct: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth?.userId) {
      throw new AppError({
        statusCode: 401,
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required to access seller products.',
      });
    }

    const { productId } = req.params as unknown as SellerProductIdParams;
    const product = await productDetailService.getOwnProduct(req.auth.userId, productId);

    res.status(200).json({
      success: true,
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};

/** Updates editable fields on a product owned by the authenticated seller. */
export const updateSellerProduct: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) {
      throw new AppError({
        statusCode: 401,
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required.',
      });
    }

    const { productId } = req.params as unknown as SellerProductIdParams;
    const changes = req.body as UpdateSellerProductRequest;

    const product = await productUpdateService.updateOwnProduct(
      req.auth.userId,
      productId,
      changes,
    );

    res.status(200).json({
      success: true,
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};

/** Archives a product owned by the authenticated seller. */
export const archiveSellerProduct: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth?.userId) {
      throw new AppError({
        statusCode: 401,
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required to archive a product.',
      });
    }

    const { productId } = req.params as unknown as SellerProductIdParams;
    const product = await productArchiveService.archiveOwnProduct(req.auth.userId, productId);

    res.status(200).json({
      success: true,
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};

/** Restores an archived product owned by the authenticated seller. */
export const restoreSellerProduct: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth?.userId) {
      throw new AppError({
        statusCode: 401,
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required to restore a product.',
      });
    }

    const { productId } = req.params as unknown as SellerProductIdParams;
    const product = await productRestoreService.restoreOwnProduct(req.auth.userId, productId);

    res.status(200).json({
      success: true,
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};

/** Submits the authenticated seller's product for administrator moderation. */
export const submitSellerProduct: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth?.userId) {
      throw new AppError({
        statusCode: 401,
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required to submit a product.',
      });
    }

    const { productId } = req.params as unknown as SellerProductIdParams;
    const product = await productSubmissionService.submitOwnProduct(req.auth.userId, productId);

    res.status(200).json({
      success: true,
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};
