FROM node:24-alpine AS base
ENV NODE_USE_ENV_PROXY=1
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages ./packages
COPY apps/worker ./apps/worker
RUN pnpm install --frozen-lockfile

FROM deps AS build
RUN pnpm --filter @beyoracle/worker... build \
 && pnpm --filter @beyoracle/worker deploy --prod /out

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NODE_USE_ENV_PROXY=1
COPY --from=build /out ./
CMD ["node", "dist/index.js"]
