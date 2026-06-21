# syntax=docker/dockerfile:1

# Single shared base for both stages so the better-sqlite3 native binding
# compiled in the builder is ABI-compatible when copied into the runner.
FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# ---------------------------------------------------------------------------
# Builder: install deps, generate Prisma client, seed the template DB, build.
# IMPORTANT: DATABASE_URL must stay UNSET here. `prisma db push` (via
# prisma.config.ts) and the seed (via lib/db.ts) only agree on prisma/dev.db
# when the env is unset.
# ---------------------------------------------------------------------------
FROM base AS builder

# Build toolchain for the better-sqlite3 native addon.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# Build the seeded template DB (settings + factories only), then the app.
# Order matters: the DB must exist before `next build` in case any route reads
# it during prerender.
RUN pnpm db:generate \
  && pnpm db:push \
  && SEED_SAMPLES=false pnpm db:seed \
  && pnpm build \
  && cp prisma/dev.db /app/seed.db

# ---------------------------------------------------------------------------
# Runner: copy only the standalone server output (traced node_modules incl. the
# better-sqlite3 native binding and the Prisma client). No package manager and
# no full node_modules — keeps the image small (~300-400MB vs ~1GB).
# ---------------------------------------------------------------------------
FROM base AS runner

ENV NODE_ENV=production
ENV DATABASE_URL=file:/data/app.db
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Next.js standalone output: server.js + the minimal traced node_modules.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
# Seeded template DB + first-run entrypoint.
COPY --from=builder /app/seed.db ./seed.db
COPY --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

VOLUME ["/data"]
EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
