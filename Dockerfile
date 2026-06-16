# Single-image deploy (e.g. Railway): Next.js frontend + Python agent.
# Monorepo layout: web at apps/web (pnpm), agent at apps/agent (uv workspace).

# Stage 1: Build Next.js frontend (pnpm workspace)
FROM node:20-slim AS frontend

RUN corepack enable
WORKDIR /app

# Copy only the manifests first for a cached install layer.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/package.json
RUN pnpm install --frozen-lockfile --ignore-scripts

# Copy the web app source.
COPY apps/web/ ./apps/web/

# Docker override: use AG-UI HttpAgent instead of LangGraphAgent
# (LangGraphAgent needs Docker-in-Docker which Railway doesn't provide).
# Next.js 16+ rejects both route.ts AND [[...slug]]/route.ts in one dir.
RUN rm -f ./apps/web/src/app/api/copilotkit/\[\[...slug\]\]/route.ts
COPY apps/web/docker-route-override.ts ./apps/web/src/app/api/copilotkit/route.ts
RUN pnpm --filter @ikg/web add @ag-ui/client

ENV NODE_OPTIONS="--max-old-space-size=4096"
# Next.js 16+ uses Turbopack by default; use --webpack for serverExternalPackages compat
RUN pnpm --filter @ikg/web exec next build --webpack

# Stage 2: Production image with Python 3.14 + Node
FROM python:3.14-slim AS runner

# Install Node.js 20
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl ca-certificates && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Install uv by copying from the official image (avoids curl|sh pipe-swallow bug
# where a 5xx on astral.sh silently produces an exit-0 layer with no uv binary).
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /usr/local/bin/

WORKDIR /app

# Copy workspace root manifests + lockfile first for a cached install layer.
COPY pyproject.toml uv.lock .python-version ./
COPY apps/agent/pyproject.toml ./apps/agent/pyproject.toml

# Install production deps only (skip dev group: langgraph-cli/langgraph-api
# require Docker-in-Docker which Railway doesn't provide).
RUN uv sync --package sample-agent --no-group dev --no-install-project

# Copy agent source (after deps are installed to preserve the cache layer).
COPY apps/agent/ ./apps/agent/

# Copy Next.js standalone build. In a monorepo the standalone output preserves
# the workspace path, so server.js lives at apps/web/server.js.
COPY --from=frontend /app/apps/web/.next/standalone ./
COPY --from=frontend /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=frontend /app/apps/web/public ./apps/web/public

COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

EXPOSE 3000
ENV NODE_ENV=production

CMD ["./entrypoint.sh"]
