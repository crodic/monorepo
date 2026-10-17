# Thiết lập Theo dõi Lỗi & Hiệu năng với Sentry

> [English](../en/SENTRY.md) | **Tiếng Việt**

Tài liệu này hướng dẫn cách cấu hình và sử dụng Sentry trong `apps/api` với package `@sentry/nestjs` để tự động thu thập lỗi (error tracking), ghi nhận ngoại lệ (exception capturing) và giám sát hiệu năng truy vấn (distributed tracing).

---

## Mục lục

- [Tổng quan](#tổng-quan)
- [Kiến trúc & Các file quan trọng](#kiến-trúc--các-file-quan-trọng)
- [Cấu hình & Biến môi trường](#cấu-hình--biến-môi-trường)
- [Cơ chế hoạt động](#cơ-chế-hoạt-động)
  - [Khởi tạo sớm (`instrument.ts`)](#khởi-tạo-sớm-instrumentts)
  - [Đăng ký Module (`AppModule`)](#đăng-ký-module-appmodule)
  - [Tự động bắt ngoại lệ (`GlobalExceptionFilter`)](#tự-động-bắt-ngoại-lệ-globalexceptionfilter)
- [Kiểm thử Sentry tại môi trường Local](#kiểm-thử-sentry-tại-môi-trường-local)
- [Best Practices khi triển khai Production](#best-practices-khi-triển-khai-production)

---

## Tổng quan

Sentry được tích hợp trực tiếp vào backend NestJS thông qua SDK chính thức `@sentry/nestjs`. Các tính năng chính bao gồm:

- **Tự động bắt lỗi chưa xử lý (Unhandled Exceptions)**: Toàn bộ lỗi được bắt qua `GlobalExceptionFilter` sẽ được gửi lên Sentry kèm đầy đủ Call Stack và ngữ cảnh request.
- **Giám sát hiệu năng & Tracing**: Đo lường thời gian phản hồi của từng HTTP request transaction và truy vấn cơ sở dữ liệu.
- **Tự động vô hiệu hóa an toàn**: Khi `SENTRY_DSN` để trống (môi trường dev local hoặc chạy unit test CI), Sentry sẽ tự tắt mà không gây lỗi hoặc phát sinh network request.
- **Bảo mật dữ liệu nhạy cảm (PII)**: Kiểm soát việc gửi IP và thông tin định danh người dùng.

---

## Kiến trúc & Các file quan trọng

```
apps/api/
├── src/
│   ├── instrument.ts               # File khởi tạo Sentry.init() chạy trước khi NestJS khởi động
│   ├── main.ts                     # Import './instrument' ngay tại dòng 1
│   ├── app.module.ts               # Đăng ký SentryModule.forRoot() và nạp sentryConfig
│   ├── config/
│   │   ├── sentry.config.ts        # Module cấu hình chuẩn xác thực bằng class-validator
│   │   └── sentry.config.spec.ts   # Unit test kiểm thử việc nạp cấu hình Sentry
│   └── filters/
│       └── global-exception.filter.ts # Được gắn decorator @SentryExceptionCaptured()
├── .env.example                    # Mẫu khai báo biến môi trường
└── .env                            # Biến môi trường thực tế tại local
```

---

## Cấu hình & Biến môi trường

Cấu hình các tham số của Sentry trong file `.env`:

```env
# ==============================================================================
# Sentry Error Tracking & Performance Monitoring
# ==============================================================================
SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=1.0
```

### Bảng giải thích biến môi trường

| Biến môi trường             | Kiểu dữ liệu | Mặc định                   | Mô tả                                                                                      |
| :-------------------------- | :----------- | :------------------------- | :----------------------------------------------------------------------------------------- |
| `SENTRY_DSN`                | `string`     | _(trống)_                  | Chuỗi DSN của dự án Sentry. Nếu để trống, Sentry sẽ tự động tắt.                           |
| `SENTRY_DNS_NESTJS`         | `string`     | _(trống)_                  | Tên biến dự phòng tương thích ngược với source cũ.                                         |
| `SENTRY_ENVIRONMENT`        | `string`     | `NODE_ENV` / `development` | Tên môi trường trên Sentry (ví dụ: `production`, `staging`, `development`).                |
| `SENTRY_TRACES_SAMPLE_RATE` | `number`     | `1.0`                      | Tỷ lệ lấy mẫu hiệu năng từ `0.0` đến `1.0` (Khuyến nghị `0.1` - `0.2` khi lên Production). |

---

## Cơ chế hoạt động

### Khởi tạo sớm (`instrument.ts`)

Trong ứng dụng Node.js, Sentry cần can thiệp (patch) vào các module lõi của Node (HTTP, Express) **trước khi** các module này được import. Do đó, file `src/instrument.ts` được tạo độc lập:

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

Tại file `src/main.ts`, file này được import ngay tại dòng đầu tiên:

```typescript
import './instrument';
import { NestFactory } from '@nestjs/core';
...
```

### Đăng ký Module (`AppModule`)

Trong `apps/api/src/app.module.ts`, `SentryModule` được kích hoạt toàn cục:

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

### Tự động bắt ngoại lệ (`GlobalExceptionFilter`)

Mọi lỗi không được xử lý trong ứng dụng sẽ rơi vào `GlobalExceptionFilter`, tại đây decorator `@SentryExceptionCaptured()` sẽ lập tức gửi sự kiện lỗi lên Sentry:

```typescript
import { SentryExceptionCaptured } from "@sentry/nestjs";

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  @SentryExceptionCaptured()
  catch(exception: any, host: ArgumentsHost): void {
    // Lỗi tự động được gửi lên Sentry, sau đó format trả về ErrorDto cho client
  }
}
```

---

## Kiểm thử Sentry tại môi trường Local

1. Tạo một dự án trên [sentry.io](https://sentry.io) (chọn nền tảng NestJS hoặc Node.js).
2. Dán chuỗi DSN của dự án vào file `apps/api/.env`:
   ```env
   SENTRY_DSN=https://your-dsn@o0.ingest.sentry.io/123456
   SENTRY_ENVIRONMENT=local
   ```
3. Khởi động ứng dụng:
   ```bash
   pnpm --filter api dev
   ```
4. Kích hoạt một lỗi thử nghiệm trên endpoint bất kỳ:
   ```typescript
   @Get('debug-sentry')
   debugSentry() {
     throw new Error('Test Sentry capture from local development');
   }
   ```
5. Mở giao diện Dashboard của Sentry để kiểm tra issue được ghi nhận kèm Call Stack.

---

## Best Practices khi triển khai Production

1. **Điều chỉnh Sample Rate**: Trên hệ thống production có lưu lượng truy cập lớn, hãy cấu hình `SENTRY_TRACES_SAMPLE_RATE=0.1` hoặc `0.2` để tối ưu chi phí và hạn ngạch quota của Sentry.
2. **Bảo mật DSN**: Tuyệt đối không commit chuỗi DSN chứa token nhạy cảm vào Git. Chỉ quản lý thông qua biến môi trường của hệ thống CI/CD hoặc máy chủ production.
3. **Chạy Test CI an toàn**: Không cần cấu hình DSN trong môi trường CI/CD test, Sentry sẽ tự động chuyển sang chế độ disabled mà không ảnh hưởng tốc độ test.
