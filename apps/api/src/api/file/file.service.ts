import { AutoIncrementID } from '../../common/types/common.type';
import { StorageDisk } from '../../filesystem/config/storage-config.type';
import { StorageDriver } from '../../filesystem/drivers/storage-driver.interface';
import { FilesystemService } from '../../filesystem/filesystem.service';
import {
  applyFormat,
  extractExt,
  removeDiskPath,
} from '../../utils/filesystem';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { createHash } from 'crypto';
import {
  FilterOperator,
  paginate,
  Paginated,
  PaginateQuery,
} from 'nestjs-paginate';
import { posix as posixPath } from 'path';
import sharp from 'sharp';
import { In, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  FILE_UPLOAD_MAX_SIZE,
  FILE_UPLOAD_SINGLE_MAX_SIZE,
} from './config/file.config';
import { FileResDto } from './dto/file.res.dto';
import { UpdateFileDto } from './dto/update-file.dto';
import { FileEntity } from './entities/file.entity';
import { FileFolderService } from './file-folder.service';
import { UploadFileOptions, UploadImageOptions } from './types/upload.types';
import { FileValidator } from './validators/file.validator';

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);

  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
    private readonly fileValidator: FileValidator,
    private readonly storage: FilesystemService,
    private readonly fileFolderService: FileFolderService,
  ) {}

  private get disk(): StorageDriver {
    return this.storage.disk();
  }

  private get currentDiskName(): StorageDisk {
    return this.storage?.defaultDiskName ?? 'public';
  }

  private isDiskPrivate(disk?: string | null): boolean {
    if (this.storage?.isPrivate) {
      return this.storage.isPrivate(disk);
    }
    const target = (disk as StorageDisk) || this.currentDiskName;
    return target === 'local' || target === 's3-private';
  }

  private resolveTargetDisk(
    visibility?: 'public' | 'private' | null,
    preferredDisk?: string | null,
  ): StorageDisk {
    if (preferredDisk) {
      return this.normalizeUploadDisk(preferredDisk);
    }
    if (this.storage?.resolveDisk) {
      return this.storage.resolveDisk(visibility);
    }
    return visibility === 'private'
      ? 'local'
      : (this.storage?.defaultDiskName ?? 'public');
  }

  private resolveFileVisibility(
    disk?: string | null,
    explicitVisibility?: 'public' | 'private' | null,
  ): 'public' | 'private' {
    if (explicitVisibility === 'public' || explicitVisibility === 'private') {
      return explicitVisibility;
    }
    return this.isDiskPrivate(disk) ? 'private' : 'public';
  }

  private writeDisk(disk?: string | null): StorageDriver {
    return this.storage.disk((disk as StorageDisk) || this.currentDiskName);
  }

  private normalizeUploadDisk(disk?: string | null): StorageDisk {
    const targetDisk = (disk as StorageDisk) || this.currentDiskName;

    const isSupported = this.storage?.hasDisk
      ? this.storage.hasDisk(targetDisk)
      : ['local', 'public', 's3', 's3-private'].includes(targetDisk);

    if (!isSupported) {
      throw new BadRequestException(
        `Disk "${targetDisk}" is not supported or not configured`,
      );
    }

    return targetDisk;
  }

  private diskForFile(file: Pick<FileEntity, 'disk'>): StorageDriver {
    return this.storage.disk((file.disk as StorageDisk) ?? 'public');
  }

  private async deleteStoredFileIfExists(
    file: Pick<FileEntity, 'disk' | 'path'>,
  ) {
    const disk = this.diskForFile(file);
    const storageKey = this.toStorageKey(file.path);

    if (await disk.exists(storageKey)) {
      await disk.delete(storageKey);
    }
  }

  private toDto(file: FileEntity): FileResDto {
    const dto = plainToInstance(FileResDto, file, {
      excludeExtraneousValues: true,
    });

    if (!dto.visibility) {
      dto.visibility = this.resolveFileVisibility(file.disk, file.visibility);
    }

    if (file.disk === 's3' && !this.isDiskPrivate(file.disk)) {
      try {
        const key = this.toStorageKey(file.path);
        dto.url = this.storage.disk('s3').url(key);
      } catch {
        // Keep file.url as fallback
      }
    }

    return dto;
  }

  async findAll(query: PaginateQuery): Promise<Paginated<FileResDto>> {
    const queryBuilder = this.fileRepository
      .createQueryBuilder('file')
      .leftJoinAndSelect('file.createdByAdmin', 'createdByAdmin')
      .leftJoinAndSelect('file.updatedByAdmin', 'updatedByAdmin');

    const rawStatus =
      typeof query.filter?.status === 'string'
        ? query.filter.status.replace(/^\$[a-z]+:/, '')
        : query.filter?.status;

    const isTrash =
      rawStatus === 'trash' ||
      rawStatus === 'archived' ||
      query.filter?.is_trash === 'true' ||
      query.filter?.trash === 'true';

    if (isTrash) {
      queryBuilder.withDeleted().andWhere('file.deleted_at IS NOT NULL');
      if (query.filter) {
        delete query.filter.status;
        delete query.filter.is_trash;
        delete query.filter.trash;
      }
    }

    const result = await paginate(query, queryBuilder, {
      sortableColumns: [
        'id',
        'public_id',
        'original_name',
        'folder',
        'disk',
        'visibility',
        'mime',
        'size',
        'resource_type',
        'status',
        'is_starred',
        'createdAt',
        'updatedAt',
        'deletedAt',
      ],
      searchableColumns: [
        'public_id',
        'original_name',
        'folder',
        'disk',
        'visibility',
        'mime',
      ],
      defaultSortBy: [['createdAt', 'DESC']],
      filterableColumns: {
        public_id: [FilterOperator.EQ],
        original_name: [FilterOperator.ILIKE],
        folder: [FilterOperator.EQ, FilterOperator.ILIKE],
        disk: [FilterOperator.EQ, FilterOperator.IN],
        visibility: [FilterOperator.EQ, FilterOperator.IN],
        mime: [FilterOperator.ILIKE],
        resource_type: [FilterOperator.EQ, FilterOperator.IN],
        status: [FilterOperator.EQ, FilterOperator.IN],
        is_starred: [FilterOperator.EQ],
        createdAt: [FilterOperator.GTE, FilterOperator.LTE, FilterOperator.BTW],
        deletedAt: [FilterOperator.GTE, FilterOperator.LTE, FilterOperator.BTW],
      },
    });

    return {
      ...result,
      data: result.data.map((file) => this.toDto(file)),
    } as Paginated<FileResDto>;
  }

  async findOne(publicId: string): Promise<FileResDto> {
    const file = await this.fileRepository.findOne({
      where: { public_id: publicId },
      relations: ['createdByAdmin', 'updatedByAdmin'],
      withDeleted: true,
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    return this.toDto(file);
  }

  async update(
    publicId: string,
    dto: UpdateFileDto,
    adminId?: AutoIncrementID,
  ): Promise<FileResDto> {
    const file = await this.fileRepository.findOne({
      where: { public_id: publicId },
      relations: ['createdByAdmin', 'updatedByAdmin'],
      withDeleted: true,
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    if (adminId) {
      file.updatedByAdminId = adminId;
    }

    if (dto.folder !== undefined) {
      const normalizedFolder = this.fileFolderService.normalizeFolder(
        dto.folder,
      );
      await this.fileFolderService.ensureFolder(normalizedFolder);
      file.folder = normalizedFolder;
    }

    if (dto.original_name !== undefined && dto.original_name.trim() !== '') {
      file.original_name = dto.original_name.trim();
    }

    if (dto.status !== undefined) {
      file.status = dto.status;
    }

    if (dto.is_starred !== undefined) {
      file.is_starred = dto.is_starred;
    }

    const targetVisibility = dto.visibility;
    let targetDisk: StorageDisk | undefined = dto.disk
      ? this.normalizeUploadDisk(dto.disk)
      : undefined;

    if (
      !targetDisk &&
      targetVisibility &&
      targetVisibility !== file.visibility
    ) {
      targetDisk = this.resolveTargetDisk(targetVisibility);
    }

    if (targetDisk !== undefined) {
      const currentDisk = this.normalizeUploadDisk(
        file.disk ?? this.currentDiskName,
      );

      if (targetDisk !== currentDisk) {
        const sourceDisk = this.writeDisk(currentDisk);
        const targetDriver = this.writeDisk(targetDisk);
        const storageKey = this.toStorageKey(file.path);

        if (await sourceDisk.exists(storageKey)) {
          const fileStream = await sourceDisk.getStream(storageKey);
          await targetDriver.put(storageKey, fileStream, {
            mimeType: file.mime,
            visibility: this.isDiskPrivate(targetDisk) ? 'private' : 'public',
          });
          await sourceDisk.delete(storageKey);
        }

        file.disk = targetDisk;
      }
    }

    if (targetVisibility) {
      file.visibility = targetVisibility;
    } else if (targetDisk) {
      file.visibility = this.resolveFileVisibility(targetDisk);
    }

    const saved = await this.fileRepository.save(file);
    return this.findOne(saved.public_id);
  }

  async upload(
    file: Express.Multer.File,
    folder?: string,
    disk?: string,
    visibility?: 'public' | 'private',
    adminId?: AutoIncrementID,
  ) {
    if (!file) {
      throw new BadRequestException('File not provided');
    }

    this.fileValidator.validateFile(file, {
      maxFileSize: FILE_UPLOAD_SINGLE_MAX_SIZE,
    });

    const mime = file.mimetype;
    const resourceType = this.detectResourceType(mime);
    const publicId = uuidv4().replace(/-/g, '').slice(0, 20);

    const ext = file.originalname.split('.').pop();
    const normalizedFolder = this.fileFolderService.normalizeFolder(folder);
    const folderPath = normalizedFolder
      ? posixPath.join(resourceType, normalizedFolder)
      : resourceType;
    const storedPath = this.makeStorageKey(folderPath, `${publicId}.${ext}`);

    const uploadDiskName = this.resolveTargetDisk(visibility, disk);
    const resolvedVisibility = this.resolveFileVisibility(
      uploadDiskName,
      visibility,
    );

    await this.writeDisk(uploadDiskName).put(storedPath, file.buffer, {
      mimeType: mime,
      visibility: resolvedVisibility,
    });

    const media = await this.createFileRecord({
      publicId,
      folder: normalizedFolder,
      originalName: file.originalname,
      path: storedPath,
      disk: uploadDiskName,
      visibility: resolvedVisibility,
      mime,
      size: file.size,
      resourceType,
      buffer: file.buffer,
      createdByAdminId: adminId,
      updatedByAdminId: adminId,
    });

    const reloaded = await this.fileRepository.findOne({
      where: { public_id: media.public_id },
      relations: ['createdByAdmin', 'updatedByAdmin'],
      withDeleted: true,
    });

    return this.toDto(reloaded || media);
  }

  async delete(
    publicId: string,
    adminId?: AutoIncrementID,
  ): Promise<{ message: string }> {
    return this.softDelete(publicId, adminId);
  }

  async softDelete(
    publicId: string,
    adminId?: AutoIncrementID,
  ): Promise<{ message: string }> {
    const file = await this.fileRepository.findOneByOrFail({
      public_id: publicId,
    });

    if (adminId) {
      file.updatedByAdminId = adminId;
      await this.fileRepository.save(file);
    }

    await this.fileRepository.softDelete({ public_id: publicId });

    return {
      message: 'File moved to trash successfully',
    };
  }

  async restore(
    publicId: string,
    adminId?: AutoIncrementID,
  ): Promise<FileResDto> {
    await this.fileRepository.restore({ public_id: publicId });
    if (adminId) {
      await this.fileRepository.update(
        { public_id: publicId },
        { updatedByAdminId: adminId },
      );
    }
    return this.findOne(publicId);
  }

  async permanentDelete(publicId: string): Promise<{ message: string }> {
    const file = await this.fileRepository.findOne({
      where: { public_id: publicId },
      withDeleted: true,
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    await this.deleteStoredFileIfExists(file);

    try {
      const disk = this.diskForFile(file);
      await disk.deleteDirectory(`.cache/transforms/${publicId}`);
    } catch {
      // Ignore cache cleanup errors
    }

    await this.fileRepository.delete({ public_id: publicId });

    return {
      message: 'File permanently deleted',
    };
  }

  async bulkSoftDelete(
    publicIds: string[],
    adminId?: AutoIncrementID,
  ): Promise<{ count: number; message: string }> {
    if (!publicIds.length) return { count: 0, message: 'No files provided' };
    if (adminId) {
      await this.fileRepository.update(
        { public_id: In(publicIds) },
        { updatedByAdminId: adminId },
      );
    }
    await this.fileRepository.softDelete({ public_id: In(publicIds) });
    return {
      count: publicIds.length,
      message: 'Files moved to trash successfully',
    };
  }

  async bulkRestore(
    publicIds: string[],
    adminId?: AutoIncrementID,
  ): Promise<{ count: number; message: string }> {
    if (!publicIds.length) return { count: 0, message: 'No files provided' };
    await this.fileRepository.restore({ public_id: In(publicIds) });
    if (adminId) {
      await this.fileRepository.update(
        { public_id: In(publicIds) },
        { updatedByAdminId: adminId },
      );
    }
    return { count: publicIds.length, message: 'Files restored successfully' };
  }

  async bulkPermanentDelete(
    publicIds: string[],
  ): Promise<{ count: number; message: string }> {
    if (!publicIds.length) return { count: 0, message: 'No files provided' };
    const files = await this.fileRepository.find({
      where: { public_id: In(publicIds) },
      withDeleted: true,
    });
    for (const file of files) {
      await this.deleteStoredFileIfExists(file);
      try {
        const disk = this.diskForFile(file);
        await disk.deleteDirectory(`.cache/transforms/${file.public_id}`);
      } catch {
        // ignore
      }
    }
    await this.fileRepository.delete({ public_id: In(publicIds) });
    return { count: publicIds.length, message: 'Files permanently deleted' };
  }

  async getTemporaryUrl(
    publicId: string,
    expiresInSeconds: number = 900,
  ): Promise<{ url: string; expiresIn: number; expiresAt: string }> {
    const file = await this.fileRepository.findOneByOrFail({
      public_id: publicId,
    });

    const diskName = this.normalizeUploadDisk(
      file.disk ?? this.currentDiskName,
    );
    const storageKey = this.toStorageKey(file.path);
    const disk = this.writeDisk(diskName);

    let url: string;
    try {
      url = await disk.temporaryUrl(storageKey, expiresInSeconds);
    } catch {
      url = file.url;
    }

    return {
      url,
      expiresIn: expiresInSeconds,
      expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
    };
  }

  async uploadImage(
    file: Express.Multer.File,
    options: UploadImageOptions = {},
  ) {
    const {
      folder,
      format,
      quality = 80,
      compress = true,
      sizes = [],
      generateThumbnail = false,
      thumbnailWidth = 300,
    } = options;

    this.fileValidator.validateImage(file, options);

    const detectedExt = extractExt(file.mimetype);

    const baseName = file.originalname.replace(/\.[^.]+$/, '');
    const ext = format ?? detectedExt;
    const filename = `${Date.now()}-${baseName}.${ext}`;

    let img = sharp(file.buffer);

    if (format) {
      img = applyFormat(img, format, quality);
    } else if (compress) {
      img = img.webp({ quality });
    }

    const buffer = await img.toBuffer();
    const targetPath = this.makeStorageKey(folder, filename);

    await this.disk.put(targetPath, buffer, {
      mimeType: `image/${ext}`,
      visibility: 'public',
    });

    const result = {
      original: await this.getStorageUrl(targetPath),
      sizes: {} as Record<string, string>,
      thumbnail: null as string | null,
    };

    // Process multi-size
    for (const size of sizes) {
      const resizedFolder = folder ? `${folder}/${size.name}` : size.name;

      const resizedName = `${Date.now()}-${baseName}-${size.name}.${ext}`;

      const sizeBuffer = await sharp(file.buffer).resize(size.width).toBuffer();

      const resizedPath = this.makeStorageKey(resizedFolder, resizedName);

      await this.disk.put(resizedPath, sizeBuffer, {
        mimeType: `image/${ext}`,
        visibility: 'public',
      });

      result.sizes[size.name] = await this.getStorageUrl(resizedPath);
    }

    // Thumbnail
    if (generateThumbnail) {
      const thumbFolder = folder ? `${folder}/thumb` : 'thumb';
      const thumbName = `${Date.now()}-${baseName}-thumb.${ext}`;

      const thumbnailBuffer = await sharp(file.buffer)
        .resize(Number(thumbnailWidth))
        .toBuffer();

      const thumbnailPath = this.makeStorageKey(thumbFolder, thumbName);

      await this.disk.put(thumbnailPath, thumbnailBuffer, {
        mimeType: `image/${ext}`,
        visibility: 'public',
      });

      result.thumbnail = await this.getStorageUrl(thumbnailPath);
    }

    return result;
  }

  async uploadFile(file: Express.Multer.File, options: UploadFileOptions = {}) {
    const { folder = 'docs', rename = true } = options;

    this.fileValidator.validateFile(file, options);

    const ext = file.originalname.split('.').pop();
    const base = file.originalname.replace(/\.[^.]+$/, '');

    const filename = rename
      ? `${Date.now()}-${base}.${ext}`
      : file.originalname;

    const storedPath = this.makeStorageKey(folder, filename);

    await this.disk.put(storedPath, file.buffer, {
      mimeType: file.mimetype,
      visibility: 'public',
    });

    return {
      path: await this.getStorageUrl(storedPath),
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  private generateHash(): string {
    const now = Date.now().toString();
    const rand = uuidv4();
    return createHash('sha256')
      .update(rand + now + Math.random().toString())
      .digest('hex');
  }

  private async createFileRecord({
    publicId,
    folder,
    disk,
    visibility,
    originalName,
    path,
    mime,
    size,
    resourceType,
    buffer,
    metadataPath,
    createdByAdminId,
    updatedByAdminId,
  }: {
    publicId: string;
    folder: string | null;
    disk: string;
    visibility?: 'public' | 'private';
    originalName: string;
    path: string;
    mime: string;
    size: number;
    resourceType: string;
    buffer?: Buffer;
    metadataPath?: string;
    createdByAdminId?: AutoIncrementID | null;
    updatedByAdminId?: AutoIncrementID | null;
  }): Promise<FileEntity> {
    let width: number | null = null;
    let height: number | null = null;

    if (resourceType === 'image') {
      try {
        const meta = buffer
          ? await sharp(buffer).metadata()
          : await sharp(metadataPath ?? path).metadata();
        width = meta.width ?? null;
        height = meta.height ?? null;
      } catch (err) {
        this.logger.warn(`Failed to read image metadata: ${err}`);
      }
    }

    if (folder) {
      await this.fileFolderService.ensureFolder(folder);
    }

    const resolvedVisibility = visibility ?? this.resolveFileVisibility(disk);

    const media = this.fileRepository.create({
      public_id: publicId,
      folder,
      disk,
      visibility: resolvedVisibility,
      original_name: originalName,
      path,
      hash: this.generateHash(),
      mime,
      size,
      width,
      height,
      duration: null,
      resource_type: resourceType,
      status: 'active',
      createdByAdminId,
      updatedByAdminId,
    });

    return this.fileRepository.save(media);
  }

  private detectResourceType(mime: string): string {
    if (mime.includes('image')) return 'image';
    if (mime.includes('video')) return 'video';
    if (mime.includes('audio')) return 'audio';
    return 'raw';
  }

  private makeStorageKey(...parts: Array<string | null | undefined>): string {
    return posixPath
      .join(
        ...parts
          .filter((part): part is string => Boolean(part))
          .map((part) => part.replace(/\\/g, '/')),
      )
      .replace(/^\/+/, '');
  }

  private toStorageKey(path: string): string {
    const normalized = path.replace(/\\/g, '/');
    const legacyPrefixes = ['storage/public/', 'storage/private/'];
    const legacyPrefix = legacyPrefixes.find((prefix) =>
      normalized.includes(prefix),
    );

    if (legacyPrefix) {
      return normalized.slice(
        normalized.indexOf(legacyPrefix) + legacyPrefix.length,
      );
    }

    return removeDiskPath(normalized).replace(/^\/+/, '');
  }

  private async getStorageUrl(path: string): Promise<string> {
    if (this.disk.url) {
      return this.disk.url(path);
    }

    return path;
  }
}
