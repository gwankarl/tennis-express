import { basename } from 'node:path';
import type { RequestHandler } from 'express';

import { AppError } from '../../../../shared/errors/AppError.js';
import type { PaginationQuery } from '../../../../shared/pagination.js';
import { SellerApplicationService } from '../services/seller-application.service.js';
import type { CreateSellerApplicationRequest } from '../schemas/seller-application.schema.js';
import type {
  SellerApplicationDocumentType,
  SellerApplicationDocumentUpload,
} from '../types/seller-application.types.js';

interface SellerApplicationMultipartBody extends CreateSellerApplicationRequest {
  documentTypes: SellerApplicationDocumentType[];
}

/** Creates controllers for applicant-owned seller application operations. */
export function createSellerApplicationController() {
  const sellerApplicationService = new SellerApplicationService();

  const submitApplication: RequestHandler = async (req, res, next) => {
    try {
      if (!req.auth) {
        throw authenticationRequiredError();
      }

      const input = req.body as SellerApplicationMultipartBody;
      const documents = getDocumentUploads(req);

      const application = await sellerApplicationService.submitApplication(
        req.auth.userId,
        { applicationData: input.applicationData },
        documents,
      );

      res.status(201).json({
        success: true,
        data: { application },
      });
    } catch (error) {
      next(error);
    }
  };

  const resubmitApplication: RequestHandler = async (req, res, next) => {
    try {
      if (!req.auth) {
        throw authenticationRequiredError();
      }

      const input = req.body as SellerApplicationMultipartBody;
      const documents = getDocumentUploads(req);

      const application = await sellerApplicationService.resubmitApplication(
        req.auth.userId,
        req.params.applicationId as string,
        { applicationData: input.applicationData },
        documents,
      );

      res.status(201).json({
        success: true,
        data: { application },
      });
    } catch (error) {
      next(error);
    }
  };

  const getLatestApplication: RequestHandler = async (req, res, next) => {
    try {
      if (!req.auth) {
        throw authenticationRequiredError();
      }

      const application = await sellerApplicationService.getMyLatestApplication(req.auth.userId);

      res.status(200).json({
        success: true,
        data: { application },
      });
    } catch (error) {
      next(error);
    }
  };

  const getMyApplications: RequestHandler = async (req, res, next) => {
    try {
      if (!req.auth) {
        throw authenticationRequiredError();
      }

      const pagination = res.locals.validatedQuery as PaginationQuery;
      const result = await sellerApplicationService.getMyApplications(req.auth.userId, pagination);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  return {
    submitApplication,
    resubmitApplication,
    getLatestApplication,
    getMyApplications,
  };
}

/** Maps each uploaded file to the document type at the same array position. */
function getDocumentUploads(req: Parameters<RequestHandler>[0]): SellerApplicationDocumentUpload[] {
  const body = req.body as SellerApplicationMultipartBody;
  const files = (req.files ?? []) as Express.Multer.File[];

  return files.map((file, index) => {
    const fileName = basename(file.originalname.replace(/\\/g, '/'))
      .replace(/[\u0000-\u001f\u007f]/g, '')
      .trim();

    if (!fileName || fileName.length > 255) {
      throw new AppError({
        statusCode: 400,
        code: 'INVALID_SELLER_APPLICATION_FILE_NAME',
        message: 'Each supporting document must have a filename of 1 to 255 characters.',
      });
    }

    return {
      documentType: body.documentTypes[index],
      buffer: file.buffer,
      fileName,
    };
  });
}

function authenticationRequiredError(): AppError {
  return new AppError({
    statusCode: 401,
    code: 'AUTHENTICATION_REQUIRED',
    message: 'Authentication is required to access this resource.',
  });
}
