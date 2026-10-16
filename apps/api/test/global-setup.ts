import dotenv from 'dotenv';
import path from 'path';

// Force load .env.testing before anything else
dotenv.config({
  path: path.resolve(__dirname, '../.env.testing'),
  override: true,
});
process.env.NODE_ENV = 'test';

import { Client } from 'pg';
import { AppDataSource } from '../src/database/data-source';

export default async function globalSetup() {
  const dbName = process.env.DATABASE_NAME || 'monorepo_test';
  console.log(`\n[E2E Global Setup] Initializing test database "${dbName}"...`);

  // 1. Ensure test database exists
  const client = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT
      ? parseInt(process.env.DATABASE_PORT, 10)
      : 5432,
    user: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: 'postgres',
  });

  await client.connect();
  try {
    const res = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName],
    );
    if (!res.rowCount || res.rowCount === 0) {
      await client.query(`CREATE DATABASE "${dbName.replace(/"/g, '""')}"`);
      console.log(`[E2E Global Setup] Created test database "${dbName}".`);
    } else {
      console.log(
        `[E2E Global Setup] Test database "${dbName}" already exists.`,
      );
    }
  } finally {
    await client.end();
  }

  // 2. Run TypeORM migrations on test database
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  console.log(`[E2E Global Setup] Running migrations on "${dbName}"...`);
  await AppDataSource.runMigrations();
  await AppDataSource.destroy();

  console.log(
    '[E2E Global Setup] Database migrations completed successfully.\n',
  );
}
