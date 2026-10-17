# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS base

RUN corepack enable && \
    corepack prepare pnpm@11.0.9 --activate

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NODE_OPTIONS="--max-old-space-size=1536"
ENV NODE_OPTIONS=$NODE_OPTIONS
RUN --mount=type=secret,id=app_env,target=/app/.env,required=true \
    pnpm build && \
    rm -f .next/standalone/.env .next/standalone/.env.*

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
