# Development Guide

This guide covers local environment setup, configuration invariants, and verification workflows for Fessior.

---

## 1. Prerequisites

- **Node.js**: Compatible with npm `10.9.2`.
- **npm**: `10.9.2` (enforced via `packageManager` in `package.json`).
- **Docker & Docker Compose**: Used to run MySQL 8, Redis 7, and the Judge0 sandbox.

---

## 2. Unified Environment Configuration

Fessior uses one root environment file for application and local infrastructure settings, plus the checked-in Judge0 configuration file:
- Template: `.env.example` at the repository root.
- Runtime file: `.env` at the repository root (git-ignored).
- Judge0 service settings: `infra/judge0/judge0.env.example`.

### Fail-Early Typed Validation
Both `apps/api` and `apps/judge-worker` parse and validate environment variables at startup using **Zod** (`src/config/env.ts`):
- `DATABASE_URL`: Required valid connection string.
- `REDIS_HOST` & `REDIS_PORT`: Required connection parameters in both API and worker.
- `JUDGE0_URL`: Required valid URL.
- `JWT_ACCESS_SECRET` & `JWT_REFRESH_SECRET`: Required strings of **at least 32 characters**.

> **Invariant**: No `process.env` access exists outside `src/config/env.ts`. If required variables or secrets are missing or malformed, the application refuses to start immediately.

Prisma CLI commands run from the repository root and load `.env`. Docker Compose is invoked with `--env-file .env` and requires `MYSQL_ROOT_PASSWORD` and `MYSQL_DATABASE` when constructing container connection strings. `.env.example` contains local sample values, including JWT secrets; replace the secrets for any shared or deployed environment.

Phase 2 replaces the incomplete historical migration chain with one baseline. The baseline now also removes duplicated match player/status columns; participants live in `match_participants`. This repo has no production migration compatibility requirement, and the user approved resetting its dev database. Do not apply this baseline to a database with data that must be retained; it does not backfill old testcase, submission, or match rows.

### Setup and daily development
```bash
cp .env.example .env
npm install
npm run dev
```

`npm run dev` starts MySQL, Redis, and Judge0 in Docker, prepares Prisma and shared packages, applies database migrations, then runs the web, API, and judge-worker workspaces locally with Turbo. Use `npm run infra:down` to stop the infrastructure containers while keeping their named data volumes.

---

## 4. Database & Seed Operations

- **Prepare the local database and shared packages**:
  ```bash
  npm run db:setup
  ```
- **Generate Prisma Client**:
  ```bash
  npm run db:generate
  ```
- **Deploy migrations to MySQL**:
  ```bash
  npm run db:migrate
  ```
- **Stop local infrastructure while preserving database data**:
  ```bash
  npm run infra:down
  ```
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
Verifies route middleware ordering, socket authorization, and submission pinning without database access.

### Integration Tests (Requires MySQL on localhost:3307)
```bash
npm --workspace api run test:integration
```
The API integration tests check testcase version pinning, Redis-backed matchmaking, match-bound submission authorization, winner/ELO races, accepted-submission reconciliation, and cross-instance Socket.IO delivery. Start MySQL and Redis before running them.

The worker lookup test uses the same database:
```bash
npm --workspace judge-worker run test:integration
```

Sandbox unit and live integration tests:
```bash
node node_modules/tsx/dist/cli.mjs --test packages/executor/src/index.test.ts
# With the hybrid profile's localhost proxy running:
JUDGE0_URL=http://127.0.0.1:2358 node node_modules/tsx/dist/cli.mjs --test packages/executor/src/judge0.integration.test.ts
# PowerShell, direct checks from inside the private Judge0 container:
./scripts/security/test-judge0-security.ps1
```
The live checks cover AC, WA, CE, RE, CPU/wall TLE, a C++ allocation that maps to MLE, network denial, process/thread limit, and output/file bounds. Judge0 1.13.0 on Docker Desktop requires per process/thread time and memory limits; the total memory of all processes combined is not proven to stay under the configured per-process value.

`npm test` also runs the worker integration test through Turbo. Start the disposable dev MySQL database and deploy migrations before running the full suite.
The web workspace currently has no test files; its Vitest script exits successfully while still running any tests added later.

The Backend HTTP Service Docker image currently runs `prisma migrate deploy` before starting the server. A production deployment flow with a dedicated one-off migration step is planned separately.

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
| **MySQL Database** | `localhost:3307` |
| **Redis** | `localhost:6379` |
| **Judge0 Sandbox** | `http://localhost:2358` with the `hybrid` profile only |

### Phase 3 ZIP import smoke test

Sign in as an administrator and send a ZIP with `manifest.json` and paired `cases/*.in`/`cases/*.out` files as the single `archive` multipart field to `POST /api/v1/problems/:problemId/testcase-sets/import`. See [testcase-ingestion.md](testcase-ingestion.md) for the schema and limits. The Backend HTTP Service writes the upload to temporary disk and removes it after the response. The Judge Worker uses each submission's pinned set; the Web Frontend needs no change for this backend verification.
