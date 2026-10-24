import { Router } from 'express';

import { createRequireAuthentication } from '../../../middleware/auth/require-authentication.js';
import { validateBody } from '../../../middleware/validateBody.js';

import { createCurrentUserController } from '../controllers/current-user.controller.js';

import { profileUpdateSchema } from '../schemas/profile-update.schema.js';
import { createProfileUpdateController } from '../controllers/profile-update.controller.js';

import { uploadImage } from '../../../middleware/image-uploads/image-upload.middleware.js';
import { validateImageContent } from '../../../middleware/image-uploads/image-content.validation.middleware.js';
import { createProfileImageUploadController } from '../controllers/profile-image-upload.controller.js';

import { createAccountDeletionRequestController } from '../controllers/account-deletion-request.controller.js';

/** Creates routes for authenticated user-account operations. */
export function createUserAccountsRouter(): Router {
  const router = Router();

  router.use(createRequireAuthentication());

  router.get('/me', createCurrentUserController());

  router.patch('/me', validateBody(profileUpdateSchema), createProfileUpdateController());

  router.post('/me/image', uploadImage, validateImageContent, createProfileImageUploadController());

  router.post('/me/deletion-request', createAccountDeletionRequestController().requestDeletion);

  router.delete('/me/deletion-request', createAccountDeletionRequestController().cancelRequest);

  return router;
}
