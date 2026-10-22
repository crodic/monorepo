# syntax=docker/dockerfile:1.7

FROM node:26-alpine AS base
WORKDIR /app

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN npm install -g pnpm@11.25.0

FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages ./packages
COPY apps/api/package.json ./apps/api/package.json
COPY apps/client/package.json ./apps/client/package.json
COPY apps/web/package.json ./apps/web/package.json
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
  pnpm install --frozen-lockfile

FROM deps AS builder
ENV NODE_ENV=production

COPY . .
RUN pnpm --filter web build

FROM nginx:1.27-alpine AS production

COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

RUN apk add --no-cache libcap && \
  setcap 'cap_net_bind_service=+ep' /usr/sbin/nginx && \
  touch /var/run/nginx.pid && \
  chown -R nginx:nginx /var/run/nginx.pid /usr/share/nginx/html /var/cache/nginx /etc/nginx /var/log/nginx

USER nginx

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
