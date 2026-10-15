import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { BullModule } from '@nestjs/bullmq';
import { ExpressAdapter } from '@bull-board/express';
import { BullBoardModule } from '@bull-board/nestjs';
import expressBasicAuth from 'express-basic-auth';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import fs from 'fs';
import path from 'path';
import {
  AcceptLanguageResolver,
  HeaderResolver,
  I18nModule,
  QueryResolver,
} from 'nestjs-i18n';
import { ClsModule } from 'nestjs-cls';
import { LoggerModule } from 'nestjs-pino';
import appConfig from './config/app.config';
import { AllConfigType } from './config/config.type';
import { Environment } from './common/constants/app.constant';
import databaseConfig from './database/config/database.config';
import { TypeOrmConfigService } from './database/typeorm-config.service';
import { HealthModule } from './health/health.module';
import { MailModule } from './mail/mail.module';
import mailConfig from './mail/config/mail.config';
import redisConfig from './redis/config/redis.config';
import { RedisModule } from './redis/redis.module';
import { BackgroundModule } from './background/background.module';
import storageConfig from './filesystem/config/storage.config';
import sentryConfig from './config/sentry.config';
import authConfig from './api/auth/config/auth.config';
import { FilesystemModule } from './filesystem/filesystem.module';
import { SentryModule } from '@sentry/nestjs/setup';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { ApiModule } from './api/api.module';
import { SharedModule } from './shared/shared.module';
import { RequestContextInterceptor } from './interceptors/request-context.interceptor';
import { RequestIdMiddleware } from './middlewares/request-id.middleware';
import loggerFactory from './utils/logger-factory';

@Module({
  imports: [
    SentryModule.forRoot(),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        databaseConfig,
        redisConfig,
        mailConfig,
        storageConfig,
        sentryConfig,
        authConfig,
      ],
      envFilePath: ['.env'],
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: loggerFactory,
    }),
    ClsModule.forRoot({
      middleware: { mount: true },
      global: true,
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    I18nModule.forRootAsync({
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
        new HeaderResolver(['x-lang']),
      ],
      useFactory: (configService: ConfigService<AllConfigType>) => {
        const env = configService.get('app.nodeEnv', { infer: true });
        const isLocal = env === Environment.LOCAL;
        const isDev = env === Environment.DEVELOPMENT;

        const i18nPath = fs.existsSync(path.join(__dirname, './i18n/'))
          ? path.join(__dirname, './i18n/')
          : path.join(__dirname, '../src/i18n/');

        return {
          fallbackLanguage: configService.getOrThrow('app.fallbackLanguage', {
            infer: true,
          }),
          loaderOptions: {
            path: i18nPath,
            watch: isLocal,
          },
          typesOutputPath: path.resolve(
            __dirname,
            __dirname.includes('dist')
              ? '../src/generated/i18n.generated.ts'
              : './generated/i18n.generated.ts',
          ),
          logging: isLocal || isDev,
        };
      },
      inject: [ConfigService],
    }),
    RedisModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AllConfigType>) => ({
        connection: {
          host: configService.getOrThrow('redis.host', { infer: true }),
          port: configService.getOrThrow('redis.port', { infer: true }),
          password: configService.get('redis.password', { infer: true }),
          tls: configService.get('redis.tlsEnabled', { infer: true })
            ? {}
            : undefined,
          lazyConnect: true,
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
        },
      }),
    }),
    BullBoardModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<AllConfigType>) => ({
        route: config.getOrThrow('app.bullBoardPath', { infer: true }),
        adapter: ExpressAdapter,
        middleware: expressBasicAuth({
          users: {
            [config.getOrThrow('auth.adminPanelUsername', {
              infer: true,
            })]: config.getOrThrow('auth.adminPanelPassword', {
              infer: true,
            }),
          },
          challenge: true,
        }),
        boardOptions: {
          uiConfig: {
            boardLogo: {
              path: '/logo.png',
              width: 50,
              height: 50,
            },
            boardTitle: config.getOrThrow('app.name', { infer: true }),
            favIcon: {
              default: '/favicon.png',
              alternative: '/favicon.png',
            },
            environment: {
              label: config.getOrThrow('app.nodeEnv', { infer: true }),
              color: '#3b82f6',
            },
          },
        },
      }),
    }),
    HealthModule,
    MailModule,
    BackgroundModule,
    FilesystemModule,
    ApiModule,
    SharedModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestContextInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
