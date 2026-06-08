# ============================================================
# Zaneva AI Content Studio - Docker Image
# Multi-stage build for Next.js with Prisma 7 + Playwright
# ============================================================

# Stage 1: Dependencies
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10 --activate

# Copy package files and workspace config
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Install dependencies and generate Prisma client
RUN pnpm install --frozen-lockfile
RUN npx prisma generate

# Stage 2: Build
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Accept build args for env variables needed during build
ARG DATABASE_URL=postgresql://user:password@localhost:5432/db
ARG UPLOAD_DIR
ARG NEXT_PUBLIC_APP_URL

ENV DATABASE_URL=${DATABASE_URL}
ENV UPLOAD_DIR=${UPLOAD_DIR}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}

# Re-generate Prisma client with full source context
RUN npx prisma generate

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN pnpm build

# Stage 3: Production - Playwright official image with Chromium pre-installed
FROM mcr.microsoft.com/playwright:v1.60.0-noble AS runner

# Install Node.js
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10 --activate

# Set Playwright to use pre-installed Chromium
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=pwuser:pwuser /app/.next/standalone ./
COPY --from=builder --chown=pwuser:pwuser /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# Copy node_modules and fix permissions for Prisma
COPY --from=builder /app/node_modules ./node_modules
RUN chmod -R 777 /app/node_modules/.pnpm/@prisma+engines*/node_modules/@prisma/engines 2>/dev/null || true && \
    chmod -R 777 /app/node_modules/@prisma 2>/dev/null || true

# Create uploads directory
RUN mkdir -p uploads/projects uploads/generated uploads/debug && chown -R pwuser:pwuser uploads

USER pwuser

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Sync schema on startup
CMD ["sh", "-c", "node node_modules/prisma/build/index.js db push --accept-data-loss && node server.js"]
