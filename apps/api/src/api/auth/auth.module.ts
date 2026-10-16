import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilesystemModule } from '../../filesystem/filesystem.module';
import { EmailQueueModule } from '../../background/queues/email-queue/email-queue.module';
import { AdminAccountEntity } from '../admin-user/entities/admin-account.entity';
import { AdminUserEntity } from '../admin-user/entities/admin-user.entity';
import { UserAccountEntity } from '../user/entities/user-account.entity';
import { UserEntity } from '../user/entities/user.entity';
import { AdminAuthenticationController } from './controllers/admin-auth.controller';
import { UserAuthenticationController } from './controllers/user-auth.controller';
import { AdminSessionEntity } from './entities/admin-session.entity';
import { UserSessionEntity } from './entities/user-session.entity';
import { AdminAccountRecoveryService } from './services/admin-account-recovery.service';
import { AdminAuthService } from './services/admin-auth.service';
import { AdminTwoFactorService } from './services/admin-two-factor.service';
import { AuthRecoveryService } from './services/auth-recovery.service';
import { AuthSessionService } from './services/auth-session.service';
import { AuthTokenService } from './services/auth-token.service';
import { SocialAuthService } from './services/social-auth.service';
import { UserAccountRecoveryService } from './services/user-account-recovery.service';
import { UserAuthService } from './services/user-auth.service';
import { GoogleOAuthAdapter } from './social/google-oauth.adapter';
import { AdminJwtStrategy } from './strategy/admin.strategy';
import { GoogleStrategy } from './strategy/google.strategy';
import { UserJwtStrategy } from './strategy/user.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      AdminUserEntity,
      AdminSessionEntity,
      UserSessionEntity,
      AdminAccountEntity,
      UserAccountEntity,
    ]),
    FilesystemModule,
    EmailQueueModule,
    JwtModule.register({}),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 10,
        },
      ],
    }),
  ],
  controllers: [AdminAuthenticationController, UserAuthenticationController],
  providers: [
    AuthTokenService,
    AuthRecoveryService,
    SocialAuthService,
    AdminAuthService,
    AdminTwoFactorService,
    AdminAccountRecoveryService,
    UserAccountRecoveryService,
    AuthSessionService,
    UserAuthService,
    AdminJwtStrategy,
    UserJwtStrategy,
    GoogleStrategy,
    GoogleOAuthAdapter,
  ],
  exports: [
    AuthTokenService,
    AuthRecoveryService,
    SocialAuthService,
    AdminAuthService,
    UserAuthService,
    AuthSessionService,
    AdminTwoFactorService,
    AdminAccountRecoveryService,
    UserAccountRecoveryService,
    AdminJwtStrategy,
    UserJwtStrategy,
  ],
})
export class AuthModule {}
