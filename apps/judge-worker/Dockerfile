FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json turbo.json tsconfig.base.json ./
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/executor/package.json ./packages/executor/
COPY apps/api/package.json ./apps/api/
COPY apps/judge-worker/package.json ./apps/judge-worker/
COPY apps/web/package.json ./apps/web/
RUN npm install --no-audit --no-fund

COPY packages/ ./packages/
COPY apps/api/prisma/ ./apps/api/prisma/
COPY apps/judge-worker/ ./apps/judge-worker/
RUN npm --workspace api run db:generate
RUN npm run build -- --filter=judge-worker...

FROM node:20-alpine AS runner
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/judge-worker/package.json ./apps/judge-worker/package.json
COPY --from=builder /app/apps/judge-worker/dist ./apps/judge-worker/dist
WORKDIR /app/apps/judge-worker
CMD ["npm", "run", "start"]
