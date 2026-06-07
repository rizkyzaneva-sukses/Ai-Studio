# ============================================================
# Zaneva AI Content Studio - Docker Image
# Multi-stage build for Next.js with Prisma 7
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

# Stage 3: Production
FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# Prisma 7 with driver adapter: copy full node_modules for external packages
# pnpm uses symlinks, so we need the full structure for @prisma, pg, etc.
COPY --from=builder /app/node_modules ./node_modules

# Create uploads directory
RUN mkdir -p uploads/projects uploads/generated && chown -R nextjs:nodejs uploads

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Sync schema on startup since this project does not ship Prisma migrations yet
CMD ["sh", "-c", "node node_modules/prisma/build/index.js db push && node server.js"]
