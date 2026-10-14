import { registerAs } from '@nestjs/config';
import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import validateConfig from '../../utils/validate-config';
import { MailConfig } from './mail-config.type';

class EnvironmentVariablesValidator {
  @IsString()
  @IsOptional()
  MAIL_HOST?: string;

  @IsInt()
  @Min(0)
  @Max(65535)
  @IsOptional()
  MAIL_PORT?: number;

  @IsString()
  @IsOptional()
  MAIL_USER?: string;

  @IsString()
  @IsOptional()
  MAIL_PASSWORD?: string;

  @IsBoolean()
  @IsOptional()
  MAIL_IGNORE_TLS?: boolean;

  @IsBoolean()
  @IsOptional()
  MAIL_SECURE?: boolean;

  @IsBoolean()
  @IsOptional()
  MAIL_REQUIRE_TLS?: boolean;

  @IsEmail()
  @IsOptional()
  MAIL_DEFAULT_EMAIL?: string;

  @IsString()
  @IsOptional()
  MAIL_DEFAULT_NAME?: string;
}

export default registerAs<MailConfig>('mail', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    host: process.env.MAIL_HOST || 'localhost',
    port: process.env.MAIL_PORT ? parseInt(process.env.MAIL_PORT, 10) : 1025,
    user: process.env.MAIL_USER || undefined,
    password: process.env.MAIL_PASSWORD || undefined,
    ignoreTLS: process.env.MAIL_IGNORE_TLS === 'true',
    secure: process.env.MAIL_SECURE === 'true',
    requireTLS: process.env.MAIL_REQUIRE_TLS === 'true',
    defaultEmail: process.env.MAIL_DEFAULT_EMAIL || 'noreply@example.com',
    defaultName: process.env.MAIL_DEFAULT_NAME || 'No Reply',
  };
});
