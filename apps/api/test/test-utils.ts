import crypto from 'crypto';
import {
  ClassSerializerInterceptor,
  HttpStatus,
  INestApplication,
  RequestMethod,
  UnprocessableEntityException,
  ValidationError,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { updateGlobalConfig } from 'nestjs-paginate';
import { DataSource } from 'typeorm';
import { AdminPermissionEntity } from '../src/api/admin-permission/entities/admin-permission.entity';
import { AdminRoleEntity } from '../src/api/admin-role/entities/admin-role.entity';
import { AdminUserEntity } from '../src/api/admin-user/entities/admin-user.entity';
import { AdminSessionEntity } from '../src/api/auth/entities/admin-session.entity';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/filters/global-exception.filter';

/**
 * Bootstraps a full NestJS application instance configured identically to main.ts.
 */
export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  const configService = app.get(ConfigService);
  const reflector = app.get(Reflector);

  app.setGlobalPrefix('api', {
    exclude: [
      { method: RequestMethod.GET, path: '/' },
      { method: RequestMethod.GET, path: 'health' },
      { method: RequestMethod.GET, path: 'health/(.*)' },
      { method: RequestMethod.GET, path: 'docs' },
      { method: RequestMethod.GET, path: 'docs/(.*)' },
      'storage/uploads/(.*)',
      'queues',
      'queues/(.*)',
    ],
  });

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.useGlobalFilters(new GlobalExceptionFilter(configService));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      exceptionFactory: (errors: ValidationError[]) => {
        return new UnprocessableEntityException(errors);
      },
    }),
  );

  app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));

  updateGlobalConfig({
    defaultOrigin: undefined,
    defaultLimit: 20,
    defaultMaxLimit: 100,
  });

  await app.init();
  return app;
}

/**
 * Truncates all tables in the test database with RESTART IDENTITY CASCADE,
 * providing a completely clean/fresh state in milliseconds.
 */
export async function cleanDatabase(dataSource: DataSource): Promise<void> {
  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    const tables: Array<{ tablename: string }> = await queryRunner.query(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename NOT IN ('migrations', 'typeorm_metadata');`,
    );

    if (tables.length > 0) {
      const tableList = tables.map((t) => `"${t.tablename}"`).join(', ');
      await queryRunner.query(
        `TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE;`,
      );
    }
  } finally {
    await queryRunner.release();
  }
}

/**
 * Creates a SuperAdmin user with full permissions, starts a session,
 * and returns a valid JWT Bearer token for E2E tests.
 */
export async function getAdminAuthToken(
  app: INestApplication,
): Promise<string> {
  const dataSource = app.get(DataSource);
  const jwtService = app.get(JwtService);
  const configService = app.get(ConfigService);

  const permissionRepo = dataSource.getRepository(AdminPermissionEntity);
  const roleRepo = dataSource.getRepository(AdminRoleEntity);
  const userRepo = dataSource.getRepository(AdminUserEntity);
  const sessionRepo = dataSource.getRepository(AdminSessionEntity);

  // 1. Ensure full access permission
  let permission = await permissionRepo.findOneBy({ key: 'manage:all' });
  if (!permission) {
    permission = await permissionRepo.save(
      permissionRepo.create({
        name: 'Full System Access',
        group: 'System',
        key: 'manage:all',
      }),
    );
  }

  // 2. Ensure Super Admin role
  let role = await roleRepo.findOne({
    where: { name: 'SUPER ADMIN' },
    relations: ['permissionEntities'],
  });
  if (!role) {
    role = await roleRepo.save(
      roleRepo.create({
        name: 'SUPER ADMIN',
        isSystem: true,
        permissionEntities: [permission],
      }),
    );
  }

  // 3. Ensure test admin user
  let admin = await userRepo.findOne({
    where: { email: 'admin-e2e@example.com' },
    relations: ['roles', 'roles.permissionEntities'],
  });
  if (!admin) {
    admin = await userRepo.save(
      userRepo.create({
        firstName: 'E2E',
        lastName: 'Admin',
        email: 'admin-e2e@example.com',
        roles: [role],
      }),
    );
  }

  // 4. Create active session
  const session = await sessionRepo.save(
    sessionRepo.create({
      adminUserId: admin.id,
      admin: admin,
      hash: crypto.randomUUID(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    }),
  );

  // 5. Sign JWT Bearer token
  const secret = configService.get<string>('auth.secret');
  return jwtService.sign(
    {
      id: admin.id,
      sessionId: session.id,
      hash: session.hash,
    },
    {
      secret,
      expiresIn: '1d',
    },
  );
}
