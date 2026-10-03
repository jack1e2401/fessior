# Development Setup

This guide explains how to run OCJ locally.

## Requirements

- Node.js compatible with the root `packageManager` npm version.
- npm `10.9.2`.
- Docker and Docker Compose for MySQL, Redis, and the Judge0 sandbox.

## Install

Run from the repository root:

```bash
npm install
```

Then start the project:

```bash
npm run dev
```

`npm run dev` maps to `npm run dev:hybrid`.

## Environment

Docker Compose reads defaults from:

```text
.env.docker.example
```

Create `.env.docker` only when you want to override local secrets/config:

```bash
cp .env.docker.example .env.docker
```

Default local values are set in `apps/api/src/config/env.ts` and `apps/judge-worker/src/config/env.ts`:

```text
DATABASE_URL=mysql://root:ocj_root_secret@localhost:3307/ocj_main_db
REDIS_HOST=localhost
REDIS_PORT=6379
JUDGE0_URL=http://localhost:2358
```

Important env vars:

| Env | Purpose |
| --- | --- |
| `DATABASE_URL` | MySQL connection string for Prisma. |
| `REDIS_HOST` | Redis host. |
| `REDIS_PORT` | Redis port. |
| `JWT_ACCESS_SECRET` | Access token signing secret. |
| `JWT_REFRESH_SECRET` | Refresh token signing secret. |
| `JUDGE0_URL` | Required Judge0-compatible sandbox URL. Local hybrid defaults to `http://localhost:2358`; Docker services use `http://judge0-server:2358`. |
| `CLOUDINARY_*` | Optional avatar upload config. |

## Root Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Default hybrid dev flow. |
| `npm run dev:hybrid` | Starts MySQL + Redis + Judge0 in Docker, prepares DB/packages, then runs web/api/judge-worker locally. |
| `npm run dev:local` | Prepares DB/packages and runs local app dev servers. Use when MySQL/Redis are already running. |
| `npm run dev:prepare` | Runs Prisma generate, Prisma db push, and shared package builds. |
| `npm run dev:apps` | Runs web/api/judge-worker local dev servers only. |
| `npm run dev:docker` | Runs the full Docker Compose stack. |
| `npm run seed` | Seeds local MySQL with demo users/problems/testcases/submissions. |

## Infrastructure Only

```bash
docker compose -f infra/docker-compose.yml up -d --remove-orphans --wait --wait-timeout 120 mysql redis judge0-server judge0-workers
```

Default ports:

```text
MySQL: localhost:3307 -> container 3306
Redis: localhost:6379
Judge0: http://localhost:2358
```

## Prisma

From root:

```bash
npm run db:generate
npm run db:push
```

From `apps/api` if you provide your own env:

```bash
npm run db:generate
npm run db:push
```

Prisma schema:

```text
apps/api/prisma/schema.prisma
```

## Seed Data

After MySQL is running and schema has been pushed:

```bash
npm run seed
```

The seed script is local/dev only. It clears demo data and creates sample users, tags, problems, testcases, and submissions in MySQL.

## URLs

```text
Frontend: http://localhost:5173
API:      http://localhost:6868
Swagger:  http://localhost:6868/api-docs
MySQL:    localhost:3307
Redis:    localhost:6379
Judge0:   http://localhost:2358
```

## Build

```bash
npm run build
```

Build individual apps:

```bash
cd apps/api && npm run build
cd apps/judge-worker && npm run build
cd apps/web && npm run build
```
