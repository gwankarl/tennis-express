import type { RequestHandler } from 'express';
import multer from 'multer';
import { fileTypeFromBuffer } from 'file-type';
import { extname } from 'node:path';
import { z } from 'zod';

import { AppError } from '../../../../shared/errors/AppError.js';
import { createSellerApplicationSchema } from '../schemas/seller-application.schema.js';
import { SELLER_APPLICATION_DOCUMENT_TYPES } from '../types/seller-application.types.js';

const MAX_DOCUMENT_COUNT = 5;
const MAX_DOCUMENT_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_TEXT_FIELD_SIZE_BYTES = 32 * 1024;

const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'] as const;

const extensionMimeTypes: Record<string, (typeof allowedMimeTypes)[number]> = {
  '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
};

const documentTypesSchema = z.array(z.enum(SELLER_APPLICATION_DOCUMENT_TYPES)).max(5);

const multipartUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_DOCUMENT_SIZE_BYTES,
    files: MAX_DOCUMENT_COUNT,
    fields: 2,
    fieldSize: MAX_TEXT_FIELD_SIZE_BYTES,
    parts: MAX_DOCUMENT_COUNT + 2,
  },
  fileFilter: (_request, file, callback) => {
    if (!allowedMimeTypes.includes(file.mimetype as (typeof allowedMimeTypes)[number])) {
      callback(
        new AppError({
          statusCode: 400,
          code: 'INVALID_SELLER_APPLICATION_DOCUMENT',
          message: 'Supporting documents must be PDF, JPEG, or PNG files.',
        }),
      );
      return;
    }

    callback(null, true);
  },
});

/**
 * Parses and validates multipart seller application fields and file contents.
 *
 * The `documentTypes` JSON array is positionally paired with the repeated
 * `documents` file fields. Cloudinary metadata is deliberately not accepted
 * from the request.
 */
export const parseSellerApplicationMultipart: RequestHandler = (request, _response, next) => {
  multipartUpload.array('documents', MAX_DOCUMENT_COUNT)(request, _response, (uploadError) => {
    if (uploadError) {
      if (uploadError instanceof multer.MulterError) {
        if (uploadError.code === 'LIMIT_FILE_SIZE') {
          next(
            new AppError({
              statusCode: 413,
              code: 'SELLER_APPLICATION_DOCUMENT_TOO_LARGE',
              message: 'Each supporting document must not exceed 5 MB.',
            }),
          );
          return;
        }

        if (
          uploadError.code === 'LIMIT_FILE_COUNT' ||
          uploadError.code === 'LIMIT_UNEXPECTED_FILE'
        ) {
          next(
            new AppError({
              statusCode: 400,
              code: 'INVALID_SELLER_APPLICATION_DOCUMENT_COUNT',
              message: 'Submit no more than five files using the "documents" field.',
            }),
          );
          return;
        }
      }

      next(uploadError);
      return;
    }

    void validateMultipartRequest(request)
      .then(() => next())
      .catch(next);
  });
};

async function validateMultipartRequest(request: Parameters<RequestHandler>[0]): Promise<void> {
  const files = (request.files ?? []) as Express.Multer.File[];
  const applicationDataField = getSingleTextField(request.body?.applicationData);
  const documentTypesField = getSingleTextField(request.body?.documentTypes);

  let applicationData: unknown;
  let documentTypesValue: unknown;

  try {
    applicationData = JSON.parse(applicationDataField);
    documentTypesValue = JSON.parse(documentTypesField);
  } catch {
    throw new AppError({
      statusCode: 400,
      code: 'INVALID_SELLER_APPLICATION_MULTIPART_DATA',
      message: 'Application data and document types must be valid JSON.',
    });
  }

  const applicationResult = await createSellerApplicationSchema.safeParseAsync({
    applicationData,
  });

  if (!applicationResult.success) {
    throw applicationResult.error;
  }

  const documentTypesResult = documentTypesSchema.safeParse(documentTypesValue);

  if (!documentTypesResult.success) {
    throw documentTypesResult.error;
  }

  if (documentTypesResult.data.length !== files.length) {
    throw new AppError({
      statusCode: 400,
      code: 'SELLER_APPLICATION_DOCUMENT_TYPE_COUNT_MISMATCH',
      message: 'Provide exactly one document type for each uploaded file.',
    });
  }

  for (const file of files) {
    const detectedType = await fileTypeFromBuffer(file.buffer);
    const extension = extname(file.originalname).toLowerCase();
    const expectedMimeType = extensionMimeTypes[extension];

    if (
      !detectedType ||
      !expectedMimeType ||
      detectedType.mime !== expectedMimeType ||
      file.mimetype !== detectedType.mime
    ) {
      throw new AppError({
        statusCode: 400,
        code: 'INVALID_SELLER_APPLICATION_DOCUMENT_CONTENT',
        message: 'Each document must be a valid PDF, JPEG, or PNG file.',
      });
    }
  }

  request.body = {
    ...applicationResult.data,
    documentTypes: documentTypesResult.data,
  };
}

function getSingleTextField(value: unknown): string {
  if (typeof value !== 'string') {
    throw new AppError({
      statusCode: 400,
      code: 'INVALID_SELLER_APPLICATION_MULTIPART_DATA',
      message: 'Each required multipart text field must be provided once.',
    });
  }

  return value;
}
