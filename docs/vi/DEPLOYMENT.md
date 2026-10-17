# Hướng Dẫn Triển Khai Monorepo Với Coolify (VPS All-in-One)

> [English](../en/DEPLOYMENT.md) | **Tiếng Việt**

Tài liệu này cung cấp quy trình từng bước, chi tiết từng câu lệnh từ một VPS Ubuntu trắng tinh (fresh install) đến khi triển khai hoàn chỉnh toàn bộ hệ thống monorepo với **Coolify**, bao gồm:

- **NestJS API** (`apps/api`) chạy trên cổng `3000`, mount volume lưu trữ tệp tin bền vững `/app/storage`.
- **Next.js 15 Client Website** (`apps/client`) chạy Server-Side Rendering (SSR) trên cổng `3000`.
- **Vite React Admin Portal** (`apps/web`) đóng gói Single-Page Application (SPA) qua Nginx trên cổng `80`.
- **PostgreSQL 16** và **Redis 7** chạy trong mạng nội bộ bảo mật của Docker.
- **Traefik Reverse Proxy** tích hợp sẵn của Coolify, tự động xin và cấp phát chứng chỉ SSL (HTTPS) miễn phí qua Let's Encrypt.

---

## Mục Lục

1. [Kiến Trúc & Yêu Cầu Phần Cứng](#1-kiến-trúc--yêu-cầu-phần-cứng)
2. [Bước 1: Chuẩn Bị VPS & Cấu Hình Hệ Thống](#bước-1-chuẩn-bị-vps--cấu-hình-hệ-thống)
3. [Bước 2: Cài Đặt Coolify Bằng Một Câu Lệnh](#bước-2-cài-đặt-coolify-bằng-một-câu-lệnh)
4. [Bước 3: Cấu Hình DNS Domain](#bước-3-cấu-hình-dns-domain)
5. [Bước 4: Kết Nối Git Repository](#bước-4-kết-nối-git-repository)
6. [Bước 5: Tạo Project & Triển Khai Cơ Sở Dữ Liệu](#bước-5-tạo-project--triển-khai-cơ-sở-dữ-liệu)
7. [Bước 6: Triển Khai Dịch Vụ API Backend (`apps/api`)](#bước-6-triển-khai-dịch-vụ-api-backend-appsapi)
8. [Bước 7: Chạy Migration, Đồng Bộ Quyền & Seed Dữ Liệu](#bước-7-chạy-migration-đồng-bộ-quyền--seed-dữ-liệu)
9. [Bước 8: Triển Khai Website Khách Hàng (`apps/client`)](#bước-8-triển-khai-website-khách-hàng-appsclient)
10. [Bước 9: Triển Khai Cổng Quản Trị (`apps/web`)](#bước-9-triển-khai-cổng-quản-trị-appsweb)
11. [Bước 10: Tự Động Hóa CI/CD & Auto Deploy](#bước-10-tự-động-hóa-cicd--auto-deploy)
12. [Bước 11: Kiểm Tra Hoạt Động (Smoke Tests)](#bước-11-kiểm-tra-hoạt-động-smoke-tests)
13. [Bước 12: Thiết Lập Sao Lưu Tự Động (Backups)](#bước-12-thiết-lập-sao-lưu-tự-động-backups)
14. [Xử Lý Sự Cố Thường Gặp (Troubleshooting)](#xử-lý-sự-cố-thường-gặp-troubleshooting)

---

## 1. Kiến Trúc & Yêu Cầu Phần Cứng

### Mô Hình Mạng & Định Tuyến

```
                         [ Internet: Người dùng truy cập ]
                                        │
                         ┌──────────────┴──────────────┐
                         │   Traefik (Coolify Proxy)   │
                         │    Ports 80 / 443 (SSL)     │
                         └──────────────┬──────────────┘
                                        │
       ┌────────────────────────────────┼────────────────────────────────┐
       │ (api.yourdomain.com)           │ (yourdomain.com)               │ (admin.yourdomain.com)
       ▼                                ▼                                ▼
┌──────────────┐                 ┌──────────────┐                 ┌──────────────┐
│  apps/api    │                 │ apps/client  │                 │  apps/web    │
│  NestJS :3000│                 │ Next.js :3000│                 │ Nginx :80    │
└──────┬───┬───┘                 └──────┬───────┘                 └──────────────┘
       │   │                            │ (Server Components fetch)
       │   └──────────────┐             │
       ▼                  ▼             ▼
┌──────────────┐   ┌──────────────┐
│  PostgreSQL  │   │    Redis     │
│  Port 5432   │   │  Port 6379   │
└──────────────┘   └──────────────┘
```

### Cấu Hình VPS Khuyến Nghị

| Tiêu Chí              | Cấu Hình Tối Thiểu           | Cấu Hình Khuyến Nghị (Production) |
| :-------------------- | :--------------------------- | :-------------------------------- |
| **Hệ Điều Hành**      | Ubuntu 22.04 LTS / 24.04 LTS | Ubuntu 24.04 LTS x86_64           |
| **CPU**               | 2 vCPU                       | 4 vCPU                            |
| **RAM**               | 2 GB (+ 4GB Swap bắt buộc)   | 4 GB hoặc 8 GB (+ 4GB Swap)       |
| **Ổ Cứng (SSD/NVMe)** | 30 GB SSD                    | 60+ GB NVMe SSD                   |
| **Băng Thông**        | 1 Gbps                       | 1 Gbps                            |

> [!WARNING]
> Khi build monorepo (đặc biệt là Next.js 15 và Vite), tiến trình compile tiêu tốn nhiều bộ nhớ RAM. Nếu VPS chỉ có 2GB RAM mà **không tạo 4GB Swap**, lệnh build sẽ bị hạt nhân Linux tắt ngang (`OOM Killed / Exit code 137`). **Bắt buộc làm Bước 1 trước khi cài Coolify.**

---

## Bước 1: Chuẩn Bị VPS & Cấu Hình Hệ Thống

Kết nối SSH vào VPS với quyền `root`:

```bash
ssh root@<IP_VPS_CUA_BAN>
```

### 1.1. Cập nhật hệ thống

```bash
apt update && apt upgrade -y
apt install -y curl wget git ufw htop ca-certificates gnupg lsb-release
```

### 1.2. Tạo 4GB Swapfile (Bộ nhớ ảo chống tràn RAM)

Chạy lần lượt các lệnh sau:

```bash
# Kiểm tra nếu chưa có swap
swapon --show

# Tạo swapfile 4GB
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# Lưu cấu hình để swap tự nhận khi reboot VPS
echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab

# Tối ưu swappiness (10: chỉ dùng swap khi RAM thực sự đầy)
sysctl vm.swappiness=10
echo 'vm.swappiness=10' | tee -a /etc/sysctl.conf
```

Kiểm tra lại dung lượng Swap:

```bash
free -h
```

### 1.3. Cấu hình Tường Lửa (UFW Firewall)

Mở các cổng cần thiết cho web, SSH và bảng điều khiển Coolify:

```bash
# Cho phép SSH (Nếu VPS của bạn dùng cổng SSH khác 22, hãy thay đổi tương ứng)
ufw allow 22/tcp

# Cho phép HTTP và HTTPS phục vụ ứng dụng
ufw allow 80/tcp
ufw allow 443/tcp

# Cho phép bảng điều khiển Coolify Web UI
ufw allow 8000/tcp

# Bật tường lửa
ufw --force enable

# Kiểm tra trạng thái tường lửa
ufw status
```

---

## Bước 2: Cài Đặt Coolify Bằng Một Câu Lệnh

Coolify cung cấp một script cài đặt tự động cài đặt Docker, Docker Compose, Traefik và Coolify Service:

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

Quá trình cài đặt tự động diễn ra trong 2 - 5 phút. Khi hoàn tất, terminal sẽ hiển thị thông báo thành công:

```text
Coolify is installed and running!
Access it via: http://<IP_VPS_CUA_BAN>:8000
```

### 2.1. Đăng Ký Tài Khoản Quản Trị Viên

1. Mở trình duyệt, truy cập `http://<IP_VPS_CUA_BAN>:8000`.
2. Điền thông tin tạo tài khoản **Root Admin** (Email và Mật khẩu).
3. Đăng nhập vào bảng điều khiển Coolify Dashboard.

### 2.2. Gán Tên Miền Cho Coolify (Khuyến Nghị)

Để bảo vệ mật khẩu đăng nhập Coolify bằng SSL (HTTPS):

1. Vào **Settings** -> **Instance Settings**.
2. Tại ô **Instance Domain / FQDN**, nhập domain quản trị (ví dụ: `https://coolify.yourdomain.com`).
3. Nhấn **Save**. Coolify và Traefik sẽ tự động cấp chứng chỉ Let's Encrypt cho trang quản trị.

---

## Bước 3: Cấu Hình DNS Domain

Truy cập trang quản lý DNS nhà cung cấp tên miền của bạn (Cloudflare, Namecheap, GoDaddy, Hostinger...) và cấu hình các bản ghi **A Record** trỏ về địa chỉ IP của VPS:

| Loại (Type) | Tên (Host / Name)    | Giá Trị (Target / IP) | Mục Đích                           |
| :---------- | :------------------- | :-------------------- | :--------------------------------- |
| **A**       | `@` (yourdomain.com) | `<IP_VPS_CUA_BAN>`    | Website người dùng (`apps/client`) |
| **A**       | `www`                | `<IP_VPS_CUA_BAN>`    | Website người dùng dự phòng        |
| **A**       | `api`                | `<IP_VPS_CUA_BAN>`    | Backend REST API (`apps/api`)      |
| **A**       | `admin`              | `<IP_VPS_CUA_BAN>`    | Cổng quản trị viên (`apps/web`)    |
| **A**       | `coolify`            | `<IP_VPS_CUA_BAN>`    | Bảng điều khiển Coolify Dashboard  |

> [!IMPORTANT]
> **Lưu ý đối với Cloudflare:**
> Trong lần đầu tiên triển khai, hãy đặt trạng thái đám mây là **DNS Only (Đám mây xám / Grey Cloud)** để Traefik của Coolify có thể xác thực ACME HTTP Challenge và cấp chứng chỉ Let's Encrypt trực tiếp. Sau khi chứng chỉ đã cấp xong, bạn có thể chuyển sang **Proxied (Đám mây cam)** và đặt chế độ SSL/TLS trên Cloudflare là **Full (strict)**.

Kiểm tra DNS đã trỏ thành công chưa trên máy tính cá nhân của bạn:

```bash
ping yourdomain.com
ping api.yourdomain.com
ping admin.yourdomain.com
```

---

## Bước 4: Kết Nối Git Repository

Nếu mã nguồn của bạn nằm trong repository riêng tư (Private Repo) trên GitHub / GitLab, bạn cần liên kết quyền truy cập cho Coolify.

### Cách 1: Dùng GitHub App (Khuyến nghị - Tiện lợi nhất)

1. Trong Coolify, vào mục **Keys & Tokens** -> **Git Sources** -> **Add New**.
2. Chọn **GitHub App**.
3. Làm theo hướng dẫn trên màn hình để cấp quyền cho Coolify truy cập repository của bạn.
4. Với cách này, Coolify sẽ tự động cài Webhook để kích hoạt tính năng **Auto Deploy** mỗi khi bạn `git push`.

### Cách 2: Dùng Deploy Key (SSH Key)

1. Trong Coolify, vào mục **Keys & Tokens** -> **Security Keys** -> Chọn khóa mặc định (hoặc tạo khóa mới) -> Sao chép chuỗi **Public Key**.
2. Vào GitHub Repository của bạn -> **Settings** -> **Deploy Keys** -> **Add deploy key**.
3. Dán Public Key vào, đặt tên ví dụ `Coolify VPS Key` (không cần tích Allow write access) -> Nhấn **Add key**.

---

## Bước 5: Tạo Project & Triển Khai Cơ Sở Dữ Liệu

1. Trên menu chính của Coolify, chọn **Projects** -> Nhấn **+ Add** -> Đặt tên dự án là `Production Monorepo` -> Nhấn **Continue**.
2. Chọn môi trường `production`.

### 5.1. Khởi Tạo PostgreSQL 16

1. Nhấn **+ New Resource** -> Chọn **PostgreSQL**.
2. Thiết lập cấu hình cơ bản:
   - **Name**: `monorepo-postgres`
   - **Postgres Image**: `postgres:16-alpine`
   - **Postgres Database**: `monorepo`
   - **Postgres User**: `postgres`
   - **Postgres Password**: Điền một mật khẩu mạnh (ví dụ: `Pg_Pr0d_SecuRe#9982`)
3. Chuyển sang tab **Configuration**:
   - Ghi lại **Internal Database URL** hoặc cấu hình host. Vì nằm chung mạng nội bộ Docker của Coolify, hostname nội bộ mặc định sẽ là tên container hoặc UUID (ví dụ: `monorepo-postgres:5432` hoặc `<id-dich-vu>:5432`).
4. Nhấn **Start** để chạy PostgreSQL. Kiểm tra trạng thái chuyển sang màu xanh lá cây (**Running**).

### 5.2. Khởi Tạo Redis 7

1. Nhấn **+ New Resource** -> Chọn **Redis**.
2. Thiết lập cấu hình:
   - **Name**: `monorepo-redis`
   - **Redis Image**: `redis:7-alpine`
   - **Redis Password**: Điền mật khẩu (hoặc để trống nếu chỉ truy cập nội bộ mạng Docker)
3. Nhấn **Start** để chạy Redis. Kiểm tra trạng thái chuyển sang **Running**.

> [!TIP]
> Tất cả các container trong cùng một dự án Coolify đều tự động nằm chung một mạng Docker bridge riêng biệt (`coolify` network). Nhờ vậy, API có thể gọi trực tiếp tới PostgreSQL và Redis qua cổng nội bộ mà không cần mở cổng 5432 hay 6379 ra ngoài Internet.

---

## Bước 6: Triển Khai Dịch Vụ API Backend (`apps/api`)

1. Trong dự án `Production Monorepo`, nhấn **+ New Resource** -> Chọn **Git Repository** (hoặc GitHub App).
2. Chọn repository monorepo của bạn và chọn nhánh `main`.
3. Điền các trường cấu hình quan trọng sau:

### 6.1. Cấu hình Tổng quan (General Configuration)

| Trường cấu hình        | Giá trị thiết lập            | Giải thích                                                                               |
| :--------------------- | :--------------------------- | :--------------------------------------------------------------------------------------- |
| **Name**               | `API Backend`                | Tên hiển thị dịch vụ                                                                     |
| **Build Pack**         | `Dockerfile`                 | Dùng Dockerfile có sẵn                                                                   |
| **Base Directory**     | `/`                          | **Bắt buộc là `/`**: Docker cần đọc workspace root (`packages/*`, `pnpm-workspace.yaml`) |
| **Dockerfile Path**    | `apps/api/Dockerfile`        | Đường dẫn đến Dockerfile của API                                                         |
| **Target Build Stage** | `production`                 | Stage cuối trong multi-stage build                                                       |
| **Domains**            | `https://api.yourdomain.com` | Traefik tự động tạo chứng chỉ SSL cho domain này                                         |
| **Ports Exposes**      | `3000`                       | Cổng Node.js container đang lắng nghe                                                    |

### 6.2. Cấu hình Persistent Storage (Lưu trữ tệp tin vĩnh viễn)

Vào tab **Storages** -> Nhấn **+ Add**:

- **Name**: `api-storage`
- **Source Path** (trên máy chủ host): Để mặc định hoặc điền `/data/coolify/applications/api/storage`
- **Destination Path** (trong container): `/app/storage`

> [!IMPORTANT]
> Bước này đảm bảo các tệp tin người dùng tải lên, ảnh đại diện (`/app/storage/public`, `/app/storage/avatars`) không bao giờ bị xóa mất khi bạn deploy phiên bản mã nguồn mới.

### 6.3. Biến Môi Trường (Environment Variables)

Vào tab **Environment Variables**, chọn chế độ **Developer View** (soạn thảo raw text) và dán nội dung sau (hãy thay thế bằng domain và mật khẩu thực tế của bạn):

```env
# ==============================================================================
# Ứng Dụng & Môi Trường
# ==============================================================================
NODE_ENV=production
TZ=UTC

APP_NAME="Monorepo Production API"
APP_URL=https://api.yourdomain.com
APP_PORT=3000
APP_DEBUG=false
API_PREFIX=api
APP_FALLBACK_LANGUAGE=en
APP_LOG_LEVEL=warn
APP_CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com,https://admin.yourdomain.com

# ==============================================================================
# Cơ Sở Dữ Liệu (PostgreSQL)
# Thay DATABASE_HOST bằng hostname nội bộ hiển thị trên trang cấu hình PostgreSQL
# ==============================================================================
DATABASE_TYPE=postgres
DATABASE_HOST=monorepo-postgres
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=Pg_Pr0d_SecuRe#9982
DATABASE_NAME=monorepo
DATABASE_SYNCHRONIZE=false
DATABASE_MAX_CONNECTIONS=50
DATABASE_SSL_ENABLED=false
DATABASE_REJECT_UNAUTHORIZED=false

# ==============================================================================
# Bộ Nhớ Đệm & Hàng Đợi (Redis)
# ==============================================================================
REDIS_HOST=monorepo-redis
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_TLS_ENABLED=false

# ==============================================================================
# Mailer (Cấu hình SMTP gửi email thông báo, quên mật khẩu)
# ==============================================================================
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USER=apikey
MAIL_PASSWORD=YOUR_SMTP_API_KEY
MAIL_IGNORE_TLS=false
MAIL_SECURE=false
MAIL_REQUIRE_TLS=true
MAIL_DEFAULT_EMAIL=noreply@yourdomain.com
MAIL_DEFAULT_NAME="Your System"

# ==============================================================================
# Hệ Thống Lưu Trữ Tệp Tin
# ==============================================================================
FILESYSTEM_DISK=public

# ==============================================================================
# Khóa Xác Thực & Bảo Mật JWT (Tạo chuỗi ngẫu nhiên tối thiểu 32 ký tự)
# ==============================================================================
AUTH_JWT_SECRET=ThayTheBangChuoiBiMatNgauNhienDaiItNhat32KyTu11111111111
AUTH_JWT_TOKEN_EXPIRES_IN=1d
AUTH_REFRESH_SECRET=ThayTheBangChuoiBiMatNgauNhienDaiItNhat32KyTu22222222222
AUTH_REFRESH_TOKEN_EXPIRES_IN=365d
AUTH_FORGOT_SECRET=ThayTheBangChuoiBiMatNgauNhienDaiItNhat32KyTu33333333333
AUTH_FORGOT_TOKEN_EXPIRES_IN=15m
AUTH_CONFIRM_EMAIL_SECRET=ThayTheBangChuoiBiMatNgauNhienDaiItNhat32KyTu44444444444
AUTH_CONFIRM_EMAIL_TOKEN_EXPIRES_IN=1d

USER_AUTH_JWT_SECRET=ThayTheBangChuoiBiMatNgauNhienDaiItNhat32KyTu55555555555
USER_AUTH_JWT_TOKEN_EXPIRES_IN=15m
USER_AUTH_REFRESH_SECRET=ThayTheBangChuoiBiMatNgauNhienDaiItNhat32KyTu66666666666
USER_AUTH_REFRESH_TOKEN_EXPIRES_IN=365d
USER_AUTH_FORGOT_SECRET=ThayTheBangChuoiBiMatNgauNhienDaiItNhat32KyTu77777777777
USER_AUTH_FORGOT_TOKEN_EXPIRES_IN=7d
USER_AUTH_CONFIRM_EMAIL_SECRET=ThayTheBangChuoiBiMatNgauNhienDaiItNhat32KyTu88888888888
USER_AUTH_CONFIRM_EMAIL_TOKEN_EXPIRES_IN=1d

# URL Điều Hướng Người Dùng Khi Xác Thực
AUTH_PORTAL_URL=https://admin.yourdomain.com
AUTH_PORTAL_RESET_PASSWORD_URL=https://admin.yourdomain.com/reset-password
USER_AUTH_CLIENT_URL=https://yourdomain.com
USER_AUTH_CLIENT_RESET_PASSWORD_URL=https://yourdomain.com/auth/reset-password

# ==============================================================================
# Dashboard Giám Sát Hàng Đợi (Bull Board)
# ==============================================================================
BULL_BOARD_PATH=/queues
ADMIN_PANEL_USERNAME=superadmin
ADMIN_PANEL_PASSWORD=MatKhauAdminSieuKho123!
```

4. Nhấn **Save** để lưu biến môi trường.
5. Nhấn **Deploy** ở góc trên bên phải.
6. Chờ quá trình build hoàn tất. Bạn có thể theo dõi tiến trình build trong tab **Deployments**. Khi trạng thái chuyển sang **Running**, API đã hoạt động!

---

## Bước 7: Chạy Migration, Đồng Bộ Quyền & Seed Dữ Liệu

Vì đây là lần đầu khởi tạo cơ sở dữ liệu, bạn cần chạy TypeORM Migration để tạo các bảng, đồng bộ bảng quyền hạn và tạo tài khoản Admin mặc định.

### Cách 1: Chạy trực tiếp từ Web Terminal của Coolify (Đơn giản nhất)

1. Trên bảng điều khiển Coolify, vào ứng dụng **API Backend**.
2. Chọn tab **Terminal** (hoặc **Exec**).
3. Nhập shell: `sh` hoặc `bash` và nhấn **Connect**.
4. Chạy lần lượt 3 lệnh sau trong cửa sổ terminal của container:

```bash
# 1. Chạy TypeORM Migrations tạo cấu trúc cơ sở dữ liệu
npm run migration:run:prod

# 2. Đồng bộ danh mục quyền hạn hệ thống vào cơ sở dữ liệu
npm run permissions:sync:prod

# 3. Chạy seed tạo tài khoản quản trị mặc định và dữ liệu mẫu
npm run seed:run:prod
```

### Cách 2: Chạy từ SSH máy chủ VPS

Nếu bạn đang kết nối SSH trực tiếp vào VPS:

```bash
# Tìm ID hoặc tên của container API đang chạy
docker ps --filter "name=api" --format "{{.Names}}"

# Chạy trực tiếp lệnh migration
docker exec -it <TEN_CONTAINER_API> npm run migration:run:prod

# Chạy đồng bộ quyền hạn
docker exec -it <TEN_CONTAINER_API> npm run permissions:sync:prod

# Chạy seed dữ liệu
docker exec -it <TEN_CONTAINER_API> npm run seed:run:prod
```

> [!TIP]
> Tài khoản Super Admin mặc định được tạo từ seed thường là `admin@example.com` với mật khẩu `secret123` (hoặc mật khẩu quy định trong `src/database/seeds/admin/admin-seed.service.ts`). Hãy đăng nhập và đổi mật khẩu ngay sau khi triển khai thành công!

---

## Bước 8: Triển Khai Website Khách Hàng (`apps/client`)

`apps/client` là ứng dụng **Next.js 15** sử dụng chế độ `standalone output` tối ưu kích thước image và tài nguyên máy chủ.

1. Trong dự án `Production Monorepo`, nhấn **+ New Resource** -> Chọn Git Repository monorepo của bạn.
2. Thiết lập cấu hình tổng quan:

| Trường cấu hình        | Giá trị thiết lập                                    |
| :--------------------- | :--------------------------------------------------- |
| **Name**               | `Client Website`                                     |
| **Build Pack**         | `Dockerfile`                                         |
| **Base Directory**     | `/`                                                  |
| **Dockerfile Path**    | `apps/client/Dockerfile`                             |
| **Target Build Stage** | `production`                                         |
| **Domains**            | `https://yourdomain.com, https://www.yourdomain.com` |
| **Ports Exposes**      | `3000`                                               |

### Biến Môi Trường (Environment Variables)

Chuyển sang tab **Environment Variables** và cấu hình:

```env
PORT=3000
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_SOCKET_URL=https://api.yourdomain.com
NEXT_PUBLIC_ADMIN_PORTAL_URL=https://admin.yourdomain.com

# Gọi API nội bộ máy chủ khi SSR (tăng tốc độ và giảm latency)
SERVER_API_URL=http://monorepo-api:3000
TOKEN_EXPIRY_MINUTES_REMAINING=1m
APP_NAME="Visel"
NEXT_PUBLIC_ENABLE_WHITE_LABEL=true

# Bản địa hóa (i18n)
NEXT_PUBLIC_USE_CASE=as-needed
NEXT_PUBLIC_APP_LOCALE=en
NEXT_PUBLIC_FALLBACK_LOCALE=en
NEXT_PUBLIC_ALLOWED_LOCALE=en,vi
```

> [!IMPORTANT]
> **CỰC KỲ QUAN TRỌNG VỚI NEXT.JS:**
> Trong danh sách biến môi trường trên Coolify, đối với tất cả các biến có tiền tố `NEXT_PUBLIC_*`, bạn **PHẢI tích chọn ô "Available during build" (hoặc "Build Variable")**.
> Lý do: Trình biên dịch Next.js nhúng trực tiếp giá trị của các biến `NEXT_PUBLIC_*` vào các file JavaScript tĩnh của client trong quá trình `pnpm build`. Nếu không bật tùy chọn này lúc build, client trên trình duyệt sẽ không thể kết nối tới API!

Nhấn **Save** và nhấn **Deploy**.

---

## Bước 9: Triển Khai Cổng Quản Trị (`apps/web`)

`apps/web` là ứng dụng React Single Page Application (SPA) xây dựng bằng **Vite**, phục vụ tĩnh thông qua **Nginx** với cấu hình định tuyến SPA fallback.

1. Trong dự án `Production Monorepo`, nhấn **+ New Resource** -> Chọn Git Repository monorepo.
2. Thiết lập cấu hình tổng quan:

| Trường cấu hình        | Giá trị thiết lập              |
| :--------------------- | :----------------------------- |
| **Name**               | `Admin Portal`                 |
| **Build Pack**         | `Dockerfile`                   |
| **Base Directory**     | `/`                            |
| **Dockerfile Path**    | `apps/web/Dockerfile`          |
| **Target Build Stage** | `production`                   |
| **Domains**            | `https://admin.yourdomain.com` |
| **Ports Exposes**      | `80`                           |

### Biến Môi Trường (Environment Variables)

```env
PORT=80
VITE_API_URL=https://api.yourdomain.com/api/v1
VITE_APP_NAME=Animazing
VITE_SOCKET_URL=https://api.yourdomain.com
VITE_CLIENT_URL=https://yourdomain.com
VITE_AUTH_KEY=Animazing_AUTH_KEY
```

> [!IMPORTANT]
> **LƯU Ý ĐỐI VỚI VITE:**
> Tương tự Next.js, Vite đọc toàn bộ các biến `VITE_*` tại thời điểm biên dịch (`build time`). Bạn **BẮT BUỘC** phải tích chọn checkbox **"Available during build" (Build Variable)** cho tất cả các biến `VITE_*` trên Coolify trước khi nhấn Deploy.

Nhấn **Save** và nhấn **Deploy**.

---

## Bước 10: Tự Động Hóa CI/CD & Auto Deploy

Sau khi triển khai thành công, bạn có thể thiết lập để mỗi khi DEV commit mã nguồn mới lên nhánh `main`, Coolify sẽ tự động nhận diện và cập nhật:

1. Vào từng ứng dụng (`API Backend`, `Client Website`, `Admin Portal`).
2. Vào tab **Webhooks**.
3. Nếu bạn đã kết nối qua **GitHub App** ở Bước 4, tính năng này được kích hoạt tự động.
4. Nếu kết nối qua Deploy Key:
   - Sao chép đường dẫn **Deploy Webhook URL** trong Coolify.
   - Truy cập GitHub Repo -> **Settings** -> **Webhooks** -> **Add webhook**.
   - Dán URL vào mục **Payload URL**, chọn Content type `application/json`, chọn sự kiện `Just the push event` -> Nhấn **Add webhook**.
5. Trong cài đặt ứng dụng trên Coolify, bật tùy chọn **Zero Downtime Deployments (Rolling Update)** để quá trình cập nhật không làm gián đoạn người dùng đang truy cập.

---

## Bước 11: Kiểm Tra Hoạt Động (Smoke Tests)

Chạy các lệnh kiểm tra sau từ máy tính cá nhân hoặc máy chủ để kiểm tra toàn bộ hệ thống:

```bash
# 1. Kiểm tra API Health Check Endpoint
curl -f -I https://api.yourdomain.com/api/v1/health

# 2. Kiểm tra Website Khách hàng (Next.js)
curl -f -I https://yourdomain.com

# 3. Kiểm tra Cổng Quản trị Admin (Nginx)
curl -f -I https://admin.yourdomain.com
```

### Danh Sách Kiểm Tra Trải Nghiệm Người Dùng (Manual Verification Checklist)

- [ ] **Chứng chỉ SSL:** Mở trình duyệt truy cập cả 3 domain, kiểm tra biểu tượng ổ khóa HTTPS an toàn hợp lệ (Let's Encrypt).
- [ ] **Đăng nhập Admin:** Truy cập `https://admin.yourdomain.com`, đăng nhập với tài khoản superadmin, kiểm tra quyền hạn và menu tải đúng.
- [ ] **Tải trang SPA:** F5 refresh tại trang `https://admin.yourdomain.com/users` hoặc các trang con, đảm bảo không gặp lỗi 404 (Nginx fallback hoạt động).
- [ ] **Tải lên tệp tin (File Upload):** Thử cập nhật ảnh đại diện người dùng hoặc tải lên một tài liệu, xác nhận tệp được lưu vào `/app/storage/public` và có thể xem trực tiếp qua URL.
- [ ] **SSR Next.js:** Xem source HTML của trang `https://yourdomain.com` để đảm bảo nội dung được kết xuất từ phía máy chủ (Server-Side Rendered) hoàn chỉnh.

---

## Bước 12: Thiết Lập Sao Lưu Tự Động (Backups)

Dữ liệu quan trọng nhất của hệ thống là cơ sở dữ liệu PostgreSQL. Coolify hỗ trợ lập lịch sao lưu tự động định kỳ:

1. Vào resource **PostgreSQL** (`monorepo-postgres`).
2. Chọn tab **Backups**.
3. Bật tùy chọn **Enabled**.
4. Cấu hình lịch biểu:
   - **Cron Expression**: `0 2 * * *` (Sao lưu mỗi ngày vào lúc 02:00 sáng theo giờ máy chủ).
   - **Backup Retention**: `7` (Lưu trữ 7 bản gần nhất, tự động dọn dẹp bản cũ).
5. (Khuyến nghị) Nhập thông tin cấu hình **S3 Storage** (AWS S3, Cloudflare R2, Backblaze B2) để tải bản backup ra khỏi VPS, phòng ngừa sự cố phần cứng máy chủ.
6. Nhấn **Save**. Bạn cũng có thể bấm **Backup Now** để kiểm tra tính năng sao lưu ngay lập tức.

---

## Xử Lý Sự Cố Thường Gặp (Troubleshooting)

### 1. Quá trình build bị văng ra với mã lỗi 137 (`Exit code 137 / OOM Killed`)

- **Nguyên nhân:** Hạt nhân Linux tắt tiến trình do thiếu RAM khi biên dịch Next.js/Turborepo.
- **Cách khắc phục:** Kiểm tra lại dung lượng Swap bằng lệnh `free -h`. Đảm bảo bạn đã cấu hình tối thiểu 4GB Swap theo [Bước 1.2](#12-tạo-4gb-swapfile-bộ-nhớ-ảo-chống-tràn-ram).

### 2. Trình duyệt báo lỗi CORS khi gọi API từ Admin hoặc Client

- **Triệu chứng:** Console trình duyệt báo `Access to fetch at ... has been blocked by CORS policy`.
- **Cách khắc phục:** Kiểm tra biến môi trường `APP_CORS_ORIGIN` trong ứng dụng API. Đảm bảo chứa đầy đủ URL có cả `https://` và không có dấu gạch chéo `/` ở cuối (ví dụ: `https://yourdomain.com,https://www.yourdomain.com,https://admin.yourdomain.com`). Sau khi sửa, nhấn **Restart** dịch vụ API.

### 3. Website Client không kết nối được tới API sau khi deploy

- **Triệu chứng:** Màn hình client tải trắng hoặc báo lỗi Network Error.
- **Cách khắc phục:** Bạn chưa tích chọn **"Available during build"** cho biến `NEXT_PUBLIC_API_URL` trên Coolify. Hãy vào tab Environment Variables của ứng dụng Client, tích chọn ô này và nhấn **Redeploy**.

### 4. Lỗi chứng chỉ SSL không cấp được (`Certificate issuance failed`)

- **Nguyên nhân:** Traefik không thể kết nối tới cổng 80 của VPS để hoàn tất ACME challenge.
- **Kiểm tra:**
  1. Bản ghi A Record của domain đã thực sự trỏ đúng về IP của VPS chưa (`ping api.yourdomain.com`).
  2. Cổng 80 và 443 đã được mở trong tường lửa UFW chưa (`ufw status`).
  3. Nếu dùng Cloudflare, hãy tạm thời tắt Proxy (chọn DNS Only) để chứng chỉ được cấp trước.

### 5. Lỗi 413 "Payload Too Large" khi tải lên tệp tin lớn

- **Cách khắc phục:** Trong Coolify, vào ứng dụng **API Backend** -> Tab **Configuration** -> **Custom Traefik Configuration** hoặc cấu hình Nginx proxy tăng giới hạn kích thước gói tin gửi lên (`client_max_body_size 50M;`).

---

## Tóm Tắt Các Lệnh Cần Thiết

```bash
# Cài đặt Coolify trên VPS
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash

# Chạy migration & seeds trong container API
npm run migration:run:prod
npm run permissions:sync:prod
npm run seed:run:prod

# Kiểm tra logs container API từ VPS
docker logs -f --tail 100 <TEN_CONTAINER_API>
```
