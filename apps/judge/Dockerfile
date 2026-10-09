FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json turbo.json tsconfig.base.json ./
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/executor/package.json ./packages/executor/
COPY apps/backend/package.json ./apps/backend/
COPY apps/judge/package.json ./apps/judge/
COPY apps/frontend/package.json ./apps/frontend/
RUN npm install --no-audit --no-fund

COPY packages/ ./packages/
COPY apps/backend/prisma/ ./apps/backend/prisma/
COPY apps/judge/ ./apps/judge/
RUN npm --workspace backend run db:generate
RUN npm run build -- --filter=judge...

FROM node:20-alpine AS runner
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/judge/package.json ./apps/judge/package.json
COPY --from=builder /app/apps/judge/dist ./apps/judge/dist
WORKDIR /app/apps/judge
CMD ["npm", "run", "start"]
