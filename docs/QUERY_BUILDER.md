# Spatie-style QueryBuilder for NestJS & TypeORM

> **English** | [Tiếng Việt](QUERY_BUILDER.vi.md)

A fluent, secure, whitelist-based query builder for NestJS and TypeORM inspired by Laravel's [`spatie/laravel-query-builder`](https://github.com/spatie/laravel-query-builder).

It enables frontends to filter, sort, include relations, select sparse fieldsets, and paginate database entities using clean, standardized URL query strings.

---

## Table of Contents

- [Features](#features)
- [Architecture & Directory Structure](#architecture--directory-structure)
- [Quick Start](#quick-start)
- [Filtering (`allowedFilters`)](#filtering-allowedfilters)
  - [Exact Matches & IN Queries](#exact-matches--in-queries)
  - [Partial Matches (ILIKE)](#partial-matches-ilike)
  - [Prefix and Suffix Matches (`startsWith`, `endsWith`)](#prefix-and-suffix-matches-startswith-endswith)
  - [Comparison Operators](#comparison-operators)
  - [Relation Filtering (Dot Notation)](#relation-filtering-dot-notation)
  - [Soft Deletes (`trashed`)](#soft-deletes-trashed)
  - [Custom Scope Functions](#custom-scope-functions)
- [Sorting (`allowedSorts`)](#sorting-allowedsorts)
  - [Field Sorting & Direction](#field-sorting--direction)
  - [Relation Sorting](#relation-sorting)
  - [Custom Sort Callbacks](#custom-sort-callbacks)
  - [Default Sort](#default-sort)
- [Including Relations (`allowedIncludes`)](#including-relations-allowedincludes)
  - [Direct Relations](#direct-relations)
  - [Nested Relations](#nested-relations)
  - [Relation Counts](#relation-counts)
  - [Custom Include Callbacks](#custom-include-callbacks)
- [Sparse Fieldsets (`allowedFields`)](#sparse-fieldsets-allowedfields)
- [Pagination](#pagination)
- [Configuration & Custom Parameters](#configuration--custom-parameters)
- [Strict Mode & Exception Handling](#strict-mode--exception-handling)
- [Security Best Practices](#security-best-practices)

---

## Features

- **Whitelist Enforcement**: Only explicitly declared filters, sorts, includes, and fields are applied to queries.
- **Fluent API**: Chain methods intuitively (`.allowedFilters(...).allowedSorts(...).paginate()`).
- **Flexible URL Parsing**: Standard query string format compatible with browser `URLSearchParams` and `qs`.
- **Sparse Fieldsets**: Select only the columns needed by the frontend (reduces SQL load and payload size).
- **Nested Relations**: Deep includes (`posts.comments`) and relation filters (`roles.name`).
- **Soft Deletes**: Native integration with TypeORM's `@DeleteDateColumn()` (`with`, `only`, `without`).
- **Global & Per-Query Configuration**: Customize query parameter names (`per_page` vs `limit`, `filters` vs `filter`).
- **Strict Mode**: Optionally throw descriptive `400 Bad Request` exceptions when frontend sends invalid parameters.

---

## Architecture & Directory Structure

All components are located in [`apps/api/src/common/query-builder/`](file:///home/hongphat/Documents/Personal/monorepo/apps/api/src/common/query-builder/):

```
apps/api/src/common/query-builder/
├── allowed-filter.ts       # Filter definitions (exact, partial, prefix, operator, scope, trashed)
├── allowed-sort.ts         # Sort definitions (field, custom callback)
├── allowed-include.ts      # Relation inclusion and relation counts
├── config.ts               # Global and per-query configuration
├── exceptions.ts           # InvalidQueryException hierarchy for strict mode
├── query-builder.ts        # Main QueryBuilder orchestrator
├── types.ts                # TypeScript interfaces and callback types
├── index.ts                # Barrel export
└── query-builder.spec.ts   # Comprehensive unit test suite
```

---

## Quick Start

### 1. In your Controller

```typescript
import { Controller, Get, Query } from "@nestjs/common";
import { QueryParams } from "../common/query-builder";
import { UserService } from "./user.service";

@Controller("users")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async index(@Query() query: QueryParams) {
    return this.userService.findAll(query);
  }
}
```

### 2. In your Service

```typescript
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  QueryBuilder,
  AllowedFilter,
  AllowedSort,
  AllowedInclude,
  QueryParams,
} from "../common/query-builder";
import { UserEntity } from "./entities/user.entity";

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async findAll(query: QueryParams) {
    return QueryBuilder.for(this.userRepository, query)
      .allowedFilters([
        "name", // partial match (ILIKE %val%)
        AllowedFilter.exact("status"), // exact match (= or IN)
        AllowedFilter.startsWith("code"), // prefix match (val%)
        AllowedFilter.operator("minAge", ">=", "age"), // comparison (age >= val)
        AllowedFilter.trashed(), // soft deletes (with/only/without)
        AllowedFilter.scope("search", (qb, val, a) => {
          qb.andWhere(`(${a}.name ILIKE :s OR ${a}.email ILIKE :s)`, {
            s: `%${val}%`,
          });
        }),
      ])
      .allowedSorts([
        "createdAt",
        "name",
        AllowedSort.field("role", "roles.name"),
      ])
      .defaultSort("-createdAt")
      .allowedIncludes([
        "roles",
        "profile",
        "posts.comments",
        AllowedInclude.count("comments"),
      ])
      .allowedFields(["id", "name", "email", "roles.id", "roles.name"])
      .paginate();
  }
}
```

---

## Filtering (`allowedFilters`)

### Exact Matches & IN Queries

```typescript
AllowedFilter.exact("status");
AllowedFilter.exact("roleId");
AllowedFilter.exact("role", "roleId"); // custom column mapping
```

- **Single value**: `GET /users?filter[status]=active` ➔ `WHERE status = 'active'`
- **Array values**: `GET /users?filter[status][]=active&filter[status][]=pending` ➔ `WHERE status IN ('active', 'pending')`

### Partial Matches (ILIKE)

Passing a string to `.allowedFilters()` defaults to a partial match:

```typescript
.allowedFilters(['name', AllowedFilter.partial('title')])
```

- **Single value**: `GET /users?filter[name]=john` ➔ `WHERE name ILIKE '%john%'`
- **Array values**: `GET /users?filter[name][]=john&filter[name][]=jane` ➔ `WHERE (name ILIKE '%john%' OR name ILIKE '%jane%')`

### Prefix and Suffix Matches (`startsWith`, `endsWith`)

```typescript
AllowedFilter.startsWith("invoiceNumber", "code"); // GET ?filter[invoiceNumber]=INV ➔ code ILIKE 'INV%'
AllowedFilter.endsWith("domain", "email"); // GET ?filter[domain]=.com ➔ email ILIKE '%.com'
```

### Comparison Operators

Supports `=`, `!=`, `<>`, `>`, `>=`, `<`, `<=`:

```typescript
AllowedFilter.operator("minPrice", ">=", "price");
AllowedFilter.operator("maxPrice", "<=", "price");
```

- `GET /products?filter[minPrice]=100&filter[maxPrice]=500` ➔ `WHERE price >= 100 AND price <= 500`

### Relation Filtering (Dot Notation)

```typescript
AllowedFilter.exact("roleName", "roles.name");
```

- `GET /users?filter[roleName]=admin` ➔ `WHERE roles.name = 'admin'`

### Soft Deletes (`trashed`)

Requires entities using TypeORM `@DeleteDateColumn()`:

```typescript
AllowedFilter.trashed(); // defaults to 'trashed' query param and 'deletedAt' column
```

- `GET /users?filter[trashed]=with` ➔ includes soft-deleted records (`withDeleted()`)
- `GET /users?filter[trashed]=only` ➔ only soft-deleted records (`withDeleted()` AND `deletedAt IS NOT NULL`)
- `GET /users?filter[trashed]=without` ➔ excludes soft-deleted records (default)

### Custom Scope Functions

```typescript
AllowedFilter.scope("search", (qb, value, alias) => {
  qb.andWhere(`(${alias}.name ILIKE :s OR ${alias}.email ILIKE :s)`, {
    s: `%${value}%`,
  });
});
```

---

## Sorting (`allowedSorts`)

### Field Sorting & Direction

```typescript
.allowedSorts(['name', 'createdAt'])
```

- **Ascending**: `GET /users?sort=name` ➔ `ORDER BY user.name ASC`
- **Descending**: `GET /users?sort=-createdAt` ➔ `ORDER BY user.createdAt DESC`
- **Multiple columns**: `GET /users?sort=-createdAt,name` ➔ `ORDER BY user.createdAt DESC, user.name ASC`

### Relation Sorting

```typescript
AllowedSort.field("role", "roles.name");
```

- `GET /users?sort=-role` ➔ `ORDER BY roles.name DESC`

### Custom Sort Callbacks

```typescript
AllowedSort.callback("popularity", (qb, direction, alias) => {
  qb.addOrderBy(`${alias}.viewCount + ${alias}.likeCount`, direction);
});
```

### Default Sort

Applied when no sort query parameter is passed by the client:

```typescript
.defaultSort('-createdAt,name')
```

---

## Including Relations (`allowedIncludes`)

### Direct Relations

```typescript
.allowedIncludes(['roles', 'profile'])
```

- `GET /users?include=roles,profile` ➔ executes `leftJoinAndSelect` for `user.roles` and `user.profile`.

### Nested Relations

```typescript
.allowedIncludes(['posts.comments'])
```

- `GET /users?include=posts.comments` ➔ automatically joins `user.posts` followed by `posts.comments`.

### Relation Counts

```typescript
AllowedInclude.count("comments");
```

- `GET /users?include=comments` ➔ loads relation count into `entity.commentsCount` via `loadRelationCountAndMap`.

### Custom Include Callbacks

```typescript
AllowedInclude.callback("activeRoles", (qb, alias) => {
  qb.leftJoinAndSelect(`${alias}.roles`, "role", "role.isActive = true");
});
```

---

## Sparse Fieldsets (`allowedFields`)

Restrict returned columns to optimize database I/O and payload size:

```typescript
.allowedFields(['id', 'name', 'email', 'roles.id', 'roles.title'])
```

Supported formats:

1. **Flat format**: `GET /users?fields=id,name,email`
2. **JSON:API Scoped format**: `GET /users?fields[user]=id,name&fields[roles]=id,title`

---

## Pagination

Offset pagination integrates directly with standard DTOs:

```typescript
const result = await QueryBuilder.for(this.userRepo, query)
  .allowedSorts(["createdAt"])
  .setLimit(20, 100) // (defaultLimit, maxLimit)
  .paginate();
```

Response structure:

```json
{
  "data": [...],
  "pagination": {
    "totalRecords": 105,
    "currentPage": 1,
    "totalPages": 6,
    "nextPage": 2,
    "prevPage": null
  }
}
```

---

## Configuration & Custom Parameters

Configure parameter names globally in `main.ts`:

```typescript
import { QueryBuilder } from "./common/query-builder";

QueryBuilder.configure({
  parameters: {
    filter: "filters", // e.g. ?filters[name]=john
    sort: "order", // e.g. ?order=-createdAt
    limit: "per_page", // e.g. ?per_page=25
    page: "page",
    include: "with", // e.g. ?with=roles
    fields: "fields",
  },
  countSuffix: "Count", // or '_count' for snake_case
  defaultLimit: 20,
  maxLimit: 100,
  strictMode: false,
});
```

---

## Strict Mode & Exception Handling

By default (`strictMode: false`), unallowed query parameters are **silently ignored** for safety.

Enabling strict mode throws explicit HTTP `400 Bad Request` exceptions:

```typescript
// Globally:
QueryBuilder.configure({ strictMode: true });

// Or per-query:
QueryBuilder.for(this.userRepo, query)
  .allowedFilters(["name", "status"])
  .strict(true)
  .paginate();
```

When client passes invalid parameters:

- `GET /users?filter[unknownCol]=1` ➔ `400 Bad Request`:
  ```json
  {
    "statusCode": 400,
    "message": "Requested filter(s) ['unknownCol'] are not allowed. Allowed filter(s) are: ['name', 'status']."
  }
  ```

---

## Security Best Practices

1. **Never use raw strings from queries in SQL**: Parameter values are always parameterized (`:paramName`).
2. **Whitelist everything**: Never allow arbitrary client-defined columns without `allowedFilters`, `allowedSorts`, `allowedIncludes`, or `allowedFields`.
3. **Cap pagination limits**: Always enforce `maxLimit` (default: 100) to protect against DoS attacks via huge `?limit=999999` requests.
