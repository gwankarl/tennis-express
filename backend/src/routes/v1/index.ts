import { Router } from 'express';

import { createAuthRouter } from '../../modules/auth/routes/auth.routes.js';

export function createV1Router() {
  const v1Router = Router();

  v1Router.use('/auth', createAuthRouter());

  return v1Router;
}
