FROM node:24-alpine AS builder
WORKDIR /app

COPY package*.json turbo.json tsconfig.base.json ./
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/executor/package.json ./packages/executor/
COPY apps/backend/package.json ./apps/backend/
COPY apps/judge/package.json ./apps/judge/
COPY apps/frontend/package.json ./apps/frontend/
RUN npm ci --no-audit --no-fund

COPY packages/ ./packages/
COPY apps/backend/prisma/ ./apps/backend/prisma/
COPY apps/judge/ ./apps/judge/
RUN npm --workspace backend run db:generate
RUN npm run build -- --filter=judge...

FROM node:24-alpine AS production-deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/frontend/package.json ./apps/frontend/package.json
COPY apps/judge/package.json ./apps/judge/package.json
COPY packages/contracts/package.json ./packages/contracts/package.json
COPY packages/executor/package.json ./packages/executor/package.json
RUN npm ci --omit=dev --no-audit --no-fund \
  --workspace=judge \
  --workspace=@ocj/contracts \
  --workspace=@ocj/executor \
  --include-workspace-root=false

FROM node:24-alpine AS runner
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app
COPY --from=production-deps /app/node_modules ./node_modules
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/packages/contracts/package.json ./packages/contracts/package.json
COPY --from=builder /app/packages/contracts/dist ./packages/contracts/dist
COPY --from=builder /app/packages/executor/package.json ./packages/executor/package.json
COPY --from=builder /app/packages/executor/dist ./packages/executor/dist
COPY --from=builder /app/apps/judge/package.json ./apps/judge/package.json
COPY --from=builder /app/apps/judge/dist ./apps/judge/dist
WORKDIR /app/apps/judge
ENV NODE_ENV=production
CMD ["npm", "run", "start"]
