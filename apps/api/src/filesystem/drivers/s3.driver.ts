import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CopyObjectCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Logger } from '@nestjs/common';
import * as mime from 'mime-types';
import { Readable } from 'node:stream';
import type {
  MultipartCapable,
  MultipartPartInput,
  PutOptions,
  StorageDriver,
} from './storage-driver.interface';

export interface S3DriverConfig {
  accessKeyId?: string;
  secretAccessKey?: string;
  region: string;
  bucket: string;
  endpoint?: string;
  forcePathStyle?: boolean;
  url?: string;
  visibility?: 'public' | 'private';
}

export class S3Driver implements StorageDriver, MultipartCapable {
  private readonly logger = new Logger(S3Driver.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly region: string;
  private readonly endpoint?: string;
  private readonly forcePathStyle: boolean;
  private readonly customUrl?: string;

  constructor(config: S3DriverConfig) {
    this.bucket = config.bucket;
    this.region = config.region;
    this.endpoint = config.endpoint;
    this.forcePathStyle = config.forcePathStyle ?? false;
    this.customUrl = config.url;

    const credentials =
      config.accessKeyId && config.secretAccessKey
        ? {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
          }
        : undefined;

    this.client = new S3Client({
      region: this.region,
      credentials,
      endpoint: this.endpoint,
      forcePathStyle: this.forcePathStyle,
    });
  }

  getBucketName(): string {
    return this.bucket;
  }

  getClient(): S3Client {
    return this.client;
  }

  private normalizeKey(key: string): string {
    return key.replace(/\\/g, '/').replace(/^\/+/, '');
  }

  async put(
    filePath: string,
    content: Buffer | Uint8Array | string | Readable,
    options?: PutOptions,
  ): Promise<string> {
    const key = this.normalizeKey(filePath);
    const mimeLookup = mime.lookup(key);
    const contentType =
      options?.mimeType ??
      (typeof mimeLookup === 'string'
        ? mimeLookup
        : 'application/octet-stream');

    if (content instanceof Readable) {
      const upload = new Upload({
        client: this.client,
        params: {
          Bucket: this.bucket,
          Key: key,
          Body: content,
          ContentType:
            typeof contentType === 'string'
              ? contentType
              : 'application/octet-stream',
        },
      });

      await upload.done();
      return key;
    }

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: content,
      ContentType:
        typeof contentType === 'string'
          ? contentType
          : 'application/octet-stream',
    });

    await this.client.send(command);
    return key;
  }

  async get(filePath: string): Promise<Buffer> {
    const key = this.normalizeKey(filePath);
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const response = await this.client.send(command);
    if (!response.Body) {
      throw new Error(`File ${key} has empty body.`);
    }

    const byteArray = await response.Body.transformToByteArray();
    return Buffer.from(byteArray);
  }

  async getStream(
    filePath: string,
    options?: { start?: number; end?: number },
  ): Promise<Readable> {
    const key = this.normalizeKey(filePath);
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Range:
        options?.start !== undefined
          ? `bytes=${options.start}-${options.end ?? ''}`
          : undefined,
    });

    const response = await this.client.send(command);
    if (!response.Body) {
      throw new Error(`File ${key} has empty body.`);
    }

    return response.Body as unknown as Readable;
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      const key = this.normalizeKey(filePath);
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.client.send(command);
      return true;
    } catch (error: any) {
      if (
        error?.name === 'NotFound' ||
        error?.$metadata?.httpStatusCode === 404 ||
        error?.code === 'NoSuchKey'
      ) {
        return false;
      }
      this.logger.warn(
        `Failed to check existence for ${filePath}: ${error?.message || error}`,
      );
      return false;
    }
  }

  async delete(filePath: string): Promise<boolean> {
    try {
      const key = this.normalizeKey(filePath);
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.client.send(command);
      return true;
    } catch (error: any) {
      if (
        error?.name === 'NotFound' ||
        error?.$metadata?.httpStatusCode === 404 ||
        error?.code === 'NoSuchKey'
      ) {
        return false;
      }
      this.logger.error(
        `Failed to delete file ${filePath}: ${error?.message || error}`,
      );
      throw error;
    }
  }

  async deleteDirectory(prefix: string): Promise<boolean> {
    try {
      const normalizedPrefix = this.normalizeKey(prefix).replace(/\/*$/, '/');
      let continuationToken: string | undefined;

      do {
        const listCommand = new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: normalizedPrefix,
          ContinuationToken: continuationToken,
        });

        const listResponse = await this.client.send(listCommand);
        if (listResponse.Contents && listResponse.Contents.length > 0) {
          const objectsToDelete = listResponse.Contents.filter((item) =>
            Boolean(item.Key),
          ).map((item) => ({
            Key: item.Key!,
          }));

          if (objectsToDelete.length > 0) {
            const deleteCommand = new DeleteObjectsCommand({
              Bucket: this.bucket,
              Delete: { Objects: objectsToDelete },
            });
            await this.client.send(deleteCommand);
          }
        }

        continuationToken = listResponse.NextContinuationToken;
      } while (continuationToken);

      return true;
    } catch (error: any) {
      this.logger.error(
        `Failed to delete directory ${prefix}: ${error?.message || error}`,
      );
      throw error;
    }
  }

  async size(filePath: string): Promise<number> {
    const key = this.normalizeKey(filePath);
    const command = new HeadObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const response = await this.client.send(command);
    return response.ContentLength ?? 0;
  }

  async mimeType(filePath: string): Promise<string> {
    const key = this.normalizeKey(filePath);
    const command = new HeadObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    try {
      const response = await this.client.send(command);
      if (response.ContentType) {
        return response.ContentType;
      }
    } catch {
      // Fallback to local extension lookup
    }

    const lookup = mime.lookup(key);
    return typeof lookup === 'string' ? lookup : 'application/octet-stream';
  }

  url(filePath: string): string {
    const key = this.normalizeKey(filePath);
    if (this.customUrl) {
      const base = this.customUrl.replace(/\/+$/, '');
      return `${base}/${key}`;
    }

    if (this.endpoint) {
      const endpointTrimmed = this.endpoint.replace(/\/+$/, '');
      return `${endpointTrimmed}/${this.bucket}/${key}`;
    }

    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  async temporaryUrl(
    filePath: string,
    expiresInSeconds: number,
  ): Promise<string> {
    const key = this.normalizeKey(filePath);
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return await getSignedUrl(this.client, command, {
      expiresIn: expiresInSeconds,
    });
  }

  async copy(
    from: string,
    to: string,
    options?: { sourceBucket?: string },
  ): Promise<boolean> {
    try {
      const sourceKey = this.normalizeKey(from);
      const targetKey = this.normalizeKey(to);
      const sourceBucket = options?.sourceBucket ?? this.bucket;

      const command = new CopyObjectCommand({
        Bucket: this.bucket,
        CopySource: `${sourceBucket}/${sourceKey}`,
        Key: targetKey,
      });

      await this.client.send(command);
      return true;
    } catch (error: any) {
      this.logger.error(
        `Failed to copy ${from} to ${to}: ${error?.message || error}`,
      );
      throw error;
    }
  }

  async move(
    from: string,
    to: string,
    options?: { sourceBucket?: string },
  ): Promise<boolean> {
    const copied = await this.copy(from, to, options);
    if (copied) {
      await this.delete(from);
      return true;
    }
    return false;
  }

  async createMultipartUpload(
    filePath: string,
    options?: PutOptions,
  ): Promise<{ uploadId: string; key: string }> {
    const key = this.normalizeKey(filePath);
    const mimeLookup = mime.lookup(key);
    const contentType =
      options?.mimeType ??
      (typeof mimeLookup === 'string'
        ? mimeLookup
        : 'application/octet-stream');

    const command = new CreateMultipartUploadCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    const response = await this.client.send(command);
    if (!response.UploadId) {
      throw new Error(`Failed to create multipart upload for ${key}`);
    }

    return { uploadId: response.UploadId, key };
  }

  async uploadPart(
    filePath: string,
    uploadId: string,
    partNumber: number,
    content: Buffer | Uint8Array,
  ): Promise<{ etag: string; partNumber: number }> {
    const key = this.normalizeKey(filePath);
    const command = new UploadPartCommand({
      Bucket: this.bucket,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
      Body: content,
    });

    const response = await this.client.send(command);
    if (!response.ETag) {
      throw new Error(
        `Failed to upload part ${partNumber} for ${key}: missing ETag`,
      );
    }

    return { etag: response.ETag, partNumber };
  }

  async completeMultipartUpload(
    filePath: string,
    uploadId: string,
    parts: MultipartPartInput[],
  ): Promise<string> {
    const key = this.normalizeKey(filePath);
    const sortedParts = [...parts]
      .sort((a, b) => a.partNumber - b.partNumber)
      .map((p) => ({
        PartNumber: p.partNumber,
        ETag: p.etag,
      }));

    const command = new CompleteMultipartUploadCommand({
      Bucket: this.bucket,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: sortedParts,
      },
    });

    await this.client.send(command);
    return key;
  }

  async abortMultipartUpload(
    filePath: string,
    uploadId: string,
  ): Promise<boolean> {
    try {
      const key = this.normalizeKey(filePath);
      const command = new AbortMultipartUploadCommand({
        Bucket: this.bucket,
        Key: key,
        UploadId: uploadId,
      });

      await this.client.send(command);
      return true;
    } catch (error: any) {
      this.logger.warn(
        `Failed to abort multipart upload for ${filePath} (${uploadId}): ${error?.message || error}`,
      );
      return false;
    }
  }

  async append(filePath: string, data: string | Buffer): Promise<boolean> {
    try {
      let existing: Uint8Array = Buffer.alloc(0);
      try {
        existing = await this.get(filePath);
      } catch {
        // file doesn't exist yet, proceed
      }
      const newBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
      await this.put(filePath, Buffer.concat([existing, newBuffer]));
      return true;
    } catch (error: any) {
      this.logger.error(
        `Failed to append to ${filePath}: ${error?.message || error}`,
      );
      return false;
    }
  }

  async prepend(filePath: string, data: string | Buffer): Promise<boolean> {
    try {
      let existing: Uint8Array = Buffer.alloc(0);
      try {
        existing = await this.get(filePath);
      } catch {
        // file doesn't exist yet, proceed
      }
      const newBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
      await this.put(filePath, Buffer.concat([newBuffer, existing]));
      return true;
    } catch (error: any) {
      this.logger.error(
        `Failed to prepend to ${filePath}: ${error?.message || error}`,
      );
      return false;
    }
  }

  async makeDirectory(dirPath: string): Promise<boolean> {
    try {
      const key = this.normalizeKey(dirPath).replace(/\/?$/, '/');
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: '',
      });
      await this.client.send(command);
      return true;
    } catch (error: any) {
      this.logger.error(
        `Failed to make directory ${dirPath}: ${error?.message || error}`,
      );
      return false;
    }
  }

  async files(directory = ''): Promise<string[]> {
    try {
      const prefix = directory
        ? this.normalizeKey(directory).replace(/\/?$/, '/')
        : '';
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
        Delimiter: '/',
      });
      const response = await this.client.send(command);
      const contents = response.Contents ?? [];
      return contents
        .map((item) => item.Key)
        .filter((key): key is string => Boolean(key && !key.endsWith('/')));
    } catch (error: any) {
      this.logger.error(
        `Failed to list files in ${directory}: ${error?.message || error}`,
      );
      return [];
    }
  }

  async allFiles(directory = ''): Promise<string[]> {
    try {
      const prefix = directory
        ? this.normalizeKey(directory).replace(/\/?$/, '/')
        : '';
      const result: string[] = [];
      let continuationToken: string | undefined;

      do {
        const command = new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        });
        const response = await this.client.send(command);
        if (response.Contents) {
          for (const item of response.Contents) {
            if (item.Key && !item.Key.endsWith('/')) {
              result.push(item.Key);
            }
          }
        }
        continuationToken = response.NextContinuationToken;
      } while (continuationToken);

      return result;
    } catch (error: any) {
      this.logger.error(
        `Failed to list all files in ${directory}: ${error?.message || error}`,
      );
      return [];
    }
  }

  async directories(directory = ''): Promise<string[]> {
    try {
      const prefix = directory
        ? this.normalizeKey(directory).replace(/\/?$/, '/')
        : '';
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
        Delimiter: '/',
      });
      const response = await this.client.send(command);
      const prefixes = response.CommonPrefixes ?? [];
      return prefixes
        .map((item) => item.Prefix?.replace(/\/$/, ''))
        .filter((p): p is string => Boolean(p));
    } catch (error: any) {
      this.logger.error(
        `Failed to list directories in ${directory}: ${error?.message || error}`,
      );
      return [];
    }
  }

  async allDirectories(directory = ''): Promise<string[]> {
    try {
      const allFilesList = await this.allFiles(directory);
      const dirSet = new Set<string>();
      const normalizedBase = directory
        ? this.normalizeKey(directory).replace(/\/?$/, '')
        : '';

      for (const file of allFilesList) {
        let current = file.substring(0, file.lastIndexOf('/'));
        while (current && current !== normalizedBase) {
          dirSet.add(current);
          const lastSlash = current.lastIndexOf('/');
          if (lastSlash === -1) break;
          current = current.substring(0, lastSlash);
        }
      }
      return Array.from(dirSet).sort();
    } catch (error: any) {
      this.logger.error(
        `Failed to list all directories in ${directory}: ${error?.message || error}`,
      );
      return [];
    }
  }
}
