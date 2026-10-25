import mongoose from 'mongoose';

import { AppError } from '../../../../shared/errors/AppError.js';
import { UserModel } from '../../../users/profiles/models/user.model.js';
import { StoreProvisioningService } from './store-provisioning.service.js';
import { SellerApplicationModel } from '../../../users/seller-applications/models/seller-application.model.js';

import type { UserRole } from '../../../users/profiles/types/user.types.js';
import {
  buildPaginationMetadata,
  getPaginationOffset,
  type PaginationMetadata,
  type PaginationQuery,
} from '../../../../shared/pagination.js';
import type {
  SellerApplication,
  SellerApplicationStatus,
} from '../../../users/seller-applications/types/seller-application.types.js';

type SellerApplicationDocument = mongoose.HydratedDocument<SellerApplication>;

export interface AdminApplicantSummary {
  id: string;
  email: string;
  userName: string;
  status: string;
}

export interface AdminSellerApplicationListItem {
  application: SellerApplicationDocument;
  applicant: AdminApplicantSummary | null;
}

export interface AdminSellerApplicationDetails {
  application: SellerApplicationDocument;
  applicant: AdminApplicantSummary | null;
}

export interface AdminSellerApplicationList {
  applications: AdminSellerApplicationListItem[];
  pagination: PaginationMetadata;
}

export interface ReviewSellerApplicationInput {
  applicationId: string;
  reviewerId: string;
}

export interface RejectSellerApplicationInput extends ReviewSellerApplicationInput {
  reason: string;
}

export class AdminSellerApplicationService {
  constructor(
    private readonly storeProvisioningService: StoreProvisioningService = new StoreProvisioningService(),
  ) {}

  /**
   * Returns one application and a limited applicant summary for admin review.
   */
  async getApplicationById(applicationId: string): Promise<AdminSellerApplicationDetails> {
    if (!mongoose.isValidObjectId(applicationId)) {
      throw this.invalidApplicationIdError();
    }

    const application = await SellerApplicationModel.findById(applicationId).exec();

    if (!application) {
      throw this.applicationNotFoundError();
    }

    const applicant = await UserModel.findOne({
      _id: application.applicantId,
      deletedAt: null,
    })
      .select('email profile.userName status')
      .lean()
      .exec();

    return {
      application,
      applicant: applicant
        ? {
            id: applicant._id.toString(),
            email: applicant.email,
            userName: applicant.profile.userName,
            status: applicant.status,
          }
        : null,
    };
  }

  /**
   * Returns a paginated status queue with limited applicant information.
   */
  async listApplications(
    status: SellerApplicationStatus,
    query: PaginationQuery,
  ): Promise<AdminSellerApplicationList> {
    const filter = { status };

    const [applications, totalItems] = await Promise.all([
      SellerApplicationModel.find(filter)
        .select(
          'applicantId status applicationData.businessDetails applicationData.contactDetails.region applicationData.contactDetails.city submittedAt reviewedAt',
        )
        .sort({ submittedAt: -1, _id: -1 })
        .skip(getPaginationOffset(query))
        .limit(query.limit)
        .exec(),
      SellerApplicationModel.countDocuments(filter).exec(),
    ]);

    const applicantIds = [
      ...new Set(applications.map((application) => application.applicantId.toString())),
    ];
    const applicants = applicantIds.length
      ? await UserModel.find({
          _id: { $in: applicantIds },
          deletedAt: null,
        })
          .select('email profile.userName status')
          .lean()
          .exec()
      : [];

    const applicantById = new Map(
      applicants.map((applicant) => [
        applicant._id.toString(),
        {
          id: applicant._id.toString(),
          email: applicant.email,
          userName: applicant.profile.userName,
          status: applicant.status,
        },
      ]),
    );

    return {
      applications: applications.map((application) => ({
        application,
        applicant: applicantById.get(application.applicantId.toString()) ?? null,
      })),
      pagination: buildPaginationMetadata(query, totalItems),
    };
  }

  /**
   * Approves a pending application, promotes the applicant's role,
   * and provisions the initial storefront atomically.
   */
  async approveApplication(
    input: ReviewSellerApplicationInput,
  ): Promise<SellerApplicationDocument> {
    this.validateReviewerId(input.reviewerId);

    if (!mongoose.isValidObjectId(input.applicationId)) {
      throw this.applicationNotFoundError();
    }

    const session = await mongoose.startSession();
    let approvedApplication: SellerApplicationDocument | null = null;

    try {
      await session.withTransaction(async () => {
        const application = await SellerApplicationModel.findOne({
          _id: input.applicationId,
          status: 'pending',
        })
          .session(session)
          .exec();

        if (!application) {
          const existingApplication = await SellerApplicationModel.findById(input.applicationId)
            .select('_id status')
            .session(session)
            .lean()
            .exec();

          if (!existingApplication) {
            throw this.applicationNotFoundError();
          }

          throw this.applicationAlreadyReviewedError();
        }

        const applicant = await UserModel.findOne({
          _id: application.applicantId,
          deletedAt: null,
          status: 'active',
        })
          .session(session)
          .exec();

        if (!applicant) {
          throw this.userNotFoundError();
        }

        const roles = new Set<UserRole>(applicant.roles);
        roles.add('seller');

        applicant.roles = [...roles];
        await applicant.save({ session });

        const businessDetails = application.applicationData.businessDetails;
        const contactDetails = application.applicationData.contactDetails;
        const productDetails = application.applicationData.productDetails;

        const storeName =
          businessDetails.storeName ??
          (businessDetails.sellerType === 'individual' ? null : businessDetails.businessName);

        if (!storeName) {
          throw new AppError({
            statusCode: 400,
            code: 'INVALID_SELLER_APPLICATION_STORE_NAME',
            message: 'The application does not contain a valid store name.',
          });
        }

        await this.storeProvisioningService.provisionStore({
          sellerId: applicant._id.toString(),
          name: storeName,
          description: productDetails.businessDescription,
          fulfilmentProfile: application.applicationData.fulfilmentDetails,
          location: {
            region: contactDetails.region,
            city: contactDetails.city,
            address: contactDetails.address,
          },
          session,
        });

        application.status = 'approved';
        application.reviewedBy = new mongoose.Types.ObjectId(input.reviewerId);
        application.reviewedAt = new Date();
        application.decisionReason = null;

        await application.save({ session });

        approvedApplication = application;
      });
    } finally {
      await session.endSession();
    }

    if (!approvedApplication) {
      throw new Error('Seller application approval did not complete.');
    }

    return approvedApplication;
  }

  /**
   * Rejects a pending application and records the reviewer's reason.
   */
  async rejectApplication(input: RejectSellerApplicationInput): Promise<SellerApplicationDocument> {
    this.validateReviewerId(input.reviewerId);

    if (!mongoose.isValidObjectId(input.applicationId)) {
      throw this.applicationNotFoundError();
    }

    const reason = input.reason.trim();

    if (reason.length < 20) {
      throw new AppError({
        statusCode: 400,
        code: 'INVALID_SELLER_APPLICATION_REJECTION_REASON',
        message: 'The rejection reason must contain at least 20 characters.',
      });
    }

    const application = await SellerApplicationModel.findOneAndUpdate(
      {
        _id: input.applicationId,
        status: 'pending',
      },
      {
        $set: {
          status: 'rejected',
          reviewedBy: new mongoose.Types.ObjectId(input.reviewerId),
          reviewedAt: new Date(),
          decisionReason: reason,
        },
      },
      {
        new: true,
        runValidators: true,
      },
    ).exec();

    if (!application) {
      const existingApplication = await SellerApplicationModel.findById(input.applicationId)
        .select('_id status')
        .lean()
        .exec();

      if (!existingApplication) {
        throw this.applicationNotFoundError();
      }

      throw this.applicationAlreadyReviewedError();
    }

    return application;
  }

  private validateReviewerId(reviewerId: string): void {
    if (!mongoose.isValidObjectId(reviewerId)) {
      throw this.userNotFoundError();
    }
  }

  private userNotFoundError(): AppError {
    return new AppError({
      statusCode: 404,
      code: 'USER_NOT_FOUND',
      message: 'The requested user could not be found.',
    });
  }

  private applicationNotFoundError(): AppError {
    return new AppError({
      statusCode: 404,
      code: 'SELLER_APPLICATION_NOT_FOUND',
      message: 'The seller application could not be found.',
    });
  }

  private invalidApplicationIdError(): AppError {
    return new AppError({
      statusCode: 400,
      code: 'INVALID_APPLICATION_ID',
      message: 'A valid seller application ID is required.',
    });
  }

  private applicationAlreadyReviewedError(): AppError {
    return new AppError({
      statusCode: 409,
      code: 'SELLER_APPLICATION_ALREADY_REVIEWED',
      message: 'The seller application has already been reviewed.',
    });
  }
}
