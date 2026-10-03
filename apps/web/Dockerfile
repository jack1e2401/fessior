FROM node:20-alpine
WORKDIR /app

COPY package*.json turbo.json tsconfig.base.json ./
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/executor/package.json ./packages/executor/
COPY apps/api/package.json ./apps/api/
COPY apps/judge-worker/package.json ./apps/judge-worker/
COPY apps/web/package.json ./apps/web/
RUN npm install --no-audit --no-fund

COPY packages/ ./packages/
COPY apps/web/ ./apps/web/
EXPOSE 5173
CMD ["npm", "--workspace", "web", "run", "dev", "--", "--host", "0.0.0.0"]
