import { registerAs } from '@nestjs/config';

export type AppConfig = {
  nodeEnv: string;
  name: string;
  port: number;
  url: string;
  apiPrefix: string;
  corsOrigin: string;
};

export default registerAs<AppConfig>('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  name: process.env.APP_NAME || 'NestJS API',
  port: process.env.APP_PORT ? parseInt(process.env.APP_PORT, 10) : 8000,
  url: process.env.APP_URL || 'http://localhost:8000',
  apiPrefix: process.env.API_PREFIX || 'api',
  corsOrigin:
    process.env.APP_CORS_ORIGIN ||
    'http://localhost:5173,http://localhost:3000',
}));
