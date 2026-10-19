import { Injectable, StreamableFile } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import path from 'node:path';
import type { Readable } from 'node:stream';
import type { AllConfigType } from '../config/config.type';
import type { StorageDisk } from './config/storage-config.type';
import { LocalDriver } from './drivers/local.driver';
import { PublicDriver } from './drivers/public.driver';
import { S3Driver } from './drivers/s3.driver';
import type {
  PutOptions,
  StorageDriver,
} from './drivers/storage-driver.interface';

@Injectable()
export class FilesystemService {
  private readonly drivers = new Map<StorageDisk, StorageDriver>();
  private readonly defaultDiskNameValue: StorageDisk;

  constructor(private readonly configService: ConfigService<AllConfigType>) {
    this.defaultDiskNameValue =
      this.configService.get('storage.disk', { infer: true }) ?? 'public';
  }

  get defaultDiskName(): StorageDisk {
    return this.defaultDiskNameValue;
  }

  get publicDiskName(): StorageDisk {
    return (
      this.configService.get('storage.publicDisk', { infer: true }) ?? 'public'
    );
  }

  get privateDiskName(): StorageDisk {
    return (
      this.configService.get('storage.privateDisk', { infer: true }) ?? 'local'
    );
  }

  resolveDisk(
    visibility?: 'public' | 'private' | null,
    preferredDisk?: string | null,
  ): StorageDisk {
    if (preferredDisk && this.hasDisk(preferredDisk)) {
      return preferredDisk as StorageDisk;
    }
    if (visibility === 'private') {
      return this.privateDiskName;
    }
    if (visibility === 'public') {
      return this.publicDiskName;
    }
    return this.defaultDiskName;
  }

  resolveVisibility(
    diskName?: string | null,
    explicitVisibility?: 'public' | 'private' | null,
  ): 'public' | 'private' {
    if (explicitVisibility === 'public' || explicitVisibility === 'private') {
      return explicitVisibility;
    }
    return this.isPrivate(diskName) ? 'private' : 'public';
  }

  hasDisk(name?: string | null): boolean {
    if (!name) return false;
    const disks = this.configService.get('storage.disks', { infer: true });
    if (disks && disks[name as StorageDisk]) {
      return true;
    }
    return ['local', 'public', 's3', 's3-private'].includes(name);
  }

  isPrivate(diskName?: string | null): boolean {
    const target = (diskName as StorageDisk) || this.defaultDiskNameValue;
    const disks = this.configService.get('storage.disks', { infer: true });
    if (disks?.[target]?.visibility) {
      return disks[target].visibility === 'private';
    }
    return target === 'local' || target === 's3-private';
  }

  getAvailableDisks(): Array<{
    name: StorageDisk;
    visibility: 'public' | 'private';
    driver: string;
    isDefault: boolean;
  }> {
    const defaultDisk = this.defaultDiskNameValue;
    const disks = this.configService.get('storage.disks', { infer: true });
    if (disks) {
      return Object.entries(disks).map(([name, def]) => ({
        name: name as StorageDisk,
        visibility: def.visibility,
        driver: def.driver,
        isDefault: name === defaultDisk,
      }));
    }

    return [
      {
        name: 'local',
        visibility: 'private',
        driver: 'local',
        isDefault: 'local' === defaultDisk,
      },
      {
        name: 'public',
        visibility: 'public',
        driver: 'local',
        isDefault: 'public' === defaultDisk,
      },
      {
        name: 's3',
        visibility: 'public',
        driver: 's3',
        isDefault: 's3' === defaultDisk,
      },
      {
        name: 's3-private',
        visibility: 'private',
        driver: 's3',
        isDefault: 's3-private' === defaultDisk,
      },
    ];
  }

  /**
   * Get a specific disk driver instance by name ('local' | 'public' | 's3' | 's3-private').
   * If name is omitted, returns the default disk configured in .env.
   */
  disk(name?: StorageDisk): StorageDriver {
    const diskName = name ?? this.defaultDiskNameValue;

    const existing = this.drivers.get(diskName);
    if (existing) {
      return existing;
    }

    const created = this.createDriver(diskName);
    this.drivers.set(diskName, created);
    return created;
  }

  private createDriver(diskName: StorageDisk): StorageDriver {
    const localRoot =
      this.configService.get('storage.localRoot', { infer: true }) ?? 'storage';
    const appUrl =
      this.configService.get('app.url', { infer: true }) ??
      'http://localhost:8000';
    const disks = this.configService.get('storage.disks', { infer: true });
    const diskDef = disks?.[diskName];

    const driverType =
      diskDef?.driver ?? (diskName.startsWith('s3') ? 's3' : 'local');
    const visibility =
      diskDef?.visibility ??
      (diskName === 'public' || diskName === 's3' ? 'public' : 'private');

    if (driverType === 'local') {
      if (visibility === 'public') {
        return new PublicDriver(localRoot, appUrl);
      }
      return new LocalDriver(localRoot, 'local');
    }

    if (driverType === 's3') {
      const s3Config = this.configService.getOrThrow('storage.s3', {
        infer: true,
      });

      const bucket =
        diskDef?.bucket ??
        (diskName === 's3-private'
          ? (s3Config.privateBucket ?? `${s3Config.bucket}-private`)
          : s3Config.bucket);

      return new S3Driver({
        ...s3Config,
        bucket,
        url: diskDef?.url ?? (diskName === 's3' ? s3Config.url : undefined),
        visibility,
      });
    }

    throw new Error(`Unsupported storage driver: ${driverType}`);
  }

  // Facade methods delegating to the default disk

  async put(
    path: string,
    content: Buffer | Uint8Array | string | Readable,
    options?: PutOptions,
  ): Promise<string> {
    return await this.disk().put(path, content, options);
  }

  async get(path: string): Promise<Buffer> {
    return await this.disk().get(path);
  }

  async getStream(
    path: string,
    options?: { start?: number; end?: number },
  ): Promise<Readable> {
    return await this.disk().getStream(path, options);
  }

  async exists(path: string): Promise<boolean> {
    return await this.disk().exists(path);
  }

  async delete(path: string): Promise<boolean> {
    return await this.disk().delete(path);
  }

  async deleteDirectory(prefix: string): Promise<boolean> {
    return await this.disk().deleteDirectory(prefix);
  }

  async size(path: string): Promise<number> {
    return await this.disk().size(path);
  }

  async mimeType(path: string): Promise<string> {
    return await this.disk().mimeType(path);
  }

  url(path: string): string {
    return this.disk().url(path);
  }

  async temporaryUrl(path: string, expiresInSeconds: number): Promise<string> {
    return await this.disk().temporaryUrl(path, expiresInSeconds);
  }

  async copy(from: string, to: string): Promise<boolean> {
    return await this.disk().copy(from, to);
  }

  async move(from: string, to: string): Promise<boolean> {
    return await this.disk().move(from, to);
  }

  async append(filePath: string, data: string | Buffer): Promise<boolean> {
    return await this.disk().append(filePath, data);
  }

  async prepend(filePath: string, data: string | Buffer): Promise<boolean> {
    return await this.disk().prepend(filePath, data);
  }

  async makeDirectory(dirPath: string): Promise<boolean> {
    return await this.disk().makeDirectory(dirPath);
  }

  async files(directory?: string): Promise<string[]> {
    return await this.disk().files(directory);
  }

  async allFiles(directory?: string): Promise<string[]> {
    return await this.disk().allFiles(directory);
  }

  async directories(directory?: string): Promise<string[]> {
    return await this.disk().directories(directory);
  }

  async allDirectories(directory?: string): Promise<string[]> {
    return await this.disk().allDirectories(directory);
  }

  /**
   * Return a StreamableFile for controller download responses with Content-Disposition attachment.
   */
  async download(
    filePath: string,
    name?: string,
    headers?: Record<string, string>,
  ): Promise<StreamableFile> {
    const stream = await this.getStream(filePath);
    const filename = name ?? path.basename(filePath);
    const mimeType = await this.mimeType(filePath);
    const size = await this.size(filePath);

    return new StreamableFile(stream, {
      type: mimeType,
      disposition: `attachment; filename="${encodeURIComponent(filename)}"`,
      length: size,
      ...headers,
    });
  }
}
