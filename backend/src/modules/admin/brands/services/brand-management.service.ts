import mongoose from 'mongoose';

import { AppError } from '../../../../shared/errors/AppError.js';
import {
  buildPaginationMetadata,
  getPaginationOffset,
  type PaginationMetadata,
  type PaginationQuery,
} from '../../../../shared/pagination.js';
import { BrandModel } from '../models/brand.model.js';
import type { CreateBrandRequest, UpdateBrandRequest } from '../schemas/brand-management.schema.js';
import type { Brand, BrandStatus, BrandImage } from '../types/brand.types.js';
import { cloudinaryImageService } from '../../../../shared/uploads/cloudinary-image.service.js';

interface ListBrandsInput extends PaginationQuery {
  status?: BrandStatus;
}

export interface CreateBrandInput extends CreateBrandRequest {
  createdBy: mongoose.Types.ObjectId;
}

export interface UpdateBrandInput {
  brandId: string;
  updatedBy: mongoose.Types.ObjectId;
  changes: UpdateBrandRequest;
}

export interface UpdateBrandStatusInput {
  brandId: string;
  updatedBy: mongoose.Types.ObjectId;
  status: BrandStatus;
}

export interface CreateBrandInput extends CreateBrandRequest {
  createdBy: mongoose.Types.ObjectId;
  logo: BrandImage | null;
}

export interface UpdateBrandInput {
  brandId: string;
  updatedBy: mongoose.Types.ObjectId;
  changes: UpdateBrandRequest;
  logo?: BrandImage;
}

function isDuplicateKeyError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}

/** Handles brand listing, lookup, creation, editing, and status changes. */
export class BrandManagementService {
  async list(input: ListBrandsInput): Promise<{
    brands: Brand[];
    pagination: PaginationMetadata;
  }> {
    const filter = input.status ? { status: input.status } : {};

    const [brands, totalItems] = await Promise.all([
      BrandModel.find(filter)
        .sort({ status: 1, name: 1, _id: 1 })
        .skip(getPaginationOffset(input))
        .limit(input.limit)
        .lean()
        .exec(),
      BrandModel.countDocuments(filter).exec(),
    ]);

    return {
      brands: brands as Brand[],
      pagination: buildPaginationMetadata(input, totalItems),
    };
  }

  async getById(brandId: string): Promise<Brand> {
    this.validateBrandId(brandId);

    const brand = await BrandModel.findById(brandId).exec();

    if (!brand) {
      throw this.brandNotFoundError();
    }

    return brand.toObject() as Brand;
  }

  async create(input: CreateBrandInput): Promise<Brand> {
    const slug = await this.generateUniqueSlug(this.createSlug(input.name));

    try {
      const brand = await BrandModel.create({
        name: input.name,
        slug,
        description: input.description ?? null,
        logo: input.logo,
        status: 'active',
        createdBy: input.createdBy,
        updatedBy: input.createdBy,
      });

      return brand.toObject() as Brand;
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw this.slugConflictError();
      }

      throw error;
    }
  }

  async update(input: UpdateBrandInput): Promise<Brand> {
    this.validateBrandId(input.brandId);

    const brand = await BrandModel.findById(input.brandId).exec();

    if (!brand) {
      throw this.brandNotFoundError();
    }

    const previousLogo = brand.logo;

    if (input.changes.name !== undefined) {
      const nameChanged = input.changes.name !== brand.name;

      brand.name = input.changes.name;

      if (nameChanged) {
        brand.slug = await this.generateUniqueSlug(this.createSlug(input.changes.name), brand._id);
      }
    }

    if (input.changes.description !== undefined) {
      brand.description = input.changes.description;
    }

    if (input.logo) {
      brand.logo = input.logo;
    }

    brand.updatedBy = input.updatedBy;

    try {
      await brand.save();
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw this.slugConflictError();
      }

      throw error;
    }

    if (input.logo && previousLogo?.publicId) {
      try {
        await cloudinaryImageService.delete(previousLogo.publicId);
      } catch (cleanupError) {
        console.error('Failed to delete the replaced brand logo.', {
          publicId: previousLogo.publicId,
          cleanupError,
        });
      }
    }

    return brand.toObject() as Brand;
  }

  async updateStatus(input: UpdateBrandStatusInput): Promise<Brand> {
    this.validateBrandId(input.brandId);

    const brand = await BrandModel.findById(input.brandId).exec();

    if (!brand) {
      throw this.brandNotFoundError();
    }

    brand.status = input.status;
    brand.updatedBy = input.updatedBy;
    await brand.save();

    return brand.toObject() as Brand;
  }

  private validateBrandId(brandId: string): void {
    if (!mongoose.isValidObjectId(brandId)) {
      throw new AppError({
        statusCode: 400,
        code: 'INVALID_BRAND_ID',
        message: 'A valid brand ID is required.',
      });
    }
  }

  private createSlug(name: string): string {
    const slug = name
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 120)
      .replace(/-+$/g, '');

    if (!slug) {
      throw new AppError({
        statusCode: 400,
        code: 'BRAND_INVALID_NAME',
        message: 'The brand name cannot be converted into a valid URL slug.',
      });
    }

    return slug;
  }

  private async generateUniqueSlug(baseSlug: string, excludeId?: mongoose.Types.ObjectId) {
    let slug = baseSlug;
    let suffix = 2;

    while (true) {
      const query: Record<string, unknown> = { slug };

      if (excludeId) {
        query._id = { $ne: excludeId };
      }

      if (!(await BrandModel.exists(query))) {
        return slug;
      }

      const suffixText = `-${suffix}`;
      const trimmedBase = baseSlug.slice(0, 120 - suffixText.length).replace(/-+$/g, '');
      slug = `${trimmedBase}${suffixText}`;
      suffix += 1;
    }
  }

  private brandNotFoundError(): AppError {
    return new AppError({
      statusCode: 404,
      code: 'BRAND_NOT_FOUND',
      message: 'The brand does not exist.',
    });
  }

  private slugConflictError(): AppError {
    return new AppError({
      statusCode: 409,
      code: 'BRAND_SLUG_CONFLICT',
      message: 'A brand with this URL slug already exists.',
    });
  }
}
