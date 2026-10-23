import { BadRequestException, Injectable } from '@nestjs/common';
import { FILE_UPLOAD_MAX_SIZE } from '../config/file.config';
import {
  UploadFileOptions,
  UploadImageOptions,
  UploadVideoOptions,
} from '../types/upload.types';

@Injectable()
export class FileValidator {
  private static readonly DANGEROUS_MIME_TYPES = new Set([
    'text/html',
    'application/xhtml+xml',
    'application/javascript',
    'text/javascript',
    'application/x-javascript',
    'image/svg+xml',
    'application/x-sh',
    'application/x-msdownload',
  ]);

  private static readonly DANGEROUS_EXTENSIONS = new Set([
    'html',
    'htm',
    'xhtml',
    'js',
    'mjs',
    'cjs',
    'svg',
    'sh',
    'exe',
    'php',
    'jsp',
  ]);

  static validateSafeMimeAndExtension(
    mime: string,
    originalName: string,
  ): void {
    const normalizedMime = (mime || '').toLowerCase();
    const ext = (originalName?.split('.').pop() || '').toLowerCase();

    if (
      FileValidator.DANGEROUS_MIME_TYPES.has(normalizedMime) ||
      FileValidator.DANGEROUS_EXTENSIONS.has(ext)
    ) {
      throw new BadRequestException(`Invalid file type: ${mime}`);
    }
  }

  validateImage(
    file: Express.Multer.File,
    options: Pick<UploadImageOptions, 'allowedMimeTypes' | 'maxFileSize'>,
  ) {
    const {
      maxFileSize = 5 * 1024 * 1024,
      allowedMimeTypes = ['jpeg', 'png', 'webp'],
    } = options;

    if (file.size > maxFileSize) {
      throw new BadRequestException(
        `File size exceeds limit: ${this.formatBytes(maxFileSize)}`,
      );
    }

    const ext = this.detectExt(file.mimetype);
    if (!ext || !allowedMimeTypes.includes(ext)) {
      throw new BadRequestException(`Invalid file type: ${file.mimetype}`);
    }
  }

  validateFile(file: Express.Multer.File, options: UploadFileOptions) {
    const { maxFileSize = FILE_UPLOAD_MAX_SIZE, allowedMimeTypes = [] } =
      options;

    if (file.size > maxFileSize) {
      throw new BadRequestException(
        `File exceeds limit: ${this.formatBytes(maxFileSize)}`,
      );
    }

    const isExplicitlyAllowed =
      allowedMimeTypes.length > 0 && allowedMimeTypes.includes(file.mimetype);

    if (!isExplicitlyAllowed) {
      FileValidator.validateSafeMimeAndExtension(
        file.mimetype,
        file.originalname,
      );
    }

    if (
      allowedMimeTypes.length > 0 &&
      !allowedMimeTypes.includes(file.mimetype)
    ) {
      throw new BadRequestException(`Invalid file type: ${file.mimetype}`);
    }
  }

  validateVideo(file: Express.Multer.File, options: UploadVideoOptions) {
    const { maxFileSize = 15 * 1024 * 1024, allowedMimeTypes = [] } = options;

    if (file.size > maxFileSize) {
      throw new BadRequestException(
        `File exceeds limit: ${this.formatBytes(maxFileSize)}`,
      );
    }

    if (
      allowedMimeTypes.length > 0 &&
      !allowedMimeTypes.includes(file.mimetype)
    ) {
      throw new BadRequestException(`Invalid file type: ${file.mimetype}`);
    }
  }

  detectExt(mime: string): 'jpeg' | 'png' | 'webp' | null {
    if (mime.includes('png')) return 'png';
    if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpeg';
    if (mime.includes('webp')) return 'webp';
    return null;
  }

  private formatBytes(bytes: number): string {
    const mb = bytes / 1024 / 1024;
    return `${Number.isInteger(mb) ? mb : mb.toFixed(1)}MB`;
  }
}
