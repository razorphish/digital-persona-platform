# Next.js Frontend Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/database/package.json ./packages/database/
COPY apps/web/package.json ./apps/web/

# Install ALL dependencies (including devDependencies for development)
RUN npm ci

# Development target with all dependencies
FROM deps AS development
WORKDIR /app

# Copy source files for development
COPY package*.json ./
COPY turbo.json ./
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/

# Set development environment
ENV NODE_ENV=development
EXPOSE 4000
# Use next dev for development hot reload
CMD ["sh", "-c", "cd apps/web && npm run dev"]

# Production dependencies only
FROM node:20-alpine AS deps-prod
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/database/package.json ./packages/database/
COPY apps/web/package.json ./apps/web/

# Install only production dependencies
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules

# Copy source files
COPY package*.json ./
COPY turbo.json ./
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/

# Build shared packages first
RUN npm run build --workspace=@digital-persona/shared

# Build Next.js - copy node_modules to web directory and build
WORKDIR /app/apps/web

# Debug: List directory structure to verify files are copied correctly
RUN echo "=== Debugging: Current directory contents ===" && \
    pwd && \
    ls -la && \
    echo "=== src directory contents ===" && \
    ls -la src/ && \
    echo "=== src/lib directory contents ===" && \
    ls -la src/lib/ && \
    echo "=== tsconfig.json contents ===" && \
    cat tsconfig.json && \
    echo "=== End debugging ==="

COPY --from=deps /app/node_modules ./node_modules
RUN npm run build

# Change back to root for subsequent operations
WORKDIR /app

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs

EXPOSE 4000

ENV PORT 4000

CMD ["node", "apps/web/server.js"] 