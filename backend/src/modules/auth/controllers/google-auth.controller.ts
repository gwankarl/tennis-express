import type { RequestHandler } from 'express';

import { REFRESH_TOKEN_COOKIE_NAME, refreshCookieOptions } from '../../../config/auth-cookie.js';
import { GoogleAuthService } from '../services/google-auth.service.js';
import { AuthTokenService } from '../services/auth-token.service.js';
import { GoogleTokenVerifierService } from '../services/google-token-verifier.service.js';
/**
 * Creates the HTTP handler for Google authentication.
 *
 * Authenticates a Google identity, issues an application token pair,
 * and returns safe user information using the standard login response.
 */
export function createGoogleAuthController(): RequestHandler {
  return async (req, res, next) => {
    try {
      const googleAuthService = new GoogleAuthService({
        tokenVerifier: new GoogleTokenVerifierService(),
      });

      const result = await googleAuthService.authenticate(req.body.idToken);

      const tokens = await new AuthTokenService().issueTokenPair({
        userId: result.user.id,
        roles: result.user.roles as ('customer' | 'seller' | 'admin')[],
      });

      res.cookie(REFRESH_TOKEN_COOKIE_NAME, tokens.refreshToken, refreshCookieOptions);

      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          tokens: {
            accessToken: tokens.accessToken,
            tokenType: 'Bearer',
            expiresIn: tokens.accessTokenExpiresIn,
          },
        },
      });
    } catch (error) {
      /* Delegate failures to the centralized error handler. */
      next(error);
    }
  };
}
