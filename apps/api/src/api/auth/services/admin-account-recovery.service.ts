import { AdminAccountEntity } from '../../admin-user/entities/admin-account.entity';
import { AdminUserEntity } from '../../admin-user/entities/admin-user.entity';
import { AllConfigType } from '../../../config/config.type';
import {
  EAccountProvider,
  ESessionUserType,
} from '../../../common/constants/entity.enum';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailQueueService } from '../../../background/queues/email-queue/email-queue.service';
import {
  AccountRecoveryConfig,
  AccountRecoveryService,
} from './account-recovery.service';
import { AuthRecoveryService } from './auth-recovery.service';
import { AuthSessionService } from './auth-session.service';

@Injectable()
export class AdminAccountRecoveryService extends AccountRecoveryService<AdminUserEntity> {
  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    authRecoveryService: AuthRecoveryService,
    @InjectRepository(AdminUserEntity)
    adminUserRepository: Repository<AdminUserEntity>,
    @InjectRepository(AdminAccountEntity)
    private readonly adminAccountRepository: Repository<AdminAccountEntity>,
    emailQueueService: EmailQueueService,
    private readonly authSessionService: AuthSessionService,
  ) {
    super(authRecoveryService, adminUserRepository, emailQueueService);
  }

  protected getRecoveryConfig(): AccountRecoveryConfig {
    const portalResetPasswordUrl = this.configService.getOrThrow(
      'auth.portalResetPasswordUrl',
      { infer: true },
    );
    const appUrl = this.configService.getOrThrow('app.url', { infer: true });

    return {
      scope: ESessionUserType.ADMIN,
      confirmEmailSecret: this.configService.getOrThrow(
        'auth.confirmEmailSecret',
        { infer: true },
      ),
      confirmEmailExpires: this.configService.getOrThrow(
        'auth.confirmEmailExpires',
        { infer: true },
      ),
      confirmEmailTemplate: 'admin-email-verification',
      confirmEmailSubject: 'Verify your admin account',
      confirmEmailUrl: (token) => `${appUrl}/api/v1/auth/verify?token=${token}`,
      forgotSecret: this.configService.getOrThrow('auth.forgotSecret', {
        infer: true,
      }),
      forgotExpires: this.configService.getOrThrow('auth.forgotExpires', {
        infer: true,
      }),
      forgotPasswordTemplate: 'admin-email-reset-password',
      forgotPasswordSubject: 'Reset your admin password',
      forgotPasswordUrl: (token) => `${portalResetPasswordUrl}?token=${token}`,
    };
  }

  protected async saveLocalAccountPassword(
    user: AdminUserEntity,
    password: string,
  ): Promise<void> {
    let localAccount = await this.adminAccountRepository.findOne({
      where: { adminUserId: user.id, provider: EAccountProvider.LOCAL },
    });

    if (!localAccount) {
      localAccount = new AdminAccountEntity({
        adminUserId: user.id,
        provider: EAccountProvider.LOCAL,
        providerAccountId: user.email,
        password,
      });
    } else {
      localAccount.password = password;
    }

    await this.adminAccountRepository.save(localAccount);
  }

  protected override async onPasswordResetSuccess(
    user: AdminUserEntity,
  ): Promise<void> {
    // Revoke all existing sessions for this admin upon password reset
    await this.authSessionService.revokeAllUserSessions({
      userId: user.id,
      userType: ESessionUserType.ADMIN,
    });
  }
}
