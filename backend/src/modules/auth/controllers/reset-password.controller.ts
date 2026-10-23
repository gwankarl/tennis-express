import type { RequestHandler } from 'express';

import type { ResetPasswordService } from '../services/reset-password.service.js';

export function createResetPasswordController(service: ResetPasswordService): RequestHandler {
  return async (req, res, next) => {
    const { token, password } = req.body;

    try {
      await service.resetPassword(token, password);

      res.status(200).json({
        success: true,
        data: {
          message: 'Your password has been reset successfully.',
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
