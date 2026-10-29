import type { RequestHandler } from 'express';

import type {
  ListPublicProductsQuery,
  PublicProductFiltersQuery,
  PublicProductNewArrivalsQuery,
  PublicProductRelatedQuery,
} from '../schemas/public-product.schema.js';
import { PublicProductService } from '../services/public-product.service.js';

const publicProductService = new PublicProductService();

/** Lists publicly visible products using validated query filters. */
export const listPublicProducts: RequestHandler = async (req, res, next) => {
  try {
    const query = res.locals.validatedQuery as ListPublicProductsQuery;
    const result = await publicProductService.list(query);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/** Returns filter options supported by publicly visible products. */
export const getPublicProductFilters: RequestHandler = async (req, res, next) => {
  try {
    const query = res.locals.validatedQuery as PublicProductFiltersQuery;
    const result = await publicProductService.getFilters(query);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/** Returns details for one publicly visible product. */
export const getPublicProductById: RequestHandler = async (req, res, next) => {
  try {
    const product = await publicProductService.getById(req.params.productId as string);

    res.status(200).json({
      success: true,
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};

/** Lists the newest publicly visible products. */
export const listPublicNewArrivals: RequestHandler = async (req, res, next) => {
  try {
    const query = res.locals.validatedQuery as PublicProductNewArrivalsQuery;
    const products = await publicProductService.getNewArrivals(query);

    res.status(200).json({
      success: true,
      data: { products },
    });
  } catch (error) {
    next(error);
  }
};

/** Lists publicly visible products related to the requested product. */
export const getRelatedPublicProducts: RequestHandler = async (req, res, next) => {
  try {
    const query = res.locals.validatedQuery as PublicProductRelatedQuery;
    const products = await publicProductService.getRelated(
      req.params.productId as string,
      query,
    );

    res.status(200).json({
      success: true,
      data: { products },
    });
  } catch (error) {
    next(error);
  }
};
