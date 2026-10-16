import { registerAs } from '@nestjs/config';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Environment, LogService } from '../common/constants/app.constant';
import validateConfig from '../utils/validate-config';

export type AppConfig = {
  nodeEnv: string;
  name: string;
  port: number;
  url: string;
  apiPrefix: string;
  corsOrigin: string;
  fallbackLanguage: string;
  debug: boolean;
  logLevel: string;
  logService: string;
  bullBoardPath: string;
};

class EnvironmentVariablesValidator {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV?: Environment;

  @IsString()
  @IsOptional()
  APP_NAME?: string;

  @IsInt()
  @Min(0)
  @Max(65535)
  @IsOptional()
  APP_PORT?: number;

  @IsString()
  @IsOptional()
  APP_URL?: string;

  @IsString()
  @IsOptional()
  API_PREFIX?: string;

  @IsString()
  @IsOptional()
  APP_CORS_ORIGIN?: string;

  @IsString()
  @IsOptional()
  APP_FALLBACK_LANGUAGE?: string;

  @IsBoolean()
  @IsOptional()
  APP_DEBUG?: boolean;

  @IsString()
  @IsOptional()
  APP_LOG_LEVEL?: string;

  @IsEnum(LogService)
  @IsOptional()
  APP_LOG_SERVICE?: string;

  @IsString()
  @IsOptional()
  BULL_BOARD_PATH?: string;
}

export default registerAs<AppConfig>('app', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  const port = process.env.APP_PORT ? parseInt(process.env.APP_PORT, 10) : 8000;

  return {
    nodeEnv: process.env.NODE_ENV || Environment.DEVELOPMENT,
    name: process.env.APP_NAME || 'NestJS API',
    port,
    url: process.env.APP_URL || `http://localhost:${port}`,
    apiPrefix: process.env.API_PREFIX || 'api',
    corsOrigin:
      process.env.APP_CORS_ORIGIN ||
      'http://localhost:5173,http://localhost:3000',
    fallbackLanguage: process.env.APP_FALLBACK_LANGUAGE || 'en',
    debug: process.env.APP_DEBUG === 'true',
    logLevel: process.env.APP_LOG_LEVEL || 'info',
    logService: process.env.APP_LOG_SERVICE || LogService.CONSOLE,
    bullBoardPath: process.env.BULL_BOARD_PATH || '/queues',
  };
});
