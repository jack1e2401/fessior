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

Phase 2 replaces the incomplete historical migration chain with one baseline. The baseline now also removes duplicated match player/status columns; participants live in `match_participants`. This repo has no production migration compatibility requirement, and the user approved resetting its dev database. Do not apply this baseline to a database with data that must be retained; it does not backfill old testcase, submission, or match rows.

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
If Docker Hub times out while downloading an image, the command retries the Compose startup up to three times. A persistent timeout still requires fixing Docker Desktop's network or proxy connection.

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
- **Deploy migrations to MySQL**:
  ```bash
  npm run db:migrate
  ```
- **Reset only the disposable dev database after changing from the old migration history**:
  ```bash
  docker compose --env-file .env -f infra/docker-compose.yml up -d --wait mysql
  npm run db:reset-dev
  npm run seed
  ```
  `db:reset-dev` deletes all data and refuses any target except `localhost:3307/ocj_main_db`. Confirm `.env` points to the intended dev database first. The root `npm run dev` now uses `db:migrate`; `db:push` remains an explicit schema prototyping command.
- **Seed Demo Data** (users, problems, testcases):
  ```bash
  npm run seed
  ```

---

## 5. Testing & Code Quality

### Unit Tests (Fast, In-Memory, No Infrastructure Required)
```bash
npm --workspace api run test:unit
```
Verifies route middleware ordering, matchmaking pairing & queue logic, and submission pinning without database access.

### Integration Tests (Requires MySQL on localhost:3307)
```bash
npm --workspace api run test:integration
```
The Phase 2 integration test checks set version uniqueness, copy-on-write testcase edits, and that a submission keeps its pinned set after the active set changes.

The worker lookup test uses the same database:
```bash
npm --workspace judge-worker run test:integration
```

`npm test` also runs the worker integration test through Turbo. Start the disposable dev MySQL database and deploy migrations before running the full suite.
The web workspace currently has no test files; its Vitest script exits successfully while still running any tests added later.

The Backend HTTP Service Docker image runs `prisma migrate deploy` before starting the server, matching the local migration workflow. Do not use `db:push` to start the container.

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
| **Backend HTTP Service** | `http://localhost:6868` |
| **Swagger UI** | `http://localhost:6868/api-docs` |

| **MySQL Database** | `localhost:3307` |
| **Redis** | `localhost:6379` |
| **Judge0 Sandbox** | `http://localhost:2358` |

The OpenAPI source lives in `apps/api/src/docs/openapi/`. Update the relevant module file when changing an HTTP route; route files contain no Swagger annotations.

### Phase 3 ZIP import smoke test

Sign in as an administrator and send a ZIP with `manifest.json` and paired `cases/*.in`/`cases/*.out` files as the single `archive` multipart field to `POST /api/v1/problems/:problemId/testcase-sets/import`. See [testcase-ingestion.md](testcase-ingestion.md) for the schema and limits. The Backend HTTP Service writes the upload to temporary disk and removes it after the response. The Judge Worker uses each submission's pinned set; the Web Frontend needs no change for this backend verification.
