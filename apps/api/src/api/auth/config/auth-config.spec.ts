import authConfig from './auth.config';

describe('AuthConfig', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  beforeAll(() => {
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'info').mockImplementation();
  });

  it('should return valid auth configuration with defaults', async () => {
    const config = await authConfig();

    expect(config.secret).toBeDefined();
    expect(config.expires).toBe('15m');
    expect(config.refreshSecret).toBeDefined();
    expect(config.refreshExpires).toBe('7d');
    expect(config.userSecret).toBeDefined();
    expect(config.userExpires).toBe('15m');
    expect(config.userRefreshSecret).toBeDefined();
    expect(config.userRefreshExpires).toBe('7d');
  });

  it('should return custom values when env variables are provided', async () => {
    process.env.AUTH_JWT_SECRET = 'custom-admin-secret-key-1234567890';
    process.env.AUTH_JWT_TOKEN_EXPIRES_IN = '30m';
    process.env.USER_AUTH_JWT_SECRET = 'custom-user-secret-key-1234567890';
    process.env.USER_AUTH_JWT_TOKEN_EXPIRES_IN = '1h';

    const config = await authConfig();

    expect(config.secret).toBe('custom-admin-secret-key-1234567890');
    expect(config.expires).toBe('30m');
    expect(config.userSecret).toBe('custom-user-secret-key-1234567890');
    expect(config.userExpires).toBe('1h');
  });

  it('should throw an error when expires format is invalid (not ms)', async () => {
    process.env.AUTH_JWT_TOKEN_EXPIRES_IN = 'not-a-valid-ms';
    await expect(async () => await authConfig()).rejects.toThrow();
  });
});
