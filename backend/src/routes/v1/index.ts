import { Router } from 'express';

import { createAuthRouter } from '../../modules/auth/routes/auth.routes.js';
import { createUserAccountsRouter } from '../../modules/users/routes/user-account.routes.js';

export function createV1Router() {
  const v1Router = Router();

  v1Router.use('/auth', createAuthRouter());

  v1Router.use('/users', createUserAccountsRouter());

  return v1Router;
}
