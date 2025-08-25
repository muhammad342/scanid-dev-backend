import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../../config/index.js';
import { logger } from './logger.js';
import { MulterFile } from '../types/common.js';

export interface S3UploadOptions {
  folder?: string;
  filename?: string;
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface S3UploadResult {
  key: string;
  url: string;
  bucket: string;
  originalname: string;
  size: number;
}

export class S3Service {
  private s3Client: S3Client;
  private bucketName: string;
  private bucketPath: string;

  constructor() {
    // Validate S3 configuration
    if (!config.s3.accessKeyId || !config.s3.secretAccessKey || !config.s3.bucketName) {
      throw new Error('S3 configuration is incomplete. Please check AWS credentials and bucket name.');
    }

    this.s3Client = new S3Client({
      region: config.s3.region,
      credentials: {
        accessKeyId: config.s3.accessKeyId,
        secretAccessKey: config.s3.secretAccessKey,
      },
    });

    this.bucketName = config.s3.bucketName;
    this.bucketPath = config.s3.bucketPath;

    logger.info('S3Service initialized', {
      region: config.s3.region,
      bucket: this.bucketName,
      basePath: this.bucketPath,
    });
  }

  /**
   * Upload a file to S3
   */
  async uploadFile(
    file: MulterFile,
    options: S3UploadOptions = {}
  ): Promise<S3UploadResult> {
    try {
      // Validate that file buffer exists
      if (!file.buffer) {
        throw new Error('File buffer is required for S3 upload');
      }

      const {
        folder = '',
        filename = this.generateUniqueFilename(file.originalname),
        contentType = file.mimetype,
        metadata = {},
      } = options;

      // Construct the S3 key (file path)
      const key = this.constructS3Key(folder, filename);

      // Prepare the upload command
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: contentType,
        Metadata: {
          originalName: file.originalname,
          uploadedAt: new Date().toISOString(),
          ...metadata,
        },
      });

      // Upload the file
      await this.s3Client.send(command);

      // Construct the public URL
      const url = `https://${this.bucketName}.s3.${config.s3.region}.amazonaws.com/${key}`;

      const result: S3UploadResult = {
        key,
        url,
        bucket: this.bucketName,
        originalname: file.originalname,
        size: file.size,
      };

      logger.info('File uploaded to S3 successfully', {
        key,
        originalname: file.originalname,
        size: file.size,
        contentType,
      });

      return result;
    } catch (error) {
      logger.error('Failed to upload file to S3', {
        error: error instanceof Error ? error.message : 'Unknown error',
        filename: file.originalname,
        size: file.size,
      });
      throw new Error(`S3 upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a file from S3
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);

      logger.info('File deleted from S3 successfully', { key });
    } catch (error) {
      logger.error('Failed to delete file from S3', {
        error: error instanceof Error ? error.message : 'Unknown error',
        key,
      });
      throw new Error(`S3 delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a pre-signed URL for temporary access to a file
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const signedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn,
      });

      logger.info('Generated signed URL for S3 object', { key, expiresIn });

      return signedUrl;
    } catch (error) {
      logger.error('Failed to generate signed URL for S3 object', {
        error: error instanceof Error ? error.message : 'Unknown error',
        key,
      });
      throw new Error(`Failed to generate signed URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload logo specifically for system editions
   */
  async uploadSystemEditionLogo(
    systemEditionId: string,
    file: MulterFile
  ): Promise<S3UploadResult> {
    // Validate file type
    this.validateImageFile(file);

    const options: S3UploadOptions = {
      folder: `logos/${systemEditionId}`,
      filename: `logo-${Date.now()}.${this.getFileExtension(file.originalname)}`,
      metadata: {
        systemEditionId,
        type: 'logo',
      },
    };

    return this.uploadFile(file, options);
  }

  /**
   * Delete old logo when updating
   */
  async deleteSystemEditionLogo(logoUrl: string): Promise<void> {
    const key = this.extractKeyFromUrl(logoUrl);
    if (key) {
      await this.deleteFile(key);
    }
  }

  /**
   * Private helper methods
   */
  private constructS3Key(folder: string, filename: string): string {
    const parts = [this.bucketPath];
    
    if (folder) {
      parts.push(folder);
    }
    
    parts.push(filename);
    
    return parts.join('/');
  }

  private generateUniqueFilename(originalname: string): string {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const extension = this.getFileExtension(originalname);
    
    return `${timestamp}-${randomStr}.${extension}`;
  }

  private getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || 'bin';
  }

  private extractKeyFromUrl(url: string): string | null {
    try {
      // Extract key from S3 URL
      const urlObj = new URL(url);
      return urlObj.pathname.substring(1); // Remove leading slash
    } catch (error) {
      logger.warn('Failed to extract S3 key from URL', { url });
      return null;
    }
  }

  private validateImageFile(file: MulterFile): void {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new Error(`Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`);
    }

    if (file.size > maxSize) {
      throw new Error(`File size too large. Maximum size: ${maxSize / (1024 * 1024)}MB`);
    }
  }
}

// Export singleton instance
export const s3Service = new S3Service(); 