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

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_ADMIN_PORTAL_URL
ARG NEXT_PUBLIC_ALLOWED_LOCALE
ARG NEXT_PUBLIC_APP_LOCALE
ARG NEXT_PUBLIC_ENABLE_WHITE_LABEL
ARG NEXT_PUBLIC_USE_CASE
ARG NEXT_PUBLIC_SENTRY_DNS_NEXTJS
ARG NEXT_PUBLIC_SENTRY_ENVIRONMENT

ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_ADMIN_PORTAL_URL=${NEXT_PUBLIC_ADMIN_PORTAL_URL}
ENV NEXT_PUBLIC_ALLOWED_LOCALE=${NEXT_PUBLIC_ALLOWED_LOCALE}
ENV NEXT_PUBLIC_APP_LOCALE=${NEXT_PUBLIC_APP_LOCALE}
ENV NEXT_PUBLIC_ENABLE_WHITE_LABEL=${NEXT_PUBLIC_ENABLE_WHITE_LABEL}
ENV NEXT_PUBLIC_USE_CASE=${NEXT_PUBLIC_USE_CASE}
ENV NEXT_PUBLIC_SENTRY_DNS_NEXTJS=${NEXT_PUBLIC_SENTRY_DNS_NEXTJS}
ENV NEXT_PUBLIC_SENTRY_ENVIRONMENT=${NEXT_PUBLIC_SENTRY_ENVIRONMENT}

COPY . .
RUN pnpm --filter client build

FROM node:20.19-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/client/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/client/.next/static ./apps/client/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/client/public ./apps/client/public

USER nextjs
EXPOSE 3000

CMD ["node", "apps/client/server.js"]
