# Hạ Tầng Entity & Tiện Ích Cốt Lõi (Core Utilities & Entity Infrastructure)

> [English](../en/CORE_UTILITIES.md) | **Tiếng Việt**

Tài liệu này mô tả chi tiết các tiện ích cốt lõi (utilities), Pipe xử lý query parameters, và hạ tầng database entity được xây dựng trong `apps/api`.

---

## Mục lục

1. [Tiện ích Mật khẩu (Argon2)](#1-tiện-ích-mật-khẩu-argon2)
2. [Bộ Tiện ích Chuỗi & Truy Vấn (Query & String Helpers)](#2-bộ-tiện-ích-chuỗi--truy-vấn-query--string-helpers)
   - [ParseQueryPipe (`qs`)](#parsequerypipe-qs)
   - [Chuẩn hóa Chuỗi (`normalize.util.ts`)](#chuẩn-hóa-chuỗi-normalizeutilts)
   - [Lọc Thẻ HTML (`stripHtmlTags`)](#lọc-thẻ-html-striphtmltags)
   - [Xác định Phiên bản Ứng dụng (`app-version.util.ts`)](#xác-định-phiên-bản-ứng-dụng-app-versionutilts)
3. [Hạ Tầng Entity TypeORM](#3-hạ-tầng-entity-typeorm)
   - [AbstractEntity](#abstractentity)
   - [Sắp xếp Thứ tự Cột với Decorator `@Order(index)`](#sắp-xếp-thứ-tự-cột-với-decorator-orderindex)
   - [Chuyển đổi DTO (`toDto`)](#chuyển-đổi-dto-todto)

---

## 1. Tiện ích Mật khẩu (Argon2)

File: `apps/api/src/utils/password.util.ts`  
Spec: `apps/api/src/utils/password.util.spec.ts`

Hệ thống sử dụng thuật toán **Argon2** (thông qua thư viện npm `argon2`) - thuật toán chiến thắng trong Password Hashing Competition (PHC) - để mã hóa và kiểm tra mật khẩu an toàn, chống lại các cuộc tấn công brute-force phần cứng (GPU/ASIC).

### Các hàm

#### `hashPassword(password: string): Promise<string>`

Băm mật khẩu dạng văn bản thuần sang mã băm Argon2id với salt được sinh tự động.

```typescript
import { hashPassword } from "../utils/password.util";

const hashedPassword = await hashPassword("mySecurePassword123");
```

- **Xử lý lỗi**: Bắt các lỗi phát sinh, ghi log có cấu trúc qua NestJS `Logger('PasswordUtil')`, và ném ra ngoại lệ rõ ràng `Error('Can not hash password.', { cause: err })`.

#### `verifyPassword(password: string, hashedPassword: string): Promise<boolean>`

Kiểm tra mật khẩu nhập vào có khớp với mã băm đã lưu trữ hay không.

```typescript
import { verifyPassword } from "../utils/password.util";

const isValid = await verifyPassword("mySecurePassword123", user.password);
if (!isValid) {
  throw new UnauthorizedException("Thông tin đăng nhập không hợp lệ");
}
```

- **Xử lý lỗi**: Trả về `false` một cách an toàn nếu mật khẩu không khớp hoặc có lỗi trong quá trình verify, ngăn chặn việc làm rò rỉ database stack trace ra ngoài.

---

## 2. Bộ Tiện ích Chuỗi & Truy Vấn (Query & String Helpers)

### ParseQueryPipe (`qs`)

File: `apps/api/src/pipes/parse-query.pipe.ts`  
Spec: `apps/api/src/pipes/parse-query.pipe.spec.ts`

Một NestJS `PipeTransform` sử dụng thư viện `qs` để giải mã các chuỗi truy vấn URL lồng nhau phức tạp thành object có cấu trúc.

```typescript
@Get()
async findAll(
  @Query(new ParseQueryPipe()) query: Record<string, any>,
) {
  // Giải mã "?filter[name]=john&filter[status]=active"
  // thành { filter: { name: 'john', status: 'active' } }
}
```

- **Hỗ trợ 2 chế độ**:
  - Chuỗi URL thô (`string`): dùng `qs.parse(value)`.
  - Object nông (Express query parser mặc định chứa key dạng bracket): chuyển hóa qua `qs.parse(qs.stringify(value))` để tái tạo object lồng nhau đa cấp.
  - Các tham số không phải kiểu `query`: giữ nguyên không biến đổi.

### Chuẩn hóa Chuỗi (`normalize.util.ts`)

File: `apps/api/src/utils/normalize.util.ts`  
Spec: `apps/api/src/utils/normalize.util.spec.ts`

#### `normalizeUserAgent(userAgent?: string | string[]): string | undefined`

Chuẩn hóa header `User-Agent`. Khi đi qua hệ thống reverse proxy hoặc load balancer nhiều tầng, header này có thể bị gán dạng mảng (`string[]`). Hàm này gộp chúng lại bằng dấu phẩy `, ` để đảm bảo luôn là một chuỗi thống nhất.

#### `normalizeEmail(email: string): string`

Chuẩn hóa email người dùng trước khi lưu trữ hoặc tìm kiếm trong cơ sở dữ liệu: loại bỏ khoảng trắng ở 2 đầu và chuyển đổi toàn bộ về chữ thường.

```typescript
import { normalizeEmail } from "../utils/normalize.util";

const cleanEmail = normalizeEmail("  User@Example.COM  "); // "user@example.com"
```

### Lọc Thẻ HTML (`stripHtmlTags`)

File: `apps/api/src/utils/helpers.ts`  
Spec: `apps/api/src/utils/helpers.spec.ts`

Loại bỏ toàn bộ các thẻ HTML ra khỏi chuỗi để lọc và làm sạch dữ liệu đầu vào, phòng chống tấn công XSS.

```typescript
import { stripHtmlTags } from "../utils/helpers";

const plainText = stripHtmlTags("<p>Xin chào <b>Việt Nam</b></p>"); // "Xin chào Việt Nam"
```

### Xác định Phiên bản Ứng dụng (`app-version.util.ts`)

File: `apps/api/src/utils/app-version.util.ts`  
Spec: `apps/api/src/utils/app-version.util.spec.ts`

Tự động tìm kiếm và đọc trường `version` từ file `package.json` theo đường dẫn phân cấp trong monorepo (root monorepo, app root, compiled `dist`).

- Lưu kết quả vào bộ nhớ đệm (in-memory cache) sau lần đọc đầu tiên.
- Phục vụ Swagger UI documentation (`setupSwagger`) và endpoint kiểm tra tình trạng hệ thống (health check).

---

## 3. Hạ Tầng Entity TypeORM

### AbstractEntity

File: `apps/api/src/database/entities/abstract.entity.ts`  
Spec: `apps/api/src/database/entities/abstract.entity.spec.ts`

Lớp cơ sở kế thừa từ `BaseEntity` của TypeORM (hỗ trợ mô hình ActiveRecord). Tất cả các domain entity trong hệ thống đều mở rộng từ lớp này:

- `createdAt`: Cột kiểu `timestamptz` với giá trị mặc định là `CURRENT_TIMESTAMP`.
- `updatedAt`: Cột kiểu `timestamptz` tự động cập nhật khi bản ghi thay đổi.
- `toDto(dtoClass, options)`: Tiện ích chuyển đổi instance của entity sang response DTO thông qua `class-transformer` (`plainToInstance`).

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

### Sắp xếp Thứ tự Cột với Decorator `@Order(index)`

File: `apps/api/src/database/decorators/order.decorator.ts`  
Spec: `apps/api/src/database/decorators/order.decorator.spec.ts`

#### Vấn đề

Trong cơ chế kế thừa class của JavaScript/TypeScript, các thuộc tính được khai báo ở lớp cha (`AbstractEntity`) sẽ được TypeORM phát hiện và đăng ký trước các thuộc tính ở lớp con. Do đó, các cột audit như `created_at` và `updated_at` mặc định sẽ bị đặt ở đầu bảng thay vì ở cuối.

#### Giải pháp

1. Sử dụng decorator `@Order(index)` trên các trường của entity con (ví dụ: `@Order(1)` cho `id`, `@Order(2)` cho các trường chính).
2. Lớp cha gán `@Order(9999)` cho hai cột `createdAt` và `updatedAt`.
3. Trong phương thức `AbstractEntity.useDataSource(dataSource)`, mảng `meta.columns` được sắp xếp tăng dần theo giá trị thứ tự đã đánh dấu:

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

Điều này bảo đảm rằng trong PostgreSQL và các câu lệnh query do TypeORM sinh ra, các cột timestamp luôn nằm ở vị trí cuối cùng của bảng.

### Chuyển đổi DTO (`toDto`)

Chuyển hóa dữ liệu thực thể sang các DTO phía client, tôn trọng các rule `@Exclude()` / `@Expose()`:

```typescript
const user = await UserEntity.findOneBy({ id });
return user.toDto(UserResponseDto);
```
