FROM node:24-alpine AS builder
WORKDIR /app

COPY package*.json turbo.json tsconfig.base.json ./
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/executor/package.json ./packages/executor/
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/backend/package.json ./apps/backend/
COPY apps/judge/package.json ./apps/judge/
RUN npm ci --no-audit --no-fund

COPY packages/ ./packages/
COPY apps/frontend/ ./apps/frontend/
ARG VITE_API_URL=http://localhost:6868/api/v1
ARG VITE_SOCKET_URL=http://localhost:6868
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_SOCKET_URL=${VITE_SOCKET_URL}
RUN npm run build -- --filter=frontend...

FROM nginx:alpine AS runner
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
