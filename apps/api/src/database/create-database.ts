import 'dotenv/config';
import { Client, ClientConfig } from 'pg';

const maintenanceDatabase = process.env.DATABASE_MAINTENANCE_NAME ?? 'postgres';

const getSslConfig = (): ClientConfig['ssl'] => {
  if (process.env.DATABASE_SSL_ENABLED !== 'true') {
    return undefined;
  }

  return {
    rejectUnauthorized: process.env.DATABASE_REJECT_UNAUTHORIZED === 'true',
    ca: process.env.DATABASE_CA || undefined,
    key: process.env.DATABASE_KEY || undefined,
    cert: process.env.DATABASE_CERT || undefined,
  };
};

const quoteIdentifier = (value: string): string => {
  return `"${value.replace(/"/g, '""')}"`;
};

const createDatabase = async (): Promise<void> => {
  const databaseName = process.env.DATABASE_NAME || 'monorepo';
  const client = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT
      ? parseInt(process.env.DATABASE_PORT, 10)
      : 5432,
    user: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: maintenanceDatabase,
    ssl: getSslConfig(),
  });

  await client.connect();

  try {
    const result = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [databaseName],
    );

    if (result.rowCount && result.rowCount > 0) {
      console.info(`Database "${databaseName}" already exists.`);
      return;
    }

    await client.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
    console.info(`Database "${databaseName}" has been created.`);
  } finally {
    await client.end();
  }
};

void createDatabase().catch((error: unknown) => {
  console.error('Error creating database:', error);
  process.exitCode = 1;
});
