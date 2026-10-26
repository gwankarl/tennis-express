import type { RequestHandler } from 'express';

import { AppError } from '../../../../shared/errors/AppError.js';

/**
 * Parses the JSON `category` field sent beside the optional multipart image.
 */
export const parseCategoryMultipartData: RequestHandler = (req, _res, next) => {
  const categoryJson = req.body?.category;

  if (typeof categoryJson !== 'string') {
    next(
      new AppError({
        statusCode: 400,
        code: 'CATEGORY_DATA_REQUIRED',
        message: 'Send category fields as a JSON multipart field named "category".',
      }),
    );
    return;
  }

  try {
    const parsedCategory: unknown = JSON.parse(categoryJson);

    if (
      typeof parsedCategory !== 'object' ||
      parsedCategory === null ||
      Array.isArray(parsedCategory)
    ) {
      throw new Error('Category data must be a JSON object.');
    }

    req.body = parsedCategory;
    next();
  } catch {
    next(
      new AppError({
        statusCode: 400,
        code: 'INVALID_CATEGORY_DATA',
        message: 'The category multipart field must contain a valid JSON object.',
      }),
    );
  }
};
