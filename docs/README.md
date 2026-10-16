# Monorepo Documentation Hub

> **English** | [Tiếng Việt](README.vi.md)

Welcome to the central documentation index for this monorepo. This directory contains detailed architectural, operational, and development guides for all applications and shared packages.

---

## Documentation Catalog

| Document                                                 | Description                                                                                                                                    | Languages                                                                         |
| :------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------- |
| [**Architecture & Overview**](../README.md)              | High-level monorepo architecture, application roles, package structure, and quickstart.                                                        | [English](../README.md)                                                           |
| [**Authentication & RBAC**](AUTH.md)                     | JWT authentication, refresh token rotation, Google OAuth, sessions, roles, and granular permissions.                                           | [English](AUTH.md) · [Tiếng Việt](AUTH.vi.md)                                     |
| [**Query Builder**](QUERY_BUILDER.md)                    | Fluent whitelist-based query builder for NestJS/TypeORM and frontend `@repo/query-builder` (`RestQueryBuilder`, `NestjsPaginateQueryBuilder`). | [English](QUERY_BUILDER.md) · [Tiếng Việt](QUERY_BUILDER.vi.md)                   |
| [**Data Table Component**](DATATABLE.md)                 | Reusable TanStack Table component for `apps/web` with sorting, filtering, selection, and server-side pagination.                               | [English](DATATABLE.md) · [Tiếng Việt](DATATABLE.vi.md)                           |
| [**Sortable & Drag-and-Drop**](SORTABLE.md)              | Accessible drag-and-drop sortable lists, table rows, and nested trees using `@dnd-kit`.                                                        | [English](SORTABLE.md) · [Tiếng Việt](SORTABLE.vi.md)                             |
| [**Filesystem & Storage**](filesystem.md)                | Multi-driver storage abstraction layer supporting local disk and AWS S3 / MinIO storage.                                                       | [English](filesystem.md) · [Tiếng Việt](filesystem.vi.md)                         |
| [**Background File Uploads**](BACKGROUND_FILE_UPLOAD.md) | Chunked and resumable file uploads processed asynchronously with BullMQ worker queues.                                                         | [English](BACKGROUND_FILE_UPLOAD.md) · [Tiếng Việt](BACKGROUND_FILE_UPLOAD.vi.md) |
| [**Activity Log & Audit Trail**](ACTIVITY_LOG.md)        | Automatic and manual user activity logging, change tracking, and audit trails.                                                                 | [English](ACTIVITY_LOG.md) · [Tiếng Việt](ACTIVITY_LOG.vi.md)                     |
| [**Core Utilities**](CORE_UTILITIES.md)                  | Common NestJS decorators, interceptors, validation pipes, standardized API responses, and exception filters.                                   | [English](CORE_UTILITIES.md) · [Tiếng Việt](CORE_UTILITIES.vi.md)                 |
| [**Sentry Monitoring**](SENTRY.md)                       | Error tracking, distributed tracing, and exception capturing across backend and frontend.                                                      | [English](SENTRY.md) · [Tiếng Việt](SENTRY.vi.md)                                 |
| [**Testing Strategy**](TESTING.md)                       | Unit tests, service mocks, controller tests, and E2E testing workflows using Vitest and Jest.                                                  | [English](TESTING.md) · [Tiếng Việt](TESTING.vi.md)                               |
| [**Deployment Guide**](DEPLOYMENT.md)                    | Production Docker configurations, environment variables, PostgreSQL migrations, and service provisioning.                                      | [English](DEPLOYMENT.md) · [Tiếng Việt](DEPLOYMENT.vi.md)                         |
| [**Release & Versioning**](RELEASE.md)                   | Automated semantic versioning, changelog generation, and GitHub Releases via Semantic Release.                                                 | [English](RELEASE.md) · [Tiếng Việt](RELEASE.vi.md)                               |

---

## Workspace Navigation

- **[`apps/api`](../apps/api)**: NestJS 11 backend with PostgreSQL (TypeORM), Redis, Mailpit, BullMQ, and Swagger.
- **[`apps/web`](../apps/web)**: Vite 6 + React 19 admin management portal.
- **[`apps/client`](../apps/client)**: Next.js 16 App Router customer-facing application with i18n.
- **[`packages/query-builder`](../packages/query-builder)**: Shared type-safe query builder library.
