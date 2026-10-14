import { registerAs } from '@nestjs/config';
import { DatabaseConfig } from './database-config.type';

export default registerAs<DatabaseConfig>('database', () => ({
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
}));
