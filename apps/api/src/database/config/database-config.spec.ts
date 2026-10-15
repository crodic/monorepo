import databaseConfig from './database.config';

describe('databaseConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  beforeAll(() => {
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'info').mockImplementation();
  });

  it('should return default database configuration when env is empty', async () => {
    delete process.env.DATABASE_TYPE;
    delete process.env.DATABASE_HOST;
    delete process.env.DATABASE_PORT;
    delete process.env.DATABASE_USERNAME;
    delete process.env.DATABASE_PASSWORD;
    delete process.env.DATABASE_NAME;
    delete process.env.DATABASE_SYNCHRONIZE;
    delete process.env.DATABASE_MAX_CONNECTIONS;

    const config = await databaseConfig();

    expect(config.type).toBe('postgres');
    expect(config.host).toBe('localhost');
    expect(config.port).toBe(5432);
    expect(config.username).toBe('postgres');
    expect(config.password).toBe('postgres');
    expect(config.name).toBe('monorepo');
    expect(config.synchronize).toBe(false);
    expect(config.maxConnections).toBe(100);
  });

  it('should return custom values when env variables are provided', async () => {
    process.env.DATABASE_HOST = 'custom-db-host';
    process.env.DATABASE_PORT = '5433';
    process.env.DATABASE_NAME = 'custom_db';
    process.env.DATABASE_SYNCHRONIZE = 'true';

    const config = await databaseConfig();

    expect(config.host).toBe('custom-db-host');
    expect(config.port).toBe(5433);
    expect(config.name).toBe('custom_db');
    expect(config.synchronize).toBe(true);
  });

  it('should throw an error when DATABASE_PORT is not a valid number', async () => {
    process.env.DATABASE_PORT = 'invalid-port';
    await expect(async () => await databaseConfig()).rejects.toThrow();
  });

  it('should throw an error when DATABASE_MAX_CONNECTIONS is not a valid number', async () => {
    process.env.DATABASE_MAX_CONNECTIONS = 'invalid-max';
    await expect(async () => await databaseConfig()).rejects.toThrow();
  });
});
