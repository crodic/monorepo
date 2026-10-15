# Core Utilities & Entity Infrastructure

This document details the core utility functions, request processing pipes, and database entity infrastructure provided by `apps/api`.

---

## Table of Contents

1. [Password Utilities (Argon2)](#1-password-utilities-argon2)
2. [Query & String Helpers](#2-query--string-helpers)
   - [ParseQueryPipe (`qs`)](#parsequerypipe-qs)
   - [String Normalization (`normalize.util.ts`)](#string-normalization-normalizeutilts)
   - [HTML Sanitization (`stripHtmlTags`)](#html-sanitization-striphtmltags)
   - [App Version Resolution (`app-version.util.ts`)](#app-version-resolution-app-versionutilts)
3. [Database Entity Infrastructure](#3-database-entity-infrastructure)
   - [AbstractEntity](#abstractentity)
   - [Column Ordering with `@Order(index)`](#column-ordering-with-orderindex)
   - [Data Transfer Object Conversion (`toDto`)](#data-transfer-object-conversion-todto)

---

## 1. Password Utilities (Argon2)

File: `apps/api/src/utils/password.util.ts`  
Spec: `apps/api/src/utils/password.util.spec.ts`

The application utilizes **Argon2** (via the `argon2` npm package), the winner of the Password Hashing Competition (PHC), for secure password hashing and verification.

### Functions

#### `hashPassword(password: string): Promise<string>`

Hashes a plain-text password using Argon2id with automatic salt generation.

```typescript
import { hashPassword } from "../utils/password.util";

const hashedPassword = await hashPassword("mySecurePassword123");
```

- **Error Handling**: Catches internal errors, logs them via NestJS `Logger('PasswordUtil')`, and throws an explicit `Error('Can not hash password.', { cause: err })`.

#### `verifyPassword(password: string, hashedPassword: string): Promise<boolean>`

Verifies a plain-text password against an Argon2 hash.

```typescript
import { verifyPassword } from "../utils/password.util";

const isValid = await verifyPassword("mySecurePassword123", user.password);
if (!isValid) {
  throw new UnauthorizedException("Invalid credentials");
}
```

- **Error Handling**: Returns `false` gracefully if verification fails or an exception occurs, preventing stack trace leaks.

---

## 2. Query & String Helpers

### ParseQueryPipe (`qs`)

File: `apps/api/src/pipes/parse-query.pipe.ts`  
Spec: `apps/api/src/pipes/parse-query.pipe.spec.ts`

A NestJS `PipeTransform` that parses complex, nested URL query strings into deeply nested objects using `qs`.

```typescript
@Get()
async findAll(
  @Query(new ParseQueryPipe()) query: Record<string, any>,
) {
  // Parses "?filter[name]=john&filter[status]=active"
  // into { filter: { name: 'john', status: 'active' } }
}
```

- **Dual Mode**:
  - Raw query string input: `qs.parse(value)`
  - Partially parsed shallow object (Express default query parser): `qs.parse(qs.stringify(value))` parses bracket keys into structured objects.
  - Non-query parameters: Passed through unchanged.

### String Normalization (`normalize.util.ts`)

File: `apps/api/src/utils/normalize.util.ts`  
Spec: `apps/api/src/utils/normalize.util.spec.ts`

#### `normalizeUserAgent(userAgent?: string | string[]): string | undefined`

Normalizes incoming `User-Agent` headers. When reverse proxies or load balancers send multiple headers as an array, this combines them with `, `.

#### `normalizeEmail(email: string): string`

Normalizes email addresses before database queries or account lookups by trimming leading/trailing whitespace and converting all characters to lowercase.

```typescript
import { normalizeEmail } from "../utils/normalize.util";

const cleanEmail = normalizeEmail("  User@Example.COM  "); // "user@example.com"
```

### HTML Sanitization (`stripHtmlTags`)

File: `apps/api/src/utils/helpers.ts`  
Spec: `apps/api/src/utils/helpers.spec.ts`

Removes HTML tags from strings to sanitize user inputs before rendering or processing.

```typescript
import { stripHtmlTags } from "../utils/helpers";

const plainText = stripHtmlTags("<p>Hello <b>World</b></p>"); // "Hello World"
```

### App Version Resolution (`app-version.util.ts`)

File: `apps/api/src/utils/app-version.util.ts`  
Spec: `apps/api/src/utils/app-version.util.spec.ts`

Dynamically resolves the application's semantic version from `package.json` across workspace environments (monorepo root, app root, compiled `dist`).

- Caches the result in-memory after first resolution.
- Used in Swagger documentation (`setupSwagger`) and health check endpoints.

---

## 3. Database Entity Infrastructure

### AbstractEntity

File: `apps/api/src/database/entities/abstract.entity.ts`  
Spec: `apps/api/src/database/entities/abstract.entity.spec.ts`

The base entity class that all TypeORM domain entities extend. Inherits from TypeORM's `BaseEntity` (ActiveRecord support) and provides:

- `createdAt`: `timestamptz` column defaulting to `CURRENT_TIMESTAMP`.
- `updatedAt`: `timestamptz` column updated automatically on entity modifications.
- `toDto(dtoClass, options)`: Transforms entity instances to API response DTOs using `class-transformer` (`plainToInstance`).

```typescript
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { AbstractEntity } from "../database/entities/abstract.entity";
import { Order } from "../database/decorators/order.decorator";

@Entity("users")
export class UserEntity extends AbstractEntity {
  @Order(1)
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Order(2)
  @Column({ type: "varchar", length: 255 })
  email: string;
}
```

### Column Ordering with `@Order(index)`

File: `apps/api/src/database/decorators/order.decorator.ts`  
Spec: `apps/api/src/database/decorators/order.decorator.spec.ts`

#### The Problem

In standard TypeScript inheritance, properties declared on a base class (`AbstractEntity`) are registered before properties declared on child classes. Consequently, TypeORM generates tables with `created_at` and `updated_at` near the start of the table schema rather than at the end.

#### The Solution

1. Use `@Order(index)` on child entity properties (e.g. `@Order(1)` for `id`, `@Order(2)` for primary fields).
2. Base class timestamps are tagged with `@Order(9999)`.
3. In `AbstractEntity.useDataSource(dataSource)`, the entity's `meta.columns` array is sorted ascending by their assigned order:

```typescript
static useDataSource(dataSource: DataSource): void {
  BaseEntity.useDataSource.call(this, dataSource);
  const meta = dataSource.entityMetadatasMap.get(this);
  if (meta != null) {
    meta.columns = [...meta.columns].sort((x, y) => {
      const orderX = getOrder((x.target as any)?.prototype, x.propertyName);
      const orderY = getOrder((y.target as any)?.prototype, y.propertyName);
      return orderX - orderY;
    });
  }
}
```

This guarantees that audit timestamps consistently sit at the end of PostgreSQL table definitions and SQL projection lists.

### Data Transfer Object Conversion (`toDto`)

Transforms database entities into clean, client-facing DTOs adhering to `@Exclude()` and `@Expose()` rules:

```typescript
const user = await UserEntity.findOneBy({ id });
return user.toDto(UserResponseDto);
```
