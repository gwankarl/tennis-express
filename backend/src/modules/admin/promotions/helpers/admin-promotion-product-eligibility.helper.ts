import type { Types } from 'mongoose';

import { AppError } from '../../../../shared/errors/AppError.js';
import { UserModel } from '../../../users/profiles/models/user.model.js';
import { SellerApplicationModel } from '../../../users/seller-applications/models/seller-application.model.js';
import { ProductModel } from '../../../sellers/products/management/models/product.model.js';
import { ProductVariantModel } from '../../../sellers/products/variants/models/product-variant.model.js';
import { StoreModel } from '../../../sellers/store/models/store.model.js';

function throwIneligibleProductsError(): never {
  throw new AppError({
    statusCode: 400,
    code: 'PROMOTION_PRODUCTS_NOT_ELIGIBLE',
    message: 'All selected products must be published, approved products in active stores.',
  });
}

/** Validates products selected for a marketplace campaign across multiple sellers. */
export async function validateMarketplaceCampaignProducts(
  productIds: Types.ObjectId[],
): Promise<void> {
  const products = await ProductModel.find({
    _id: { $in: productIds },
    moderationStatus: 'approved',
    publicationStatus: 'published',
  })
    .select('_id sellerId storeId')
    .lean()
    .exec();

  if (products.length !== productIds.length) {
    throwIneligibleProductsError();
  }

  const sellerIds = [
    ...new Map(products.map((product) => [product.sellerId.toString(), product.sellerId])).values(),
  ];
  const storeIds = [
    ...new Map(products.map((product) => [product.storeId.toString(), product.storeId])).values(),
  ];

  const [sellers, approvedApplications, stores, variants] = await Promise.all([
    UserModel.find({
      _id: { $in: sellerIds },
      status: 'active',
      deletedAt: null,
      roles: 'seller',
    })
      .select('_id')
      .lean()
      .exec(),
    SellerApplicationModel.find({
      applicantId: { $in: sellerIds },
      status: 'approved',
    })
      .select('applicantId')
      .lean()
      .exec(),
    StoreModel.find({
      _id: { $in: storeIds },
      status: 'active',
    })
      .select('_id sellerId')
      .lean()
      .exec(),
    ProductVariantModel.find({
      productId: { $in: productIds },
      status: 'active',
    })
      .select('productId')
      .lean()
      .exec(),
  ]);

  const activeSellerIds = new Set(sellers.map((seller) => seller._id.toString()));
  const approvedSellerIds = new Set(
    approvedApplications.map((application) => application.applicantId.toString()),
  );
  const activeStoreOwners = new Map(
    stores.map((store) => [store._id.toString(), store.sellerId.toString()]),
  );
  const productsWithActiveVariants = new Set(
    variants.map((variant) => variant.productId.toString()),
  );

  const allProductsHaveEligibleOwnersAndStores = products.every((product) => {
    const sellerId = product.sellerId.toString();
    const storeOwnerId = activeStoreOwners.get(product.storeId.toString());

    return (
      activeSellerIds.has(sellerId) && approvedSellerIds.has(sellerId) && storeOwnerId === sellerId
    );
  });

  if (!allProductsHaveEligibleOwnersAndStores) {
    throwIneligibleProductsError();
  }

  if (productIds.some((productId) => !productsWithActiveVariants.has(productId.toString()))) {
    throw new AppError({
      statusCode: 400,
      code: 'PROMOTION_PRODUCTS_REQUIRE_ACTIVE_VARIANTS',
      message: 'Each selected product must have at least one active variant.',
    });
  }
}
