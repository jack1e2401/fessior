# Development Guide

This guide covers local environment setup, configuration invariants, and verification workflows for Fessior.

---

## 1. Prerequisites

- **Node.js**: Compatible with npm `10.9.2`.
- **npm**: `10.9.2` (enforced via `packageManager` in `package.json`).
- **Docker & Docker Compose**: Used to run MySQL 8, Redis 7, and the Judge0 sandbox.

---

## 2. Unified Environment Configuration

Fessior enforces a **single, unified environment configuration** with **zero split environment files**:
- Template: `.env.example` at the repository root.
- Runtime file: `.env` at the repository root (git-ignored).

### Fail-Early Typed Validation
Both `apps/api` and `apps/judge-worker` parse and validate environment variables at startup using **Zod** (`src/config/env.ts`):
- `DATABASE_URL`: Required valid connection string.
- `REDIS_HOST` & `REDIS_PORT`: Required connection parameters in both API and worker.
- `JUDGE0_URL`: Required valid URL.
- `JWT_ACCESS_SECRET` & `JWT_REFRESH_SECRET`: Required strings of **at least 32 characters**.

> **Invariant**: No `process.env` access exists outside `src/config/env.ts`. If required variables or secrets are missing or malformed, the application refuses to start immediately.

The root Prisma helper scripts load `.env` and fail if `DATABASE_URL` is absent. Docker Compose is invoked with `--env-file .env` and requires `MYSQL_ROOT_PASSWORD` and `MYSQL_DATABASE` when constructing container connection strings. `.env.example` contains local sample values, including JWT secrets; replace the secrets for any shared or deployed environment.

### Initial Setup
```bash
cp .env.example .env
npm install
npm run db:generate
```

---

## 3. Development Workflows

### Option A: Hybrid Dev (Recommended for Daily Coding)
Spins up MySQL, Redis, and Judge0 in Docker containers, and runs web, API, and judge-worker as local Node processes:
```bash
npm run dev
# or explicitly:
npm run dev:hybrid
```

### Option B: Local Services Only
If MySQL and Redis are already running locally:
```bash
npm run dev:local
```

### Option C: Full Docker Compose
Runs all services (infrastructure + web + API + judge-worker) containerized:
```bash
npm run dev:docker
```

---

## 4. Database & Seed Operations

- **Generate Prisma Client**:
  ```bash
  npm run db:generate
  ```
- **Push Prisma Schema to MySQL**:
  ```bash
  npm run db:push
  ```
- **Seed Demo Data** (Users, tags, problems, testcases):
  ```bash
  npm run seed
  ```

---

## 5. Testing & Code Quality

### Unit Tests (Fast, In-Memory, No Infrastructure Required)
```bash
npm --workspace api run test:unit
```
Verifies route middleware ordering, matchmaking pairing & queue logic, and submission orchestration with zero network calls.

### Integration Tests (Requires MySQL on localhost:3307)
```bash
npm --workspace api run test:integration
```

### Monorepo Build (Turbo)
```bash
npm run build
```

### Linting & Formatting
```bash
npm run lint
npm run format
```

---

## 6. Local Service URLs

| Service | Address |
| --- | --- |
| **Web Frontend** | `http://localhost:5173` |
| **API Server** | `http://localhost:6868` |
| **Swagger UI** | `http://localhost:6868/api-docs` |
| **MySQL Database** | `localhost:3307` |
| **Redis** | `localhost:6379` |
| **Judge0 Sandbox** | `http://localhost:2358` |
