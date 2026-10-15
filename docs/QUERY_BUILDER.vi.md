# Spatie-style QueryBuilder cho NestJS & TypeORM

> [English](QUERY_BUILDER.md) | **Tiếng Việt**

Bộ QueryBuilder dạng Fluent API theo cơ chế whitelist an toàn cho NestJS và TypeORM, lấy cảm hứng thiết kế từ package [`spatie/laravel-query-builder`](https://github.com/spatie/laravel-query-builder) nổi tiếng của Laravel.

Package này cho phép ứng dụng frontend lọc dữ liệu (filter), sắp xếp (sort), nạp quan hệ (include), chỉ định các trường cần lấy (sparse fieldsets), và phân trang (pagination) thông qua định dạng URL query string chuẩn hóa, rõ ràng và an toàn tuyệt đối.

---

## Mục lục

- [Tính năng chính](#tính-năng-chính)
- [Cấu trúc thư mục & Kiến trúc](#cấu-trúc-thư-mục--kiến-trúc)
- [Bắt đầu nhanh (Quick Start)](#bắt-đầu-nhanh-quick-start)
- [Bộ lọc (`allowedFilters`)](#bộ-lọc-allowedfilters)
  - [Khớp chính xác & Mảng IN (`exact`)](#khớp-chính-xác--mảng-in-exact)
  - [Khớp một phần (`partial` / ILIKE)](#khớp-một-phần-partial--ilike)
  - [Khớp tiền tố và hậu tố (`startsWith`, `endsWith`)](#khớp-tiền-tố-và-hậu-tố-startswith-endswith)
  - [Toán tử so sánh (`operator`)](#toán-tử-so-sánh-operator)
  - [Lọc trên quan hệ (`roles.name`)](#lọc-trên-quan-hệ-rolesname)
  - [Xóa mềm (`trashed`)](#xóa-mềm-trashed)
  - [Custom Scope Callback](#custom-scope-callback)
- [Sắp xếp (`allowedSorts`)](#sắp-xếp-allowedsorts)
  - [Sắp xếp theo cột & Hướng](#sắp-xếp-theo-cột--hướng)
  - [Sắp xếp theo quan hệ](#sắp-xếp-theo-quan-hệ)
  - [Custom Sort Callback](#custom-sort-callback)
  - [Sắp xếp mặc định (`defaultSort`)](#sắp-xếp-mặc-định-defaultsort)
- [Nạp quan hệ (`allowedIncludes`)](#nạp-quan-hệ-allowedincludes)
  - [Quan hệ trực tiếp](#quan-hệ-trực-tiếp)
  - [Quan hệ lồng nhau (`posts.comments`)](#quan-hệ-lồng-nhau-postscomments)
  - [Đếm số lượng quan hệ (`count`)](#đếm-số-lượng-quan-hệ-count)
  - [Custom Include Callback](#custom-include-callback)
- [Chỉ định trường cần lấy (`allowedFields`)](#chỉ-định-trường-cần-lấy-allowedfields)
- [Phân trang (`paginate`)](#phân-trang-paginate)
- [Cấu hình toàn cục & Tùy biến tham số URL](#cấu-hình-toàn-cục--tùy-biến-tham-số-url)
- [Chế độ nghiêm ngặt & Xử lý lỗi (`Strict Mode`)](#chế-độ-nghiêm-ngặt--xử-lý-lỗi-strict-mode)
- [Bảo mật](#bảo-mật)

---

## Tính năng chính

- **Cơ chế Whitelist tuyệt đối**: Chỉ những filter, sort, include, field được khai báo rõ ràng trong code mới được áp dụng vào SQL.
- **Fluent API**: Gọi nối chuỗi các hàm trực quan (`.allowedFilters(...).allowedSorts(...).paginate()`).
- **Sparse Fieldsets (JSON:API)**: Chọn lọc các cột cần trả về giúp giảm tải I/O database và tối ưu hóa băng thông.
- **Quan hệ lồng nhau (Nested Relations)**: Hỗ trợ nạp quan hệ đa cấp (`posts.comments`) và lọc theo quan hệ (`roles.name`).
- **Hỗ trợ Xóa mềm (Soft Delete)**: Tương thích hoàn toàn với `@DeleteDateColumn()` (`with`, `only`, `without`).
- **Tùy biến tham số (Configuration)**: Cho phép đổi tên tham số query trên URL (ví dụ: dùng `per_page` thay vì `limit`, `filters` thay vì `filter`).
- **Strict Mode**: Hỗ trợ ném lỗi `400 Bad Request` chi tiết khi frontend gửi tham số không hợp lệ, giúp debug dễ dàng.

---

## Cấu trúc thư mục & Kiến trúc

Toàn bộ mã nguồn nằm tại [`apps/api/src/common/query-builder/`](file:///home/hongphat/Documents/Personal/monorepo/apps/api/src/common/query-builder/):

```
apps/api/src/common/query-builder/
├── allowed-filter.ts       # Định nghĩa các loại filter (exact, partial, startsWith, operator, scope, trashed)
├── allowed-sort.ts         # Định nghĩa các loại sắp xếp (field, custom callback)
├── allowed-include.ts      # Định nghĩa nạp quan hệ và đếm quan hệ (relation count)
├── config.ts               # Quản lý cấu hình toàn cục và cục bộ
├── exceptions.ts           # Hệ thống Exception cho strict mode (InvalidFilterQueryException,...)
├── query-builder.ts        # Lớp QueryBuilder điều phối chính
├── types.ts                # Định nghĩa interface và kiểu dữ liệu TypeScript
├── index.ts                # Barrel export
└── query-builder.spec.ts   # 39 Unit tests độc lập bao phủ toàn bộ tính năng
```

---

## Bắt đầu nhanh (Quick Start)

### 1. Tại Controller

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

### 2. Tại Service

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
        AllowedFilter.exact("status"), // exact match (= hoặc IN)
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

## Bộ lọc (`allowedFilters`)

### Khớp chính xác & Mảng IN (`exact`)

```typescript
AllowedFilter.exact("status");
AllowedFilter.exact("roleId");
AllowedFilter.exact("role", "roleId"); // ánh xạ tên param role sang cột roleId
```

- **Giá trị đơn**: `GET /users?filter[status]=active` ➔ `WHERE status = 'active'`
- **Mảng giá trị**: `GET /users?filter[status][]=active&filter[status][]=pending` ➔ `WHERE status IN ('active', 'pending')`

### Khớp một phần (`partial` / ILIKE)

Khi truyền dạng chuỗi `'name'`, mặc định sẽ là `partial`:

```typescript
.allowedFilters(['name', AllowedFilter.partial('title')])
```

- **Giá trị đơn**: `GET /users?filter[name]=john` ➔ `WHERE name ILIKE '%john%'`
- **Mảng giá trị**: `GET /users?filter[name][]=john&filter[name][]=jane` ➔ `WHERE (name ILIKE '%john%' OR name ILIKE '%jane%')`

### Khớp tiền tố và hậu tố (`startsWith`, `endsWith`)

```typescript
AllowedFilter.startsWith("invoiceNumber", "code"); // ?filter[invoiceNumber]=INV ➔ code ILIKE 'INV%'
AllowedFilter.endsWith("domain", "email"); // ?filter[domain]=.com ➔ email ILIKE '%.com'
```

### Toán tử so sánh (`operator`)

Hỗ trợ các toán tử `=`, `!=`, `<>`, `>`, `>=`, `<`, `<=`:

```typescript
AllowedFilter.operator("minPrice", ">=", "price");
AllowedFilter.operator("maxPrice", "<=", "price");
```

- `GET /products?filter[minPrice]=100&filter[maxPrice]=500` ➔ `WHERE price >= 100 AND price <= 500`

### Lọc trên quan hệ (`roles.name`)

```typescript
AllowedFilter.exact("roleName", "roles.name");
```

- `GET /users?filter[roleName]=admin` ➔ `WHERE roles.name = 'admin'`

### Xóa mềm (`trashed`)

Dành cho các entity có sử dụng `@DeleteDateColumn()` của TypeORM:

```typescript
AllowedFilter.trashed(); // mặc định tên param 'trashed' và cột 'deletedAt'
```

- `GET /users?filter[trashed]=with` ➔ bao gồm cả bản ghi đã xóa tạm (`withDeleted()`)
- `GET /users?filter[trashed]=only` ➔ chỉ lấy bản ghi đã xóa tạm (`withDeleted()` và `deletedAt IS NOT NULL`)
- `GET /users?filter[trashed]=without` ➔ loại trừ các bản ghi đã xóa (mặc định)

### Custom Scope Callback

```typescript
AllowedFilter.scope("search", (qb, value, alias) => {
  qb.andWhere(`(${alias}.name ILIKE :s OR ${alias}.email ILIKE :s)`, {
    s: `%${value}%`,
  });
});
```

---

## Sắp xếp (`allowedSorts`)

### Sắp xếp theo cột & Hướng

```typescript
.allowedSorts(['name', 'createdAt'])
```

- **Tăng dần (ASC)**: `GET /users?sort=name` ➔ `ORDER BY user.name ASC`
- **Giảm dần (DESC với dấu `-`)**: `GET /users?sort=-createdAt` ➔ `ORDER BY user.createdAt DESC`
- **Nhiều cột phân tách bằng dấu phẩy**: `GET /users?sort=-createdAt,name` ➔ `ORDER BY user.createdAt DESC, user.name ASC`

### Sắp xếp theo quan hệ

```typescript
AllowedSort.field("role", "roles.name");
```

- `GET /users?sort=-role` ➔ `ORDER BY roles.name DESC`

### Custom Sort Callback

```typescript
AllowedSort.callback("popularity", (qb, direction, alias) => {
  qb.addOrderBy(`${alias}.viewCount + ${alias}.likeCount`, direction);
});
```

### Sắp xếp mặc định (`defaultSort`)

Được áp dụng khi client không truyền tham số `sort` trên URL:

```typescript
.defaultSort('-createdAt,name')
```

---

## Nạp quan hệ (`allowedIncludes`)

### Quan hệ trực tiếp

```typescript
.allowedIncludes(['roles', 'profile'])
```

- `GET /users?include=roles,profile` ➔ tự động thực hiện `leftJoinAndSelect` cho `user.roles` và `user.profile`.

### Quan hệ lồng nhau (`posts.comments`)

```typescript
.allowedIncludes(['posts.comments'])
```

- `GET /users?include=posts.comments` ➔ tự động join tầng 1 (`user.posts`) sau đó join tầng 2 (`posts.comments`).

### Đếm số lượng quan hệ (`count`)

```typescript
AllowedInclude.count("comments");
```

- `GET /users?include=comments` ➔ nạp số lượng bản ghi quan hệ vào thuộc tính `entity.commentsCount` qua `loadRelationCountAndMap`.

### Custom Include Callback

```typescript
AllowedInclude.callback("activeRoles", (qb, alias) => {
  qb.leftJoinAndSelect(`${alias}.roles`, "role", "role.isActive = true");
});
```

---

## Chỉ định trường cần lấy (`allowedFields`)

Giới hạn danh sách các cột cần truy vấn để tối ưu hiệu năng:

```typescript
.allowedFields(['id', 'name', 'email', 'roles.id', 'roles.title'])
```

Hỗ trợ 2 định dạng:

1. **Dạng phẳng**: `GET /users?fields=id,name,email`
2. **Dạng chuẩn JSON:API**: `GET /users?fields[user]=id,name&fields[roles]=id,title`

---

## Phân trang (`paginate`)

Tích hợp trực tiếp với DTO phân trang chuẩn `OffsetPaginatedDto`:

```typescript
const result = await QueryBuilder.for(this.userRepo, query)
  .allowedSorts(["createdAt"])
  .setLimit(20, 100) // (defaultLimit, maxLimit)
  .paginate();
```

Cấu trúc JSON trả về:

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

## Cấu hình toàn cục & Tùy biến tham số URL

Bạn có thể cấu hình tên tham số toàn cục trong file `main.ts`:

```typescript
import { QueryBuilder } from "./common/query-builder";

QueryBuilder.configure({
  parameters: {
    filter: "filters", // ví dụ: ?filters[name]=john
    sort: "order", // ví dụ: ?order=-createdAt
    limit: "per_page", // ví dụ: ?per_page=25
    page: "page",
    include: "with", // ví dụ: ?with=roles
    fields: "fields",
  },
  countSuffix: "Count", // hoặc '_count' cho snake_case
  defaultLimit: 20,
  maxLimit: 100,
  strictMode: false,
});
```

---

## Chế độ nghiêm ngặt & Xử lý lỗi (`Strict Mode`)

Mặc định (`strictMode: false`), hệ thống sẽ **âm thầm bỏ qua** các tham số không nằm trong whitelist để bảo đảm an toàn.

Nếu bật chế độ nghiêm ngặt, hệ thống sẽ ném ngoại lệ `400 Bad Request` rõ ràng:

```typescript
// Cấu hình toàn cục:
QueryBuilder.configure({ strictMode: true });

// Hoặc cấu hình riêng cho từng query:
QueryBuilder.for(this.userRepo, query)
  .allowedFilters(["name", "status"])
  .strict(true)
  .paginate();
```

Khi client truyền tham số không hợp lệ:

- `GET /users?filter[unknownCol]=1` ➔ Lỗi HTTP 400:
  ```json
  {
    "statusCode": 400,
    "message": "Requested filter(s) ['unknownCol'] are not allowed. Allowed filter(s) are: ['name', 'status']."
  }
  ```

---

## Bảo mật

1. **Tuyệt đối không dùng chuỗi SQL raw**: Tất cả các giá trị filter đều được truyền qua TypeORM parameter binding (`:paramName`) để chống SQL Injection.
2. **Whitelist bắt buộc**: Client không thể tự ý chèn bất kỳ cột nào ngoài danh sách khai báo tại `allowedFilters`, `allowedSorts`, `allowedIncludes`, `allowedFields`.
3. **Giới hạn kích thước trang (`maxLimit`)**: Luôn chặn đứng các request lạm dụng (ví dụ `?limit=999999`) bằng `maxLimit` (mặc định 100) để chống DoS.
