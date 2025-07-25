# Node.js tRPC Backend Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/

# Install ALL dependencies (including devDependencies for development)
RUN npm ci

# Development target with all dependencies
FROM deps AS development
WORKDIR /app
# Copy all source code for development
COPY . .
# Set development environment
ENV NODE_ENV=development
EXPOSE 4001
# Use tsx for development hot reload
CMD ["sh", "-c", "cd apps/server && npm run dev"]

# Production dependencies only
FROM base AS deps-prod
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/

# Install only production dependencies
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build shared packages first
RUN npm run build --workspace=@digital-persona/shared
RUN npm run build --workspace=@digital-persona/database

# Build the server
RUN npm run build --workspace=server

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/apps/server/dist ./dist
COPY --from=deps-prod --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

USER nodejs

EXPOSE 4001

ENV PORT 4001

CMD ["node", "dist/index.js"] 