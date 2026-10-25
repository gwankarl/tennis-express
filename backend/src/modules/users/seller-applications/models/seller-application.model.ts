import mongoose, { Schema } from 'mongoose';

import {
  CAMEROON_REGIONS,
  PRODUCT_SOURCING_METHODS,
  SELLER_APPLICATION_DOCUMENT_TYPES,
  SELLER_APPLICATION_STATUSES,
  SELLER_DISPATCH_TIMES,
  SELLER_FULFILMENT_METHODS,
  SELLER_TYPES,
  SellerApplication,
  SellerApplicationData,
} from '../types/seller-application.types.js';

/* -------------------------------------------------------------------------- */
/* Supporting document schema                                                 */
/* -------------------------------------------------------------------------- */

const sellerApplicationDocumentSchema = new Schema<
  SellerApplicationData['supportingDocuments'][number]
>(
  {
    documentType: {
      type: String,
      enum: SELLER_APPLICATION_DOCUMENT_TYPES,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    secureUrl: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2048,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
  },
  { _id: false },
);

/* -------------------------------------------------------------------------- */
/* Application data schema                                                    */
/* -------------------------------------------------------------------------- */

const sellerApplicationDataSchema = new Schema<SellerApplicationData>(
  {
    businessDetails: {
      sellerType: {
        type: String,
        enum: SELLER_TYPES,
        required: true,
      },
      businessName: {
        type: String,
        default: null,
        trim: true,
        maxlength: 150,
      },
      storeName: {
        type: String,
        default: null,
        trim: true,
        maxlength: 100,
      },
      businessRegistrationNumber: {
        type: String,
        default: null,
        trim: true,
        maxlength: 100,
      },
    },

    contactDetails: {
      region: {
        type: String,
        enum: CAMEROON_REGIONS,
        required: true,
        trim: true,
      },
      city: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 100,
      },
      address: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 300,
      },
      phoneNumber: {
        type: String,
        required: true,
        trim: true,
        minlength: 7,
        maxlength: 25,
        match: /^[+\d][\d\s()-]*$/,
      },
    },

    productDetails: {
      businessDescription: {
        type: String,
        required: true,
        trim: true,
        minlength: 20,
        maxlength: 2000,
      },
      sourcingMethods: {
        type: [
          {
            type: String,
            enum: PRODUCT_SOURCING_METHODS,
          },
        ],
        required: true,
        validate: {
          validator: (value: string[]) => value.length >= 1 && value.length <= 5,
          message: 'Select between one and five product sourcing methods.',
        },
      },
      otherSourcingMethod: {
        type: String,
        default: null,
        trim: true,
        maxlength: 200,
      },
    },

    fulfilmentDetails: {
      methods: {
        type: [
          {
            type: String,
            enum: SELLER_FULFILMENT_METHODS,
          },
        ],
        required: true,
        validate: {
          validator: (value: string[]) => value.length >= 1 && value.length <= 2,
          message: 'Select one or two fulfilment methods.',
        },
      },
      serviceRegions: {
        type: [
          {
            type: String,
            enum: CAMEROON_REGIONS,
          },
        ],
        required: true,
        validate: {
          validator: (value: string[]) => value.length >= 1 && value.length <= 10,
          message: 'Select between one and ten service regions.',
        },
      },
      dispatchTime: {
        type: String,
        enum: SELLER_DISPATCH_TIMES,
        required: true,
      },
    },

    supportingDocuments: {
      type: [sellerApplicationDocumentSchema],
      default: [],
      validate: {
        validator: (documents: SellerApplicationData['supportingDocuments']) =>
          documents.length <= 5,
        message: 'You may submit no more than five supporting documents.',
      },
    },

    declarations: {
      informationIsAccurate: {
        type: Boolean,
        required: true,
        validate: {
          validator: (value: boolean) => value === true,
          message: 'Accuracy declaration must be accepted.',
        },
      },
      sellerPolicyAccepted: {
        type: Boolean,
        required: true,
        validate: {
          validator: (value: boolean) => value === true,
          message: 'Seller policy must be accepted.',
        },
      },
      productsAreGenuineAndLegallySellable: {
        type: Boolean,
        required: true,
        validate: {
          validator: (value: boolean) => value === true,
          message: 'Product declaration must be accepted.',
        },
      },
    },
  },
  { _id: false },
);

/* -------------------------------------------------------------------------- */
/* Seller application schema                                                  */
/* -------------------------------------------------------------------------- */

const sellerApplicationSchema = new Schema<SellerApplication>(
  {
    applicantId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: false,
    },

    status: {
      type: String,
      enum: SELLER_APPLICATION_STATUSES,
      default: 'pending',
      required: true,
    },

    applicationData: {
      type: sellerApplicationDataSchema,
      required: true,
    },

    submittedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },

    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    decisionReason: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'sellerapplications',
  },
);

/* -------------------------------------------------------------------------- */
/* Indexes                                                                    */
/* -------------------------------------------------------------------------- */

/*
 * An applicant can have only one pending application at a time.
 * Approved and rejected applications remain available as history.
 */
sellerApplicationSchema.index(
  { applicantId: 1 },
  {
    unique: true,
    name: 'unique_pending_seller_application_per_applicant',
    partialFilterExpression: { status: 'pending' },
  },
);

/* Supports retrieving an applicant's application history. */
sellerApplicationSchema.index(
  { applicantId: 1, submittedAt: -1 },
  { name: 'seller_application_history' },
);

/* Supports administrative queues filtered by status and submission date. */
sellerApplicationSchema.index(
  { status: 1, submittedAt: 1 },
  { name: 'seller_application_review_queue' },
);

/* -------------------------------------------------------------------------- */
/* Model registration                                                         */
/* -------------------------------------------------------------------------- */

export const SellerApplicationModel =
  mongoose.models.SellerApplication ??
  mongoose.model<SellerApplication>('SellerApplication', sellerApplicationSchema);
