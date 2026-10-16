import * as Sentry from '@sentry/nestjs';

const dsn = process.env.SENTRY_DSN ?? process.env.SENTRY_DNS_NESTJS;

Sentry.init({
  dsn,
  tracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE
    ? Number(process.env.SENTRY_TRACES_SAMPLE_RATE)
    : 1.0,
  environment:
    process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? 'development',
  enabled: Boolean(dsn),
});
