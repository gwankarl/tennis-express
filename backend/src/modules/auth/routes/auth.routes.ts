import { Router } from 'express';

import { validateBody } from '../../../middleware/validateBody.js';

import { createRegistrationController } from '../controllers/registration.controller.js';
import { registrationSchema } from '../schemas/register.schema.js';
import { createRegistrationService } from '../services/registration-service.factory.js';

import { emailVerificationSchema } from '../schemas/email-verification.schema.js';
import { createEmailVerificationController } from '../controllers/email-verification.controller.js';
import { EmailVerificationService } from '../services/email-verification.service.js';

import { createResendVerificationService } from '../services/resend-verification-service.factory.js';
import { createResendVerificationController } from '../controllers/resend-verification.controller.js';
import { resendVerificationSchema } from '../schemas/resend-verification.schema.js';

import { forgotPasswordSchema } from '../schemas/forgot-password.schema.js';
import { createForgotPasswordController } from '../controllers/forgot-password.controller.js';
import { createForgotPasswordService } from '../services/forgot-password-service.factory.js';

import { createResetPasswordService } from '../services/reset-password-service.factory.js';
import { createResetPasswordController } from '../controllers/reset-password.controller.js';
import { resetPasswordSchema } from '../schemas/reset-password.schema.js';

import { createLoginController } from '../controllers/login.controller.js';
import { createLoginService } from '../services/login-service.factory.js';
import { loginSchema } from '../schemas/login.schema.js';

import { createGoogleAuthController } from '../controllers/google-auth.controller.js';
import { googleAuthSchema } from '../schemas/google-auth.schema.js';

import { refreshTokenController } from '../controllers/refresh-token.controller.js';
import { createLogoutController } from '../controllers/logout.controller.js';

/**
 * Creates authentication routes using injected or default services.
 *
 * Request validation runs before each controller so malformed requests
 * are rejected before application services execute.
 *
 * @returns The configured authentication router.
 */
export function createAuthRouter(): Router {
  const router = Router();

  router.post(
    '/register',
    validateBody(registrationSchema),
    createRegistrationController(createRegistrationService()),
  );

  router.post(
    '/verify-email',
    validateBody(emailVerificationSchema),
    createEmailVerificationController(new EmailVerificationService()),
  );

  router.post(
    '/resend-verification',
    validateBody(resendVerificationSchema),
    createResendVerificationController(createResendVerificationService()),
  );

  router.post(
    '/forgot-password',
    validateBody(forgotPasswordSchema),
    createForgotPasswordController(createForgotPasswordService()),
  );

  router.post(
    '/reset-password',
    validateBody(resetPasswordSchema),
    createResetPasswordController(createResetPasswordService()),
  );

  router.post('/login', validateBody(loginSchema), createLoginController(createLoginService()));

  router.post('/google-login', validateBody(googleAuthSchema), createGoogleAuthController());

  router.post('/refresh-token', refreshTokenController);

  router.post('/logout', createLogoutController());

  return router;
}
