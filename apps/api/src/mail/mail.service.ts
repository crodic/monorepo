import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Handlebars from 'handlebars';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { AllConfigType } from '../config/config.type';
import { ISendMailOptions } from './constants/mail.constant';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    private readonly mailerService: MailerService,
  ) {}

  renderTemplate(
    templateName: string,
    context: Record<string, unknown>,
  ): string {
    const candidatePaths = [
      join(__dirname, 'templates', `${templateName}.hbs`),
      join(process.cwd(), 'src/mail/templates', `${templateName}.hbs`),
      join(process.cwd(), 'dist/mail/templates', `${templateName}.hbs`),
    ];

    const templatePath = candidatePaths.find((path) => existsSync(path));
    if (!templatePath) {
      throw new Error(
        `Email template "${templateName}" not found. Searched paths:\n${candidatePaths.join('\n')}`,
      );
    }

    const template = readFileSync(templatePath, 'utf8');
    return Handlebars.compile(template, { strict: false })(context);
  }

  async sendDirectMail(options: ISendMailOptions): Promise<{ html: string }> {
    const html = this.renderTemplate(options.template, options.context);

    const defaultName = this.configService.get('mail.defaultName', {
      infer: true,
    });
    const defaultEmail = this.configService.get('mail.defaultEmail', {
      infer: true,
    });
    const from = defaultName
      ? `"${defaultName}" <${defaultEmail}>`
      : defaultEmail;

    await this.mailerService.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      html,
      cc: options.cc,
      bcc: options.bcc,
      attachments: options.attachments as any,
    });

    this.logger.debug(
      `Direct email sent to ${Array.isArray(options.to) ? options.to.join(', ') : options.to} with subject "${options.subject}"`,
    );

    return { html };
  }
}
