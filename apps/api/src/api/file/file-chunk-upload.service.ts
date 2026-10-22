import { AutoIncrementID } from '../../common/types/common.type';
import { StorageDisk } from '../../filesystem/config/storage-config.type';
import {
  isMultipartCapable,
  StorageDriver,
} from '../../filesystem/drivers/storage-driver.interface';
import { FilesystemService } from '../../filesystem/filesystem.service';
import { RedisService } from '../../redis/redis.service';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { createHash } from 'crypto';
import { createReadStream, createWriteStream, existsSync } from 'fs';
import { mkdir, readFile, rm, stat, writeFile } from 'fs/promises';
import { dirname, join, posix as posixPath } from 'path';
import sharp from 'sharp';
import { type Readable } from 'stream';
import { finished } from 'stream/promises';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  FILE_UPLOAD_CHUNK_SIZE,
  FILE_UPLOAD_MAX_SIZE,
} from './config/file.config';
import { CreateChunkUploadSessionDto } from './dto/chunk-upload.dto';
import { FileResDto } from './dto/file.res.dto';
import { FileEntity } from './entities/file.entity';
import { FileUploadSessionEntity } from './entities/file-upload-session.entity';
import { FileFolderService } from './file-folder.service';

export type ChunkUploadSession = {
  sessionId: string;
  originalName: string;
  mime: string;
  size: number;
  disk: string;
  visibility: 'public' | 'private';
  folder: string | null;
  totalChunks: number;
  chunkSize: number;
  uploadedChunks: number[];
  createdAt: string;
  s3UploadId?: string;
  s3Key?: string;
  s3Parts?: Array<{ partNumber: number; etag: string }>;
  imageWidth?: number | null;
  imageHeight?: number | null;
};

@Injectable()
export class FileChunkUploadService {
  private readonly logger = new Logger(FileChunkUploadService.name);

  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
    @InjectRepository(FileUploadSessionEntity)
    private readonly sessionRepository: Repository<FileUploadSessionEntity>,
    private readonly storage: FilesystemService,
    private readonly fileFolderService: FileFolderService,
    @Optional()
    private readonly redis?: RedisService,
  ) {}

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

  private toDto(file: FileEntity): FileResDto {
    const dto = plainToInstance(FileResDto, file, {
      excludeExtraneousValues: true,
    });

    if (!dto.visibility) {
      dto.visibility = this.resolveFileVisibility(file.disk, file.visibility);
    }

    if (file.disk === 's3' && !this.isDiskPrivate(file.disk)) {
      try {
        dto.url = this.storage.disk('s3').url(file.path);
      } catch {
        // Keep file.url as fallback
      }
    }

    return dto;
  }

  private uploadSessionsRoot(): string {
    return join(process.cwd(), 'storage', 'tmp', 'file-uploads');
  }

  private assertSafeSessionId(sessionId: string): string {
    if (
      !sessionId ||
      typeof sessionId !== 'string' ||
      !/^[a-zA-Z0-9_-]{1,64}$/.test(sessionId)
    ) {
      throw new BadRequestException('Invalid upload session id');
    }
    return sessionId;
  }

  private sessionPath(sessionId: string): string {
    this.assertSafeSessionId(sessionId);
    return join(this.uploadSessionsRoot(), sessionId);
  }

  private sessionManifestPath(sessionId: string): string {
    return join(this.sessionPath(sessionId), 'manifest.json');
  }

  private chunkPath(sessionId: string, index: number): string {
    return join(this.sessionPath(sessionId), `${index}.part`);
  }

  private async readUploadSession(
    sessionId: string,
  ): Promise<ChunkUploadSession> {
    if (this.redis) {
      try {
        const cached = await this.redis.get(`chunk_session:${sessionId}`);
        if (cached) {
          return JSON.parse(cached) as ChunkUploadSession;
        }
      } catch (err) {
        this.logger.warn(`Redis get failed for session ${sessionId}: ${err}`);
      }
    }

    const sessionEntity = await this.sessionRepository.findOne({
      where: { id: sessionId },
    });

    if (sessionEntity) {
      if (
        sessionEntity.status === 'aborted' ||
        sessionEntity.status === 'expired'
      ) {
        throw new NotFoundException(
          'Upload session has expired or been aborted',
        );
      }

      const session: ChunkUploadSession = {
        sessionId: sessionEntity.id,
        originalName: sessionEntity.originalName,
        mime: sessionEntity.mime,
        size: Number(sessionEntity.size),
        disk: sessionEntity.disk,
        visibility: sessionEntity.visibility,
        folder: sessionEntity.folder ?? null,
        totalChunks: sessionEntity.totalChunks,
        chunkSize: sessionEntity.chunkSize,
        uploadedChunks: sessionEntity.uploadedChunks ?? [],
        createdAt:
          sessionEntity.createdAt?.toISOString() ?? new Date().toISOString(),
        s3UploadId: sessionEntity.s3UploadId ?? undefined,
        s3Key: sessionEntity.s3Key ?? undefined,
        s3Parts: sessionEntity.s3Parts ?? undefined,
        imageWidth: sessionEntity.imageWidth ?? null,
        imageHeight: sessionEntity.imageHeight ?? null,
      };

      if (this.redis) {
        try {
          await this.redis.set(
            `chunk_session:${sessionId}`,
            JSON.stringify(session),
            86400,
          );
        } catch {
          // ignore cache write error
        }
      }

      return session;
    }

    try {
      const manifest = await readFile(
        this.sessionManifestPath(sessionId),
        'utf8',
      );
      return JSON.parse(manifest) as ChunkUploadSession;
    } catch {
      throw new NotFoundException('Upload session not found');
    }
  }

  private async writeUploadSession(session: ChunkUploadSession): Promise<void> {
    if (this.redis) {
      try {
        await this.redis.set(
          `chunk_session:${session.sessionId}`,
          JSON.stringify(session),
          86400,
        );
      } catch (err) {
        this.logger.warn(
          `Redis set failed for session ${session.sessionId}: ${err}`,
        );
      }
    }

    try {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await this.sessionRepository.save({
        id: session.sessionId,
        originalName: session.originalName,
        mime: session.mime,
        size: session.size,
        disk: session.disk,
        visibility: session.visibility,
        folder: session.folder,
        totalChunks: session.totalChunks,
        chunkSize: session.chunkSize,
        uploadedChunks: session.uploadedChunks,
        s3UploadId: session.s3UploadId ?? null,
        s3Key: session.s3Key ?? null,
        s3Parts: session.s3Parts ?? null,
        imageWidth: session.imageWidth ?? null,
        imageHeight: session.imageHeight ?? null,
        status: 'pending',
        expiresAt,
      });
    } catch (err) {
      this.logger.warn(`Failed to persist upload session to database: ${err}`);
    }

    try {
      await mkdir(this.sessionPath(session.sessionId), { recursive: true });
      await writeFile(
        this.sessionManifestPath(session.sessionId),
        JSON.stringify(session, null, 2),
      );
    } catch (err) {
      if (!this.redis) {
        throw err;
      }
    }
  }

  private formatBytes(bytes: number): string {
    const mb = bytes / 1024 / 1024;
    return `${Number.isInteger(mb) ? mb : mb.toFixed(1)}MB`;
  }

  private detectResourceType(mime: string): string {
    if (mime.includes('image')) return 'image';
    if (mime.includes('video')) return 'video';
    if (mime.includes('audio')) return 'audio';
    return 'raw';
  }

  private generateHash(): string {
    const now = Date.now().toString();
    const rand = uuidv4();
    return createHash('sha256')
      .update(rand + now + Math.random().toString())
      .digest('hex');
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

  private async putStorageStream(
    path: string,
    stream: Readable,
    options: { visibility?: 'public' | 'private'; mimeType?: string },
    disk: StorageDriver,
  ): Promise<void> {
    await disk.put(path, stream, options);
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
    metadataPath?: string;
    createdByAdminId?: AutoIncrementID | null;
    updatedByAdminId?: AutoIncrementID | null;
  }): Promise<FileEntity> {
    let width: number | null = null;
    let height: number | null = null;

    if (resourceType === 'image') {
      try {
        const meta = await sharp(metadataPath ?? path).metadata();
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

  async createUploadSession(dto: CreateChunkUploadSessionDto) {
    if (dto.size > FILE_UPLOAD_MAX_SIZE) {
      throw new BadRequestException(
        `File exceeds limit: ${this.formatBytes(FILE_UPLOAD_MAX_SIZE)}`,
      );
    }

    if (dto.chunkSize > FILE_UPLOAD_CHUNK_SIZE) {
      throw new BadRequestException(
        `Chunk exceeds limit: ${this.formatBytes(FILE_UPLOAD_CHUNK_SIZE)}`,
      );
    }

    if (dto.totalChunks !== Math.ceil(dto.size / dto.chunkSize)) {
      throw new BadRequestException('Invalid chunk count');
    }

    const targetDisk = this.resolveTargetDisk(dto.visibility, dto.disk);
    const resolvedVisibility = this.resolveFileVisibility(
      targetDisk,
      dto.visibility,
    );

    const session: ChunkUploadSession = {
      sessionId: uuidv4().replace(/-/g, ''),
      originalName: dto.originalName,
      mime: dto.mime,
      size: dto.size,
      disk: targetDisk,
      visibility: resolvedVisibility,
      folder: this.fileFolderService.normalizeFolder(dto.folder),
      totalChunks: dto.totalChunks,
      chunkSize: dto.chunkSize,
      uploadedChunks: [],
      createdAt: new Date().toISOString(),
    };

    const targetDriver = this.writeDisk(targetDisk);
    if (isMultipartCapable(targetDriver)) {
      const resourceType = this.detectResourceType(session.mime);
      const publicId = uuidv4().replace(/-/g, '').slice(0, 20);
      const ext = session.originalName.split('.').pop() || 'bin';
      const folderPath = session.folder
        ? posixPath.join(resourceType, session.folder)
        : resourceType;
      const storedPath = this.makeStorageKey(folderPath, `${publicId}.${ext}`);

      const { uploadId } = await targetDriver.createMultipartUpload(
        storedPath,
        {
          mimeType: session.mime,
          visibility: resolvedVisibility,
        },
      );

      session.s3UploadId = uploadId;
      session.s3Key = storedPath;
      session.s3Parts = [];
    } else {
      await mkdir(this.sessionPath(session.sessionId), { recursive: true });
    }

    await this.writeUploadSession(session);

    return {
      sessionId: session.sessionId,
      chunkSize: session.chunkSize,
      totalChunks: session.totalChunks,
      uploadedChunks: session.uploadedChunks,
    };
  }

  async uploadChunk(
    sessionId: string,
    index: number,
    chunk?: Express.Multer.File,
  ) {
    if (!chunk) {
      throw new BadRequestException('Chunk not provided');
    }

    const session = await this.readUploadSession(sessionId);

    if (index < 0 || index >= session.totalChunks) {
      throw new BadRequestException('Invalid chunk index');
    }

    if (chunk.size > session.chunkSize) {
      throw new BadRequestException(
        `Chunk exceeds limit: ${this.formatBytes(session.chunkSize)}`,
      );
    }

    const targetDriver = this.writeDisk(session.disk);
    if (
      isMultipartCapable(targetDriver) &&
      session.s3UploadId &&
      session.s3Key
    ) {
      const partNumber = index + 1;
      const { etag } = await targetDriver.uploadPart(
        session.s3Key,
        session.s3UploadId,
        partNumber,
        chunk.buffer,
      );

      session.s3Parts = [
        ...(session.s3Parts ?? []).filter((p) => p.partNumber !== partNumber),
        { partNumber, etag },
      ];

      if (index === 0 && session.mime.includes('image')) {
        try {
          const meta = await sharp(chunk.buffer).metadata();
          session.imageWidth = meta.width ?? null;
          session.imageHeight = meta.height ?? null;
        } catch (err) {
          this.logger.warn(`Failed to read chunk 0 image metadata: ${err}`);
        }
      }
    } else {
      await writeFile(this.chunkPath(sessionId, index), chunk.buffer);
    }

    session.uploadedChunks = Array.from(
      new Set([...session.uploadedChunks, index]),
    ).sort((a, b) => a - b);
    await this.writeUploadSession(session);

    return {
      sessionId,
      uploadedChunks: session.uploadedChunks,
      complete: session.uploadedChunks.length === session.totalChunks,
    };
  }

  async completeUploadSession(
    sessionId: string,
    adminId?: AutoIncrementID,
  ): Promise<FileResDto> {
    const session = await this.readUploadSession(sessionId);

    if (session.uploadedChunks.length !== session.totalChunks) {
      throw new BadRequestException('Upload session is missing chunks');
    }

    const targetDriver = this.writeDisk(session.disk);
    if (
      isMultipartCapable(targetDriver) &&
      session.s3UploadId &&
      session.s3Key
    ) {
      if ((session.s3Parts?.length ?? 0) !== session.totalChunks) {
        throw new BadRequestException('Upload session is missing chunks');
      }

      await targetDriver.completeMultipartUpload(
        session.s3Key,
        session.s3UploadId,
        session.s3Parts!,
      );

      const publicId = posixPath
        .basename(session.s3Key)
        .split('.')[0]
        .slice(0, 20);
      const resourceType = this.detectResourceType(session.mime);

      if (session.folder) {
        await this.fileFolderService.ensureFolder(session.folder);
      }

      const media = this.fileRepository.create({
        public_id: publicId,
        folder: session.folder,
        disk: session.disk,
        visibility: session.visibility,
        original_name: session.originalName,
        path: session.s3Key,
        hash: this.generateHash(),
        mime: session.mime,
        size: session.size,
        width: session.imageWidth ?? null,
        height: session.imageHeight ?? null,
        duration: null,
        resource_type: resourceType,
        status: 'active',
        createdByAdminId: adminId,
        updatedByAdminId: adminId,
      });

      const saved = await this.fileRepository.save(media);
      await this.sessionRepository.update(
        { id: sessionId },
        { status: 'completed' },
      );
      await this.abortUploadSession(sessionId);

      const reloaded = await this.fileRepository.findOne({
        where: { public_id: saved.public_id },
        relations: ['createdByAdmin', 'updatedByAdmin'],
      });

      return this.toDto(reloaded ?? saved);
    }

    for (let index = 0; index < session.totalChunks; index++) {
      if (!existsSync(this.chunkPath(sessionId, index))) {
        throw new BadRequestException(`Missing chunk ${index}`);
      }
    }

    const resourceType = this.detectResourceType(session.mime);
    const publicId = uuidv4().replace(/-/g, '').slice(0, 20);
    const ext = session.originalName.split('.').pop() || 'bin';
    const folderPath = session.folder
      ? posixPath.join(resourceType, session.folder)
      : resourceType;
    const storedPath = this.makeStorageKey(folderPath, `${publicId}.${ext}`);
    const mergedPath = join(this.sessionPath(sessionId), 'merged');

    await mkdir(dirname(mergedPath), { recursive: true });
    const target = createWriteStream(mergedPath);

    try {
      for (let index = 0; index < session.totalChunks; index++) {
        const source = createReadStream(this.chunkPath(sessionId, index));
        source.pipe(target, { end: false });
        await finished(source);
      }
    } finally {
      target.end();
    }

    await finished(target);

    const fileStat = await stat(mergedPath);
    if (fileStat.size !== session.size) {
      await rm(mergedPath, { force: true });
      throw new BadRequestException('Merged file size mismatch');
    }

    await this.putStorageStream(
      storedPath,
      createReadStream(mergedPath),
      {
        mimeType: session.mime,
        visibility: session.visibility,
      },
      this.writeDisk(session.disk),
    );

    const media = await this.createFileRecord({
      publicId,
      folder: session.folder,
      originalName: session.originalName,
      path: storedPath,
      disk: session.disk,
      visibility: session.visibility,
      mime: session.mime,
      size: fileStat.size,
      resourceType,
      metadataPath: mergedPath,
      createdByAdminId: adminId,
      updatedByAdminId: adminId,
    });

    await this.sessionRepository.update(
      { id: sessionId },
      { status: 'completed' },
    );
    await this.abortUploadSession(sessionId);

    const reloaded = await this.fileRepository.findOne({
      where: { public_id: media.public_id },
      relations: ['createdByAdmin', 'updatedByAdmin'],
    });

    return this.toDto(reloaded ?? media);
  }

  async abortUploadSession(sessionId: string): Promise<{ message: string }> {
    try {
      const session = await this.readUploadSession(sessionId);
      if (session?.s3UploadId && session?.s3Key) {
        const targetDriver = this.writeDisk(session.disk);
        if (isMultipartCapable(targetDriver)) {
          await targetDriver.abortMultipartUpload(
            session.s3Key,
            session.s3UploadId,
          );
        }
      }
    } catch {
      // Ignore if session already missing
    }

    try {
      await this.sessionRepository.update(
        { id: sessionId },
        { status: 'aborted' },
      );
    } catch {
      // Ignore DB update failure
    }

    if (this.redis) {
      try {
        await this.redis.del(`chunk_session:${sessionId}`);
      } catch {
        // Ignore redis delete failure
      }
    }

    try {
      await rm(this.sessionPath(sessionId), { recursive: true, force: true });
    } catch {
      // Ignore directory removal failure
    }

    return { message: 'Successfully aborted' };
  }
}
