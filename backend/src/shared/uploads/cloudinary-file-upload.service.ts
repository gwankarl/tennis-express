import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';

import { cloudinary } from '../../config/cloudinary.js';
import { AppError } from '../../shared/errors/AppError.js';

interface UploadCloudinaryFileInput {
  buffer: Buffer;
  fileName: string;
  folder: string;
  allowedFormats: string[];
}

interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
}

export interface CloudinaryFileReference {
  publicId: string;
  secureUrl: string;
  resourceType: 'raw';
}

/**
 * Uploads supporting documents to Cloudinary as raw files.
 * Suitable for documents such as PDFs and other permitted file formats.
 */
export class CloudinaryFileUploadService {
  async uploadFile(input: UploadCloudinaryFileInput): Promise<CloudinaryFileReference> {
    const extension = extname(input.fileName).toLowerCase();

    try {
      const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: input.folder,
            public_id: `${randomUUID()}${extension}`,
            resource_type: 'raw',
            overwrite: false,
            allowed_formats: input.allowedFormats,
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

        uploadStream.end(input.buffer);
      });

      return {
        publicId: result.public_id,
        secureUrl: result.secure_url,
        resourceType: 'raw',
      };
    } catch {
      throw new AppError({
        statusCode: 502,
        code: 'CLOUDINARY_FILE_UPLOAD_FAILED',
        message: 'The document could not be uploaded.',
      });
    }
  }

  /**
   * Deletes a previously uploaded raw file.
   * Treats an already-missing file as successfully deleted.
   */
  async deleteFile(publicId: string): Promise<void> {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: 'raw',
        invalidate: true,
      });

      if (result.result !== 'ok' && result.result !== 'not found') {
        throw new Error('Cloudinary could not delete the file.');
      }
    } catch {
      throw new AppError({
        statusCode: 502,
        code: 'CLOUDINARY_FILE_DELETE_FAILED',
        message: 'The document could not be deleted from storage.',
      });
    }
  }
}

export const cloudinaryFileUploadService = new CloudinaryFileUploadService();
