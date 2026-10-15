# Sentry Error Tracking & Performance Monitoring

> **English** | [Tiếng Việt](SENTRY.vi.md)

This document describes how Sentry is set up in `apps/api` using `@sentry/nestjs` for error tracking, exception capturing, and performance tracing.

---

## Table of Contents

- [Overview](#overview)
- [Architecture & Key Files](#architecture--key-files)
- [Configuration & Environment Variables](#configuration--environment-variables)
- [How It Works](#how-it-works)
  - [Initialization (`instrument.ts`)](#initialization-instrumentts)
  - [Module Setup (`AppModule`)](#module-setup-appmodule)
  - [Automatic Exception Capture (`GlobalExceptionFilter`)](#automatic-exception-capture-globalexceptionfilter)
- [Testing Sentry Locally](#testing-sentry-locally)
- [Production Best Practices](#production-best-practices)

---

## Overview

Sentry is integrated natively into the NestJS backend via `@sentry/nestjs` (official SDK). It provides:

- **Automatic unhandled exception capture**: Errors caught by `GlobalExceptionFilter` are reported with full stack traces.
- **Performance monitoring & distributed tracing**: HTTP request transactions and database query timing.
- **Safe local fallback**: If `SENTRY_DSN` is empty or undefined, Sentry automatically disables itself without throwing errors.
- **PII control**: Controlled collection of client metadata.

---

## Architecture & Key Files

```
apps/api/
├── src/
│   ├── instrument.ts               # Early Sentry.init() call executed before NestJS boots
│   ├── main.ts                     # Imports './instrument' at the very top (line 1)
│   ├── app.module.ts               # Registers SentryModule.forRoot() and sentryConfig
│   ├── config/
│   │   ├── sentry.config.ts        # Typed configuration with class-validator validation
│   │   └── sentry.config.spec.ts   # Unit tests for Sentry configuration loading
│   └── filters/
│       └── global-exception.filter.ts # Decorated with @SentryExceptionCaptured()
├── .env.example                    # Environment variable templates
└── .env                            # Local environment variables
```

---

## Configuration & Environment Variables

Configure Sentry in `.env`:

```env
# ==============================================================================
# Sentry Error Tracking & Performance Monitoring
# ==============================================================================
SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=1.0
```

### Environment Variables Reference

| Variable                    | Type     | Default                    | Description                                                                                                |
| :-------------------------- | :------- | :------------------------- | :--------------------------------------------------------------------------------------------------------- |
| `SENTRY_DSN`                | `string` | _(empty)_                  | Sentry Project DSN. If empty, Sentry is disabled.                                                          |
| `SENTRY_DNS_NESTJS`         | `string` | _(empty)_                  | Legacy alias fallback for `SENTRY_DSN`.                                                                    |
| `SENTRY_ENVIRONMENT`        | `string` | `NODE_ENV` / `development` | Environment tag in Sentry (e.g. `production`, `staging`, `development`).                                   |
| `SENTRY_TRACES_SAMPLE_RATE` | `number` | `1.0`                      | Transaction sampling rate between `0.0` and `1.0`. (Recommended `0.1` - `0.2` in high-traffic production). |

---

## How It Works

### Initialization (`instrument.ts`)

In Node.js applications, Sentry must monkey-patch Node core modules (HTTP, Express) **before** they are loaded. This is done via `src/instrument.ts`:

```typescript
import * as Sentry from "@sentry/nestjs";

const dsn = process.env.SENTRY_DSN ?? process.env.SENTRY_DNS_NESTJS;

Sentry.init({
  dsn,
  tracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE
    ? Number(process.env.SENTRY_TRACES_SAMPLE_RATE)
    : 1.0,
  environment:
    process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? "development",
  enabled: Boolean(dsn),
});
```

In `src/main.ts`, this file is imported on line 1:

```typescript
import './instrument';
import { NestFactory } from '@nestjs/core';
...
```

### Module Setup (`AppModule`)

In `apps/api/src/app.module.ts`, `SentryModule` is registered globally:

```typescript
import { SentryModule } from '@sentry/nestjs/setup';

@Module({
  imports: [
    SentryModule.forRoot(),
    ...
  ],
})
export class AppModule {}
```

### Automatic Exception Capture (`GlobalExceptionFilter`)

Unhandled exceptions are intercepted by `GlobalExceptionFilter` using `@SentryExceptionCaptured()`:

```typescript
import { SentryExceptionCaptured } from "@sentry/nestjs";

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  @SentryExceptionCaptured()
  catch(exception: any, host: ArgumentsHost): void {
    // Exception is reported to Sentry, then formatted into standard ErrorDto response
  }
}
```

---

## Testing Sentry Locally

1. Create a project at [sentry.io](https://sentry.io) (choose NestJS / Node.js).
2. Copy your project DSN into `apps/api/.env`:
   ```env
   SENTRY_DSN=https://your-dsn@o0.ingest.sentry.io/123456
   SENTRY_ENVIRONMENT=local
   ```
3. Start the application:
   ```bash
   pnpm --filter api dev
   ```
4. Trigger an unhandled error on any endpoint or add a temporary test route:
   ```typescript
   @Get('debug-sentry')
   debugSentry() {
     throw new Error('Test Sentry capture from local development');
   }
   ```
5. Check your Sentry Dashboard issues page to verify the event and stack trace.

---

## Production Best Practices

1. **Sample Rate**: Set `SENTRY_TRACES_SAMPLE_RATE=0.1` or `0.2` in production to avoid exceeding transaction quotas on high-traffic systems.
2. **Never commit actual DSN secrets**: Keep `SENTRY_DSN` strictly in secure environment managers / CI/CD secrets.
3. **Graceful Disabling**: On local machines without internet or during CI testing, leaving `SENTRY_DSN=` blank automatically disables all Sentry operations with zero network overhead.
