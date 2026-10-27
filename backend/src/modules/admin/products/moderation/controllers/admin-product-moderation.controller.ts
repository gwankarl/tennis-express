import type { RequestHandler } from 'express';

import type {
  AdminProductListQuery,
  AdminProductIdParams,
  RejectAdminProductRequest,
  RequestAdminProductChangesRequest,
} from '../schemas/admin-product-moderation.schema.js';

import { AppError } from '../../../../../shared/errors/AppError.js';

import { AdminProductListService } from '../services/admin-product-list.service.js';
import { AdminProductDetailService } from '../services/admin-product-detail.service.js';
import { AdminProductApprovalService } from '../services/admin-product-approval.service.js';
import { AdminProductRejectionService } from '../services/admin-product-rejection.service.js';
import { AdminProductChangesRequestService } from '../services/admin-product-changes-request.service.js';

const adminProductListService = new AdminProductListService();
const adminProductDetailService = new AdminProductDetailService();
const adminProductApprovalService = new AdminProductApprovalService();
const adminProductRejectionService = new AdminProductRejectionService();
const adminProductChangesRequestService = new AdminProductChangesRequestService();

/** Lists submitted products for administrators using validated filters and pagination. */
export const listAdminProducts: RequestHandler = async (_req, res, next) => {
  try {
    const query = res.locals.validatedQuery as AdminProductListQuery;
    const result = await adminProductListService.list(query);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/** Retrieves a product and its review context for administrators. */
export const getAdminProduct: RequestHandler = async (req, res, next) => {
  try {
    const { productId } = req.params as unknown as AdminProductIdParams;
    const result = await adminProductDetailService.getById(productId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

function getReviewerId(req: Parameters<RequestHandler>[0]): string {
  if (!req.auth?.userId) {
    throw new AppError({
      statusCode: 401,
      code: 'AUTHENTICATION_REQUIRED',
      message: 'Authentication is required to review a product.',
    });
  }

  return req.auth.userId;
}

/** Approves a pending product as the authenticated administrator. */
export const approveAdminProduct: RequestHandler = async (req, res, next) => {
  try {
    const { productId } = req.params as unknown as AdminProductIdParams;
    const product = await adminProductApprovalService.approve(productId, getReviewerId(req));

    res.status(200).json({
      success: true,
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};

/** Rejects a pending product with the administrator's validated reason. */
export const rejectAdminProduct: RequestHandler = async (req, res, next) => {
  try {
    const { productId } = req.params as unknown as AdminProductIdParams;
    const { reason } = req.body as RejectAdminProductRequest;
    const product = await adminProductRejectionService.reject(
      productId,
      getReviewerId(req),
      reason,
    );

    res.status(200).json({
      success: true,
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};

/** Requests corrections to a pending product with the administrator's reason. */
export const requestAdminProductChanges: RequestHandler = async (req, res, next) => {
  try {
    const { productId } = req.params as unknown as AdminProductIdParams;
    const { reason } = req.body as RequestAdminProductChangesRequest;
    const product = await adminProductChangesRequestService.requestChanges(
      productId,
      getReviewerId(req),
      reason,
    );

    res.status(200).json({
      success: true,
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};
