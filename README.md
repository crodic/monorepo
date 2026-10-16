# Enterprise Full-Stack Monorepo

[![Turborepo](https://img.shields.io/badge/Turborepo-Orchestrated-blue?logo=turborepo)](https://turbo.build/)
[![Package Manager](https://img.shields.io/badge/pnpm-10.30.3-orange?logo=pnpm)](https://pnpm.io/)
[![Node.js](https://img.shields.io/badge/Node.js-20.19.0-green?logo=node.js)](https://nodejs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11-red?logo=nestjs)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-16_App_Router-black?logo=next.js)](https://nextjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6_React_19-purple?logo=vite)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict_7.0-blue?logo=typescript)](https://www.typescriptlang.org/)

An enterprise-ready, production-grade full-stack monorepo boilerplate built with **Turborepo**, **pnpm workspaces**, **NestJS**, **Next.js (App Router)**, **Vite + React**, and **Tailwind CSS**.

---

## Architecture Overview

```
monorepo/
├── apps/
│   ├── api/                    # NestJS 11 backend with TypeORM, PostgreSQL, Redis, BullMQ, Swagger
│   ├── client/                 # Next.js 16 (App Router) public client website with i18n
│   └── web/                    # Vite 6 + React 19 admin management portal
├── packages/
│   ├── query-builder/          # Shared type-safe query builders (RestQueryBuilder & PaginateQueryBuilder)
│   ├── ui/                     # Shared Radix UI & Tailwind primitive components
│   ├── eslint-config/          # Shared ESLint flat configurations
│   ├── typescript-config/      # Shared tsconfig definitions
│   ├── prettier-config/        # Shared Prettier formatting rules
│   └── commitlint-config/      # Commitlint conventional commit rules
├── docs/                       # Comprehensive technical and architecture documentation
└── scripts/                    # Automation scripts (setup, storage cleanup)
```

### Workspace Applications & Packages

| Workspace                                              | Type        | Technology Stack                                                        | Description                                                                                                 |
| :----------------------------------------------------- | :---------- | :---------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------- |
| **[`apps/api`](apps/api)**                             | Application | NestJS 11, TypeORM, PostgreSQL, Redis, BullMQ, Swagger, Sentry          | Core REST API backend with modular architecture, strict DTO validation, and RBAC authentication.            |
| **[`apps/client`](apps/client)**                       | Application | Next.js 16 (App Router), React 19, Turbopack, TailwindCSS v4, next-intl | Public-facing client web application featuring server components, SEO metadata, and multi-language support. |
| **[`apps/web`](apps/web)**                             | Application | Vite 6, React 19, TailwindCSS v4, TanStack Query, Radix UI, Tiptap      | Admin management portal with rich data tables, sortable lists, theme editor, and file managers.             |
| **[`packages/query-builder`](packages/query-builder)** | Package     | TypeScript, Vitest                                                      | Dual-mode query builder supporting standard RESTful / JSON:API queries and `nestjs-paginate`.               |
| **[`packages/ui`](packages/ui)**                       | Package     | React, Radix UI, Tailwind CSS                                           | Headless UI primitives and shared components across frontends.                                              |

---

## Tech Stack & Standards

- **Backend**: NestJS 11, TypeORM, PostgreSQL 16+, Redis 7+, BullMQ (background queues), Mailpit (local email testing).
- **Frontend**: Next.js 16 (App Router with React Server Components), Vite 6 + React 19 SPA, Tailwind CSS v4.
- **State & Forms**: TanStack React Query (`@tanstack/react-query`), Zustand, React Hook Form, Zod validation.
- **Monitoring & Security**: Sentry error monitoring and performance tracing, JWT authentication with refresh token rotation, strict RBAC authorization.
- **Code Quality**: ESLint 9/10 flat config, Prettier, TypeScript strict mode, Vitest, Jest.
- **Versioning & CI/CD**: Semantic Release, Conventional Commits, GitHub Actions.

---

## Documentation Hub

Detailed documentation is available in the [`docs/`](docs/README.md) directory:

| Guide                                                            | Description                                                                        |
| :--------------------------------------------------------------- | :--------------------------------------------------------------------------------- |
| 📖 [**Documentation Catalog**](docs/README.md)                   | Central documentation directory with English and Vietnamese guides.                |
| 🔐 [**Authentication & RBAC**](docs/AUTH.md)                     | JWT tokens, refresh rotation, Google OAuth, session management, and permissions.   |
| 🔍 [**Query Builder**](docs/QUERY_BUILDER.md)                    | Backend TypeORM query builder and frontend `@repo/query-builder` usage.            |
| 📊 [**Data Table Component**](docs/DATATABLE.md)                 | Reusable TanStack Table with server-side pagination, filters, and selection.       |
| 🔀 [**Sortable Lists**](docs/SORTABLE.md)                        | Accessible drag-and-drop sortable components powered by `@dnd-kit`.                |
| 💾 [**Filesystem & Storage**](docs/filesystem.md)                | Multi-driver storage abstraction (Local disk and AWS S3 / MinIO).                  |
| 📤 [**Background File Uploads**](docs/BACKGROUND_FILE_UPLOAD.md) | Resumable chunked file uploads with BullMQ background processing.                  |
| 📜 [**Activity Log & Audit Trail**](docs/ACTIVITY_LOG.md)        | Automatic and manual activity tracking for security audits.                        |
| 🛠️ [**Core Utilities**](docs/CORE_UTILITIES.md)                  | Custom NestJS decorators, interceptors, validation pipes, and response formatters. |
| 🚨 [**Sentry Error Tracking**](docs/SENTRY.md)                   | Error capture, tracing, and exception handling across backend and frontend.        |
| 🧪 [**Testing Strategy**](docs/TESTING.md)                       | Unit tests, mock providers, and E2E test execution guidelines.                     |
| 🚀 [**Deployment Guide**](docs/DEPLOYMENT.md)                    | Production Docker configurations, environment variables, and database migrations.  |
| 📦 [**Release & Versioning**](docs/RELEASE.md)                   | Automated semantic versioning and changelog generation workflow.                   |

---

## Getting Started

### Prerequisites

- **Node.js**: `20.19.0` (Use [nvm](https://github.com/nvm-sh/nvm): `nvm use`)
- **Package Manager**: **`pnpm`** `10.30.3` (Never use `npm` or `yarn`)
- **Docker & Docker Compose**: For local PostgreSQL, Redis, and Mailpit services.

Enable `pnpm` via corepack:

```bash
corepack enable
corepack prepare pnpm@10.30.3 --activate
```

### Installation & Environment Setup

Run the automated setup script from the repository root:

```bash
pnpm run setup
```

The setup script performs the following tasks:

1. Copies environment templates (`.env.example` -> `.env`) across root, `apps/api`, `apps/web`, and `apps/client`.
2. Installs all monorepo workspace dependencies via `pnpm install`.
3. Validates required tools and node versions.

### Start Local Infrastructure

Start PostgreSQL, Redis, and Mailpit using Docker Compose:

```bash
docker compose up -d
```

Service endpoints:

- **PostgreSQL**: `localhost:5432` (database: `monorepo_dev`)
- **Redis**: `localhost:6379`
- **Mailpit Web UI**: [http://localhost:8025](http://localhost:8025) (SMTP: `localhost:1025`)

### Run Database Migrations

Apply database schema migrations to PostgreSQL:

```bash
pnpm --filter api migration:run
```

To seed initial database data:

```bash
pnpm --filter api seed:run
```

### Start Development Servers

Run all workspaces concurrently via Turborepo:

```bash
pnpm dev
```

Alternatively, start a specific application:

```bash
pnpm --filter api dev      # NestJS backend at http://localhost:3000 (Swagger: /api/docs)
pnpm --filter web dev      # Vite admin portal at http://localhost:5173
pnpm --filter client dev   # Next.js client at http://localhost:3001
```

---

## Common CLI Commands

All development tasks are orchestrated via **Turborepo** (`turbo.json`):

| Command            | Action                                                                   |
| :----------------- | :----------------------------------------------------------------------- |
| `pnpm dev`         | Starts development servers for all applications concurrently             |
| `pnpm build`       | Compiles and builds production bundles for all workspaces                |
| `pnpm lint`        | Runs ESLint across all packages and applications                         |
| `pnpm check-types` | Executes TypeScript static type-checking (`tsc --noEmit`)                |
| `pnpm test`        | Runs unit and integration test suites via Vitest and Jest                |
| `pnpm clean`       | Cleans build artifacts (`dist`, `.turbo`, `.next`) across the repository |

---

## Git Workflow & Conventions

### Conventional Commits

Commit messages must adhere strictly to the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <short description>
```

- **Types**: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `perf`, `chore`, `ci`, `build`.
- **Scope**: Target workspace or component (e.g., `api`, `web`, `client`, `query-builder`, `auth`).
- **Subject length**: Maximum 100 characters enforced by Commitlint.

Example:

```bash
git commit -m "feat(query-builder): add rest-query-builder implementation"
```

### Release Automation

Releases and automated semantic version tags are generated by **Semantic Release** on GitHub Actions. Refer to [`docs/RELEASE.md`](docs/RELEASE.md) for full release guidelines.

---

## License

This project is proprietary and confidential. All rights reserved.
