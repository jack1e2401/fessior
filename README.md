# Fessior Online Judge

Online Judge backend with versioned testcase ingestion, asynchronous code judging, sandboxed untrusted-code execution, and realtime 1v1 matchmaking. Fessior is a TypeScript monorepo with a small web client for the demo.

## Core Features

1. **Authentication & sessions**: register, login, refresh token, logout, revoke sessions.
2. **Problems & testcases**: CRUD problems, starter code, time/memory limits, and versioned testcase sets with example flags.
3. **Submissions & worker judging**: API stores submissions in MySQL, pushes jobs to BullMQ, and judge-worker evaluates code.
4. **Realtime matches**: Socket.io 1v1 matchmaking, match status updates, and ELO updates.

## Tech Stack

- **Monorepo**: npm workspaces + Turborepo
- **Frontend**: React, Vite, Monaco Editor, Socket.io Client
- **API**: Node.js, Express, TypeScript, Prisma
- **Database**: MySQL only
- **Queue/cache/realtime bridge**: Redis, BullMQ, Redis Pub/Sub
- **Worker**: BullMQ worker + `@ocj/executor` / Judge0 execution
- **Realtime**: Socket.io

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
```

`npm run dev` starts infrastructure with Docker Compose, generates Prisma Client, deploys the baseline migration to MySQL, builds shared packages, then runs web, API, and judge-worker locally.

## Repository Layout

```text
apps/api/           Express API, Prisma, realtime 1v1
apps/judge-worker/  BullMQ entrypoint, config, submissions, sandbox orchestration
apps/web/           React demo client and app-local UI/HTTP helpers
packages/contracts/ Queue, socket, submission and API contracts
packages/executor/  Judge0 client
infra/              Docker Compose and Judge0 example configuration
docs/               Architecture and flow documentation
```

See [architecture](docs/architecture.md), [testcase ingestion](docs/testcase-ingestion.md), [judging](docs/judging-pipeline.md), [sandbox](docs/sandbox-security.md), and [realtime 1v1](docs/realtime-1v1.md) for the implemented flows and their limits.

Useful scripts:

```bash
npm run dev          # same as dev:hybrid
npm run dev:hybrid   # MySQL + Redis in Docker, apps local
npm run dev:docker   # everything in Docker
npm run dev:prepare  # generate Prisma, deploy migrations, build shared packages
npm run seed         # optional local seed data
```

Default local URLs:

- Frontend: `http://localhost:5173`
- API: `http://localhost:6868`
- Swagger UI: `http://localhost:6868/api-docs` (source: `apps/api/src/docs/openapi/`)
- MySQL: `localhost:3307`
- Redis: `localhost:6379`

## Runtime Flow

```mermaid
sequenceDiagram
    participant User
    participant Main as Main Service
    participant MySQL
    participant Redis
    participant Worker
    participant Judge as Judge0/Executor

    User->>Main: Submit code
    Main->>MySQL: Create submission PENDING
    Main->>Redis: Add BullMQ job
    Redis->>Worker: Deliver job
    Worker->>MySQL: Load problem and pinned testcase set
    Worker->>Judge: Execute code
    Worker->>MySQL: Persist verdict
    Worker->>Redis: Publish submission update
    Redis->>Main: Pub/Sub update
    Main-->>User: Socket.io realtime event
```

## Docker

Hybrid infrastructure only:

```bash
docker compose --env-file .env -f infra/docker-compose.yml up -d --remove-orphans --wait --wait-timeout 120 mysql redis judge0-server judge0-workers
```

Full Docker stack:

```bash
npm run dev:docker
```

Stop:

```bash
docker compose --env-file .env -f infra/docker-compose.yml down
```
