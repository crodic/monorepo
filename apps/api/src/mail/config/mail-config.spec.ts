import mailConfig from './mail.config';

describe('MailConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  beforeAll(() => {
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'info').mockImplementation();
  });

  it('should return custom mail configuration when environment variables are set', async () => {
    process.env.MAIL_HOST = 'smtp.example.com';
    process.env.MAIL_PORT = '465';
    process.env.MAIL_USER = 'user@example.com';
    process.env.MAIL_PASSWORD = 'password';
    process.env.MAIL_IGNORE_TLS = 'false';
    process.env.MAIL_SECURE = 'false';
    process.env.MAIL_REQUIRE_TLS = 'false';
    process.env.MAIL_DEFAULT_EMAIL = 'default@example.com';
    process.env.MAIL_DEFAULT_NAME = 'Default Name';

    const config = await mailConfig();

    expect(config.host).toBe('smtp.example.com');
    expect(config.port).toBe(465);
    expect(config.user).toBe('user@example.com');
    expect(config.password).toBe('password');
    expect(config.ignoreTLS).toBe(false);
    expect(config.secure).toBe(false);
    expect(config.requireTLS).toBe(false);
    expect(config.defaultEmail).toBe('default@example.com');
    expect(config.defaultName).toBe('Default Name');
  });

  it('should return default fallback values when env variables are not set', async () => {
    delete process.env.MAIL_HOST;
    delete process.env.MAIL_PORT;
    delete process.env.MAIL_USER;
    delete process.env.MAIL_PASSWORD;
    delete process.env.MAIL_IGNORE_TLS;
    delete process.env.MAIL_SECURE;
    delete process.env.MAIL_REQUIRE_TLS;
    delete process.env.MAIL_DEFAULT_EMAIL;
    delete process.env.MAIL_DEFAULT_NAME;

    const config = await mailConfig();

    expect(config.host).toBe('localhost');
    expect(config.port).toBe(1025);
    expect(config.user).toBeUndefined();
    expect(config.password).toBeUndefined();
    expect(config.ignoreTLS).toBe(false);
    expect(config.secure).toBe(false);
    expect(config.requireTLS).toBe(false);
    expect(config.defaultEmail).toBe('noreply@example.com');
    expect(config.defaultName).toBe('No Reply');
  });

  describe('validation', () => {
    it('should throw an error if MAIL_PORT is invalid', async () => {
      process.env.MAIL_PORT = 'invalid-port';
      await expect(async () => await mailConfig()).rejects.toThrow();
    });

    it('should throw an error if MAIL_DEFAULT_EMAIL is not a valid email', async () => {
      process.env.MAIL_DEFAULT_EMAIL = 'invalid-email';
      await expect(async () => await mailConfig()).rejects.toThrow();
    });
  });
});
