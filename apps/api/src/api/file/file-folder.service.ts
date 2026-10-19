import { StorageDisk } from '../../filesystem/config/storage-config.type';
import { StorageDriver } from '../../filesystem/drivers/storage-driver.interface';
import { FilesystemService } from '../../filesystem/filesystem.service';
import { removeDiskPath } from '../../utils/filesystem';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { FileFolderResDto } from './dto/folder.dto';
import { FileFolderEntity } from './entities/file-folder.entity';
import { FileEntity } from './entities/file.entity';
import {
  FILE_FOLDER_NAME_MESSAGE,
  isValidFolderName,
  normalizeFolderName,
} from './utils/folder-name.util';

@Injectable()
export class FileFolderService {
  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
    @InjectRepository(FileFolderEntity)
    private readonly folderRepository: Repository<FileFolderEntity>,
    private readonly storage: FilesystemService,
  ) {}

  private diskForFile(file: Pick<FileEntity, 'disk'>): StorageDriver {
    return this.storage.disk((file.disk as StorageDisk) ?? 'public');
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

  normalizeFolder(folder?: string | null): string | null {
    const normalized = normalizeFolderName(folder);

    if (normalized && !isValidFolderName(normalized)) {
      throw new BadRequestException(FILE_FOLDER_NAME_MESSAGE);
    }

    return normalized;
  }

  assertFolder(folder: string): string {
    const normalized = this.normalizeFolder(folder);

    if (!normalized) {
      throw new BadRequestException('Folder is required');
    }

    return normalized;
  }

  async ensureFolder(folder?: string | null): Promise<FileFolderEntity | null> {
    const normalized = this.normalizeFolder(folder);
    if (!normalized) {
      return null;
    }

    const segments = normalized.split('/');
    let currentPath = '';
    let parentId: any = null;
    let lastEntity: FileFolderEntity | null = null;

    for (let depth = 0; depth < segments.length; depth++) {
      const segment = segments[depth];
      currentPath = currentPath ? `${currentPath}/${segment}` : segment;

      let entity = await this.folderRepository.findOne({
        where: { name: currentPath },
      });

      if (!entity) {
        entity = await this.folderRepository.save(
          this.folderRepository.create({
            name: currentPath,
            title: segment,
            parentId,
            depth,
          }),
        );
      } else if (!entity.title || entity.depth !== depth) {
        entity.title = segment;
        entity.depth = depth;
        entity.parentId = parentId;
        entity = await this.folderRepository.save(entity);
      }

      parentId = entity.id;
      lastEntity = entity;
    }

    return lastEntity;
  }

  async getFolderSummary(folderName: string): Promise<FileFolderResDto> {
    const row = await this.fileRepository
      .createQueryBuilder('file')
      .select('COUNT(file.id)', 'count')
      .addSelect('COALESCE(SUM(file.size), 0)', 'size')
      .where('file.folder = :folder', { folder: folderName })
      .getRawOne<{ count: string; size: string }>();

    const entity = await this.folderRepository.findOne({
      where: { name: folderName },
    });

    const segments = folderName.split('/');
    const parent = segments.length > 1 ? segments.slice(0, -1).join('/') : null;
    const title = segments[segments.length - 1];

    return plainToInstance(
      FileFolderResDto,
      {
        folder: folderName,
        name: entity?.title ?? title,
        parent,
        depth: entity?.depth ?? segments.length - 1,
        count: Number(row?.count ?? 0),
        size: Number(row?.size ?? 0),
      },
      { excludeExtraneousValues: true },
    );
  }

  async listFolders(): Promise<FileFolderResDto[]> {
    const folders = await this.folderRepository.find({
      order: { name: 'ASC' },
    });

    const fileStats = await this.fileRepository
      .createQueryBuilder('file')
      .select('file.folder', 'folder')
      .addSelect('COUNT(file.id)', 'count')
      .addSelect('COALESCE(SUM(file.size), 0)', 'size')
      .where('file.folder IS NOT NULL')
      .groupBy('file.folder')
      .getRawMany<{ folder: string; count: string; size: string }>();

    const statsMap = new Map<string, { count: number; size: number }>();
    for (const stat of fileStats) {
      if (stat.folder) {
        statsMap.set(stat.folder, {
          count: Number(stat.count),
          size: Number(stat.size),
        });
      }
    }

    return plainToInstance(
      FileFolderResDto,
      folders.map((f) => {
        const segments = f.name.split('/');
        const parent =
          segments.length > 1 ? segments.slice(0, -1).join('/') : null;
        const stat = statsMap.get(f.name) ?? { count: 0, size: 0 };

        return {
          folder: f.name,
          name: f.title ?? segments[segments.length - 1],
          parent,
          depth: f.depth,
          count: stat.count,
          size: stat.size,
        };
      }),
      { excludeExtraneousValues: true },
    );
  }

  async createFolder(folder: string): Promise<FileFolderResDto> {
    const normalized = this.assertFolder(folder);

    const existing = await this.folderRepository.findOne({
      where: { name: normalized },
    });

    if (existing) {
      throw new BadRequestException('Folder already exists');
    }

    await this.ensureFolder(normalized);

    return this.getFolderSummary(normalized);
  }

  async renameFolder(from: string, to: string): Promise<FileFolderResDto> {
    const sourceFolder = this.assertFolder(from);
    const targetFolder = this.assertFolder(to);

    if (sourceFolder === targetFolder) {
      return this.getFolderSummary(targetFolder);
    }

    const existingSource = await this.folderRepository.findOne({
      where: { name: sourceFolder },
    });

    const fileCount = await this.fileRepository.count({
      where: { folder: sourceFolder },
    });

    if (!existingSource && fileCount === 0) {
      throw new NotFoundException('Folder not found');
    }

    const existingTarget = await this.folderRepository.findOne({
      where: { name: targetFolder },
    });

    if (existingTarget && existingTarget.name !== sourceFolder) {
      throw new BadRequestException('Target folder already exists');
    }

    // Ensure target folder structure exists
    await this.ensureFolder(targetFolder);

    // Update files directly in this folder
    await this.fileRepository
      .createQueryBuilder()
      .update(FileEntity)
      .set({ folder: targetFolder })
      .where('folder = :folder', { folder: sourceFolder })
      .execute();

    // Cascade rename to all descendant folders and their files
    const fromPrefix = `${sourceFolder}/`;
    const toPrefix = `${targetFolder}/`;

    const descendantFolders = await this.folderRepository
      .createQueryBuilder('f')
      .where('f.name LIKE :prefix', { prefix: `${fromPrefix}%` })
      .getMany();

    for (const desc of descendantFolders) {
      const newName = desc.name.replace(fromPrefix, toPrefix);
      await this.ensureFolder(newName);
      await this.fileRepository
        .createQueryBuilder()
        .update(FileEntity)
        .set({ folder: newName })
        .where('folder = :folder', { folder: desc.name })
        .execute();
      await this.folderRepository.delete({ id: desc.id });
    }

    if (existingSource) {
      await this.folderRepository.delete({ id: existingSource.id });
    }

    return this.getFolderSummary(targetFolder);
  }

  async deleteFolder(
    folder: string,
    deleteFiles = false,
  ): Promise<{ message: string }> {
    const targetFolder = this.assertFolder(folder);
    const folderPattern = `${targetFolder}/%`;

    const existingFolder = await this.folderRepository.findOne({
      where: { name: targetFolder },
    });

    const directFiles = await this.fileRepository.find({
      where: { folder: targetFolder },
    });

    const descendantFiles = await this.fileRepository
      .createQueryBuilder('file')
      .where('file.folder LIKE :pattern', { pattern: folderPattern })
      .getMany();

    const allFiles = [...directFiles, ...descendantFiles];

    if (!existingFolder && allFiles.length === 0) {
      throw new NotFoundException('Folder not found');
    }

    if (allFiles.length > 0 && !deleteFiles) {
      throw new BadRequestException(
        'Folder is not empty. Enable delete files to remove this folder and its files.',
      );
    }

    if (deleteFiles && allFiles.length > 0) {
      await Promise.allSettled(
        allFiles.map((file) =>
          this.diskForFile(file).delete(this.toStorageKey(file.path)),
        ),
      );
      for (const file of allFiles) {
        await this.fileRepository.delete({ id: file.id });
      }
    }

    if (existingFolder) {
      // Deleting parent cascades down to children
      await this.folderRepository.delete({ id: existingFolder.id });
    }

    return { message: 'Successfully deleted' };
  }
}
