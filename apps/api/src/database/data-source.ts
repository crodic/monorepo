import 'dotenv/config';
import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { SnakeNamingStrategy } from './naming-strategies/snake-naming.strategy';

const isSslEnabled = process.env.DATABASE_SSL_ENABLED === 'true';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: process.env.DATABASE_PORT ? parseInt(process.env.DATABASE_PORT, 10) : 5432,
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'monorepo',
  synchronize: false,
  dropSchema: false,
  logging: process.env.NODE_ENV !== 'production',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
  namingStrategy: new SnakeNamingStrategy(),
  extra: {
    max: process.env.DATABASE_MAX_CONNECTIONS
      ? parseInt(process.env.DATABASE_MAX_CONNECTIONS, 10)
      : 100,
    ssl: isSslEnabled
      ? {
          rejectUnauthorized: process.env.DATABASE_REJECT_UNAUTHORIZED === 'true',
          ca: process.env.DATABASE_CA || undefined,
          key: process.env.DATABASE_KEY || undefined,
          cert: process.env.DATABASE_CERT || undefined,
        }
      : undefined,
  },
} as DataSourceOptions);
