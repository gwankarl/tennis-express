import { randomUUID } from 'node:crypto';

import { cloudinary } from '../../config/cloudinary.js';
import { AppError } from '../errors/AppError.js';

export interface CloudinaryImageReference {
  publicId: string;
  secureUrl: string;
}

interface UploadImageInput {
  buffer: Buffer;
  folder: string;
}

interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
}

/** Uploads and deletes image assets stored by backend features. */
export class CloudinaryImageService {
  async upload(input: UploadImageInput): Promise<CloudinaryImageReference> {
    try {
      const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: input.folder,
            public_id: randomUUID(),
            resource_type: 'image',
            overwrite: false,
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
          },
          (error, uploadResult) => {
            if (error) {
              reject(error);
              return;
            }

            if (!uploadResult) {
              reject(new Error('Cloudinary returned no upload result.'));
              return;
            }

            resolve(uploadResult);
          },
        );

        stream.end(input.buffer);
      });

      return {
        publicId: result.public_id,
        secureUrl: result.secure_url,
      };
    } catch {
      throw new AppError({
        statusCode: 502,
        code: 'CLOUDINARY_IMAGE_UPLOAD_FAILED',
        message: 'The image could not be uploaded.',
      });
    }
  }

  async delete(publicId: string): Promise<void> {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: 'image',
        invalidate: true,
      });

      if (result.result !== 'ok' && result.result !== 'not found') {
        throw new Error('Cloudinary could not delete the image.');
      }
    } catch {
      throw new AppError({
        statusCode: 502,
        code: 'CLOUDINARY_IMAGE_DELETE_FAILED',
        message: 'The image could not be deleted from storage.',
      });
    }
  }
}

export const cloudinaryImageService = new CloudinaryImageService();
