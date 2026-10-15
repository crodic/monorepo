import { registerAs } from '@nestjs/config';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import validateConfig from '../utils/validate-config';

export type SentryConfig = {
  dsn?: string;
  environment: string;
  tracesSampleRate: number;
};

class EnvironmentVariablesValidator {
  @IsString()
  @IsOptional()
  SENTRY_DSN?: string;

  @IsString()
  @IsOptional()
  SENTRY_DNS_NESTJS?: string;

  @IsString()
  @IsOptional()
  SENTRY_ENVIRONMENT?: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  SENTRY_TRACES_SAMPLE_RATE?: number;
}

export default registerAs<SentryConfig>('sentry', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    dsn: process.env.SENTRY_DSN ?? process.env.SENTRY_DNS_NESTJS,
    environment:
      process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? 'development',
    tracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE
      ? Number(process.env.SENTRY_TRACES_SAMPLE_RATE)
      : 1.0,
  };
});
