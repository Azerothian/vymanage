# Multi-stage build for VyManage
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

WORKDIR /app

# Copy package files first for better caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json tsconfig.base.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/config/package.json ./packages/config/
COPY packages/ui/package.json ./packages/ui/
COPY packages/vyos-client/package.json ./packages/vyos-client/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build
RUN pnpm turbo run build

# Production image
FROM nginx:alpine

# Copy static export
COPY --from=builder /app/apps/web/out /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Support VYMANAGE_DEFAULT_HOST env var
COPY docker-entrypoint.sh /docker-entrypoint.d/40-vymanage-config.sh
RUN chmod +x /docker-entrypoint.d/40-vymanage-config.sh

EXPOSE 80 443
