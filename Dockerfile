# Single-image deploy (e.g. Railway): Next.js frontend + .NET agent.
# Monorepo layout: web at apps/web (pnpm), agent at apps/agent (.NET/NuGet).

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

ENV NODE_OPTIONS="--max-old-space-size=4096"
# Next.js 16+ uses Turbopack by default; use --webpack for serverExternalPackages compat
RUN pnpm --filter @ikg/web exec next build --webpack

# Stage 2: Build the .NET agent
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS agent-build

WORKDIR /src

# Copy only the project file first for a cached restore layer.
COPY apps/agent/IndustrialKgAgent.csproj ./apps/agent/
RUN dotnet restore ./apps/agent/IndustrialKgAgent.csproj

# Copy agent source (after restore, to preserve the cache layer) and publish.
COPY apps/agent/ ./apps/agent/
RUN dotnet publish ./apps/agent/IndustrialKgAgent.csproj -c Release -o /app/publish --no-restore

# Stage 3: Production image — ASP.NET Core runtime + Node (for the Next.js standalone server)
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runner

# Install Node.js 20
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl ca-certificates && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the published agent.
COPY --from=agent-build /app/publish ./agent/

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
