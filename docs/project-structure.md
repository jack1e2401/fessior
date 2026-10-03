# Project Structure

The repository uses npm workspaces and Turborepo. Runtime code is owned by three apps; only two packages are shared.

```text
apps/
  api/                  Express, Prisma, BullMQ producer, Socket.io
    src/modules/        auth, problems, testcases, submissions, matches
    src/realtime/       matchmaking and socket handlers
    prisma/             schema and migration history
  judge-worker/         BullMQ consumer and Judge0 orchestration
    src/submissions/
    src/sandbox/
  web/                  React/Vite demo client, including its own UI and HTTP client
packages/
  contracts/            queue.ts, socket.ts, submission.ts and API data contracts
  executor/             Judge0 HTTP executor
infra/
  infra/docker-compose.yml
  judge0/judge0.env.example
docs/
```

The web app owns `src/lib/api`, `src/lib/utils.ts`, `src/lib/validators.ts`, and `src/components/shared`. API-specific errors, validation, and ELO logic live under `apps/api/src`. The old packages for these helpers have been removed from the workspace.

The move preserves existing Prisma migrations and runtime behavior. Scope reduction and backend hardening remain separate steps tracked in [AGENTS.md](../AGENTS.md).
