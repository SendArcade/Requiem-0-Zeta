FROM node:24-alpine AS base
ENV NODE_USE_ENV_PROXY=1
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages ./packages
COPY apps/web ./apps/web
COPY scripts/assemble-web.mjs ./scripts/assemble-web.mjs
RUN pnpm install --frozen-lockfile

FROM deps AS build
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @beyoracle/web... build && node scripts/assemble-web.mjs

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
COPY --from=build /app/apps/web/.next/standalone ./
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
