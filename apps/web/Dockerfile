FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages ./packages
COPY apps/web ./apps/web
COPY apps/ripbeys ./apps/ripbeys
RUN pnpm install --frozen-lockfile

FROM deps AS build
# Empty base keeps consumer Oracle calls on the same origin: /api/...
ENV VITE_REQUIEM_API_BASE=
RUN pnpm --filter @beyoracle/shared build \
 && pnpm --filter @beyoracle/db build \
 && pnpm --filter @beyoracle/events build \
 && pnpm --filter @beyoracle/catalog build \
 && pnpm --filter @beyoracle/oracle build \
 && pnpm --filter @beyoracle/ingest build \
 && pnpm --filter @ripbeys/web build \
 && rm -rf apps/web/public \
 && mkdir -p apps/web/public \
 && cp -a apps/ripbeys/dist/. apps/web/public/ \
 && pnpm --filter @beyoracle/web build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public
# Seed JSON is read from the catalog package at runtime, beside its compiled dist.
COPY --from=build /app/packages/catalog/data ./packages/catalog/data
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
