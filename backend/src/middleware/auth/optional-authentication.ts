import type { RequestHandler } from 'express';

import { AccessTokenService } from '../../modules/auth/services/access-token.service.js';
import { SessionService } from '../../modules/auth/services/session.service.js';

/**
 * Adds valid account details to public requests when a bearer token is supplied.
 * Missing or invalid credentials do not block access to public resources.
 */
export function createOptionalAuthentication(): RequestHandler {
  const accessTokenService = new AccessTokenService();
  const sessionService = new SessionService();

  return async (req, _res, next) => {
    const authorization = req.get('authorization');
    const match = authorization?.match(/^Bearer\s+(\S+)$/i);

    if (!match) {
      next();
      return;
    }

    const claims = accessTokenService.verifyToken(match[1]);

    if (!claims) {
      next();
      return;
    }

    try {
      const session = await sessionService.findValidSession(claims.sessionId);

      if (session && session.userId.toString() === claims.userId) {
        req.auth = {
          userId: claims.userId,
          sessionId: claims.sessionId,
          roles: claims.roles,
        };
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
