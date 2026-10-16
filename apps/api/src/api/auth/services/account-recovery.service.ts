import { AutoIncrementID } from '../../../common/types/common.type';
import { CacheKey } from '../../../common/constants/cache.constant';
import { ESessionUserType } from '../../../common/constants/entity.enum';
import { ErrorCode } from '../../../common/constants/error-code.constant';
import { ValidationException } from '../../../common/exceptions/validation.exception';
import { BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { FindOptionsWhere, ObjectLiteral, Repository } from 'typeorm';
import { EmailQueueService } from '../../../background/queues/email-queue/email-queue.service';
import { ForgotPasswordReqDto } from '../dto/forgot-password.req.dto';
import { ForgotPasswordResDto } from '../dto/forgot-password.res.dto';
import { ResendEmailVerifyReqDto } from '../dto/resend-email-verify.req.dto';
import { ResendEmailVerifyResDto } from '../dto/resend-email-verify.res.dto';
import { ResetPasswordReqDto } from '../dto/reset-password.req.dto';
import { ResetPasswordResDto } from '../dto/reset-password.res.dto';
import { VerifyAccountResDto } from '../dto/verify-account.res.dto';
import { IAuthUser } from '../interfaces/auth-entity.interface';
import { AuthRecoveryService } from './auth-recovery.service';

export interface AccountRecoveryConfig {
  scope: ESessionUserType;
  confirmEmailSecret: string;
  confirmEmailExpires: string;
  forgotSecret: string;
  forgotExpires: string;
  confirmEmailTemplate: string;
  confirmEmailSubject: string;
  confirmEmailUrl: (token: string) => string;
  forgotPasswordTemplate: string;
  forgotPasswordSubject: string;
  forgotPasswordUrl: (token: string) => string;
}

export abstract class AccountRecoveryService<
  TUser extends ObjectLiteral & IAuthUser,
> {
  constructor(
    protected readonly authRecoveryService: AuthRecoveryService,
    protected readonly userRepository: Repository<TUser>,
    protected readonly emailQueueService: EmailQueueService,
  ) {}

  protected abstract getRecoveryConfig(): AccountRecoveryConfig;

  protected abstract saveLocalAccountPassword(
    user: TUser,
    password: string,
  ): Promise<void>;

  protected async onPasswordResetSuccess?(user: TUser): Promise<void>;

  async sendVerificationEmail(user: TUser): Promise<void> {
    const config = this.getRecoveryConfig();
    const { token } =
      await this.authRecoveryService.createAndCacheVerificationToken({
        userId: user.id,
        scope: config.scope,
        secret: config.confirmEmailSecret,
        expiresIn: config.confirmEmailExpires,
        cacheKeyPrefix: CacheKey.EMAIL_VERIFICATION,
      });

    await this.emailQueueService.sendMail({
      to: user.email,
      subject: config.confirmEmailSubject,
      template: config.confirmEmailTemplate,
      context: {
        email: user.email,
        url: config.confirmEmailUrl(token),
      },
    });
  }

  async verifyAccount(token: string): Promise<VerifyAccountResDto> {
    const config = this.getRecoveryConfig();
    const { id } = await this.authRecoveryService.verifyAndConsumeToken({
      token,
      scope: config.scope,
      secret: config.confirmEmailSecret,
      cacheKeyPrefix: CacheKey.EMAIL_VERIFICATION,
    });

    const user = await this.userRepository.findOneBy({
      id: id as AutoIncrementID,
    } as FindOptionsWhere<TUser>);

    if (!user) {
      throw new BadRequestException();
    }

    user.verifiedAt = new Date();
    await this.userRepository.save(user);

    return plainToInstance(VerifyAccountResDto, {
      verified: true,
      message: 'Your account has been verified',
      userId: user.id,
    });
  }

  async resendVerifyEmail(
    dto: ResendEmailVerifyReqDto,
  ): Promise<ResendEmailVerifyResDto> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email } as FindOptionsWhere<TUser>,
    });

    if (user) {
      await this.sendVerificationEmail(user);
    }

    return plainToInstance(ResendEmailVerifyResDto, {
      userId: user?.id,
    });
  }

  async forgotPassword(
    dto: ForgotPasswordReqDto,
  ): Promise<ForgotPasswordResDto> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email } as FindOptionsWhere<TUser>,
    });

    if (!user) {
      throw new ValidationException(ErrorCode.E004);
    }

    const config = this.getRecoveryConfig();
    const { token } =
      await this.authRecoveryService.createAndCacheVerificationToken({
        userId: user.id,
        scope: config.scope,
        secret: config.forgotSecret,
        expiresIn: config.forgotExpires,
        cacheKeyPrefix: CacheKey.FORGOT_PASSWORD,
      });

    await this.emailQueueService.sendMail({
      to: dto.email,
      subject: config.forgotPasswordSubject,
      template: config.forgotPasswordTemplate,
      context: {
        email: dto.email,
        url: config.forgotPasswordUrl(token),
      },
    });

    // SECURITY: Do NOT return the reset token to the client in the HTTP response.
    // The reset token must only be delivered out-of-band via verified email.
    return plainToInstance(ForgotPasswordResDto, {
      message: 'A password reset link has been sent to your email.',
    });
  }

  async resetPassword(
    token: string,
    dto: ResetPasswordReqDto,
  ): Promise<ResetPasswordResDto> {
    const config = this.getRecoveryConfig();
    const { id } = await this.authRecoveryService.verifyAndConsumeToken({
      token,
      scope: config.scope,
      secret: config.forgotSecret,
      cacheKeyPrefix: CacheKey.FORGOT_PASSWORD,
    });

    const user = await this.userRepository.findOneBy({
      id: id as AutoIncrementID,
    } as FindOptionsWhere<TUser>);

    if (!user) {
      throw new BadRequestException();
    }

    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException();
    }

    await this.saveLocalAccountPassword(user, dto.password);

    if (this.onPasswordResetSuccess) {
      await this.onPasswordResetSuccess(user);
    }

    return plainToInstance(ResetPasswordResDto, {
      success: true,
      message: 'Reset password successfully. Please login to continue website',
    });
  }
}
