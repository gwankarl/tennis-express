import type { RequestHandler } from 'express';

import { AppError } from '../../../../shared/errors/AppError.js';
import { AddressService } from '../services/address.service.js';
import {
  AddressIdParams,
  CreateAddressRequest,
  UpdateAddressRequest,
} from '../schemas/address.schema.js';

const addressService = new AddressService();

/** Lists saved addresses owned by the authenticated user. */
export const listMyAddresses: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth?.userId) {
      throw new AppError({
        statusCode: 401,
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required to access addresses.',
      });
    }

    const addresses = await addressService.listMine(req.auth.userId);

    res.status(200).json({
      success: true,
      data: { addresses },
    });
  } catch (error) {
    next(error);
  }
};

/** Saves a delivery address for the authenticated user. */
export const createMyAddress: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth?.userId) {
      throw new AppError({
        statusCode: 401,
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required to save an address.',
      });
    }

    const input = req.body as CreateAddressRequest;
    const address = await addressService.createMine(req.auth.userId, input);

    res.status(201).json({
      success: true,
      data: { address },
    });
  } catch (error) {
    next(error);
  }
};

/** Updates a saved address owned by the authenticated user. */
export const updateMyAddress: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth?.userId) {
      throw new AppError({
        statusCode: 401,
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required to update an address.',
      });
    }

    const { addressId } = req.params as unknown as AddressIdParams;
    const input = req.body as UpdateAddressRequest;
    const address = await addressService.updateMine(req.auth.userId, addressId, input);

    res.status(200).json({
      success: true,
      data: { address },
    });
  } catch (error) {
    next(error);
  }
};

/** Deletes a saved address owned by the authenticated user. */
export const deleteMyAddress: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth?.userId) {
      throw new AppError({
        statusCode: 401,
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required to delete an address.',
      });
    }

    const { addressId } = req.params as unknown as AddressIdParams;
    await addressService.deleteMine(req.auth.userId, addressId);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
