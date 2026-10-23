import { createHmac, timingSafeEqual } from 'node:crypto';
import { FilesystemService } from '../../../filesystem/filesystem.service';
import {
  BadRequestException,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AllConfigType } from '../../../config/config.type';
import { AuthGuard } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ClsService } from 'nestjs-cls';
import { Repository } from 'typeorm';
import { FileEntity } from '../entities/file.entity';

@Injectable()
export class FileStorageAccessGuard extends AuthGuard([
  'admin-jwt',
  'user-jwt',
]) {
  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
    private readonly cls: ClsService,
    @Optional()
    private readonly storage?: FilesystemService,
    @Optional()
    private readonly configService?: ConfigService<AllConfigType>,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const publicId = request.params?.publicId;

    if (!publicId) {
      return true;
    }

    const { expires, signature } = request.query ?? {};

    // 1. Validate signed temporary URL if query parameters are present
    if (expires !== undefined || signature !== undefined) {
      if (!expires || !signature) {
        throw new BadRequestException('Incomplete temporary URL parameters');
      }

      const expiresTimestamp = Number(expires);
      if (!Number.isFinite(expiresTimestamp)) {
        throw new BadRequestException(
          'Invalid expires parameter in temporary link',
        );
      }

      const now = Math.floor(Date.now() / 1000);
      if (now > expiresTimestamp) {
        throw new ForbiddenException('Temporary URL has expired');
      }

      const expectedSignature = this.generateFileSignature(
        publicId,
        expiresTimestamp,
      );

      const isValid = this.verifySignature(
        String(signature),
        expectedSignature,
      );

      if (!isValid) {
        throw new UnauthorizedException('Invalid temporary URL signature');
      }

      // Valid, unexpired temporary URL: grant access!
      return true;
    }

    // 2. Direct access without temporary link:
    const file = await this.fileRepository.findOne({
      where: { public_id: publicId },
      select: { id: true, disk: true, visibility: true },
    });

    const isPrivate =
      file?.visibility === 'private' ||
      (this.storage
        ? this.storage.isPrivate(file?.disk)
        : (file?.disk ?? 'public') === 'local' || file?.disk === 's3-private');

    if (!isPrivate) {
      return true;
    }

    this.applyMediaQueryToken(request);

    if (this.cls.isActive()) {
      return super.canActivate(context) as boolean | Promise<boolean>;
    }

    return this.cls.run(
      () => super.canActivate(context) as boolean | Promise<boolean>,
    );
  }

  handleRequest(err, user, info, context: ExecutionContext) {
    if (err || !user) {
      throw err || new UnauthorizedException(info?.message || 'Unauthorized');
    }

    const request = context.switchToHttp().getRequest();
    request.user = user;

    if (this.cls.isActive()) {
      this.cls.set('user', user);
    }

    return user;
  }

  private generateFileSignature(publicId: string, expires: number): string {
    const secret =
      this.configService?.get('auth.secret', { infer: true }) ||
      process.env.AUTH_JWT_SECRET ||
      'temporary-url-secret-fallback-key-32';
    return createHmac('sha256', secret)
      .update(`${publicId}:${expires}`)
      .digest('hex');
  }

  private verifySignature(provided: string, expected: string): boolean {
    if (!provided || !expected || provided.length !== expected.length) {
      return false;
    }
    try {
      return timingSafeEqual(
        Buffer.from(provided, 'hex'),
        Buffer.from(expected, 'hex'),
      );
    } catch {
      return false;
    }
  }

  private applyMediaQueryToken(request: {
    query?: Record<string, unknown>;
    headers: Record<string, unknown>;
  }) {
    const token = request.query?.token;

    if (
      typeof token !== 'string' ||
      token.trim() === '' ||
      request.headers.authorization
    ) {
      return;
    }

    request.headers.authorization = `Bearer ${token}`;
  }
}
