FROM node:20-alpine
WORKDIR /app

COPY package*.json turbo.json tsconfig.base.json ./
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/executor/package.json ./packages/executor/
COPY apps/backend/package.json ./apps/backend/
COPY apps/judge/package.json ./apps/judge/
COPY apps/frontend/package.json ./apps/frontend/
RUN npm install --no-audit --no-fund

COPY packages/ ./packages/
COPY apps/frontend/ ./apps/frontend/
EXPOSE 5173
CMD ["npm", "--workspace", "frontend", "run", "dev", "--", "--host", "0.0.0.0"]
