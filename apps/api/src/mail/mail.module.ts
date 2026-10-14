import { MailerModule } from '@nestjs-modules/mailer';
import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AllConfigType } from '../config/config.type';
import { MAIL_QUEUE_NAME } from './constants/mail.constant';
import { MailService } from './mail.service';
import { EmailProcessor } from './processors/email.processor';
import { MailQueueService } from './services/mail-queue.service';

@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<AllConfigType>) => ({
        transport: {
          host: config.get('mail.host', { infer: true }),
          port: config.get('mail.port', { infer: true }),
          ignoreTLS: config.get('mail.ignoreTLS', { infer: true }),
          requireTLS: config.get('mail.requireTLS', { infer: true }),
          secure: config.get('mail.secure', { infer: true }),
          auth: config.get('mail.user', { infer: true })
            ? {
                user: config.get('mail.user', { infer: true }),
                pass: config.get('mail.password', { infer: true }),
              }
            : undefined,
        },
        defaults: {
          from: `"${config.get('mail.defaultName', { infer: true })}" <${config.get('mail.defaultEmail', { infer: true })}>`,
        },
      }),
    }),

    BullModule.registerQueue({
      name: MAIL_QUEUE_NAME,
    }),
  ],
  providers: [MailService, MailQueueService, EmailProcessor],
  exports: [MailService, MailQueueService, BullModule],
})
export class MailModule {}
