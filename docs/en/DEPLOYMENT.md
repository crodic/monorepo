# Monorepo Deployment Guide with Coolify (All-in-One VPS)

> **English** | [Tiếng Việt](../vi/DEPLOYMENT.md)

This guide provides a comprehensive, step-by-step, command-by-command deployment procedure from a fresh Ubuntu VPS to a fully functional monorepo deployment managed by **Coolify**, including:

- **NestJS API** (`apps/api`) running on port `3000` with a persistent volume mount at `/app/storage`.
- **Next.js 15 Client Website** (`apps/client`) running Server-Side Rendering (SSR) on port `3000`.
- **Vite React Admin Portal** (`apps/web`) serving a Single-Page Application (SPA) through Nginx on port `80`.
- **PostgreSQL 16** and **Redis 7** isolated within Coolify's internal Docker network.
- **Traefik Reverse Proxy** bundled with Coolify, automatically provisioning free Let's Encrypt SSL (HTTPS) certificates.

---

## Table of Contents

1. [Architecture & Hardware Requirements](#1-architecture--hardware-requirements)
2. [Step 1: VPS Preparation & System Configuration](#step-1-vps-preparation--system-configuration)
3. [Step 2: Install Coolify with a Single Command](#step-2-install-coolify-with-a-single-command)
4. [Step 3: Domain DNS Configuration](#step-3-domain-dns-configuration)
5. [Step 4: Connect Your Git Repository](#step-4-connect-your-git-repository)
6. [Step 5: Create Project & Deploy Databases](#step-5-create-project--deploy-databases)
7. [Step 6: Deploy Backend API Service (`apps/api`)](#step-6-deploy-backend-api-service-appsapi)
8. [Step 7: Run Migrations, Sync Permissions & Seed Database](#step-7-run-migrations-sync-permissions--seed-database)
9. [Step 8: Deploy Client Website (`apps/client`)](#step-8-deploy-client-website-appsclient)
10. [Step 9: Deploy Admin Portal (`apps/web`)](#step-9-deploy-admin-portal-appsweb)
11. [Step 10: Automate CI/CD & Auto Deployment](#step-10-automate-cicd--auto-deployment)
12. [Step 11: Smoke Testing & Verification Checklist](#step-11-smoke-testing--verification-checklist)
13. [Step 12: Set Up Automated Scheduled Backups](#step-12-set-up-automated-scheduled-backups)
14. [Troubleshooting & FAQ](#troubleshooting--faq)

---

## 1. Architecture & Hardware Requirements

### Network & Routing Diagram

```
                         [ Internet: End Users ]
                                    │
                     ┌──────────────┴──────────────┐
                     │   Traefik (Coolify Proxy)   │
                     │    Ports 80 / 443 (SSL)     │
                     └──────────────┬──────────────┘
                                    │
       ┌────────────────────────────┼────────────────────────────┐
       │ (api.yourdomain.com)       │ (yourdomain.com)           │ (admin.yourdomain.com)
       ▼                            ▼                            ▼
┌──────────────┐             ┌──────────────┐             ┌──────────────┐
│  apps/api    │             │ apps/client  │             │  apps/web    │
│  NestJS :3000│             │ Next.js :3000│             │ Nginx :80    │
└──────┬───┬───┘             └──────┬───────┘             └──────────────┘
       │   │                        │ (Server Components fetch)
       │   └──────────────┐         │
       ▼                  ▼         ▼
┌──────────────┐   ┌──────────────┐
│  PostgreSQL  │   │    Redis     │
│  Port 5432   │   │  Port 6379   │
└──────────────┘   └──────────────┘
```

### Hardware Recommendations

| Specification          | Minimum Required             | Recommended (Production)  |
| :--------------------- | :--------------------------- | :------------------------ |
| **Operating System**   | Ubuntu 22.04 LTS / 24.04 LTS | Ubuntu 24.04 LTS x86_64   |
| **CPU**                | 2 vCPUs                      | 4 vCPUs                   |
| **RAM**                | 2 GB (+ mandatory 4GB Swap)  | 4 GB or 8 GB (+ 4GB Swap) |
| **Storage (SSD/NVMe)** | 30 GB SSD                    | 60+ GB NVMe SSD           |
| **Bandwidth**          | 1 Gbps                       | 1 Gbps                    |

> [!WARNING]
> Building a monorepo (especially Next.js 15 and Vite) consumes significant peak RAM. If your VPS has only 2GB RAM and you **skip creating a 4GB Swap file**, the build process will be terminated abruptly by the Linux kernel (`OOM Killed / Exit code 137`). **Do not skip Step 1.**

---

## Step 1: VPS Preparation & System Configuration

SSH into your VPS as `root`:

```bash
ssh root@<YOUR_VPS_IP>
```

### 1.1. System Updates

```bash
apt update && apt upgrade -y
apt install -y curl wget git ufw htop ca-certificates gnupg lsb-release
```

### 1.2. Create 4GB Swapfile (RAM OOM Protection)

Run the following commands in sequence:

```bash
# Verify existing swap
swapon --show

# Allocate 4GB swapfile
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# Persist swap mount across VPS reboots
echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab

# Optimize swappiness (10: only swap when physical RAM is exhausted)
sysctl vm.swappiness=10
echo 'vm.swappiness=10' | tee -a /etc/sysctl.conf
```

Verify available swap memory:

```bash
free -h
```

### 1.3. Configure UFW Firewall

Allow the essential ports for web services, SSH, and Coolify:

```bash
# Allow SSH (If you use a non-default SSH port, replace 22 accordingly)
ufw allow 22/tcp

# Allow HTTP and HTTPS for application traffic
ufw allow 80/tcp
ufw allow 443/tcp

# Allow Coolify Web Dashboard
ufw allow 8000/tcp

# Enable firewall
ufw --force enable

# Check firewall status
ufw status
```

---

## Step 2: Install Coolify with a Single Command

Coolify provides an official unattended installation script that automates Docker, Docker Compose, Traefik, and Coolify setup:

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

The process takes approximately 2 to 5 minutes. When complete, the terminal displays:

```text
Coolify is installed and running!
Access it via: http://<YOUR_VPS_IP>:8000
```

### 2.1. Create Administrator Account

1. Open your browser and navigate to `http://<YOUR_VPS_IP>:8000`.
2. Register your **Root Admin** account (Email and Password).
3. Log in to the Coolify Dashboard.

### 2.2. Assign a Domain to Coolify (Recommended)

To protect your Coolify dashboard with SSL (HTTPS):

1. Navigate to **Settings** -> **Instance Settings**.
2. In the **Instance Domain / FQDN** field, enter your dashboard domain (e.g., `https://coolify.yourdomain.com`).
3. Click **Save**. Coolify and Traefik will automatically issue a Let's Encrypt SSL certificate.

---

## Step 3: Domain DNS Configuration

Log in to your DNS provider (Cloudflare, Namecheap, GoDaddy, Hostinger, AWS Route53) and configure **A Records** pointing to your VPS IP address:

| Type  | Host / Name          | Target / Value  | Purpose                        |
| :---- | :------------------- | :-------------- | :----------------------------- |
| **A** | `@` (yourdomain.com) | `<YOUR_VPS_IP>` | Client Website (`apps/client`) |
| **A** | `www`                | `<YOUR_VPS_IP>` | Client Website fallback        |
| **A** | `api`                | `<YOUR_VPS_IP>` | Backend REST API (`apps/api`)  |
| **A** | `admin`              | `<YOUR_VPS_IP>` | Admin Portal (`apps/web`)      |
| **A** | `coolify`            | `<YOUR_VPS_IP>` | Coolify Dashboard              |

> [!IMPORTANT]
> **Cloudflare Note:**
> During initial deployment, set the proxy status to **DNS Only (Grey Cloud)** so that Coolify's Traefik reverse proxy can validate the ACME HTTP challenge directly. Once the SSL certificates are generated, you can toggle **Proxied (Orange Cloud)** back on and select **Full (strict)** SSL/TLS encryption in Cloudflare.

Verify DNS resolution from your workstation:

```bash
ping yourdomain.com
ping api.yourdomain.com
ping admin.yourdomain.com
```

---

## Step 4: Connect Your Git Repository

To deploy private GitHub / GitLab repositories:

### Option 1: GitHub App (Recommended - Native Webhooks & Auto Deploys)

1. In Coolify, go to **Keys & Tokens** -> **Git Sources** -> **Add New**.
2. Select **GitHub App**.
3. Follow the guided prompt to install the Coolify App on your GitHub account or organization and grant repository access.

### Option 2: Deploy Key (SSH Key)

1. In Coolify, go to **Keys & Tokens** -> **Security Keys** -> Select default key -> Copy the **Public Key**.
2. Go to your GitHub repository -> **Settings** -> **Deploy Keys** -> **Add deploy key**.
3. Paste the public key, title it `Coolify VPS Key` (read-only is sufficient) -> Click **Add key**.

---

## Step 5: Create Project & Deploy Databases

1. From the Coolify main navigation, click **Projects** -> **+ Add** -> Title it `Production Monorepo` -> Click **Continue**.
2. Select the `production` environment.

### 5.1. Deploy PostgreSQL 16

1. Click **+ New Resource** -> Select **PostgreSQL**.
2. Set up initial parameters:
   - **Name**: `monorepo-postgres`
   - **Postgres Image**: `postgres:16-alpine`
   - **Postgres Database**: `monorepo`
   - **Postgres User**: `postgres`
   - **Postgres Password**: Specify a strong password (e.g., `Pg_Pr0d_SecuRe#9982`)
3. Under the **Configuration** tab:
   - Note the **Internal Hostname** (typically `monorepo-postgres:5432` or the service UUID).
4. Click **Start** and ensure the status changes to green (**Running**).

### 5.2. Deploy Redis 7

1. Click **+ New Resource** -> Select **Redis**.
2. Configure parameters:
   - **Name**: `monorepo-redis`
   - **Redis Image**: `redis:7-alpine`
   - **Redis Password**: Enter a password (or leave blank if strictly kept inside internal network)
3. Click **Start** and confirm it is **Running**.

> [!TIP]
> All containers created under the same Coolify project share an isolated Docker bridge network (`coolify`). Applications communicate over internal hostnames without needing to expose database ports to the public internet.

---

## Step 6: Deploy Backend API Service (`apps/api`)

1. In the `Production Monorepo` project, click **+ New Resource** -> Select your **Git Repository**.
2. Select branch `main`.
3. Configure the following deployment parameters:

### 6.1. General Configuration

| Field                  | Configuration Value          | Explanation                                                               |
| :--------------------- | :--------------------------- | :------------------------------------------------------------------------ |
| **Name**               | `API Backend`                | Service name                                                              |
| **Build Pack**         | `Dockerfile`                 | Use existing Dockerfile                                                   |
| **Base Directory**     | `/`                          | **Must be `/`**: Monorepo context requires access to root workspace files |
| **Dockerfile Path**    | `apps/api/Dockerfile`        | Path to the API Dockerfile                                                |
| **Target Build Stage** | `production`                 | Final production stage                                                    |
| **Domains**            | `https://api.yourdomain.com` | Traefik provisions SSL automatically                                      |
| **Ports Exposes**      | `3000`                       | Target port exposed in Dockerfile                                         |

### 6.2. Persistent Storage Configuration

Navigate to the **Storages** tab -> Click **+ Add**:

- **Name**: `api-storage`
- **Source Path** (on host): Default or `/data/coolify/applications/api/storage`
- **Destination Path** (in container): `/app/storage`

> [!IMPORTANT]
> This persistent volume ensures uploaded assets, avatars, and attachments (`/app/storage/public`, `/app/storage/avatars`) are safely preserved across redeployments and container rebuilds.

### 6.3. Environment Variables

Navigate to the **Environment Variables** tab, switch to **Developer View**, and paste the following block:

```env
# ==============================================================================
# Application & Environment
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
# Database (PostgreSQL)
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
# Redis Cache & Queue
# ==============================================================================
REDIS_HOST=monorepo-redis
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_TLS_ENABLED=false

# ==============================================================================
# Mailer (SMTP Configuration)
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
# Storage Disk
# ==============================================================================
FILESYSTEM_DISK=public

# ==============================================================================
# JWT Authentication Secrets (Min 32 characters each)
# ==============================================================================
AUTH_JWT_SECRET=ReplaceWithSecureRandomStringAtLeast32CharactersLong11111111111
AUTH_JWT_TOKEN_EXPIRES_IN=1d
AUTH_REFRESH_SECRET=ReplaceWithSecureRandomStringAtLeast32CharactersLong22222222222
AUTH_REFRESH_TOKEN_EXPIRES_IN=365d
AUTH_FORGOT_SECRET=ReplaceWithSecureRandomStringAtLeast32CharactersLong33333333333
AUTH_FORGOT_TOKEN_EXPIRES_IN=15m
AUTH_CONFIRM_EMAIL_SECRET=ReplaceWithSecureRandomStringAtLeast32CharactersLong44444444444
AUTH_CONFIRM_EMAIL_TOKEN_EXPIRES_IN=1d

USER_AUTH_JWT_SECRET=ReplaceWithSecureRandomStringAtLeast32CharactersLong55555555555
USER_AUTH_JWT_TOKEN_EXPIRES_IN=15m
USER_AUTH_REFRESH_SECRET=ReplaceWithSecureRandomStringAtLeast32CharactersLong66666666666
USER_AUTH_REFRESH_TOKEN_EXPIRES_IN=365d
USER_AUTH_FORGOT_SECRET=ReplaceWithSecureRandomStringAtLeast32CharactersLong77777777777
USER_AUTH_FORGOT_TOKEN_EXPIRES_IN=7d
USER_AUTH_CONFIRM_EMAIL_SECRET=ReplaceWithSecureRandomStringAtLeast32CharactersLong88888888888
USER_AUTH_CONFIRM_EMAIL_TOKEN_EXPIRES_IN=1d

# Client Portal Authentication Redirects
AUTH_PORTAL_URL=https://admin.yourdomain.com
AUTH_PORTAL_RESET_PASSWORD_URL=https://admin.yourdomain.com/reset-password
USER_AUTH_CLIENT_URL=https://yourdomain.com
USER_AUTH_CLIENT_RESET_PASSWORD_URL=https://yourdomain.com/auth/reset-password

# ==============================================================================
# Bull Board & Queue Monitoring
# ==============================================================================
BULL_BOARD_PATH=/queues
ADMIN_PANEL_USERNAME=superadmin
ADMIN_PANEL_PASSWORD=SuperSecureAdminPassword123!
```

4. Click **Save**.
5. Click **Deploy** in the top right corner.
6. Monitor the deployment build log. Once complete, the service status turns **Running**.

---

## Step 7: Run Migrations, Sync Permissions & Seed Database

After deploying the API, initialize the database schema, insert system permissions, and seed the default administrator.

### Method 1: Via Coolify Web Terminal (Recommended)

1. In Coolify, open the **API Backend** resource.
2. Click the **Terminal** (or **Exec**) tab.
3. Select shell `sh` or `bash` and click **Connect**.
4. Run the three initialization commands:

```bash
# 1. Execute TypeORM production migrations
npm run migration:run:prod

# 2. Synchronize all system permission definitions
npm run permissions:sync:prod

# 3. Seed default admin account and initial data
npm run seed:run:prod
```

### Method 2: Via Host VPS SSH

If you are logged into the VPS via SSH:

```bash
# Locate the container name
docker ps --filter "name=api" --format "{{.Names}}"

# Run migrations
docker exec -it <API_CONTAINER_NAME> npm run migration:run:prod

# Sync permissions
docker exec -it <API_CONTAINER_NAME> npm run permissions:sync:prod

# Seed database
docker exec -it <API_CONTAINER_NAME> npm run seed:run:prod
```

---

## Step 8: Deploy Client Website (`apps/client`)

`apps/client` is a **Next.js 15** application utilizing `standalone` output mode.

1. In `Production Monorepo`, click **+ New Resource** -> Select your Git Repository.
2. Configure settings:

| Field                  | Configuration Value                                  |
| :--------------------- | :--------------------------------------------------- |
| **Name**               | `Client Website`                                     |
| **Build Pack**         | `Dockerfile`                                         |
| **Base Directory**     | `/`                                                  |
| **Dockerfile Path**    | `apps/client/Dockerfile`                             |
| **Target Build Stage** | `production`                                         |
| **Domains**            | `https://yourdomain.com, https://www.yourdomain.com` |
| **Ports Exposes**      | `3000`                                               |

### Environment Variables

```env
PORT=3000
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_SOCKET_URL=https://api.yourdomain.com
NEXT_PUBLIC_ADMIN_PORTAL_URL=https://admin.yourdomain.com

# Internal direct API calls during Server-Side Rendering
SERVER_API_URL=http://monorepo-api:3000
TOKEN_EXPIRY_MINUTES_REMAINING=1m
APP_NAME="Visel"
NEXT_PUBLIC_ENABLE_WHITE_LABEL=true

# Localization
NEXT_PUBLIC_USE_CASE=as-needed
NEXT_PUBLIC_APP_LOCALE=en
NEXT_PUBLIC_FALLBACK_LOCALE=en
NEXT_PUBLIC_ALLOWED_LOCALE=en,vi
```

> [!IMPORTANT]
> **CRITICAL FOR NEXT.JS BUILDS:**
> For every variable beginning with `NEXT_PUBLIC_*`, you **MUST check the "Available during build" (or "Build Variable") checkbox** in the Coolify Environment Variables interface.
> Next.js bundles `NEXT_PUBLIC_*` values statically into browser JS chunks during `pnpm build`. Without this flag, client components will fail to reach the backend API.

Click **Save** and click **Deploy**.

---

## Step 9: Deploy Admin Portal (`apps/web`)

`apps/web` is a React SPA built with **Vite**, served as static assets by **Nginx** with automatic SPA route fallbacks.

1. In `Production Monorepo`, click **+ New Resource** -> Select your Git Repository.
2. Configure settings:

| Field                  | Configuration Value            |
| :--------------------- | :----------------------------- |
| **Name**               | `Admin Portal`                 |
| **Build Pack**         | `Dockerfile`                   |
| **Base Directory**     | `/`                            |
| **Dockerfile Path**    | `apps/web/Dockerfile`          |
| **Target Build Stage** | `production`                   |
| **Domains**            | `https://admin.yourdomain.com` |
| **Ports Exposes**      | `80`                           |

### Environment Variables

```env
PORT=80
VITE_API_URL=https://api.yourdomain.com/api/v1
VITE_APP_NAME=Animazing
VITE_SOCKET_URL=https://api.yourdomain.com
VITE_CLIENT_URL=https://yourdomain.com
VITE_AUTH_KEY=Animazing_AUTH_KEY
```

> [!IMPORTANT]
> **CRITICAL FOR VITE:**
> Vite compiles all `VITE_*` environment variables during build time. You **MUST** check **"Available during build" (Build Variable)** for all `VITE_*` variables in Coolify before triggering the deployment.

Click **Save** and click **Deploy**.

---

## Step 10: Automate CI/CD & Auto Deployment

To trigger deployments automatically whenever code is pushed to `main`:

1. Open each application (`API Backend`, `Client Website`, `Admin Portal`).
2. Navigate to the **Webhooks** tab.
3. If connected via **GitHub App**, push events are intercepted automatically.
4. If using Deploy Keys:
   - Copy the **Deploy Webhook URL**.
   - Navigate to GitHub Repository -> **Settings** -> **Webhooks** -> **Add webhook**.
   - Paste into **Payload URL**, set Content Type to `application/json`, select `Just the push event` -> Click **Add webhook**.
5. Enable **Zero Downtime Deployments (Rolling Update)** in the application settings so container replacement causes zero user disruption.

---

## Step 11: Smoke Testing & Verification Checklist

Run these HTTP requests from your machine or terminal to verify end-to-end routing:

```bash
# 1. API Health Check
curl -f -I https://api.yourdomain.com/api/v1/health

# 2. Client Website
curl -f -I https://yourdomain.com

# 3. Admin Portal
curl -f -I https://admin.yourdomain.com
```

### Manual Verification Checklist

- [ ] **SSL Certificates:** Verify valid Let's Encrypt padlocks on all three domains.
- [ ] **Admin Authentication:** Log in at `https://admin.yourdomain.com` with the seeded credentials, verify permissions and menu rendering.
- [ ] **SPA Route Refresh:** Press F5 on a sub-route like `https://admin.yourdomain.com/users`; verify that Nginx serves `index.html` without 404 errors.
- [ ] **Persistent Uploads:** Upload an avatar or file, verify it persists in `/app/storage/public` and is accessible via HTTP.
- [ ] **Next.js SSR:** View the HTML source of `https://yourdomain.com` to confirm that server-rendered content is present in the initial payload.

---

## Step 12: Set Up Automated Scheduled Backups

To protect against data loss, configure automated PostgreSQL backups:

1. Open the **PostgreSQL** resource (`monorepo-postgres`).
2. Go to the **Backups** tab.
3. Toggle **Enabled** to ON.
4. Configure the backup schedule:
   - **Cron Expression**: `0 2 * * *` (Daily at 02:00 AM server time).
   - **Backup Retention**: `7` (Retain the last 7 daily snapshots).
5. (Recommended) Configure remote **S3 Storage** (AWS S3, Cloudflare R2, Backblaze B2) to store backups offsite.
6. Click **Save**. Click **Backup Now** to verify backup creation.

---

## Troubleshooting & FAQ

### 1. Build Fails with Exit Code 137 (`OOM Killed`)

- **Cause:** System ran out of physical memory while compiling Next.js or Vite.
- **Resolution:** Verify swap memory with `free -h`. Ensure a 4GB swapfile was properly created following [Step 1.2](#12-create-4gb-swapfile-ram-oom-protection).

### 2. Browser Reports CORS Errors

- **Symptom:** `Access to fetch at ... blocked by CORS policy`.
- **Resolution:** Check `APP_CORS_ORIGIN` in the API environment variables. Ensure each origin includes the scheme (`https://`) and has no trailing slash (e.g., `https://yourdomain.com,https://www.yourdomain.com,https://admin.yourdomain.com`). Restart the API container after saving changes.

### 3. Client Frontend Cannot Connect to Backend API

- **Symptom:** Blank screen or network error on the client app.
- **Resolution:** The `NEXT_PUBLIC_API_URL` variable was not flagged as **"Available during build"** in Coolify. Check the box and trigger a **Redeploy**.

### 4. Let's Encrypt Certificate Issuance Fails

- **Cause:** Traefik cannot resolve the domain on port 80 to complete the ACME HTTP challenge.
- **Checks:**
  1. Confirm DNS A records point directly to your VPS IP (`ping api.yourdomain.com`).
  2. Confirm ports 80 and 443 are allowed in UFW (`ufw status`).
  3. If using Cloudflare, toggle proxy mode to DNS Only (Grey Cloud) temporarily.

### 5. 413 "Payload Too Large" on Large File Uploads

- **Resolution:** Under Coolify -> **API Backend** -> **Configuration**, add a custom Traefik or Nginx directive to raise upload thresholds (`client_max_body_size 50M;`).

---

## Quick Reference Commands

```bash
# Install Coolify on a fresh VPS
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash

# Run migrations & seeds inside the API container
npm run migration:run:prod
npm run permissions:sync:prod
npm run seed:run:prod

# View live API container logs on the VPS
docker logs -f --tail 100 <API_CONTAINER_NAME>
```
