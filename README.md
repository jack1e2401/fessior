# Online Code Judge (OCJ)

OCJ is a TypeScript monorepo for an online judge platform. The current refactor is narrowing it toward testcase ingestion, asynchronous judging, sandboxed execution, and realtime 1v1 matches.

## Core Features

1. **Authentication & sessions**: register, login, refresh token, logout, revoke sessions, password reset.
2. **Problems & testcases**: CRUD problems, tags, starter code, time/memory limits, hidden/example testcases.
3. **Submissions & worker judging**: API stores submissions in MySQL, pushes jobs to BullMQ, and judge-worker evaluates code.
4. **Realtime matches**: Socket.io 1v1 matchmaking, match status updates, and ELO updates.

## Tech Stack

- **Monorepo**: npm workspaces + Turborepo
- **Frontend**: React, Vite, Monaco Editor, Socket.io Client
- **API**: Node.js, Express, TypeScript, Prisma
- **Database**: MySQL only
- **Queue/cache/realtime bridge**: Redis, BullMQ, Redis Pub/Sub
- **Worker**: BullMQ worker + `@ocj/executor` / Judge0-compatible execution
- **Realtime**: Socket.io

## Quick Start

```bash
npm install
npm run dev
```

`npm run dev` starts infrastructure with Docker Compose, generates Prisma Client, pushes the Prisma schema to MySQL, builds shared packages, then runs web, API, and judge-worker locally.

## Repository Layout

```text
apps/api/           Express API, Prisma, realtime 1v1
apps/judge-worker/  BullMQ worker and sandbox orchestration
apps/web/           React demo client and app-local UI/HTTP helpers
packages/contracts/ Queue, socket, submission and API contracts
packages/executor/  Judge0 client
infra/              Docker Compose and Judge0 example configuration
docs/               Architecture and flow documentation
```

The ZIP import, idempotent judging, sandbox hardening, and Redis-backed matchmaking remain future work tracked in [AGENTS.md](AGENTS.md).

Useful scripts:

```bash
npm run dev          # same as dev:hybrid
npm run dev:hybrid   # MySQL + Redis in Docker, apps local
npm run dev:docker   # everything in Docker
npm run dev:prepare  # generate Prisma, db push, build shared packages
npm run seed         # optional local seed data
```

Default local URLs:

- Frontend: `http://localhost:5173`
- API: `http://localhost:6868`
- Swagger: `http://localhost:6868/api-docs`
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
    Worker->>MySQL: Load problem and testcases
    Worker->>Judge: Execute code
    Worker->>MySQL: Persist verdict
    Worker->>Redis: Publish submission update
    Redis->>Main: Pub/Sub update
    Main-->>User: Socket.io realtime event
```

## Docker

Hybrid infrastructure only:

```bash
docker compose -f infra/docker-compose.yml up -d --remove-orphans --wait --wait-timeout 120 mysql redis judge0-server judge0-workers
```

Full Docker stack:

```bash
npm run dev:docker
```

Stop:

```bash
docker compose -f infra/docker-compose.yml down
```
