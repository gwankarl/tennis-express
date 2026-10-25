import type { RequestHandler } from 'express';

import { AppError } from '../../../../shared/errors/AppError.js';
import type { PaginationQuery } from '../../../../shared/pagination.js';
import { AdminSellerApplicationService } from '../services/admin-seller-application.service.js';
import type { SellerApplicationStatus } from '../../../users/seller-applications/types/seller-application.types.js';

const adminSellerApplicationService = new AdminSellerApplicationService();

function getReviewerId(req: Parameters<RequestHandler>[0]): string {
  if (!req.auth?.userId) {
    throw new AppError({
      statusCode: 401,
      code: 'AUTHENTICATION_REQUIRED',
      message: 'Authentication is required to access this resource.',
    });
  }

  return req.auth.userId;
}

/** Lists applications for one validated status and page. */
export const listApplications: RequestHandler = async (req, res, next) => {
  try {
    const query = res.locals.validatedQuery as PaginationQuery & {
      status: SellerApplicationStatus;
    };

    const result = await adminSellerApplicationService.listApplications(query.status, {
      page: query.page,
      limit: query.limit,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/** Retrieves an application and its limited applicant summary. */
export const getApplicationById: RequestHandler = async (req, res, next) => {
  try {
    const result = await adminSellerApplicationService.getApplicationById(
      req.params.applicationId as string,
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/** Approves a pending application and provisions its initial store. */
export const approveApplication: RequestHandler = async (req, res, next) => {
  try {
    const application = await adminSellerApplicationService.approveApplication({
      applicationId: req.params.applicationId as string,
      reviewerId: getReviewerId(req),
    });

    res.status(200).json({
      success: true,
      data: { application },
    });
  } catch (error) {
    next(error);
  }
};

/** Rejects a pending application with the validated review reason. */
export const rejectApplication: RequestHandler = async (req, res, next) => {
  try {
    const body = req.body as { reason: string };

    const application = await adminSellerApplicationService.rejectApplication({
      applicationId: req.params.applicationId as string,
      reviewerId: getReviewerId(req),
      reason: body.reason,
    });

    res.status(200).json({
      success: true,
      data: { application },
    });
  } catch (error) {
    next(error);
  }
};
