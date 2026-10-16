# Trung tâm tài liệu Monorepo (Documentation Hub)

> [English](README.md) | **Tiếng Việt**

Chào mừng bạn đến với trung tâm tài liệu kỹ thuật của monorepo. Thư mục này tập hợp đầy đủ các hướng dẫn chi tiết về kiến trúc, vận hành và quy chuẩn phát triển cho toàn bộ ứng dụng và các package dùng chung.

---

## Danh mục tài liệu

| Tài liệu                                                             | Mô tả                                                                                                                                                  | Ngôn ngữ                                                                          |
| :------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------- |
| [**Kiến trúc & Tổng quan**](../README.md)                            | Kiến trúc tổng thể monorepo, vai trò từng ứng dụng, cấu trúc package và hướng dẫn khởi chạy.                                                           | [English](../README.md)                                                           |
| [**Xác thực & Phân quyền (RBAC)**](AUTH.vi.md)                       | Cơ chế xác thực JWT, cơ chế xoay vòng Refresh Token, Google OAuth, phiên đăng nhập, vai trò và quyền hạn.                                              | [Tiếng Việt](AUTH.vi.md) · [English](AUTH.md)                                     |
| [**Query Builder**](QUERY_BUILDER.vi.md)                             | Query builder dạng whitelist linh hoạt cho NestJS/TypeORM và thư viện client `@repo/query-builder` (`RestQueryBuilder`, `NestjsPaginateQueryBuilder`). | [Tiếng Việt](QUERY_BUILDER.vi.md) · [English](QUERY_BUILDER.md)                   |
| [**Component Data Table**](DATATABLE.vi.md)                          | Component bảng dữ liệu đa năng dựa trên TanStack Table cho `apps/web` (sắp xếp, lọc, chọn dòng, phân trang server-side).                               | [Tiếng Việt](DATATABLE.vi.md) · [English](DATATABLE.md)                           |
| [**Sortable & Drag-and-Drop**](SORTABLE.vi.md)                       | Danh sách, hàng bảng và cây danh mục có thể kéo thả sắp xếp bằng thư viện `@dnd-kit`.                                                                  | [Tiếng Việt](SORTABLE.vi.md) · [English](SORTABLE.md)                             |
| [**Hệ thống File & Lưu trữ**](filesystem.vi.md)                      | Lớp trừu tượng lưu trữ đa driver hỗ trợ lưu ổ đĩa cục bộ (Local disk) và Cloud Storage (AWS S3 / MinIO).                                               | [Tiếng Việt](filesystem.vi.md) · [English](filesystem.md)                         |
| [**Tải file nền (Background Upload)**](BACKGROUND_FILE_UPLOAD.vi.md) | Upload file dạng chunk ngắt quãng và xử lý file bất đồng bộ qua hàng đợi BullMQ worker.                                                                | [Tiếng Việt](BACKGROUND_FILE_UPLOAD.vi.md) · [English](BACKGROUND_FILE_UPLOAD.md) |
| [**Nhật ký hoạt động (Audit Trail)**](ACTIVITY_LOG.vi.md)            | Hệ thống ghi log hoạt động của người dùng, theo dõi lịch sử thay đổi và kiểm tra an toàn.                                                              | [Tiếng Việt](ACTIVITY_LOG.vi.md) · [English](ACTIVITY_LOG.md)                     |
| [**Tiện ích cốt lõi (Core Utilities)**](CORE_UTILITIES.vi.md)        | Bộ decorators, interceptors, validation pipes, chuẩn hóa response API và bộ lọc exception của NestJS.                                                  | [Tiếng Việt](CORE_UTILITIES.vi.md) · [English](CORE_UTILITIES.md)                 |
| [**Giám sát lỗi với Sentry**](SENTRY.vi.md)                          | Bắt lỗi tự động, truy vết phân tán và theo dõi hiệu năng hệ thống ở backend và frontend.                                                               | [Tiếng Việt](SENTRY.vi.md) · [English](SENTRY.md)                                 |
| [**Chiến lược Kiểm thử (Testing)**](TESTING.vi.md)                   | Hướng dẫn viết Unit test, Mocking service, Controller test và E2E test với Vitest và Jest.                                                             | [Tiếng Việt](TESTING.vi.md) · [English](TESTING.md)                               |
| [**Hướng dẫn Triển khai (Deployment)**](DEPLOYMENT.vi.md)            | Cấu hình Docker Production, biến môi trường, chạy migration cơ sở dữ liệu PostgreSQL.                                                                  | [Tiếng Việt](DEPLOYMENT.vi.md) · [English](DEPLOYMENT.md)                         |
| [**Quy trình Phát hành (Release)**](RELEASE.vi.md)                   | Tự động hóa đánh version Semantic Release, tự sinh Changelog và tạo GitHub Release.                                                                    | [Tiếng Việt](RELEASE.vi.md) · [English](RELEASE.md)                               |

---

## Điều hướng Workspace

- **[`apps/api`](../apps/api)**: Backend NestJS 11 với PostgreSQL (TypeORM), Redis, Mailpit, BullMQ và Swagger.
- **[`apps/web`](../apps/web)**: Trang quản trị Vite 6 + React 19.
- **[`apps/client`](../apps/client)**: Ứng dụng khách hàng Next.js 16 App Router với đa ngôn ngữ i18n.
- **[`packages/query-builder`](../packages/query-builder)**: Thư viện tạo query REST và NestJS Paginate dùng chung.
