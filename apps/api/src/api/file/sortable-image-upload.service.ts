import { AllConfigType } from '../../config/config.type';
import { FilesystemService } from '../../filesystem/filesystem.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { posix as posixPath } from 'path';

export type SortableImageStoredItem = {
  id: string;
  src: string;
  alt: string;
  filePublicId?: string;
  path?: string;
};

export type SortableImageInputItem = {
  type?: 'existing' | 'new';
  id?: string;
  tempId?: string;
  src?: string;
  alt?: string;
};

export type BuildSortableImagesOptions = {
  currentImages: SortableImageStoredItem[];
  rawItems: unknown;
  files?: Express.Multer.File[];
  uploadFolder?: string;
  maxImageSize?: number;
};

@Injectable()
export class SortableImageUploadService {
  private readonly defaultUploadFolder = 'sortable-images';
  private readonly defaultMaxImageSize = 10 * 1024 * 1024;
  private static readonly OWNER_KEY_REGEX = /^[a-zA-Z0-9:_-]{1,100}$/;
  private static readonly ALLOWED_MIME_TO_EXT: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/avif': 'avif',
  };

  constructor(
    private readonly storage: FilesystemService,
    private readonly configService: ConfigService<AllConfigType>,
  ) {}

  validateOwnerKey(ownerKey: string): string {
    if (
      !ownerKey ||
      !SortableImageUploadService.OWNER_KEY_REGEX.test(ownerKey)
    ) {
      throw new BadRequestException(
        'Invalid ownerKey: must match /^[a-zA-Z0-9:_-]{1,100}$/',
      );
    }
    return ownerKey;
  }

  async buildNextImages({
    currentImages,
    rawItems,
    files = [],
    uploadFolder = this.defaultUploadFolder,
    maxImageSize = this.defaultMaxImageSize,
  }: BuildSortableImagesOptions): Promise<SortableImageStoredItem[]> {
    const currentImageById = new Map(
      currentImages.map((image) => [image.id, image]),
    );
    const items = this.parseItems(rawItems, files);
    const nextImages: SortableImageStoredItem[] = [];
    let nextFileIndex = 0;

    for (const item of items) {
      if (item.type === 'existing') {
        if (!item.id) {
          throw new BadRequestException('Existing image item must include id');
        }

        const cachedImage = currentImageById.get(item.id);
        if (!cachedImage && !item.src) {
          throw new BadRequestException(`Image "${item.id}" was not found`);
        }

        nextImages.push(
          await this.createImageFromExistingItem(
            { ...item, id: item.id },
            cachedImage,
            {
              uploadFolder,
              maxImageSize,
            },
          ),
        );
        continue;
      }

      const file = files[nextFileIndex];
      nextFileIndex += 1;

      if (!file) {
        throw new BadRequestException('Missing file for new image item');
      }

      nextImages.push(
        await this.createImageFromFile(file, {
          alt: item.alt,
          uploadFolder,
          maxImageSize,
        }),
      );
    }

    if (nextFileIndex < files.length) {
      const remainingFiles = files.slice(nextFileIndex);
      nextImages.push(
        ...(await Promise.all(
          remainingFiles.map((file) =>
            this.createImageFromFile(file, { uploadFolder, maxImageSize }),
          ),
        )),
      );
    }

    return nextImages;
  }

  parseItems(rawItems: unknown, files: Express.Multer.File[]) {
    if (rawItems === undefined || rawItems === null || rawItems === '') {
      return files.map<SortableImageInputItem>(() => ({ type: 'new' }));
    }

    let parsed: unknown;
    try {
      parsed = typeof rawItems === 'string' ? JSON.parse(rawItems) : rawItems;
    } catch {
      throw new BadRequestException('items must be valid JSON');
    }

    if (!Array.isArray(parsed)) {
      throw new BadRequestException('items must be a JSON array');
    }

    return parsed.map((item) => {
      if (!item || typeof item !== 'object') {
        throw new BadRequestException('Each item must be an object');
      }

      const value = item as SortableImageInputItem;
      return {
        type: value.type ?? (value.id ? 'existing' : 'new'),
        id: value.id,
        tempId: value.tempId,
        src: value.src,
        alt: value.alt,
      };
    });
  }

  async createImageFromFile(
    file: Express.Multer.File,
    {
      alt = file.originalname,
      uploadFolder = this.defaultUploadFolder,
      maxImageSize = this.defaultMaxImageSize,
    }: {
      alt?: string;
      uploadFolder?: string;
      maxImageSize?: number;
    } = {},
  ): Promise<SortableImageStoredItem> {
    const ext = SortableImageUploadService.ALLOWED_MIME_TO_EXT[file.mimetype];
    if (!ext) {
      throw new BadRequestException(
        `${file.originalname} must be a valid raster image (JPEG, PNG, WebP, GIF, AVIF)`,
      );
    }

    if (file.size > maxImageSize) {
      throw new BadRequestException(`${file.originalname} is too large`);
    }

    if (!this.verifyMagicBytes(file.buffer, file.mimetype)) {
      throw new BadRequestException(
        `${file.originalname} content does not match declared image MIME type`,
      );
    }

    const publicId = randomUUID().replace(/-/g, '').slice(0, 20);
    const path = posixPath.join('image', uploadFolder, `${publicId}.${ext}`);

    await this.storage.disk().put(path, file.buffer, {
      mimeType: file.mimetype,
      visibility: 'public',
    });

    return {
      id: publicId,
      src: this.getPublicStorageUrl(path),
      alt,
      filePublicId: publicId,
      path,
    };
  }

  private async createImageFromExistingItem(
    item: SortableImageInputItem & { id: string },
    storedImage: SortableImageStoredItem | undefined,
    options: { uploadFolder: string; maxImageSize: number },
  ): Promise<SortableImageStoredItem> {
    const src = storedImage?.src ?? item.src!;
    const alt = item.alt ?? storedImage?.alt ?? 'Image';

    if (src.startsWith('data:image/')) {
      return this.createImageFromFile(
        this.createMulterFileFromDataUrl(src, alt),
        options,
      );
    }

    if (!this.isSafeImageUrl(src)) {
      throw new BadRequestException(
        'Invalid image src URL: must be a safe http://, https://, or relative / URL',
      );
    }

    return {
      id: item.id,
      src,
      alt,
      filePublicId: storedImage?.filePublicId,
      path: storedImage?.path,
    };
  }

  private isSafeImageUrl(src: string): boolean {
    if (!src || typeof src !== 'string') {
      return false;
    }
    const trimmed = src.trim();
    if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
      return true;
    }
    try {
      const parsed = new URL(trimmed);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  private verifyMagicBytes(buffer: Buffer, mime: string): boolean {
    if (!buffer || buffer.length < 4) {
      return false;
    }

    switch (mime) {
      case 'image/jpeg':
        return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
      case 'image/png':
        return (
          buffer.length >= 8 &&
          buffer[0] === 0x89 &&
          buffer[1] === 0x50 &&
          buffer[2] === 0x4e &&
          buffer[3] === 0x47 &&
          buffer[4] === 0x0d &&
          buffer[5] === 0x0a &&
          buffer[6] === 0x1a &&
          buffer[7] === 0x0a
        );
      case 'image/gif':
        return (
          buffer.length >= 6 &&
          buffer[0] === 0x47 &&
          buffer[1] === 0x49 &&
          buffer[2] === 0x46 &&
          buffer[3] === 0x38 &&
          (buffer[4] === 0x37 || buffer[4] === 0x39) &&
          buffer[5] === 0x61
        );
      case 'image/webp':
        return (
          buffer.length >= 12 &&
          buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
          buffer.subarray(8, 12).toString('ascii') === 'WEBP'
        );
      case 'image/avif':
        return (
          buffer.length >= 12 &&
          buffer.subarray(4, 8).toString('ascii') === 'ftyp' &&
          ['avif', 'avis', 'mif1', 'msf1'].includes(
            buffer.subarray(8, 12).toString('ascii'),
          )
        );
      default:
        return false;
    }
  }

  private createMulterFileFromDataUrl(
    src: string,
    filename: string,
  ): Express.Multer.File {
    const match = src.match(/^data:(image\/[^;]+);base64,(.+)$/);
    if (!match) {
      throw new BadRequestException('Invalid image data URL');
    }

    const [, mimetype, data] = match;
    const buffer = Buffer.from(data, 'base64');

    return {
      fieldname: 'files',
      originalname: filename,
      encoding: '7bit',
      mimetype,
      size: buffer.length,
      buffer,
    } as Express.Multer.File;
  }

  private getPublicStorageUrl(path: string) {
    return this.storage.disk().url(path);
  }
}
