import { registerAs } from '@nestjs/config';
import { RedisConfig } from './redis-config.type';

export default registerAs<RedisConfig>('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  tlsEnabled: process.env.REDIS_TLS_ENABLED === 'true',
}));
