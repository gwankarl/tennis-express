import { AppError } from '../../../../../shared/errors/AppError.js';
import type { ProductModerationStatus, ProductPublicationStatus } from '../types/product.types.js';

interface ProductEditState {
  moderationStatus: ProductModerationStatus;
  publicationStatus: ProductPublicationStatus;
}

const editableModerationStatuses = new Set<ProductModerationStatus>([
  'not_submitted',
  'changes_requested',
]);

/** Rejects product-content mutations unless this is an editable draft. */
export function assertProductEditable(product: ProductEditState): void {
  if (
    product.publicationStatus !== 'draft' ||
    !editableModerationStatuses.has(product.moderationStatus)
  ) {
    throw new AppError({
      statusCode: 409,
      code: 'PRODUCT_NOT_EDITABLE',
      message:
        'Product content can only be changed while the product is an unsubmitted or changes-requested draft.',
    });
  }
}
