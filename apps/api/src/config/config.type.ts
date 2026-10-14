import { AppConfig } from './app.config';
import { DatabaseConfig } from '../database/config/database-config.type';
import { MailConfig } from '../mail/config/mail-config.type';
import { RedisConfig } from '../redis/config/redis-config.type';
import { StorageConfig } from '../filesystem/config/storage-config.type';

export type AllConfigType = {
  app: AppConfig;
  database: DatabaseConfig;
  redis: RedisConfig;
  mail: MailConfig;
  storage: StorageConfig;
};
