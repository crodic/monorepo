import { UserAccountEntity } from '../../user/entities/user-account.entity';
import { UserEntity } from '../../user/entities/user.entity';
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
export class UserAccountRecoveryService extends AccountRecoveryService<UserEntity> {
  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    authRecoveryService: AuthRecoveryService,
    @InjectRepository(UserEntity)
    userRepository: Repository<UserEntity>,
    @InjectRepository(UserAccountEntity)
    private readonly userAccountRepository: Repository<UserAccountEntity>,
    emailQueueService: EmailQueueService,
    private readonly authSessionService: AuthSessionService,
  ) {
    super(authRecoveryService, userRepository, emailQueueService);
  }

  protected getRecoveryConfig(): AccountRecoveryConfig {
    const clientResetPasswordUrl = this.configService.getOrThrow(
      'auth.clientResetPasswordUrl',
      { infer: true },
    );
    const appUrl = this.configService.getOrThrow('app.url', { infer: true });

    return {
      scope: ESessionUserType.USER,
      confirmEmailSecret: this.configService.getOrThrow(
        'auth.userConfirmEmailSecret',
        { infer: true },
      ),
      confirmEmailExpires: this.configService.getOrThrow(
        'auth.userConfirmEmailExpires',
        { infer: true },
      ),
      confirmEmailTemplate: 'user-email-verification',
      confirmEmailSubject: 'Verify your account',
      confirmEmailUrl: (token) =>
        `${appUrl}/api/v1/user/auth/verify/email?token=${token}`,
      forgotSecret: this.configService.getOrThrow('auth.userForgotSecret', {
        infer: true,
      }),
      forgotExpires: this.configService.getOrThrow('auth.userForgotExpires', {
        infer: true,
      }),
      forgotPasswordTemplate: 'user-email-reset-password',
      forgotPasswordSubject: 'Reset your password',
      forgotPasswordUrl: (token) => `${clientResetPasswordUrl}?token=${token}`,
    };
  }

  protected async saveLocalAccountPassword(
    user: UserEntity,
    password: string,
  ): Promise<void> {
    let localAccount = await this.userAccountRepository.findOne({
      where: { userId: user.id, provider: EAccountProvider.LOCAL },
    });

    if (!localAccount) {
      localAccount = new UserAccountEntity({
        userId: user.id,
        provider: EAccountProvider.LOCAL,
        providerAccountId: user.email,
        password,
        email: user.email,
      });
    } else {
      localAccount.password = password;
    }

    await this.userAccountRepository.save(localAccount);
  }

  protected override async onPasswordResetSuccess(
    user: UserEntity,
  ): Promise<void> {
    // Revoke all existing sessions for this user upon password reset
    await this.authSessionService.revokeAllUserSessions({
      userId: user.id,
      userType: ESessionUserType.USER,
    });
  }
}
