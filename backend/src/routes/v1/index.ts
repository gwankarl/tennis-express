import { Router } from 'express';

import { createAuthRouter } from '../../modules/auth/routes/auth.routes.js';
import { createUserAccountsRouter } from '../../modules/users/profiles/routes/user-account.routes.js';
import { createSellerApplicationsRouter } from '../../modules/users/seller-applications/routes/seller-applications.routes.js';
import { createAdminSellerApplicationReviewRouter } from '../../modules/admin/seller-application/routes/seller-application-review.routes.js';
import { createCategoryManagementRouter } from '../../modules/admin/categories/routes/category-management.routes.js';
import { createBrandManagementRouter } from '../../modules/admin/brands/routes/brand-management.routes.js';
import { createSellerStoreRouter } from '../../modules/sellers/store/routes/seller-store.routes.js';
import { createPublicStoresRouter } from '../../modules/stores/routes/public-store.routes.js';
import { createAdminStoreRouter } from '../../modules/admin/stores/routes/admin-store.routes.js';
import { createSellerProductsRouter } from '../../modules/sellers/products/management/routes/seller-products.routes.js';
import { createAdminProductModerationRouter } from '../../modules/admin/products/moderation/routes/admin-product-moderation.routes.js';
import { createSellerPromotionsRouter } from '../../modules/sellers/promotions/routes/seller-promotion.routes.js';
import { createAdminPromotionsRouter } from '../../modules/admin/promotions/routes/admin-promotion.routes.js';
import { createPublicProductsRouter } from '../../modules/products/routes/public-product.routes.js';
import { createWishlistRouter } from '../../modules/users/wishlist/routes/wishlist.routes.js';
import { createCartRouter } from '../../modules/users/cart/routes/cart.routes.js';
import { createCheckoutSessionRouter } from '../../modules/users/checkout/routes/checkout-session.routes.js';
import { createAddressRouter } from '../../modules/users/addresses/routes/address.routes.js';
import { createPurchaseRouter } from '../../modules/users/purchases/routes/purchase.routes.js';
import { createOrderRouter } from '../../modules/users/orders/routes/order.routes.js';

export function createV1Router() {
  const v1Router = Router();

  v1Router.use('/auth', createAuthRouter());

  v1Router.use('/stores', createPublicStoresRouter());

  v1Router.use('/products', createPublicProductsRouter());

  v1Router.use('/user', createUserAccountsRouter());

  v1Router.use('/wishlist', createWishlistRouter());

  v1Router.use('/cart', createCartRouter());

  v1Router.use('/checkout-sessions', createCheckoutSessionRouter());

  v1Router.use('/purchases', createPurchaseRouter());

  v1Router.use('/addresses', createAddressRouter());

  v1Router.use('/orders', createOrderRouter());

  v1Router.use('/seller-applications', createSellerApplicationsRouter());

  v1Router.use('/seller/store', createSellerStoreRouter());

  v1Router.use('/seller/products', createSellerProductsRouter());

  v1Router.use('/seller/promotions', createSellerPromotionsRouter());

  v1Router.use('/admin/seller-applications', createAdminSellerApplicationReviewRouter());

  v1Router.use('/admin/categories', createCategoryManagementRouter());

  v1Router.use('/admin/brands', createBrandManagementRouter());

  v1Router.use('/admin/stores', createAdminStoreRouter());

  v1Router.use('/admin/products', createAdminProductModerationRouter());

  v1Router.use('/admin/promotions', createAdminPromotionsRouter());

  return v1Router;
}
