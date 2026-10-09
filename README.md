# Fessior Online Judge

Online Judge backend with versioned testcase ingestion, asynchronous code judging, sandboxed untrusted-code execution, and realtime 1v1 matchmaking. Fessior is a TypeScript monorepo with a small web client for the demo.

## Core Features

1. **Authentication**: register, login, refresh token, and logout.
2. **Problems & testcases**: CRUD problems, starter code, time/memory limits, and versioned testcase sets with example flags.
3. **Asynchronous judging**: API stores submissions in MySQL, queues ID-only BullMQ jobs, and Judge0 executes untrusted code in a sandbox.
4. **Realtime matches**: Socket.io 1v1 matchmaking, match status updates, and ELO updates.

## Tech Stack

- **Monorepo**: npm workspaces + Turborepo
- **Frontend**: React, Vite, Monaco Editor, Socket.io Client
- **Backend**: Node.js, Express, TypeScript, Prisma
- **Database**: MySQL only
- **Queue/cache/realtime bridge**: Redis, BullMQ, Redis Pub/Sub
- **Judge**: BullMQ worker + `@ocj/executor` / Judge0 execution
- **Realtime**: Socket.io

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
```

`npm run dev` starts MySQL, Redis, and Judge0 with Docker Compose, generates Prisma Client, applies migrations, builds shared packages, then runs frontend, backend, and judge locally. Use `npm run infra:down` to stop the infrastructure while keeping its data volumes.

## Repository Layout

```text
apps/backend/       Express API, Prisma, realtime 1v1
apps/judge/         BullMQ worker entrypoint and Judge0 orchestration
apps/frontend/      React demo client and app-local UI/HTTP helpers
packages/contracts/ Queue, socket, submission and API contracts
packages/executor/  Judge0 client
infra/              Docker Compose and Judge0 example configuration
docs/               Architecture and flow documentation
```

Start with [main features](docs/main-features.md) for the product overview and links to the technical flow guides. [Architecture](docs/architecture.md) describes the system structure.

Useful scripts:

```bash
npm run dev          # start Docker infrastructure and local apps
npm run db:setup     # generate Prisma, deploy migrations, build shared packages
npm run infra:down   # stop infrastructure, preserve data volumes
npm run seed         # optional local seed data
```

Default local URLs:

- Frontend: `http://localhost:5173`
- API: `http://localhost:6868`
- MySQL: `localhost:3307`
- Redis: `localhost:6379`

## Runtime Flow

```mermaid
sequenceDiagram
    participant User
    participant Backend
    participant MySQL
    participant Redis
    participant Worker
    participant Judge as Judge0/Executor

    User->>Main: Submit code
    Backend->>MySQL: Create submission PENDING
    Backend->>Redis: Add BullMQ job
    Redis->>Judge: Deliver job
    Judge->>MySQL: Load problem and pinned testcase set
    Judge->>Judge0: Execute code
    Judge->>MySQL: Persist verdict
    Judge->>Redis: Publish submission update
    Redis->>Backend: Pub/Sub update
    Backend-->>User: Socket.io realtime event
```

## Local development

The single supported development workflow keeps infrastructure in Docker and runs the three application workspaces locally, where file watching and debugging work directly against source code. Run `npm run dev`; it prepares the database and shared packages before starting the applications.
