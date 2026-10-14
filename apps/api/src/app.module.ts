import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import appConfig from './config/app.config';
import { AllConfigType } from './config/config.type';
import databaseConfig from './database/config/database.config';
import { TypeOrmConfigService } from './database/typeorm-config.service';
import { HealthModule } from './health/health.module';
import { MailModule } from './mail/mail.module';
import mailConfig from './mail/config/mail.config';
import redisConfig from './redis/config/redis.config';
import { RedisModule } from './redis/redis.module';
import { UserModule } from './api/user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, redisConfig, mailConfig],
      envFilePath: ['.env'],
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

    HealthModule,
    MailModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
