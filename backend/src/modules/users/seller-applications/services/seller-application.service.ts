import mongoose from 'mongoose';

import { AppError } from '../../../../shared/errors/AppError.js';
import { logger } from '../../../../shared/logger.js';
import { cloudinaryFileUploadService } from '../../../../shared/uploads/cloudinary-file-upload.service.js';
import {
  buildPaginationMetadata,
  getPaginationOffset,
  type PaginationMetadata,
  type PaginationQuery,
} from '../../../../shared/pagination.js';
import { SellerApplicationModel } from '../models/seller-application.model.js';
import type { CreateSellerApplicationRequest } from '../schemas/seller-application.schema.js';
import type {
  SellerApplication,
  SellerApplicationDocument,
  SellerApplicationDocumentUpload,
} from '../types/seller-application.types.js';

type SellerApplicationRecord = mongoose.HydratedDocument<SellerApplication>;

interface SellerApplicationHistory {
  applications: SellerApplicationRecord[];
  pagination: PaginationMetadata;
}

/** Handles applicant-owned seller application submission and retrieval. */
export class SellerApplicationService {
  /**
   * Creates a pending seller application and uploads its optional documents.
   * The applicant ID must come from the authenticated request.
   */
  async submitApplication(
    applicantId: string,
    input: CreateSellerApplicationRequest,
    documents: SellerApplicationDocumentUpload[] = [],
  ): Promise<SellerApplicationRecord> {
    await this.ensureNoPendingApplication(applicantId);

    const uploadedPublicIds: string[] = [];

    try {
      const supportingDocuments = await this.uploadDocuments(documents, uploadedPublicIds);

      return await SellerApplicationModel.create({
        applicantId: new mongoose.Types.ObjectId(applicantId),
        applicationData: {
          ...input.applicationData,
          supportingDocuments,
        },
        status: 'pending',
        submittedAt: new Date(),
      });
    } catch (error) {
      await this.cleanupUploadedDocuments(uploadedPublicIds);

      if (this.isDuplicateKeyError(error)) {
        throw this.applicationAlreadyPendingError();
      }

      throw error;
    }
  }

  /**
   * Creates a new pending record from the applicant's latest rejected record.
   * Existing document references are carried forward when no new files are sent.
   */
  async resubmitApplication(
    applicantId: string,
    applicationId: string,
    input: CreateSellerApplicationRequest,
    documents: SellerApplicationDocumentUpload[] = [],
  ): Promise<SellerApplicationRecord> {
    if (!mongoose.isValidObjectId(applicationId)) {
      throw new AppError({
        statusCode: 400,
        code: 'INVALID_SELLER_APPLICATION_ID',
        message: 'The seller application ID is invalid.',
      });
    }

    const rejectedApplication = await SellerApplicationModel.findOne({
      _id: applicationId,
      applicantId,
    }).exec();

    if (!rejectedApplication) {
      throw this.applicationNotFoundError();
    }

    const latestApplication = await SellerApplicationModel.findOne({ applicantId })
      .sort({ submittedAt: -1, _id: -1 })
      .select('_id status')
      .lean()
      .exec();

    if (
      latestApplication?._id.toString() !== rejectedApplication._id.toString() ||
      rejectedApplication.status !== 'rejected'
    ) {
      throw new AppError({
        statusCode: 409,
        code: 'SELLER_APPLICATION_NOT_RESUBMITTABLE',
        message: 'Only the applicant’s latest rejected application can be resubmitted.',
      });
    }

    await this.ensureNoPendingApplication(applicantId);

    const uploadedPublicIds: string[] = [];

    try {
      const supportingDocuments =
        documents.length > 0
          ? await this.uploadDocuments(documents, uploadedPublicIds)
          : rejectedApplication.applicationData.supportingDocuments;

      return await SellerApplicationModel.create({
        applicantId: new mongoose.Types.ObjectId(applicantId),
        applicationData: {
          ...input.applicationData,
          supportingDocuments,
        },
        status: 'pending',
        submittedAt: new Date(),
      });
    } catch (error) {
      await this.cleanupUploadedDocuments(uploadedPublicIds);

      if (this.isDuplicateKeyError(error)) {
        throw this.applicationAlreadyPendingError();
      }

      throw error;
    }
  }

  /** Returns the applicant's latest application, or null if none exists. */
  async getMyLatestApplication(applicantId: string): Promise<SellerApplicationRecord | null> {
    return SellerApplicationModel.findOne({ applicantId })
      .sort({ submittedAt: -1, _id: -1 })
      .exec();
  }

  /** Returns the applicant's application history in newest-first order. */
  async getMyApplications(
    applicantId: string,
    query: PaginationQuery,
  ): Promise<SellerApplicationHistory> {
    const [applications, totalItems] = await Promise.all([
      SellerApplicationModel.find({ applicantId })
        .sort({ submittedAt: -1, _id: -1 })
        .skip(getPaginationOffset(query))
        .limit(query.limit)
        .exec(),
      SellerApplicationModel.countDocuments({ applicantId }).exec(),
    ]);

    return {
      applications,
      pagination: buildPaginationMetadata(query, totalItems),
    };
  }

  private async ensureNoPendingApplication(applicantId: string): Promise<void> {
    const existingApplication = await SellerApplicationModel.findOne({
      applicantId,
      status: 'pending',
    })
      .select('_id')
      .lean()
      .exec();

    if (existingApplication) {
      throw this.applicationAlreadyPendingError();
    }
  }

  private async uploadDocuments(
    documents: SellerApplicationDocumentUpload[],
    uploadedPublicIds: string[],
  ): Promise<SellerApplicationDocument[]> {
    const supportingDocuments: SellerApplicationDocument[] = [];

    for (const document of documents) {
      const uploadedFile = await cloudinaryFileUploadService.uploadFile({
        buffer: document.buffer,
        fileName: document.fileName,
        folder: 'tennis-xpress/seller-applications',
        allowedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
      });

      uploadedPublicIds.push(uploadedFile.publicId);

      supportingDocuments.push({
        documentType: document.documentType,
        publicId: uploadedFile.publicId,
        secureUrl: uploadedFile.secureUrl,
        fileName: document.fileName,
      });
    }

    return supportingDocuments;
  }

  /**
   * Removes only files uploaded by the current failed operation.
   * Carried-forward files remain referenced by their original application.
   */
  private async cleanupUploadedDocuments(publicIds: string[]): Promise<void> {
    const cleanupResults = await Promise.allSettled(
      publicIds.map((publicId) => cloudinaryFileUploadService.deleteFile(publicId)),
    );

    cleanupResults.forEach((result, index) => {
      if (result.status === 'rejected') {
        logger.warn(
          { publicId: publicIds[index], error: result.reason },
          'Failed to clean up a seller application document.',
        );
      }
    });
  }

  private isDuplicateKeyError(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
  }

  private applicationAlreadyPendingError(): AppError {
    return new AppError({
      statusCode: 409,
      code: 'SELLER_APPLICATION_ALREADY_PENDING',
      message: 'The applicant already has a pending seller application.',
    });
  }

  private applicationNotFoundError(): AppError {
    return new AppError({
      statusCode: 404,
      code: 'SELLER_APPLICATION_NOT_FOUND',
      message: 'The seller application was not found.',
    });
  }
}
