import { MailerModule } from '@nestjs-modules/mailer';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AllConfigType } from '../config/config.type';
import { MailService } from './mail.service';

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
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
