import { registerAs } from '@nestjs/config';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import validateConfig from '../../utils/validate-config';
import { DatabaseConfig } from './database-config.type';

class EnvironmentVariablesValidator {
  @IsString()
  @IsOptional()
  DATABASE_TYPE?: string;

  @IsString()
  @IsOptional()
  DATABASE_HOST?: string;

  @IsInt()
  @Min(0)
  @Max(65535)
  @IsOptional()
  DATABASE_PORT?: number;

  @IsString()
  @IsOptional()
  DATABASE_USERNAME?: string;

  @IsString()
  @IsOptional()
  DATABASE_PASSWORD?: string;

  @IsString()
  @IsOptional()
  DATABASE_NAME?: string;

  @IsBoolean()
  @IsOptional()
  DATABASE_SYNCHRONIZE?: boolean;

  @IsInt()
  @Min(1)
  @IsOptional()
  DATABASE_MAX_CONNECTIONS?: number;

  @IsBoolean()
  @IsOptional()
  DATABASE_SSL_ENABLED?: boolean;

  @IsBoolean()
  @IsOptional()
  DATABASE_REJECT_UNAUTHORIZED?: boolean;

  @IsString()
  @IsOptional()
  DATABASE_CA?: string;

  @IsString()
  @IsOptional()
  DATABASE_KEY?: string;

  @IsString()
  @IsOptional()
  DATABASE_CERT?: string;
}

export default registerAs<DatabaseConfig>('database', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    type: process.env.DATABASE_TYPE || 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT
      ? parseInt(process.env.DATABASE_PORT, 10)
      : 5432,
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    name: process.env.DATABASE_NAME || 'monorepo',
    synchronize: process.env.DATABASE_SYNCHRONIZE === 'true',
    maxConnections: process.env.DATABASE_MAX_CONNECTIONS
      ? parseInt(process.env.DATABASE_MAX_CONNECTIONS, 10)
      : 100,
    sslEnabled: process.env.DATABASE_SSL_ENABLED === 'true',
    rejectUnauthorized: process.env.DATABASE_REJECT_UNAUTHORIZED === 'true',
    ca: process.env.DATABASE_CA || undefined,
    key: process.env.DATABASE_KEY || undefined,
    cert: process.env.DATABASE_CERT || undefined,
  };
});
