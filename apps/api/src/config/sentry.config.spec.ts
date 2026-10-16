import process from 'node:process';
import sentryConfig from './sentry.config';

describe('SentryConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should return default sentry configuration when env is empty', async () => {
    delete process.env.SENTRY_DSN;
    delete process.env.SENTRY_DNS_NESTJS;
    delete process.env.SENTRY_ENVIRONMENT;
    delete process.env.SENTRY_TRACES_SAMPLE_RATE;
    process.env.NODE_ENV = 'development';

    const config = await sentryConfig();

    expect(config.dsn).toBeUndefined();
    expect(config.environment).toBe('development');
    expect(config.tracesSampleRate).toBe(1.0);
  });

  it('should load custom configuration from SENTRY_* environment variables', async () => {
    process.env.SENTRY_DSN = 'https://examplePublicKey@o0.ingest.sentry.io/0';
    process.env.SENTRY_ENVIRONMENT = 'production';
    process.env.SENTRY_TRACES_SAMPLE_RATE = '0.25';

    const config = await sentryConfig();

    expect(config.dsn).toBe('https://examplePublicKey@o0.ingest.sentry.io/0');
    expect(config.environment).toBe('production');
    expect(config.tracesSampleRate).toBe(0.25);
  });

  it('should support legacy SENTRY_DNS_NESTJS as fallback', async () => {
    delete process.env.SENTRY_DSN;
    process.env.SENTRY_DNS_NESTJS = 'https://legacy@o0.ingest.sentry.io/1';

    const config = await sentryConfig();

    expect(config.dsn).toBe('https://legacy@o0.ingest.sentry.io/1');
  });

  it('should throw validation error on invalid sample rate (> 1)', async () => {
    process.env.SENTRY_TRACES_SAMPLE_RATE = '2.5';

    await expect(async () => await sentryConfig()).rejects.toThrow();
  });
});
