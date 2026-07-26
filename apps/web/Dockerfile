FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages ./packages
COPY apps/web ./apps/web
RUN pnpm install --frozen-lockfile

FROM deps AS build
RUN pnpm --filter @beyoracle/shared build \
 && pnpm --filter @beyoracle/db build \
 && pnpm --filter @beyoracle/events build \
 && pnpm --filter @beyoracle/catalog build \
 && pnpm --filter @beyoracle/oracle build \
 && pnpm --filter @beyoracle/ingest build \
 && pnpm --filter @beyoracle/web build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/apps/web ./apps/web
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=build /app/pnpm-lock.yaml ./pnpm-lock.yaml
WORKDIR /app/apps/web
EXPOSE 3000
CMD ["sh", "-c", "exec pnpm exec next start -H 0.0.0.0 -p ${PORT:-3000}"]
