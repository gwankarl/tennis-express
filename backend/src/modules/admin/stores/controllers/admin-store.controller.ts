import type { RequestHandler } from 'express';

import { AdminStoreService } from '../services/admin-store.service.js';
import type {
  AdminStoreListQuery,
  AdminStoreStatusRequest,
} from '../schemas/admin-store.schema.js';

const adminStoreService = new AdminStoreService();

/** Lists stores for administrators using validated pagination and status filtering. */
export const listAdminStores: RequestHandler = async (req, res, next) => {
  try {
    const query = res.locals.validatedQuery as AdminStoreListQuery;
    const result = await adminStoreService.list(query);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/** Retrieves one store by its validated ID for administrative review. */
export const getAdminStore: RequestHandler = async (req, res, next) => {
  try {
    const store = await adminStoreService.getById(req.params.storeId as string);

    res.status(200).json({
      success: true,
      data: { store },
    });
  } catch (error) {
    next(error);
  }
};

/** Changes a store's status for administrative oversight. */
export const updateAdminStoreStatus: RequestHandler = async (req, res, next) => {
  try {
    const { status } = req.body as AdminStoreStatusRequest;
    const store = await adminStoreService.updateStatus(req.params.storeId as string, status);

    res.status(200).json({
      success: true,
      data: { store },
    });
  } catch (error) {
    next(error);
  }
};
