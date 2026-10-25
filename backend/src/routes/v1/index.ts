import { Router } from 'express';

import { createAuthRouter } from '../../modules/auth/routes/auth.routes.js';
import { createUserAccountsRouter } from '../../modules/users/profiles/routes/user-account.routes.js';
import { createSellerApplicationsRouter } from '../../modules/users/seller-applications/routes/seller-applications.routes.js';
import { createAdminSellerApplicationReviewRouter } from '../../modules/admin/seller-application/routes/seller-application-review.routes.js';

export function createV1Router() {
  const v1Router = Router();

  v1Router.use('/auth', createAuthRouter());

  v1Router.use('/user', createUserAccountsRouter());

  v1Router.use('/seller-applications', createSellerApplicationsRouter());

  v1Router.use('/admin/seller-applications', createAdminSellerApplicationReviewRouter());

  return v1Router;
}
