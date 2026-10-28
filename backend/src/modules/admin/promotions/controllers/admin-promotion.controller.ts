import type { RequestHandler } from 'express';

import type {
  AdminEligibleProductsQuery,
  AdminPromotionIdParams,
  AdminPromotionListQuery,
  CreateAdminMarketplaceCampaignRequest,
  UpdateAdminMarketplaceCampaignRequest,
} from '../schemas/admin-promotion.schema.js';
import { AppError } from '../../../../shared/errors/AppError.js';
import { AdminPromotionService } from '../services/admin-promotion.service.js';

const adminPromotionService = new AdminPromotionService();

/** Lists promotions for administrators using validated filters and pagination. */
export const listAdminPromotions: RequestHandler = async (_req, res, next) => {
  try {
    const query = res.locals.validatedQuery as AdminPromotionListQuery;
    const result = await adminPromotionService.list(query);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/** Retrieves a promotion for administrator review. */
export const getAdminPromotion: RequestHandler = async (req, res, next) => {
  try {
    const { promotionId } = req.params as unknown as AdminPromotionIdParams;
    const promotion = await adminPromotionService.getById(promotionId);

    res.status(200).json({
      success: true,
      data: { promotion },
    });
  } catch (error) {
    next(error);
  }
};

/** Creates a marketplace campaign as the authenticated administrator. */
export const createAdminMarketplaceCampaign: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth?.userId) {
      throw new AppError({
        statusCode: 401,
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required to create a marketplace campaign.',
      });
    }

    const input = req.body as CreateAdminMarketplaceCampaignRequest;
    const promotion = await adminPromotionService.createMarketplaceCampaign(req.auth.userId, input);

    res.status(201).json({
      success: true,
      data: { promotion },
    });
  } catch (error) {
    next(error);
  }
};

/** Updates a draft or scheduled marketplace campaign. */
export const updateAdminMarketplaceCampaign: RequestHandler = async (req, res, next) => {
  try {
    const { promotionId } = req.params as unknown as AdminPromotionIdParams;
    const changes = req.body as UpdateAdminMarketplaceCampaignRequest;
    const promotion = await adminPromotionService.updateMarketplaceCampaign(promotionId, changes);

    res.status(200).json({
      success: true,
      data: { promotion },
    });
  } catch (error) {
    next(error);
  }
};

/** Cancels a draft, scheduled, or active marketplace campaign. */
export const cancelAdminMarketplaceCampaign: RequestHandler = async (req, res, next) => {
  try {
    const { promotionId } = req.params as unknown as AdminPromotionIdParams;
    const promotion = await adminPromotionService.cancelMarketplaceCampaign(promotionId);

    res.status(200).json({
      success: true,
      data: { promotion },
    });
  } catch (error) {
    next(error);
  }
};

/** Lists eligible products for a marketplace campaign selector. */
export const listAdminEligibleProducts: RequestHandler = async (_req, res, next) => {
  try {
    const query = res.locals.validatedQuery as AdminEligibleProductsQuery;
    const result = await adminPromotionService.listEligibleProducts(query);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
