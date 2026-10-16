import * as mime from 'mime-types';
import { createReadStream, createWriteStream, promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { PutOptions, StorageDriver } from './storage-driver.interface';

export class LocalDriver implements StorageDriver {
  protected readonly basePath: string;

  constructor(root: string, subDir = 'local') {
    this.basePath = path.resolve(process.cwd(), root, subDir);
  }

  protected getFullPath(filePath: string): string {
    const normalized = path
      .normalize(filePath)
      .replace(/^(\.\.(\/|\\|$))+/, '');
    return path.join(this.basePath, normalized);
  }

  protected async ensureDirectoryExists(filePath: string): Promise<void> {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
  }

  async put(
    filePath: string,
    content: Buffer | Uint8Array | string | Readable,
    _options?: PutOptions,
  ): Promise<string> {
    void _options;
    const fullPath = this.getFullPath(filePath);
    await this.ensureDirectoryExists(fullPath);

    if (content instanceof Readable) {
      const writeStream = createWriteStream(fullPath);
      await pipeline(content, writeStream);
    } else {
      await fs.writeFile(fullPath, content);
    }

    return filePath;
  }

  async get(filePath: string): Promise<Buffer> {
    const fullPath = this.getFullPath(filePath);
    return await fs.readFile(fullPath);
  }

  async getStream(
    filePath: string,
    options?: { start?: number; end?: number },
  ): Promise<Readable> {
    const fullPath = this.getFullPath(filePath);
    await fs.access(fullPath);
    return createReadStream(fullPath, options);
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      const fullPath = this.getFullPath(filePath);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  async delete(filePath: string): Promise<boolean> {
    try {
      const fullPath = this.getFullPath(filePath);
      await fs.unlink(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  async deleteDirectory(prefix: string): Promise<boolean> {
    try {
      const fullPath = this.getFullPath(prefix);
      await fs.rm(fullPath, { recursive: true, force: true });
      return true;
    } catch {
      return false;
    }
  }

  async size(filePath: string): Promise<number> {
    const fullPath = this.getFullPath(filePath);
    const stat = await fs.stat(fullPath);
    return stat.size;
  }

  async mimeType(filePath: string): Promise<string> {
    const fullPath = this.getFullPath(filePath);
    await fs.access(fullPath);
    const lookup = mime.lookup(fullPath);
    return typeof lookup === 'string' ? lookup : 'application/octet-stream';
  }

  url(_filePath: string): string {
    void _filePath;
    throw new Error(
      'Local disk is private and does not have a public URL. Use public or s3 disk.',
    );
  }

  async temporaryUrl(
    _filePath: string,
    _expiresInSeconds?: number,
  ): Promise<string> {
    void _filePath;
    void _expiresInSeconds;
    return await Promise.reject(
      new Error(
        'Temporary URLs are not supported directly by the local private disk.',
      ),
    );
  }

  async copy(from: string, to: string): Promise<boolean> {
    try {
      const fromPath = this.getFullPath(from);
      const toPath = this.getFullPath(to);
      await this.ensureDirectoryExists(toPath);
      await fs.copyFile(fromPath, toPath);
      return true;
    } catch {
      return false;
    }
  }

  async move(from: string, to: string): Promise<boolean> {
    try {
      const fromPath = this.getFullPath(from);
      const toPath = this.getFullPath(to);
      await this.ensureDirectoryExists(toPath);
      await fs.rename(fromPath, toPath);
      return true;
    } catch {
      return false;
    }
  }

  async append(filePath: string, data: string | Buffer): Promise<boolean> {
    try {
      const fullPath = this.getFullPath(filePath);
      await this.ensureDirectoryExists(fullPath);
      await fs.appendFile(fullPath, data);
      return true;
    } catch {
      return false;
    }
  }

  async prepend(filePath: string, data: string | Buffer): Promise<boolean> {
    try {
      const fullPath = this.getFullPath(filePath);
      await this.ensureDirectoryExists(fullPath);
      let existingContent = Buffer.alloc(0);
      try {
        existingContent = await fs.readFile(fullPath);
      } catch {
        // file doesn't exist yet, proceed with empty buffer
      }
      const newBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
      await fs.writeFile(fullPath, Buffer.concat([newBuffer, existingContent]));
      return true;
    } catch {
      return false;
    }
  }

  async makeDirectory(dirPath: string): Promise<boolean> {
    try {
      const fullPath = this.getFullPath(dirPath);
      await fs.mkdir(fullPath, { recursive: true });
      return true;
    } catch {
      return false;
    }
  }

  async files(directory = ''): Promise<string[]> {
    try {
      const fullPath = this.getFullPath(directory);
      const entries = await fs.readdir(fullPath, { withFileTypes: true });
      const normalizedDir = directory
        .replace(/\\/g, '/')
        .replace(/^\/+|\/+$/g, '');
      return entries
        .filter((entry) => entry.isFile())
        .map((entry) =>
          normalizedDir ? `${normalizedDir}/${entry.name}` : entry.name,
        );
    } catch {
      return [];
    }
  }

  async allFiles(directory = ''): Promise<string[]> {
    const result: string[] = [];
    const scan = async (currentDir: string, relPrefix: string) => {
      try {
        const entries = await fs.readdir(currentDir, { withFileTypes: true });
        for (const entry of entries) {
          const entryRelPath = relPrefix
            ? `${relPrefix}/${entry.name}`
            : entry.name;
          if (entry.isFile()) {
            result.push(entryRelPath);
          } else if (entry.isDirectory()) {
            await scan(path.join(currentDir, entry.name), entryRelPath);
          }
        }
      } catch {
        // directory missing or inaccessible
      }
    };

    const targetDir = this.getFullPath(directory);
    const normalizedDir = directory
      .replace(/\\/g, '/')
      .replace(/^\/+|\/+$/g, '');
    await scan(targetDir, normalizedDir);
    return result;
  }

  async directories(directory = ''): Promise<string[]> {
    try {
      const fullPath = this.getFullPath(directory);
      const entries = await fs.readdir(fullPath, { withFileTypes: true });
      const normalizedDir = directory
        .replace(/\\/g, '/')
        .replace(/^\/+|\/+$/g, '');
      return entries
        .filter((entry) => entry.isDirectory())
        .map((entry) =>
          normalizedDir ? `${normalizedDir}/${entry.name}` : entry.name,
        );
    } catch {
      return [];
    }
  }

  async allDirectories(directory = ''): Promise<string[]> {
    const result: string[] = [];
    const scan = async (currentDir: string, relPrefix: string) => {
      try {
        const entries = await fs.readdir(currentDir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const entryRelPath = relPrefix
              ? `${relPrefix}/${entry.name}`
              : entry.name;
            result.push(entryRelPath);
            await scan(path.join(currentDir, entry.name), entryRelPath);
          }
        }
      } catch {
        // directory missing or inaccessible
      }
    };

    const targetDir = this.getFullPath(directory);
    const normalizedDir = directory
      .replace(/\\/g, '/')
      .replace(/^\/+|\/+$/g, '');
    await scan(targetDir, normalizedDir);
    return result;
  }
}
