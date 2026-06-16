# Dockerfile for the Next.js app (pnpm monorepo). Build context = repo root.
FROM node:22-alpine AS base
RUN corepack enable

# Install deps + build
FROM base AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Workspace manifests first for a cached install layer.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/package.json
RUN pnpm install --frozen-lockfile --ignore-scripts

# Copy source and build the web app.
COPY apps/web/ ./apps/web/
RUN pnpm --filter @ikg/web exec next build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Monorepo standalone output keeps the workspace path (apps/web/server.js).
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]
